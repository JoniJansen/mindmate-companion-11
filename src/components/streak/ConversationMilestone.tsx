import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Share2, Heart, MessageSquare, TrendingUp, BookOpen } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

interface ConversationMilestoneProps {
  type: "conversations" | "themes" | "streak" | "insights" | "journal";
  count: number;
  onDismiss: () => void;
  onShare?: () => void;
}

const milestoneConfig: Record<string, {
  thresholds: number[];
  icon: typeof Heart;
  messages: Record<number, { en: string; de: string }>;
}> = {
  conversations: {
    thresholds: [5, 10, 25, 50, 100],
    icon: MessageSquare,
    messages: {
      5: { en: "5 reflective conversations. You're building a practice of self-awareness.", de: "5 reflektive Gespräche. Du baust eine Praxis der Selbstwahrnehmung auf." },
      10: { en: "10 conversations with yourself. Each one brought you closer to understanding.", de: "10 Gespräche mit dir selbst. Jedes einzelne hat dich dem Verstehen näher gebracht." },
      25: { en: "25 conversations. You've created a habit of looking inward.", de: "25 Gespräche. Du hast eine Gewohnheit des Nach-innen-Schauens geschaffen." },
      50: { en: "50 conversations. This depth of self-reflection is rare and valuable.", de: "50 Gespräche. Diese Tiefe der Selbstreflexion ist selten und wertvoll." },
      100: { en: "100 conversations. You've built something deeply meaningful with yourself.", de: "100 Gespräche. Du hast etwas zutiefst Bedeutsames mit dir aufgebaut." },
    },
  },
  themes: {
    thresholds: [3, 5, 10, 20],
    icon: TrendingUp,
    messages: {
      3: { en: "3 themes explored. You're starting to see your own patterns.", de: "3 Themen erkundet. Du beginnst, deine eigenen Muster zu sehen." },
      5: { en: "5 themes discovered. Self-knowledge grows in layers.", de: "5 Themen entdeckt. Selbsterkenntnis wächst in Schichten." },
      10: { en: "10 themes uncovered. You're mapping your inner landscape.", de: "10 Themen aufgedeckt. Du kartierst deine innere Landschaft." },
      20: { en: "20 themes. Your self-understanding runs deep.", de: "20 Themen. Dein Selbstverständnis ist tief verwurzelt." },
    },
  },
  insights: {
    thresholds: [3, 10, 25, 50],
    icon: Sparkles,
    messages: {
      3: { en: "3 insights discovered. Clarity comes in small moments.", de: "3 Erkenntnisse entdeckt. Klarheit kommt in kleinen Momenten." },
      10: { en: "10 insights. You're becoming more attuned to yourself.", de: "10 Erkenntnisse. Du wirst dir selbst immer bewusster." },
      25: { en: "25 insights. This collection of self-knowledge is uniquely yours.", de: "25 Erkenntnisse. Diese Sammlung von Selbstwissen gehört einzig dir." },
      50: { en: "50 insights. What began as curiosity has become wisdom.", de: "50 Erkenntnisse. Was als Neugier begann, ist zu Weisheit geworden." },
    },
  },
  journal: {
    thresholds: [5, 10, 30, 50],
    icon: BookOpen,
    messages: {
      5: { en: "5 journal entries. Writing helps you hear your own thoughts.", de: "5 Tagebucheinträge. Schreiben hilft dir, deine eigenen Gedanken zu hören." },
      10: { en: "10 entries. Your journal is becoming a mirror of your growth.", de: "10 Einträge. Dein Tagebuch wird zum Spiegel deiner Entwicklung." },
      30: { en: "30 entries. A month of written self-reflection. That's profound.", de: "30 Einträge. Ein Monat geschriebener Selbstreflexion. Das ist tiefgreifend." },
      50: { en: "50 entries. Your words tell a story of someone who shows up for themselves.", de: "50 Einträge. Deine Worte erzählen die Geschichte von jemandem, der für sich da ist." },
    },
  },
};

export function ConversationMilestone({ type, count, onDismiss, onShare }: ConversationMilestoneProps) {
  const { language } = useTranslation();
  const [show, setShow] = useState(true);

  const config = milestoneConfig[type];
  if (!config) return null;

  // Find the milestone that was just reached
  const milestone = [...config.thresholds].reverse().find(t => count >= t);
  if (!milestone) return null;

  const message = config.messages[milestone]?.[language] || config.messages[milestone]?.en || "";
  const Icon = config.icon;

  const handleDismiss = () => {
    setShow(false);
    setTimeout(onDismiss, 300);
  };

  const handleShare = () => {
    const shareText = `${message}\n\n· Soulvay`;
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    onShare?.();
  };

  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -15, scale: 0.97 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.97 }}
          transition={prefersReducedMotion ? { duration: 0.2 } : { type: "spring", damping: 25, stiffness: 300 }}
          className="mx-4 mb-4 rounded-2xl border border-primary/20 overflow-hidden bg-card"
        >
          {/* Subtle gradient accent */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary/70 uppercase tracking-wider mb-1">
                  {language === "de" ? "Meilenstein" : "Milestone"}
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">{message}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0 -mt-1 -mr-1 h-8 w-8">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Share option */}
            <div className="mt-3 pt-3 border-t border-border/20 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-7"
                onClick={handleShare}
              >
                <Share2 className="w-3 h-3" />
                {language === "de" ? "Teilen" : "Share"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
