import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Calendar, MessageCircle, ChevronRight, Loader2, Headphones, Sparkles, Lightbulb, TrendingUp, History, Wrench, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStreak } from "@/hooks/useStreak";
import { useActivityLog } from "@/hooks/useActivityLog";
import { StreakCounter } from "@/components/streak/StreakCounter";
import { StreakMilestone } from "@/components/streak/StreakMilestone";
import { WeeklyProgress } from "@/components/streak/WeeklyProgress";
import { usePersonalization } from "@/hooks/usePersonalization";
import { AdaptiveSuggestions } from "@/components/home/AdaptiveSuggestions";
import { ContinueModule } from "@/components/home/ContinueModule";
import { ShareableInsightCard } from "@/components/home/ShareableInsightCard";
import { GrowthDashboard } from "@/components/home/GrowthDashboard";
import { CompanionCheckin } from "@/components/home/CompanionCheckin";
import { useDailyPrompt } from "@/hooks/useDailyPrompt";
import { useInsightsAndPatterns } from "@/hooks/useInsightsAndPatterns";
import { useMemoryMoments } from "@/hooks/useMemoryMoments";
import { useChatPersistence } from "@/hooks/useChatPersistence";
interface RecentThought {
  id: string;
  content: string;
  mood: string | null;
  created_at: string;
  source: string | null;
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recentThoughts, setRecentThoughts] = useState<RecentThought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const streak = useStreak();
  const { logActivity } = useActivityLog();
  const { suggestions, audioSuggestion } = usePersonalization();
  const { prompt: dailyPrompt } = useDailyPrompt();
  const { latestInsight, insights, insightCount, patterns } = useInsightsAndPatterns();
  const [companionCheckinDismissed, setCompanionCheckinDismissed] = useState(false);
  const [showMilestone, setShowMilestone] = useState(true);
  const { moment: memoryMoment, dismiss: dismissMoment, startConversation: startMomentConversation } = useMemoryMoments();
  const { loadRecentConversations } = useChatPersistence();
  const [recentConversations, setRecentConversations] = useState<{ id: string; title: string | null; updated_at: string }[]>([]);
  
  const speechLang = language === "de" ? "de-DE" : "en-US";
  
  const { 
    isListening, 
    fullTranscript, 
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(speechLang, { continuous: true });

  // Load recent thoughts + conversations
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const [thoughtsRes, convs] = await Promise.all([
          supabase
            .from('journal_entries')
            .select('id, content, mood, created_at, source')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          loadRecentConversations(3),
        ]);
        
        setRecentThoughts(thoughtsRes.data || []);
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
    if (fullTranscript) {
      setInputValue(fullTranscript);
    }
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
      
      // Reload recent thoughts
      const { data } = await supabase
        .from('journal_entries')
        .select('id, content, mood, created_at, source')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setRecentThoughts(data || []);
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
      localStorage.setItem('mindmate-initial-message', inputValue.trim());
    }
    navigate("/chat");
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (language === "de") {
      if (diffMins < 1) return "Gerade eben";
      if (diffMins < 60) return `vor ${diffMins} Min`;
      if (diffHours < 24) return `vor ${diffHours} Std`;
      if (diffDays === 1) return "Gestern";
      return `vor ${diffDays} Tagen`;
    } else {
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    }
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/^#{1,6}\s+/gm, '')     // ## headers
      .replace(/\*\*(.*?)\*\*/g, '$1')  // **bold**
      .replace(/\*(.*?)\*/g, '$1')      // *italic*
      .replace(/`(.*?)`/g, '$1')        // `code`
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [links](url)
      .replace(/^[-*]\s+/gm, '')        // - list items
      .replace(/\n{2,}/g, ' ')          // collapse newlines
      .trim();
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    const clean = stripMarkdown(text);
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength).trim() + "...";
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.greetingMorning");
    if (hour < 18) return t("home.greetingAfternoon");
    return t("home.greetingEvening");
  };

  return (
    <div className="bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold text-foreground"
          >
            {greeting()}
          </motion.h1>
          <StreakCounter
            currentStreak={streak.currentStreak}
            isActiveToday={streak.isActiveToday}
            isLoading={streak.isLoading}
          />
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
      <div className="flex-1 px-6 pb-6">
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
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveThought}
                  disabled={!inputValue.trim() || isSaving}
                  className="rounded-xl"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
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

        {/* Companion Check-in — memory moment or insight-based */}
        {memoryMoment && !companionCheckinDismissed && (
          <CompanionCheckin
            type="memory"
            text={`${t("home.memoryMomentIntro")} "${memoryMoment.content}" ${t("home.memoryMomentQuestion")}`}
            onTalkAboutIt={() => {
              startMomentConversation();
              const msg = `${t("home.memoryMomentMsg")} "${memoryMoment.content}". ${t("home.memoryMomentContinue")}`;
              localStorage.setItem('mindmate-initial-message', msg);
              navigate("/chat");
            }}
            onDismiss={() => { dismissMoment(); setCompanionCheckinDismissed(true); }}
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
                localStorage.setItem('mindmate-initial-message', dailyPrompt.text);
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

        {/* Shareable Insight Card */}
        {latestInsight && (
          <ShareableInsightCard
            insightText={latestInsight.insight_text}
            date={latestInsight.created_at}
          />
        )}

        {/* Personal Growth Dashboard */}
        {!streak.isLoading && (
          <GrowthDashboard
            patterns={patterns}
            weeklyStats={streak.weeklyStats}
            currentStreak={streak.currentStreak}
            insightCount={insightCount}
          />
        )}

        {/* Identity Message — when patterns exist */}
        {patterns.length >= 2 && streak.currentStreak >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            className="mb-6"
          >
            <p className="text-xs text-center text-muted-foreground/70 italic">
              {t("growth.identityMessage")}
            </p>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-4 gap-2 mb-6"
        >
          <Button
            variant="outline"
            className="h-auto py-3.5 px-2.5 rounded-2xl flex flex-col items-center gap-1 bg-card border-border/50"
            onClick={() => navigate("/chat")}
          >
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground text-[11px]">
              {t("home.talkToMe")}
            </span>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto py-3.5 px-2.5 rounded-2xl flex flex-col items-center gap-1 bg-card border-border/50"
            onClick={() => navigate("/toolbox")}
          >
            <Wrench className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground text-[11px]">
              {t("nav.toolbox")}
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3.5 px-2.5 rounded-2xl flex flex-col items-center gap-1 bg-card border-border/50"
            onClick={() => navigate("/timeline")}
          >
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground text-[11px]">
              {t("home.myTimeline")}
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3.5 px-2.5 rounded-2xl flex flex-col items-center gap-1 bg-card border-border/50"
            onClick={() => navigate("/chat-history")}
          >
            <History className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground text-[11px]">
              {t("home.history")}
            </span>
          </Button>
        </motion.div>

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
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

        {/* Weekly Progress Dashboard */}
        {!streak.isLoading && (
          <WeeklyProgress
            activeDays={streak.weeklyStats.activeDays}
            moodCheckins={streak.weeklyStats.moodCheckins}
            journalEntries={streak.weeklyStats.journalEntries}
            exercisesCompleted={streak.weeklyStats.exercisesCompleted}
            chatSessions={streak.weeklyStats.chatSessions}
            lastWeekActiveDays={streak.lastWeekActiveDays}
            currentStreak={streak.currentStreak}
          />
        )}

        {/* Continue Module */}
        <ContinueModule />

        {/* Adaptive Suggestions */}
        <AdaptiveSuggestions
          suggestions={suggestions}
          onStartExercise={(exercise) => navigate("/toolbox", { state: { startExercise: exercise.id } })}
        />

        {/* Audio Suggestion */}
        {audioSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-4"
          >
            <button
              onClick={() => navigate("/audio")}
              className="w-full text-left rounded-2xl p-4 border bg-card border-primary/20 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">
                  {audioSuggestion.reason === "sleep" ? "🌙" : "🧘"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t(audioSuggestion.reason === "sleep" ? "audio.sleepRecommended" : "audio.stressRecommended")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("audio.whyRecommended")}</p>
                </div>
                <Headphones className="w-4 h-4 text-primary shrink-0" />
              </div>
            </button>
          </motion.div>
        )}

        {/* Recent Thoughts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("home.recentThoughts")}
            </h2>
            {recentThoughts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-auto py-1"
                onClick={() => navigate("/timeline")}
              >
                {t("home.all")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentThoughts.length === 0 ? (
            <div className="bg-muted/30 rounded-2xl p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {t("home.noThoughts")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentThoughts.map((thought, index) => (
                <motion.button
                  key={thought.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => navigate("/timeline")}
                  className="w-full text-left bg-card rounded-xl p-4 border border-border/30 hover:border-border/60 transition-colors"
                >
                  <p className="text-sm text-foreground line-clamp-2">
                    {truncateText(thought.content)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(thought.created_at)}
                    </span>
                    {thought.mood && (
                      <span className="text-xs">{thought.mood}</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}