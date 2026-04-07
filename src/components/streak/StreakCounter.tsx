import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface StreakCounterProps {
  currentStreak: number;
  isActiveToday: boolean;
  isLoading?: boolean;
}

export function StreakCounter({ currentStreak, isActiveToday, isLoading }: StreakCounterProps) {
  const { t } = useTranslation();

  if (isLoading || currentStreak === 0) return null;

  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Identity-based streak label
  const getStreakLabel = () => {
    if (currentStreak === 1) return t("streak.singleDay");
    return t("streak.connected").replace("{days}", String(currentStreak));
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
      title={getStreakLabel()}
    >
      <motion.div
        animate={isActiveToday && !prefersReducedMotion ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
      >
        <Flame className={`w-4 h-4 ${isActiveToday ? "text-primary" : "text-muted-foreground"}`} />
      </motion.div>
      <span className="text-sm font-semibold text-foreground">{currentStreak}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {currentStreak === 1 ? t("streak.day") : t("streak.days")}
      </span>
    </motion.div>
  );
}
