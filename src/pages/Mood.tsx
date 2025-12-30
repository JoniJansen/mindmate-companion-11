import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { useToast } from "@/hooks/use-toast";

interface MoodEntry {
  date: string;
  mood: number;
  feelings: string[];
  note?: string;
}

interface Preferences {
  language: "en" | "de";
}

const getPreferences = (): Preferences => {
  try {
    const stored = localStorage.getItem("mindmate-preferences");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return { language: "en" };
};

const translations = {
  en: {
    title: "Mood Check-in",
    subtitle: "How are you feeling?",
    rightNow: "Right now, I feel...",
    alsoFeeling: "I'm also feeling...",
    anyNotes: "Any notes?",
    notePlaceholder: "What's contributing to how you feel? (optional)",
    saveCheckin: "Save Check-in",
    thisWeek: "This Week",
    history: "History",
    averageMood: "Average mood this week",
    today: "Today",
    moods: {
      great: "Great",
      good: "Good",
      okay: "Okay",
      low: "Low",
      struggling: "Struggling",
    },
    feelings: ["Anxious", "Calm", "Stressed", "Happy", "Tired", "Energetic", "Lonely", "Grateful", "Overwhelmed", "Hopeful", "Frustrated", "Content"],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    saved: "Check-in saved",
    savedDesc: "Your mood has been recorded.",
  },
  de: {
    title: "Stimmungs-Check",
    subtitle: "Wie fühlst du dich?",
    rightNow: "Gerade fühle ich mich...",
    alsoFeeling: "Außerdem fühle ich mich...",
    anyNotes: "Notizen?",
    notePlaceholder: "Was trägt zu deiner Stimmung bei? (optional)",
    saveCheckin: "Check-in speichern",
    thisWeek: "Diese Woche",
    history: "Verlauf",
    averageMood: "Durchschnittliche Stimmung",
    today: "Heute",
    moods: {
      great: "Super",
      good: "Gut",
      okay: "Okay",
      low: "Gedrückt",
      struggling: "Schwierig",
    },
    feelings: ["Ängstlich", "Ruhig", "Gestresst", "Glücklich", "Müde", "Energiegeladen", "Einsam", "Dankbar", "Überfordert", "Hoffnungsvoll", "Frustriert", "Zufrieden"],
    days: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    saved: "Check-in gespeichert",
    savedDesc: "Deine Stimmung wurde erfasst.",
  },
};

export default function Mood() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [recentMoods, setRecentMoods] = useState<{ day: string; mood: number | null }[]>([]);
  const { toast } = useToast();
  
  const lang = getPreferences().language;
  const t = translations[lang];

  const moods = [
    { emoji: "😊", label: t.moods.great, value: 5, color: "bg-primary-soft text-primary" },
    { emoji: "🙂", label: t.moods.good, value: 4, color: "bg-calm-soft text-calm" },
    { emoji: "😐", label: t.moods.okay, value: 3, color: "bg-muted text-muted-foreground" },
    { emoji: "😔", label: t.moods.low, value: 2, color: "bg-gentle-soft text-gentle" },
    { emoji: "😢", label: t.moods.struggling, value: 1, color: "bg-accent-soft text-accent" },
  ];

  useEffect(() => {
    // Load recent moods from localStorage
    const loadRecentMoods = () => {
      try {
        const stored = localStorage.getItem("mindmate-mood-entries");
        const entries: MoodEntry[] = stored ? JSON.parse(stored) : [];
        
        // Get last 7 days
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const entry = entries.find(e => e.date === dateStr);
          const dayIndex = date.getDay();
          const dayName = i === 0 ? t.today : t.days[dayIndex === 0 ? 6 : dayIndex - 1];
          days.push({ day: dayName, mood: entry?.mood || null });
        }
        setRecentMoods(days);
      } catch {
        setRecentMoods(t.days.map((d, i) => ({ day: i === 6 ? t.today : d, mood: null })));
      }
    };
    loadRecentMoods();
  }, [lang, t.days, t.today]);

  const toggleFeeling = (feeling: string) => {
    setSelectedFeelings((prev) =>
      prev.includes(feeling)
        ? prev.filter((f) => f !== feeling)
        : [...prev, feeling]
    );
  };

  const handleSave = () => {
    if (!selectedMood) return;

    const today = new Date().toISOString().split("T")[0];
    const newEntry: MoodEntry = {
      date: today,
      mood: selectedMood,
      feelings: selectedFeelings,
      note: note || undefined,
    };

    try {
      const stored = localStorage.getItem("mindmate-mood-entries");
      const entries: MoodEntry[] = stored ? JSON.parse(stored) : [];
      
      // Remove existing entry for today if exists
      const filtered = entries.filter(e => e.date !== today);
      filtered.push(newEntry);
      
      // Keep only last 30 days
      const recent = filtered.slice(-30);
      localStorage.setItem("mindmate-mood-entries", JSON.stringify(recent));

      toast({
        title: t.saved,
        description: t.savedDesc,
      });

      // Reset form
      setSelectedMood(null);
      setSelectedFeelings([]);
      setNote("");
      
      // Reload recent moods
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const entry = recent.find(e => e.date === dateStr);
        const dayIndex = date.getDay();
        const dayName = i === 0 ? t.today : t.days[dayIndex === 0 ? 6 : dayIndex - 1];
        days.push({ day: dayName, mood: entry?.mood || null });
      }
      setRecentMoods(days);
    } catch (error) {
      console.error("Failed to save mood:", error);
    }
  };

  const averageMood = recentMoods.filter(m => m.mood).reduce((sum, m) => sum + (m.mood || 0), 0) / (recentMoods.filter(m => m.mood).length || 1);
  const averageLabel = averageMood >= 4.5 ? t.moods.great : averageMood >= 3.5 ? t.moods.good : averageMood >= 2.5 ? t.moods.okay : averageMood >= 1.5 ? t.moods.low : t.moods.struggling;
  const averageEmoji = averageMood >= 4.5 ? "😊" : averageMood >= 3.5 ? "🙂" : averageMood >= 2.5 ? "😐" : averageMood >= 1.5 ? "😔" : "😢";

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Mood selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.rightNow}</h2>
          
          <div className="flex justify-between gap-2">
            {moods.map((mood) => (
              <motion.button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex-1 flex flex-col items-center p-3 rounded-2xl transition-all ${
                  selectedMood === mood.value
                    ? mood.color + " ring-2 ring-offset-2 ring-primary/30"
                    : "bg-card border border-border/50 hover:bg-muted/50"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-3xl mb-1">{mood.emoji}</span>
                <span className="text-xs font-medium">{mood.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Feelings tags */}
        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">{t.alsoFeeling}</h2>
            
            <div className="flex flex-wrap gap-2">
              {t.feelings.map((feeling) => (
                <motion.button
                  key={feeling}
                  onClick={() => toggleFeeling(feeling)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedFeelings.includes(feeling)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {feeling}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Note section */}
        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">{t.anyNotes}</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 min-h-[100px] resize-none"
            />
          </motion.div>
        )}

        {/* Save button */}
        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Button size="lg" className="w-full" onClick={handleSave}>
              {t.saveCheckin}
            </Button>
          </motion.div>
        )}

        {/* Weekly overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CalmCard variant="elevated" animate={false}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">{t.thisWeek}</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                {t.history}
              </Button>
            </div>

            <div className="flex justify-between items-end h-20 gap-2">
              {recentMoods.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-lg transition-all ${
                      day.mood
                        ? "bg-primary/20"
                        : "bg-muted border-2 border-dashed border-border"
                    }`}
                    style={{ height: day.mood ? `${day.mood * 12}px` : "16px" }}
                  />
                  <span className={`text-xs ${day.day === t.today ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t.averageMood}</p>
              <div className="flex items-center gap-1">
                <span className="text-lg">{averageEmoji}</span>
                <span className="font-semibold text-foreground">{averageLabel}</span>
              </div>
            </div>
          </CalmCard>
        </motion.div>
      </div>
    </div>
  );
}
