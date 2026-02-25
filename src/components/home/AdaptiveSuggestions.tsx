import { motion } from "framer-motion";
import { Sparkles, ChevronRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";
import { Exercise } from "@/data/exercises";

interface AdaptiveSuggestion {
  type: "exercise" | "topic" | "journal" | "mood";
  title: string;
  titleDe: string;
  description: string;
  descriptionDe: string;
  exercise?: Exercise;
  route?: string;
  urgent?: boolean;
}

interface AdaptiveSuggestionsProps {
  suggestions: AdaptiveSuggestion[];
  onStartExercise: (exercise: Exercise) => void;
}

export function AdaptiveSuggestions({ suggestions, onStartExercise }: AdaptiveSuggestionsProps) {
  const { language, t, getExerciseDisplay } = useTranslation();
  const navigate = useNavigate();

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          {t("home.forYou")}
        </span>
      </div>

      {suggestions.map((suggestion, index) => {
        const title = language === "de" ? suggestion.titleDe : suggestion.title;
        const desc = suggestion.exercise
          ? getExerciseDisplay(suggestion.exercise.id, {
              title: suggestion.exercise.title,
              description: suggestion.exercise.description,
            }).title
          : language === "de" ? suggestion.descriptionDe : suggestion.description;

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            onClick={() => {
              if (suggestion.exercise) {
                onStartExercise(suggestion.exercise);
              } else if (suggestion.route) {
                navigate(suggestion.route);
              }
            }}
            className={`w-full text-left rounded-2xl p-4 border transition-colors ${
              suggestion.urgent
                ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                : "bg-card border-border/30 hover:border-border/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {suggestion.urgent && (
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{title}</p>
                  <p className="text-xs text-muted-foreground truncate">{desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
