import { motion } from "framer-motion";
import { X, Sparkles, TrendingUp, ArrowRight, ChevronRight, Copy, Share2, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";

interface ParsedSummary {
  summary: string;
  themes: string[];
  moodJourney: string;
  moodStart: string;
  moodEnd: string;
  nextStep: string;
}

function parseSummaryContent(content: string): ParsedSummary {
  const result: ParsedSummary = { summary: "", themes: [], moodJourney: "", moodStart: "💭", moodEnd: "🙂", nextStep: "" };
  
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
      // Parse emoji arrows like "💭 → 🙂 Some insight"
      const arrowMatch = body.match(/^(.+?)\s*→\s*(.+?)\s+(.+)$/);
      if (arrowMatch) {
        result.moodStart = arrowMatch[1].trim();
        result.moodEnd = arrowMatch[2].trim();
        result.moodJourney = arrowMatch[3].trim();
      }
    } else if (heading.includes("schritt") || heading.includes("step")) {
      result.nextStep = body;
    }
  }
  
  if (!result.summary && !result.themes.length) {
    result.summary = content.substring(0, 300);
  }
  
  return result;
}

interface AISummaryDetailProps {
  content: string;
  createdAt: string;
  onClose: () => void;
}

export function AISummaryDetail({ content, createdAt, onClose }: AISummaryDetailProps) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const parsed = parseSummaryContent(content);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  const getPlainText = () => {
    const lines: string[] = [];
    lines.push(language === "de" ? "📋 KI-Zusammenfassung" : "📋 AI Summary");
    lines.push(formatDate(createdAt));
    lines.push("");
    if (parsed.summary) {
      lines.push(parsed.summary);
      lines.push("");
    }
    if (parsed.themes.length > 0) {
      lines.push(language === "de" ? "🏷️ Themen:" : "🏷️ Themes:");
      parsed.themes.forEach(t => lines.push(`  • ${t}`));
      lines.push("");
    }
    if (parsed.moodJourney) {
      lines.push(`${parsed.moodStart} → ${parsed.moodEnd}`);
      lines.push(parsed.moodJourney);
      lines.push("");
    }
    if (parsed.nextStep) {
      lines.push(language === "de" ? "➡️ Nächster Schritt:" : "➡️ Next Step:");
      lines.push(parsed.nextStep);
    }
    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getPlainText());
      setCopied(true);
      toast({ title: language === "de" ? "Kopiert!" : "Copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const text = getPlainText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: language === "de" ? "KI-Zusammenfassung" : "AI Summary",
          text,
        });
      } catch (e: any) {
        if (e.name !== "AbortError") {
          // Fallback to copy
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
    >
      <div className="h-full overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-lg mx-auto px-5 py-6 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {language === "de" ? "KI-Zusammenfassung" : "AI Summary"}
                </h1>
                <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Summary */}
          {parsed.summary && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                {language === "de" ? "Zusammenfassung" : "Summary"}
              </h2>
              <p className="text-[15px] leading-relaxed text-foreground bg-card border border-border/50 rounded-xl p-4">
                {parsed.summary}
              </p>
            </section>
          )}

          {/* Themes */}
          {parsed.themes.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                {language === "de" ? "Emotionale Themen" : "Emotional Themes"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {parsed.themes.map((theme, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs px-3 py-1.5 bg-primary/10 text-primary border-primary/20 font-medium"
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Mood Journey */}
          {parsed.moodJourney && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                {language === "de" ? "Stimmungsverlauf" : "Mood Journey"}
              </h2>
              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="text-center">
                    <span className="text-3xl block mb-1">{parsed.moodStart}</span>
                    <span className="text-[10px] text-muted-foreground">{language === "de" ? "Start" : "Start"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-muted-foreground/30 to-primary/50 rounded-full" />
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-3xl block mb-1">{parsed.moodEnd}</span>
                    <span className="text-[10px] text-muted-foreground">{language === "de" ? "Ende" : "End"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-sm text-foreground/80">{parsed.moodJourney}</p>
                </div>
              </div>
            </section>
          )}

          {/* Next Step */}
          {parsed.nextStep && (
            <section className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                {language === "de" ? "Nächster Schritt" : "Next Step"}
              </h2>
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-foreground">{parsed.nextStep}</p>
              </div>
            </section>
          )}

          {/* Share/Export Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied 
                ? (language === "de" ? "Kopiert" : "Copied") 
                : (language === "de" ? "Text kopieren" : "Copy text")}
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              {language === "de" ? "Teilen" : "Share"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
