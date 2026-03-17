import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { analytics } from "@/hooks/useAnalytics";

interface SoftPremiumBannerProps {
  language: "en" | "de";
  variant?: "home" | "chat" | "insight";
}

const COPY = {
  home: {
    en: { text: "Deeper conversations, voice sessions, weekly insights", cta: "Explore Plus" },
    de: { text: "Tiefere Gespräche, Sprachsitzungen, wöchentliche Einblicke", cta: "Plus entdecken" },
  },
  chat: {
    en: { text: "Unlock unlimited messages & voice mode", cta: "Learn more" },
    de: { text: "Unbegrenzte Nachrichten & Sprachmodus freischalten", cta: "Mehr erfahren" },
  },
  insight: {
    en: { text: "Get weekly emotional patterns & deeper analysis", cta: "See Plus" },
    de: { text: "Wöchentliche emotionale Muster & tiefere Analysen", cta: "Plus ansehen" },
  },
};

export function SoftPremiumBanner({ language, variant = "home" }: SoftPremiumBannerProps) {
  const navigate = useNavigate();
  const copy = COPY[variant][language];
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!trackedRef.current) {
      trackedRef.current = true;
      analytics.track("premium_cta_viewed", { variant }, `premium_banner_${variant}`);
    }
  }, [variant]);

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      onClick={() => {
        analytics.track("premium_cta_clicked", { variant, source: "soft_banner" });
        navigate("/upgrade");
      }}
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-primary/5 border border-primary/10 hover:border-primary/20 transition-all text-left group mb-6"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <p className="flex-1 text-xs text-muted-foreground leading-relaxed">{copy.text}</p>
      <span className="text-[11px] font-medium text-primary flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        {copy.cta}
        <ArrowRight className="w-3 h-3" />
      </span>
    </motion.button>
  );
}
