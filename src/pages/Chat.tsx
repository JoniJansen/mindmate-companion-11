import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Phone, FileText, AlertTriangle, Volume2, VolumeX, Wind, Anchor, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import { usePremium } from "@/hooks/usePremium";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { VoiceAvatar } from "@/components/chat/VoiceAvatar";
import { AudioWaveform } from "@/components/chat/AudioWaveform";
import { VoiceTranscriptConfirm } from "@/components/chat/VoiceTranscriptConfirm";
import { MessagePlayButton } from "@/components/chat/MessagePlayButton";
import { ChatModeSelector, ChatMode, getModeSystemPrompt } from "@/components/chat/ChatModeSelector";
import { ChatDisclaimer } from "@/components/chat/ChatDisclaimer";

import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { MessageLimitIndicator } from "@/components/premium/MessageLimitIndicator";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
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
  const [showActions, setShowActions] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [showTranscriptConfirm, setShowTranscriptConfirm] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"messages" | "voice" | "features">("features");
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const stored = localStorage.getItem("mindmate-chat-mode");
    return (stored as ChatMode) || "talk";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const preferences = useRef<Preferences>(getPreferences());

  // Premium state
  const { 
    isPremium, 
    canUseVoice, 
    canSendMessage, 
    incrementMessageCount,
    messagesRemaining,
    dailyMessageLimit,
    canUseClarifyMode,
    canUsePatternMode,
    canUseSessionSummary,
  } = usePremium();

  // Voice settings
  const { 
    settings: voiceSettings, 
    getVoiceId, 
    getEffectiveLanguage,
    updateSetting 
  } = useVoiceSettings();

  // Swipe-back navigation disabled on Chat (main page)
  useSwipeBack({ enabled: false });

  const speechLang = language === "de" ? "de-DE" : "en-US";

  // ElevenLabs TTS - only initialize if premium
  const { 
    speak: speakTTS, 
    stop: stopTTS, 
    isSpeaking, 
    isPlayingMessage,
    isLoadingMessage 
  } = useElevenLabsTTS({
    onError: (error) => {
      toast({ 
        title: language === "de" ? "Sprachausgabe fehlgeschlagen" : "Voice playback failed", 
        description: error, 
        variant: "destructive" 
      });
    },
  });

  // Speech recognition (STT) - only enable for premium
  const { 
    isListening, 
    fullTranscript, 
    isSupported: isSpeechSupported, 
    startListening, 
    stopListening, 
    resetTranscript,
    error: sttError 
  } = useSpeechRecognition(speechLang, {
    continuous: true,
    onFinalTranscript: (transcript) => {
      if (transcript.trim() && canUseVoice) {
        setPendingTranscript(prev => (prev + " " + transcript).trim());
      }
    },
  });

  // Handle STT errors - use ref to prevent repeated toasts
  const hasShownMicErrorRef = useRef(false);
  useEffect(() => {
    if (sttError === "not-allowed" && !hasShownMicErrorRef.current) {
      hasShownMicErrorRef.current = true;
      toast({
        title: t("voice.micPermissionDenied"),
        description: t("voice.enableMic"),
        variant: "destructive",
      });
    } else if (!sttError) {
      hasShownMicErrorRef.current = false;
    }
  }, [sttError, t, toast]);

  // Persist chat mode
  useEffect(() => {
    localStorage.setItem("mindmate-chat-mode", chatMode);
  }, [chatMode]);

  // Auto-restart listening after AI finishes speaking in voice mode (premium only)
  useEffect(() => {
    if (!isSpeaking && voiceModeEnabled && isSpeechSupported && !isListening && !showTranscriptConfirm && canUseVoice) {
      const timeoutId = setTimeout(() => {
        resetTranscript();
        setPendingTranscript("");
        startListening();
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [isSpeaking, voiceModeEnabled, isSpeechSupported, isListening, showTranscriptConfirm, resetTranscript, startListening, canUseVoice]);

  // Stop listening when AI speaks
  useEffect(() => {
    if (isSpeaking && isListening) stopListening();
  }, [isSpeaking, isListening, stopListening]);

  // Show transcript confirmation when user stops speaking
  useEffect(() => {
    if (pendingTranscript && !isListening && voiceModeEnabled) {
      const timeoutId = setTimeout(() => {
        if (pendingTranscript.trim()) {
          setShowTranscriptConfirm(true);
          setInputValue(pendingTranscript);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingTranscript, isListening, voiceModeEnabled]);

  // Update input from transcript while listening
  useEffect(() => {
    if (fullTranscript && isListening) {
      setInputValue((pendingTranscript + " " + fullTranscript).trim());
    }
  }, [fullTranscript, isListening, pendingTranscript]);

  // Handle mode changes - gate premium modes
  const handleModeChange = (mode: ChatMode) => {
    if ((mode === "clarify" && !canUseClarifyMode) || (mode === "patterns" && !canUsePatternMode)) {
      setUpgradeReason("features");
      setShowUpgradePrompt(true);
      return;
    }
    setChatMode(mode);
  };

  // Mode-specific quick replies
  const getQuickReplies = (): string[] => {
    const replies: Record<ChatMode, { en: string[]; de: string[] }> = {
      talk: {
        en: ["I need someone to listen", "Something's been on my mind"],
        de: ["Ich brauche jemanden zum Zuhören", "Mich beschäftigt etwas"],
      },
      clarify: {
        en: ["Help me organize my thoughts", "I'm feeling confused about something"],
        de: ["Hilf mir meine Gedanken zu ordnen", "Ich bin verwirrt über etwas"],
      },
      calm: {
        en: ["I'm feeling anxious", "Help me relax"],
        de: ["Ich fühle mich ängstlich", "Hilf mir zu entspannen"],
      },
      patterns: {
        en: ["What patterns do you see in me?", "Help me understand myself better"],
        de: ["Welche Muster siehst du bei mir?", "Hilf mir mich besser zu verstehen"],
      },
    };
    return replies[chatMode][language as "en" | "de"] || replies[chatMode].en;
  };

  // Calm mode quick exercises - IDs must match exercise data
  const calmExercises = [
    { id: "breathing-60", label: language === "de" ? "60s Atmung" : "60s Breathing", icon: Wind },
    { id: "grounding-54321", label: language === "de" ? "5-4-3-2-1 Erdung" : "5-4-3-2-1 Grounding", icon: Anchor },
  ];

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Initial greeting - controlled static message for perfect text flow
  useEffect(() => {
    const initialMessage = localStorage.getItem('mindmate-initial-message') || location.state?.initialMessage;
    
    const init = async () => {
      if (initialMessage) {
        localStorage.removeItem('mindmate-initial-message');
        handleSend(initialMessage);
      } else {
        // Use a carefully crafted static greeting for optimal text flow
        const staticGreeting = language === "de"
          ? "Hallo. Ich bin MindMate und\nhöre dir gerne zu.\n\nNimm dir Zeit – teile, was dich bewegt."
          : "Hello. I'm MindMate, and\nI'm here to listen.\n\nTake your time – share what's on your mind.";
        
        setMessages([{
          id: "greeting",
          content: staticGreeting,
          role: "assistant",
          timestamp: new Date(),
        }]);
        
        // Auto-play greeting if enabled AND premium
        if (canUseVoice && voiceSettings.autoPlayReplies && !isListening) {
          const voiceId = getVoiceId(language as "en" | "de");
          const effectiveLang = getEffectiveLanguage(language as "en" | "de");
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
      if (last?.role === "assistant") {
        return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: m.content + nextChunk } : m);
      }
      return [...prev, { id: Date.now().toString(), content: nextChunk, role: "assistant", timestamp: new Date() }];
    });
  }, []);

  const streamChat = async ({ messages, onDelta, onDone, onError }: {
    messages: { role: "user" | "assistant"; content: string }[];
    onDelta: (chunk: string) => void;
    onDone: (fullResponse: string) => void;
    onError: (error: string) => void;
  }) => {
    try {
      const modePrompt = getModeSystemPrompt(chatMode, language as "en" | "de");
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages,
          preferences: { ...preferences.current, modePrompt },
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        onError(errorData.error || "Connection failed.");
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
            if (content) {
              onDelta(content);
              fullResponse += content;
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      onDone(fullResponse);
    } catch (error) {
      console.error("Stream error:", error);
      onError("Something went wrong.");
    }
  };

  const handleSend = useCallback(async (content: string, isSystemAction = false) => {
    if (!content.trim() || isLoading) return;

    // Check message limit for free users
    if (!isSystemAction && !canSendMessage()) {
      setUpgradeReason("messages");
      setShowUpgradePrompt(true);
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), content: content.trim(), role: "user", timestamp: new Date() };
    if (!isSystemAction) {
      setMessages((prev) => [...prev, userMessage]);
      incrementMessageCount(); // Increment message count for free users
    }
    setInputValue("");
    setPendingTranscript("");
    setShowTranscriptConfirm(false);
    setShowActions(false);
    setIsLoading(true);

    const chatMessages = [...messages, ...(isSystemAction ? [] : [userMessage])].map((m) => ({ role: m.role, content: m.content }));
    const messagesForAI = isSystemAction ? [...chatMessages, { role: "user" as const, content }] : chatMessages;

    const newMessageId = (Date.now() + 1).toString();
    
    await streamChat({
      messages: messagesForAI,
      onDelta: (chunk) => { upsertAssistant(chunk); },
      onDone: (fullResponse) => {
        setIsLoading(false);
        // Auto-play or play in voice mode (premium only, not if user is recording)
        if (canUseVoice && (voiceModeEnabled || voiceSettings.autoPlayReplies) && fullResponse && !isListening) {
          const voiceId = getVoiceId(language as "en" | "de");
          const effectiveLang = getEffectiveLanguage(language as "en" | "de");
          speakTTS(fullResponse, voiceId, effectiveLang, voiceSettings.speed, newMessageId);
        }
      },
      onError: handleError,
    });
  }, [isLoading, messages, voiceModeEnabled, voiceSettings, getVoiceId, getEffectiveLanguage, language, speakTTS, upsertAssistant, canSendMessage, incrementMessageCount, canUseVoice]);

  // Handle voice transcript confirmation
  const handleTranscriptSend = () => {
    if (inputValue.trim()) {
      handleSend(inputValue.trim());
    }
  };

  const handleTranscriptEdit = () => {
    setShowTranscriptConfirm(false);
    // Keep input value for editing
  };

  const handleTranscriptCancel = () => {
    setShowTranscriptConfirm(false);
    setInputValue("");
    setPendingTranscript("");
    resetTranscript();
  };

  // Play message audio (premium only)
  const playMessage = (message: Message) => {
    if (!canUseVoice) {
      setUpgradeReason("voice");
      setShowUpgradePrompt(true);
      return;
    }
    const voiceId = getVoiceId(language as "en" | "de");
    const effectiveLang = getEffectiveLanguage(language as "en" | "de");
    speakTTS(message.content, voiceId, effectiveLang, voiceSettings.speed, message.id);
  };

  // Toggle voice mode (premium only)
  const toggleVoiceMode = () => {
    if (!canUseVoice) {
      setUpgradeReason("voice");
      setShowUpgradePrompt(true);
      return;
    }
    if (!isSpeechSupported) {
      toast({
        title: t("voice.notSupported"),
        description: t("voice.tryChrome"),
        variant: "destructive",
      });
      return;
    }
    if (isSpeaking) stopTTS();
    if (isListening) stopListening();
    setVoiceModeEnabled(!voiceModeEnabled);
    setShowTranscriptConfirm(false);
    setPendingTranscript("");
    setInputValue("");
  };

  // Toggle recording (premium only)
  const toggleRecording = () => {
    if (!canUseVoice) {
      setUpgradeReason("voice");
      setShowUpgradePrompt(true);
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      // Stop TTS if playing to avoid overlap
      if (isSpeaking) stopTTS();
      resetTranscript();
      setPendingTranscript("");
      setInputValue("");
      setShowTranscriptConfirm(false);
      startListening();
    }
  };

  // Voice-send event listener
  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) handleSend(e.detail); };
    window.addEventListener('voice-send', handler as EventListener);
    return () => window.removeEventListener('voice-send', handler as EventListener);
  }, [handleSend]);

  const handleSummary = () => {
    if (!canUseSessionSummary) {
      setUpgradeReason("features");
      setShowUpgradePrompt(true);
      return;
    }
    localStorage.setItem("mindmate-chat-messages", JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));
    navigate("/summary", { state: { messages: messages.map(m => ({ role: m.role, content: m.content })) } });
  };

  const handleCalmExercise = (exerciseId: string) => {
    navigate("/toolbox", { state: { startExercise: exerciseId } });
  };

  const handleUpgrade = () => {
    setShowUpgradePrompt(false);
    navigate("/settings", { state: { scrollTo: "premium" } });
  };

  // Fixed bottom nav height - must match BottomNav
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
        // Safe area at top for status bar
        paddingTop: 'env(safe-area-inset-top, 0px)',
        // Reserve space for bottom nav + safe area
        paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`
      }}
    >
      
      <PageHeader
        title={t("chat.title")}
        subtitle={t("chat.subtitle")}
        showLogo
        showBack={false}
        rightElement={
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleVoiceMode} 
                    className={`relative ${voiceModeEnabled && canUseVoice ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {canUseVoice ? (
                      voiceModeEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />
                    ) : (
                      <>
                        <VolumeX className="w-5 h-5" />
                        <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {canUseVoice 
                    ? (voiceModeEnabled 
                        ? (language === "de" ? "Sprachmodus aktiv" : "Voice mode active") 
                        : (language === "de" ? "Sprachmodus starten" : "Start voice mode"))
                    : (language === "de" ? "Sprachgespräche – Plus" : "Voice conversations – Plus")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon" onClick={() => navigate("/safety")} className="text-destructive">
              <Phone className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      {/* Mode Selector */}
      <div className="px-4 md:px-6 lg:px-8 py-2.5 border-b border-border/30 bg-background/50">
        <ChatModeSelector 
          activeMode={chatMode} 
          onModeChange={handleModeChange}
          lockedModes={isPremium ? [] : ["clarify", "patterns"]}
        />
      </div>

      {/* Chat Disclaimer - shows once on first visit */}
      <ChatDisclaimer />

      {/* Message Limit Indicator - always visible for free users */}
      <MessageLimitIndicator 
        messagesRemaining={messagesRemaining}
        dailyLimit={dailyMessageLimit}
        isPremium={isPremium}
      />

      {/* Voice Avatar (premium only) */}
      <AnimatePresence>
        {voiceModeEnabled && canUseVoice && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }} 
            className="border-b border-border/30 overflow-hidden bg-gradient-to-b from-background to-muted/20"
          >
            <div className="flex flex-col items-center py-8">
              <VoiceAvatar 
                isSpeaking={isSpeaking} 
                isListening={isListening}
                avatarStyle={voiceSettings.avatarStyle || "orb"}
                size="lg"
                onTap={toggleRecording}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Prompt Modal */}
      <AnimatePresence>
        {showUpgradePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowUpgradePrompt(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <UpgradePrompt
                reason={upgradeReason}
                variant="modal"
                onUpgrade={handleUpgrade}
                onDismiss={() => setShowUpgradePrompt(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages - PRIMARY scroll container */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-lg mx-auto space-y-3">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`relative max-w-[88%] px-4 py-3 rounded-2xl ${
                message.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-lg" 
                  : "bg-card border border-border/50 text-foreground rounded-bl-lg shadow-soft"
              }`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                
                {/* Play button for assistant messages */}
                {message.role === "assistant" && (
                  <MessagePlayButton
                    isPlaying={isPlayingMessage(message.id)}
                    isLoading={isLoadingMessage(message.id)}
                    onPlay={() => playMessage(message)}
                    onStop={stopTTS}
                    isPremium={canUseVoice}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator - Skeleton instead of spinner for calm feel */}
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

      {/* Calm Mode Quick Exercises - stable, min touch targets */}
      {chatMode === "calm" && messages.length > 0 && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg mx-auto flex gap-2">
            {calmExercises.map((ex) => (
              <Button key={ex.id} variant="outline" size="sm" className="flex-1 gap-2 min-h-[44px]" onClick={() => handleCalmExercise(ex.id)}>
                <ex.icon className="w-4 h-4" />
                {ex.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Replies with transition prompt - stable, min touch targets */}
      {messages.length <= 2 && !isLoading && (
        <div className="shrink-0 px-4 pb-3 bg-background">
          <div className="max-w-lg mx-auto">
            {/* Transition prompt */}
            <p className="text-xs text-muted-foreground text-center mb-3">
              {language === "de" ? "Wie möchtest du starten?" : "How would you like to start?"}
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col gap-2">
              {getQuickReplies().map((reply) => (
                <Button 
                  key={reply} 
                  variant="outline" 
                  onClick={() => handleSend(reply)} 
                  className="text-[14px] min-h-[48px] justify-start px-4 text-left"
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - stable, no entrance animation */}
      {messages.length > 4 && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg mx-auto flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleSummary}>
              <FileText className="w-4 h-4" />
              {language === "de" ? "Zusammenfassung" : "Summary"}
              {!canUseSessionSummary && <Lock className="w-3 h-3 ml-1" />}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => navigate("/safety")}>
              <AlertTriangle className="w-4 h-4" />
              {language === "de" ? "Krisenhilfe" : "Crisis Help"}
            </Button>
          </div>
        </div>
      )}

      {/* Voice Transcript Confirmation (premium only) */}
      {showTranscriptConfirm && pendingTranscript && canUseVoice && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg mx-auto">
            <VoiceTranscriptConfirm
              transcript={inputValue}
              onSend={handleTranscriptSend}
              onEdit={handleTranscriptEdit}
              onCancel={handleTranscriptCancel}
            />
          </div>
        </div>
      )}

      {/* Input Area - FIXED at bottom, never scrolls */}
      <div className="shrink-0 border-t border-border/50 bg-background">
        <div className="px-4 py-2.5">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            {/* Auto-speak toggle (premium only) */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`shrink-0 h-9 w-9 rounded-full ${canUseVoice && voiceSettings.autoPlayReplies ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                    onClick={() => {
                      if (!canUseVoice) {
                        setUpgradeReason("voice");
                        setShowUpgradePrompt(true);
                        return;
                      }
                      updateSetting("autoPlayReplies", !voiceSettings.autoPlayReplies);
                    }}
                  >
                    {canUseVoice && voiceSettings.autoPlayReplies ? <Volume2 className="w-[18px] h-[18px]" /> : <VolumeX className="w-[18px] h-[18px]" />}
                    {!canUseVoice && <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {canUseVoice 
                    ? (voiceSettings.autoPlayReplies 
                        ? (language === "de" ? "KI spricht automatisch" : "AI speaks automatically") 
                        : (language === "de" ? "Nur Text" : "Text only"))
                    : (language === "de" ? "Sprachausgabe – Plus" : "Voice output – Plus")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Mic button (premium only) */}
            {isSpeechSupported && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={isListening && canUseVoice ? "destructive" : "outline"} 
                      size="icon" 
                      className={`shrink-0 h-9 w-9 rounded-full relative ${isListening && canUseVoice ? '' : ''}`}
                      onClick={toggleRecording}
                    >
                      {isListening && canUseVoice ? <MicOff className="w-[18px] h-[18px]" /> : <Mic className="w-[18px] h-[18px]" />}
                      {isListening && canUseVoice && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                      )}
                      {!canUseVoice && <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {canUseVoice 
                      ? (isListening 
                          ? (language === "de" ? "Aufnahme stoppen" : "Stop recording") 
                          : (language === "de" ? "Spracheingabe" : "Voice input"))
                      : (language === "de" ? "Spracheingabe – Plus" : "Voice input – Plus")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Text input with send button - stable layout */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === "Enter" && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSend(inputValue); 
                  } 
                }}
                placeholder={isListening && canUseVoice ? t("voice.listening") : (language === "de" ? "Schreib etwas..." : "Type something...")}
                className="w-full h-11 bg-muted/30 border border-border/50 rounded-full px-4 pr-12 text-[15px] focus:outline-none focus:border-primary/40 focus:bg-background transition-colors"
                disabled={isLoading || (!canSendMessage() && !isPremium)}
              />
              <Button 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8" 
                onClick={() => handleSend(inputValue)} 
                disabled={!inputValue.trim() || isLoading || !canSendMessage()}
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
