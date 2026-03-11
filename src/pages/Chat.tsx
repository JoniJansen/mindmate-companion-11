import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Wind, Anchor, Lock, HelpCircle, Plus, History, Volume2, VolumeX } from "lucide-react";
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
import { VoiceAvatar } from "@/components/chat/VoiceAvatar";
import { VoiceTranscriptConfirm } from "@/components/chat/VoiceTranscriptConfirm";
import { ChatModeSelector, ChatMode } from "@/components/chat/ChatModeSelector";
import { ChatDisclaimer } from "@/components/chat/ChatDisclaimer";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { ChatActionButtons } from "@/components/chat/ChatActionButtons";
import { SaveToJournalDialog } from "@/components/chat/SaveToJournalDialog";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { MessageLimitIndicator } from "@/components/premium/MessageLimitIndicator";
import { fullScreenWithNav } from "@/lib/safeArea";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";

function CompanionAvatarHeader({ archetype, name }: { archetype: string; name: string }) {
  return (
    <div className="relative shrink-0">
      <CompanionAvatar archetype={archetype} name={name} size="sm" animate={false} />
      {/* Subtle presence dot */}
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
    </div>
  );
}

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
    const stored = localStorage.getItem("mindmate-chat-mode");
    return (stored as ChatMode) || "talk";
  });
  useEffect(() => { localStorage.setItem("mindmate-chat-mode", chatMode); }, [chatMode]);

  // Upgrade prompt state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"messages" | "voice" | "features">("features");

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveDialogVariant, setSaveDialogVariant] = useState<"message" | "conversation" | "summary">("message");
  const [saveDialogDefaultTitle, setSaveDialogDefaultTitle] = useState("");
  const [saveDialogCallback, setSaveDialogCallback] = useState<((title: string) => void) | null>(null);

  // Composer hook (messages, streaming, persistence)
  const composer = useChatComposer(chatMode);

  // Companion
  const { companion, incrementBond } = useCompanion();

  // Voice hook
  const voice = useChatVoice();

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

  // Initialize: greeting, restore conversation, or handle initial message
  const [initDone, setInitDone] = useState(false);
  useEffect(() => {
    if (initDone) return;
    setInitDone(true);

    const initialMessage = localStorage.getItem('mindmate-initial-message') || location.state?.initialMessage;
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

      if (initialMessage) {
        localStorage.removeItem('mindmate-initial-message');
        composer.handleSend(initialMessage, false, undefined, handleStreamDone);
      } else {
        const personalLine = getPersonalizedGreeting();
        const companionName = companion?.name || "Soulvay";
        const baseGreeting = savedLang === "de"
          ? `Hallo. Ich bin ${companionName} und\nhöre dir gerne zu.`
          : `Hello. I'm ${companionName}, and\nI'm here to listen.`;
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

  // Handle stream completion → trigger TTS
  const handleStreamDone = useCallback((fullResponse: string, messageId: string, _convId: string | null) => {
    voice.speakResponse(fullResponse, messageId);
  }, [voice]);

  // Send message with voice TTS callback
  const handleSend = useCallback(async (content: string) => {
    if (!content.trim()) return;
    const result = await composer.handleSend(content, false, undefined, handleStreamDone);
    if (result === "upgrade_needed") {
      setUpgradeReason("messages");
      setShowUpgradePrompt(true);
    }
    voice.setVoiceInputValue("");
    voice.setPendingTranscript("");
    voice.setShowTranscriptConfirm(false);
  }, [composer, handleStreamDone, voice]);

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

  const calmExercises = [
    { id: "breathing-60", label: t("chat.exercise.breathing"), icon: Wind },
    { id: "grounding-54321", label: t("chat.exercise.grounding"), icon: Anchor },
  ];

  // Voice mode toggle with premium gate
  const handleToggleVoiceMode = () => {
    if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }
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

  // New conversation with intelligence triggers
  const handleNewConversation = () => {
    const userMsgCount = composer.messages.filter(m => m.role === "user" && !m.isError).length;
    if (user && userMsgCount >= 4) {
      const conversationContent = composer.messages.filter(m => !m.isError).map(m => `${m.role}: ${m.content}`).join("\n\n");
      const chatMsgs = composer.messages.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content }));

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
            body: JSON.stringify({ messages: chatMsgs, conversation_id: composer.conversationId, language }),
          }).catch(() => {});
        }

        if (userMsgCount >= 8) {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-patterns`, {
            method: "POST", headers,
            body: JSON.stringify({ language }),
          }).catch(() => {});
        }
      });

      // Increment companion bond for meaningful conversations
      if (userMsgCount >= 5) {
        incrementBond();
      }
    }

    composer.startNewConversation();
    const savedLang = composer.preferences.current.language || language;
    const companionName = companion?.name || "Soulvay";
    const baseGreeting = savedLang === "de"
      ? `Hallo. Ich bin ${companionName} und\nhöre dir gerne zu.\n\nNimm dir Zeit – teile, was dich bewegt.`
      : `Hello. I'm ${companionName}, and\nI'm here to listen.\n\nTake your time – share what's on your mind.`;
    composer.setMessages([{ id: "greeting-" + Date.now(), content: baseGreeting, role: "assistant", timestamp: new Date() }]);
  };

  // Summary handlers
  const handleSummary = () => {
    if (!composer.canUseSessionSummary) { setUpgradeReason("features"); setShowUpgradePrompt(true); return; }
    localStorage.setItem("mindmate-chat-messages", JSON.stringify(composer.messages.map(m => ({ role: m.role, content: m.content }))));
    navigate("/summary", { state: { messages: composer.messages.map(m => ({ role: m.role, content: m.content })) } });
  };

  const handleSaveChat = () => {
    if (!user) return;
    setSaveDialogVariant("conversation");
    setSaveDialogDefaultTitle(t("chat.chatConversation"));
    setSaveDialogCallback(() => async (title: string) => {
      const chatContent = composer.messages.filter(m => !m.isError).map(m => `${m.role === "user" ? "🧑" : "🤖"} ${m.content}`).join("\n\n");
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
  };

  const handleSaveSummary = async () => {
    if (!user) return;
    toast({ title: t("chat.generatingSummary"), description: t("chat.pleaseWait") });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const chatMsgs = composer.messages.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ messages: chatMsgs, language }),
      });
      if (!resp.ok) throw new Error("Failed");
      const summary = await resp.json();
      const structuredContent = [
        `## ${t("chat.summarySection.summary")}`, summary.summary || "", "",
        `### ${t("chat.summarySection.themes")}`, ...(summary.emotionalThemes || []).map((th: string) => `• ${th}`), "",
        `### ${t("chat.summarySection.moodJourney")}`,
        `${summary.moodProgression?.start || "💭"} → ${summary.moodProgression?.end || "🙂"} ${summary.moodProgression?.insight || ""}`, "",
        `### ${t("chat.summarySection.nextStep")}`, summary.nextStep || "",
      ].join("\n");
      await supabase.from("journal_entries").insert({
        user_id: user.id, user_session_id: user.id,
        content: structuredContent,
        title: t("chat.journalTitle.summary"),
        source: "chat-summary", tags: ["chat", "summary"],
      } as any);
      toast({ title: t("chat.savedToJournal"), description: t("chat.summarySavedDesc") });
    } catch { toast({ title: t("common.error"), variant: "destructive" }); }
  };

  const handleSaveMessage = (message: { id: string; content: string; role: string }) => {
    if (!user) return;
    setSaveDialogVariant("message");
    setSaveDialogDefaultTitle(t("chat.chatMessage"));
    setSaveDialogCallback(() => async (title: string) => {
      try {
        await supabase.from("journal_entries").insert({
          user_id: user.id, user_session_id: user.id,
          content: message.content,
          title: title || t("chat.journalTitle.message"),
          source: "chat", tags: ["chat"],
        } as any);
        toast({ title: t("chat.savedToJournal"), description: t("chat.messageSavedDesc") });
      } catch { toast({ title: t("common.error"), variant: "destructive" }); }
    });
    setSaveDialogOpen(true);
  };

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
        subtitle={companion ? (language === "de" ? "Dein Reflexionsbegleiter" : "Your reflection companion") : t("chat.subtitle")}
        showLogo={false}
        showBack={false}
        avatarElement={companion ? (
          <CompanionAvatarHeader archetype={companion.archetype} name={companion.name} />
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
                    className={`relative shrink-0 ${voice.voiceModeEnabled && canUseVoice ? "text-primary" : "text-muted-foreground"}`}
                    aria-label={voice.voiceModeEnabled ? t("chat.voiceModeActive") : t("chat.startVoiceMode")}
                  >
                    {canUseVoice
                      ? (voice.voiceModeEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />)
                      : <><VolumeX className="w-5 h-5" /><Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" /></>
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {canUseVoice
                    ? (voice.voiceModeEnabled ? t("chat.voiceModeActive") : t("chat.startVoiceMode"))
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

      {/* Mode Selector */}
      <div className="shrink-0 min-w-0 px-4 md:px-6 lg:px-8 py-2 border-b border-border/30 bg-background/50">
        <ChatModeSelector activeMode={chatMode} onModeChange={handleModeChange} lockedModes={composer.isPremium ? [] : ["clarify", "patterns"]} />
      </div>

      <ChatDisclaimer />
      <MessageLimitIndicator messagesRemaining={composer.messagesRemaining} dailyLimit={composer.dailyMessageLimit} isPremium={composer.isPremium} />

      {!composer.isPremium && (
        <div className="shrink-0 px-4 py-2">
          <UpgradePrompt reason="general" variant="banner" onUpgrade={() => navigate("/upgrade")} />
        </div>
      )}

      {/* Voice Avatar */}
      <AnimatePresence>
        {voice.voiceModeEnabled && canUseVoice && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-b border-border/30 overflow-hidden bg-gradient-to-b from-background to-muted/20">
            <div className="flex flex-col items-center py-8">
              <VoiceAvatar isSpeaking={voice.isSpeaking} isListening={voice.isListening} avatarStyle={voice.voiceSettings.avatarStyle || "orb"} size="lg" onTap={handleToggleRecording} />
            </div>
          </motion.div>
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
        onSaveMessage={handleSaveMessage}
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

      {/* Action Buttons */}
      <ChatActionButtons
        messageCount={composer.messages.length}
        canUseSessionSummary={composer.canUseSessionSummary}
        onSummary={handleSummary}
        onSaveChat={handleSaveChat}
        onSaveSummary={handleSaveSummary}
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
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        defaultTitle={saveDialogDefaultTitle}
        variant={saveDialogVariant}
        onSave={(title) => { if (saveDialogCallback) saveDialogCallback(title); }}
      />
    </div>
  );
}
