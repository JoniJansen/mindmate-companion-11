import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Sparkles, Loader2, BarChart3, TrendingUp, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MoodHeatmap } from "@/components/mood/MoodHeatmap";
import { MoodInsights } from "@/components/mood/MoodInsights";
import { toStableTagIds } from "@/lib/tagUtils";
import { useInsightsAndPatterns } from "@/hooks/useInsightsAndPatterns";

interface TimelineEntry {
  id: string;
  content: string;
  title: string | null;
  mood: string | null;
  source: string | null;
  created_at: string;
}

interface MoodCheckin {
  id: string;
  mood_value: number;
  feelings: string[];
  created_at: string;
}

interface DayData {
  date: Date;
  entries: TimelineEntry[];
  moodAverage: number | null;
}

const moodToNumber = (mood: string | null): number | null => {
  if (!mood) return null;
  const moodMap: Record<string, number> = {
    "😊": 5, "🙂": 4, "😐": 3, "😔": 2, "😢": 1,
    "great": 5, "good": 4, "okay": 3, "low": 2, "struggling": 1,
  };
  return moodMap[mood] || null;
};

const numberToMood = (num: number): string => {
  if (num >= 4.5) return "😊";
  if (num >= 3.5) return "🙂";
  if (num >= 2.5) return "😐";
  if (num >= 1.5) return "😔";
  return "😢";
};

export default function Timeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [sessionInsights, setSessionInsights] = useState<{ id: string; insight_text: string; created_at: string }[]>([]);
  
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { latestInsight, patterns } = useInsightsAndPatterns();
  // Load entries and mood checkins
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const [entriesRes, checkinsRes, insightsRes] = await Promise.all([
          supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('mood_checkins')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false }),
          supabase
            .from('session_insights')
            .select('id, insight_text, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30) as any,
        ]);
        
        setEntries(entriesRes.data || []);
        setCheckins(
          (checkinsRes.data || []).map((c) => ({
            id: c.id,
            mood_value: c.mood_value,
            feelings: toStableTagIds(c.feelings || []),
            created_at: c.created_at,
          }))
        );
        setSessionInsights(insightsRes.data || []);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // Process week data
  useEffect(() => {
    const days: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dayEntries = entries.filter(entry =>
        new Date(entry.created_at).toDateString() === date.toDateString()
      );
      const moods = dayEntries.map(e => moodToNumber(e.mood)).filter(m => m !== null) as number[];
      const moodAverage = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
      days.push({ date, entries: dayEntries, moodAverage });
    }
    setWeekData(days);
    const today = new Date();
    const todayData = days.find(d => d.date.toDateString() === today.toDateString());
    if (todayData && !selectedDay) setSelectedDay(todayData.date);
  }, [entries, currentWeekStart]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newStart);
    setSelectedDay(null);
  };

  const formatDate = (date: Date) => date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", { month: 'short', day: 'numeric' });
  const formatWeekRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${formatDate(currentWeekStart)} – ${formatDate(end)}`;
  };
  const getDayName = (date: Date) => {
    if (date.toDateString() === new Date().toDateString()) return language === "de" ? "Heute" : "Today";
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", { weekday: 'short' });
  };
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const selectedDayData = weekData.find(d => d.date.toDateString() === selectedDay?.toDateString());

  const handleGenerateInsight = async () => {
    if (entries.length < 3) {
      toast({
        title: t("timeline.notEnoughDataTitle"),
        description: t("timeline.notEnoughDataDesc"),
      });
      return;
    }
    setIsGeneratingInsight(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-reflect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          type: 'patterns',
          entries: entries.slice(0, 10).map(e => ({ date: e.created_at, content: e.content, mood: e.mood })),
          language,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiInsight(data.reflection);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating insight:', error);
      toast({ title: t("common.error"), description: t("timeline.insightError"), variant: "destructive" });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const formatTimeFromDate = (dateString: string) =>
    new Date(dateString).toLocaleTimeString(language === "de" ? "de-DE" : "en-US", { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {language === "de" ? "Meine Timeline" : "My Timeline"}
          </h1>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mood Heatmap Toggle */}
      {checkins.length >= 5 && (
        <div className="px-6 mb-4">
          <Button
            variant={showHeatmap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="gap-2 rounded-xl"
          >
            <BarChart3 className="w-4 h-4" />
            {language === "de" ? "Stimmungskarte" : "Mood Map"}
          </Button>
        </div>
      )}

      {/* Mood Heatmap */}
      <AnimatePresence>
        {showHeatmap && checkins.length >= 5 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-4 overflow-hidden"
          >
            <CalmCard variant="gentle">
              <h3 className="font-medium text-foreground text-sm mb-3">
                {language === "de" ? "90-Tage Stimmungsverlauf" : "90-Day Mood Map"}
              </h3>
              <MoodHeatmap checkins={checkins} weeks={13} />
              <div className="mt-4">
                <MoodInsights checkins={checkins} />
              </div>
            </CalmCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Week Navigation */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-medium text-foreground">{formatWeekRange()}</span>
          <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')} className="rounded-full" disabled={currentWeekStart > new Date()}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="px-4 mb-6">
        <div className="flex justify-between gap-1">
          {weekData.map((day) => {
            const isSelected = selectedDay?.toDateString() === day.date.toDateString();
            const hasEntries = day.entries.length > 0;
            const isFuture = day.date > new Date();
            return (
              <motion.button
                key={day.date.toISOString()}
                onClick={() => !isFuture && setSelectedDay(day.date)}
                disabled={isFuture}
                className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  isSelected ? "bg-primary text-primary-foreground"
                    : isFuture ? "opacity-30"
                    : hasEntries ? "bg-card border border-border/50"
                    : "bg-muted/30"
                }`}
                whileTap={!isFuture ? { scale: 0.95 } : undefined}
              >
                <span className={`text-[10px] font-medium ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {getDayName(day.date)}
                </span>
                <span className={`text-lg font-semibold ${isSelected ? "text-primary-foreground" : isToday(day.date) ? "text-primary" : "text-foreground"}`}>
                  {day.date.getDate()}
                </span>
                {day.moodAverage && <span className="text-sm">{numberToMood(day.moodAverage)}</span>}
                {hasEntries && !day.moodAverage && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* AI Insight */}
      {entries.length >= 3 && (
        <div className="px-6 mb-4">
          <AnimatePresence mode="wait">
            {aiInsight ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-primary/5 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground leading-relaxed">{aiInsight}</p>
                    <Button variant="ghost" size="sm" className="text-muted-foreground mt-2 h-auto py-1 px-0" onClick={() => setAiInsight(null)}>
                      {language === "de" ? "Schließen" : "Dismiss"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button variant="outline" className="w-full rounded-xl gap-2 text-muted-foreground" onClick={handleGenerateInsight} disabled={isGeneratingInsight}>
                  {isGeneratingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {language === "de" ? "Muster erkennen" : "Discover patterns"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Emotional Patterns */}
      {patterns.length > 0 && (
        <div className="px-6 mb-4">
          <CalmCard variant="gentle">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">
                {language === "de" ? "Erkannte Muster" : "Detected Patterns"}
              </h3>
            </div>
            <div className="space-y-2">
              {patterns.map((p) => (
                <div key={p.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </CalmCard>
        </div>
      )}

      {/* Recent Session Insights */}
      {sessionInsights.length > 0 && (
        <div className="px-6 mb-4">
          <CalmCard variant="gentle">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">
                {language === "de" ? "Reflexionen aus Gesprächen" : "Conversation Reflections"}
              </h3>
            </div>
            <div className="space-y-3">
              {sessionInsights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-primary/50 mt-1 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{insight.insight_text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(insight.created_at).toLocaleDateString(language === "de" ? "de-DE" : "en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CalmCard>
        </div>
      )}

      {/* Selected Day Entries */}
      <div className="px-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : selectedDayData ? (
          <>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              {isToday(selectedDayData.date) ? (language === "de" ? "Heute" : "Today") : formatDate(selectedDayData.date)}
            </h2>
            {selectedDayData.entries.length === 0 ? (
              <div className="bg-muted/30 rounded-2xl p-6 text-center">
                <p className="text-muted-foreground text-sm mb-3">
                  {language === "de" ? "Keine Gedanken an diesem Tag." : "No thoughts on this day."}
                </p>
                {isToday(selectedDayData.date) && (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate("/")}>
                    {language === "de" ? "Gedanken hinzufügen" : "Add thoughts"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {selectedDayData.entries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: 0.05 * index }}
                      className="bg-card rounded-xl p-4 border border-border/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">{formatTimeFromDate(entry.created_at)}</div>
                        <div className="flex-1 min-w-0">
                          {entry.title && <h3 className="font-medium text-foreground mb-1">{entry.title}</h3>}
                          <p className="text-sm text-foreground/80 leading-relaxed">{entry.content}</p>
                          {entry.mood && <span className="inline-block mt-2 text-sm">{entry.mood}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {language === "de" ? "Wähle einen Tag" : "Select a day"}
          </div>
        )}
      </div>
    </div>
  );
}
