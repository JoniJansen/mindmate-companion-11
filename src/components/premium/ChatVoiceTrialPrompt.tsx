import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { canUseVoiceTrial } from "./VoiceTrialCard";
import { analytics } from "@/hooks/useAnalytics";

interface ChatVoiceTrialPromptProps {
  companionName: string;
  language: "en" | "de";
  messageCount: number;
  isPremium: boolean;
}

/**
 * Inline voice trial prompt shown in chat after meaningful conversation depth.
 * Shows after 6+ messages if user hasn't used trial and isn't premium.
 */
export function ChatVoiceTrialPrompt({
  companionName,
  language,
  messageCount,
  isPremium,
}: ChatVoiceTrialPromptProps) {
  const navigate = useNavigate();
  const trackedRef = useRef(false);

  const shouldShow = messageCount >= 6 && !isPremium && canUseVoiceTrial();

  // Track prompt shown once
  useEffect(() => {
    if (shouldShow && !trackedRef.current) {
      trackedRef.current = true;
      analytics.track("voice_trial_prompt_shown", { message_count: messageCount }, "voice_trial_prompt");
    }
  }, [shouldShow, messageCount]);

  if (!shouldShow) return null;

  const copy = language === "de"
    ? {
        lead: "Willst du das mal persönlich ausprobieren?",
        sub: `Du kannst einmal kostenlos mit ${companionName} sprechen.`,
        cta: "Face-to-Face starten",
      }
    : {
        lead: "Want to try this in person?",
        sub: `You can speak with ${companionName} once for free.`,
        cta: "Start Face-to-Face",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="max-w-[580px] mx-auto px-4 pb-3"
    >
      <button
        onClick={() => {
          analytics.track("voice_trial_entry_clicked", { source: "chat_inline" });
          navigate("/chat", { state: { startVoiceTrial: true } });
        }}
        className="w-full text-left rounded-2xl p-4 border bg-primary/5 border-primary/15 hover:border-primary/25 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
            <Mic className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{copy.lead}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{copy.sub}</p>
          </div>
          <span className="text-xs font-medium text-primary flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
            {copy.cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>
    </motion.div>
  );
}
