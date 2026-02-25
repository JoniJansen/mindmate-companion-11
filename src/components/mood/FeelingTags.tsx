import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { FEELING_TAG_IDS, getFeelingI18nKey } from "@/lib/tagUtils";

interface FeelingTagsProps {
  selected: string[];
  onToggle: (feelingId: string) => void;
}

export function FeelingTags({ selected, onToggle }: FeelingTagsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {FEELING_TAG_IDS.map((feelingId) => {
        const isSelected = selected.includes(feelingId);

        return (
          <motion.button
            key={feelingId}
            onClick={() => onToggle(feelingId)}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              isSelected
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-border/40"
            }`}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {t(getFeelingI18nKey(feelingId))}
          </motion.button>
        );
      })}
    </div>
  );
}
