import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowRight, Check, Globe, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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
    getStarted: "Get Started",
    welcome: {
      title: "Welcome to MindMate",
      subtitle: "Your calm companion for everyday mental wellness. I'm here to listen, support your reflection, and help you build healthy habits—anytime you need.",
    },
    disclaimer: {
      title: "Before we begin",
      text: "MindMate is a supportive AI companion designed to help you reflect on your thoughts and feelings. However, it is",
      notReplacement: "not a replacement",
      textEnd: "for professional psychotherapy, counseling, or medical treatment.",
      crisis: "If you're experiencing a mental health crisis, please reach out to a qualified professional or emergency services.",
      checkbox: "I understand that this app does not replace psychotherapy or medical treatment, and I agree to the terms of use.",
    },
    preferences: {
      title: "Personalize your experience",
      subtitle: "You can change these anytime in settings",
      language: "Language",
      tone: "Conversation tone",
      tones: {
        gentle: "Gentle",
        neutral: "Neutral",
        structured: "Structured",
      },
      addressForm: "Form of address",
      addressForms: {
        du: "Informal",
        sie: "Formal",
      },
    },
  },
  de: {
    continue: "Weiter",
    getStarted: "Los geht's",
    welcome: {
      title: "Willkommen bei MindMate",
      subtitle: "Dein ruhiger Begleiter für dein tägliches mentales Wohlbefinden. Ich bin hier, um zuzuhören, deine Reflexion zu unterstützen und dir zu helfen, gesunde Gewohnheiten aufzubauen—wann immer du mich brauchst.",
    },
    disclaimer: {
      title: "Bevor wir beginnen",
      text: "MindMate ist ein unterstützender KI-Begleiter, der dir helfen soll, über deine Gedanken und Gefühle zu reflektieren. Er ist jedoch",
      notReplacement: "kein Ersatz",
      textEnd: "für professionelle Psychotherapie, Beratung oder medizinische Behandlung.",
      crisis: "Wenn du dich in einer psychischen Krise befindest, wende dich bitte an einen qualifizierten Fachmann oder die Notdienste.",
      checkbox: "Ich verstehe, dass diese App keine Psychotherapie oder medizinische Behandlung ersetzt, und ich stimme den Nutzungsbedingungen zu.",
    },
    preferences: {
      title: "Personalisiere dein Erlebnis",
      subtitle: "Du kannst diese Einstellungen jederzeit ändern",
      language: "Sprache",
      tone: "Gesprächston",
      tones: {
        gentle: "Sanft",
        neutral: "Neutral",
        structured: "Strukturiert",
      },
      addressForm: "Anrede",
      addressForms: {
        du: "Du (informell)",
        sie: "Sie (formell)",
      },
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

  const currentStepIndex = steps.indexOf(currentStep);
  const t = translations[state.language];

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      // Save preferences to localStorage
      localStorage.setItem("mindmate-preferences", JSON.stringify(state));
      navigate("/chat");
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
      {/* Progress indicator */}
      <div className="flex justify-center gap-2 pt-8 pb-4 safe-top">
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

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pb-6">
        <AnimatePresence mode="wait">
          {currentStep === "welcome" && (
            <WelcomeStep key="welcome" t={t.welcome} />
          )}
          {currentStep === "disclaimer" && (
            <DisclaimerStep
              key="disclaimer"
              t={t.disclaimer}
              accepted={state.disclaimerAccepted}
              onAcceptChange={(accepted) =>
                setState((s) => ({ ...s, disclaimerAccepted: accepted }))
              }
            />
          )}
          {currentStep === "preferences" && (
            <PreferencesStep
              key="preferences"
              t={t.preferences}
              language={state.language}
              tone={state.tone}
              addressForm={state.addressForm}
              onLanguageChange={(language) => setState((s) => ({ ...s, language }))}
              onToneChange={(tone) => setState((s) => ({ ...s, tone }))}
              onAddressFormChange={(addressForm) => setState((s) => ({ ...s, addressForm }))}
            />
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col items-center justify-center text-center"
    >
      <motion.div
        className="w-24 h-24 rounded-3xl bg-primary-soft flex items-center justify-center mb-8"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="w-12 h-12 text-primary" />
      </motion.div>

      <h1 className="text-2xl font-bold text-foreground mb-4">
        {t.title}
      </h1>

      <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
        {t.subtitle}
      </p>
    </motion.div>
  );
}

interface DisclaimerStepProps {
  t: typeof translations.en.disclaimer;
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

function DisclaimerStep({ t, accepted, onAcceptChange }: DisclaimerStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-center"
    >
      <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
        {t.title}
      </h2>

      <div className="bg-gentle-soft rounded-2xl p-5 mb-8">
        <p className="text-foreground text-sm leading-relaxed">
          {t.text}{" "}
          <span className="font-medium">{t.notReplacement}</span>{" "}
          {t.textEnd}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mt-3">
          {t.crisis}
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <Checkbox
          checked={accepted}
          onCheckedChange={(checked) => onAcceptChange(checked === true)}
          className="mt-0.5"
        />
        <span className="text-sm text-foreground leading-relaxed">
          {t.checkbox}
        </span>
      </label>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col pt-4"
    >
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
    </motion.div>
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
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
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
