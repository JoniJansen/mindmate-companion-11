import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, BookOpen, SmilePlus, Dumbbell } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";

interface ProgressUnlockProps {
  stats: {
    chatSessions: number;
    journalEntries: number;
    moodCheckins: number;
    exercisesCompleted: number;
  };
}

export function ProgressUnlock({ stats }: ProgressUnlockProps) {
  const { t } = useTranslation();

  const milestones = useMemo(() => [
    {
      icon: MessageCircle,
      label: t("progress.milestone.conversations"),
      current: stats.chatSessions,
      target: 10,
    },
    {
      icon: BookOpen,
      label: t("progress.milestone.journalEntries"),
      current: stats.journalEntries,
      target: 5,
    },
    {
      icon: SmilePlus,
      label: t("progress.milestone.moodCheckins"),
      current: stats.moodCheckins,
      target: 7,
    },
    {
      icon: Dumbbell,
      label: t("progress.milestone.exercises"),
      current: stats.exercisesCompleted,
      target: 3,
    },
  ], [stats, t]);

  const totalProgress = useMemo(() => {
    const sum = milestones.reduce((acc, m) => acc + Math.min(m.current / m.target, 1), 0);
    return Math.round((sum / milestones.length) * 100);
  }, [milestones]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-primary/5 border border-primary/10 p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          {t("progress.journeyTitle")}
        </h3>
      </div>

      <div className="space-y-3">
        {milestones.map((m, i) => {
          const Icon = m.icon;
          const pct = Math.min(Math.round((m.current / m.target) * 100), 100);
          return (
            <div key={i} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground truncate">{m.label}</span>
                  <span className="text-xs font-medium text-foreground">
                    {Math.min(m.current, m.target)}/{m.target}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-1 text-center">
        <p className="text-xs text-muted-foreground">
          {totalProgress >= 100
            ? t("progress.completeCTA")
            : `${totalProgress}${t("progress.percentExplored")}`}
        </p>
      </div>
    </motion.div>
  );
}
