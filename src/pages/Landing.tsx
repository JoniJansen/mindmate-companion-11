import { useState, useMemo } from "react";
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
import { shouldShowStoreBadges, shouldShowStoreMessaging } from "@/lib/platformSeparation";
import { DemoChat } from "@/components/landing/DemoChat";

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
    // Default to German (primary market) — switch to English only for explicit EN browsers
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("en") && !browserLang.includes("de")) return "en";
    return "de";
  });

  const showBadges = useMemo(() => shouldShowStoreBadges(), []);

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
      testimonials: {
        title: "What our users say",
        items: [
          { text: "Soulvay helped me understand my anxiety better. It's like having a patient friend available 24/7.", author: "Sarah K." },
          { text: "The breathing exercises actually work. I use them before every important meeting now.", author: "Michael T." },
          { text: "Finally an app that doesn't feel clinical. It's warm, human, and genuinely helpful.", author: "Emma L." },
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
      testimonials: {
        title: "Was unsere Nutzer sagen",
        items: [
          { text: "Soulvay hat mir geholfen, meine Angst besser zu verstehen. Es ist wie ein geduldiger Freund, der immer da ist.", author: "Sarah K." },
          { text: "Die Atemübungen funktionieren wirklich. Ich nutze sie jetzt vor jedem wichtigen Meeting.", author: "Michael T." },
          { text: "Endlich eine App, die sich nicht klinisch anfühlt. Sie ist warm, menschlich und wirklich hilfreich.", author: "Emma L." },
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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
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
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            {t.features.title}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.features.items.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="bg-card rounded-2xl p-5 shadow-soft border border-border/40 hover:shadow-card transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            {t.pricing.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl p-7 border border-border/40 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground mb-2">{t.pricing.free.name}</h3>
              <div className="text-3xl font-bold text-foreground mb-5">{t.pricing.free.price}</div>
              <ul className="space-y-2.5 mb-6">
                {t.pricing.free.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-muted-foreground text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate("/welcome")}>
                {language === "de" ? "Kostenlos starten" : "Get Started Free"}
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-7 border border-primary/20 shadow-card relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">{t.pricing.plus.trial}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t.pricing.plus.name}</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-foreground">{t.pricing.plus.price}</span>
                <span className="text-muted-foreground text-sm">{t.pricing.plus.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {t.pricing.plus.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-foreground text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate("/upgrade")}>{t.pricing.plus.cta}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">{t.testimonials.title}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {t.testimonials.items.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-card rounded-2xl p-5 shadow-soft border border-border/40"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground text-sm mb-3 italic">"{testimonial.text}"</p>
                <p className="text-muted-foreground text-xs font-medium">— {testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {language === "de" ? "Bereit, loszulegen?" : "Ready to get started?"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === "de" ? "Starte noch heute deine Reise zu mehr innerer Ruhe." : "Start your journey to inner peace today."}
          </p>
          <Button size="lg" onClick={() => navigate("/welcome")} className="gap-2">
            {t.hero.cta} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 pb-12 border-t border-border/40" style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom, 3rem))' }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-5">
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden">
                <img src={logoImage} alt="Soulvay" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-muted-foreground">{t.footer.tagline}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-5 text-sm text-muted-foreground">
              <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">{t.footer.privacy}</button>
              <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">{t.footer.terms}</button>
              <button onClick={() => navigate("/impressum")} className="hover:text-foreground transition-colors">{t.footer.impressum}</button>
              <button onClick={() => navigate("/faq")} className="hover:text-foreground transition-colors">FAQ</button>
              <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">{language === "de" ? "Über uns" : "About"}</button>
              <button onClick={() => navigate("/contact")} className="hover:text-foreground transition-colors">{t.footer.contact}</button>
            </div>
          </div>
          {showBadges && shouldShowStoreMessaging() && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-4 opacity-50 grayscale">
                <div className="h-8"><img src="/badges/app-store.svg" alt="App Store" className="h-full" /></div>
              </div>
              <p className="text-xs text-muted-foreground">{language === "de" ? "Bald verfügbar" : "Coming soon"}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} Soulvay. {language === "de" ? "Alle Rechte vorbehalten." : "All rights reserved."}</p>
        </div>
      </footer>
    </div>
  );
}
