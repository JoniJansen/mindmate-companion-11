import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Globe, MessageCircle, User, Sun, Moon, Target, Clock, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/hooks/useTheme";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/hooks/useAuth";
import { companionArchetypes, CompanionArchetype } from "@/data/companions";
import logoImage from "@/assets/logo.png";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";

type Language = "en" | "de";
type Tone = "gentle" | "neutral" | "structured";
type AddressForm = "du" | "sie";

interface OnboardingState {
  language: Language;
  tone: Tone;
  addressForm: AddressForm;
  disclaimerAccepted: boolean;
  // Phase 3: New personalization fields
  focusAreas: string[];
  reflectionFrequency: string;
  personalGoal: string;
  companionId: string;
}

const steps = ["welcome", "disclaimer", "preferences", "companion", "companion-intro", "focus", "frequency", "goal"] as const;
type Step = typeof steps[number];

const focusOptions = {
  en: [
    { id: "stress", label: "Stress", emoji: "😤" },
    { id: "anxiety", label: "Anxiety", emoji: "😰" },
    { id: "sleep", label: "Sleep", emoji: "😴" },
    { id: "relationships", label: "Relationships", emoji: "💛" },
    { id: "selfworth", label: "Self-worth", emoji: "🌱" },
    { id: "motivation", label: "Motivation", emoji: "⚡" },
    { id: "grief", label: "Grief & Loss", emoji: "🕊️" },
    { id: "general", label: "Just exploring", emoji: "🔍" },
  ],
  de: [
    { id: "stress", label: "Stress", emoji: "😤" },
    { id: "anxiety", label: "Angst", emoji: "😰" },
    { id: "sleep", label: "Schlaf", emoji: "😴" },
    { id: "relationships", label: "Beziehungen", emoji: "💛" },
    { id: "selfworth", label: "Selbstwert", emoji: "🌱" },
    { id: "motivation", label: "Motivation", emoji: "⚡" },
    { id: "grief", label: "Trauer & Verlust", emoji: "🕊️" },
    { id: "general", label: "Einfach erkunden", emoji: "🔍" },
  ],
};

const frequencyOptions = {
  en: [
    { id: "daily", label: "Every day", desc: "Build a daily habit" },
    { id: "3-4x", label: "3-4x per week", desc: "Regular check-ins" },
    { id: "weekly", label: "Once a week", desc: "Weekly reflection" },
    { id: "flexible", label: "When I need it", desc: "No pressure" },
  ],
  de: [
    { id: "daily", label: "Jeden Tag", desc: "Eine tägliche Gewohnheit aufbauen" },
    { id: "3-4x", label: "3-4x pro Woche", desc: "Regelmäßige Check-ins" },
    { id: "weekly", label: "Einmal pro Woche", desc: "Wöchentliche Reflexion" },
    { id: "flexible", label: "Wenn ich es brauche", desc: "Kein Druck" },
  ],
};

const translations = {
  en: {
    continue: "Continue",
    getStarted: "Begin",
    welcome: {
      title: "A quiet space for your mind",
      subtitle: "Soulvay is here to listen. No goals, no pressure—just a calm companion when you need one.",
    },
    disclaimer: {
      title: "A few words before we start",
      text: "Soulvay is an AI companion—thoughtful, but not a therapist. It can listen and help you reflect, but it",
      notReplacement: "cannot replace professional support",
      textEnd: "for mental health concerns.",
      crisis: "If you're going through something serious, please reach out to a real person. We'll always show you how.",
      checkbox: "I understand Soulvay is not therapy or medical advice",
    },
    preferences: {
      title: "Make it yours",
      subtitle: "You can change these anytime",
      language: "Language",
      tone: "How should I speak?",
      tones: { gentle: "Gentle", neutral: "Balanced", structured: "Clear" },
      addressForm: "How should I address you?",
      addressForms: { du: "Informal", sie: "Formal" },
    },
    companion: {
      title: "Choose your companion",
      subtitle: "Who should reflect with you?",
    },
    companionIntro: {
      greeting: "Nice to meet you.",
      description: "I'll be your reflection companion — here to listen, think with you, and help you understand yourself better.",
      ready: "Let's continue setting up.",
    },
    focus: {
      title: "What's on your mind?",
      subtitle: "Choose what resonates — you can pick multiple.",
    },
    frequency: {
      title: "How often would you like to reflect?",
      subtitle: "This helps us personalize your experience.",
    },
    goal: {
      title: "Imagine 4 weeks from now",
      subtitle: "What would be different?",
      placeholder: "I'd feel more calm... / I'd understand myself better... / I'd sleep better...",
      skip: "Skip for now",
    },
  },
  de: {
    continue: "Weiter",
    getStarted: "Beginnen",
    welcome: {
      title: "Ein ruhiger Raum für deinen Geist",
      subtitle: "Soulvay ist hier, um zuzuhören. Keine Ziele, kein Druck—einfach ein ruhiger Begleiter, wenn du einen brauchst.",
    },
    disclaimer: {
      title: "Ein paar Worte bevor wir starten",
      text: "Soulvay ist ein KI-Begleiter—durchdacht, aber kein Therapeut. Es kann zuhören und dir helfen zu reflektieren, aber es",
      notReplacement: "kann professionelle Unterstützung nicht ersetzen",
      textEnd: "bei psychischen Anliegen.",
      crisis: "Wenn du etwas Ernstes durchmachst, wende dich bitte an einen echten Menschen. Wir zeigen dir immer, wie.",
      checkbox: "Ich verstehe, dass Soulvay keine Therapie oder medizinischer Rat ist",
    },
    preferences: {
      title: "Mach es zu deinem",
      subtitle: "Du kannst das jederzeit ändern",
      language: "Sprache",
      tone: "Wie soll ich sprechen?",
      tones: { gentle: "Sanft", neutral: "Ausgewogen", structured: "Klar" },
      addressForm: "Wie soll ich dich ansprechen?",
      addressForms: { du: "Du (informell)", sie: "Sie (formell)" },
    },
    companion: {
      title: "Wähle deinen Begleiter",
      subtitle: "Wer soll mit dir reflektieren?",
    },
    companionIntro: {
      greeting: "Schön, dich kennenzulernen.",
      description: "Ich werde dein Reflexionsbegleiter sein — hier, um zuzuhören, mit dir nachzudenken und dir zu helfen, dich selbst besser zu verstehen.",
      ready: "Lass uns weitermachen.",
    },
    focus: {
      title: "Was beschäftigt dich?",
      subtitle: "Wähle, was sich richtig anfühlt — Mehrfachauswahl möglich.",
    },
    frequency: {
      title: "Wie oft möchtest du reflektieren?",
      subtitle: "Das hilft uns, dein Erlebnis zu personalisieren.",
    },
    goal: {
      title: "Stell dir vor: 4 Wochen ab jetzt",
      subtitle: "Was wäre anders?",
      placeholder: "Ich wäre ruhiger... / Ich würde mich besser verstehen... / Ich würde besser schlafen...",
      skip: "Erstmal überspringen",
    },
  },
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [state, setState] = useState<OnboardingState>(() => {
    const browserLang = navigator.language?.toLowerCase() || "";
    const detectedLang: Language = browserLang.startsWith("de") ? "de" : "en";
    return {
      language: detectedLang,
      tone: "gentle",
      addressForm: "du",
      disclaimerAccepted: false,
      focusAreas: [],
      reflectionFrequency: "",
      personalGoal: "",
      companionId: "mira",
    };
  });
  const navigate = useNavigate();
  const { isDark, setMode: setThemeMode } = useTheme();
  const { completeOnboarding } = useOnboardingStatus();
  const { isAuthenticated } = useAuth();

  const currentStepIndex = steps.indexOf(currentStep);
  const t = translations[state.language];

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    // Save preferences (unified soulvay-* key)
    const prefsPayload = JSON.stringify({
      language: state.language,
      tone: state.tone,
      addressForm: state.addressForm,
      disclaimerAccepted: state.disclaimerAccepted,
    });
    localStorage.setItem("soulvay-preferences", prefsPayload);
    // Keep legacy key for backward compat during migration
    localStorage.setItem("mindmate-preferences", prefsPayload);

    // Save personalization data separately (versioned)
    localStorage.setItem("soulvay-personalization", JSON.stringify({
      schemaVersion: 1,
      focusAreas: state.focusAreas,
      reflectionFrequency: state.reflectionFrequency || "3x_week",
      personalGoal: state.personalGoal,
      companionId: state.companionId,
    }));

    completeOnboarding();

    if (isAuthenticated) {
      navigate("/", { replace: true });
    } else {
      navigate("/auth?from=onboarding", { replace: true });
    }
  };

  const canProceed = () => {
    if (currentStep === "disclaimer") return state.disclaimerAccepted;
    if (currentStep === "focus") return state.focusAreas.length > 0;
    if (currentStep === "frequency") return state.reflectionFrequency !== "";
    return true;
  };

  const toggleFocus = (id: string) => {
    setState(s => ({
      ...s,
      focusAreas: s.focusAreas.includes(id)
        ? s.focusAreas.filter(f => f !== id)
        : [...s.focusAreas, id],
    }));
  };

  return (
    <div className="bg-background flex flex-col h-[100dvh]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2 safe-top shrink-0">
        <div className="w-10" />
        <div className="flex justify-center gap-2">
          {steps.map((step, index) => (
            <motion.div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStepIndex
                  ? "w-8 bg-primary"
                  : index < currentStepIndex
                  ? "w-3 bg-primary/40"
                  : "w-3 bg-muted"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setThemeMode(isDark ? "light" : "dark")}
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <motion.div
            key={isDark ? "moon" : "sun"}
            initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.div>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6">
        <AnimatePresence mode="wait">
          {currentStep === "welcome" && (
            <motion.div key="welcome" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <WelcomeStep t={t.welcome} />
            </motion.div>
          )}
          {currentStep === "disclaimer" && (
            <motion.div key="disclaimer" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <DisclaimerStep t={t.disclaimer} accepted={state.disclaimerAccepted} onAcceptChange={(accepted) => setState(s => ({ ...s, disclaimerAccepted: accepted }))} />
            </motion.div>
          )}
          {currentStep === "preferences" && (
            <motion.div key="preferences" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <PreferencesStep t={t.preferences} language={state.language} tone={state.tone} addressForm={state.addressForm} onLanguageChange={(language) => setState(s => ({ ...s, language }))} onToneChange={(tone) => setState(s => ({ ...s, tone }))} onAddressFormChange={(addressForm) => setState(s => ({ ...s, addressForm }))} />
            </motion.div>
          )}
          {currentStep === "companion" && (
            <motion.div key="companion" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <CompanionStep t={(t as any).companion} language={state.language} selected={state.companionId} onSelect={(id) => setState(s => ({ ...s, companionId: id }))} />
            </motion.div>
          )}
          {currentStep === "companion-intro" && (
            <motion.div key="companion-intro" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CompanionIntroStep t={(t as any).companionIntro} archetype={companionArchetypes.find(a => a.id === state.companionId)!} language={state.language} />
            </motion.div>
          )}
          {currentStep === "focus" && (
            <motion.div key="focus" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <FocusStep t={t.focus} options={focusOptions[state.language]} selected={state.focusAreas} onToggle={toggleFocus} />
            </motion.div>
          )}
          {currentStep === "frequency" && (
            <motion.div key="frequency" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <FrequencyStep t={t.frequency} options={frequencyOptions[state.language]} selected={state.reflectionFrequency} onSelect={(f) => setState(s => ({ ...s, reflectionFrequency: f }))} />
            </motion.div>
          )}
          {currentStep === "goal" && (
            <motion.div key="goal" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <GoalStep t={t.goal} value={state.personalGoal} onChange={(g) => setState(s => ({ ...s, personalGoal: g }))} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom CTA — always visible */}
      <div className="shrink-0 px-6 pt-3 pb-4 bg-background border-t border-border/30">
        {currentStep === "goal" ? (
          <div className="space-y-3">
            <Button size="xl" className="w-full" onClick={finishOnboarding}>
              {t.getStarted}
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
            {!state.personalGoal && (
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={finishOnboarding}>
                {t.goal.skip}
              </Button>
            )}
          </div>
        ) : (
          <Button size="xl" className="w-full" onClick={handleNext} disabled={!canProceed()}>
            {t.continue}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// === Step Components ===

function WelcomeStep({ t }: { t: typeof translations.en.welcome }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-12">
        <motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-transparent blur-2xl scale-150" animate={{ opacity: [0.5, 0.8, 0.5], scale: [1.4, 1.6, 1.4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-2xl shadow-primary/20 ring-1 ring-primary/10 dark:from-primary/25 dark:to-primary/10 dark:shadow-primary/30" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <div className="w-24 h-24 rounded-full overflow-hidden">
            <img src={logoImage} alt="Soulvay Logo" className="w-24 h-24 object-cover rounded-full" />
          </div>
        </motion.div>
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-4 text-balance">{t.title}</h1>
      <p className="text-muted-foreground text-base leading-relaxed max-w-xs">{t.subtitle}</p>
    </div>
  );
}

function DisclaimerStep({ t, accepted, onAcceptChange }: { t: typeof translations.en.disclaimer; accepted: boolean; onAcceptChange: (v: boolean) => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center px-2">
      <h2 className="text-xl font-semibold text-foreground mb-6 text-center">{t.title}</h2>
      <div className="bg-card rounded-2xl p-5 mb-6 shadow-soft border border-border/40 dark:border-border/60 dark:bg-card/80">
        <p className="text-foreground text-sm leading-relaxed">{t.text} <span className="font-medium text-primary">{t.notReplacement}</span> {t.textEnd}</p>
        <p className="text-muted-foreground text-sm leading-relaxed mt-4 pt-4 border-t border-border/40 dark:border-border/60">{t.crisis}</p>
      </div>
      <label className="flex items-center gap-3 cursor-pointer group bg-muted/40 dark:bg-muted/60 rounded-xl p-4 transition-colors hover:bg-muted/60 dark:hover:bg-muted/80">
        <Checkbox checked={accepted} onCheckedChange={(checked) => onAcceptChange(checked === true)} />
        <span className="text-sm text-foreground leading-relaxed">{t.checkbox}</span>
      </label>
    </div>
  );
}

function PreferencesStep({ t, language, tone, addressForm, onLanguageChange, onToneChange, onAddressFormChange }: {
  t: typeof translations.en.preferences; language: Language; tone: Tone; addressForm: AddressForm;
  onLanguageChange: (l: Language) => void; onToneChange: (t: Tone) => void; onAddressFormChange: (a: AddressForm) => void;
}) {
  return (
    <div className="flex-1 flex flex-col pt-4">
      <h2 className="text-xl font-semibold text-foreground mb-2 text-center">{t.title}</h2>
      <p className="text-muted-foreground text-sm text-center mb-8">{t.subtitle}</p>
      <div className="space-y-6">
        <PreferenceSection icon={Globe} title={t.language}>
          <div className="flex gap-2">
            <OptionButton selected={language === "en"} onClick={() => onLanguageChange("en")}>English</OptionButton>
            <OptionButton selected={language === "de"} onClick={() => onLanguageChange("de")}>Deutsch</OptionButton>
          </div>
        </PreferenceSection>
        <PreferenceSection icon={MessageCircle} title={t.tone}>
          <div className="flex gap-2 flex-wrap">
            <OptionButton selected={tone === "gentle"} onClick={() => onToneChange("gentle")}>{t.tones.gentle}</OptionButton>
            <OptionButton selected={tone === "neutral"} onClick={() => onToneChange("neutral")}>{t.tones.neutral}</OptionButton>
            <OptionButton selected={tone === "structured"} onClick={() => onToneChange("structured")}>{t.tones.structured}</OptionButton>
          </div>
        </PreferenceSection>
        {language === "de" && (
          <PreferenceSection icon={User} title={t.addressForm}>
            <div className="flex gap-2">
              <OptionButton selected={addressForm === "du"} onClick={() => onAddressFormChange("du")}>{t.addressForms.du}</OptionButton>
              <OptionButton selected={addressForm === "sie"} onClick={() => onAddressFormChange("sie")}>{t.addressForms.sie}</OptionButton>
            </div>
          </PreferenceSection>
        )}
      </div>
    </div>
  );
}

function FocusStep({ t, options, selected, onToggle }: {
  t: typeof translations.en.focus;
  options: { id: string; label: string; emoji: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col pt-4">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Target className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{t.title}</h2>
        <p className="text-muted-foreground text-sm">{t.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 border ${
              selected.includes(opt.id)
                ? "bg-primary/10 border-primary/30 shadow-sm"
                : "bg-card border-border/40 hover:border-border/60"
            }`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className={`text-sm font-medium ${selected.includes(opt.id) ? "text-foreground" : "text-muted-foreground"}`}>
              {opt.label}
            </span>
            {selected.includes(opt.id) && <Check className="w-4 h-4 text-primary ml-auto" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function FrequencyStep({ t, options, selected, onSelect }: {
  t: typeof translations.en.frequency;
  options: { id: string; label: string; desc: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col pt-4">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{t.title}</h2>
        <p className="text-muted-foreground text-sm">{t.subtitle}</p>
      </div>
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 border ${
              selected === opt.id
                ? "bg-primary/10 border-primary/30 shadow-sm"
                : "bg-card border-border/40 hover:border-border/60"
            }`}
          >
            <div className="flex-1">
              <p className={`text-sm font-medium ${selected === opt.id ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </div>
            {selected === opt.id && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Check className="w-5 h-5 text-primary" />
              </motion.div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function GoalStep({ t, value, onChange }: {
  t: typeof translations.en.goal;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col pt-4">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{t.title}</h2>
        <p className="text-muted-foreground text-sm">{t.subtitle}</p>
      </div>
      <div className="bg-card rounded-2xl border border-border/40 p-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.placeholder}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[120px] text-base leading-relaxed"
          rows={4}
        />
      </div>
    </div>
  );
}

function CompanionStep({ t, language, selected, onSelect }: {
  t: { title: string; subtitle: string };
  language: Language;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const checkInStyleLabel = {
    en: {
      warm: "Warm", curious: "Curious", reflective: "Reflective",
      direct: "Direct", gentle: "Gentle", observant: "Observant",
    },
    de: {
      warm: "Warm", curious: "Neugierig", reflective: "Reflektiert",
      direct: "Direkt", gentle: "Sanft", observant: "Aufmerksam",
    },
  } as const;

  const pacingLabel = {
    en: { slow: "Slow pace", medium: "Balanced pace", responsive: "Responsive" },
    de: { slow: "Ruhiges Tempo", medium: "Ausgewogen", responsive: "Reaktionsstark" },
  } as const;

  return (
    <div className="flex-1 flex flex-col pt-2">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-foreground mb-1">{t.title}</h2>
        <p className="text-muted-foreground text-sm">{t.subtitle}</p>
      </div>

      {/* Single-column scrollable list for maximum clarity */}
      <div className="flex flex-col gap-3 pb-4">
        {companionArchetypes.map((arch) => {
          const isSelected = selected === arch.id;
          const description = language === "de" ? arch.descriptionDe : arch.description;
          const primaryTrait = checkInStyleLabel[language][arch.checkInStyle];
          const secondaryTrait = pacingLabel[language][arch.emotionalPacing];

          return (
            <motion.button
              key={arch.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(arch.id)}
              className={`relative w-full rounded-2xl border text-left transition-all flex flex-row items-stretch overflow-hidden ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm"
                  : "border-border/40 bg-card hover:border-border/60"
              }`}
            >
              {/* Selection badge */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
                >
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </motion.div>
              )}

              {/* Avatar — fixed width, full height, no cropping */}
              <div className="w-24 sm:w-28 shrink-0 bg-muted/20">
                <img
                  src={arch.defaultAvatar}
                  alt={arch.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  draggable={false}
                />
              </div>

              {/* Info section */}
              <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1 min-w-0 justify-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{arch.emoji}</span>
                  <p className="font-semibold text-foreground text-sm sm:text-base truncate">{arch.name}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium ${
                    isSelected ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {primaryTrait}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium ${
                    isSelected ? "bg-primary/10 text-foreground" : "bg-muted/80 text-muted-foreground"
                  }`}>
                    {secondaryTrait}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function CompanionIntroStep({ t, archetype, language }: {
  t: { greeting: string; description: string; ready: string };
  archetype: CompanionArchetype;
  language: Language;
}) {
  const personalGreeting = language === "de" ? archetype.introGreetingDe : archetype.introGreeting;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-8"
      >
        <CompanionAvatarAnimated
          archetype={archetype.id}
          name={archetype.name}
          size="xl"
          state="idle"
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-3 max-w-xs"
      >
        <h2 className="text-2xl font-semibold text-foreground">{archetype.name}</h2>
        <p className="text-primary/80 text-sm font-medium">
          {language === "de" ? archetype.descriptionDe : archetype.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8 bg-card rounded-2xl border border-border/50 p-5 max-w-xs shadow-sm"
      >
        <p className="text-foreground text-sm leading-relaxed italic">
          "{personalGreeting}"
        </p>
        <p className="text-muted-foreground text-xs mt-3">{t.ready}</p>
      </motion.div>
    </div>
  );
}

// === Shared UI ===

function PreferenceSection({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        selected
          ? "bg-primary text-primary-foreground shadow-md dark:shadow-primary/20"
          : "bg-muted/50 text-muted-foreground hover:bg-muted dark:bg-muted/70 dark:text-foreground/70 dark:hover:bg-muted dark:hover:text-foreground"
      }`}
    >
      <span className="flex items-center gap-2">
        {selected && <Check className="w-4 h-4" />}
        {children}
      </span>
    </button>
  );
}
