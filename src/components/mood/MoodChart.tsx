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
    <div className="space-y-2">
      {/* Chart bars */}
      <div className="flex items-end justify-between gap-1 h-24">
        {chartData.map((day, index) => {
          const height = day.value ? (day.value / maxValue) * 100 : 0;
          const isToday = index === chartData.length - 1;

          return (
            <div
              key={day.label + index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <motion.div
                className={`w-full max-w-8 rounded-t-lg transition-colors ${
                  day.value
                    ? isToday
                      ? "bg-primary"
                      : "bg-calm/60"
                    : "bg-muted/30"
                }`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 8)}%` }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              />
              {day.value && (
                <span className="text-xs">{getMoodEmoji(day.value)}</span>
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
              className={`text-xs ${
                index === chartData.length - 1
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
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
