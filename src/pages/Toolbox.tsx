import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, CheckCircle2, Info, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { TabHint } from "@/components/shared/TabHint";
import { Button } from "@/components/ui/button";
import { ExercisePlayer } from "@/components/toolbox/ExercisePlayer";
import { exercises, Exercise, getExerciseById } from "@/data/exercises";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useLastState } from "@/hooks/useLastState";

const categories = [
  { id: "all", labelEn: "All", labelDe: "Alle" },
  { id: "breathing", labelEn: "Breathing", labelDe: "Atmung" },
  { id: "grounding", labelEn: "Grounding", labelDe: "Erdung" },
  { id: "cognitive", labelEn: "Cognitive", labelDe: "Kognitiv" },
  { id: "journaling", labelEn: "Journaling", labelDe: "Schreiben" },
];

export default function Toolbox() {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("soulvay-completed-exercises") || localStorage.getItem("mindmate-completed-exercises");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const { language, getExerciseDisplay, t } = useTranslation();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { setLastExercise } = useLastState();

  // Handle auto-start from navigation (e.g., Calm mode exercises)
  useEffect(() => {
    const startExerciseId = location.state?.startExercise;
    if (startExerciseId) {
      const exercise = getExerciseById(startExerciseId);
      if (exercise) {
        setSelectedExercise(exercise);
      }
      // Clear the state so it doesn't re-trigger on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleComplete = (exerciseId: string) => {
    const newCompleted = new Set(completedExercises);
    newCompleted.add(exerciseId);
    setCompletedExercises(newCompleted);
    localStorage.setItem(
      "soulvay-completed-exercises",
      JSON.stringify([...newCompleted])
    );

    // Mark completed in last state
    setLastExercise({ id: exerciseId, completedAt: Date.now() });

    toast({
      title: t("toolbox.exerciseCompleted"),
      description: t("toolbox.greatJob"),
    });

    logActivity("exercise_completed");
  };

  const handleStartExercise = (exercise: Exercise) => {
    setLastExercise({ id: exercise.id, step: 0 });
    setSelectedExercise(exercise);
  };

  const filteredExercises =
    activeCategory === "all"
      ? exercises
      : exercises.filter((e) => e.category === activeCategory);

  // Single source of truth: use getExerciseDisplay for all exercise strings
  const getDisplay = (exercise: Exercise) => getExerciseDisplay(exercise.id, {
    title: exercise.title,
    description: exercise.description,
    longDescription: exercise.longDescription,
    duration: exercise.duration,
    steps: exercise.steps,
    prompts: exercise.prompts,
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={t("toolbox.title")}
        subtitle={t("toolbox.subtitle")}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-8">
        <div className="max-w-lg mx-auto space-y-4">
        {/* First-visit hint */}
        <TabHint tabId="toolbox" />
        
        {/* Category filters */}
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="shrink-0"
            >
              {language === "de" ? cat.labelDe : cat.labelEn}
            </Button>
          ))}
        </div>

        {/* Quick tip */}
        <CalmCard variant="calm" className="!py-3">
          <p className="text-sm text-muted-foreground">
            {t("toolbox.tip")} {t("toolbox.tipText")}
          </p>
        </CalmCard>

        {/* Exercise list - single column for clean layout */}
        <div className="grid grid-cols-1 gap-3">
          {filteredExercises.map((exercise, index) => {
            const isCompleted = completedExercises.has(exercise.id);
            const Icon = exercise.icon;
            const display = getDisplay(exercise);

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CalmCard variant="gentle">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted ? "bg-primary/20" : "bg-primary/10"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <Icon className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {display.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {display.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {display.durationLabel}
                        </span>
                        <button
                          onClick={() => setInfoExercise(exercise)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Info className="w-3 h-3" />
                          {t("toolbox.whyHelps")}
                        </button>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="calm"
                      onClick={() => handleStartExercise(exercise)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </CalmCard>
              </motion.div>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <CalmCard variant="gentle" className="text-center py-8">
            <p className="text-muted-foreground">
              {t("toolbox.noExercises")}
            </p>
          </CalmCard>
        )}
        </div>
      </div>

      {/* Info modal */}
      <AnimatePresence>
        {infoExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={() => setInfoExercise(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-lg bg-card rounded-2xl p-6 shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const display = getDisplay(infoExercise);
                return (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-foreground">
                        {display.title}
                      </h3>
                      <button
                        onClick={() => setInfoExercise(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {display.longDescription}
                    </p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>{t("toolbox.duration")}:</strong>{" "}
                        {display.durationLabel}
                      </p>
                      <p>
                        <strong>{t("toolbox.bestFor")}:</strong>{" "}
                        {t("toolbox.bestForDesc")}
                      </p>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => {
                        setInfoExercise(null);
                        handleStartExercise(infoExercise);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {t("toolbox.startNow")}
                    </Button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise player */}
      <AnimatePresence>
        {selectedExercise && (
          <ExercisePlayer
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
            onComplete={() => handleComplete(selectedExercise.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
