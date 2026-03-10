import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Check, ChevronRight, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Exercise } from "@/data/exercises";
import { useTranslation } from "@/hooks/useTranslation";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useVoiceSettings } from "@/hooks/useVoiceSettings";
import { fullScreenOverlay } from "@/lib/safeArea";

interface ExercisePlayerProps {
  exercise: Exercise;
  onClose: () => void;
  onComplete: () => void;
}

export function ExercisePlayer({ exercise, onClose, onComplete }: ExercisePlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Auto-start
  const [stepProgress, setStepProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isCurrentStepSpeaking, setIsCurrentStepSpeaking] = useState(false);
  const [isCurrentStepMinDurationMet, setIsCurrentStepMinDurationMet] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { t, language, getExerciseDisplay } = useTranslation();
  const { getVoiceId, speed } = useVoiceSettings();
  
  const { speak, stop, isSpeaking, isLoading } = useElevenLabsTTS({
    onStart: () => {
      setIsCurrentStepSpeaking(true);
    },
    onEnd: () => {
      setIsCurrentStepSpeaking(false);
    },
    onError: () => {
      // Silently degrade - exercise still works without voice
      setIsCurrentStepSpeaking(false);
    }
  });

  // Hide BottomNav while exercise player is open
  useEffect(() => {
    document.body.classList.add('exercise-player-open');
    return () => document.body.classList.remove('exercise-player-open');
  }, []);

  // Single source of truth for exercise display strings
  const display = getExerciseDisplay(exercise.id, {
    title: exercise.title,
    description: exercise.description,
    longDescription: exercise.longDescription,
    duration: exercise.duration,
    steps: exercise.steps,
    prompts: exercise.prompts,
  });

  const step = exercise.steps[currentStep];
  const totalSteps = exercise.steps.length;
  const overallProgress = ((currentStep + stepProgress / 100) / totalSteps) * 100;

  // Helper to get step instruction from display
  const getStepInstruction = (index: number) => display.steps[index] || exercise.steps[index]?.instruction || "";
  
  // Helper to get prompt from display
  const getPrompt = (index: number) => display.prompts[index % display.prompts.length] || "";

  // Get effective language for TTS
  const effectiveLang = (language === "de" ? "de" : "en") as "en" | "de";

  const spokenNumberMap = {
    de: {
      "1": "eins",
      "2": "zwei",
      "3": "drei",
      "4": "vier",
      "5": "fünf",
      "6": "sechs",
      "7": "sieben",
      "8": "acht",
      "9": "neun",
      "10": "zehn",
    },
    en: {
      "1": "one",
      "2": "two",
      "3": "three",
      "4": "four",
      "5": "five",
      "6": "six",
      "7": "seven",
      "8": "eight",
      "9": "nine",
      "10": "ten",
    },
  } as const;

  const getStepSpeechText = (index: number) => {
    const instruction = getStepInstruction(index).trim();

    const breathingSpeechOverrides: Record<string, { en: string[]; de: string[] }> = {
      "breathing-60": {
        en: [
          "Find a comfortable position. And when you're ready, gently close your eyes.",
          "Breathe in slowly through your nose now ... soft and easy ... in ... two ... three ... four.",
          "Hold the breath gently for a brief moment ... two.",
          "Now breathe out slowly through your mouth ... long and easy ... out ... two ... three ... four ... five ... six.",
          "Breathe in again ... and let calm move gently through your body.",
          "Hold softly for a moment.",
          "And exhale slowly ... releasing tension with the breath.",
          "Take another slow breath in through your nose ... in ... two ... three ... four.",
          "Hold gently for a brief moment.",
          "And exhale completely ... slow and steady ... out ... two ... three ... four ... five ... six.",
          "One more deep, slow breath in.",
          "Hold it softly for a moment.",
          "And release ... letting go completely.",
          "Gently open your eyes ... and notice how you feel now.",
        ],
        de: [
          "Finde eine bequeme Position. Und wenn du soweit bist, schließe sanft die Augen.",
          "Atme jetzt langsam durch die Nase ein ... ganz weich und ruhig ... ein ... zwei ... drei ... vier.",
          "Halte den Atem für einen kleinen Moment ganz sanft.",
          "Und jetzt atme langsam durch den Mund aus ... lang und ruhig ... aus ... zwei ... drei ... vier ... fünf ... sechs.",
          "Atme wieder ein ... und lass mit dem Atem Ruhe in deinen Körper kommen.",
          "Halte den Atem noch einen kleinen Moment ganz weich.",
          "Und atme langsam aus ... lass dabei die Spannung weiter los.",
          "Nimm noch einen ruhigen Atemzug durch die Nase ... ein ... zwei ... drei ... vier.",
          "Halte wieder ganz sanft für einen kurzen Moment.",
          "Und atme vollständig aus ... langsam und gleichmäßig ... aus ... zwei ... drei ... vier ... fünf ... sechs.",
          "Ein letztes Mal tief und ruhig einatmen.",
          "Halte den Atem noch einen sanften Moment.",
          "Und jetzt lösen ... ganz loslassen.",
          "Öffne nun langsam die Augen ... und spüre kurz nach, wie du dich jetzt fühlst.",
        ],
      },
    };

    const override = breathingSpeechOverrides[exercise.id]?.[effectiveLang]?.[index];
    if (override) return override;

    const numberMap = spokenNumberMap[effectiveLang];

    return instruction
      .replace(/\b(10|[1-9])\b/g, (match) => numberMap[match as keyof typeof numberMap] || match)
      .replace(/\.{3,}\s*(?=(one|two|three|four|five|six|seven|eight|nine|ten|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\b)/gi, ". ")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  // Speak current step when it changes (only ElevenLabs, no browser TTS)
  useEffect(() => {
    clearAdvanceTimeout();
    setIsCurrentStepMinDurationMet(false);
    setIsCurrentStepSpeaking(false);
    setIsTransitioning(false);

    if (!voiceEnabled || !language || isComplete) return;

    const instruction = getStepSpeechText(currentStep).trim();
    if (!instruction) return;

    const voiceId = getVoiceId(effectiveLang);
    speak(instruction, voiceId, effectiveLang, speed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, voiceEnabled, language, isComplete]);

  const advanceTimeoutRef = useRef<number | null>(null);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const totalStepsRef = useRef(totalSteps);
  totalStepsRef.current = totalSteps;

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const completeExercise = useCallback(() => {
    clearAdvanceTimeout();
    stop();
    setIsCurrentStepSpeaking(false);
    setIsCurrentStepMinDurationMet(false);
    setIsTransitioning(false);
    setIsComplete(true);
    setIsPlaying(false);
  }, [clearAdvanceTimeout, stop]);

  const queueAdvance = useCallback((delay = 900) => {
    clearAdvanceTimeout();
    setIsTransitioning(true);

    advanceTimeoutRef.current = window.setTimeout(() => {
      if (currentStepRef.current >= totalStepsRef.current - 1) {
        completeExercise();
        return;
      }

      setCurrentStep((prev) => prev + 1);
      setStepProgress(0);
      setIsCurrentStepMinDurationMet(false);
      setIsCurrentStepSpeaking(false);
      setIsTransitioning(false);
    }, delay);
  }, [clearAdvanceTimeout, completeExercise]);

  useEffect(() => {
    return () => {
      clearAdvanceTimeout();
    };
  }, [clearAdvanceTimeout]);

  // Handle next step
  const handleNextStep = () => {
    stop();
    setIsCurrentStepSpeaking(false);
    setIsCurrentStepMinDurationMet(false);

    if (currentStep >= totalSteps - 1) {
      completeExercise();
      return;
    }

    queueAdvance(450);
  };

  // Auto-progress after minimum duration; actual step change happens only once via queueAdvance
  useEffect(() => {
    if (!isPlaying || isComplete || !step) return;

    const stepDuration = step.duration || 10;
    const interval = setInterval(() => {
      setStepProgress((prev) => {
        if (prev >= 100) return 100;

        const increment = 100 / (stepDuration * 10);
        const nextProgress = Math.min(prev + increment, 100);

        if (nextProgress >= 100 && prev < 100) {
          setIsCurrentStepMinDurationMet(true);
        }

        return nextProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, step, isComplete]);

  useEffect(() => {
    if (!isPlaying || isComplete || isTransitioning || !isCurrentStepMinDurationMet) return;
    if (voiceEnabled && (isCurrentStepSpeaking || isLoading)) return;

    queueAdvance(900);
  }, [
    isCurrentStepMinDurationMet,
    isCurrentStepSpeaking,
    isLoading,
    isPlaying,
    isComplete,
    isTransitioning,
    voiceEnabled,
    queueAdvance,
  ]);

  const handleRestart = () => {
    clearAdvanceTimeout();
    stop();
    setCurrentStep(0);
    setStepProgress(0);
    setIsCurrentStepMinDurationMet(false);
    setIsCurrentStepSpeaking(false);
    setIsTransitioning(false);
    setIsComplete(false);
    setIsPlaying(true);
  };

  const handleFinish = () => {
    stop();
    onComplete();
    onClose();
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stop();
    } else {
      const instruction = getStepSpeechText(currentStep);
      const voiceId = getVoiceId(effectiveLang);
      speak(instruction, voiceId, effectiveLang, speed);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Completion screen
  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-background z-[200] flex flex-col" style={fullScreenOverlay()}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          <button type="button" onClick={handleClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        <span className="text-sm text-muted-foreground">{display.title}</span>
        <div className="w-10" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 flex flex-col items-center justify-center p-6"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("common.wellDone")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("toolbox.completedExercise")}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl border border-border hover:bg-muted flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {t("common.again")}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("common.finish")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Exercise screen
  return (
    <div className="fixed inset-0 bg-background z-[200] flex flex-col" style={fullScreenOverlay()}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border">
        {/* Close button - 44px tap target */}
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }} 
          className="flex items-center justify-center w-11 h-11 hover:bg-muted rounded-xl shrink-0 transition-colors"
          aria-label="Close exercise"
        >
          <X className="w-5 h-5" />
        </button>
        
        <span className="text-sm text-muted-foreground truncate px-2">{display.title}</span>
        
        {/* Voice toggle - 44px tap target */}
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            toggleVoice();
          }} 
          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors ${voiceEnabled ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
          aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-700 ease-in-out"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md mx-auto text-center">
          {/* Speaking/Loading indicator */}
          <AnimatePresence>
            {voiceEnabled && (isSpeaking || isLoading) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-2 mb-4 text-primary"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
                <span className="text-sm">{isLoading ? (language === "de" ? "Einen Moment..." : "One moment...") : t("voice.speaking")}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breathing circle */}
          {exercise.category === 'breathing' && (
            <motion.div
              animate={{ scale: isPlaying ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: isPlaying ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="w-12 h-12 rounded-full bg-primary/40"
              />
            </motion.div>
          )}

          {/* Step counter */}
          <p className="text-sm text-muted-foreground mb-2">
            {t("common.step")} {currentStep + 1} {t("common.of")} {totalSteps}
          </p>

          {/* Instruction — smooth crossfade */}
          <div className="relative min-h-[4rem]">
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-lg font-medium text-foreground leading-relaxed mb-4"
              >
                {getStepInstruction(currentStep)}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Step progress */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-48 mx-auto mb-4"
              >
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/50 rounded-full transition-all duration-300 ease-linear"
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompts */}
          {exercise.prompts && exercise.prompts.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`prompt-${currentStep}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 p-4 bg-muted/50 rounded-xl text-left"
              >
                <p className="text-xs text-muted-foreground mb-1">{t("common.helpfulPrompts")}:</p>
                <p className="text-sm text-foreground italic">
                  {getPrompt(currentStep)}
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* FIXED BOTTOM CONTROLS */}
      <div className="border-t border-border bg-background p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <p className="text-xs text-muted-foreground text-center mb-3">
          {voiceEnabled ? t("toolbox.autoProgress") : t("toolbox.autoProgress")}
        </p>
        
        <div className="flex justify-center gap-4">
          {/* Start/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 max-w-40 h-14 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 font-medium text-base"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                {t("common.pause")}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {currentStep === 0 ? t("common.start") : t("common.resume")}
              </>
            )}
          </button>
          
          {/* NEXT BUTTON - Big and obvious */}
          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 max-w-40 h-14 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 font-medium text-base"
          >
            {t("common.next")}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
