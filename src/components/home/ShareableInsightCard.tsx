import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Share2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface ShareableInsightCardProps {
  insightText: string;
  date: string;
  onDismiss?: () => void;
}

export function ShareableInsightCard({ insightText, date, onDismiss }: ShareableInsightCardProps) {
  const { t, language } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);

  // Anonymize: strip specific names, places, numbers
  const anonymize = (text: string) => {
    return text
      .replace(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g, "…") // proper names
      .replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, "…"); // dates
  };

  const safeText = anonymize(insightText);
  const formattedDate = new Date(date).toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
    month: "short", day: "numeric",
  });

  const handleShare = async () => {
    const shareText = `"${safeText}"\n\n— ${language === "de" ? "Eine Reflexion mit Soulvay" : "A reflection with Soulvay"}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {}
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {}
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div
        ref={cardRef}
        className="rounded-2xl overflow-hidden border border-primary/20"
      >
        {/* Premium gradient header */}
        <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10 px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-medium text-primary uppercase tracking-wider">
              {t("growth.insightCard")}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground font-medium italic">
            "{safeText}"
          </p>
        </div>
        
        {/* Footer */}
        <div className="bg-card px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{formattedDate} · Soulvay</span>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleShare}
            >
              <Share2 className="w-3.5 h-3.5" />
              {t("common.share")}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
