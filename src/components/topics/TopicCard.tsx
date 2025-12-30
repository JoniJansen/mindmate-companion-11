import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Topic } from "@/data/topics";

interface TopicCardProps {
  topic: Topic;
  progress?: number;
  onClick: () => void;
  index: number;
}

const colorMap: Record<string, string> = {
  calm: "border-l-calm bg-calm/5",
  gentle: "border-l-gentle bg-gentle/5",
  primary: "border-l-primary bg-primary/5",
  accent: "border-l-accent bg-accent/5",
  warm: "border-l-orange-400 bg-orange-50/50 dark:bg-orange-900/10",
};

export function TopicCard({ topic, progress = 0, onClick, index }: TopicCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <CalmCard 
        variant="elevated" 
        className={`border-l-4 ${colorMap[topic.color]} cursor-pointer hover:shadow-elevated transition-shadow`}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
            {topic.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">{topic.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{topic.description}</p>
            {progress > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </CalmCard>
    </motion.div>
  );
}
