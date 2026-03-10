import { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, CheckCircle2, Clock, BookOpen, GraduationCap, StickyNote, MessageCircle, Save, Send, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { TabHint } from "@/components/shared/TabHint";
import { Button } from "@/components/ui/button";
import { topics, Topic } from "@/data/topics";
import { useTranslation } from "@/hooks/useTranslation";
import { topicExerciseTranslations } from "@/lib/topicExerciseTranslations";
import { useNavigate, useLocation } from "react-router-dom";
import { useLastState } from "@/hooks/useLastState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TopicProgress {
  [topicId: string]: {
    completedSteps: number[];
    lastAccessed: string;
  };
}

interface TopicNotes {
  [topicId: string]: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Topics = forwardRef<HTMLDivElement>(function Topics(_props, _ref) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [progress, setProgress] = useState<TopicProgress>({});
  const [detailTab, setDetailTab] = useState<"learn" | "path" | "notes" | "ai">("learn");
  const [topicNotes, setTopicNotes] = useState<TopicNotes>({});
  const [topicChatMessages, setTopicChatMessages] = useState<{role: "user" | "assistant"; content: string}[]>([]);
  const [topicChatInput, setTopicChatInput] = useState("");
  const [topicChatLoading, setTopicChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const topicStreamBufferRef = useRef("");
  const topicStreamFrameRef = useRef<number | null>(null);

  const { language, t, getTopicDisplay } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setLastTopic } = useLastState();
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle navigation state (open specific topic)
  useEffect(() => {
    const openTopicId = location.state?.openTopic;
    if (openTopicId) {
      const topic = topics.find(tp => tp.id === openTopicId);
      if (topic) setSelectedTopic(topic);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load progress
  useEffect(() => {
    const stored = localStorage.getItem("mindmate-topic-progress");
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch (e) {
        if (import.meta.env.DEV) console.error("Error parsing progress:", e);
      }
    }
  }, []);

  // Load notes
  useEffect(() => {
    const stored = localStorage.getItem("mindmate-topic-notes");
    if (stored) {
      try { setTopicNotes(JSON.parse(stored)); } catch {}
    }
  }, []);

  // Reset chat when topic changes
  useEffect(() => {
    if (selectedTopic) {
      setTopicChatMessages([]);
      setTopicChatInput("");
      setDetailTab("learn");
    }
  }, [selectedTopic?.id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [topicChatMessages]);

  const saveNotes = (topicId: string, content: string) => {
    const updated = { ...topicNotes, [topicId]: content };
    setTopicNotes(updated);
    localStorage.setItem("mindmate-topic-notes", JSON.stringify(updated));
  };

  const saveNoteToJournal = async (topicId: string) => {
    if (!user || !topicNotes[topicId]?.trim()) return;
    const topic = topics.find(tp => tp.id === topicId);
    try {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        user_session_id: user.id,
        content: topicNotes[topicId],
        title: `${topic?.icon || ""} ${topic?.title || topicId}`,
        source: "topic-notes",
        tags: [topicId],
      } as any);
      toast({ title: t("topics.savedToJournal"), description: t("chat.chatSavedDesc") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const flushTopicBuffer = useCallback(() => {
    if (!topicStreamBufferRef.current) return;
    const chunk = topicStreamBufferRef.current;
    topicStreamBufferRef.current = "";
    setTopicChatMessages(prev => {
      const lastIndex = prev.length - 1;
      const last = prev[lastIndex];
      if (last?.role === "assistant") {
        const updated = [...prev];
        updated[lastIndex] = { ...last, content: last.content + chunk };
        return updated;
      }
      return [...prev, { role: "assistant", content: chunk }];
    });
  }, []);

  const enqueueTopicChunk = useCallback((chunk: string) => {
    if (!chunk) return;
    topicStreamBufferRef.current += chunk;
    if (topicStreamFrameRef.current !== null) return;
    topicStreamFrameRef.current = requestAnimationFrame(() => {
      topicStreamFrameRef.current = null;
      flushTopicBuffer();
    });
  }, [flushTopicBuffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (topicStreamFrameRef.current !== null) {
        cancelAnimationFrame(topicStreamFrameRef.current);
      }
      topicStreamBufferRef.current = "";
    };
  }, []);

  const sendTopicChat = useCallback(async () => {
    if (!topicChatInput.trim() || topicChatLoading || !selectedTopic) return;
    const userMsg = { role: "user" as const, content: topicChatInput.trim() };
    const newMessages = [...topicChatMessages, userMsg];
    setTopicChatMessages(newMessages);
    setTopicChatInput("");
    setTopicChatLoading(true);
    topicStreamBufferRef.current = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const display = getTopicDisplay(selectedTopic.id, {
        title: selectedTopic.title,
        description: selectedTopic.description,
        longDescription: selectedTopic.longDescription,
        steps: selectedTopic.steps.map(s => ({ title: s.title, description: s.description })),
      });

      const topicContext = `You are helping the user learn about and apply the topic "${display.title}" to their personal situation. Topic description: ${display.longDescription}. Available learning content covers: ${selectedTopic.learn.map(l => l.title).join(", ")}. Be educational, empathetic, and personalized. Answer in ${language === "de" ? "German" : "English"}.`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: newMessages,
          preferences: { language, tone: "gentle", addressForm: "du", modePrompt: topicContext },
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) enqueueTopicChunk(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      // Final flush
      if (topicStreamFrameRef.current !== null) {
        cancelAnimationFrame(topicStreamFrameRef.current);
        topicStreamFrameRef.current = null;
      }
      flushTopicBuffer();
    } catch {
      setTopicChatMessages(prev => [...prev, { role: "assistant", content: language === "de" ? "Entschuldigung, es gab einen Fehler. Bitte versuche es erneut." : "Sorry, something went wrong. Please try again." }]);
    }
    setTopicChatLoading(false);
  }, [topicChatInput, topicChatLoading, selectedTopic, topicChatMessages, language, getTopicDisplay, enqueueTopicChunk, flushTopicBuffer]);

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

  const handleStepAction = (topic: Topic, step: typeof topic.steps[0], stepIndex: number) => {
    saveProgress(topic.id, step.id);
    // Track for continue module
    const nextStepIndex = stepIndex + 1 < topic.steps.length ? stepIndex + 1 : undefined;
    if (nextStepIndex !== undefined) {
      setLastTopic({ topicId: topic.id, stepIndex: nextStepIndex });
    }

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

  // Single source of truth for topic display strings
  const getDisplay = (topic: Topic) => getTopicDisplay(topic.id, {
    title: topic.title,
    description: topic.description,
    longDescription: topic.longDescription,
    steps: topic.steps.map(s => ({ title: s.title, description: s.description })),
    learn: topic.learn,
  });

  const filteredTopics = useMemo(() => topics.filter((topic) => {
    const display = getDisplay(topic);
    const title = display.title.toLowerCase();
    const description = display.description.toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || description.includes(query);
  }), [searchQuery, getDisplay]);

  // Track topic for continue module
  useEffect(() => {
    if (selectedTopic) {
      setLastTopic({ topicId: selectedTopic.id, stepIndex: 0 });
    }
  }, [selectedTopic?.id]);

  // Topic detail view
  if (selectedTopic) {
    const topicProgress = getTopicProgress(selectedTopic.id, selectedTopic.steps.length);
    const completedSteps = progress[selectedTopic.id]?.completedSteps || [];
    const display = getDisplay(selectedTopic);
    const currentNote = topicNotes[selectedTopic.id] || "";

    const tabItems = [
      { key: "learn" as const, label: t("topics.learn"), icon: GraduationCap },
      { key: "path" as const, label: t("topics.reflectionPath"), icon: BookOpen },
      { key: "notes" as const, label: t("topics.notes"), icon: StickyNote },
      { key: "ai" as const, label: t("topics.aiChat"), icon: MessageCircle },
    ];

    return (
      <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 lg:px-8 py-6 pb-8 w-full">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)} className="mb-3">
              ← {t("common.back")}
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{selectedTopic.icon}</span>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{display.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedTopic.steps.length} {t("topics.steps")} · {topicProgress}% {t("topics.complete")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${topicProgress}%` }} transition={{ delay: 0.2, duration: 0.5 }} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
            {tabItems.map(tab => (
              <Button
                key={tab.key}
                variant={detailTab === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => setDetailTab(tab.key)}
                className="gap-1.5 shrink-0 text-xs"
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </Button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* LEARN TAB */}
            {detailTab === "learn" && (
              <motion.div key="learn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {/* Description */}
                <CalmCard variant="gentle">
                  <p className="text-sm text-muted-foreground leading-relaxed">{display.longDescription}</p>
                </CalmCard>

                {(display.learn.length > 0 ? display.learn : selectedTopic.learn).map((section, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <CalmCard variant="elevated" className="space-y-3">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        {section.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
                      {section.reflectionQuestion && (
                        <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <p className="text-xs font-medium text-primary mb-1">💭 {t("topics.reflectionQuestion")}</p>
                          <p className="text-sm text-foreground italic">{section.reflectionQuestion}</p>
                        </div>
                      )}
                    </CalmCard>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* PATH TAB */}
            {detailTab === "path" && (
              <motion.div key="path" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {selectedTopic.steps.map((step, index) => {
                  const isCompleted = completedSteps.includes(step.id);
                  const stepDisplay = display.steps[index] || { title: step.title, description: step.description };
                  const stepTypeLabel: Record<string, string> = {
                    chat: t("topics.stepType.chat"), journal: t("topics.stepType.journal"),
                    exercise: t("topics.stepType.exercise"), reflection: t("topics.stepType.reflection"),
                  };
                  return (
                    <motion.div key={step.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                      <CalmCard
                        variant={isCompleted ? "calm" : "gentle"}
                        className={`cursor-pointer transition-all ${isCompleted ? "opacity-75" : "hover:bg-muted/50"}`}
                        onClick={() => handleStepAction(selectedTopic, step, index)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-sm font-medium">{index + 1}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>{stepDisplay.title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{stepDisplay.description}</p>
                            <span className="inline-flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              {step.type === "chat" && "💬"}{step.type === "journal" && "📝"}{step.type === "exercise" && "🧘"}{step.type === "reflection" && "💭"}
                              {stepTypeLabel[step.type]}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </CalmCard>
                    </motion.div>
                  );
                })}

                {/* Exercises */}
                {selectedTopic.exercises.length > 0 && (
                  <>
                    <h3 className="font-medium text-foreground mt-4 mb-2">{t("topics.exercises")}</h3>
                    {selectedTopic.exercises.map(ex => {
                      const exTranslation = topicExerciseTranslations[ex.id];
                      const exTitle = exTranslation ? (language === "de" ? exTranslation.de.title : exTranslation.en.title) : ex.title;
                      const exDesc = exTranslation ? (language === "de" ? exTranslation.de.description : exTranslation.en.description) : ex.description;
                      return (
                        <CalmCard key={ex.id} variant="elevated" className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/toolbox")}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
                            <div className="flex-1"><h4 className="font-medium text-foreground">{exTitle}</h4><p className="text-sm text-muted-foreground">{exDesc}</p></div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{ex.duration}</span>
                          </div>
                        </CalmCard>
                      );
                    })}
                  </>
                )}
              </motion.div>
            )}

            {/* NOTES TAB */}
            {detailTab === "notes" && (
              <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <CalmCard variant="elevated">
                  <textarea
                    value={currentNote}
                    onChange={(e) => saveNotes(selectedTopic.id, e.target.value)}
                    placeholder={t("topics.notesPlaceholder")}
                    className="w-full min-h-[200px] bg-transparent text-foreground text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/60"
                  />
                </CalmCard>
                {currentNote.trim() && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => saveNoteToJournal(selectedTopic.id)}>
                      <Save className="w-4 h-4" />
                      {t("topics.saveToJournal")}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* AI CHAT TAB */}
            {detailTab === "ai" && (
              <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {topicChatMessages.length === 0 && (
                  <CalmCard variant="gentle">
                    <p className="text-sm text-muted-foreground">{t("topics.topicChatIntro")}</p>
                  </CalmCard>
                )}

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {topicChatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-lg"
                          : "bg-card border border-border/50 text-foreground rounded-bl-lg shadow-soft"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {topicChatLoading && topicChatMessages[topicChatMessages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-lg shadow-soft">
                        <div className="flex gap-1.5"><div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" /><div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{animationDelay:'150ms'}} /><div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{animationDelay:'300ms'}} /></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={topicChatInput}
                    onChange={(e) => setTopicChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTopicChat(); } }}
                    placeholder={t("topics.askAboutTopic")}
                    className="flex-1 h-11 bg-muted/30 border border-border/50 rounded-full px-4 text-[15px] focus:outline-none focus:border-primary/40"
                    disabled={topicChatLoading}
                  />
                  <Button size="icon" className="rounded-full h-10 w-10" onClick={sendTopicChat} disabled={!topicChatInput.trim() || topicChatLoading}>
                    {topicChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    );
  }

  // Topic list view
  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={t("topics.title")}
        subtitle={t("topics.structuredPaths")}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-8">
        <div className="max-w-lg mx-auto space-y-4">
          {/* First-visit hint */}
          <TabHint tabId="topics" />
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("topics.searchTopics")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* Topics grid */}
          <div className="space-y-3">
          {filteredTopics.map((topic, index) => {
            const topicProgress = getTopicProgress(topic.id, topic.steps.length);
            const hasProgress = topicProgress > 0;
            const topicDisplay = getDisplay(topic);

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CalmCard
                  variant="gentle"
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {topicDisplay.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {topicDisplay.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {topic.steps.length} {t("topics.steps")}
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
            <CalmCard variant="gentle" animate={false} className="text-center py-8">
              <p className="text-muted-foreground">
                {t("topics.noMatch")}
              </p>
            </CalmCard>
          )}
        </div>
      </div>
    </div>
  );
});

export default Topics;
