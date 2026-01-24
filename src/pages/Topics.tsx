import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { Button } from "@/components/ui/button";
import { topics, Topic } from "@/data/topics";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";

interface TopicProgress {
  [topicId: string]: {
    completedSteps: number[];
    lastAccessed: string;
  };
}

export default function Topics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [progress, setProgress] = useState<TopicProgress>({});

  const { language, getTopicTranslation } = useTranslation();
  const navigate = useNavigate();

  // Load progress
  useEffect(() => {
    const stored = localStorage.getItem("mindmate-topic-progress");
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing progress:", e);
      }
    }
  }, []);

  const saveProgress = (topicId: string, stepId: number) => {
    const newProgress = {
      ...progress,
      [topicId]: {
        completedSteps: [
          ...(progress[topicId]?.completedSteps || []),
          stepId,
        ].filter((v, i, a) => a.indexOf(v) === i),
        lastAccessed: new Date().toISOString(),
      },
    };
    setProgress(newProgress);
    localStorage.setItem("mindmate-topic-progress", JSON.stringify(newProgress));
  };

  const getTopicProgress = (topicId: string, totalSteps: number): number => {
    const completed = progress[topicId]?.completedSteps.length || 0;
    return Math.round((completed / totalSteps) * 100);
  };

  const handleStepAction = (topic: Topic, step: typeof topic.steps[0]) => {
    saveProgress(topic.id, step.id);

    switch (step.type) {
      case "chat":
        navigate("/chat", {
          state: { initialMessage: step.description },
        });
        break;
      case "journal":
        navigate("/journal");
        break;
      case "exercise":
        navigate("/toolbox");
        break;
      default:
        // Reflection - just mark complete
        break;
    }
  };

  const getTranslatedTitle = (topic: Topic) => {
    const translation = getTopicTranslation(topic.id);
    return translation?.title || topic.title;
  };

  const getTranslatedDescription = (topic: Topic) => {
    const translation = getTopicTranslation(topic.id);
    return translation?.description || topic.description;
  };

  const filteredTopics = topics.filter((topic) => {
    const title = getTranslatedTitle(topic).toLowerCase();
    const description = getTranslatedDescription(topic).toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || description.includes(query);
  });

  // Topic detail view
  if (selectedTopic) {
    const topicProgress = getTopicProgress(
      selectedTopic.id,
      selectedTopic.steps.length
    );
    const completedSteps = progress[selectedTopic.id]?.completedSteps || [];

    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTopic(null)}
              className="mb-4"
            >
              ← {language === "de" ? "Zurück" : "Back"}
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-4xl">{selectedTopic.icon}</span>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {getTranslatedTitle(selectedTopic)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedTopic.steps.length}{" "}
                  {language === "de" ? "Schritte" : "steps"} · {topicProgress}%{" "}
                  {language === "de" ? "abgeschlossen" : "complete"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CalmCard variant="gentle" className="mb-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedTopic.longDescription}
              </p>
            </CalmCard>
          </motion.div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${topicProgress}%` }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {selectedTopic.steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <CalmCard
                    variant={isCompleted ? "calm" : "gentle"}
                    className={`cursor-pointer transition-all ${
                      isCompleted ? "opacity-75" : "hover:bg-gentle/10"
                    }`}
                    onClick={() => handleStepAction(selectedTopic, step)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium ${
                            isCompleted
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-muted-foreground capitalize">
                          {step.type === "chat" && "💬"}
                          {step.type === "journal" && "📝"}
                          {step.type === "exercise" && "🧘"}
                          {step.type === "reflection" && "💭"}
                          {step.type}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </CalmCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Topic list view
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={language === "de" ? "Themen" : "Topics"}
        subtitle={
          language === "de"
            ? "Strukturierte Reflexionspfade"
            : "Structured reflection paths"
        }
      />

      <div className="px-4 md:px-6 lg:px-8 py-4 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={language === "de" ? "Thema suchen..." : "Search topics..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Topics grid - responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredTopics.map((topic, index) => {
            const topicProgress = getTopicProgress(topic.id, topic.steps.length);
            const hasProgress = topicProgress > 0;

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CalmCard
                  variant="gentle"
                  className="cursor-pointer hover:bg-gentle/10 transition-colors"
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {getTranslatedTitle(topic)}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {getTranslatedDescription(topic)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {topic.steps.length}{" "}
                          {language === "de" ? "Schritte" : "steps"}
                        </span>
                        {hasProgress && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {topicProgress}%
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>

                  {/* Progress bar */}
                  {hasProgress && (
                    <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${topicProgress}%` }}
                      />
                    </div>
                  )}
                </CalmCard>
              </motion.div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <CalmCard variant="gentle" className="text-center py-8">
            <p className="text-muted-foreground">
              {language === "de"
                ? "Keine Themen gefunden"
                : "No topics found"}
            </p>
          </CalmCard>
        )}
      </div>
    </div>
  );
}
