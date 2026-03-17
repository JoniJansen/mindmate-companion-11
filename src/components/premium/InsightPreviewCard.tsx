import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { analytics } from "@/hooks/useAnalytics";

interface InsightPreviewCardProps {
  insightText: string;
  isPremium: boolean;
  language: "en" | "de";
}

/**
 * Shows a blurred preview of a weekly insight for free users, with a gentle premium CTA.
 */
export function InsightPreviewCard({ insightText, isPremium, language }: InsightPreviewCardProps) {
  const navigate = useNavigate();
  const trackedRef = useRef(false);

  const shouldShow = !isPremium && !!insightText;

  useEffect(() => {
    if (shouldShow && !trackedRef.current) {
      trackedRef.current = true;
      analytics.track("insight_preview_shown", {}, "insight_preview");
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  const copy = language === "de"
    ? { label: "Wöchentlicher Einblick", cta: "Vollständig lesen mit Plus" }
    : { label: "Weekly insight", cta: "Read in full with Plus" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="p-4 pb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">{copy.label}</span>
        </div>
        <div className="px-4 pb-2 relative">
          <p className="text-sm text-foreground leading-relaxed line-clamp-2">
            {insightText.slice(0, 80)}...
          </p>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />
        </div>
        <button
          onClick={() => {
            analytics.track("insight_unlock_clicked", { source: "home" });
            analytics.track("premium_cta_clicked", { source: "insight_preview" });
            navigate("/upgrade");
          }}
          className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-border/30 text-xs text-primary font-medium hover:bg-primary/5 transition-colors"
        >
          <Lock className="w-3 h-3" />
          {copy.cta}
        </button>
      </div>
    </motion.div>
  );
}
