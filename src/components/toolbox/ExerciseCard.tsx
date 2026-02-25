import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Exercise } from "@/data/exercises";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
  index: number;
  isCompleted?: boolean;
  translatedTitle?: string;
  translatedDescription?: string;
}

const colorMap: Record<string, string> = {
  calm: "bg-primary/10 text-primary",
  gentle: "bg-primary/10 text-primary",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
};

export function ExerciseCard({ exercise, onClick, index, isCompleted, translatedTitle, translatedDescription }: ExerciseCardProps) {
  const Icon = exercise.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: "easeOut" }}
    >
      <CalmCard 
        variant="elevated" 
        className={`cursor-pointer hover:shadow-elevated transition-all duration-200 ${isCompleted ? 'opacity-70' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl ${colorMap[exercise.color]} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-medium text-foreground leading-tight">{translatedTitle || exercise.title}</h3>
              {isCompleted && (
                <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  ✓
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
              {translatedDescription || exercise.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/30">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{exercise.duration}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          </div>
        </div>
      </CalmCard>
    </motion.div>
  );
}
