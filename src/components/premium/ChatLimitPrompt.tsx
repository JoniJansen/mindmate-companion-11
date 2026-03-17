import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatLimitPromptProps {
  companionName: string;
  language: "en" | "de";
  messagesRemaining: number;
  isPremium: boolean;
}

/**
 * Emotionally-framed chat limit prompt. Shown when user is close to or at the daily limit.
 * Replaces aggressive "limit reached" messaging with warm, companion-centric copy.
 */
export function ChatLimitPrompt({
  companionName,
  language,
  messagesRemaining,
  isPremium,
}: ChatLimitPromptProps) {
  const navigate = useNavigate();

  if (isPremium) return null;

  // At limit
  if (messagesRemaining <= 0) {
    const copy = language === "de"
      ? {
          line1: "Du hast heute genug geteilt.",
          line2: `${companionName} ist morgen wieder da —`,
          line3: "oder jederzeit mit Plus.",
          cta: "Plus entdecken",
        }
      : {
          line1: "You've shared enough for today.",
          line2: `${companionName} will be back tomorrow —`,
          line3: "or anytime with Plus.",
          cta: "Explore Plus",
        };

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[580px] mx-auto px-4 py-4"
      >
        <div className="rounded-2xl p-5 bg-card border border-border/50 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{copy.line1}</p>
            <p className="text-xs text-muted-foreground">{copy.line2}</p>
            <p className="text-xs text-muted-foreground">{copy.line3}</p>
          </div>
          <button
            onClick={() => navigate("/upgrade")}
            className="text-xs font-medium text-primary hover:underline transition-colors"
          >
            {copy.cta}
          </button>
        </div>
      </motion.div>
    );
  }

  // Approaching limit (3 or fewer)
  if (messagesRemaining <= 3) {
    const text = language === "de"
      ? `Noch ${messagesRemaining} Nachricht${messagesRemaining > 1 ? "en" : ""} heute. Mit Plus unbegrenzt.`
      : `${messagesRemaining} message${messagesRemaining > 1 ? "s" : ""} left today. Unlimited with Plus.`;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-[580px] mx-auto px-4 py-2"
      >
        <button
          onClick={() => navigate("/upgrade")}
          className="w-full text-center py-2 px-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-all"
        >
          <p className="text-xs text-muted-foreground">
            {text}
          </p>
        </button>
      </motion.div>
    );
  }

  return null;
}
