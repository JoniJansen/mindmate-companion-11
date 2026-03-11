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
  Check,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import logoImage from "@/assets/logo.png";

export default function Landing() {
  const navigate = useNavigate();
  const { isDark, setMode: setThemeMode } = useTheme();
  const [language, setLanguage] = useState<"en" | "de">(() => {
    try {
      const stored = localStorage.getItem("soulvay-preferences") || localStorage.getItem("mindmate-preferences");
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.language === "en" || prefs.language === "de") return prefs.language;
      }
    } catch {}
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("en")) return "en";
    return "de";
  });

  // Detect native app to hide store badges
  const isNativeBuild = (() => {
    try {
      if (typeof (window as any).Capacitor !== 'undefined') {
        const cap = (window as any).Capacitor;
        if (cap.isNativePlatform?.()) return true;
        const p = cap.getPlatform?.();
        if (p === 'ios' || p === 'android') return true;
      }
      if (typeof window !== 'undefined' && (window as any).webkit?.messageHandlers) return true;
    } catch {}
    return false;
  })();

  const content = {
    en: {
      hero: {
        title: "Your psychological companion",
        subtitle: "Soulvay helps you reflect, breathe, and find clarity—whenever you need it.",
        cta: "Start Your Journey",
        secondary: "Learn More",
      },
      features: {
        title: "Everything you need for emotional wellness",
        items: [
          {
            icon: MessageCircle,
            title: "Thoughtful Conversations",
            description: "Chat with an AI that truly listens. No judgment, just understanding.",
          },
          {
            icon: BookOpen,
            title: "Guided Journaling",
            description: "Reflective prompts to help you explore your thoughts and feelings.",
          },
          {
            icon: Heart,
            title: "Mood Tracking",
            description: "Notice patterns in your emotions and celebrate your progress.",
          },
          {
            icon: Sparkles,
            title: "Calming Exercises",
            description: "Breathing techniques, grounding exercises, and more.",
          },
          {
            icon: Mic,
            title: "Voice Conversations",
            description: "Speak naturally and hear warm, thoughtful responses.",
          },
          {
            icon: Shield,
            title: "Private & Safe",
            description: "Your thoughts stay yours. Privacy-focused and securely stored.",
          },
        ],
      },
      pricing: {
        title: "Simple, transparent pricing",
        free: {
          name: "Free",
          price: "€0",
          features: ["15 messages per day", "Basic journaling", "Mood tracking", "Community exercises"],
        },
        plus: {
          name: "Plus",
          price: "€9.99",
          period: "/month",
          trial: "7-day free trial",
          features: ["Unlimited messages", "Voice conversations", "Weekly insights", "Premium exercises", "Priority support"],
          cta: "Start Free Trial",
        },
      },
      testimonials: {
        title: "What our users say",
        items: [
          { text: "Soulvay helped me understand my anxiety better. It's like having a patient friend available 24/7.", author: "Sarah K." },
          { text: "The breathing exercises actually work. I use them before every important meeting now.", author: "Michael T." },
          { text: "Finally an app that doesn't feel clinical. It's warm, human, and genuinely helpful.", author: "Emma L." },
        ],
      },
      footer: {
        tagline: "Made with care for your wellbeing",
        privacy: "Privacy",
        terms: "Terms",
        impressum: "Legal Notice",
        contact: "Contact",
      },
    },
    de: {
      hero: {
        title: "Dein psychologischer Begleiter",
        subtitle: "Soulvay hilft dir zu reflektieren, zu atmen und Klarheit zu finden—wann immer du es brauchst.",
        cta: "Starte deine Reise",
        secondary: "Mehr erfahren",
      },
      features: {
        title: "Alles für dein emotionales Wohlbefinden",
        items: [
          {
            icon: MessageCircle,
            title: "Einfühlsame Gespräche",
            description: "Chatte mit einer KI, die wirklich zuhört. Ohne Urteil, nur Verständnis.",
          },
          {
            icon: BookOpen,
            title: "Geführtes Tagebuch",
            description: "Reflektierende Impulse, um deine Gedanken und Gefühle zu erkunden.",
          },
          {
            icon: Heart,
            title: "Stimmungstracking",
            description: "Erkenne Muster in deinen Emotionen und feiere deine Fortschritte.",
          },
          {
            icon: Sparkles,
            title: "Beruhigende Übungen",
            description: "Atemtechniken, Erdungsübungen und mehr.",
          },
          {
            icon: Mic,
            title: "Sprachgespräche",
            description: "Sprich natürlich und höre warme, durchdachte Antworten.",
          },
          {
            icon: Shield,
            title: "Privat & Sicher",
            description: "Deine Gedanken bleiben deine. Datenschutzorientiert und sicher gespeichert.",
          },
        ],
      },
      pricing: {
        title: "Einfache, transparente Preise",
        free: {
          name: "Kostenlos",
          price: "€0",
          features: ["15 Nachrichten pro Tag", "Basis-Tagebuch", "Stimmungstracking", "Community-Übungen"],
        },
        plus: {
          name: "Plus",
          price: "€9,99",
          period: "/Monat",
          trial: "7 Tage kostenlos testen",
          features: ["Unbegrenzte Nachrichten", "Sprachgespräche", "Wöchentliche Einblicke", "Premium-Übungen", "Prioritäts-Support"],
          cta: "Kostenlos testen",
        },
      },
      testimonials: {
        title: "Was unsere Nutzer sagen",
        items: [
          { text: "Soulvay hat mir geholfen, meine Angst besser zu verstehen. Es ist wie ein geduldiger Freund, der immer da ist.", author: "Sarah K." },
          { text: "Die Atemübungen funktionieren wirklich. Ich nutze sie jetzt vor jedem wichtigen Meeting.", author: "Michael T." },
          { text: "Endlich eine App, die sich nicht klinisch anfühlt. Sie ist warm, menschlich und wirklich hilfreich.", author: "Emma L." },
        ],
      },
      footer: {
        tagline: "Mit Sorgfalt für dein Wohlbefinden erstellt",
        privacy: "Datenschutz",
        terms: "AGB",
        impressum: "Impressum",
        contact: "Kontakt",
      },
    },
  };

  const t = content[language];

  return (
    <div className="bg-background overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg shadow-primary/20">
              <img src={logoImage} alt="Soulvay" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-lg text-foreground">Soulvay</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "de" : "en")}
              className="px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {language === "en" ? "DE" : "EN"}
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setThemeMode(isDark ? "light" : "dark")}
              className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* CTA */}
            <Button onClick={() => navigate("/auth")} size="sm" className="hidden sm:flex">
              {language === "de" ? "Anmelden" : "Sign In"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-28 h-28 mb-8"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-transparent blur-2xl scale-150" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-2xl shadow-primary/20 ring-1 ring-primary/10">
              <img src={logoImage} alt="Soulvay" className="w-20 h-20 rounded-full object-cover" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance"
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="xl" onClick={() => navigate("/welcome")} className="gap-2">
              {t.hero.cta}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="xl" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              {t.hero.secondary}
            </Button>
          </motion.div>

          {/* Store Badges - Coming Soon */}
          {!isNativeBuild && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col items-center gap-2 mt-8"
            >
              <div className="flex items-center justify-center gap-4 opacity-50 grayscale">
                <div className="h-11">
                  <img src="/badges/app-store.svg" alt="App Store" className="h-full" />
                </div>
                <div className="h-11">
                  <img src="/badges/google-play.svg" alt="Google Play" className="h-full" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "de" ? "Bald verfügbar im App Store & Google Play" : "Coming soon to App Store & Google Play"}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
            {t.features.title}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.items.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-card rounded-2xl p-6 shadow-soft border border-border/40 hover:shadow-card transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
            {t.pricing.title}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-card rounded-2xl p-8 border border-border/40 shadow-soft">
              <h3 className="text-xl font-semibold text-foreground mb-2">{t.pricing.free.name}</h3>
              <div className="text-4xl font-bold text-foreground mb-6">{t.pricing.free.price}</div>
              <ul className="space-y-3 mb-8">
                {t.pricing.free.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate("/welcome")}>
                {language === "de" ? "Kostenlos starten" : "Get Started Free"}
              </Button>
            </div>

            {/* Plus Plan */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20 shadow-card relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {t.pricing.plus.trial}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{t.pricing.plus.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-foreground">{t.pricing.plus.price}</span>
                <span className="text-muted-foreground">{t.pricing.plus.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {t.pricing.plus.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-foreground">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate("/upgrade")}>
                {t.pricing.plus.cta}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
            {t.testimonials.title}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.items.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-card rounded-2xl p-6 shadow-soft border border-border/40"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4 italic">"{testimonial.text}"</p>
                <p className="text-muted-foreground text-sm font-medium">— {testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {language === "de" ? "Bereit, loszulegen?" : "Ready to get started?"}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {language === "de" 
              ? "Starte noch heute deine Reise zu mehr innerer Ruhe."
              : "Start your journey to inner peace today."}
          </p>
          <Button size="xl" onClick={() => navigate("/welcome")} className="gap-2">
            {t.hero.cta}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 pb-12 border-t border-border/40" style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom, 3rem))' }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img src={logoImage} alt="Soulvay" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-muted-foreground">{t.footer.tagline}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">{t.footer.privacy}</button>
              <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">{t.footer.terms}</button>
              <button onClick={() => navigate("/impressum")} className="hover:text-foreground transition-colors">{t.footer.impressum}</button>
              <button onClick={() => navigate("/faq")} className="hover:text-foreground transition-colors">FAQ</button>
              <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">{language === "de" ? "Über uns" : "About"}</button>
              <button onClick={() => navigate("/contact")} className="hover:text-foreground transition-colors">{t.footer.contact}</button>
            </div>
          </div>
          {/* Store Badges - Coming Soon */}
          {!isNativeBuild && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-4 opacity-50 grayscale">
                <div className="h-9">
                  <img src="/badges/app-store.svg" alt="App Store" className="h-full" />
                </div>
                <div className="h-9">
                  <img src="/badges/google-play.svg" alt="Google Play" className="h-full" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "de" ? "Bald verfügbar" : "Coming soon"}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} Soulvay. {language === "de" ? "Alle Rechte vorbehalten." : "All rights reserved."}</p>
        </div>
      </footer>
    </div>
  );
}
