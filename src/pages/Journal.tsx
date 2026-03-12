import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Sparkles, TrendingUp, Loader2, Mic, MicOff, X, Calendar as CalendarIcon, Tag, ChevronDown, ArrowUpDown, ListFilter } from "lucide-react";
import { format, isSameDay, startOfDay, parseISO } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { TabHint } from "@/components/shared/TabHint";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { AISummaryCard } from "@/components/journal/AISummaryCard";
import { AISummaryDetail } from "@/components/journal/AISummaryDetail";
import { JournalPrompts } from "@/components/journal/JournalPrompts";
import { AIReflectionPanel } from "@/components/journal/AIReflectionPanel";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate, useLocation } from "react-router-dom";
import { ALL_JOURNAL_TAG_IDS, getTagI18nKey, toStableTagIds } from "@/lib/tagUtils";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useLastState } from "@/hooks/useLastState";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  source: string | null;
  tags: string[];
  prompt_id: string | null;
  created_at: string;
}

interface WeeklyRecap {
  patterns: string[];
  potential_needs: string[];
  suggested_next_step: string;
  summary_bullets: string[];
  created_at: string;
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "write" | "guided">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [aiReflection, setAiReflection] = useState("");
  const [isReflecting, setIsReflecting] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [weeklyRecap, setWeeklyRecap] = useState<WeeklyRecap | null>(null);
  const [isLoadingRecap, setIsLoadingRecap] = useState(false);
  const [recapCollapsed, setRecapCollapsed] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [summaryDetail, setSummaryDetail] = useState<JournalEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { logActivity } = useActivityLog();
  const { setJournalDraft, clearPart } = useLastState();

  const dateLocale = language === "de" ? de : enUS;

  // Track draft state for continue module
  useEffect(() => {
    if (viewMode === "write" && draftContent.trim().length > 10) {
      setJournalDraft({ updatedAt: Date.now(), hasContent: true });
    }
  }, [draftContent, viewMode]);

  // Resume draft from home navigation
  useEffect(() => {
    if (location.state?.resumeDraft) {
      setViewMode("write");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Non-blocking sentiment analysis after save
  const runSentimentAnalysis = async (content: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-reflect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          type: "sentiment",
          entries: [{ content }],
          language,
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.reflection) {
        try {
          const sentiment = JSON.parse(data.reflection);
          if (sentiment.brief) {
            toast({
              title: t("journal.sentimentInsight"),
              description: `${sentiment.brief}\n${t("journal.sentimentJustSuggestion")}`,
            });
          }
        } catch {
          // Sentiment response wasn't valid JSON — ignore
        }
      }
    } catch {
      // Silent fail
    }
  };

  const speechLang = language === "de" ? "de-DE" : "en-US";
  const { isListening, fullTranscript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition(speechLang, { continuous: true });

  useEffect(() => {
    if (user) loadEntries();
  }, [user]);

  useEffect(() => {
    if (fullTranscript && viewMode === "write") {
      setDraftContent((prev) => prev + (prev ? " " : "") + fullTranscript);
    }
  }, [fullTranscript]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
    }
  }, [draftContent]);

  // Load cached weekly recap
  useEffect(() => {
    const cached = localStorage.getItem("soulvay-weekly-recap") || localStorage.getItem("mindmate-weekly-recap");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsed.created_at).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) setWeeklyRecap(parsed);
      } catch {}
    }
  }, []);

  const loadEntries = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setEntries((data || []).map(e => ({
        ...e,
        tags: toStableTagIds(e.tags || []),
        prompt_id: e.prompt_id || null,
      })));
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error loading entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEntry = async (entry: { title: string; content: string; mood: string }) => {
    if (!user) return;

    try {
      const payload = {
        title: entry.title || null,
        content: entry.content,
        mood: entry.mood || null,
        tags: selectedTags,
        prompt_id: selectedPrompt,
      };

      if (selectedEntry?.id) {
        await supabase.from("journal_entries").update(payload).eq("id", selectedEntry.id);
      } else {
        await supabase.from("journal_entries").insert({
          user_id: user.id,
          user_session_id: user.id,
          source: selectedPrompt ? "guided" : "free",
          ...payload,
        } as any);
      }

      toast({
        title: t("journal.saved"),
        description: t("journal.entrySaved"),
      });

      logActivity("journal_entry");

      if (!selectedEntry?.id && entry.content.length > 30) {
        runSentimentAnalysis(entry.content);
      }

      setViewMode("list");
      setIsEditorOpen(false);
      setDraftContent("");
      setSelectedPrompt(null);
      setSelectedTags([]);
      setSelectedEntry(null);
      clearPart("journalDraft");
      loadEntries();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error saving entry:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const handleGetPatterns = async () => {
    if (entries.length < 3) {
      toast({
        title: t("journal.needMoreEntries"),
        description: t("journal.writeAtLeast3Entries"),
      });
      return;
    }

    setIsReflecting(true);
    setShowReflection(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-reflect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          type: "patterns",
          entries: entries.slice(0, 10).map(e => ({ date: e.created_at, title: e.title, content: e.content, mood: e.mood })),
          language,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiReflection(data.reflection);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast({ title: t("common.error"), variant: "destructive" });
      setShowReflection(false);
    } finally {
      setIsReflecting(false);
    }
  };

  const handleGenerateWeeklyRecap = async () => {
    if (entries.length < 3) {
      toast({ title: t("journal.needMoreEntries") });
      return;
    }

    setIsLoadingRecap(true);

    try {
      const moodStored = localStorage.getItem("mindmate-moods");
      const moodCheckins = moodStored ? JSON.parse(moodStored) : [];

      const { data: { session: recapSession } } = await supabase.auth.getSession();
      const recapAuthToken = recapSession?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-recap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${recapAuthToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          mood_checkins: moodCheckins.slice(0, 14),
          journal_entries: entries.slice(0, 10).map(e => ({ content: e.content, mood: e.mood, title: e.title, created_at: e.created_at })),
          time_range: "7d",
          language,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const recap = { ...data, created_at: new Date().toISOString() };
      setWeeklyRecap(recap);
      localStorage.setItem("mindmate-weekly-recap", JSON.stringify(recap));

      if (user) {
        await supabase.from("weekly_recaps").insert({
          user_id: user.id,
          user_session_id: user.id,
          time_range: "7d",
          patterns: data.patterns,
          potential_needs: data.potential_needs,
          suggested_next_step: data.suggested_next_step,
          summary_bullets: data.summary_bullets,
        } as any);

        // Send weekly recap email (fire-and-forget)
        supabase.functions.invoke('send-transactional-email', {
          body: {
            template: 'weekly-recap',
            data: {
              summaryBullets: data.summary_bullets || [],
              patterns: data.patterns || [],
              suggestedNextStep: data.suggested_next_step || '',
            },
          },
        }).catch((e) => {
          if (import.meta.env.DEV) console.warn('Weekly recap email failed:', e);
        });
      }

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setIsLoadingRecap(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setDraftContent(prompt + "\n\n");
    setViewMode("write");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  // Dates that have entries (for calendar highlighting)
  const entryDates = useMemo(() => {
    const dates = new Set<string>();
    entries.forEach(e => {
      dates.add(format(parseISO(e.created_at), "yyyy-MM-dd"));
    });
    return dates;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let filtered = entries.filter((e) => {
      const matchesSearch = e.content.toLowerCase().includes(searchQuery.toLowerCase()) || e.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = sourceFilter === "all" 
        || (sourceFilter === "free" && (!e.source || e.source === "free" || e.source === "manual"))
        || (sourceFilter === "chat" && e.source === "chat")
        || (sourceFilter === "summary" && e.source === "chat-summary")
        || (sourceFilter === "guided" && e.source === "guided");
      const matchesDate = !selectedDate || isSameDay(parseISO(e.created_at), selectedDate);
      return matchesSearch && matchesSource && matchesDate;
    });

    if (sortOrder === "oldest") {
      filtered = [...filtered].reverse();
    }

    return filtered;
  }, [entries, searchQuery, sourceFilter, selectedDate, sortOrder]);

  // Group entries by date for section headers
  const groupedEntries = useMemo(() => {
    const groups: { date: string; label: string; entries: JournalEntry[] }[] = [];
    let currentDate = "";

    for (const entry of filteredEntries) {
      const entryDate = format(parseISO(entry.created_at), "yyyy-MM-dd");
      if (entryDate !== currentDate) {
        currentDate = entryDate;
        const date = parseISO(entry.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label: string;
        if (isSameDay(date, today)) {
          label = t("journal.today");
        } else if (isSameDay(date, yesterday)) {
          label = t("journal.yesterday");
        } else {
          label = format(date, "EEEE, d. MMMM", { locale: dateLocale });
        }

        groups.push({ date: entryDate, label, entries: [] });
      }
      groups[groups.length - 1].entries.push(entry);
    }

    return groups;
  }, [filteredEntries, language, t, dateLocale]);

  // Write mode
  if (viewMode === "write") {
    return (
      <div className="flex flex-col h-full bg-background overflow-y-auto overscroll-contain px-4 md:px-6 lg:px-8 py-6 pb-8 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <div className="flex justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode("list"); setDraftContent(""); setSelectedPrompt(null); setSelectedTags([]); }}>
            <X className="w-4 h-4 mr-1" />{t("common.cancel")}
          </Button>
          <Button size="sm" disabled={!draftContent.trim()} onClick={() => setIsEditorOpen(true)}>
            {t("journal.continue")}
          </Button>
        </div>

        {selectedPrompt && (
          <div className="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">{t("journal.yourPrompt")}</p>
            <p className="text-sm font-medium text-foreground">{selectedPrompt}</p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          placeholder={t("journal.whatsOnMind")}
          className="w-full min-h-[200px] bg-transparent text-lg leading-relaxed focus:outline-none resize-none"
          autoFocus
        />

        {/* Tags */}
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4" />{t("journal.tagsOptional")}</p>
          <div className="flex flex-wrap gap-2">
            {ALL_JOURNAL_TAG_IDS.map(tagId => (
              <button key={tagId} onClick={() => toggleTag(tagId)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedTags.includes(tagId) ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                {t(getTagI18nKey(tagId))}
              </button>
            ))}
          </div>
        </div>

        {isSupported && (
          <div className="flex justify-center mt-6">
            <Button variant={isListening ? "destructive" : "outline"} size="lg" className="rounded-full w-14 h-14" onClick={() => isListening ? stopListening() : (resetTranscript(), startListening())}>
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
          </div>
        )}

        <AnimatePresence>
          {isEditorOpen && (
            <JournalEditor initialContent={draftContent} onSave={handleSaveEntry} onClose={() => setIsEditorOpen(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // List mode
  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title={t("journal.title")} subtitle={t("journal.subtitle")} />

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 lg:px-8 py-5 pb-8 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full space-y-5">
        {/* First-visit hint */}
        <TabHint tabId="journal" />

        {/* Weekly Recap Card — collapsible */}
        {entries.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <CalmCard variant="calm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {weeklyRecap ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setRecapCollapsed(prev => !prev)}
                        className="w-full flex items-center justify-between"
                      >
                        <h3 className="font-semibold text-foreground">{t("journal.yourWeeklyRecap")}</h3>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${recapCollapsed ? '' : 'rotate-180'}`} />
                      </button>

                      <AnimatePresence initial={false}>
                        {!recapCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 pt-1">
                              {/* Summary narrative */}
                              {Array.isArray(weeklyRecap.summary_bullets) && weeklyRecap.summary_bullets.length > 0 && (
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                  {weeklyRecap.summary_bullets.join(" ")}
                                </p>
                              )}

                              {/* Patterns */}
                              {Array.isArray(weeklyRecap.patterns) && weeklyRecap.patterns.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{t("journal.observedPatterns")}</p>
                                  <ul className="space-y-1.5">
                                    {weeklyRecap.patterns.slice(0, 4).map((p, i) => (
                                      <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{p}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Potential needs */}
                              {Array.isArray(weeklyRecap.potential_needs) && weeklyRecap.potential_needs.length > 0 && (
                                <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-lg">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {t("journal.possibleNeeds")}
                                  </p>
                                  <ul className="space-y-1">
                                    {weeklyRecap.potential_needs.map((need, i) => (
                                      <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                                        <span className="text-accent-foreground mt-0.5">💡</span>
                                        <span>{need}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Suggestion */}
                              {weeklyRecap.suggested_next_step && (
                                <div className="p-2.5 bg-primary/5 border border-primary/15 rounded-lg">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("journal.suggestion")}</p>
                                  <p className="text-sm text-foreground/90">{weeklyRecap.suggested_next_step}</p>
                                </div>
                              )}

                              <Button variant="ghost" size="sm" onClick={handleGenerateWeeklyRecap} disabled={isLoadingRecap}>
                                {isLoadingRecap ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                                {t("journal.refresh")}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium mb-1">{t("journal.weeklyRecap")}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{t("journal.discoverPatternsInEntries")}</p>
                      <Button size="sm" onClick={handleGenerateWeeklyRecap} disabled={isLoadingRecap}>
                        {isLoadingRecap ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {t("journal.generate")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CalmCard>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button onClick={() => { setSelectedEntry(null); setViewMode("write"); }} className="flex-1 gap-2">
            <Plus className="w-4 h-4" />{t("journal.newEntry")}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder={t("journal.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {/* Filters row: Source chips + Calendar + Sort */}
        <div className="space-y-3">
          {/* Source Filter Chips */}
          <div className="flex items-center gap-2">
            <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { key: "all", label: t("journal.filter.all") },
                { key: "free", label: t("journal.filter.free") },
                { key: "chat", label: t("journal.filter.chat") },
                { key: "summary", label: t("journal.filter.summary") },
                { key: "guided", label: t("journal.filter.guided") },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setSourceFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium text-center transition-all whitespace-nowrap shrink-0 ${
                    sourceFilter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar picker + Sort toggle */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 text-xs",
                    selectedDate && "bg-primary/10 border-primary/30 text-primary"
                  )}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {selectedDate
                    ? format(selectedDate, "d. MMM", { locale: dateLocale })
                    : (language === "de" ? "Datum" : "Date")}
                  {selectedDate && (
                    <X
                      className="w-3 h-3 ml-1"
                      onClick={(e) => { e.stopPropagation(); setSelectedDate(undefined); }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={dateLocale}
                  className="p-3 pointer-events-auto"
                  modifiers={{
                    hasEntry: (date) => entryDates.has(format(date, "yyyy-MM-dd")),
                  }}
                  modifiersClassNames={{
                    hasEntry: "bg-primary/15 font-semibold text-primary",
                  }}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortOrder === "newest"
                ? (language === "de" ? "Neueste" : "Newest")
                : (language === "de" ? "Älteste" : "Oldest")}
            </Button>

            {(selectedDate || searchQuery || sourceFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground ml-auto"
                onClick={() => { setSelectedDate(undefined); setSearchQuery(""); setSourceFilter("all"); }}
              >
                {language === "de" ? "Zurücksetzen" : "Reset"}
              </Button>
            )}
          </div>
        </div>

        {/* Guided Prompts */}
        <JournalPrompts onSelectPrompt={handleSelectPrompt} />

        {/* AI Reflection */}
        <AnimatePresence>
          {showReflection && (
            <AIReflectionPanel reflection={aiReflection} isLoading={isReflecting} onClose={() => setShowReflection(false)} />
          )}
        </AnimatePresence>

        {/* Pattern Discovery Button */}
        {entries.length >= 3 && !showReflection && (
          <Button variant="ghost" size="sm" onClick={handleGetPatterns} className="w-full text-muted-foreground" disabled={isReflecting}>
            <Sparkles className="w-4 h-4 mr-2" />{t("journal.discoverPatterns")}
          </Button>
        )}

        {/* Entries grouped by date */}
        <div className="space-y-4">
          {isLoading ? (
            <CalmCard variant="gentle" className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></CalmCard>
          ) : filteredEntries.length === 0 ? (
            <CalmCard variant="gentle" className="text-center py-8">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {selectedDate
                  ? (language === "de" ? "Keine Einträge an diesem Tag" : "No entries on this day")
                  : searchQuery ? t("journal.noEntriesFound") : t("journal.noEntries")}
              </p>
            </CalmCard>
          ) : (
            groupedEntries.map((group) => (
              <div key={group.date}>
                <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1 uppercase tracking-wide">
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {group.entries.map((entry, index) => (
                    entry.source === "chat-summary" ? (
                      <AISummaryCard
                        key={entry.id}
                        id={entry.id}
                        content={entry.content}
                        createdAt={entry.created_at}
                        index={index}
                        onClick={() => setSummaryDetail(entry)}
                      />
                    ) : (
                      <JournalEntryCard
                        key={entry.id}
                        id={entry.id}
                        title={entry.title}
                        content={entry.content}
                        mood={entry.mood}
                        source={entry.source}
                        createdAt={entry.created_at}
                        index={index}
                        onClick={() => { setSelectedEntry(entry); setDraftContent(entry.content); setSelectedTags(entry.tags || []); setIsEditorOpen(true); }}
                      />
                    )
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Entry Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && selectedEntry && (
          <JournalEditor
            initialTitle={selectedEntry.title || ""}
            initialContent={selectedEntry.content}
            initialMood={selectedEntry.mood || ""}
            isEditing={!!selectedEntry.id}
            onSave={handleSaveEntry}
            onClose={() => { setIsEditorOpen(false); setSelectedEntry(null); setSelectedTags([]); }}
            onDelete={selectedEntry.id ? async () => {
              await supabase.from("journal_entries").delete().eq("id", selectedEntry.id);
              toast({ title: t("journal.entryDeleted") });
              setIsEditorOpen(false);
              setSelectedEntry(null);
              setSelectedTags([]);
              loadEntries();
            } : undefined}
          />
        )}
      </AnimatePresence>

      {/* AI Summary Detail View */}
      <AnimatePresence>
        {summaryDetail && (
          <AISummaryDetail
            content={summaryDetail.content}
            createdAt={summaryDetail.created_at}
            onClose={() => setSummaryDetail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
