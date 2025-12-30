import { motion } from "framer-motion";
import { 
  Wind, 
  Moon, 
  Heart, 
  Brain, 
  Sparkles, 
  Timer, 
  Volume2, 
  Play,
  ChevronRight,
  Headphones
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: typeof Wind;
  category: string;
  color: string;
}

const exercises: Exercise[] = [
  {
    id: "1",
    title: "Box Breathing",
    description: "A calming 4-4-4-4 breathing technique",
    duration: "4 min",
    icon: Wind,
    category: "Breathing",
    color: "calm",
  },
  {
    id: "2",
    title: "Body Scan",
    description: "Progressive relaxation from head to toe",
    duration: "10 min",
    icon: Sparkles,
    category: "Relaxation",
    color: "gentle",
  },
  {
    id: "3",
    title: "Grounding 5-4-3-2-1",
    description: "Use your senses to anchor to the present",
    duration: "5 min",
    icon: Heart,
    category: "Grounding",
    color: "accent",
  },
  {
    id: "4",
    title: "Thought Reframing",
    description: "Challenge and reframe negative thoughts",
    duration: "8 min",
    icon: Brain,
    category: "Cognitive",
    color: "primary",
  },
  {
    id: "5",
    title: "Sleep Story",
    description: "A gentle narrative to ease into sleep",
    duration: "15 min",
    icon: Moon,
    category: "Sleep",
    color: "gentle",
  },
];

const quickActions = [
  { icon: Wind, label: "Breathe", color: "calm" },
  { icon: Timer, label: "Timer", color: "primary" },
  { icon: Headphones, label: "Sounds", color: "gentle" },
  { icon: Volume2, label: "Music", color: "accent" },
];

export default function Toolbox() {
  const colorMap: Record<string, string> = {
    calm: "bg-calm-soft text-calm",
    gentle: "bg-gentle-soft text-gentle",
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Toolbox" subtitle="Exercises & resources" />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl ${colorMap[action.color]} transition-all`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium">{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Featured exercise */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <CalmCard variant="calm" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-calm/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <span className="text-xs font-medium text-calm bg-calm/20 px-2 py-1 rounded-full">
                Recommended
              </span>
              <h3 className="text-lg font-semibold text-foreground mt-3 mb-2">
                Evening Wind Down
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                A gentle 10-minute routine to help you transition from day to evening.
              </p>
              <Button size="sm" variant="calm">
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </div>
          </CalmCard>
        </motion.div>

        {/* All exercises */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">All Exercises</h2>
          
          <div className="space-y-3">
            {exercises.map((exercise, index) => {
              const Icon = exercise.icon;
              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <CalmCard 
                    variant="elevated" 
                    className="cursor-pointer hover:shadow-elevated transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colorMap[exercise.color]} flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{exercise.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {exercise.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {exercise.duration}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CalmCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
