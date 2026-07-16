import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Brain, Sparkles, ChevronRight, Flame, BookOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";

interface GrowthDashboardProps {
  patterns: { id: string; description: string; confidence: number }[];
  weeklyStats: {
    activeDays: number;
    moodCheckins: number;
    journalEntries: number;
    chatSessions: number;
  };
  currentStreak: number;
  insightCount: number;
}

export function GrowthDashboard({ patterns, weeklyStats, currentStreak, insightCount }: GrowthDashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const hasData = weeklyStats.activeDays > 0 || patterns.length > 0 || insightCount > 0;
  if (!hasData) return null;

  const reflectionScore = Math.min(100, Math.round(
    (weeklyStats.activeDays / 7) * 40 +
    (Math.min(weeklyStats.moodCheckins, 7) / 7) * 20 +
    (Math.min(weeklyStats.journalEntries, 5) / 5) * 20 +
    (Math.min(weeklyStats.chatSessions, 5) / 5) * 20
  ));

  // Personal story narrative based on data
  const getStoryNarrative = (): string => {
    const parts: string[] = [];

    if (currentStreak >= 7) {
      parts.push(`${t("growth.story.longStreakPrefix")}${currentStreak}${t("growth.story.longStreakSuffix")}`);
    } else if (currentStreak >= 3) {
      parts.push(`${currentStreak}${t("growth.story.shortStreakSuffix")}`);
    }

    if (weeklyStats.chatSessions >= 3 && weeklyStats.journalEntries >= 2) {
      parts.push(t("growth.story.combining"));
    } else if (weeklyStats.chatSessions >= 3) {
      parts.push(t("growth.story.selfAware"));
    }

    if (patterns.length >= 2) {
      parts.push(t("growth.story.patterns"));
    }

    if (parts.length === 0) {
      parts.push(t("growth.story.everyStep"));
    }

    return parts[0];
  };

  const getReflectionLabel = () => {
    if (reflectionScore >= 80) return t("growth.reflection.deeplyConnected");
    if (reflectionScore >= 50) return t("growth.reflection.growingSteadily");
    if (reflectionScore >= 20) return t("growth.reflection.gettingStarted");
    return t("growth.reflection.firstSteps");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{t("growth.dashboard")}</span>
        <Button
          variant="ghost" size="sm"
          className="text-muted-foreground h-auto py-1 text-xs"
          onClick={() => navigate("/timeline")}
        >
          {t("growth.seeTimeline")} <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </div>

      <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
        {/* Personal Story Narrative */}
        <div className="p-4 border-b border-border/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-foreground/90 leading-relaxed">{getStoryNarrative()}</p>
            </div>
          </div>
        </div>

        {/* Reflection Score */}
        <div className="px-4 py-3 border-b border-border/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">{t("growth.reflectionScore")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-primary">{reflectionScore}%</span>
              <span className="text-[10px] text-muted-foreground">· {getReflectionLabel()}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${reflectionScore}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-4 divide-x divide-border/20">
          <div className="py-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame className="w-3 h-3 text-orange-400" />
              <p className="text-sm font-semibold text-foreground">{currentStreak}</p>
            </div>
            <p className="text-[9px] text-muted-foreground">{t("growth.dayStreak")}</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-sm font-semibold text-foreground mb-0.5">{weeklyStats.activeDays}</p>
            <p className="text-[9px] text-muted-foreground">{t("growth.daysThisWeek")}</p>
          </div>
          <div className="py-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <MessageSquare className="w-3 h-3 text-primary/60" />
              <p className="text-sm font-semibold text-foreground">{weeklyStats.chatSessions}</p>
            </div>
            <p className="text-[9px] text-muted-foreground">{t("growth.chats")}</p>
          </div>
          <div className="py-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <BookOpen className="w-3 h-3 text-primary/60" />
              <p className="text-sm font-semibold text-foreground">{insightCount}</p>
            </div>
            <p className="text-[9px] text-muted-foreground">{t("growth.insights")}</p>
          </div>
        </div>

        {/* Top Pattern */}
        {patterns.length > 0 && (
          <div className="px-4 py-3 border-t border-border/20 bg-primary/3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                  {t("growth.recurringTheme")}
                </p>
                <p className="text-sm text-foreground/85 leading-relaxed">{patterns[0].description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
