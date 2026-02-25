import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ArrowRight, ChevronRight } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";

interface AISummaryCardProps {
  id: string;
  content: string;
  createdAt: string;
  onClick: () => void;
  index: number;
}

interface ParsedSummary {
  summary: string;
  themes: string[];
  moodJourney: string;
  nextStep: string;
}

function parseSummaryContent(content: string): ParsedSummary {
  const result: ParsedSummary = { summary: "", themes: [], moodJourney: "", nextStep: "" };
  
  const sections = content.split(/###?\s+/);
  
  for (const section of sections) {
    const lines = section.trim().split("\n").filter(l => l.trim());
    if (!lines.length) continue;
    
    const heading = lines[0].toLowerCase();
    const body = lines.slice(1).join("\n").trim();
    
    if (heading.includes("zusammenfassung") || heading.includes("summary")) {
      result.summary = body;
    } else if (heading.includes("themen") || heading.includes("themes")) {
      result.themes = body.split("\n").map(l => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
    } else if (heading.includes("stimmung") || heading.includes("mood")) {
      result.moodJourney = body;
    } else if (heading.includes("schritt") || heading.includes("step")) {
      result.nextStep = body;
    }
  }
  
  // Fallback if no sections parsed
  if (!result.summary && !result.themes.length) {
    result.summary = content.substring(0, 200);
  }
  
  return result;
}

export function AISummaryCard({ content, createdAt, onClick, index }: AISummaryCardProps) {
  const { t, language } = useTranslation();
  const parsed = parseSummaryContent(content);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return t("journal.today");
    if (date.toDateString() === yesterday.toDateString()) return t("journal.yesterday");
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: "easeOut" }}
    >
      <CalmCard
        variant="accent"
        className="cursor-pointer hover:shadow-elevated transition-all duration-200 overflow-hidden"
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight">
              {language === "de" ? "KI-Zusammenfassung" : "AI Summary"}
            </h3>
            <p className="text-[11px] text-muted-foreground">{formatDate(createdAt)}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
        </div>

        {/* Summary Preview */}
        {parsed.summary && (
          <p className="text-sm text-foreground/80 line-clamp-2 mb-3 leading-relaxed">
            {parsed.summary}
          </p>
        )}

        {/* Themes as colored badges */}
        {parsed.themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {parsed.themes.slice(0, 4).map((theme, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 font-medium"
              >
                {theme}
              </Badge>
            ))}
          </div>
        )}

        {/* Mood Journey */}
        {parsed.moodJourney && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-foreground/70 truncate">{parsed.moodJourney}</span>
          </div>
        )}

        {/* Next Step */}
        {parsed.nextStep && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowRight className="w-3 h-3 shrink-0" />
            <span className="truncate">{parsed.nextStep}</span>
          </div>
        )}
      </CalmCard>
    </motion.div>
  );
}
