import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Checkin {
  mood_value: number;
  created_at: string;
  feelings?: string[];
}

interface MoodInsightsProps {
  checkins: Checkin[];
}

export function MoodInsights({ checkins }: MoodInsightsProps) {
  const { t } = useTranslation();

  const insights = useMemo(() => {
    if (checkins.length < 5) return [];
    const results: { icon: typeof TrendingUp; text: string }[] = [];

    // Day-of-week analysis
    const dayBuckets: number[][] = [[], [], [], [], [], [], []];
    checkins.forEach((c) => {
      const day = new Date(c.created_at).getDay();
      dayBuckets[day].push(c.mood_value);
    });
    const dayAvgs = dayBuckets.map((b) => (b.length > 0 ? b.reduce((a, c) => a + c, 0) / b.length : null));
    const dayNames = [
      t("mood.insights.dayName.sundays"),
      t("mood.insights.dayName.mondays"),
      t("mood.insights.dayName.tuesdays"),
      t("mood.insights.dayName.wednesdays"),
      t("mood.insights.dayName.thursdays"),
      t("mood.insights.dayName.fridays"),
      t("mood.insights.dayName.saturdays"),
    ];

    // Find hardest and best day
    let minDay = -1, maxDay = -1, minAvg = 6, maxAvg = 0;
    dayAvgs.forEach((avg, i) => {
      if (avg !== null && avg < minAvg) { minAvg = avg; minDay = i; }
      if (avg !== null && avg > maxAvg) { maxAvg = avg; maxDay = i; }
    });

    if (minDay >= 0 && maxAvg - minAvg >= 0.5) {
      results.push({
        icon: TrendingDown,
        text: `${dayNames[minDay]}${t("mood.insights.hardestDaysMiddle")}${minAvg.toFixed(1)}).`,
      });
    }
    if (maxDay >= 0 && maxAvg - minAvg >= 0.5) {
      results.push({
        icon: TrendingUp,
        text: `${dayNames[maxDay]}${t("mood.insights.bestDaysMiddle")}${maxAvg.toFixed(1)}).`,
      });
    }

    // Trend: last 7 vs previous 7
    const sorted = [...checkins].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const recent7 = sorted.slice(0, 7);
    const prev7 = sorted.slice(7, 14);
    if (recent7.length >= 3 && prev7.length >= 3) {
      const recentAvg = recent7.reduce((s, c) => s + c.mood_value, 0) / recent7.length;
      const prevAvg = prev7.reduce((s, c) => s + c.mood_value, 0) / prev7.length;
      const diff = recentAvg - prevAvg;
      if (Math.abs(diff) >= 0.3) {
        results.push({
          icon: diff > 0 ? TrendingUp : TrendingDown,
          text: diff > 0
            ? `${t("mood.insights.moodImprovedPrefix")}${diff.toFixed(1)}).`
            : `${t("mood.insights.moodDippedPrefix")}${diff.toFixed(1)}).`,
        });
      } else {
        results.push({
          icon: Minus,
          text: t("mood.insights.moodStable"),
        });
      }
    }

    // Top feelings
    const feelingCounts = new Map<string, number>();
    checkins.forEach((c) => {
      (c.feelings || []).forEach((f) => {
        feelingCounts.set(f, (feelingCounts.get(f) || 0) + 1);
      });
    });
    const topFeelings = [...feelingCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([f]) => f);
    if (topFeelings.length > 0) {
      results.push({
        icon: Lightbulb,
        text: `${t("mood.insights.topFeelingsPrefix")}${topFeelings.join(", ")}.`,
      });
    }

    return results.slice(0, 4);
  }, [checkins, t]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      {insights.map((insight, i) => {
        const Icon = insight.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-start gap-2.5 text-sm"
          >
            <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground/80">{insight.text}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
