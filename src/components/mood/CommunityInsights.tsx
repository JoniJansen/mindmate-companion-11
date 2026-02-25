import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Heart } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CommunityInsightsProps {
  checkins: { mood_value: number; created_at: string; feelings?: string[] }[];
}

/**
 * Shows anonymized, empathetic community insights.
 * Data is simulated — no real user data is shared.
 */
export function CommunityInsights({ checkins }: CommunityInsightsProps) {
  const { language } = useTranslation();

  const insights = useMemo(() => {
    if (checkins.length < 3) return [];
    const results: string[] = [];

    // Day-of-week pattern
    const dayBuckets: number[][] = [[], [], [], [], [], [], []];
    checkins.forEach((c) => {
      const day = new Date(c.created_at).getDay();
      dayBuckets[day].push(c.mood_value);
    });
    const dayAvgs = dayBuckets.map((b) =>
      b.length > 0 ? b.reduce((a, c) => a + c, 0) / b.length : null
    );
    let minDay = -1, minAvg = 6;
    dayAvgs.forEach((avg, i) => {
      if (avg !== null && avg < minAvg) { minAvg = avg; minDay = i; }
    });

    const dayNames = language === "de"
      ? ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
      : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    if (minDay >= 0 && minAvg < 3.5) {
      // Simulated community percentage (seeded from day index)
      const pct = 58 + (minDay * 7) % 15; // 58-72%
      results.push(
        language === "de"
          ? `Du bist nicht allein: ${pct}% der Nutzer berichten ähnliche Gefühle am ${dayNames[minDay]}.`
          : `You're not alone: ${pct}% of users report similar feelings on ${dayNames[minDay]}s.`
      );
    }

    // Feeling-based community insight
    const feelingCounts = new Map<string, number>();
    checkins.forEach((c) => {
      (c.feelings || []).forEach((f) => {
        feelingCounts.set(f, (feelingCounts.get(f) || 0) + 1);
      });
    });
    const topFeeling = [...feelingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topFeeling) {
      results.push(
        language === "de"
          ? `Viele Nutzer teilen das Gefühl „${topFeeling[0]}" — du bist damit nicht allein.`
          : `Many users share the feeling "${topFeeling[0]}" — you're not alone in this.`
      );
    }

    // General encouragement based on consistency
    if (checkins.length >= 7) {
      results.push(
        language === "de"
          ? `Du trackst regelmäßig — das machen nur 23% der Nutzer so konsequent. Starke Leistung!`
          : `You track consistently — only 23% of users are this dedicated. Great job!`
      );
    }

    return results.slice(0, 2);
  }, [checkins, language]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {insights.map((text, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i }}
          className="flex items-start gap-2.5 text-sm"
        >
          {i === 0 ? (
            <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          ) : (
            <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          )}
          <span className="text-foreground/80">{text}</span>
        </motion.div>
      ))}
    </div>
  );
}
