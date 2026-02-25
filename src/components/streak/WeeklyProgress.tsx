import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Flame, BookOpen, Heart, Dumbbell, MessageCircle } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";

interface WeeklyProgressProps {
  activeDays: number;
  moodCheckins: number;
  journalEntries: number;
  exercisesCompleted: number;
  chatSessions: number;
  lastWeekActiveDays: number;
  currentStreak: number;
}

export function WeeklyProgress({
  activeDays,
  moodCheckins,
  journalEntries,
  exercisesCompleted,
  chatSessions,
  lastWeekActiveDays,
  currentStreak,
}: WeeklyProgressProps) {
  const { t } = useTranslation();

  const trend = activeDays - lastWeekActiveDays;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-primary" : trend < 0 ? "text-destructive" : "text-muted-foreground";

  const stats = [
    { icon: Heart, value: moodCheckins, label: t("streak.moodCheckins"), color: "text-gentle" },
    { icon: BookOpen, value: journalEntries, label: t("streak.journalEntries"), color: "text-calm" },
    { icon: Dumbbell, value: exercisesCompleted, label: t("streak.exercises"), color: "text-accent" },
    { icon: MessageCircle, value: chatSessions, label: t("streak.chatSessions"), color: "text-primary" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <CalmCard variant="gentle" animate={false}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground text-sm">
              {t("streak.weeklyProgress")}
            </h3>
            <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>
                {trend > 0 ? "+" : ""}{trend} {t("streak.vsLastWeek")}
              </span>
            </div>
          </div>

          {/* Active days bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {activeDays}/7 {t("streak.daysActive")}
                </span>
              </div>
              {currentStreak > 0 && (
                <span className="text-xs text-muted-foreground">
                  🔥 {currentStreak} {t("streak.streak")}
                </span>
              )}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(activeDays / 7) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5 p-2 rounded-xl bg-background/50">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <div>
                  <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                  <span className="text-xs text-muted-foreground ml-1">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Validating message */}
          <p className="text-xs text-muted-foreground text-center pt-1">
            {activeDays === 0
              ? t("streak.startToday")
              : t("streak.validatingMessage").replace("{days}", String(activeDays))}
          </p>
        </div>
      </CalmCard>
    </motion.div>
  );
}
