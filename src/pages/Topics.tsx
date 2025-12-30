import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Circle, CheckCircle2, Clock, ChevronRight, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";

interface Topic {
  id: string;
  title: string;
  description: string;
  progress: number;
  sessions: number;
  isActive: boolean;
  color: string;
}

const mockTopics: Topic[] = [
  {
    id: "1",
    title: "Managing Work Stress",
    description: "Learning to set boundaries and handle workplace pressure",
    progress: 60,
    sessions: 3,
    isActive: true,
    color: "calm",
  },
  {
    id: "2",
    title: "Building Self-Confidence",
    description: "Developing a more positive self-image",
    progress: 40,
    sessions: 2,
    isActive: true,
    color: "gentle",
  },
  {
    id: "3",
    title: "Better Sleep Habits",
    description: "Creating a healthy sleep routine",
    progress: 100,
    sessions: 5,
    isActive: false,
    color: "primary",
  },
];

const suggestedTopics = [
  { title: "Dealing with Anxiety", icon: "🌿" },
  { title: "Improving Relationships", icon: "💜" },
  { title: "Finding Motivation", icon: "⚡" },
  { title: "Grief & Loss", icon: "🕊️" },
];

export default function Topics() {
  const [topics] = useState<Topic[]>(mockTopics);

  const colorMap: Record<string, string> = {
    calm: "bg-calm/20 border-calm/30",
    gentle: "bg-gentle/20 border-gentle/30",
    primary: "bg-primary/20 border-primary/30",
    accent: "bg-accent/20 border-accent/30",
  };

  const progressColorMap: Record<string, string> = {
    calm: "bg-calm",
    gentle: "bg-gentle",
    primary: "bg-primary",
    accent: "bg-accent",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Topics" subtitle="What would you like to work on?" />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <CalmCard variant="calm" className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-4 h-4 text-calm" />
              <span className="text-2xl font-bold text-foreground">2</span>
            </div>
            <p className="text-xs text-muted-foreground">Active Topics</p>
          </CalmCard>
          <CalmCard variant="gentle" className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-gentle" />
              <span className="text-2xl font-bold text-foreground">10</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </CalmCard>
        </motion.div>

        {/* Active topics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Topics</h2>
          
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CalmCard 
                  variant="elevated" 
                  className={`border-l-4 ${colorMap[topic.color]} cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{topic.title}</h3>
                        {topic.progress === 100 && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${progressColorMap[topic.color]} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.progress}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{topic.progress}% complete</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {topic.sessions} sessions
                    </div>
                  </div>
                </CalmCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Add new topic */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Suggested Topics</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {suggestedTopics.map((topic) => (
              <CalmCard
                key={topic.title}
                variant="default"
                className="cursor-pointer hover:shadow-card transition-shadow"
              >
                <div className="text-2xl mb-2">{topic.icon}</div>
                <p className="text-sm font-medium text-foreground">{topic.title}</p>
              </CalmCard>
            ))}
          </div>

          <Button variant="soft" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Topic
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
