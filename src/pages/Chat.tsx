import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Phone, BookOpen, AlertTriangle, Volume2, VolumeX, Wind, Anchor, Lock, RefreshCw, Save, HelpCircle, Plus, History } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import { usePremium } from "@/hooks/usePremium";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { VoiceAvatar } from "@/components/chat/VoiceAvatar";
import { VoiceTranscriptConfirm } from "@/components/chat/VoiceTranscriptConfirm";
import { MessagePlayButton } from "@/components/chat/MessagePlayButton";
import { ChatModeSelector, ChatMode, getModeSystemPrompt } from "@/components/chat/ChatModeSelector";
import { ChatDisclaimer } from "@/components/chat/ChatDisclaimer";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { SaveToJournalDialog } from "@/components/chat/SaveToJournalDialog";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { MessageLimitIndicator } from "@/components/premium/MessageLimitIndicator";
import { useActivityLog } from "@/hooks/useActivityLog";
import { fullScreenWithNav } from "@/lib/safeArea";

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
    const stored = localStorage.getItem("mindmate-preferences");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { language: "en", tone: "gentle", addressForm: "du", innerDialogue: false };
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [showTranscriptConfirm, setShowTranscriptConfirm] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"messages" | "voice" | "features">("features");
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveDialogVariant, setSaveDialogVariant] = useState<"message" | "conversation" | "summary">("message");
  const [saveDialogDefaultTitle, setSaveDialogDefaultTitle] = useState("");
  const [saveDialogCallback, setSaveDialogCallback] = useState<((title: string) => void) | null>(null);
  const [isRestoringConversation, setIsRestoringConversation] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const stored = localStorage.getItem("mindmate-chat-mode");
    return (stored as ChatMode) || "talk";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Chat persistence
  const {
    conversationId,
    setConversationId,
    createConversation,
    saveMessage,
    updateConversationTitle,
    loadConversation,
  } = useChatPersistence();

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

  useEffect(() => { localStorage.setItem("mindmate-chat-mode", chatMode); }, [chatMode]);

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

  const isUserAtBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 80;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isUserAtBottomRef.current = atBottom;
    setShowJumpToLatest(!atBottom);
  }, []);

  useEffect(() => {
    if (isUserAtBottomRef.current) {
      scrollToBottom(isLoading ? "auto" : "smooth");
    }
  }, [messages, isLoading, scrollToBottom]);

  // Initial greeting, restore from DB, or load specific conversation
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialMessage = localStorage.getItem('mindmate-initial-message') || location.state?.initialMessage;
    const resumeConvId = location.state?.conversationId;
    const savedLang = preferences.current.language || language;
    
    const getPersonalizedGreeting = (): string => {
      try {
        const stored = localStorage.getItem("soulvay-personalization");
        if (!stored) return "";
        const p = JSON.parse(stored);
        const focus = (p.focusAreas || [])[0];
        if (!focus) return "";
        
        const greetings: Record<string, { en: string; de: string }> = {
          stress: { en: "I noticed you'd like to work on stress.\nI'm here whenever things feel heavy.", de: "Ich habe gesehen, dass Stress dich beschäftigt.\nIch bin hier, wenn es sich schwer anfühlt." },
          anxiety: { en: "Anxiety can feel overwhelming.\nLet's take it one step at a time, together.", de: "Angst kann überwältigend sein.\nLass uns das gemeinsam angehen, Schritt für Schritt." },
          sleep: { en: "Better sleep starts with a calmer mind.\nI'm here to help you unwind.", de: "Besserer Schlaf beginnt mit einem ruhigeren Geist.\nIch bin hier, um dir beim Abschalten zu helfen." },
          relationships: { en: "Relationships shape how we feel.\nLet's explore what's on your mind.", de: "Beziehungen prägen, wie wir uns fühlen.\nLass uns erkunden, was dich beschäftigt." },
          selfworth: { en: "You're already taking a brave step.\nLet's discover your strengths together.", de: "Du machst schon einen mutigen Schritt.\nLass uns gemeinsam deine Stärken entdecken." },
          motivation: { en: "Finding motivation starts with understanding yourself.\nI'm here to help you explore.", de: "Motivation zu finden beginnt damit, sich selbst zu verstehen.\nIch bin hier, um dir dabei zu helfen." },
          grief: { en: "Grief has its own pace.\nI'm here to listen, whenever you're ready.", de: "Trauer hat ihr eigenes Tempo.\nIch bin hier, um zuzuhören, wann immer du bereit bist." },
        };
        
        return greetings[focus]?.[savedLang as "en" | "de"] || "";
      } catch { return ""; }
    };

    const init = async () => {
      // Resume a specific conversation from history
      if (resumeConvId) {
        setIsRestoringConversation(true);
        setConversationId(resumeConvId);
        const msgs = await loadConversation(resumeConvId);
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
        return;
      }

      if (initialMessage) {
        localStorage.removeItem('mindmate-initial-message');
        // Create new conversation for this message
        const convId = await createConversation(chatMode);
        handleSend(initialMessage, false, convId);
      } else {
        // Show greeting for new conversation
        const personalLine = getPersonalizedGreeting();
        const baseGreeting = savedLang === "de"
          ? "Hallo. Ich bin Soulvay und\nhöre dir gerne zu."
          : "Hello. I'm Soulvay, and\nI'm here to listen.";
        const closingLine = savedLang === "de"
          ? "Nimm dir Zeit – teile, was dich bewegt."
          : "Take your time – share what's on your mind.";
        
        const staticGreeting = personalLine
          ? `${baseGreeting}\n\n${personalLine}`
          : `${baseGreeting}\n\n${closingLine}`;
        
        setMessages([{ id: "greeting", content: staticGreeting, role: "assistant", timestamp: new Date() }]);
        
        if (canUseVoice && voiceSettings.autoPlayReplies && !isListening) {
          const voiceId = getVoiceId(savedLang as "en" | "de");
          const effectiveLang = getEffectiveLanguage(savedLang as "en" | "de");
          speakTTS(staticGreeting.replace(/\n/g, ' '), voiceId, effectiveLang, voiceSettings.speed, "greeting");
        }
      }
    };
    init();
  }, []);

  const handleError = (error: string) => {
    toast({ title: t("chat.connectionIssue"), description: error, variant: "destructive" });
    setIsLoading(false);
  };

  const upsertAssistant = useCallback((nextChunk: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && !last.isError) {
        const newLast = { ...last, content: last.content + nextChunk };
        const next = prev.slice(0, -1);
        next.push(newLast);
        return next;
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

  const streamChat = async ({ messages: chatMsgs, onDelta, onDone, onError, signal }: {
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
      if (error.name === "AbortError") return;
      if (import.meta.env.DEV) console.error("Stream error:", error);
      onError(t("chat.streamErrorBody"));
    }
  };

  const handleSend = useCallback(async (content: string, isSystemAction = false, overrideConvId?: string | null) => {
    if (!content.trim() || isLoading) return;

    if (!navigator.onLine) {
      toast({ title: t("common.offline"), description: t("common.offlineBody"), variant: "destructive" });
      return;
    }

    if (!isSystemAction && !canSendMessage()) {
      setUpgradeReason("messages"); setShowUpgradePrompt(true); return;
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
    setPendingTranscript("");
    setShowTranscriptConfirm(false);
    setIsLoading(true);

    streamChunkBufferRef.current = "";
    if (streamFlushFrameRef.current !== null) {
      cancelAnimationFrame(streamFlushFrameRef.current);
      streamFlushFrameRef.current = null;
    }

    // Ensure conversation exists for persistence
    let activeConvId = overrideConvId !== undefined ? overrideConvId : conversationId;
    if (!activeConvId && user) {
      activeConvId = await createConversation(chatMode);
    }

    // Save user message to DB
    if (activeConvId && !isSystemAction) {
      saveMessage(activeConvId, "user", content.trim());
    }

    // Generate title after first user message
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
      onDelta: (chunk) => { enqueueAssistantChunk(chunk); },
      onDone: (fullResponse) => {
        if (streamFlushFrameRef.current !== null) {
          cancelAnimationFrame(streamFlushFrameRef.current);
          streamFlushFrameRef.current = null;
        }
        flushBufferedAssistant();
        setIsLoading(false);
        abortControllerRef.current = null;

        // Save assistant response to DB
        if (activeConvId && fullResponse) {
          saveMessage(activeConvId, "assistant", fullResponse);
        }

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
  }, [isLoading, messages, voiceModeEnabled, voiceSettings, getVoiceId, getEffectiveLanguage, language, speakTTS, upsertAssistant, enqueueAssistantChunk, flushBufferedAssistant, canSendMessage, incrementMessageCount, canUseVoice, t, isOnline, chatMode, conversationId, user, createConversation, saveMessage, updateConversationTitle]);

  const handleRetry = () => {
    setMessages(prev => prev.filter(m => !m.isError));
    if (lastUserMessage) handleSend(lastUserMessage);
  };

  const handleContinue = () => {
    setMessages(prev => prev.filter(m => !m.isError));
    handleSend(t("common.continue"), true);
  };

  const handleTranscriptSend = () => { if (inputValue.trim()) handleSend(inputValue.trim()); };
  const handleTranscriptEdit = () => { setShowTranscriptConfirm(false); };
  const handleTranscriptCancel = () => { setShowTranscriptConfirm(false); setInputValue(""); setPendingTranscript(""); resetTranscript(); };

  const playMessage = (message: Message) => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
    const voiceId = getVoiceId(language as "en" | "de");
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    speakTTS(message.content, voiceId, effectiveLang, voiceSettings.speed, message.id);
  };

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
    localStorage.setItem("mindmate-chat-messages", JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));
    navigate("/summary", { state: { messages: messages.map(m => ({ role: m.role, content: m.content })) } });
  };

  const handleCalmExercise = (exerciseId: string) => { navigate("/toolbox", { state: { startExercise: exerciseId } }); };

  const handleUpgrade = () => { setShowUpgradePrompt(false); navigate("/upgrade"); };

  const handleNewConversation = () => {
    // Trigger background intelligence for the ended conversation
    const userMsgCount = messages.filter(m => m.role === "user" && !m.isError).length;
    if (user && userMsgCount >= 4) {
      const conversationContent = messages.filter(m => !m.isError).map(m => `${m.role}: ${m.content}`).join("\n\n");
      const chatMsgs = messages.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content }));
      
      supabase.auth.getSession().then(({ data: { session } }) => {
        const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY };
        
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-memories`, {
          method: "POST", headers,
          body: JSON.stringify({ content: conversationContent, source: "chat", language }),
        }).catch(() => {});

        if (userMsgCount >= 6) {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-insight`, {
            method: "POST", headers,
            body: JSON.stringify({ messages: chatMsgs, conversation_id: conversationId, language }),
          }).catch(() => {});
        }

        if (userMsgCount >= 8) {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-patterns`, {
            method: "POST", headers,
            body: JSON.stringify({ language }),
          }).catch(() => {});
        }
      });
    }

    // Reset everything for new conversation
    setConversationId(null);
    setMessages([]);
    chatMessageCountRef.current = 0;
    const savedLang = preferences.current.language || language;
    const baseGreeting = savedLang === "de"
      ? "Hallo. Ich bin Soulvay und\nhöre dir gerne zu.\n\nNimm dir Zeit – teile, was dich bewegt."
      : "Hello. I'm Soulvay, and\nI'm here to listen.\n\nTake your time – share what's on your mind.";
    setMessages([{ id: "greeting-" + Date.now(), content: baseGreeting, role: "assistant", timestamp: new Date() }]);
  };

  return (
    <div 
      className="flex flex-col bg-background"
      style={fullScreenWithNav()}
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
                    onClick={(e) => { e.stopPropagation(); navigate("/chat-history"); }} 
                    className="text-muted-foreground shrink-0"
                    aria-label={t("chat.conversationHistory")}
                  >
                    <History className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {t("chat.conversationHistory")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" size="icon" 
                    onClick={(e) => { e.stopPropagation(); handleNewConversation(); }} 
                    className="text-muted-foreground shrink-0"
                    aria-label={t("chat.newConversation")}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {t("chat.newConversation")}
                </TooltipContent>
              </Tooltip>
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

      {!isPremium && (
        <div className="shrink-0 px-4 py-2">
          <UpgradePrompt reason="general" variant="banner" onUpgrade={() => navigate("/upgrade")} />
        </div>
      )}

      {/* Voice Avatar */}
      <AnimatePresence>
        {voiceModeEnabled && canUseVoice && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-b border-border/30 overflow-hidden bg-gradient-to-b from-background to-muted/20">
            <div className="flex flex-col items-center py-8">
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
      <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4" style={{ WebkitOverflowScrolling: 'touch', contain: 'layout style' }}>
        <div className="max-w-lg mx-auto space-y-3">
          {isRestoringConversation ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.isError ? (
                  <div className="max-w-[88%] px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/20 rounded-bl-lg">
                    <p className="text-sm text-destructive mb-2">{message.content}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        {t("chat.retryMessage")}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleContinue}>
                        {t("chat.continueMessage")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={`relative max-w-[88%] px-4 py-3 rounded-2xl ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-lg" 
                      : "bg-card border border-border/50 text-foreground rounded-bl-lg shadow-soft"
                  }`}>
                    <ChatMessageContent
                      content={message.content}
                      isUser={message.role === "user"}
                      isStreaming={isLoading && message.role === "assistant" && message === messages[messages.length - 1]}
                    />
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MessagePlayButton isPlaying={isPlayingMessage(message.id)} isLoading={isLoadingMessage(message.id)} onPlay={() => playMessage(message)} onStop={stopTTS} isPremium={canUseVoice} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) return;
                            const msgContent = message.content;
                            setSaveDialogVariant("message");
                            setSaveDialogDefaultTitle(t("chat.chatMessage"));
                            setSaveDialogCallback(() => async (title: string) => {
                              try {
                                await supabase.from("journal_entries").insert({
                                  user_id: user.id,
                                  user_session_id: user.id,
                                  content: msgContent,
                                  title: title || t("chat.journalTitle.message"),
                                  source: "chat",
                                  tags: ["chat"],
                                } as any);
                                toast({ title: t("chat.savedToJournal"), description: t("chat.messageSavedDesc") });
                              } catch {
                                toast({ title: t("common.error"), variant: "destructive" });
                              }
                            });
                            setSaveDialogOpen(true);
                          }}
                          className="p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center justify-center"
                          title={t("chat.saveMessage")}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

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

        {showJumpToLatest && messages.length > 5 && (
          <button
            onClick={() => { scrollToBottom("smooth"); isUserAtBottomRef.current = true; setShowJumpToLatest(false); }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-elevated text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            ↓ {t("chat.jumpToLatest")}
          </button>
        )}
      </div>

      {/* Calm Mode Exercises */}
      {chatMode === "calm" && messages.length > 0 && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg mx-auto flex gap-2">
            {calmExercises.map((ex) => (
              <Button key={ex.id} variant="outline" size="sm" className="flex-1 gap-2 min-h-[44px]" onClick={() => handleCalmExercise(ex.id)}>
                <ex.icon className="w-4 h-4" />{ex.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Replies */}
      {messages.length <= 2 && !isLoading && !isRestoringConversation && (
        <div className="shrink-0 px-4 pb-3 bg-background">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-muted-foreground text-center mb-3">{t("chat.howToStart")}</p>
            <div className="flex flex-col gap-2">
              {getQuickReplies().map((reply) => (
                <Button key={reply} variant="outline" onClick={() => handleSend(reply)} className="text-[14px] min-h-[48px] justify-start px-4 text-left">{reply}</Button>
              ))}
              <Button 
                variant="outline" 
                onClick={() => handleSend(t("home.appExploreQuestion"))} 
                className="text-[14px] min-h-[48px] justify-start px-4 text-left gap-2.5 text-muted-foreground border-dashed"
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                {t("home.appExploreQuestion")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {messages.length > 4 && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg mx-auto flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleSummary}>
              <BookOpen className="w-4 h-4" />
              {t("chat.summary")}
              {!canUseSessionSummary && <Lock className="w-3 h-3 ml-1" />}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              if (!user) return;
              setSaveDialogVariant("conversation");
              setSaveDialogDefaultTitle(t("chat.chatConversation"));
              setSaveDialogCallback(() => async (title: string) => {
                const chatContent = messages.filter(m => !m.isError).map(m => `${m.role === "user" ? "🧑" : "🤖"} ${m.content}`).join("\n\n");
                try {
                  await supabase.from("journal_entries").insert({
                    user_id: user.id, user_session_id: user.id,
                    content: chatContent,
                    title: title || t("chat.journalTitle.conversation"),
                    source: "chat", tags: ["chat"],
                  } as any);
                  toast({ title: t("chat.savedToJournal"), description: t("chat.chatSavedDesc") });
                } catch { toast({ title: t("common.error"), variant: "destructive" }); }
              });
              setSaveDialogOpen(true);
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
                  body: JSON.stringify({ messages: chatMsgs, language }),
                });
                if (!resp.ok) throw new Error("Failed");
                const summary = await resp.json();
                const structuredContent = [
                  `## ${t("chat.summarySection.summary")}`,
                  summary.summary || "",
                  "",
                  `### ${t("chat.summarySection.themes")}`,
                  ...(summary.emotionalThemes || []).map((th: string) => `• ${th}`),
                  "",
                  `### ${t("chat.summarySection.moodJourney")}`,
                  `${summary.moodProgression?.start || "💭"} → ${summary.moodProgression?.end || "🙂"} ${summary.moodProgression?.insight || ""}`,
                  "",
                  `### ${t("chat.summarySection.nextStep")}`,
                  summary.nextStep || "",
                ].join("\n");
                await supabase.from("journal_entries").insert({
                  user_id: user.id, user_session_id: user.id,
                  content: structuredContent,
                  title: t("chat.journalTitle.summary"),
                  source: "chat-summary", tags: ["chat", "summary"],
                } as any);
                toast({ title: t("chat.savedToJournal"), description: t("chat.summarySavedDesc") });
              } catch { toast({ title: t("common.error"), variant: "destructive" }); }
            }}>
              <BookOpen className="w-4 h-4" />
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
          <div className="max-w-lg mx-auto">
            <VoiceTranscriptConfirm transcript={inputValue} onSend={handleTranscriptSend} onEdit={handleTranscriptEdit} onCancel={handleTranscriptCancel} />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 border-t border-border/50 bg-background">
        <div className="px-4 py-2.5">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" size="icon" 
                    className={`shrink-0 h-9 w-9 rounded-full ${canUseVoice && voiceSettings.autoPlayReplies ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
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
                      size="icon" className="shrink-0 h-9 w-9 rounded-full relative"
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
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(inputValue); } }}
                placeholder={isListening && canUseVoice ? t("voice.listening") : t("chat.inputPlaceholder")}
                className="w-full h-11 bg-muted/30 border border-border/50 rounded-full px-4 pr-12 text-[15px] focus:outline-none focus:border-primary/40 focus:bg-background transition-colors"
                disabled={isLoading || (!canSendMessage() && !isPremium) || !isOnline}
              />
              <Button 
                size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8" 
                onClick={() => handleSend(inputValue)} 
                disabled={!inputValue.trim() || isLoading || (!canSendMessage() && !isPremium) || !isOnline}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SaveToJournalDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        defaultTitle={saveDialogDefaultTitle}
        variant={saveDialogVariant}
        onSave={(title) => {
          if (saveDialogCallback) saveDialogCallback(title);
        }}
      />
    </div>
  );
}
