import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, CheckCircle2, Info, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { ExercisePlayer } from "@/components/toolbox/ExercisePlayer";
import { exercises, Exercise, getExerciseById } from "@/data/exercises";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";

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
    const stored = localStorage.getItem("mindmate-completed-exercises");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const { language, getExerciseTranslation } = useTranslation();
  const { toast } = useToast();

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
      "mindmate-completed-exercises",
      JSON.stringify([...newCompleted])
    );

    toast({
      title: language === "de" ? "Übung abgeschlossen" : "Exercise completed",
      description:
        language === "de"
          ? "Gut gemacht! Nimm dir einen Moment."
          : "Well done! Take a moment.",
    });
  };

  const filteredExercises =
    activeCategory === "all"
      ? exercises
      : exercises.filter((e) => e.category === activeCategory);

  const getExerciseTitle = (exercise: Exercise) => {
    const translation = getExerciseTranslation(exercise.id);
    return translation?.title || exercise.title;
  };

  const getExerciseDescription = (exercise: Exercise) => {
    const translation = getExerciseTranslation(exercise.id);
    return translation?.description || exercise.description;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={language === "de" ? "Übungen" : "Toolbox"}
        subtitle={
          language === "de"
            ? "Evidenzbasierte Techniken"
            : "Evidence-based techniques"
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
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
            💡{" "}
            {language === "de"
              ? "Regelmäßige kurze Übungen sind wirksamer als seltene lange Sessions."
              : "Regular short practices are more effective than occasional long sessions."}
          </p>
        </CalmCard>

        {/* Exercise list */}
        <div className="space-y-3">
          {filteredExercises.map((exercise, index) => {
            const isCompleted = completedExercises.has(exercise.id);
            const Icon = exercise.icon;

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
                        isCompleted ? "bg-primary/20" : "bg-calm/20"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <Icon className="w-6 h-6 text-calm" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {getExerciseTitle(exercise)}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getExerciseDescription(exercise)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exercise.duration}
                        </span>
                        <button
                          onClick={() => setInfoExercise(exercise)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Info className="w-3 h-3" />
                          {language === "de" ? "Warum hilft das?" : "Why it helps"}
                        </button>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="calm"
                      onClick={() => setSelectedExercise(exercise)}
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
              {language === "de"
                ? "Keine Übungen in dieser Kategorie"
                : "No exercises in this category"}
            </p>
          </CalmCard>
        )}
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
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  {getExerciseTitle(infoExercise)}
                </h3>
                <button
                  onClick={() => setInfoExercise(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {infoExercise.longDescription}
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{language === "de" ? "Dauer:" : "Duration:"}</strong>{" "}
                  {infoExercise.duration}
                </p>
                <p>
                  <strong>
                    {language === "de" ? "Am besten geeignet:" : "Best for:"}
                  </strong>{" "}
                  {language === "de"
                    ? "Wenn du dich gestresst oder überfordert fühlst"
                    : "When you feel stressed or overwhelmed"}
                </p>
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => {
                  setInfoExercise(null);
                  setSelectedExercise(infoExercise);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                {language === "de" ? "Jetzt starten" : "Start now"}
              </Button>
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
