import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, TrendingUp, Calendar, Filter, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { MoodSelector, getMoodEmoji, getMoodLabel } from "@/components/mood/MoodSelector";
import { FeelingTags } from "@/components/mood/FeelingTags";
import { MoodChart } from "@/components/mood/MoodChart";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

  const { language } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
        feelings: d.feelings || [],
        note: d.note,
        created_at: d.created_at,
      }));

      setCheckins(mapped);

      // Check if saved today
      const today = new Date().toDateString();
      const todayCheckin = mapped.find(c => new Date(c.created_at).toDateString() === today);
      if (todayCheckin) {
        setHasSavedToday(true);
        setSelectedMood(todayCheckin.mood_value);
        setSelectedFeelings(todayCheckin.feelings);
        setNote(todayCheckin.note || "");
      }
    } catch (error) {
      console.error("Error loading checkins:", error);
      // Fallback to localStorage
      const stored = localStorage.getItem("mindmate-moods");
      if (stored) {
        const localData = JSON.parse(stored);
        setCheckins(localData.map((d: any) => ({
          id: d.id || Date.now().toString(),
          mood_value: d.mood,
          feelings: d.feelings || [],
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
      // Remove today's existing checkin if updating
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

      // Insert new checkin
      const { error } = await supabase.from("mood_checkins").insert({
        user_id: user.id,
        user_session_id: user.id, // Legacy field for compatibility
        mood_value: selectedMood,
        feelings: selectedFeelings,
        note: note.trim() || null,
      } as any);

      if (error) throw error;

      // Also save to journal if there's a note
      if (note.trim()) {
        await supabase.from("journal_entries").insert({
          user_id: user.id,
          user_session_id: user.id, // Legacy field for compatibility
          content: note,
          mood: getMoodEmoji(selectedMood),
          source: "mood-checkin",
        } as any);
      }

      // Sync to localStorage as backup
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
        title: language === "de" ? "Stimmung gespeichert" : "Mood saved",
        description: language === "de" ? "Dein Check-in wurde gespeichert." : "Your check-in has been saved.",
      });

      setHasSavedToday(true);
      loadCheckins();
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: language === "de" ? "Fehler" : "Error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = checkins.map(c => ({ date: c.created_at, value: c.mood_value }));

  const averageMood = checkins.length > 0
    ? Math.round(checkins.reduce((sum, c) => sum + c.mood_value, 0) / checkins.length * 10) / 10
    : null;

  const lowMoodDays = checkins.filter(c => c.mood_value <= 2);

  const timeFilterLabels = {
    "7d": language === "de" ? "7 Tage" : "7 days",
    "30d": language === "de" ? "30 Tage" : "30 days",
    "90d": language === "de" ? "90 Tage" : "90 days",
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={language === "de" ? "Stimmung" : "Mood"}
        subtitle={language === "de" ? "Wie geht es dir gerade?" : "How are you feeling right now?"}
      />

      <div className="px-4 md:px-6 lg:px-8 py-5 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-5">
        {/* Today's Check-in */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <CalmCard variant="calm">
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-medium text-foreground mb-1">
                  {hasSavedToday
                    ? (language === "de" ? "Heute eingecheckt ✓" : "Checked in today ✓")
                    : (language === "de" ? "Wie fühlst du dich?" : "How do you feel?")}
                </h2>
                {hasSavedToday && (
                  <p className="text-sm text-muted-foreground">
                    {language === "de" ? "Du kannst aktualisieren" : "You can update"}
                  </p>
                )}
              </div>

              <MoodSelector selected={selectedMood} onSelect={setSelectedMood} size="lg" />

              {selectedMood !== null && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {language === "de" ? "Was beschreibt dich gerade?" : "What describes you now?"} <span className="opacity-50">({language === "de" ? "optional" : "optional"})</span>
                    </p>
                    <FeelingTags
                      selected={selectedFeelings}
                      onToggle={(f) => setSelectedFeelings(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                      language={language as "en" | "de"}
                    />
                  </div>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={language === "de" ? "Möchtest du etwas hinzufügen?" : "Want to add anything?"}
                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={2}
                  />

                  <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                    <Check className="w-4 h-4" />
                    {isSaving ? (language === "de" ? "Speichern..." : "Saving...") : (language === "de" ? "Speichern" : "Save")}
                  </Button>
                </motion.div>
              )}
            </div>
          </CalmCard>
        </motion.div>

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
              {timeFilterLabels[filter]}
            </Button>
          ))}
        </div>

        {/* Mood Chart */}
        {checkins.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CalmCard variant="gentle">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {language === "de" ? "Dein Verlauf" : "Your Trend"}
                  </h3>
                  {averageMood && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{language === "de" ? "Ø" : "Avg"}:</span>
                      <span className="font-medium">{getMoodEmoji(Math.round(averageMood))}</span>
                      <span>{averageMood.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <MoodChart data={chartData} showLabels={timeFilter === "7d"} />
              </div>
            </CalmCard>
          </motion.div>
        )}

        {/* Low Mood Days - Link to Journal */}
        {lowMoodDays.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CalmCard variant="gentle" className="cursor-pointer hover:bg-gentle/10" onClick={() => navigate("/journal")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gentle/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gentle" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {language === "de" ? "Schwierige Tage erkunden" : "Explore difficult days"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {lowMoodDays.length} {language === "de" ? "Tage mit niedriger Stimmung" : "days with low mood"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CalmCard>
          </motion.div>
        )}

        {/* Talk About It */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <CalmCard variant="gentle" className="cursor-pointer hover:bg-gentle/10" onClick={() => navigate("/chat")}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">
                  {language === "de" ? "Darüber sprechen?" : "Want to talk about it?"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === "de" ? "Starte ein Gespräch über deine Gefühle" : "Start a conversation about how you feel"}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CalmCard>
        </motion.div>

        {/* Empty State */}
        {!isLoading && checkins.length === 0 && (
          <CalmCard variant="gentle" className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {language === "de" ? "Noch keine Check-ins in diesem Zeitraum" : "No check-ins in this period yet"}
            </p>
          </CalmCard>
        )}
      </div>
    </div>
  );
}
