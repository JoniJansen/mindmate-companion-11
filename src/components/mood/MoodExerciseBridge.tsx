import { useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { getExerciseById } from "@/data/exercises";
import { getRecommendedExerciseId } from "@/lib/moodExerciseMap";
import { analytics } from "@/hooks/useAnalytics";

interface MoodExerciseBridgeProps {
  moodValue: number;
  feelings: string[];
  onDismiss: () => void;
}

/**
 * Gentle, non-pushy offer after a strained mood check-in:
 * one short exercise matched to the reported feelings, auto-started
 * in the toolbox via location.state.startExercise.
 */
export function MoodExerciseBridge({ moodValue, feelings, onDismiss }: MoodExerciseBridgeProps) {
  const { t, getExerciseDisplay } = useTranslation();
  const navigate = useNavigate();

  const exerciseId = getRecommendedExerciseId(moodValue, feelings);
  const exercise = exerciseId ? getExerciseById(exerciseId) : undefined;

  // Track offer shown once
  useEffect(() => {
    if (!exercise) return;
    analytics.track(
      "mood_to_exercise_prompt_shown",
      { mood_value: moodValue, exercise_id: exercise.id },
      "mood_exercise_bridge_shown"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!exercise) return null;

  const display = getExerciseDisplay(exercise.id, {
    title: exercise.title,
    description: exercise.description,
    duration: exercise.duration,
  });
  const Icon = exercise.icon;

  const handleStart = () => {
    analytics.track("mood_to_exercise_clicked", { mood_value: moodValue, exercise_id: exercise.id });
    navigate("/toolbox", { state: { startExercise: exercise.id } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 }}
    >
      <div className="rounded-2xl border bg-primary-soft/50 border-primary/12 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground/90 leading-relaxed mb-1">
              {t("mood.exerciseBridge.invite")}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
              <span className="font-medium text-foreground/80">{display.title}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {display.durationLabel}
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-xl gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-0"
                onClick={handleStart}
              >
                <Play className="w-3.5 h-3.5" />
                {t("mood.exerciseBridge.start")}
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground text-xs" onClick={onDismiss}>
                {t("home.notNow")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
