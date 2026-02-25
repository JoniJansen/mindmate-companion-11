import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

interface StreakMilestoneProps {
  milestone: number;
  onDismiss: () => void;
}

const milestoneMessages: Record<number, { en: string; de: string }> = {
  3: { en: "3 days in a row — you're building a habit.", de: "3 Tage am Stück — du baust eine Gewohnheit auf." },
  7: { en: "A full week! Your commitment inspires.", de: "Eine ganze Woche! Dein Engagement inspiriert." },
  14: { en: "Two weeks strong. You're showing up for yourself.", de: "Zwei Wochen stark. Du bist für dich da." },
  30: { en: "30 days — this is who you are now.", de: "30 Tage — das bist jetzt du." },
  60: { en: "60 days of self-care. Remarkable.", de: "60 Tage Selbstfürsorge. Bemerkenswert." },
  100: { en: "100 days. You've built something beautiful.", de: "100 Tage. Du hast etwas Schönes aufgebaut." },
};

export function StreakMilestone({ milestone, onDismiss }: StreakMilestoneProps) {
  const { language } = useTranslation();
  const [show, setShow] = useState(true);

  const message = milestoneMessages[milestone]?.[language] || milestoneMessages[milestone]?.en || "";

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDismiss, 500);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(onDismiss, 300);
  };

  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== "undefined" 
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
          transition={prefersReducedMotion ? { duration: 0.2 } : { type: "spring", damping: 20, stiffness: 300 }}
          className="mx-4 mb-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 relative overflow-hidden"
        >
          {/* Subtle sparkle background — skip for reduced motion */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              style={{
                background: "radial-gradient(circle at 30% 50%, hsl(var(--primary) / 0.3), transparent 60%)",
              }}
            />
          )}

          <div className="relative flex items-start gap-3">
            <motion.div
              animate={prefersReducedMotion ? {} : { rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0"
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                🔥 {milestone} {language === "de" ? "Tage Streak!" : "Day Streak!"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0 -mt-1 -mr-1">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
