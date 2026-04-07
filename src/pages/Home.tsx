import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, MessageCircle, ChevronRight, Loader2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePremium } from "@/hooks/usePremium";
import { SoftPremiumBanner } from "@/components/premium/SoftPremiumBanner";
import { useStreak } from "@/hooks/useStreak";
import { useActivityLog } from "@/hooks/useActivityLog";
import { StreakCounter } from "@/components/streak/StreakCounter";
import { StreakMilestone } from "@/components/streak/StreakMilestone";
import { useCompanion } from "@/hooks/useCompanion";
import { CompanionCard } from "@/components/companion/CompanionCard";
import { useCompanionCheckins } from "@/hooks/useCompanionCheckins";
import { CompanionCheckin } from "@/components/home/CompanionCheckin";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { useReturnState } from "@/hooks/useReturnState";
import { WelcomeBackCard } from "@/components/home/WelcomeBackCard";
import { useDailyPrompt } from "@/hooks/useDailyPrompt";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { Lightbulb } from "lucide-react";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const streak = useStreak();
  const { logActivity } = useActivityLog();
  const { prompt: dailyPrompt } = useDailyPrompt();
  const [companionCheckinDismissed, setCompanionCheckinDismissed] = useState(false);
  const [showMilestone, setShowMilestone] = useState(true);
  const { loadRecentConversations } = useChatPersistence();
  const { companion } = useCompanion();
  const { checkin: companionCheckin, dismiss: dismissCheckin } = useCompanionCheckins(companion?.name);
  const [recentConversations, setRecentConversations] = useState<{ id: string; title: string | null; updated_at: string }[]>([]);
  const companionAvatarUrl = useAvatarUrl(companion?.avatar_url);
  const returnState = useReturnState(language, companion?.name || "Soulvay");

  const speechLang = language === "de" ? "de-DE" : "en-US";

  const {
    isListening,
    fullTranscript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(speechLang, { continuous: true });

  // Load recent conversations
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const convs = await loadRecentConversations(3);
        setRecentConversations(convs);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, loadRecentConversations]);

  // Update input from speech
  useEffect(() => {
    if (fullTranscript) setInputValue(fullTranscript);
  }, [fullTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsRecording(false);
    } else {
      resetTranscript();
      startListening();
      setIsRecording(true);
    }
  };

  const handleSaveThought = async () => {
    if (!inputValue.trim() || !user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          user_session_id: user.id,
          content: inputValue.trim(),
          source: 'voice-dump',
        });
      if (error) throw error;
      toast({
        title: t("home.thoughtSaved"),
        description: t("home.thoughtSavedDesc"),
      });
      setInputValue("");
      resetTranscript();
      logActivity("journal_entry");
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving thought:', error);
      toast({
        title: t("common.error"),
        description: t("home.saveFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTalkToSoulvay = () => {
    if (inputValue.trim()) {
      localStorage.setItem('soulvay-initial-message', inputValue.trim());
    }
    navigate("/chat");
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.greetingMorning");
    if (hour < 18) return t("home.greetingAfternoon");
    return t("home.greetingEvening");
  };

  return (
    <div className="bg-background flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-3 safe-top shrink-0">
        <div className="flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold text-foreground truncate"
          >
            {greeting()}
          </motion.h1>
          <div className="flex items-center gap-2">
            <StreakCounter
              currentStreak={streak.currentStreak}
              isActiveToday={streak.isActiveToday}
              isLoading={streak.isLoading}
            />
            <button
              onClick={() => navigate("/settings")}
              className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1"
        >
          {t("home.howAreYou")}
        </motion.p>
      </div>

      {/* Streak Milestone Celebration */}
      {streak.milestoneReached && showMilestone && (
        <StreakMilestone
          milestone={streak.milestoneReached}
          onDismiss={() => setShowMilestone(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Welcome Back — returning users */}
        {returnState.category && (
          <WelcomeBackCard
            message={returnState.welcomeMessage}
            onDismiss={returnState.dismiss}
          />
        )}

        {/* Voice/Text Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-card rounded-3xl border border-border/50 shadow-card overflow-hidden">
            {/* Recording Indicator */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-primary/5 border-b border-border/30 px-4 py-3 flex items-center gap-3"
                >
                  <motion.div
                    className="w-3 h-3 rounded-full bg-destructive"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("home.listening")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text Area */}
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("home.inputPlaceholder")}
                className="w-full bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[100px] text-base leading-relaxed"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex items-center justify-between">
              {isSpeechSupported && (
                <Button
                  variant={isRecording ? "default" : "ghost"}
                  size="icon"
                  onClick={handleVoiceToggle}
                  className={`rounded-full w-12 h-12 ${isRecording ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveThought}
                  disabled={!inputValue.trim() || isSaving}
                  className="rounded-xl"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {t("home.save")}
                </Button>

                <Button
                  onClick={handleTalkToSoulvay}
                  className="rounded-xl gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t("home.talk")}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            {t("home.unloadThoughts")}
          </p>
        </motion.div>

        {/* Companion Card */}
        {companion && <CompanionCard companion={companion} />}

        {/* Soft Premium Banner (free users only) */}
        {!isPremium && (
          <SoftPremiumBanner language={language as "en" | "de"} variant="home" />
        )}

        {/* Companion Check-in */}
        {companionCheckin && !companionCheckinDismissed && (
          <CompanionCheckin
            type={companionCheckin.type}
            text={companionCheckin.text}
            companionName={companion?.name}
            companionArchetype={companion?.archetype}
            companionAvatarUrl={companionAvatarUrl}
            onTalkAboutIt={() => {
              dismissCheckin();
              setCompanionCheckinDismissed(true);
              localStorage.setItem('soulvay-initial-message', companionCheckin.chatPrompt);
              navigate("/chat");
            }}
            onDismiss={() => { dismissCheckin(); setCompanionCheckinDismissed(true); }}
          />
        )}

        {/* Daily Reflection Prompt */}
        {dailyPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <button
              onClick={() => {
                localStorage.setItem('soulvay-initial-message', dailyPrompt.text);
                navigate("/chat");
              }}
              className="w-full text-left rounded-2xl p-4 border bg-primary/5 border-primary/20 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{t("home.dailyPrompt")}</p>
                  <p className="text-sm font-medium text-foreground">{dailyPrompt.text}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </button>
          </motion.div>
        )}

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t("home.recentConversations")}</span>
              <Button variant="ghost" size="sm" className="text-muted-foreground h-auto py-1 text-xs" onClick={() => navigate("/chat-history")}>
                {t("home.all")} <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {recentConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate("/chat", { state: { conversationId: conv.id } })}
                  className="w-full text-left rounded-xl px-3.5 py-2.5 border bg-card border-border/30 hover:border-primary/20 transition-colors flex items-center gap-3"
                >
                  <MessageCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">
                    {conv.title || t("home.conversation")}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
