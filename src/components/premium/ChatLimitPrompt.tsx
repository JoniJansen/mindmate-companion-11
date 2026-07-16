import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface ChatLimitPromptProps {
  companionName: string;
  language?: "en" | "de";
  messagesRemaining: number;
  isPremium: boolean;
}

/**
 * Emotionally-framed chat limit prompt. Shown when user is close to or at the daily limit.
 * Replaces aggressive "limit reached" messaging with warm, companion-centric copy.
 */
export function ChatLimitPrompt({
  companionName,
  messagesRemaining,
  isPremium,
}: ChatLimitPromptProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isPremium) return null;

  // At limit
  if (messagesRemaining <= 0) {
    const copy = {
      line1: t("chatLimit.atLimit.line1"),
      line2: t("chatLimit.atLimit.line2Template").replace("{name}", companionName),
      line3: t("chatLimit.atLimit.line3"),
      cta: t("chatLimit.atLimit.cta"),
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
    const template = messagesRemaining === 1
      ? t("chatLimit.approaching.singular")
      : t("chatLimit.approaching.plural");
    const text = template.replace("{n}", String(messagesRemaining));

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
