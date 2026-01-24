import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Globe, MessageCircle, User, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/hooks/useTheme";
import logoImage from "@/assets/logo.png";

type Language = "en" | "de";
type Tone = "gentle" | "neutral" | "structured";
type AddressForm = "du" | "sie";

interface OnboardingState {
  language: Language;
  tone: Tone;
  addressForm: AddressForm;
  disclaimerAccepted: boolean;
}

const steps = ["welcome", "disclaimer", "preferences"] as const;
type Step = typeof steps[number];

const translations = {
  en: {
    continue: "Continue",
    getStarted: "Begin",
    welcome: {
      title: "A quiet space for your mind",
      subtitle: "MindMate is here to listen. No goals, no pressure—just a calm companion when you need one.",
    },
    disclaimer: {
      title: "A few words before we start",
      text: "MindMate is an AI companion—thoughtful, but not a therapist. It can listen and help you reflect, but it",
      notReplacement: "cannot replace professional support",
      textEnd: "for mental health concerns.",
      crisis: "If you're going through something serious, please reach out to a real person. We'll always show you how.",
      checkbox: "I understand MindMate is not therapy or medical advice",
    },
    preferences: {
      title: "Make it yours",
      subtitle: "You can change these anytime",
      language: "Language",
      tone: "How should I speak?",
      tones: {
        gentle: "Gentle",
        neutral: "Balanced",
        structured: "Clear",
      },
      addressForm: "How should I address you?",
      addressForms: {
        du: "Informal",
        sie: "Formal",
      },
    },
    firstQuestion: {
      title: "One more thing",
      subtitle: "What brings you here today?",
      placeholder: "I've been feeling... / I want to... / Just exploring...",
      skip: "Skip for now",
    },
  },
  de: {
    continue: "Weiter",
    getStarted: "Beginnen",
    welcome: {
      title: "Ein ruhiger Raum für deinen Geist",
      subtitle: "MindMate ist hier, um zuzuhören. Keine Ziele, kein Druck—einfach ein ruhiger Begleiter, wenn du einen brauchst.",
    },
    disclaimer: {
      title: "Ein paar Worte bevor wir starten",
      text: "MindMate ist ein KI-Begleiter—durchdacht, aber kein Therapeut. Es kann zuhören und dir helfen zu reflektieren, aber es",
      notReplacement: "kann professionelle Unterstützung nicht ersetzen",
      textEnd: "bei psychischen Anliegen.",
      crisis: "Wenn du etwas Ernstes durchmachst, wende dich bitte an einen echten Menschen. Wir zeigen dir immer, wie.",
      checkbox: "Ich verstehe, dass MindMate keine Therapie oder medizinischer Rat ist",
    },
    preferences: {
      title: "Mach es zu deinem",
      subtitle: "Du kannst das jederzeit ändern",
      language: "Sprache",
      tone: "Wie soll ich sprechen?",
      tones: {
        gentle: "Sanft",
        neutral: "Ausgewogen",
        structured: "Klar",
      },
      addressForm: "Wie soll ich dich ansprechen?",
      addressForms: {
        du: "Du (informell)",
        sie: "Sie (formell)",
      },
    },
    firstQuestion: {
      title: "Noch eine Sache",
      subtitle: "Was führt dich heute hierher?",
      placeholder: "Ich fühle mich... / Ich möchte... / Ich schaue mich nur um...",
      skip: "Erstmal überspringen",
    },
  },
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [state, setState] = useState<OnboardingState>({
    language: "en",
    tone: "gentle",
    addressForm: "du",
    disclaimerAccepted: false,
  });
  const navigate = useNavigate();
  const { isDark, setMode: setThemeMode } = useTheme();

  const currentStepIndex = steps.indexOf(currentStep);
  const t = translations[state.language];

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      // Save preferences to localStorage
      localStorage.setItem("mindmate-preferences", JSON.stringify(state));
      navigate("/");
    }
  };

  const canProceed = () => {
    if (currentStep === "disclaimer") {
      return state.disclaimerAccepted;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Dark Mode Toggle */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2 safe-top">
        <div className="w-10" /> {/* Spacer */}
        
        {/* Progress indicator */}
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
        
        {/* Dark Mode Toggle */}
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

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pb-6">
        <AnimatePresence mode="wait">
          {currentStep === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <WelcomeStep t={t.welcome} />
            </motion.div>
          )}
          {currentStep === "disclaimer" && (
            <motion.div
              key="disclaimer"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <DisclaimerStep
                t={t.disclaimer}
                accepted={state.disclaimerAccepted}
                onAcceptChange={(accepted) =>
                  setState((s) => ({ ...s, disclaimerAccepted: accepted }))
                }
              />
            </motion.div>
          )}
          {currentStep === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <PreferencesStep
                t={t.preferences}
                language={state.language}
                tone={state.tone}
                addressForm={state.addressForm}
                onLanguageChange={(language) => setState((s) => ({ ...s, language }))}
                onToneChange={(tone) => setState((s) => ({ ...s, tone }))}
                onAddressFormChange={(addressForm) => setState((s) => ({ ...s, addressForm }))}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue button */}
        <div className="mt-auto pt-6 safe-bottom">
          <Button
            size="xl"
            className="w-full"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === "preferences" ? t.getStarted : t.continue}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface WelcomeStepProps {
  t: typeof translations.en.welcome;
}

function WelcomeStep({ t }: WelcomeStepProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      {/* Modern circular logo with breathing animation and glow */}
      <div className="relative mb-12">
        {/* Outer glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-transparent blur-2xl scale-150"
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
            scale: [1.4, 1.6, 1.4]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Main logo container */}
        <motion.div
          className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-2xl shadow-primary/20 ring-1 ring-primary/10 dark:from-primary/25 dark:to-primary/10 dark:shadow-primary/30"
          animate={{ 
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-24 h-24 rounded-full overflow-hidden">
            <img 
              src={logoImage} 
              alt="MindMate Assistant Logo" 
              className="w-24 h-24 object-cover rounded-full"
            />
          </div>
        </motion.div>
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-4 text-balance">
        {t.title}
      </h1>

      <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
        {t.subtitle}
      </p>
    </div>
  );
}

interface DisclaimerStepProps {
  t: typeof translations.en.disclaimer;
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

function DisclaimerStep({ t, accepted, onAcceptChange }: DisclaimerStepProps) {
  return (
    <div className="flex-1 flex flex-col justify-center px-2">
      <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
        {t.title}
      </h2>

      <div className="bg-card rounded-2xl p-5 mb-6 shadow-soft border border-border/40 dark:border-border/60 dark:bg-card/80">
        <p className="text-foreground text-sm leading-relaxed">
          {t.text}{" "}
          <span className="font-medium text-primary">{t.notReplacement}</span>{" "}
          {t.textEnd}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mt-4 pt-4 border-t border-border/40 dark:border-border/60">
          {t.crisis}
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group bg-muted/40 dark:bg-muted/60 rounded-xl p-4 transition-colors hover:bg-muted/60 dark:hover:bg-muted/80">
        <Checkbox
          checked={accepted}
          onCheckedChange={(checked) => onAcceptChange(checked === true)}
        />
        <span className="text-sm text-foreground leading-relaxed">
          {t.checkbox}
        </span>
      </label>
    </div>
  );
}

interface PreferencesStepProps {
  t: typeof translations.en.preferences;
  language: Language;
  tone: Tone;
  addressForm: AddressForm;
  onLanguageChange: (language: Language) => void;
  onToneChange: (tone: Tone) => void;
  onAddressFormChange: (addressForm: AddressForm) => void;
}

function PreferencesStep({
  t,
  language,
  tone,
  addressForm,
  onLanguageChange,
  onToneChange,
  onAddressFormChange,
}: PreferencesStepProps) {
  return (
    <div className="flex-1 flex flex-col pt-4">
      <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
        {t.title}
      </h2>
      <p className="text-muted-foreground text-sm text-center mb-8">
        {t.subtitle}
      </p>

      <div className="space-y-6">
        {/* Language */}
        <PreferenceSection icon={Globe} title={t.language}>
          <div className="flex gap-2">
            <OptionButton
              selected={language === "en"}
              onClick={() => onLanguageChange("en")}
            >
              English
            </OptionButton>
            <OptionButton
              selected={language === "de"}
              onClick={() => onLanguageChange("de")}
            >
              Deutsch
            </OptionButton>
          </div>
        </PreferenceSection>

        {/* Tone */}
        <PreferenceSection icon={MessageCircle} title={t.tone}>
          <div className="flex gap-2 flex-wrap">
            <OptionButton
              selected={tone === "gentle"}
              onClick={() => onToneChange("gentle")}
            >
              {t.tones.gentle}
            </OptionButton>
            <OptionButton
              selected={tone === "neutral"}
              onClick={() => onToneChange("neutral")}
            >
              {t.tones.neutral}
            </OptionButton>
            <OptionButton
              selected={tone === "structured"}
              onClick={() => onToneChange("structured")}
            >
              {t.tones.structured}
            </OptionButton>
          </div>
        </PreferenceSection>

        {/* Form of address - only show for German */}
        {language === "de" && (
          <PreferenceSection icon={User} title={t.addressForm}>
            <div className="flex gap-2">
              <OptionButton
                selected={addressForm === "du"}
                onClick={() => onAddressFormChange("du")}
              >
                {t.addressForms.du}
              </OptionButton>
              <OptionButton
                selected={addressForm === "sie"}
                onClick={() => onAddressFormChange("sie")}
              >
                {t.addressForms.sie}
              </OptionButton>
            </div>
          </PreferenceSection>
        )}
      </div>
    </div>
  );
}

interface PreferenceSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}

function PreferenceSection({ icon: Icon, title, children }: PreferenceSectionProps) {
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

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function OptionButton({ selected, onClick, children }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
        ${selected
          ? "bg-primary text-primary-foreground shadow-md dark:shadow-primary/20"
          : "bg-muted/50 text-muted-foreground hover:bg-muted dark:bg-muted/70 dark:text-foreground/70 dark:hover:bg-muted dark:hover:text-foreground"
        }
      `}
    >
      <span className="flex items-center gap-2">
        {selected && <Check className="w-4 h-4" />}
        {children}
      </span>
    </button>
  );
}
