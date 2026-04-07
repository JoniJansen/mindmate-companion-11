import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface FeatureRow {
  name: { en: string; de: string };
  free: boolean;
  premium: boolean;
}

const featureRows: FeatureRow[] = [
  { name: { en: "Chat (Talk & Calm)", de: "Chat (Reden & Beruhigen)" }, free: true, premium: true },
  { name: { en: "Mood check-ins", de: "Stimmungs-Check-ins" }, free: true, premium: true },
  { name: { en: "Free journaling", de: "Freies Tagebuch" }, free: true, premium: true },
  { name: { en: "Core exercises", de: "Kern-Übungen" }, free: true, premium: true },
  { name: { en: "Crisis resources", de: "Krisenressourcen" }, free: true, premium: true },
  { name: { en: "Unlimited conversations", de: "Unbegrenzte Gespräche" }, free: false, premium: true },
  { name: { en: "Voice conversations", de: "Sprachgespräche" }, free: false, premium: true },
  { name: { en: "Face-to-Face mode", de: "Face-to-Face Modus" }, free: false, premium: true },
  { name: { en: "Guided prompts", de: "Geführte Impulse" }, free: false, premium: true },
  { name: { en: "AI reflections", de: "KI-Reflexionen" }, free: false, premium: true },
  { name: { en: "Weekly recaps", de: "Wochenrückblicke" }, free: false, premium: true },
  { name: { en: "Mood trends & insights", de: "Stimmungstrends & Insights" }, free: false, premium: true },
  { name: { en: "Topic paths", de: "Themen-Pfade" }, free: false, premium: true },
  { name: { en: "Audio library", de: "Audio-Bibliothek" }, free: false, premium: true },
  { name: { en: "Session summaries", de: "Sitzungszusammenfassungen" }, free: false, premium: true },
];

export function FeatureMatrix() {
  const { language } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="grid grid-cols-[1fr_60px_60px] bg-muted/40 px-4 py-2.5 border-b border-border/30">
        <span className="text-xs font-medium text-muted-foreground">
          {language === "de" ? "Funktion" : "Feature"}
        </span>
        <span className="text-xs font-medium text-muted-foreground text-center">Free</span>
        <span className="text-xs font-medium text-primary text-center">Plus</span>
      </div>
      {/* Rows */}
      {featureRows.map((row, i) => (
        <div
          key={i}
          className={`grid grid-cols-[1fr_60px_60px] px-4 py-2 ${
            i < featureRows.length - 1 ? "border-b border-border/20" : ""
          } ${!row.free ? "bg-primary/[0.02]" : ""}`}
        >
          <span className="text-sm text-foreground">
            {language === "de" ? row.name.de : row.name.en}
          </span>
          <div className="flex justify-center">
            {row.free ? (
              <Check className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex justify-center">
            <Check className="w-4 h-4 text-primary" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}
