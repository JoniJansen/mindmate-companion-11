import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronDown, TrendingUp, Calendar, BookOpen, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { TabHint } from "@/components/shared/TabHint";
import { Button } from "@/components/ui/button";
import { MoodSelector, getMoodEmoji } from "@/components/mood/MoodSelector";
import { FeelingTags } from "@/components/mood/FeelingTags";
import { MoodChart } from "@/components/mood/MoodChart";
import { MoodHeatmap } from "@/components/mood/MoodHeatmap";
import { MoodInsights } from "@/components/mood/MoodInsights";
import { CommunityInsights } from "@/components/mood/CommunityInsights";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toStableTagIds } from "@/lib/tagUtils";
import { useActivityLog } from "@/hooks/useActivityLog";

interface MoodCheckin {
  id: string;
  mood_value: number;
  feelings: string[];
  note: string | null;
  created_at: string;
}

type TimeFilter = "7d" | "30d" | "90d";

export default function Mood() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedToday, setHasSavedToday] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [checkinCollapsed, setCheckinCollapsed] = useState(false);

  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logActivity } = useActivityLog();

  useEffect(() => {
    if (user) loadCheckins();
  }, [user, timeFilter]);

  const loadCheckins = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const daysAgo = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from("mood_checkins")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(d => ({
        id: d.id,
        mood_value: d.mood_value,
        feelings: toStableTagIds(d.feelings || []),
        note: d.note,
        created_at: d.created_at,
      }));

      setCheckins(mapped);

      // Check if saved today
      const today = new Date().toDateString();
      const todayCheckin = mapped.find(c => new Date(c.created_at).toDateString() === today);
      if (todayCheckin) {
        setHasSavedToday(true);
        setCheckinCollapsed(true);
        setSelectedMood(todayCheckin.mood_value);
        setSelectedFeelings(todayCheckin.feelings);
        setNote(todayCheckin.note || "");
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error loading checkins:", error);
      const stored = localStorage.getItem("mindmate-moods");
      if (stored) {
        const localData = JSON.parse(stored);
        setCheckins(localData.map((d: any) => ({
          id: d.id || Date.now().toString(),
          mood_value: d.mood,
          feelings: toStableTagIds(d.feelings || []),
          note: d.note || null,
          created_at: d.created_at,
        })));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedMood === null || !user) return;
    setIsSaving(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from("mood_checkins")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .maybeSingle();

      if (existing) {
        await supabase.from("mood_checkins").delete().eq("id", existing.id);
      }

      const { error } = await supabase.from("mood_checkins").insert({
        user_id: user.id,
        user_session_id: user.id,
        mood_value: selectedMood,
        feelings: selectedFeelings, // Stable IDs
        note: note.trim() || null,
      } as any);

      if (error) throw error;

      if (note.trim()) {
        await supabase.from("journal_entries").insert({
          user_id: user.id,
          user_session_id: user.id,
          content: note,
          mood: getMoodEmoji(selectedMood),
          source: "mood-checkin",
        } as any);
      }

      const localData = checkins.filter(c => new Date(c.created_at).toDateString() !== new Date().toDateString());
      localData.unshift({
        id: Date.now().toString(),
        mood_value: selectedMood,
        feelings: selectedFeelings,
        note: note.trim() || null,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("mindmate-moods", JSON.stringify(localData.slice(0, 90)));

      toast({
        title: t("mood.saved"),
        description: t("mood.savedDesc"),
      });

      setHasSavedToday(true);
      logActivity("mood_checkin");
      loadCheckins();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error saving:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = useMemo(() => checkins.map(c => ({ date: c.created_at, value: c.mood_value })), [checkins]);

  const averageMood = useMemo(() => checkins.length > 0
    ? Math.round(checkins.reduce((sum, c) => sum + c.mood_value, 0) / checkins.length * 10) / 10
    : null, [checkins]);

  const lowMoodDays = useMemo(() => checkins.filter(c => c.mood_value <= 2), [checkins]);

  const timeFilterKeys: Record<TimeFilter, string> = {
    "7d": "mood.filter7d",
    "30d": "mood.filter30d",
    "90d": "mood.filter90d",
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={t("mood.title")}
        subtitle={t("mood.subtitle")}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-8">
        <div className="max-w-lg mx-auto space-y-5">
          <TabHint tabId="mood" />

          {/* Today's Check-in */}
          <CalmCard variant="calm" animate={false}>
            <div className="space-y-5">
              <div 
                className={`text-center ${hasSavedToday ? "cursor-pointer" : ""}`}
                onClick={() => hasSavedToday && setCheckinCollapsed(prev => !prev)}
              >
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-medium text-foreground mb-1">
                    {hasSavedToday ? t("mood.checkedInToday") : t("mood.howDoYouFeel")}
                  </h2>
                  {hasSavedToday && (
                    <motion.div animate={{ rotate: checkinCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  )}
                </div>
                {hasSavedToday && !checkinCollapsed && (
                  <p className="text-sm text-muted-foreground">
                    {t("mood.canUpdate")}
                  </p>
                )}
              </div>

              <AnimatePresence initial={false}>
                {!checkinCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <MoodSelector selected={selectedMood} onSelect={setSelectedMood} size="lg" />

                    {selectedMood !== null && (
                      <div className="space-y-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t("mood.whatDescribesYou")} <span className="opacity-50">({t("mood.optional")})</span>
                          </p>
                          <FeelingTags
                            selected={selectedFeelings}
                            onToggle={(f) => setSelectedFeelings(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                          />
                        </div>

                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={t("mood.addNote")}
                          className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          rows={2}
                        />

                        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                          <Check className="w-4 h-4" />
                          {isSaving ? t("mood.saving") : t("common.save")}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CalmCard>

          {/* Time Filter */}
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as TimeFilter[]).map(filter => (
              <Button
                key={filter}
                variant={timeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className="flex-1"
              >
                {t(timeFilterKeys[filter])}
              </Button>
            ))}
          </div>

          {/* Mood Chart */}
          {checkins.length > 0 && (
            <CalmCard variant="gentle" animate={false}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {t("mood.yourTrend")}
                  </h3>
                  {averageMood && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{t("mood.average")}:</span>
                      <span className="font-medium">{getMoodEmoji(Math.round(averageMood))}</span>
                      <span>{averageMood.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <MoodChart data={chartData} showLabels={timeFilter === "7d"} />
              </div>
            </CalmCard>
          )}

          {/* Low Mood Days */}
          {lowMoodDays.length > 0 && (
            <CalmCard variant="gentle" animate={false} className="cursor-pointer" onClick={() => navigate("/journal")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {t("mood.exploreDifficultDays")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {lowMoodDays.length} {lowMoodDays.length === 1 ? t("mood.dayWithLowMood") : t("mood.daysWithLowMood")}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CalmCard>
          )}

          {/* Talk About It */}
          <CalmCard variant="gentle" animate={false} className="cursor-pointer" onClick={() => navigate("/chat")}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">
                  {t("mood.wantToTalk")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("mood.startConversation")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CalmCard>

          {/* 90-Day Heatmap */}
          {checkins.length >= 3 && (
            <CalmCard variant="gentle" animate={false}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">
                    {t("mood.heatmapTitle")}
                  </h3>
                </div>
                <MoodHeatmap checkins={checkins} weeks={13} />
              </div>
            </CalmCard>
          )}

          {/* Insights */}
          {checkins.length >= 5 && (
            <CalmCard variant="gentle" animate={false}>
              <div className="space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {t("mood.insightsTitle")}
                </h3>
                <MoodInsights checkins={checkins} />
              </div>
            </CalmCard>
          )}

          {/* Community Insights (Social Proof) */}
          {checkins.length >= 3 && (
            <CalmCard variant="gentle" animate={false}>
              <div className="space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {t("mood.communityTitle")}
                </h3>
                <CommunityInsights checkins={checkins} />
              </div>
            </CalmCard>
          )}
          {!isLoading && checkins.length === 0 && (
            <CalmCard variant="gentle" animate={false} className="text-center py-8">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {t("mood.noCheckins")}
              </p>
            </CalmCard>
          )}
        </div>
      </div>
    </div>
  );
}
