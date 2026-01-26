import { useMemo } from "react";
import { motion } from "framer-motion";
import { getMoodEmoji } from "./MoodSelector";

interface MoodDataPoint {
  date: string;
  value: number;
}

interface MoodChartProps {
  data: MoodDataPoint[];
  showLabels?: boolean;
}

export function MoodChart({ data, showLabels = true }: MoodChartProps) {
  const chartData = useMemo(() => {
    // Get last 7 days
    const days: { label: string; value: number | null; date: Date }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const entry = data.find((d) => d.date.startsWith(dateStr));

      days.push({
        label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
        value: entry?.value || null,
        date,
      });
    }

    return days;
  }, [data]);

  const maxValue = 5;

  return (
    <div className="space-y-3">
      {/* Chart bars */}
      <div className="flex items-end justify-between gap-1.5 h-28">
        {chartData.map((day, index) => {
          const height = day.value ? (day.value / maxValue) * 100 : 0;
          const isToday = index === chartData.length - 1;

          return (
            <div
              key={day.label + index}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <motion.div
                className={`w-full max-w-9 rounded-lg transition-colors ${
                  day.value
                    ? isToday
                      ? "bg-primary shadow-soft"
                      : "bg-calm/50"
                    : "bg-muted/25 border border-border/30"
                }`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 10)}%` }}
                transition={{ delay: index * 0.04, duration: 0.25, ease: "easeOut" }}
              />
              {day.value && (
                <span className="text-sm">{getMoodEmoji(day.value)}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between px-1">
          {chartData.map((day, index) => (
            <span
              key={day.label + index}
              className={`text-xs font-medium ${
                index === chartData.length - 1
                  ? "text-primary"
                  : "text-muted-foreground/70"
              }`}
            >
              {day.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
