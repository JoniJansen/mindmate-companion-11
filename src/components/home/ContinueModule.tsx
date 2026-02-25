import { motion } from "framer-motion";
import { Play, BookOpen, Map, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useLastState } from "@/hooks/useLastState";
import { getExerciseById } from "@/data/exercises";
import { topics } from "@/data/topics";

export function ContinueModule() {
  const { t, language, getExerciseDisplay, getTopicDisplay } = useTranslation();
  const navigate = useNavigate();
  const { lastExercise, lastTopic, journalDraft, hasAnyContinuation, clearPart } = useLastState();

  if (!hasAnyContinuation) return null;

  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const cards: {
    key: string;
    icon: typeof Play;
    title: string;
    subtitle: string;
    onClick: () => void;
    onClear: () => void;
  }[] = [];

  // Exercise card
  if (lastExercise && !lastExercise.completedAt) {
    const exercise = getExerciseById(lastExercise.id);
    const display = exercise ? getExerciseDisplay(exercise.id, {
      title: exercise.title,
      description: exercise.description,
    }) : null;
    cards.push({
      key: "exercise",
      icon: Play,
      title: t("home.continueExercise"),
      subtitle: display?.title || t("home.continueExerciseDesc"),
      onClick: () => navigate("/toolbox", { state: { startExercise: lastExercise.id } }),
      onClear: () => clearPart("lastExercise"),
    });
  }

  // Topic card
  if (lastTopic) {
    const topic = topics.find(tp => tp.id === lastTopic.topicId);
    const display = topic ? getTopicDisplay(topic.id, {
      title: topic.title,
      description: topic.description,
    }) : null;
    const stepLabel = lastTopic.stepIndex !== undefined
      ? ` · ${t("common.step")} ${(lastTopic.stepIndex || 0) + 1}`
      : "";
    cards.push({
      key: "topic",
      icon: Map,
      title: t("home.continueTopic"),
      subtitle: (display?.title || t("home.continueTopicDesc")) + stepLabel,
      onClick: () => navigate("/topics", { state: { openTopic: lastTopic.topicId } }),
      onClear: () => clearPart("lastTopic"),
    });
  }

  // Journal draft card
  if (journalDraft?.hasContent) {
    const ago = journalDraft.updatedAt
      ? formatRelativeTime(journalDraft.updatedAt, language)
      : "";
    cards.push({
      key: "journal",
      icon: BookOpen,
      title: t("home.continueJournalDraft"),
      subtitle: ago ? `${t("home.lastEdited")} ${ago}` : t("home.continueJournalDraft"),
      onClick: () => navigate("/journal", { state: { resumeDraft: true } }),
      onClear: () => clearPart("journalDraft"),
    });
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-2 mb-4"
    >
      <span className="text-xs font-medium text-muted-foreground">
        {t("home.continueTitle")}
      </span>

      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="relative group"
          >
            <button
              onClick={card.onClick}
              className="w-full text-left rounded-2xl p-4 border bg-card border-border/30 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{card.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); card.onClear(); }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted"
              aria-label={t("common.clear")}
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function formatRelativeTime(ts: number, lang: string): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (lang === "de") {
    if (mins < 1) return "gerade eben";
    if (mins < 60) return `vor ${mins} Min`;
    if (hours < 24) return `vor ${hours} Std`;
    return `vor ${days} Tagen`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
