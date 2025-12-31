import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, BookOpen, Dumbbell, CheckCircle2, Circle, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmCard } from "@/components/shared/CalmCard";
import { Topic, TopicStep, TopicExercise } from "@/data/topics";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface TopicDetailProps {
  topic: Topic;
  onBack: () => void;
  progress: Record<string, boolean>;
  onStepComplete: (stepId: number) => void;
}

const stepTypeIcon = {
  reflection: BookOpen,
  exercise: Dumbbell,
  journal: BookOpen,
  chat: MessageCircle,
};

export function TopicDetail({ topic, onBack, progress, onStepComplete }: TopicDetailProps) {
  const [activeTab, setActiveTab] = useState<'path' | 'exercises'>('path');
  const navigate = useNavigate();
  const { t, getTopicTranslation } = useTranslation();

  const translation = getTopicTranslation(topic.id);
  const topicTitle = translation?.title || topic.title;
  const topicLongDescription = translation?.longDescription || topic.longDescription;

  const stepTypeLabel: Record<string, string> = {
    reflection: t("topics.stepType.reflection"),
    exercise: t("topics.stepType.exercise"),
    journal: t("topics.stepType.journal"),
    chat: t("topics.stepType.chat"),
  };

  const completedSteps = topic.steps.filter(s => progress[`${topic.id}-${s.id}`]).length;
  const progressPercent = Math.round((completedSteps / topic.steps.length) * 100);

  const handleStartStep = (step: TopicStep) => {
    if (step.type === 'chat') {
      localStorage.setItem('chat_topic_prompt', `I'd like to explore: ${step.title}. ${step.description}`);
      navigate('/chat');
    } else if (step.type === 'journal') {
      localStorage.setItem('journal_prompt', step.title);
      navigate('/journal');
    } else {
      // For reflection and exercise, mark as complete and show a toast
      onStepComplete(step.id);
    }
  };

  const handleStartExercise = (exercise: TopicExercise) => {
    navigate('/toolbox');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{topic.icon}</span>
            <h1 className="text-xl font-semibold text-foreground">{topicTitle}</h1>
          </div>
        </div>
      </div>

      {/* Description */}
      <CalmCard variant="gentle" className="mb-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {topicLongDescription}
        </p>
      </CalmCard>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{t("topics.yourProgress")}</span>
          <span className="font-medium text-foreground">{completedSteps}/{topic.steps.length} {t("topics.steps")}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'path' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('path')}
          className="flex-1"
        >
          {t("topics.reflectionPath")}
        </Button>
        <Button
          variant={activeTab === 'exercises' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('exercises')}
          className="flex-1"
        >
          {t("topics.exercises")}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'path' ? (
          <motion.div
            key="path"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {topic.steps.map((step, index) => {
              const isComplete = progress[`${topic.id}-${step.id}`];
              const Icon = stepTypeIcon[step.type];
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CalmCard 
                    variant={isComplete ? "calm" : "elevated"}
                    className={`cursor-pointer ${isComplete ? 'opacity-70' : ''}`}
                    onClick={() => !isComplete && handleStartStep(step)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">{step.id}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        <div className="flex items-center gap-2">
                          <Icon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{stepTypeLabel[step.type]}</span>
                        </div>
                      </div>

                      {!isComplete && (
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CalmCard>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="exercises"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {topic.exercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CalmCard 
                  variant="elevated"
                  className="cursor-pointer hover:shadow-elevated transition-shadow"
                  onClick={() => handleStartExercise(exercise)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{exercise.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{exercise.description}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {exercise.duration}
                    </div>
                  </div>
                </CalmCard>
              </motion.div>
            ))}

            {topic.exercises.length === 0 && (
              <CalmCard variant="gentle" className="text-center py-6">
                <p className="text-muted-foreground">{t("topics.noExercises")}</p>
              </CalmCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
