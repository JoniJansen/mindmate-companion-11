import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const SWIPE_HINT_KEY = "soulvay-swipe-hint-shown";

export function SwipeHint() {
  const [show, setShow] = useState(false);
  const { language } = useTranslation();

  useEffect(() => {
    // Check if hint was already shown
    const alreadyShown = localStorage.getItem(SWIPE_HINT_KEY);
    if (alreadyShown) return;

    // Show hint after a short delay
    const showTimeout = setTimeout(() => {
      setShow(true);
    }, 1500);

    // Auto-hide after animation
    const hideTimeout = setTimeout(() => {
      setShow(false);
      localStorage.setItem(SWIPE_HINT_KEY, "true");
    }, 4500);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(SWIPE_HINT_KEY, "true");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] pointer-events-none"
          onClick={handleDismiss}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto" />
          
          {/* Swipe indicator on left edge */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-auto"
            initial={{ x: -100 }}
            animate={{ x: [0, 60, 0] }}
            transition={{ 
              duration: 1.2, 
              repeat: 2,
              ease: "easeInOut",
              repeatDelay: 0.3
            }}
          >
            {/* Edge indicator bar */}
            <div className="w-1.5 h-24 bg-primary/80 rounded-r-full shadow-lg" />
            
            {/* Arrow and text */}
            <motion.div 
              className="flex items-center gap-2 bg-card/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-elevated border border-border/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center">
                <ChevronLeft className="w-5 h-5 text-primary" />
                <ChevronLeft className="w-5 h-5 text-primary -ml-3" />
              </div>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {language === "de" ? "Wischen zum Zurückgehen" : "Swipe to go back"}
              </span>
            </motion.div>
          </motion.div>

          {/* Tap to dismiss hint */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 text-sm text-muted-foreground pointer-events-auto"
          >
            {language === "de" ? "Tippen zum Schließen" : "Tap to dismiss"}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
