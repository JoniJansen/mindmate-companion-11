import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronRight, Loader2, X, Sparkles } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface EmotionalTimelineProps {
  onGenerate: () => Promise<void>;
  summary: string | null;
  isLoading: boolean;
  onClose: () => void;
  hasEnoughData: boolean;
}

export function EmotionalTimeline({
  onGenerate,
  summary,
  isLoading,
  onClose,
  hasEnoughData,
}: EmotionalTimelineProps) {
  const { t } = useTranslation();

  if (!hasEnoughData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <CalmCard variant="gentle" className="relative">
        {summary ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="absolute top-2 right-2 flex items-center justify-center w-11 h-11 rounded-xl hover:bg-muted/50 transition-colors"
              aria-label="Close timeline"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gentle-soft flex items-center justify-center">
                <Clock className="w-4 h-4 text-gentle" />
              </div>
              <h3 className="font-medium text-foreground">{t("timeline.title")}</h3>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {summary}
              </p>
            </div>
          </>
        ) : (
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gentle-soft flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-gentle animate-spin" />
                ) : (
                  <Clock className="w-5 h-5 text-gentle" />
                )}
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{t("timeline.title")}</p>
                <p className="text-sm text-muted-foreground">{t("timeline.description")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </CalmCard>
    </motion.div>
  );
}
