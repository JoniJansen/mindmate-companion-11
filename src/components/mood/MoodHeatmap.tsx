import { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface MoodHeatmapProps {
  checkins: { mood_value: number; created_at: string }[];
  weeks?: number;
}

const moodColor = (value: number): string => {
  if (value >= 4.5) return "bg-emerald-400 dark:bg-emerald-500";
  if (value >= 3.5) return "bg-emerald-300/70 dark:bg-emerald-600/70";
  if (value >= 2.5) return "bg-amber-300/60 dark:bg-amber-500/50";
  if (value >= 1.5) return "bg-orange-300/60 dark:bg-orange-500/50";
  return "bg-red-300/60 dark:bg-red-500/50";
};

export function MoodHeatmap({ checkins, weeks = 12 }: MoodHeatmapProps) {
  const { language } = useTranslation();

  const grid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = weeks * 7;

    // Build a map of date -> avg mood
    const moodByDate = new Map<string, number[]>();
    checkins.forEach((c) => {
      const key = new Date(c.created_at).toISOString().split("T")[0];
      const arr = moodByDate.get(key) || [];
      arr.push(c.mood_value);
      moodByDate.set(key, arr);
    });

    // Build grid columns (weeks), rows (days Mon-Sun)
    const columns: { date: Date; avg: number | null }[][] = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to Monday
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);

    let current = new Date(startDate);
    while (current <= today) {
      const week: { date: Date; avg: number | null }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateKey = current.toISOString().split("T")[0];
        const vals = moodByDate.get(dateKey);
        const avg = vals ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        week.push({ date: new Date(current), avg });
        current.setDate(current.getDate() + 1);
      }
      columns.push(week);
    }

    return columns;
  }, [checkins, weeks]);

  const dayLabels = language === "de"
    ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-2">
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((d, i) => (
            <span key={i} className="text-[9px] text-muted-foreground h-3 flex items-center">
              {i % 2 === 0 ? d : ""}
            </span>
          ))}
        </div>
        {/* Heatmap grid */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => {
              const isFuture = day.date > new Date();
              return (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-[2px] transition-colors ${
                    isFuture
                      ? "bg-transparent"
                      : day.avg !== null
                        ? moodColor(day.avg)
                        : "bg-muted/30"
                  }`}
                  title={day.avg !== null ? `${day.date.toLocaleDateString()}: ${day.avg.toFixed(1)}` : ""}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>{language === "de" ? "Niedrig" : "Low"}</span>
        <div className="w-3 h-3 rounded-[2px] bg-red-300/60 dark:bg-red-500/50" />
        <div className="w-3 h-3 rounded-[2px] bg-orange-300/60 dark:bg-orange-500/50" />
        <div className="w-3 h-3 rounded-[2px] bg-amber-300/60 dark:bg-amber-500/50" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-300/70 dark:bg-emerald-600/70" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-500" />
        <span>{language === "de" ? "Hoch" : "High"}</span>
      </div>
    </div>
  );
}
