import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface BondIndicatorProps {
  bondLevel: number;
  companionName: string;
  compact?: boolean;
}

const MILESTONES = [
  { level: 0, de: "Erster Kontakt", en: "First contact" },
  { level: 3, de: "Ihr lernt euch kennen", en: "Getting to know each other" },
  { level: 7, de: "Ein vertrautes Gefühl entsteht", en: "A sense of trust is growing" },
  { level: 15, de: "Eure Gespräche bekommen mehr Tiefe", en: "Your conversations gain more depth" },
  { level: 25, de: "Eine echte Verbindung", en: "A genuine connection" },
  { level: 50, de: "Tiefes Verständnis", en: "Deep understanding" },
];

function getMilestone(level: number, language: string) {
  let current = MILESTONES[0];
  for (const m of MILESTONES) {
    if (level >= m.level) current = m;
    else break;
  }
  return language === "de" ? current.de : current.en;
}

// Returns a value 0-1 representing progress to next milestone
function getProgress(level: number): number {
  const thresholds = MILESTONES.map(m => m.level);
  let currentIdx = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (level >= thresholds[i]) currentIdx = i;
  }
  const current = thresholds[currentIdx];
  const next = thresholds[currentIdx + 1] ?? current + 20;
  if (next === current) return 1;
  return Math.min(1, (level - current) / (next - current));
}

export function BondIndicator({ bondLevel, companionName, compact = false }: BondIndicatorProps) {
  const { language } = useTranslation();
  const milestone = getMilestone(bondLevel, language);
  const progress = getProgress(bondLevel);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{milestone}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {language === "de" ? "Eure Verbindung" : "Your connection"}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-muted-foreground/80 italic">{milestone}</p>
    </div>
  );
}
