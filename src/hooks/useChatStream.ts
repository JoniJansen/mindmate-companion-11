import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { getModeSystemPrompt, ChatMode } from "@/components/chat/ChatModeSelector";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isError?: boolean;
}

interface StreamCallbacks {
  onDelta: (chunk: string) => void;
  onDone: (fullResponse: string) => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useChatStream() {
  const { t, language } = useTranslation();
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamChunkBufferRef = useRef("");
  const streamFlushFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort();
    if (streamFlushFrameRef.current !== null) {
      cancelAnimationFrame(streamFlushFrameRef.current);
    }
    streamChunkBufferRef.current = "";
  }, []);

  const upsertAssistant = useCallback((nextChunk: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && !last.isError) {
        const next = prev.slice(0, -1);
        next.push({ ...last, content: last.content + nextChunk });
        return next;
      }
      return [...prev, { id: Date.now().toString(), content: nextChunk, role: "assistant", timestamp: new Date() }];
    });
  }, []);

  const flushBuffer = useCallback((setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    if (!streamChunkBufferRef.current) return;
    upsertAssistant(streamChunkBufferRef.current, setMessages);
    streamChunkBufferRef.current = "";
  }, [upsertAssistant]);

  const enqueueChunk = useCallback((chunk: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    if (!chunk) return;
    streamChunkBufferRef.current += chunk;
    if (streamFlushFrameRef.current !== null) return;
    streamFlushFrameRef.current = requestAnimationFrame(() => {
      streamFlushFrameRef.current = null;
      flushBuffer(setMessages);
    });
  }, [flushBuffer]);

  const streamChat = useCallback(async (
    chatMessages: { role: "user" | "assistant"; content: string }[],
    chatMode: ChatMode,
    callbacks: StreamCallbacks
  ) => {
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

      const preferences = (() => {
        try {
          const stored = localStorage.getItem("mindmate-preferences");
          if (stored) return JSON.parse(stored);
        } catch {}
        return { language: "en", tone: "gentle", addressForm: "du", innerDialogue: false };
      })();

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: chatMessages,
          preferences: { ...preferences, modePrompt: modePrompt + personalizationContext },
        }),
        signal: callbacks.signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          callbacks.onError(t("error.rateLimitedBody"));
        } else {
          callbacks.onError(errorData.error || t("error.serverBody"));
        }
        return;
      }

      if (!resp.body) { callbacks.onError("No response."); return; }

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
            if (content) { callbacks.onDelta(content); fullResponse += content; }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      callbacks.onDone(fullResponse);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      if (import.meta.env.DEV) console.error("Stream error:", error);
      callbacks.onError(t("chat.streamErrorBody"));
    }
  }, [language, t]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const createController = useCallback(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return controller;
  }, []);

  const finalizeStream = useCallback((setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    if (streamFlushFrameRef.current !== null) {
      cancelAnimationFrame(streamFlushFrameRef.current);
      streamFlushFrameRef.current = null;
    }
    flushBuffer(setMessages);
    streamChunkBufferRef.current = "";
    abortControllerRef.current = null;
  }, [flushBuffer]);

  return {
    streamChat,
    enqueueChunk,
    finalizeStream,
    createController,
    abort,
    cleanup,
  };
}
