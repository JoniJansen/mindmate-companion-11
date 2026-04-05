import { useState, useRef, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Phone, FileText, AlertTriangle, Volume2, VolumeX, Wind, Anchor, Lock, RefreshCw, Save } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import { usePremium } from "@/hooks/usePremium";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { VoiceAvatar } from "@/components/chat/VoiceAvatar";
import { AudioWaveform } from "@/components/chat/AudioWaveform";
import { VoiceTranscriptConfirm } from "@/components/chat/VoiceTranscriptConfirm";
import { MessagePlayButton } from "@/components/chat/MessagePlayButton";
import { ChatModeSelector, ChatMode, getModeSystemPrompt } from "@/components/chat/ChatModeSelector";
import { ChatDisclaimer } from "@/components/chat/ChatDisclaimer";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { MessageLimitIndicator } from "@/components/premium/MessageLimitIndicator";
import { useActivityLog } from "@/hooks/useActivityLog";

interface Message {
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
    const stored = localStorage.getItem("soulvay-preferences") || localStorage.getItem("soulvay-preferences");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (localStorage.getItem("soulvay-preferences") === null) {
        localStorage.setItem("soulvay-preferences", JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {}
  return { language: "en", tone: "gentle", addressForm: "du", innerDialogue: false };
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ChatMessageItemProps {
  message: Message;
  failedUserMessage: string | null;
  onRetry: () => void;
  onContinue: () => void;
  isPlaying: boolean;
  isTTSLoading: boolean;
  onPlay: (message: Message) => void;
  onStop: () => void;
  canUseVoice: boolean;
  onSave: (message: Message) => void;
  saveTitle: string;
}

const ChatMessageItem = memo(function ChatMessageItem({
  message, failedUserMessage, onRetry, onContinue,
  isPlaying, isTTSLoading, onPlay, onStop, canUseVoice, onSave, saveTitle
}: ChatMessageItemProps) {
  return (
    <div className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {message.isError ? (
        <div className="max-w-[92%] px-4 py-3 rounded-[18px] bg-amber-50 border border-amber-200 text-amber-900" role="alert">
          <p className="text-sm font-medium mb-1">I'm sorry, I'm having trouble processing that right now.</p>
          <p className="text-xs text-foreground mb-2">If you feel upset, it's okay to pause and take a break; you can continue when ready.</p>
          <p className="text-sm text-amber-900 mb-2">{message.content}</p>
          {failedUserMessage && (
            <p className="text-xs text-muted-foreground mb-2">{`Failed text: "${failedUserMessage}"`}</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
            <Button variant="ghost" size="sm" onClick={onContinue}>
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className={`relative max-w-[90%] px-4 py-3 rounded-[18px] ${
          message.role === "user"
            ? "bg-primary text-primary-foreground rounded-br-lg shadow-sm"
            : "bg-card border border-border/40 text-foreground rounded-bl-lg shadow-soft"
        }`}>
          <p className="text-base leading-6 whitespace-pre-wrap break-words">{message.content}</p>
          {message.role === "assistant" && (
            <div className="flex items-center gap-1 mt-1">
              <MessagePlayButton isPlaying={isPlaying} isLoading={isTTSLoading} onPlay={() => onPlay(message)} onStop={onStop} isPremium={canUseVoice} />
              <button
                onClick={() => onSave(message)}
                className="p-2.5 rounded-full hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={saveTitle}
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadHistoryFailed, setLoadHistoryFailed] = useState(false);
  const [failedUserMessage, setFailedUserMessage] = useState<string | null>(null);
  const [historyReloadTrigger, setHistoryReloadTrigger] = useState(0);
  const [showTrustIntro, setShowTrustIntro] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [showTranscriptConfirm, setShowTranscriptConfirm] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"messages" | "voice" | "features">("features");
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const stored = localStorage.getItem("soulvay-chat-mode") || localStorage.getItem("soulvay-chat-mode");
    if (stored && localStorage.getItem("soulvay-chat-mode") === null) {
      localStorage.setItem("soulvay-chat-mode", stored);
    }
    return (stored as ChatMode) || "talk";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const preferences = useRef<Preferences>(getPreferences());
  const { isOnline } = useNetworkStatus();
  const { logActivity } = useActivityLog();
  const chatMessageCountRef = useRef(0);
  const streamChunkBufferRef = useRef("");
  const streamFlushFrameRef = useRef<number | null>(null);
  const previousUserId = useRef<string | null>(null);
  const loadIdRef = useRef<number>(0);

  const sessionId = useRef<string>(
    localStorage.getItem("soulvay-chat-session-id")
    || localStorage.getItem("soulvay-chat-session-id")
    || (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
  );

  useEffect(() => {
    if (!localStorage.getItem("soulvay-chat-session-id")) {
      localStorage.setItem("soulvay-chat-session-id", sessionId.current);
    }
    if (localStorage.getItem("soulvay-chat-session-id")) {
      localStorage.removeItem("soulvay-chat-session-id");
    }
  }, []);

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    if (!currentUserId) {
      // Logout or unauthenticated state: clear all chat session data.
      sessionId.current = "";
      localStorage.removeItem("soulvay-chat-session-id");
      localStorage.removeItem("soulvay-chat-session-id");
      setMessages([]);
      localStorage.removeItem("soulvay-chat-messages");
      localStorage.removeItem("soulvay-chat-messages");
      loadIdRef.current += 1; // invalidate in-flight loads
      previousUserId.current = null;
      return;
    }

    if (previousUserId.current && previousUserId.current !== currentUserId) {
      // User changed - reset session
      const newSessionId = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      sessionId.current = newSessionId;
      localStorage.setItem("soulvay-chat-session-id", newSessionId);
      localStorage.removeItem("soulvay-chat-session-id");

      setMessages([]);
      localStorage.removeItem("soulvay-chat-messages");
      localStorage.removeItem("soulvay-chat-messages");
      loadIdRef.current += 1; // invalidate previous loads
    }

    previousUserId.current = currentUserId;
  }, [user?.id]);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) return;

      setLoadHistoryFailed(false);
      const localLoadId = ++loadIdRef.current;
      const sessionKey = sessionId.current;

      const loadFromDb = async (query: any) => {
        const { data, error } = await query;
        if (error) {
          return { data: null, isError: true, error };
        }
        if (data && data.length > 0) {
          return { data, isError: false };
        }
        return { data: [], isError: false };
      };

      try {
        // primary: user+session
        let primaryResult = await loadFromDb(
          supabase
            .from('chat_messages')
            .select('role, content, created_at')
            .eq('user_id', user.id)
            .eq('session_id', sessionKey)
            .order('created_at', { ascending: true })
        );

        if (primaryResult.isError) {
          console.error('DB error loading user+session chat history:', primaryResult.error);
          setLoadHistoryFailed(true);
          return; // do not fallback to localStorage on DB error
        }

        let chatData = primaryResult.data && primaryResult.data.length > 0 ? primaryResult.data : null;

        // fallback: any user history if no session-specific history
        if (!chatData) {
          const fallbackResult = await loadFromDb(
            supabase
              .from('chat_messages')
              .select('role, content, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true })
          );

          if (fallbackResult.isError) {
            console.error('DB error loading user chat history:', fallbackResult.error);
            setLoadHistoryFailed(true);
            return; // do not fallback to localStorage on DB error
          }

          chatData = fallbackResult.data && fallbackResult.data.length > 0 ? fallbackResult.data : null;
        }

        if (chatData) {
          if (localLoadId !== loadIdRef.current) return;
          const loadedMessages: Message[] = chatData.map((msg, index) => ({
            id: `loaded-${index}`,
            content: msg.content,
            role: msg.role as 'user' | 'assistant',
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);

          // preserve existing localStorage only for fallback; clear as DB is authoritative
          localStorage.removeItem('soulvay-chat-messages');
          localStorage.removeItem('soulvay-chat-messages');
          return;
        }

        // no DB history present: use localStorage fallback
        const storedMessages =
          localStorage.getItem('soulvay-chat-messages') ||
          localStorage.getItem('soulvay-chat-messages');

        if (storedMessages) {
          try {
            const parsed = JSON.parse(storedMessages) as Array<{ role: string; content: string }>; 
            const loadedMessages: Message[] = parsed
              .filter(m => m?.role && m?.content)
              .map((msg, index) => ({
                id: `fallback-${index}`,
                content: msg.content,
                role: msg.role as 'user' | 'assistant',
                timestamp: new Date(),
              }));

            if (loadedMessages.length > 0) {
              if (localLoadId !== loadIdRef.current) return;
              setMessages(loadedMessages);
              if (localStorage.getItem('soulvay-chat-messages')) {
                localStorage.setItem('soulvay-chat-messages', storedMessages);
                localStorage.removeItem('soulvay-chat-messages');
              }
            }
          } catch (de) {
            console.error('Failed to parse localStorage chat history:', de);
            localStorage.removeItem('soulvay-chat-messages');
            localStorage.removeItem('soulvay-chat-messages');
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setLoadHistoryFailed(true);
      }
    };

    loadChatHistory();
  }, [user, historyReloadTrigger]);

  // Premium state
  const { 
    isPremium, canUseVoice, canSendMessage, incrementMessageCount,
    messagesRemaining, dailyMessageLimit,
    canUseClarifyMode, canUsePatternMode, canUseSessionSummary,
  } = usePremium();

  // Voice settings
  const { settings: voiceSettings, getVoiceId, getEffectiveLanguage, updateSetting } = useVoiceSettings();

  useSwipeBack({ enabled: false });

  const speechLang = language === "de" ? "de-DE" : "en-US";

  const { speak: speakTTS, stop: stopTTS, isSpeaking, isPlayingMessage, isLoadingMessage } = useElevenLabsTTS({
    onError: (error) => {
      toast({ title: t("chat.voiceFailed"), description: error, variant: "destructive" });
    },
  });

  const { isListening, fullTranscript, isSupported: isSpeechSupported, startListening, stopListening, resetTranscript, error: sttError } = useSpeechRecognition(speechLang, {
    continuous: true,
    onFinalTranscript: (transcript) => {
      if (transcript.trim() && canUseVoice) {
        setPendingTranscript(prev => (prev + " " + transcript).trim());
      }
    },
  });

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (streamFlushFrameRef.current !== null) {
        cancelAnimationFrame(streamFlushFrameRef.current);
      }
      streamChunkBufferRef.current = "";
    };
  }, []);

  // Handle STT errors
  const hasShownMicErrorRef = useRef(false);
  useEffect(() => {
    if (sttError === "not-allowed" && !hasShownMicErrorRef.current) {
      hasShownMicErrorRef.current = true;
      toast({ title: t("voice.micPermissionDenied"), description: t("voice.enableMic"), variant: "destructive" });
    } else if (!sttError) {
      hasShownMicErrorRef.current = false;
    }
  }, [sttError, t, toast]);

  useEffect(() => {
    localStorage.setItem("soulvay-chat-mode", chatMode);
    localStorage.removeItem("soulvay-chat-mode");
  }, [chatMode]);

  // Auto-restart listening after AI finishes speaking
  useEffect(() => {
    if (!isSpeaking && voiceModeEnabled && isSpeechSupported && !isListening && !showTranscriptConfirm && canUseVoice) {
      const timeoutId = setTimeout(() => { resetTranscript(); setPendingTranscript(""); startListening(); }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [isSpeaking, voiceModeEnabled, isSpeechSupported, isListening, showTranscriptConfirm, resetTranscript, startListening, canUseVoice]);

  useEffect(() => { if (isSpeaking && isListening) stopListening(); }, [isSpeaking, isListening, stopListening]);

  useEffect(() => {
    if (pendingTranscript && !isListening && voiceModeEnabled) {
      const timeoutId = setTimeout(() => {
        if (pendingTranscript.trim()) { setShowTranscriptConfirm(true); setInputValue(pendingTranscript); }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingTranscript, isListening, voiceModeEnabled]);

  useEffect(() => {
    if (fullTranscript && isListening) { setInputValue((pendingTranscript + " " + fullTranscript).trim()); }
  }, [fullTranscript, isListening, pendingTranscript]);

  const handleModeChange = (mode: ChatMode) => {
    if ((mode === "clarify" && !canUseClarifyMode) || (mode === "patterns" && !canUsePatternMode)) {
      setUpgradeReason("features"); setShowUpgradePrompt(true); return;
    }
    setChatMode(mode);
  };

  const getQuickReplies = (): string[] => {
    const keyMap: Record<ChatMode, [string, string]> = {
      talk: ["chat.talk.reply1", "chat.talk.reply2"],
      clarify: ["chat.clarify.reply1", "chat.clarify.reply2"],
      calm: ["chat.calm.reply1", "chat.calm.reply2"],
      patterns: ["chat.patterns.reply1", "chat.patterns.reply2"],
    };
    return keyMap[chatMode].map(k => t(k));
  };

  const calmExercises = [
    { id: "breathing-60", label: t("chat.exercise.breathing"), icon: Wind },
    { id: "grounding-54321", label: t("chat.exercise.grounding"), icon: Anchor },
  ];

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleComposerFocus = useCallback(() => {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom(isLoading ? "auto" : "smooth");
  }, [messages, isLoading, scrollToBottom]);

  const handleError = (error: string) => {
    toast({ title: t("chat.connectionIssue"), description: error, variant: "destructive" });
    setIsLoading(false);
  };

  const upsertAssistant = useCallback((nextChunk: string) => {
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      const last = prev[lastIndex];

      if (last?.role === "assistant" && !last.isError) {
        const updated = [...prev];
        updated[lastIndex] = { ...last, content: last.content + nextChunk };
        return updated;
      }

      return [...prev, { id: Date.now().toString(), content: nextChunk, role: "assistant", timestamp: new Date() }];
    });
  }, []);

  const flushBufferedAssistant = useCallback(() => {
    if (!streamChunkBufferRef.current) return;
    upsertAssistant(streamChunkBufferRef.current);
    streamChunkBufferRef.current = "";
  }, [upsertAssistant]);

  const enqueueAssistantChunk = useCallback((chunk: string) => {
    if (!chunk) return;
    streamChunkBufferRef.current += chunk;

    if (streamFlushFrameRef.current !== null) return;

    streamFlushFrameRef.current = requestAnimationFrame(() => {
      streamFlushFrameRef.current = null;
      flushBufferedAssistant();
    });
  }, [flushBufferedAssistant]);

  const streamChat = async ({ messages, onDelta, onDone, onError, signal }: {
    messages: { role: "user" | "assistant"; content: string }[];
    onDelta: (chunk: string) => void;
    onDone: (fullResponse: string) => void;
    onError: (error: string) => void;
    signal?: AbortSignal;
  }) => {
    try {
      const modePrompt = getModeSystemPrompt(chatMode, language as "en" | "de");
      
      // Add personalization context if available
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
      
      // Get user session token for authenticated request
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
          messages,
          preferences: { ...preferences.current, modePrompt: modePrompt + personalizationContext },
          sessionId: sessionId.current,
        }),
        signal,
      });

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
      if (error.name === "AbortError") return; // Intentional abort
      console.error("Stream error:", error);
      onError(t("chat.streamErrorBody"));
    }
  };

  const handleSend = useCallback(async (content: string, isSystemAction = false) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) return;

    setFailedUserMessage(null);

    // Offline guard
    if (!navigator.onLine) {
      toast({ title: t("common.offline"), description: t("common.offlineBody"), variant: "destructive" });
      return;
    }

    if (!isSystemAction && !canSendMessage()) {
      setUpgradeReason("messages"); setShowUpgradePrompt(true); return;
    }

    // Abort previous stream
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: Message = { id: Date.now().toString(), content: content.trim(), role: "user", timestamp: new Date() };
    if (!isSystemAction) {
      setMessages((prev) => [...prev, userMessage]);
      incrementMessageCount();
      setLastUserMessage(content.trim());
      chatMessageCountRef.current += 1;
      // Log chat session activity after 3+ user messages
      if (chatMessageCountRef.current >= 3) {
        logActivity("chat_session");
      }
    }
    setInputValue("");
    setPendingTranscript("");
    setShowTranscriptConfirm(false);
    setShowActions(false);
    setIsLoading(true);

    streamChunkBufferRef.current = "";
    if (streamFlushFrameRef.current !== null) {
      cancelAnimationFrame(streamFlushFrameRef.current);
      streamFlushFrameRef.current = null;
    }

    const chatMessages = [...messages, ...(isSystemAction ? [] : [userMessage])].map((m) => ({ role: m.role, content: m.content }));
    const messagesForAI = isSystemAction ? [...chatMessages, { role: "user" as const, content }] : chatMessages;

    const newMessageId = (Date.now() + 1).toString();
    
    await streamChat({
      messages: messagesForAI,
      signal: controller.signal,
      onDelta: (chunk) => { enqueueAssistantChunk(chunk); },
      onDone: (fullResponse) => {
        if (streamFlushFrameRef.current !== null) {
          cancelAnimationFrame(streamFlushFrameRef.current);
          streamFlushFrameRef.current = null;
        }
        flushBufferedAssistant();
        setIsLoading(false);
        setFailedUserMessage(null);
        abortControllerRef.current = null;
        if (canUseVoice && (voiceModeEnabled || voiceSettings.autoPlayReplies) && fullResponse && !isListening) {
          const voiceId = getVoiceId(language as "en" | "de");
          const effectiveLang = getEffectiveLanguage(language as "en" | "de");
          speakTTS(fullResponse, voiceId, effectiveLang, voiceSettings.speed, newMessageId);
        }
      },
      onError: (errorMsg) => {
        if (streamFlushFrameRef.current !== null) {
          cancelAnimationFrame(streamFlushFrameRef.current);
          streamFlushFrameRef.current = null;
        }
        flushBufferedAssistant();
        setIsLoading(false);
        setFailedUserMessage(trimmedContent);
        abortControllerRef.current = null;
        // Add error message card
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          content: errorMsg,
          role: "assistant",
          timestamp: new Date(),
          isError: true,
        }]);
      },
    });
  }, [isLoading, messages, voiceModeEnabled, voiceSettings, getVoiceId, getEffectiveLanguage, language, speakTTS, upsertAssistant, enqueueAssistantChunk, flushBufferedAssistant, canSendMessage, incrementMessageCount, canUseVoice, t, isOnline]);

  const handleRetry = () => {
    // Remove the error message and retry last user message
    setMessages(prev => prev.filter(m => !m.isError));
    const textToRetry = failedUserMessage || lastUserMessage;
    if (!textToRetry) return;
    setFailedUserMessage(null);
    handleSend(textToRetry);
  };

  const handleContinue = () => {
    setMessages(prev => prev.filter(m => !m.isError));
    handleSend(t("common.continue"), true);
  };

  const handleTranscriptSend = () => { if (inputValue.trim()) handleSend(inputValue.trim()); };
  const handleTranscriptEdit = () => { setShowTranscriptConfirm(false); };
  const handleTranscriptCancel = () => { setShowTranscriptConfirm(false); setInputValue(""); setPendingTranscript(""); resetTranscript(); };

  const playMessage = useCallback((message: Message) => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
    const voiceId = getVoiceId(language as "en" | "de");
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    speakTTS(message.content, voiceId, effectiveLang, voiceSettings.speed, message.id);
  }, [canUseVoice, getVoiceId, getEffectiveLanguage, language, speakTTS, voiceSettings.speed]);

  const toggleVoiceMode = () => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
    if (!isSpeechSupported) { toast({ title: t("voice.notSupported"), description: t("voice.tryChrome"), variant: "destructive" }); return; }
    if (isSpeaking) stopTTS();
    if (isListening) stopListening();
    setVoiceModeEnabled(!voiceModeEnabled);
    setShowTranscriptConfirm(false); setPendingTranscript(""); setInputValue("");
  };

  const toggleRecording = () => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
    if (isListening) { stopListening(); } else {
      if (isSpeaking) stopTTS();
      resetTranscript(); setPendingTranscript(""); setInputValue(""); setShowTranscriptConfirm(false); startListening();
    }
  };

  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) handleSend(e.detail); };
    window.addEventListener('voice-send', handler as EventListener);
    return () => window.removeEventListener('voice-send', handler as EventListener);
  }, [handleSend]);

  const handleSummary = () => {
    if (!canUseSessionSummary) { setUpgradeReason("features"); setShowUpgradePrompt(true); return; }
    const chatMsgsPayload = messages.map(m => ({ role: m.role, content: m.content }));
    localStorage.setItem("soulvay-chat-messages", JSON.stringify(chatMsgsPayload));
    localStorage.removeItem("soulvay-chat-messages");
    navigate("/summary", { state: { messages: chatMsgsPayload } });
  };

  const handleCalmExercise = (exerciseId: string) => { navigate("/toolbox", { state: { startExercise: exerciseId } }); };

  const handleUpgrade = () => { setShowUpgradePrompt(false); navigate("/upgrade"); };

  const handleSaveMessage = useCallback(async (message: Message) => {
    if (!user) return;
    try {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        user_session_id: user.id,
        content: message.content,
        title: language === "de" ? "Chat-Nachricht" : "Chat Message",
        source: "chat",
        tags: ["chat"],
      } as any);
      toast({ title: t("chat.savedToJournal"), description: t("chat.messageSavedDesc") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  }, [user, language, t, toast]);

  const BOTTOM_NAV_HEIGHT = 56;
  
  return (
    <div 
      className="flex flex-col bg-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <PageHeader
        title={t("chat.title")}
        subtitle={t("chat.subtitle")}
        showLogo
        showBack={false}
        rightElement={
          <div className="flex items-center gap-2 -mr-1.5">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" size="icon" 
                    onClick={(e) => { e.stopPropagation(); toggleVoiceMode(); }} 
                    className={`relative shrink-0 ${voiceModeEnabled && canUseVoice ? "text-primary" : "text-muted-foreground"}`}
                    aria-label={voiceModeEnabled ? t("chat.voiceModeActive") : t("chat.startVoiceMode")}
                  >
                    {canUseVoice ? (
                      voiceModeEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />
                    ) : (
                      <><VolumeX className="w-5 h-5" /><Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" /></>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {canUseVoice 
                    ? (voiceModeEnabled ? t("chat.voiceModeActive") : t("chat.startVoiceMode"))
                    : t("chat.voiceConversationsPlus")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              variant="ghost" size="icon" 
              onClick={(e) => { e.stopPropagation(); navigate("/safety"); }} 
              className="text-destructive shrink-0"
              aria-label={t("chat.crisisResources")}
            >
              <Phone className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      <div className="shrink-0 min-w-0 px-4 md:px-6 lg:px-8 py-2 border-b border-border/30 bg-background/50">
        <ChatModeSelector activeMode={chatMode} onModeChange={handleModeChange} lockedModes={isPremium ? [] : ["clarify", "patterns"]} />
      </div>

      <ChatDisclaimer />
      <MessageLimitIndicator messagesRemaining={messagesRemaining} dailyLimit={dailyMessageLimit} isPremium={isPremium} />

      {/* Persistent upgrade banner for free users */}
      {!isPremium && (
        <div className="shrink-0 px-4 py-2">
          <UpgradePrompt reason="general" variant="banner" onUpgrade={() => navigate("/upgrade")} />
        </div>
      )}

      {/* Voice Avatar */}
      <AnimatePresence>
        {voiceModeEnabled && canUseVoice && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-b border-border/30 overflow-hidden bg-gradient-to-b from-background to-muted/20">
            <div className="flex flex-col items-center py-4 sm:py-8">
              <VoiceAvatar isSpeaking={isSpeaking} isListening={isListening} avatarStyle={voiceSettings.avatarStyle || "orb"} size="lg" onTap={toggleRecording} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Prompt */}
      <AnimatePresence>
        {showUpgradePrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowUpgradePrompt(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <UpgradePrompt reason={upgradeReason} variant="modal" onUpgrade={handleUpgrade} onDismiss={() => setShowUpgradePrompt(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4" style={{ WebkitOverflowScrolling: 'touch', contain: 'layout style', willChange: 'scroll-position' }}>
        <div className="max-w-lg md:max-w-2xl mx-auto space-y-3">
          {loadHistoryFailed && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-xl text-center">
              <p className="text-sm font-medium">Unable to load chat history</p>
              <p className="text-xs text-muted-foreground mt-1">Please check your connection and try again.</p>
              <p className="text-xs text-muted-foreground mt-2">If this is causing distress, know that you can step away and reach support resources when ready.</p>
              <div className="mt-3 flex justify-center">
                <Button size="sm" onClick={() => { setLoadHistoryFailed(false); setHistoryReloadTrigger((prev) => prev + 1); }}>
                  {t("chat.retry")}
                </Button>
              </div>
            </div>
          )}

          {showTrustIntro && !loadHistoryFailed && (
            <div className="bg-card border border-border/50 text-foreground p-3 rounded-2xl mb-3 max-w-[90%] mx-auto">
              <p className="text-sm leading-relaxed">
                Soulvay is here to listen and support you. I can offer guidance and calm reflection, but I am not a replacement for a licensed professional.
              </p>
              <div className="mt-2 flex justify-end">
                <Button size="xs" variant="ghost" onClick={() => setShowTrustIntro(false)}>
                  Got it
                </Button>
              </div>
            </div>
          )}

          {!loadHistoryFailed && messages.length === 0 && !isLoading && (
            <div className="border border-border/30 bg-muted/5 rounded-2xl p-5 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Start a conversation in a few words</p>
              <p>Ask Soulvay how you&#39;re feeling, what you want to work on, or just type anything on your mind.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => handleSend(getQuickReplies()[0])}>
                Try a prompt
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center">
              <div className="bg-card border border-border/30 px-3 py-2 rounded-full shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-muted-foreground">{t("chat.assistantThinking")}</span>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              failedUserMessage={failedUserMessage}
              onRetry={handleRetry}
              onContinue={handleContinue}
              isPlaying={isPlayingMessage(message.id)}
              isTTSLoading={isLoadingMessage(message.id)}
              onPlay={playMessage}
              onStop={stopTTS}
              canUseVoice={canUseVoice}
              onSave={handleSaveMessage}
              saveTitle={t("chat.saveMessage")}
            />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-lg shadow-soft">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Calm Mode Exercises */}
      {chatMode === "calm" && messages.length > 0 && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg md:max-w-2xl mx-auto flex gap-2">
            {calmExercises.map((ex) => (
              <Button key={ex.id} variant="outline" size="sm" className="flex-1 gap-2 min-h-[44px]" onClick={() => handleCalmExercise(ex.id)}>
                <ex.icon className="w-4 h-4" />{ex.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Replies */}
      {messages.length <= 2 && !isLoading && (
        <div className="shrink-0 px-4 pb-3 bg-background">
          <div className="max-w-lg md:max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground text-center mb-3">{t("chat.howToStart")}</p>
            <div className="flex flex-col gap-2">
              {getQuickReplies().map((reply) => (
                <Button key={reply} variant="outline" onClick={() => handleSend(reply)} className="text-[14px] min-h-[48px] justify-start px-4 text-left">{reply}</Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {messages.length > 4 && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg md:max-w-2xl mx-auto flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleSummary}>
              <FileText className="w-4 h-4" />
              {t("chat.summary")}
              {!canUseSessionSummary && <Lock className="w-3 h-3 ml-1" />}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
              if (!user) return;
              const chatContent = messages.filter(m => !m.isError).map(m => `${m.role === "user" ? "🧑" : "🤖"} ${m.content}`).join("\n\n");
              try {
                await supabase.from("journal_entries").insert({
                  user_id: user.id, user_session_id: user.id,
                  content: chatContent,
                  title: language === "de" ? "Chat-Gespräch" : "Chat Conversation",
                  source: "chat", tags: ["chat"],
                } as any);
                toast({ title: t("chat.savedToJournal"), description: t("chat.chatSavedDesc") });
              } catch { toast({ title: t("common.error"), variant: "destructive" }); }
            }}>
              <Save className="w-4 h-4" />
              {t("chat.saveChat")}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
              if (!user) return;
              toast({ title: t("chat.generatingSummary"), description: t("chat.pleaseWait") });
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
                const chatMsgs = messages.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content }));
                const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                  body: JSON.stringify({ messages: chatMsgs }),
                });
                if (!resp.ok) throw new Error("Failed");
                const summary = await resp.json();
                const structuredContent = [
                  `## ${language === "de" ? "Zusammenfassung" : "Summary"}`,
                  summary.summary || "",
                  "",
                  `### ${language === "de" ? "Themen" : "Themes"}`,
                  ...(summary.emotionalThemes || []).map((t: string) => `• ${t}`),
                  "",
                  `### ${language === "de" ? "Stimmungsverlauf" : "Mood Journey"}`,
                  `${summary.moodProgression?.start || "💭"} → ${summary.moodProgression?.end || "🙂"} ${summary.moodProgression?.insight || ""}`,
                  "",
                  `### ${language === "de" ? "Nächster Schritt" : "Next Step"}`,
                  summary.nextStep || "",
                ].join("\n");
                await supabase.from("journal_entries").insert({
                  user_id: user.id, user_session_id: user.id,
                  content: structuredContent,
                  title: language === "de" ? "KI-Zusammenfassung" : "AI Summary",
                  source: "chat-summary", tags: ["chat", "summary"],
                } as any);
                toast({ title: t("chat.savedToJournal"), description: t("chat.summarySavedDesc") });
              } catch { toast({ title: t("common.error"), variant: "destructive" }); }
            }}>
              <FileText className="w-4 h-4" />
              {t("chat.saveSummary")}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => navigate("/safety")}>
              <AlertTriangle className="w-4 h-4" />
              {t("chat.crisisHelp2")}
            </Button>
          </div>
        </div>
      )}

      {/* Voice Transcript */}
      {showTranscriptConfirm && pendingTranscript && canUseVoice && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg md:max-w-2xl mx-auto">
            <VoiceTranscriptConfirm transcript={inputValue} onSend={handleTranscriptSend} onEdit={handleTranscriptEdit} onCancel={handleTranscriptCancel} />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 border-t border-border/50 bg-background safe-bottom">
        <div className="px-3 sm:px-4 py-2 sm:py-2.5">
          <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" size="icon" 
                    className={`shrink-0 h-11 w-11 rounded-full ${canUseVoice && voiceSettings.autoPlayReplies ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                    onClick={() => {
                      if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
                      updateSetting("autoPlayReplies", !voiceSettings.autoPlayReplies);
                    }}
                  >
                    {canUseVoice && voiceSettings.autoPlayReplies ? <Volume2 className="w-[18px] h-[18px]" /> : <VolumeX className="w-[18px] h-[18px]" />}
                    {!canUseVoice && <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {canUseVoice 
                    ? (voiceSettings.autoPlayReplies ? t("chat.aiSpeaksAuto") : t("chat.textOnly"))
                    : t("chat.voiceOutputPlus")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isSpeechSupported && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={isListening && canUseVoice ? "destructive" : "outline"} 
                      size="icon" className="shrink-0 h-11 w-11 rounded-full relative"
                      onClick={toggleRecording}
                    >
                      {isListening && canUseVoice ? <MicOff className="w-[18px] h-[18px]" /> : <Mic className="w-[18px] h-[18px]" />}
                      {isListening && canUseVoice && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />}
                      {!canUseVoice && <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {canUseVoice 
                      ? (isListening ? t("chat.stopRecording") : t("chat.voiceInput"))
                      : t("chat.voiceInputPlus")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <div className="flex-1 relative">
              <textarea
                ref={composerRef}
                value={inputValue}
                rows={1}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  const ta = composerRef.current;
                  if (!ta) return;
                  ta.style.height = "auto";
                  ta.style.height = `${Math.min(180, ta.scrollHeight)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(inputValue);
                  }
                }}
                onFocus={handleComposerFocus}
                placeholder={isListening && canUseVoice ? t("voice.listening") : t("chat.inputPlaceholder")}
                className="w-full min-h-[44px] max-h-[136px] resize-none bg-muted/30 border border-border/50 rounded-2xl px-3 py-2 pr-12 text-[15px] focus:outline-none focus:border-primary/40 focus:bg-background transition-colors overflow-y-auto"
                disabled={isLoading || (!canSendMessage() && !isPremium) || !isOnline}
              />
              <Button 
                size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8" 
                onClick={() => handleSend(inputValue)} 
                disabled={!inputValue.trim() || isLoading || !canSendMessage() || !isOnline}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
