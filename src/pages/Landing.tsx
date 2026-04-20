import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Shield, 
  Mic,
  Moon,
  Sun,
  ArrowRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import logoImage from "@/assets/logo.png";

import { DemoChat } from "@/components/landing/DemoChat";

export default function Landing() {
  const navigate = useNavigate();
  const { isDark, setMode: setThemeMode } = useTheme();
  const [language, setLanguage] = useState<"en" | "de">(() => {
    try {
      const stored = localStorage.getItem("soulvay-preferences");
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.language === "en" || prefs.language === "de") return prefs.language;
      }
    } catch {}
    // Default to German (primary market) — switch to English only for explicit EN browsers
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("en") && !browserLang.includes("de")) return "en";
    return "de";
  });

  

  const content = {
    en: {
      hero: {
        tagline: "Your psychological companion",
        cta: "Start Your Journey",
      },
      features: {
        title: "Everything you need for emotional wellness",
        items: [
          { icon: MessageCircle, title: "Thoughtful Conversations", description: "Chat with an AI that truly listens. No judgment, just understanding." },
          { icon: BookOpen, title: "Guided Journaling", description: "Reflective prompts to help you explore your thoughts and feelings." },
          { icon: Heart, title: "Mood Tracking", description: "Notice patterns in your emotions and celebrate your progress." },
          { icon: Sparkles, title: "Calming Exercises", description: "Breathing techniques, grounding exercises, and more." },
          { icon: Mic, title: "Voice Conversations", description: "Speak naturally and hear warm, thoughtful responses." },
          { icon: Shield, title: "Private & Safe", description: "Your thoughts stay yours. Privacy-focused and securely stored." },
        ],
      },
      pricing: {
        title: "Simple, transparent pricing",
        free: { name: "Free", price: "€0", features: ["15 messages per day", "Basic journaling", "Mood tracking", "Community exercises"] },
        plus: { name: "Plus", price: "€9.99", period: "/month", trial: "7-day free trial", features: ["Unlimited messages", "Voice conversations", "Weekly insights", "Premium exercises", "Priority support"], cta: "Start Free Trial" },
      },
      howItWorks: {
        title: "How it works",
        items: [
          { step: "1", title: "Start a conversation", description: "Tell Soulvay what's on your mind — openly and without judgment." },
          { step: "2", title: "Reflect together", description: "Through thoughtful questions, you'll discover new perspectives on your thoughts." },
          { step: "3", title: "Grow step by step", description: "Track your mood, journal your insights, and notice your personal progress." },
        ],
      },
      footer: { tagline: "Made with care for your wellbeing", privacy: "Privacy", terms: "Terms", impressum: "Legal Notice", contact: "Contact" },
    },
    de: {
      hero: {
        tagline: "Dein psychologischer Begleiter",
        cta: "Starte deine Reise",
      },
      features: {
        title: "Alles für dein emotionales Wohlbefinden",
        items: [
          { icon: MessageCircle, title: "Einfühlsame Gespräche", description: "Chatte mit einer KI, die wirklich zuhört. Ohne Urteil, nur Verständnis." },
          { icon: BookOpen, title: "Geführtes Tagebuch", description: "Reflektierende Impulse, um deine Gedanken und Gefühle zu erkunden." },
          { icon: Heart, title: "Stimmungstracking", description: "Erkenne Muster in deinen Emotionen und feiere deine Fortschritte." },
          { icon: Sparkles, title: "Beruhigende Übungen", description: "Atemtechniken, Erdungsübungen und mehr." },
          { icon: Mic, title: "Sprachgespräche", description: "Sprich natürlich und höre warme, durchdachte Antworten." },
          { icon: Shield, title: "Privat & Sicher", description: "Deine Gedanken bleiben deine. Datenschutzorientiert und sicher gespeichert." },
        ],
      },
      pricing: {
        title: "Einfache, transparente Preise",
        free: { name: "Kostenlos", price: "€0", features: ["15 Nachrichten pro Tag", "Basis-Tagebuch", "Stimmungstracking", "Community-Übungen"] },
        plus: { name: "Plus", price: "€9,99", period: "/Monat", trial: "7 Tage kostenlos testen", features: ["Unbegrenzte Nachrichten", "Sprachgespräche", "Wöchentliche Einblicke", "Premium-Übungen", "Prioritäts-Support"], cta: "Kostenlos testen" },
      },
      howItWorks: {
        title: "So funktioniert's",
        items: [
          { step: "1", title: "Starte ein Gespräch", description: "Erzähl Soulvay, was dich beschäftigt — offen und ohne Bewertung." },
          { step: "2", title: "Gemeinsam reflektieren", description: "Durch einfühlsame Fragen entdeckst du neue Perspektiven auf deine Gedanken." },
          { step: "3", title: "Schritt für Schritt wachsen", description: "Tracke deine Stimmung, halte Erkenntnisse fest und bemerke deinen Fortschritt." },
        ],
      },
      footer: { tagline: "Mit Sorgfalt für dein Wohlbefinden erstellt", privacy: "Datenschutz", terms: "AGB", impressum: "Impressum", contact: "Kontakt" },
    },
  };

  const t = content[language];

  return (
    <div
      className="bg-background overflow-y-auto overscroll-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        WebkitOverflowScrolling: 'touch',
        /* Prevent in-app browser viewport jump on focus */
        height: '100%',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Header — compact */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40 safe-top">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-md shadow-primary/20">
              <img src={logoImage} alt="Soulvay" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-foreground">Soulvay</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "en" ? "de" : "en")}
              className="px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {language === "en" ? "DE" : "EN"}
            </button>
            <button
              onClick={() => setThemeMode(isDark ? "light" : "dark")}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <Button onClick={() => navigate("/auth")} size="sm" variant="ghost" className="text-xs">
              {language === "de" ? "Anmelden" : "Sign In"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — Chat-first, minimal copy */}
      <section className="relative pt-3 pb-6 md:pt-10 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-lg mx-auto px-4">
          {/* Minimal tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-4"
          >
            <h1 className="text-lg md:text-2xl font-bold text-foreground mb-0.5">
              {t.hero.tagline}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {language === "de" ? "Probier es aus — ohne Anmeldung" : "Try it — no signup needed"}
            </p>
          </motion.div>

          {/* Demo Chat — hero element */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <DemoChat language={language} />
          </motion.div>

          {/* Secondary CTA below chat */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center mt-5"
          >
            <Button variant="ghost" size="sm" onClick={() => navigate("/welcome")} className="text-xs text-muted-foreground gap-1.5">
              {t.hero.cta}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
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
      </section>
    </div>
  );
}
