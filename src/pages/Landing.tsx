import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Shield, 
  Mic,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.png";

export default function Landing() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [language, setLanguage] = useState<"en" | "de">(() => {
    try {
      const stored = localStorage.getItem("soulvay-preferences");
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.language === "en" || prefs.language === "de") return prefs.language;
      }
    } catch {}
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("en") && !browserLang.includes("de")) return "en";
    return "de";
  });

  const slides = language === "de" ? [
    {
      icon: null, // Logo slide
      title: "Willkommen bei Soulvay",
      description: "Dein privater Raum für emotionales Wohlbefinden. Einfühlsam, sicher, immer für dich da.",
      isLogo: true,
    },
    {
      icon: MessageCircle,
      title: "Einfühlsame Gespräche",
      description: "Sprich über alles, was dich bewegt. Ohne Bewertung — nur Verständnis und Unterstützung.",
    },
    {
      icon: BookOpen,
      title: "Reflektiere & Wachse",
      description: "Geführtes Tagebuch und Stimmungstracking helfen dir, deine Muster zu erkennen.",
    },
    {
      icon: Shield,
      title: "Absolut Privat",
      description: "Deine Gedanken bleiben deine. Ende-zu-Ende-Verschlüsselung und höchste Datenschutzstandards.",
    },
  ] : [
    {
      icon: null,
      title: "Welcome to Soulvay",
      description: "Your private space for emotional wellbeing. Empathetic, secure, always here for you.",
      isLogo: true,
    },
    {
      icon: MessageCircle,
      title: "Thoughtful Conversations",
      description: "Talk about anything on your mind. No judgment — just understanding and support.",
    },
    {
      icon: BookOpen,
      title: "Reflect & Grow",
      description: "Guided journaling and mood tracking help you recognize your patterns.",
    },
    {
      icon: Shield,
      title: "Completely Private",
      description: "Your thoughts stay yours. End-to-end encryption and highest privacy standards.",
    },
  ];

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  // Persist language choice so Onboarding picks it up
  const persistLanguage = () => {
    try {
      const existing = localStorage.getItem("soulvay-preferences");
      const prefs = existing ? JSON.parse(existing) : {};
      prefs.language = language;
      localStorage.setItem("soulvay-preferences", JSON.stringify(prefs));
    } catch {}
  };

  const handleNext = () => {
    if (isLastSlide) {
      persistLanguage();
      navigate("/welcome");
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    persistLanguage();
    navigate("/welcome");
  };

  return (
    <div
      className="bg-background flex flex-col safe-top"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Top bar — language toggle & skip */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2 shrink-0">
        <button
          onClick={() => {
            const next = language === "en" ? "de" : "en";
            setLanguage(next);
            try {
              const existing = localStorage.getItem("soulvay-preferences");
              const prefs = existing ? JSON.parse(existing) : {};
              prefs.language = next;
              localStorage.setItem("soulvay-preferences", JSON.stringify(prefs));
            } catch {}
          }}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground"
        >
          {language === "en" ? "DE" : "EN"}
        </button>
        {!isLastSlide && (
          <button
            onClick={handleSkip}
            className="text-sm font-medium text-muted-foreground"
          >
            {language === "de" ? "Überspringen" : "Skip"}
          </button>
        )}
      </div>

      {/* Slide Content — centered */}
      <div className="flex-1 flex items-center justify-center px-6 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-center max-w-sm w-full"
          >
            {/* Icon or Logo */}
            <div className="mb-8 flex justify-center">
              {slide.isLogo ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-28 h-28 rounded-[2rem] overflow-hidden shadow-elevated"
                >
                  <img src={logoImage} alt="Soulvay" className="w-full h-full object-cover" />
                </motion.div>
              ) : slide.icon ? (
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <slide.icon className="w-9 h-9 text-primary" />
                </div>
              ) : null}
            </div>

            {/* Text */}
            <h1 className="text-[26px] font-semibold text-foreground mb-3 leading-tight">
              {slide.title}
            </h1>
            <p className="text-muted-foreground text-[16px] leading-relaxed px-4">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: Dots + CTA */}
      <div className="px-6 pb-6 shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? "w-7 bg-primary"
                  : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleNext}
          className="w-full gap-2"
          size="lg"
        >
          {isLastSlide
            ? (language === "de" ? "Jetzt starten" : "Get Started")
            : (language === "de" ? "Weiter" : "Continue")
          }
          <ArrowRight className="w-4 h-4" />
        </Button>

        {/* Sign in link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-muted-foreground"
          >
            {language === "de" ? "Bereits ein Konto? " : "Already have an account? "}
            <span className="text-primary font-medium">
              {language === "de" ? "Anmelden" : "Sign In"}
            </span>
          </button>
        </div>

        {/* Legal footer */}
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted-foreground/60">
          <button onClick={() => navigate("/terms")} className="hover:text-muted-foreground transition-colors">
            {language === "de" ? "Nutzungsbedingungen" : "Terms"}
          </button>
          <span>•</span>
          <button onClick={() => navigate("/privacy")} className="hover:text-muted-foreground transition-colors">
            {language === "de" ? "Datenschutz" : "Privacy"}
          </button>
          <span>•</span>
          <button onClick={() => navigate("/impressum")} className="hover:text-muted-foreground transition-colors">
            {language === "de" ? "Impressum" : "Legal Notice"}
          </button>
        </div>
      </div>
    </div>
  );
}
