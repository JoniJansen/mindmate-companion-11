import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStatus, TabHintsSeen } from "@/hooks/useOnboardingStatus";
import { useTranslation } from "@/hooks/useTranslation";

interface TabHintProps {
  tabId: keyof TabHintsSeen;
}

const hintTexts: Record<keyof TabHintsSeen, { en: string; de: string }> = {
  chat: {
    en: "Share what's on your mind — at your own pace.",
    de: "Teile, was dich gerade beschäftigt – in deinem Tempo.",
  },
  journal: {
    en: "Your private space to capture thoughts.",
    de: "Dein privater Raum, um Gedanken festzuhalten.",
  },
  topics: {
    en: "Guided paths for common challenges.",
    de: "Geführte Wege für häufige Herausforderungen.",
  },
  mood: {
    en: "Track how you're feeling — and notice patterns.",
    de: "Tracke, wie es dir geht – und erkenne Muster.",
  },
  toolbox: {
    en: "Quick techniques when you need calm.",
    de: "Kurze Techniken, wenn du Ruhe brauchst.",
  },
};

export function TabHint({ tabId }: TabHintProps) {
  const { hasSeenTabHint, markTabHintSeen } = useOnboardingStatus();
  const { language } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if hint should be shown
    if (!hasSeenTabHint(tabId)) {
      setIsVisible(true);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        markTabHintSeen(tabId);
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [tabId, hasSeenTabHint, markTabHintSeen]);

  const handleDismiss = () => {
    markTabHintSeen(tabId);
    setIsVisible(false);
  };

  const hintText = language === "de" ? hintTexts[tabId].de : hintTexts[tabId].en;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="mb-3"
        >
          <button
            onClick={handleDismiss}
            className="w-full text-left px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 {hintText}
            </p>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
