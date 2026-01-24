import { motion } from "framer-motion";

interface MoodOption {
  emoji: string;
  label: string;
  value: number;
  color: string;
}

interface MoodSelectorProps {
  selected: number | null;
  onSelect: (value: number) => void;
  size?: "sm" | "md" | "lg";
}

const moodOptions: MoodOption[] = [
  { emoji: "😢", label: "Struggling", value: 1, color: "bg-gentle/20" },
  { emoji: "😔", label: "Low", value: 2, color: "bg-gentle/30" },
  { emoji: "😐", label: "Okay", value: 3, color: "bg-muted" },
  { emoji: "🙂", label: "Good", value: 4, color: "bg-calm/30" },
  { emoji: "😊", label: "Great", value: 5, color: "bg-calm/20" },
];

export function MoodSelector({ selected, onSelect, size = "md" }: MoodSelectorProps) {
  const sizeClasses = {
    sm: { button: "w-10 h-10", emoji: "text-lg" },
    md: { button: "w-14 h-14", emoji: "text-2xl" },
    lg: { button: "w-16 h-16", emoji: "text-3xl" },
  };

  return (
    <div className="flex justify-between gap-2">
      {moodOptions.map((mood) => {
        const isSelected = selected === mood.value;

        return (
          <motion.button
            key={mood.value}
            onClick={() => onSelect(mood.value)}
            className={`${sizeClasses[size].button} rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? `${mood.color} ring-2 ring-primary ring-offset-2 ring-offset-background`
                : "bg-muted/50 hover:bg-muted"
            }`}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className={sizeClasses[size].emoji}>{mood.emoji}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function getMoodEmoji(value: number): string {
  return moodOptions.find((m) => m.value === value)?.emoji || "😐";
}

export function getMoodLabel(value: number, language: "en" | "de" = "en"): string {
  const labels: Record<number, { en: string; de: string }> = {
    1: { en: "Struggling", de: "Schwer" },
    2: { en: "Low", de: "Niedrig" },
    3: { en: "Okay", de: "Okay" },
    4: { en: "Good", de: "Gut" },
    5: { en: "Great", de: "Sehr gut" },
  };
  return labels[value]?.[language] || labels[3][language];
}

export { moodOptions };
