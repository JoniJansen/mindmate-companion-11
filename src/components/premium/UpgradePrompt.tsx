import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Volume2, Brain, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  reason?: "messages" | "voice" | "features" | "general";
  onUpgrade?: () => void;
  onDismiss?: () => void;
  variant?: "inline" | "modal" | "banner";
}

export const UpgradePrompt = forwardRef<HTMLDivElement, UpgradePromptProps>(function UpgradePrompt({ 
  reason = "general", 
  onUpgrade, 
  onDismiss,
  variant = "inline" 
}, ref) {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate("/upgrade");
    }
  };

  const content = {
    messages: {
      en: {
        title: "Take your time",
        subtitle: "You've reached today's message limit.",
        description: "Upgrade to Plus for unlimited conversations and voice features.",
        cta: "Explore Plus",
      },
      de: {
        title: "Lass dir Zeit",
        subtitle: "Du hast das heutige Nachrichtenlimit erreicht.",
        description: "Upgrade auf Plus für unbegrenzte Gespräche und Sprachfunktionen.",
        cta: "Plus entdecken",
      },
    },
    voice: {
      en: {
        title: "Voice conversations",
        subtitle: "Premium feature",
        description: "Speak naturally with Soulvay. Voice input and warm AI responses.",
        cta: "Unlock voice",
      },
      de: {
        title: "Sprachgespräche",
        subtitle: "Premium-Funktion",
        description: "Sprich natürlich mit Soulvay. Spracheingabe und warme KI-Antworten.",
        cta: "Stimme freischalten",
      },
    },
    features: {
      en: {
        title: "Go deeper",
        subtitle: "Premium features",
        description: "Weekly recaps, pattern insights, and guided journaling prompts.",
        cta: "See what's included",
      },
      de: {
        title: "Geh tiefer",
        subtitle: "Premium-Funktionen",
        description: "Wochenrückblicke, Musteranalysen und geführte Tagebuch-Impulse.",
        cta: "Was ist enthalten",
      },
    },
    general: {
      en: {
        title: "Soulvay Plus",
        subtitle: "A quiet space for your mind",
        description: "Unlimited conversations, voice features, and deeper insights.",
        cta: "Learn more",
      },
      de: {
        title: "Soulvay Plus",
        subtitle: "Ein ruhiger Raum für deinen Geist",
        description: "Unbegrenzte Gespräche, Sprachfunktionen und tiefere Einblicke.",
        cta: "Mehr erfahren",
      },
    },
  };

  const t = content[reason][language as "en" | "de"] || content[reason].en;

  const features = [
    { icon: Volume2, label: language === "de" ? "Sprachgespräche" : "Voice conversations" },
    { icon: Brain, label: language === "de" ? "Musteranalysen" : "Pattern insights" },
    { icon: Heart, label: language === "de" ? "Unbegrenzte Chats" : "Unlimited chats" },
  ];

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{t.subtitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="ghost" className="text-primary text-xs min-h-[44px]" onClick={handleUpgrade}>
              {t.cta}
            </Button>
            {onDismiss && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "modal") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-6 shadow-lg max-w-sm mx-auto"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-lg">{t.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
          <p className="text-sm text-foreground/80 mt-3">{t.description}</p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
                <feature.icon className="w-3 h-3" />
                {feature.label}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <Button onClick={handleUpgrade} className="w-full">
              {t.cta}
            </Button>
            {onDismiss && (
              <Button variant="ghost" onClick={onDismiss} className="w-full text-muted-foreground">
                {language === "de" ? "Vielleicht später" : "Maybe later"}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {language === "de" 
              ? "Du kannst jederzeit upgraden. Kein Druck." 
              : "You can upgrade anytime. No pressure."}
          </p>
        </div>
      </motion.div>
    );
  }

  // Inline variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary/5 border border-primary/10 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.description}</p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={handleUpgrade}>
          {t.cta}
        </Button>
      </div>
    </motion.div>
  );
});
