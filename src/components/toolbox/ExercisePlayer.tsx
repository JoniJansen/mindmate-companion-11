import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
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

  const step = exercise.steps[currentStep];
  const totalSteps = exercise.steps.length;
  const overallProgress = ((currentStep + stepProgress / 100) / totalSteps) * 100;

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      setStepProgress(0);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
    }
  }, [currentStep, totalSteps]);

  useEffect(() => {
    if (!isPlaying || isComplete) return;

    const stepDuration = step.duration || 10;
    const interval = setInterval(() => {
      setStepProgress(prev => {
        const increment = 100 / (stepDuration * 10); // Update every 100ms
        if (prev + increment >= 100) {
          nextStep();
          return 0;
        }
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, step, isComplete, nextStep]);

  const handleRestart = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsComplete(false);
    setIsPlaying(true);
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {exerciseTitle}
        </span>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Main Content - Scrollable middle section */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center flex flex-col items-center justify-center min-h-full"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t("common.wellDone")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("toolbox.completedExercise")}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={handleRestart}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("common.again")}
                </Button>
                <Button variant="calm" onClick={handleComplete}>
                  {t("common.finish")}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center max-w-md mx-auto"
            >
              {/* Breathing animation for breathing exercises */}
              {exercise.category === 'breathing' && (
                <motion.div
                  className="w-20 h-20 rounded-full bg-calm/20 mx-auto mb-4 flex items-center justify-center"
                  animate={isPlaying ? {
                    scale: step.instruction.toLowerCase().includes('breathe in') ? [1, 1.3] :
                           step.instruction.toLowerCase().includes('exhale') ? [1.3, 1] :
                           step.instruction.toLowerCase().includes('hold') ? 1.3 : 1,
                  } : {}}
                  transition={{ duration: step.duration || 5, ease: "easeInOut" }}
                >
                  <div className="w-10 h-10 rounded-full bg-calm/40" />
                </motion.div>
              )}

              {/* Step counter */}
              <span className="text-sm text-muted-foreground mb-2 block">
                {t("common.step")} {currentStep + 1} {t("common.of")} {totalSteps}
              </span>

              {/* Instruction */}
              <h2 className="text-base sm:text-lg font-medium text-foreground leading-relaxed mb-4">
                {step.instruction}
              </h2>

              {/* Step progress bar */}
              {isPlaying && (
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary/50 rounded-full"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Prompts for relevant exercises - inside content area */}
              {exercise.prompts && exercise.prompts.length > 0 && (
                <div className="mt-4">
                  <CalmCard variant="gentle" className="text-left">
                    <p className="text-xs text-muted-foreground mb-1">{t("common.helpfulPrompts")}:</p>
                    <p className="text-sm text-foreground italic">
                      {exercise.prompts[currentStep % exercise.prompts.length]}
                    </p>
                  </CalmCard>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls - FIXED at bottom, always visible */}
      {!isComplete && (
        <div className="flex-shrink-0 border-t border-border bg-background p-4 safe-bottom">
          {/* Primary action hint */}
          <p className="text-xs text-muted-foreground text-center mb-3">
            {isPlaying 
              ? t("toolbox.autoProgress") 
              : t("toolbox.tapToStart")}
          </p>
          
          <div className="flex justify-center gap-3">
            {/* Play/Pause button */}
            <Button
              size="lg"
              variant={isPlaying ? "outline" : "calm"}
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1 max-w-36"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  {t("common.pause")}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  {currentStep === 0 && stepProgress === 0 ? t("common.start") : t("common.resume")}
                </>
              )}
            </Button>
            
            {/* Next button - ALWAYS visible and prominent */}
            <Button
              size="lg"
              variant="secondary"
              onClick={nextStep}
              className="flex-1 max-w-36"
            >
              <SkipForward className="w-5 h-5 mr-2" />
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
