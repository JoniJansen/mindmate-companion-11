import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TopicCard } from "@/components/topics/TopicCard";
import { TopicDetail } from "@/components/topics/TopicDetail";
import { topics, Topic } from "@/data/topics";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

export default function Topics() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { t, getTopicTranslation } = useTranslation();

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('topic_progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress: Record<string, boolean>) => {
    setProgress(newProgress);
    localStorage.setItem('topic_progress', JSON.stringify(newProgress));
  };

  const handleStepComplete = (stepId: number) => {
    if (!selectedTopic) return;
    
    const key = `${selectedTopic.id}-${stepId}`;
    const newProgress = { ...progress, [key]: true };
    saveProgress(newProgress);
    
    toast({
      title: t("topics.stepCompleted"),
      description: t("topics.greatProgress"),
    });
  };

  const getTopicProgress = (topicId: string, steps: number) => {
    const completed = Object.keys(progress).filter(k => 
      k.startsWith(`${topicId}-`) && progress[k]
    ).length;
    return Math.round((completed / steps) * 100);
  };

  const getTranslatedTitle = (topic: Topic) => {
    const translation = getTopicTranslation(topic.id);
    return translation?.title || topic.title;
  };

  const getTranslatedDescription = (topic: Topic) => {
    const translation = getTopicTranslation(topic.id);
    return translation?.description || topic.description;
  };

  const filteredTopics = topics.filter(topic => {
    const title = getTranslatedTitle(topic).toLowerCase();
    const description = getTranslatedDescription(topic).toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || description.includes(query);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <AnimatePresence mode="wait">
        {selectedTopic ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-6 max-w-lg mx-auto"
          >
            <TopicDetail
              topic={selectedTopic}
              onBack={() => setSelectedTopic(null)}
              progress={progress}
              onStepComplete={handleStepComplete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PageHeader title={t("topics.title")} subtitle={t("topics.subtitle")} />

            <div className="px-4 py-4 max-w-lg mx-auto">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("topics.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </div>

              {/* Topics list */}
              <div className="space-y-3">
                {filteredTopics.map((topic, index) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    progress={getTopicProgress(topic.id, topic.steps.length)}
                    onClick={() => setSelectedTopic(topic)}
                    index={index}
                    translatedTitle={getTranslatedTitle(topic)}
                    translatedDescription={getTranslatedDescription(topic)}
                  />
                ))}
              </div>

              {filteredTopics.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-muted-foreground">{t("topics.noMatch")}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
