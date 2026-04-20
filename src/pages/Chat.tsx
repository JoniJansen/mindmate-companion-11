import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { analytics } from "@/hooks/useAnalytics";
import { consumeDemoConversation } from "@/lib/demoConfig";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Wind, Anchor, Lock, HelpCircle, Plus, History, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePremium } from "@/hooks/usePremium";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useChatComposer } from "@/hooks/useChatComposer";
import { useCompanion } from "@/hooks/useCompanion";
import { useChatVoice } from "@/hooks/useChatVoice";
import { useChatIntelligence } from "@/hooks/useChatIntelligence";
import { useChatSaveActions } from "@/hooks/useChatSaveActions";
import { VoiceConversationPanel } from "@/components/chat/VoiceConversationPanel";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { VoiceTranscriptConfirm } from "@/components/chat/VoiceTranscriptConfirm";
import { ChatModeSelector, ChatMode } from "@/components/chat/ChatModeSelector";
import { ChatDisclaimer } from "@/components/chat/ChatDisclaimer";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { ChatActionButtons } from "@/components/chat/ChatActionButtons";
import { SaveToJournalDialog } from "@/components/chat/SaveToJournalDialog";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { MessageLimitIndicator } from "@/components/premium/MessageLimitIndicator";
import { ChatVoiceTrialPrompt } from "@/components/premium/ChatVoiceTrialPrompt";
import { ChatLimitPrompt } from "@/components/premium/ChatLimitPrompt";
import { fullScreenWithNav } from "@/lib/safeArea";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { useCompanionVisualState } from "@/hooks/useCompanionVisualState";
import { RealtimeVoicePanel } from "@/components/chat/RealtimeVoicePanel";
import { useConversationalVoice } from "@/hooks/useConversationalVoice";
import { getCompanionAgentId, hasRealtimeAgent } from "@/data/companionAgentIds";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const { canUseVoice } = usePremium();

  useSwipeBack({ enabled: false });

  // Chat mode
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const stored = localStorage.getItem("soulvay-chat-mode");
    return (stored as ChatMode) || "talk";
  });
  useEffect(() => { localStorage.setItem("soulvay-chat-mode", chatMode); }, [chatMode]);

  // Upgrade prompt state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"messages" | "voice" | "features">("features");

  // Composer hook (messages, streaming, persistence)
  const composer = useChatComposer(chatMode);

  // Extracted hooks
  const { extractIntelligence } = useChatIntelligence();
  const saveActions = useChatSaveActions();

  // Companion
  const { companion } = useCompanion();
  const companionAvatarUrl = useAvatarUrl(companion?.avatar_url);

  // Voice hook (turn-based)
  const voice = useChatVoice(companion?.archetype, composer.isLoading || composer.isStreamingActive);

  // Real-time conversational voice (ElevenLabs Agent SDK)
  const agentId = companion ? getCompanionAgentId(companion.archetype) : undefined;
  const realtimeAvailable = companion ? hasRealtimeAgent(companion.archetype) : false;
  const realtimeVoice = useConversationalVoice({
    agentId,
    onError: (errorKey) => {
      const errorMessages: Record<string, { en: string; de: string }> = {
        mic_unsupported: {
          en: "Voice input is not available on this device.",
          de: "Spracheingabe ist auf diesem Gerät nicht verfügbar.",
        },
        mic_insecure_context: {
          en: "Voice requires a secure connection.",
          de: "Sprache erfordert eine sichere Verbindung.",
        },
        mic_permission_denied: {
          en: "Microphone access denied. Please enable it in Settings → Soulvay → Microphone.",
          de: "Mikrofonzugriff verweigert. Bitte aktiviere ihn unter Einstellungen → Soulvay → Mikrofon.",
        },
        mic_not_found: {
          en: "No microphone found. Please connect a microphone.",
          de: "Kein Mikrofon gefunden. Bitte schließe ein Mikrofon an.",
        },
        mic_in_use: {
          en: "Microphone is in use by another app or unavailable.",
          de: "Das Mikrofon wird von einer anderen App verwendet oder ist nicht verfügbar.",
        },
        voice_start_failed: {
          en: "Voice session could not be started. Please try again.",
          de: "Sprachsitzung konnte nicht gestartet werden. Bitte versuche es erneut.",
        },
        voice_auth_failed: {
          en: "Voice service temporarily unavailable. Please try again later.",
          de: "Sprachdienst vorübergehend nicht verfügbar. Bitte versuche es später erneut.",
        },
        voice_connection_failed: {
          en: "Voice connection failed. Please try again.",
          de: "Sprachverbindung fehlgeschlagen. Bitte versuche es erneut.",
        },
        voice_idle_timeout: {
          en: "Session ended — no activity detected.",
          de: "Sitzung beendet — keine Aktivität erkannt.",
        },
        voice_max_duration: {
          en: "Session ended — maximum duration reached.",
          de: "Sitzung beendet — maximale Dauer erreicht.",
        },
        voice_daily_limit: {
          en: "Daily session limit reached. Please try again tomorrow.",
          de: "Tageslimit erreicht. Bitte versuche es morgen erneut.",
        },
      };
      const lang = language === "de" ? "de" : "en";
      const entry = errorMessages[errorKey];
      const description = entry ? entry[lang] : errorKey;
      const title = lang === "de" ? "Sprachfehler" : "Voice error";
      toast({ title, description, variant: "destructive" });
    },
  });

  // Track if user is in real-time mode vs turn-based
  const [useRealtimeMode, setUseRealtimeMode] = useState(false);

  // Companion visual state for animated avatar
  const companionState = useCompanionVisualState({
    isListening: voice.isListening || (useRealtimeMode && realtimeVoice.phase === "listening"),
    isThinking: composer.isLoading && !composer.isStreamingActive,
    isSpeaking: voice.isSpeaking || composer.isStreamingActive || realtimeVoice.isSpeaking,
  });

  // Sync voice input → composer input
  useEffect(() => {
    if (voice.voiceInputValue) {
      composer.setInputValue(voice.voiceInputValue);
    }
  }, [voice.voiceInputValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { composer.cleanup(); };
  }, []);

  // Helper: resolve companion name from hook or localStorage fallback (memoized)
  const companionName = useMemo((): string => {
    if (companion?.name) return companion.name;
    try {
      const stored = localStorage.getItem("soulvay-personalization");
      if (stored) {
        const p = JSON.parse(stored);
        const archetypeId = p.companionId;
        if (archetypeId) {
          const archetypeNames: Record<string, string> = {
            mira: "Mira", noah: "Noah", elena: "Elena", kai: "Kai", lina: "Lina",
            theo: "Theo", ava: "Ava", jonas: "Jonas", sofia: "Sofia", arin: "Arin",
          };
          return archetypeNames[archetypeId] || "Soulvay";
        }
      }
    } catch {}
    return "Soulvay";
  }, [companion?.name]);

  // Initialize: greeting, restore conversation, or handle initial message
  const [initDone, setInitDone] = useState(false);
  useEffect(() => {
    if (initDone) return;
    setInitDone(true);

    const initialMessage = localStorage.getItem('soulvay-initial-message') || location.state?.initialMessage;
    const resumeConvId = location.state?.conversationId;
    const savedLang = composer.preferences.current.language || language;

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
      if (resumeConvId) {
        await composer.restoreConversation(resumeConvId);
        return;
      }

      // Check for demo conversation continuity (post-signup from landing page)
      const demoData = consumeDemoConversation();
      if (demoData && demoData.messages.length > 1) {
        // Inject demo messages into the real chat as existing context
        const injectedMessages = demoData.messages.map((m, i) => ({
          id: `demo-${i}-${Date.now()}`,
          content: m.content,
          role: m.role as "user" | "assistant",
          timestamp: new Date(),
        }));
        composer.setMessages(injectedMessages);
        composer.chatMessageCountRef.current = injectedMessages.filter(m => m.role === "user").length;

        // Send a seamless continuation prompt so the AI references demo context
        const lastUserMsg = [...demoData.messages].reverse().find(m => m.role === "user");
        const continuationPrompt = savedLang === "de"
          ? `[System: Der Nutzer hat gerade ein Konto erstellt, um dieses Gespräch fortzusetzen. Beziehe dich auf das, was bereits besprochen wurde. Reagiere nicht mit einer neuen Begrüßung – setze das Gespräch nahtlos fort. Gehe etwas tiefer als zuvor.]`
          : `[System: The user just signed up to continue this conversation. Reference what was already discussed. Do NOT send a new greeting – continue the conversation seamlessly. Go slightly deeper than before.]`;
        composer.handleSend(continuationPrompt, true, undefined, handleStreamDone);
        analytics.track("demo_conversation_continued", { demo_messages: demoData.messages.length });
        return;
      }

      if (initialMessage) {
        localStorage.removeItem('soulvay-initial-message');
        composer.handleSend(initialMessage, false, undefined, handleStreamDone);
      } else {
        const personalLine = getPersonalizedGreeting();
        const cName = companionName;
        const baseGreeting = savedLang === "de"
          ? `Hallo. Ich bin ${cName} und\nhöre dir gerne zu.`
          : `Hello. I'm ${cName}, and\nI'm here to listen.`;
        const closingLine = savedLang === "de"
          ? "Nimm dir Zeit – teile, was dich bewegt."
          : "Take your time – share what's on your mind.";
        const staticGreeting = personalLine
          ? `${baseGreeting}\n\n${personalLine}`
          : `${baseGreeting}\n\n${closingLine}`;
        composer.setMessages([{ id: "greeting", content: staticGreeting, role: "assistant", timestamp: new Date() }]);

        if (canUseVoice && voice.voiceSettings.autoPlayReplies && !voice.isListening) {
          voice.speakResponse(staticGreeting.replace(/\n/g, ' '), "greeting");
        }
      }
    };
    init();
  }, []);

  // Update greeting when companion loads (if still showing fallback name)
  useEffect(() => {
    if (!companion?.name || !initDone) return;
    const firstMsg = composer.messages[0];
    if (!firstMsg || firstMsg.role !== "assistant" || !firstMsg.id.startsWith("greeting")) return;
    if (firstMsg.content.includes("Soulvay") || firstMsg.content.includes("Ich bin Soulway")) {
      const savedLang = composer.preferences.current.language || language;
      const updated = firstMsg.content
        .replace(/Ich bin Soulvay/g, `Ich bin ${companion.name}`)
        .replace(/Ich bin Soulway/g, `Ich bin ${companion.name}`)
        .replace(/I'm Soulvay/g, `I'm ${companion.name}`)
        .replace(/I'm Soulway/g, `I'm ${companion.name}`);
      if (updated !== firstMsg.content) {
        composer.setMessages(prev => prev.map((m, i) => i === 0 ? { ...m, content: updated } : m));
      }
    }
  }, [companion?.name, initDone]);

  // Handle stream completion → trigger TTS
  const speakResponseRef = useRef(voice.speakResponse);
  useEffect(() => { speakResponseRef.current = voice.speakResponse; }, [voice.speakResponse]);

  const handleStreamDone = useCallback((fullResponse: string, messageId: string, _convId: string | null) => {
    speakResponseRef.current(fullResponse, messageId);
  }, []);

  // Send message with voice TTS callback
  const handleSend = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Track first chat message per session
    if (composer.messages.filter(m => m.role === "user").length === 0) {
      analytics.track("first_chat_sent", {}, "first_chat_sent");
    }

    const result = await composer.handleSend(content, false, undefined, handleStreamDone);
    if (result === "upgrade_needed") {
      analytics.track("chat_limit_reached", {}, "chat_limit_reached");
      setUpgradeReason("messages");
      setShowUpgradePrompt(true);
    }
    voice.setVoiceInputValue("");
    voice.setPendingTranscript("");
    voice.setShowTranscriptConfirm(false);
  }, [composer, handleStreamDone]);

  // Mode change with premium gating
  const handleModeChange = (mode: ChatMode) => {
    if ((mode === "clarify" && !composer.canUseClarifyMode) || (mode === "patterns" && !composer.canUsePatternMode)) {
      setUpgradeReason("features");
      setShowUpgradePrompt(true);
      return;
    }
    setChatMode(mode);
  };

  // Quick replies
  const getQuickReplies = (): string[] => {
    const keyMap: Record<ChatMode, [string, string]> = {
      talk: ["chat.talk.reply1", "chat.talk.reply2"],
      clarify: ["chat.clarify.reply1", "chat.clarify.reply2"],
      calm: ["chat.calm.reply1", "chat.calm.reply2"],
      patterns: ["chat.patterns.reply1", "chat.patterns.reply2"],
    };
    return keyMap[chatMode].map(k => t(k));
  };

  const calmExercises = useMemo(() => [
    { id: "breathing-60", label: t("chat.exercise.breathing"), icon: Wind },
    { id: "grounding-54321", label: t("chat.exercise.grounding"), icon: Anchor },
  ], [t]);

  // Voice mode toggle with premium gate
  const handleToggleVoiceMode = () => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
    if (realtimeAvailable && agentId) {
      if (useRealtimeMode && realtimeVoice.isConnected) {
        realtimeVoice.endSession();
        setUseRealtimeMode(false);
      } else {
        setUseRealtimeMode(true);
      }
      return;
    }
    if (!voice.isSpeechSupported) { toast({ title: t("voice.notSupported"), description: t("voice.tryChrome"), variant: "destructive" }); return; }
    voice.toggleVoiceMode();
  };

  const handleToggleRecording = () => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
    voice.toggleRecording();
  };

  const handleToggleAutoPlay = () => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
    voice.updateSetting("autoPlayReplies", !voice.voiceSettings.autoPlayReplies);
  };

  const handlePlayMessage = (message: { id: string; content: string; role: "user" | "assistant"; timestamp: Date; isError?: boolean }) => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
    voice.playMessage(message);
  };

  // New conversation with intelligence triggers (using extracted hook)
  const handleNewConversation = () => {
    extractIntelligence(composer.messages, composer.conversationId);
    composer.startNewConversation();
    const savedLang = composer.preferences.current.language || language;
    const baseGreeting = savedLang === "de"
      ? `Hallo. Ich bin ${companionName} und\nhöre dir gerne zu.\n\nNimm dir Zeit – teile, was dich bewegt.`
      : `Hello. I'm ${companionName}, and\nI'm here to listen.\n\nTake your time – share what's on your mind.`;
    composer.setMessages([{ id: "greeting-" + Date.now(), content: baseGreeting, role: "assistant", timestamp: new Date() }]);
  };

  // Summary/save handlers (using extracted hook)
  const handleSummary = () => {
    if (!composer.canUseSessionSummary) { setUpgradeReason("features"); setShowUpgradePrompt(true); return; }
    saveActions.handleSummary(composer.messages);
  };

  // Memoize last assistant message to avoid filtering on every streaming render
  const lastAssistantContent = useMemo(() => {
    for (let i = composer.messages.length - 1; i >= 0; i--) {
      const m = composer.messages[i];
      if (m.role === "assistant" && !m.isError) return m.content;
    }
    return "";
  }, [composer.messages]);

  // Listen for voice-send custom event
  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) handleSend(e.detail); };
    window.addEventListener('voice-send', handler as EventListener);
    return () => window.removeEventListener('voice-send', handler as EventListener);
  }, [handleSend]);

  return (
    <div className="flex flex-col bg-background" style={fullScreenWithNav()}>
      {/* Header */}
      <PageHeader
        title={companion?.name || t("chat.title")}
        subtitle={companion ? t("companion.reflectionCompanion") : t("chat.subtitle")}
        showLogo={false}
        showBack={false}
        avatarElement={companion ? (
          <CompanionAvatarAnimated
            archetype={companion.archetype}
            name={companion.name}
            size="sm"
            state={companionState}
            showPresenceDot
          />
        ) : undefined}
        rightElement={
          <div className="flex items-center gap-2 -mr-1.5">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate("/chat-history")} className="text-muted-foreground shrink-0" aria-label={t("chat.conversationHistory")}>
                    <History className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t("chat.conversationHistory")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleNewConversation} className="text-muted-foreground shrink-0" aria-label={t("chat.newConversation")}>
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{t("chat.newConversation")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleToggleVoiceMode}
                    className={`relative shrink-0 ${voice.voiceModeEnabled && canUseVoice ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                    aria-label={voice.voiceModeEnabled ? t("chat.voiceModeActive") : t("chat.startVoiceMode")}
                  >
                    {canUseVoice
                      ? <User className="w-5 h-5" />
                      : <><User className="w-5 h-5" /><Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" /></>
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {canUseVoice
                    ? (voice.voiceModeEnabled ? t("chat.voiceModeActive") : (language === "de" ? "Face-to-Face" : "Face to face"))
                    : t("chat.voiceConversationsPlus")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon" onClick={() => navigate("/safety")} className="text-destructive shrink-0" aria-label={t("chat.crisisResources")}>
              <Phone className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      {/* Mode Selector — no horizontal padding so scroll edge reaches screen edge */}
      <div className="shrink-0 min-w-0 py-2 border-b border-border/30 bg-background/50 overflow-x-hidden">
        <div className="px-4 md:px-6 lg:px-8">
          <ChatModeSelector activeMode={chatMode} onModeChange={handleModeChange} lockedModes={composer.isPremium ? [] : ["clarify", "patterns"]} />
        </div>
      </div>

      <ChatDisclaimer />
      <MessageLimitIndicator messagesRemaining={composer.messagesRemaining} dailyLimit={composer.dailyMessageLimit} isPremium={composer.isPremium} />

      {/* Real-time Voice Panel */}
      <AnimatePresence>
        {useRealtimeMode && canUseVoice && companion && (
          <RealtimeVoicePanel
            companion={companion}
            avatarUrl={companionAvatarUrl}
            status={realtimeVoice.status}
            phase={realtimeVoice.phase}
            isSpeaking={realtimeVoice.isSpeaking}
            userTranscript={realtimeVoice.userTranscript}
            agentTranscript={realtimeVoice.agentTranscript}
            onStartSession={() => realtimeVoice.startSession()}
            onEndSession={() => realtimeVoice.endSession()}
            onClose={() => { realtimeVoice.endSession(); setUseRealtimeMode(false); }}
            onResetError={() => realtimeVoice.resetError()}
            micWarning={realtimeVoice.micWarning}
            getInputVolume={realtimeVoice.getInputVolume}
            getOutputVolume={realtimeVoice.getOutputVolume}
          />
        )}
      </AnimatePresence>

      {/* Turn-based Voice Panel */}
      <AnimatePresence>
        {voice.voiceModeEnabled && !useRealtimeMode && canUseVoice && companion && (
          <VoiceConversationPanel
            companion={companion}
            avatarUrl={companionAvatarUrl}
            isListening={voice.isListening}
            isSpeaking={voice.isSpeaking}
            isThinking={composer.isLoading && !composer.isStreamingActive}
            isStreamingActive={composer.isStreamingActive}
            isTTSLoading={voice.isTTSLoading}
            isCooldown={voice.isCooldown}
            sttError={voice.sttError || null}
            liveTranscript={voice.voiceInputValue}
            lastAssistantMessage={lastAssistantContent}
            streamingContent={composer.streamingContent}
            onToggleRecording={handleToggleRecording}
            onClose={handleToggleVoiceMode}
          />
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradePrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowUpgradePrompt(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <UpgradePrompt reason={upgradeReason} variant="modal" onUpgrade={() => { setShowUpgradePrompt(false); navigate("/upgrade"); }} onDismiss={() => setShowUpgradePrompt(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ChatMessages
        messages={composer.messages}
        isLoading={composer.isLoading}
        isStreamingActive={composer.isStreamingActive}
        isRestoringConversation={composer.isRestoringConversation}
        onRetry={() => composer.handleRetry(handleStreamDone)}
        onContinue={() => composer.handleContinue(handleStreamDone)}
        onPlayMessage={handlePlayMessage}
        onStopTTS={voice.stopTTS}
        onSaveMessage={saveActions.handleSaveMessage}
        isPlayingMessage={voice.isPlayingMessage}
        isLoadingMessage={voice.isLoadingMessage}
        canUseVoice={canUseVoice}
        companionName={companion?.name}
      />

      {/* Calm Exercises */}
      {chatMode === "calm" && composer.messages.length > 0 && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg mx-auto flex gap-2">
            {calmExercises.map((ex) => (
              <Button key={ex.id} variant="outline" size="sm" className="flex-1 gap-2 min-h-[44px]" onClick={() => navigate("/toolbox", { state: { startExercise: ex.id } })}>
                <ex.icon className="w-4 h-4" />{ex.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Replies */}
      {composer.messages.length <= 2 && !composer.isLoading && !composer.isRestoringConversation && (
        <div className="shrink-0 px-4 pb-3 bg-background">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-muted-foreground text-center mb-3">{t("chat.howToStart")}</p>
            <div className="flex flex-col gap-2">
              {getQuickReplies().map((reply) => (
                <Button key={reply} variant="outline" onClick={() => handleSend(reply)} className="text-[14px] min-h-[48px] justify-start px-4 text-left">{reply}</Button>
              ))}
              <Button variant="outline" onClick={() => handleSend(t("home.appExploreQuestion"))} className="text-[14px] min-h-[48px] justify-start px-4 text-left gap-2.5 text-muted-foreground border-dashed">
                <HelpCircle className="w-4 h-4 shrink-0" />
                {t("home.appExploreQuestion")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual voice trial prompt */}
      <ChatVoiceTrialPrompt
        companionName={companionName}
        language={language as "en" | "de"}
        messageCount={composer.messages.length}
        isPremium={composer.isPremium}
      />

      {/* Emotional chat limit prompt */}
      <ChatLimitPrompt
        companionName={companionName}
        language={language as "en" | "de"}
        messagesRemaining={composer.messagesRemaining}
        isPremium={composer.isPremium}
      />

      {/* Action Buttons */}
      <ChatActionButtons
        messageCount={composer.messages.length}
        canUseSessionSummary={composer.canUseSessionSummary}
        onSummary={handleSummary}
        onSaveChat={() => saveActions.handleSaveChat(composer.messages)}
        onSaveSummary={() => saveActions.handleSaveSummary(composer.messages)}
        onCrisisHelp={() => navigate("/safety")}
      />

      {/* Voice Transcript */}
      {voice.showTranscriptConfirm && voice.pendingTranscript && canUseVoice && (
        <div className="shrink-0 px-4 pb-2 bg-background">
          <div className="max-w-lg mx-auto">
            <VoiceTranscriptConfirm
              transcript={composer.inputValue}
              onSend={() => voice.handleTranscriptSend((c) => handleSend(c))}
              onEdit={voice.handleTranscriptEdit}
              onCancel={voice.handleTranscriptCancel}
            />
          </div>
        </div>
      )}

      {/* Input Bar */}
      <ChatInputBar
        inputValue={composer.inputValue}
        onInputChange={composer.setInputValue}
        onSend={() => handleSend(composer.inputValue)}
        isLoading={composer.isLoading}
        isOnline={isOnline}
        isPremium={composer.isPremium}
        canSendMessage={composer.canSendMessage}
        canUseVoice={canUseVoice}
        isListening={voice.isListening}
        isSpeechSupported={voice.isSpeechSupported}
        autoPlayReplies={voice.voiceSettings.autoPlayReplies}
        onToggleAutoPlay={handleToggleAutoPlay}
        onToggleRecording={handleToggleRecording}
      />

      <SaveToJournalDialog
        open={saveActions.saveDialogOpen}
        onOpenChange={saveActions.setSaveDialogOpen}
        defaultTitle={saveActions.saveDialogDefaultTitle}
        variant={saveActions.saveDialogVariant}
        onSave={(title) => { if (saveActions.saveDialogCallback) saveActions.saveDialogCallback(title); }}
      />
    </div>
  );
}
