import { motion } from "framer-motion";
import { Mic, Sparkles, ArrowRight, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VoiceTrialCardProps {
  language: "en" | "de";
  hasUsedTrial: boolean;
  isPremium: boolean;
  companionName?: string;
}

const VOICE_TRIAL_KEY = "soulvay-voice-trial-used";

export function hasUsedVoiceTrial(): boolean {
  try {
    return localStorage.getItem(VOICE_TRIAL_KEY) === "true";
  } catch {
    return false;
  }
}

export function markVoiceTrialUsed() {
  try {
    localStorage.setItem(VOICE_TRIAL_KEY, "true");
  } catch {}
}

export function canUseVoiceTrial(): boolean {
  return !hasUsedVoiceTrial();
}

export function VoiceTrialCard({ language, hasUsedTrial, isPremium, companionName = "Soulvay" }: VoiceTrialCardProps) {
  const navigate = useNavigate();

  // Don't show if premium or already used
  if (isPremium || hasUsedTrial) return null;

  const copy = language === "de"
    ? {
        title: `Möchtest du mit ${companionName} sprechen?`,
        subtitle: "Erlebe, wie sich ein persönliches Gespräch anfühlt.",
        cta: "Ausprobieren",
      }
    : {
        title: `Want to talk with ${companionName}?`,
        subtitle: "Experience what a personal conversation feels like.",
        cta: "Try it",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      <button
        onClick={() => navigate("/chat", { state: { startVoiceTrial: true } })}
        className="w-full text-left rounded-2xl p-5 border bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-primary/15 hover:border-primary/25 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-sm font-semibold text-foreground">{copy.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{copy.subtitle}</p>
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
