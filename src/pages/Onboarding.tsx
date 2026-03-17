import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Sun, Moon, MessageCircle, Heart, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/hooks/useTheme";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/hooks/useAuth";
import { useCompanion } from "@/hooks/useCompanion";
import { companionArchetypes, CompanionArchetype } from "@/data/companions";
import logoImage from "@/assets/logo.png";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { analytics } from "@/hooks/useAnalytics";

type Language = "en" | "de";

interface OnboardingState {
  language: Language;
  name: string;
  need: string;
  companionId: string;
  disclaimerAccepted: boolean;
}

const steps = ["name", "need", "companion", "start"] as const;
type Step = typeof steps[number];

// Map needs to recommended companion
const needToCompanion: Record<string, string[]> = {
  understand: ["elena", "sofia", "noah"],
  talk: ["mira", "lina", "ava"],
  organize: ["jonas", "kai", "theo"],
};

const translations = {
  en: {
    continue: "Continue",
    back: "Back",
    name: {
      title: "What should we call you?",
      placeholder: "Your name",
    },
    need: {
      title: "What brings you here?",
      options: [
        { id: "understand", label: "I want to understand myself better", emoji: "🌱" },
        { id: "talk", label: "I need someone to talk to", emoji: "💬" },
        { id: "organize", label: "I want to sort my thoughts", emoji: "✨" },
      ],
    },
    companion: {
      title: "Meet your companion",
      subtitle: "Recommended for you",
      showAll: "Explore all companions",
      showLess: "Show fewer",
    },
    start: {
      cta: "Start your first conversation",
      disclaimer: "I understand Soulvay is not therapy or medical advice",
      disclaimerNote: "Soulvay is an AI companion — thoughtful, but not a therapist.",
    },
  },
  de: {
    continue: "Weiter",
    back: "Zurück",
    name: {
      title: "Wie dürfen wir dich nennen?",
      placeholder: "Dein Name",
    },
    need: {
      title: "Was führt dich hierher?",
      options: [
        { id: "understand", label: "Ich möchte mich besser verstehen", emoji: "🌱" },
        { id: "talk", label: "Ich brauche jemanden zum Reden", emoji: "💬" },
        { id: "organize", label: "Ich möchte meine Gedanken ordnen", emoji: "✨" },
      ],
    },
    companion: {
      title: "Triff deinen Begleiter",
      subtitle: "Empfohlen für dich",
      showAll: "Alle Begleiter entdecken",
      showLess: "Weniger anzeigen",
    },
    start: {
      cta: "Starte dein erstes Gespräch",
      disclaimer: "Ich verstehe, dass Soulvay keine Therapie oder medizinischer Rat ist",
      disclaimerNote: "Soulvay ist ein KI-Begleiter — durchdacht, aber kein Therapeut.",
    },
  },
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<Step>("name");
  const [state, setState] = useState<OnboardingState>(() => {
    const browserLang = navigator.language?.toLowerCase() || "";
    const detectedLang: Language = browserLang.startsWith("de") ? "de" : "en";
    return {
      language: detectedLang,
      name: "",
      need: "",
      companionId: "mira",
      disclaimerAccepted: false,
    };
  });
  const [showAllCompanions, setShowAllCompanions] = useState(false);
  const navigate = useNavigate();
  const { isDark, setMode: setThemeMode } = useTheme();
  const { completeOnboarding } = useOnboardingStatus();
  const { isAuthenticated } = useAuth();
  const { selectArchetype } = useCompanion();
  const [isFinishing, setIsFinishing] = useState(false);

  // Track onboarding started once
  useEffect(() => {
    analytics.track("onboarding_started", {}, "onboarding_started");
  }, []);

  // Track step transitions
  const prevStepRef = useRef(currentStep);
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      analytics.track("onboarding_step_completed", { step: prevStepRef.current, next_step: currentStep });
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  const currentStepIndex = steps.indexOf(currentStep);
  const t = translations[state.language];

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const finishOnboarding = async () => {
    if (!state.disclaimerAccepted) return;
    setIsFinishing(true);

    analytics.track("onboarding_completed", {
      companion: state.companionId,
      need: state.need,
      language: state.language,
    });

    // Save preferences
    const prefsPayload = JSON.stringify({
      language: state.language,
      tone: "gentle",
      addressForm: "du",
      disclaimerAccepted: true,
    });
    localStorage.setItem("soulvay-preferences", prefsPayload);
    localStorage.setItem("mindmate-preferences", prefsPayload);

    // Save personalization
    localStorage.setItem("soulvay-personalization", JSON.stringify({
      schemaVersion: 1,
      focusAreas: [state.need],
      reflectionFrequency: "flexible",
      personalGoal: "",
      companionId: state.companionId,
      displayName: state.name,
    }));

    // Save display name for immediate greeting
    if (state.name.trim()) {
      localStorage.setItem("soulvay-display-name", state.name.trim());
    }

    completeOnboarding();

    if (isAuthenticated) {
      try {
        await selectArchetype(state.companionId);
      } catch (e) {
        if (import.meta.env.DEV) console.warn("Companion persistence failed:", e);
      }
      setIsFinishing(false);
      navigate("/chat", { replace: true });
    } else {
      setIsFinishing(false);
      navigate("/auth?from=onboarding", { replace: true });
    }
  };

  const canProceed = () => {
    if (currentStep === "name") return state.name.trim().length > 0;
    if (currentStep === "need") return state.need !== "";
    if (currentStep === "start") return state.disclaimerAccepted;
    return true;
  };

  // Get recommended companions based on need
  const recommendedIds = needToCompanion[state.need] || ["mira", "noah", "elena"];
  const recommended = companionArchetypes.filter(a => recommendedIds.includes(a.id));
  const others = companionArchetypes.filter(a => !recommendedIds.includes(a.id));

  return (
    <div className="bg-background flex flex-col h-[100dvh]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        {currentStepIndex > 0 ? (
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <div className="flex justify-center gap-2">
          {steps.map((step, index) => (
            <motion.div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStepIndex ? "w-8 bg-primary" : index < currentStepIndex ? "w-3 bg-primary/40" : "w-3 bg-muted"}`} />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setState(s => ({ ...s, language: s.language === "de" ? "en" : "de" }))}
            className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            {state.language === "de" ? "EN" : "DE"}
          </button>
          <button onClick={() => setThemeMode(isDark ? "light" : "dark")} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <motion.div key={isDark ? "moon" : "sun"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            {currentStep === "name" && (
              <motion.div key="name" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <div className="flex flex-col items-center pt-12 sm:pt-20 text-center">
                  <div className="relative mb-8">
                    <motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-primary/15 to-transparent blur-2xl scale-150" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 4, repeat: Infinity }} />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-xl ring-1 ring-primary/10">
                      <img src={logoImage} alt="Soulvay" className="w-14 h-14 rounded-full object-cover" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-semibold text-foreground mb-2">{t.name.title}</h1>
                  <p className="text-muted-foreground text-sm mb-8">
                    {state.language === "de" ? "Dein Begleiter wird dich so nennen." : "Your companion will address you by this name."}
                  </p>
                  <input
                    type="text"
                    value={state.name}
                    onChange={(e) => setState(s => ({ ...s, name: e.target.value }))}
                    placeholder={t.name.placeholder}
                    className="w-full max-w-xs h-12 bg-card border border-border/50 rounded-2xl px-5 text-center text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && canProceed()) handleNext(); }}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === "need" && (
              <motion.div key="need" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <div className="pt-8 sm:pt-16">
                  <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">{t.need.title}</h2>
                  <p className="text-muted-foreground text-sm text-center mb-8">
                    {state.name ? (state.language === "de" ? `Schön dich kennenzulernen, ${state.name}.` : `Nice to meet you, ${state.name}.`) : ""}
                  </p>
                  <div className="space-y-3">
                    {t.need.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setState(s => ({ ...s, need: opt.id, companionId: needToCompanion[opt.id]?.[0] || "mira" }));
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border ${
                          state.need === opt.id
                            ? "bg-primary/10 border-primary/30 shadow-sm"
                            : "bg-card border-border/40 hover:border-border/60"
                        }`}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className={`text-sm font-medium flex-1 ${state.need === opt.id ? "text-foreground" : "text-muted-foreground"}`}>
                          {opt.label}
                        </span>
                        {state.need === opt.id && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="w-5 h-5 text-primary" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === "companion" && (
              <motion.div key="companion" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <div className="pt-4">
                  <h2 className="text-xl font-semibold text-foreground mb-1 text-center">{t.companion.title}</h2>
                  <p className="text-muted-foreground text-sm text-center mb-4">{t.companion.subtitle}</p>

                  {/* Recommended companions (top 3) */}
                  <div className="flex flex-col gap-3 pb-4">
                    {recommended.map((arch) => (
                      <CompanionOption key={arch.id} arch={arch} selected={state.companionId === arch.id} language={state.language} onSelect={(id) => setState(s => ({ ...s, companionId: id }))} />
                    ))}
                  </div>

                  {/* Show all toggle */}
                  <button
                    onClick={() => setShowAllCompanions(!showAllCompanions)}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                  >
                    {showAllCompanions ? t.companion.showLess : t.companion.showAll}
                  </button>

                  {showAllCompanions && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-col gap-3 pt-2 pb-4">
                      {others.map((arch) => (
                        <CompanionOption key={arch.id} arch={arch} selected={state.companionId === arch.id} language={state.language} onSelect={(id) => setState(s => ({ ...s, companionId: id }))} />
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === "start" && (
              <motion.div key="start" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                {(() => {
                  const arch = companionArchetypes.find(a => a.id === state.companionId)!;
                  const greeting = state.language === "de" ? arch.introGreetingDe : arch.introGreeting;
                  return (
                    <div className="flex flex-col items-center pt-8 sm:pt-12 text-center">
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
                        <CompanionAvatarAnimated archetype={arch.id} name={arch.name} size="xl" state="idle" />
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 space-y-2">
                        <h2 className="text-2xl font-semibold text-foreground">{arch.name}</h2>
                        <p className="text-primary/80 text-sm">{state.language === "de" ? arch.descriptionDe : arch.description}</p>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 bg-card rounded-2xl border border-border/50 p-5 max-w-xs shadow-sm">
                        <p className="text-foreground text-sm leading-relaxed italic">"{greeting}"</p>
                      </motion.div>

                      {/* Disclaimer */}
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8 max-w-xs">
                        <p className="text-[11px] text-muted-foreground/70 mb-3">{t.start.disclaimerNote}</p>
                        <label className="flex items-center gap-2.5 cursor-pointer bg-muted/40 rounded-xl p-3 transition-colors hover:bg-muted/60">
                          <Checkbox checked={state.disclaimerAccepted} onCheckedChange={(checked) => setState(s => ({ ...s, disclaimerAccepted: checked === true }))} />
                          <span className="text-xs text-foreground leading-relaxed">{t.start.disclaimer}</span>
                        </label>
                      </motion.div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="shrink-0 px-6 pt-3 pb-4 bg-background/95 backdrop-blur-sm border-t border-border/30">
        <div className="max-w-lg mx-auto">
          {currentStep === "start" ? (
            <Button size="xl" className="w-full gap-2" onClick={finishOnboarding} disabled={!canProceed() || isFinishing}>
              {isFinishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {t.start.cta}
            </Button>
          ) : (
            <Button size="xl" className="w-full" onClick={handleNext} disabled={!canProceed()}>
              {t.continue}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact companion option card
function CompanionOption({ arch, selected, language, onSelect }: {
  arch: CompanionArchetype;
  selected: boolean;
  language: Language;
  onSelect: (id: string) => void;
}) {
  const description = language === "de" ? arch.descriptionDe : arch.description;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(arch.id)}
      className={`relative w-full rounded-2xl border text-left transition-all flex flex-row items-stretch overflow-hidden ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm"
          : "border-border/40 bg-card hover:border-border/60"
      }`}
    >
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
          <Check className="w-3.5 h-3.5 text-primary-foreground" />
        </motion.div>
      )}
      <div className="w-20 sm:w-24 shrink-0 bg-muted/20 min-h-[80px]">
        <img src={arch.defaultAvatar} alt={arch.name} className="w-full h-full object-cover object-top" loading="lazy" draggable={false} />
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1 min-w-0 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-base shrink-0">{arch.emoji}</span>
          <p className="font-semibold text-foreground text-sm truncate">{arch.name}</p>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
      </div>
    </motion.button>
  );
}
