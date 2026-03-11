import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePremium } from "@/hooks/usePremium";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { useStreamingDisplay } from "@/hooks/useStreamingDisplay";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useToast } from "@/hooks/use-toast";
import { ChatMode, getModeSystemPrompt } from "@/components/chat/ChatModeSelector";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isError?: boolean;
}

interface Preferences {
  language: "en" | "de";
  tone: "gentle" | "neutral" | "structured";
  addressForm: "du" | "sie";
  innerDialogue: boolean;
}

const getPreferences = (): Preferences => {
  try {
    const stored = localStorage.getItem("mindmate-preferences");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { language: "en", tone: "gentle", addressForm: "du", innerDialogue: false };
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useChatComposer(chatMode: ChatMode) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [isRestoringConversation, setIsRestoringConversation] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatMessageCountRef = useRef(0);
  const preferences = useRef<Preferences>(getPreferences());

  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const { logActivity } = useActivityLog();
  const { toast } = useToast();
  const {
    isPremium, canSendMessage, incrementMessageCount,
    messagesRemaining, dailyMessageLimit,
    canUseClarifyMode, canUsePatternMode, canUseSessionSummary,
  } = usePremium();

  const {
    conversationId, setConversationId,
    createConversation, saveMessage,
    updateConversationTitle, loadConversation,
  } = useChatPersistence();

  const streamingDisplay = useStreamingDisplay(setMessages);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort();
    streamingDisplay.abort();
  }, [streamingDisplay]);

  const streamChat = useCallback(async ({ messages: chatMsgs, onDelta, onDone, onError, signal }: {
    messages: { role: "user" | "assistant"; content: string }[];
    onDelta: (chunk: string) => void;
    onDone: (fullResponse: string) => void;
    onError: (error: string) => void;
    signal?: AbortSignal;
  }) => {
    try {
      const modePrompt = getModeSystemPrompt(chatMode, language as "en" | "de");

      let personalizationContext = "";
      try {
        const stored = localStorage.getItem("soulvay-personalization");
        if (stored) {
          const p = JSON.parse(stored);
          if (p.focusAreas?.length) {
            personalizationContext = `\nUser's focus areas: ${p.focusAreas.join(", ")}. Keep these in mind when responding.`;
          }
          if (p.personalGoal) {
            personalizationContext += `\nUser's personal goal: "${p.personalGoal}". Reference this gently when relevant.`;
          }
        }
      } catch {}

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Timeout after 30s to prevent hanging
      const timeoutId = setTimeout(() => signal?.aborted || controller?.abort?.(), 30000);
      const controller = signal ? undefined : new AbortController();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: chatMsgs,
          preferences: { ...preferences.current, modePrompt: modePrompt + personalizationContext },
        }),
        signal: signal || controller?.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          onError(t("error.rateLimitedBody"));
        } else {
          onError(errorData.error || t("error.serverBody"));
        }
        return;
      }

      if (!resp.body) { onError("No response."); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { onDelta(content); fullResponse += content; }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      onDone(fullResponse);
    } catch (error: any) {
      if (error.name === "AbortError") {
        // Check if this was our timeout (not user-initiated)
        if (!signal?.aborted) {
          onError(language === "de"
            ? "Die Antwort hat etwas länger gedauert als erwartet. Bitte versuche es noch einmal."
            : "The response took a bit longer than expected. Please try again.");
          return;
        }
        return;
      }
      if (import.meta.env.DEV) console.error("Stream error:", error);
      onError(t("chat.streamErrorBody"));
    }
  }, [chatMode, language, t]);

  const handleSend = useCallback(async (
    content: string,
    isSystemAction = false,
    overrideConvId?: string | null,
    onStreamDone?: (fullResponse: string, messageId: string, convId: string | null) => void,
  ) => {
    if (!content.trim() || isLoading) return;

    if (!navigator.onLine) {
      toast({ title: t("common.offline"), description: t("common.offlineBody"), variant: "destructive" });
      return;
    }

    if (!isSystemAction && !canSendMessage()) {
      return "upgrade_needed" as const;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: Message = { id: Date.now().toString(), content: content.trim(), role: "user", timestamp: new Date() };
    if (!isSystemAction) {
      setMessages((prev) => [...prev, userMessage]);
      incrementMessageCount();
      setLastUserMessage(content.trim());
      chatMessageCountRef.current += 1;
      if (chatMessageCountRef.current >= 3) {
        logActivity("chat_session");
      }
    }
    setInputValue("");
    setIsLoading(true);

    streamingDisplay.reset();
    setIsStreamingActive(true);

    let activeConvId = overrideConvId !== undefined ? overrideConvId : conversationId;
    if (!activeConvId && user) {
      activeConvId = await createConversation(chatMode);
    }

    if (activeConvId && !isSystemAction) {
      saveMessage(activeConvId, "user", content.trim());
    }

    if (chatMessageCountRef.current === 1 && activeConvId) {
      const title = content.trim().substring(0, 60);
      updateConversationTitle(activeConvId, title);
    }

    const chatMessages = [...messages, ...(isSystemAction ? [] : [userMessage])].map((m) => ({ role: m.role, content: m.content }));
    const messagesForAI = isSystemAction ? [...chatMessages, { role: "user" as const, content }] : chatMessages;

    const newMessageId = (Date.now() + 1).toString();

    await streamChat({
      messages: messagesForAI,
      signal: controller.signal,
      onDelta: (chunk) => { streamingDisplay.enqueueChunk(chunk); },
      onDone: async (fullResponse) => {
        await streamingDisplay.finalize();
        setIsStreamingActive(false);
        setIsLoading(false);
        abortControllerRef.current = null;

        if (activeConvId && fullResponse) {
          saveMessage(activeConvId, "assistant", fullResponse);
        }

        onStreamDone?.(fullResponse, newMessageId, activeConvId);
      },
      onError: (errorMsg) => {
        streamingDisplay.abort();
        setIsStreamingActive(false);
        setIsLoading(false);
        abortControllerRef.current = null;
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          content: errorMsg,
          role: "assistant",
          timestamp: new Date(),
          isError: true,
        }]);
      },
    });
  }, [isLoading, messages, streamingDisplay, canSendMessage, incrementMessageCount, t, isOnline, chatMode, conversationId, user, createConversation, saveMessage, updateConversationTitle, logActivity, toast, streamChat]);

  const handleRetry = useCallback((onStreamDone?: (fullResponse: string, messageId: string, convId: string | null) => void) => {
    setMessages(prev => prev.filter(m => !m.isError));
    if (lastUserMessage) handleSend(lastUserMessage, false, undefined, onStreamDone);
  }, [lastUserMessage, handleSend]);

  const handleContinue = useCallback((onStreamDone?: (fullResponse: string, messageId: string, convId: string | null) => void) => {
    setMessages(prev => prev.filter(m => !m.isError));
    handleSend(t("common.continue"), true, undefined, onStreamDone);
  }, [handleSend, t]);

  const restoreConversation = useCallback(async (convId: string) => {
    setIsRestoringConversation(true);
    setConversationId(convId);
    const msgs = await loadConversation(convId);
    if (msgs.length > 0) {
      setMessages(msgs.map(m => ({
        id: m.id,
        content: m.content,
        role: m.role as "user" | "assistant",
        timestamp: new Date(m.created_at),
      })));
      chatMessageCountRef.current = msgs.filter(m => m.role === "user").length;
    }
    setIsRestoringConversation(false);
  }, [setConversationId, loadConversation]);

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    chatMessageCountRef.current = 0;
  }, [setConversationId]);

  return {
    // State
    messages, setMessages,
    inputValue, setInputValue,
    isLoading, isStreamingActive,
    isRestoringConversation,
    conversationId,
    chatMessageCountRef,
    preferences,

    // Premium
    isPremium, canSendMessage,
    messagesRemaining, dailyMessageLimit,
    canUseClarifyMode, canUsePatternMode, canUseSessionSummary,

    // Actions
    handleSend,
    handleRetry,
    handleContinue,
    restoreConversation,
    startNewConversation,
    cleanup,
  };
}
