import { motion } from "framer-motion";

interface FeelingTagsProps {
  selected: string[];
  onToggle: (feeling: string) => void;
  language?: "en" | "de";
}

const feelings = {
  en: [
    "Anxious",
    "Stressed",
    "Overwhelmed",
    "Sad",
    "Lonely",
    "Frustrated",
    "Grateful",
    "Hopeful",
    "Calm",
    "Tired",
    "Motivated",
    "Content",
  ],
  de: [
    "Ängstlich",
    "Gestresst",
    "Überfordert",
    "Traurig",
    "Einsam",
    "Frustriert",
    "Dankbar",
    "Hoffnungsvoll",
    "Ruhig",
    "Müde",
    "Motiviert",
    "Zufrieden",
  ],
};

export function FeelingTags({ selected, onToggle, language = "en" }: FeelingTagsProps) {
  const feelingList = feelings[language] || feelings.en;

  return (
    <div className="flex flex-wrap gap-2">
      {feelingList.map((feeling) => {
        const isSelected = selected.includes(feeling);

        return (
          <motion.button
            key={feeling}
            onClick={() => onToggle(feeling)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {feeling}
          </motion.button>
        );
      })}
    </div>
  );
}
