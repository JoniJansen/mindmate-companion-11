import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";

const moods = [
  { emoji: "😊", label: "Great", value: 5, color: "bg-primary-soft text-primary" },
  { emoji: "🙂", label: "Good", value: 4, color: "bg-calm-soft text-calm" },
  { emoji: "😐", label: "Okay", value: 3, color: "bg-muted text-muted-foreground" },
  { emoji: "😔", label: "Low", value: 2, color: "bg-gentle-soft text-gentle" },
  { emoji: "😢", label: "Struggling", value: 1, color: "bg-accent-soft text-accent" },
];

const recentMoods = [
  { day: "Mon", mood: 4 },
  { day: "Tue", mood: 3 },
  { day: "Wed", mood: 5 },
  { day: "Thu", mood: 4 },
  { day: "Fri", mood: 3 },
  { day: "Sat", mood: 4 },
  { day: "Today", mood: null },
];

const feelings = [
  "Anxious", "Calm", "Stressed", "Happy", "Tired", "Energetic",
  "Lonely", "Grateful", "Overwhelmed", "Hopeful", "Frustrated", "Content"
];

export default function Mood() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);

  const toggleFeeling = (feeling: string) => {
    setSelectedFeelings((prev) =>
      prev.includes(feeling)
        ? prev.filter((f) => f !== feeling)
        : [...prev, feeling]
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Mood Check-in" subtitle="How are you feeling?" />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Mood selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Right now, I feel...</h2>
          
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
            <h2 className="text-lg font-semibold text-foreground mb-4">I'm also feeling...</h2>
            
            <div className="flex flex-wrap gap-2">
              {feelings.map((feeling) => (
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Any notes?</h2>
            <textarea
              placeholder="What's contributing to how you feel? (optional)"
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
            <Button size="lg" className="w-full">
              Save Check-in
            </Button>
          </motion.div>
        )}

        {/* Weekly overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CalmCard variant="elevated">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">This Week</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                History
              </Button>
            </div>

            <div className="flex justify-between items-end h-20 gap-2">
              {recentMoods.map((day, index) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-lg transition-all ${
                      day.mood
                        ? "bg-primary/20"
                        : "bg-muted border-2 border-dashed border-border"
                    }`}
                    style={{ height: day.mood ? `${day.mood * 12}px` : "16px" }}
                  />
                  <span className={`text-xs ${day.day === "Today" ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Average mood this week</p>
              <div className="flex items-center gap-1">
                <span className="text-lg">🙂</span>
                <span className="font-semibold text-foreground">Good</span>
              </div>
            </div>
          </CalmCard>
        </motion.div>
      </div>
    </div>
  );
}
