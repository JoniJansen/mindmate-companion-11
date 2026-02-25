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
  const { language } = useTranslation();

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
    const dayNames = language === "de"
      ? ["Sonntage", "Montage", "Dienstage", "Mittwoche", "Donnerstage", "Freitage", "Samstage"]
      : ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

    // Find hardest and best day
    let minDay = -1, maxDay = -1, minAvg = 6, maxAvg = 0;
    dayAvgs.forEach((avg, i) => {
      if (avg !== null && avg < minAvg) { minAvg = avg; minDay = i; }
      if (avg !== null && avg > maxAvg) { maxAvg = avg; maxDay = i; }
    });

    if (minDay >= 0 && maxAvg - minAvg >= 0.5) {
      results.push({
        icon: TrendingDown,
        text: language === "de"
          ? `${dayNames[minDay]} sind für dich herausfordernder (Ø ${minAvg.toFixed(1)}).`
          : `${dayNames[minDay]} tend to be harder for you (avg ${minAvg.toFixed(1)}).`,
      });
    }
    if (maxDay >= 0 && maxAvg - minAvg >= 0.5) {
      results.push({
        icon: TrendingUp,
        text: language === "de"
          ? `${dayNames[maxDay]} sind deine besten Tage (Ø ${maxAvg.toFixed(1)}).`
          : `${dayNames[maxDay]} are your best days (avg ${maxAvg.toFixed(1)}).`,
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
            ? (language === "de" ? `Deine Stimmung hat sich zuletzt verbessert (+${diff.toFixed(1)}).` : `Your mood has improved recently (+${diff.toFixed(1)}).`)
            : (language === "de" ? `Deine Stimmung war zuletzt etwas niedriger (${diff.toFixed(1)}).` : `Your mood dipped a bit recently (${diff.toFixed(1)}).`),
        });
      } else {
        results.push({
          icon: Minus,
          text: language === "de" ? "Deine Stimmung ist stabil geblieben." : "Your mood has been stable.",
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
        text: language === "de"
          ? `Deine häufigsten Gefühle: ${topFeelings.join(", ")}.`
          : `Your most frequent feelings: ${topFeelings.join(", ")}.`,
      });
    }

    return results.slice(0, 4);
  }, [checkins, language]);

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
