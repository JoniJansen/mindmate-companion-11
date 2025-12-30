import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Lock, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";

interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  preview: string;
  mood?: string;
  isLocked?: boolean;
}

const mockEntries: JournalEntry[] = [
  {
    id: "1",
    date: new Date(),
    title: "A moment of clarity",
    preview: "Today I realized that taking small breaks throughout the day really helps me...",
    mood: "😊",
  },
  {
    id: "2",
    date: new Date(Date.now() - 86400000),
    title: "Working through stress",
    preview: "I've been feeling overwhelmed with work lately, but I tried the breathing...",
    mood: "😮‍💨",
  },
  {
    id: "3",
    date: new Date(Date.now() - 86400000 * 2),
    title: "Gratitude practice",
    preview: "Three things I'm grateful for today: my morning coffee, a good conversation...",
    mood: "🙏",
  },
  {
    id: "4",
    date: new Date(Date.now() - 86400000 * 5),
    title: "Private thoughts",
    preview: "This entry is locked",
    isLocked: true,
    mood: "🔒",
  },
];

const formatDate = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function Journal() {
  const [entries] = useState<JournalEntry[]>(mockEntries);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Journal" subtitle="Your private space" />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search entries..."
            className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
        </div>

        {/* New entry button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button variant="calm" className="w-full justify-start gap-3" size="lg">
            <Plus className="w-5 h-5" />
            New Journal Entry
          </Button>
        </motion.div>

        {/* Entries list */}
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CalmCard variant="elevated" className="cursor-pointer hover:shadow-elevated transition-shadow">
                <div className="flex items-start gap-3">
                  {/* Mood emoji */}
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                    {entry.mood}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {entry.title}
                      </h3>
                      {entry.isLocked && (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {entry.isLocked ? "Tap to unlock and view" : entry.preview}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.date)}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CalmCard>
            </motion.div>
          ))}
        </div>

        {/* Writing prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <CalmCard variant="gentle">
            <h4 className="font-medium text-foreground mb-2">Today's Prompt</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              "What small moment brought you peace today? It could be as simple as a warm drink or a kind word."
            </p>
          </CalmCard>
        </motion.div>
      </div>
    </div>
  );
}
