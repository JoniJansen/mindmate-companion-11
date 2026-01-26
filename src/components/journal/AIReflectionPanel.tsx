import { forwardRef } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";

interface AIReflectionPanelProps {
  reflection: string;
  isLoading: boolean;
  onClose: () => void;
}

export const AIReflectionPanel = forwardRef<HTMLDivElement, AIReflectionPanelProps>(
  function AIReflectionPanel({ reflection, isLoading, onClose }, ref) {
    const { language } = useTranslation();
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <CalmCard variant="gentle" className="relative">
          {/* Close button - 44px tap target */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={language === "de" ? "Schließen" : "Close"}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-foreground">
              {language === "de" ? "KI-Reflexion" : "AI Reflection"}
            </h4>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {language === "de" ? "Analysiere deine Einträge..." : "Reflecting on your entries..."}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {reflection}
            </p>
          )}
        </CalmCard>
      </motion.div>
    );
  }
);
