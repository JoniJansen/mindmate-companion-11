import { useState, useEffect } from "react";
import { X, Play, Pause, RotateCcw, Check, ChevronRight } from "lucide-react";
import { Exercise } from "@/data/exercises";
import { useTranslation } from "@/hooks/useTranslation";

interface ExercisePlayerProps {
  exercise: Exercise;
  onClose: () => void;
  onComplete: () => void;
}

export function ExercisePlayer({ exercise, onClose, onComplete }: ExercisePlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { t, getExerciseTranslation } = useTranslation();

  const translation = getExerciseTranslation(exercise.id);
  const exerciseTitle = translation?.title || exercise.title;
  
  const translatedSteps = translation?.steps;
  const getStepInstruction = (index: number) => {
    if (translatedSteps && translatedSteps[index]) {
      return translatedSteps[index];
    }
    return exercise.steps[index]?.instruction || "";
  };
  
  const translatedPrompts = translation?.prompts;
  const getPrompt = (index: number) => {
    if (translatedPrompts && translatedPrompts[index % translatedPrompts.length]) {
      return translatedPrompts[index % translatedPrompts.length];
    }
    return exercise.prompts?.[index % (exercise.prompts?.length || 1)] || "";
  };

  const step = exercise.steps[currentStep];
  const totalSteps = exercise.steps.length;
  const overallProgress = ((currentStep + stepProgress / 100) / totalSteps) * 100;

  // Handle next step
  const handleNextStep = () => {
    console.log("Next step clicked, current:", currentStep, "total:", totalSteps);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setStepProgress(0);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
    }
  };

  // Auto-progress when playing
  useEffect(() => {
    if (!isPlaying || isComplete || !step) return;

    const stepDuration = step.duration || 10;
    const interval = setInterval(() => {
      setStepProgress(prev => {
        const increment = 100 / (stepDuration * 10);
        if (prev + increment >= 100) {
          handleNextStep();
          return 0;
        }
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, step, isComplete, currentStep]);

  const handleRestart = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsComplete(false);
    setIsPlaying(true);
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  // Completion screen
  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm text-muted-foreground">{exerciseTitle}</span>
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
              className="px-6 py-3 rounded-xl bg-calm text-calm-foreground hover:bg-calm/90"
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
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm text-muted-foreground">{exerciseTitle}</span>
        <div className="w-10" />
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
          {/* Breathing circle */}
          {exercise.category === 'breathing' && (
            <div className={`w-24 h-24 rounded-full bg-calm/20 mx-auto mb-6 flex items-center justify-center transition-transform duration-1000 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
              <div className="w-12 h-12 rounded-full bg-calm/40" />
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
            <div className="mt-6 p-4 bg-gentle/10 rounded-xl text-left">
              <p className="text-xs text-muted-foreground mb-1">{t("common.helpfulPrompts")}:</p>
              <p className="text-sm text-foreground italic">
                {getPrompt(currentStep)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FIXED BOTTOM CONTROLS */}
      <div className="border-t border-border bg-background p-4 pb-6">
        <p className="text-xs text-muted-foreground text-center mb-3">
          {isPlaying ? t("toolbox.autoProgress") : t("toolbox.tapToStart")}
        </p>
        
        <div className="flex justify-center gap-4">
          {/* Start/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 max-w-40 h-14 rounded-xl bg-calm text-calm-foreground hover:bg-calm/90 flex items-center justify-center gap-2 font-medium text-base"
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
