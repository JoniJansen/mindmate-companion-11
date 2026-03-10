import { useState, useEffect, useRef } from "react";
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

  // Speak current step when it changes (only ElevenLabs, no browser TTS)
  useEffect(() => {
    setIsCurrentStepMinDurationMet(false);
    setIsCurrentStepSpeaking(false);

    if (voiceEnabled && language) {
      const instruction = getStepInstruction(currentStep);
      const voiceId = getVoiceId(effectiveLang);
      speak(instruction, voiceId, effectiveLang, speed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, voiceEnabled, language]);

  // Handle next step
  const handleNextStep = () => {
    stop(); // Stop current speech
    setIsCurrentStepSpeaking(false);
    setIsCurrentStepMinDurationMet(false);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setStepProgress(0);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
    }
  };

  // Auto-progress when playing — never cut off active speech
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const totalStepsRef = useRef(totalSteps);
  totalStepsRef.current = totalSteps;
  const isCurrentStepSpeakingRef = useRef(isCurrentStepSpeaking);
  isCurrentStepSpeakingRef.current = isCurrentStepSpeaking;

  useEffect(() => {
    if (!isPlaying || isComplete || !step) return;

    const stepDuration = step.duration || 10;
    const interval = setInterval(() => {
      setStepProgress(prev => {
        const increment = 100 / (stepDuration * 10);
        const nextProgress = Math.min(prev + increment, 100);

        if (nextProgress >= 100) {
          setIsCurrentStepMinDurationMet(true);

          if (!voiceEnabled || !isCurrentStepSpeakingRef.current) {
            // Begin soft transition with a brief pause
            setIsTransitioning(true);
            setTimeout(() => {
              stop();
              if (currentStepRef.current < totalStepsRef.current - 1) {
                setCurrentStep(s => s + 1);
                setStepProgress(0);
                setIsCurrentStepMinDurationMet(false);
              } else {
                setIsComplete(true);
                setIsPlaying(false);
              }
              setIsTransitioning(false);
            }, 800); // 800ms gentle pause between steps
            return 100;
          }

          return 100;
        }

        return nextProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, step, isComplete, currentStep, stop, voiceEnabled]);

  useEffect(() => {
    if (!isPlaying || isComplete || !stepProgress || !isCurrentStepMinDurationMet) return;
    if (voiceEnabled && isCurrentStepSpeaking) return;

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setStepProgress(0);
      setIsCurrentStepMinDurationMet(false);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
    }
  }, [isCurrentStepSpeaking, isCurrentStepMinDurationMet, isPlaying, isComplete, currentStep, totalSteps, voiceEnabled, stepProgress]);

  const handleRestart = () => {
    setCurrentStep(0);
    setStepProgress(0);
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
      const instruction = getStepInstruction(currentStep);
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

        <div className="flex-1 flex flex-col items-center justify-center p-6">
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
        </div>
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
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md mx-auto text-center">
          {/* Speaking/Loading indicator */}
          {voiceEnabled && (isSpeaking || isLoading) && (
            <div className="flex items-center justify-center gap-2 mb-4 text-primary">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
              <span className="text-sm">{isLoading ? (language === "de" ? "Einen Moment..." : "One moment...") : t("voice.speaking")}</span>
            </div>
          )}

          {/* Breathing circle */}
          {exercise.category === 'breathing' && (
            <div className={`w-24 h-24 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center transition-transform duration-1000 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
              <div className="w-12 h-12 rounded-full bg-primary/40" />
            </div>
          )}

          {/* Step counter */}
          <p className="text-sm text-muted-foreground mb-2">
            {t("common.step")} {currentStep + 1} {t("common.of")} {totalSteps}
          </p>

          {/* Instruction */}
          <h2 className="text-lg font-medium text-foreground leading-relaxed mb-4">
            {getStepInstruction(currentStep)}
          </h2>

          {/* Step progress */}
          {isPlaying && (
            <div className="w-48 mx-auto mb-4">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/50 rounded-full transition-all"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Prompts */}
          {exercise.prompts && exercise.prompts.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-xl text-left">
              <p className="text-xs text-muted-foreground mb-1">{t("common.helpfulPrompts")}:</p>
              <p className="text-sm text-foreground italic">
                {getPrompt(currentStep)}
              </p>
            </div>
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
