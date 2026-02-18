import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";

const DISCLAIMER_SHOWN_KEY = "mindmate_chat_disclaimer_shown";

export function ChatDisclaimer() {
  const { language } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show disclaimer on first chat visit
    const hasSeenDisclaimer = localStorage.getItem(DISCLAIMER_SHOWN_KEY);
    if (!hasSeenDisclaimer) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISCLAIMER_SHOWN_KEY, "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/30">
            <div className="max-w-lg mx-auto flex items-start gap-2.5">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">
                {language === "de" 
                  ? "Soulvay ist ein Begleiter für Selbstreflexion und ersetzt keine professionelle Therapie oder Beratung."
                  : "Soulvay is a companion for self-reflection and does not replace professional therapy or counseling."}
              </p>
              <button
                onClick={handleDismiss}
                className="p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors rounded-md"
                aria-label={language === "de" ? "Schließen" : "Dismiss"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
