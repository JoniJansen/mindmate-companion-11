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
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              isSelected
                ? "bg-primary/85 text-primary-foreground"
                : "bg-muted/50 text-muted-foreground/80 hover:bg-muted/70 hover:text-foreground/80"
            }`}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
          >
            {feeling}
          </motion.button>
        );
      })}
    </div>
  );
}
