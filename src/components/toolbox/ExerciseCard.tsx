import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Exercise } from "@/data/exercises";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
  index: number;
  isCompleted?: boolean;
}

const colorMap: Record<string, string> = {
  calm: "bg-calm/10 text-calm",
  gentle: "bg-gentle/10 text-gentle",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
};

export function ExerciseCard({ exercise, onClick, index, isCompleted }: ExerciseCardProps) {
  const Icon = exercise.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <CalmCard 
        variant="elevated" 
        className={`cursor-pointer hover:shadow-elevated transition-shadow ${isCompleted ? 'opacity-70' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${colorMap[exercise.color]} flex items-center justify-center shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground">{exercise.title}</h3>
              {isCompleted && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {exercise.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {exercise.duration}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CalmCard>
    </motion.div>
  );
}
