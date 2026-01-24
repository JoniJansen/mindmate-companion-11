import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Sparkles, TrendingUp, Loader2, Mic, MicOff, X, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { JournalPrompts } from "@/components/journal/JournalPrompts";
import { AIReflectionPanel } from "@/components/journal/AIReflectionPanel";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { language } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const speechLang = language === "de" ? "de-DE" : "en-US";
  const { isListening, fullTranscript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition(speechLang, { continuous: true });

  const emotionTags = language === "de"
    ? ["Ängstlich", "Traurig", "Wütend", "Gestresst", "Ruhig", "Dankbar", "Hoffnungsvoll", "Überfordert"]
    : ["Anxious", "Sad", "Angry", "Stressed", "Calm", "Grateful", "Hopeful", "Overwhelmed"];

  const topicTags = language === "de"
    ? ["Arbeit", "Beziehungen", "Familie", "Gesundheit", "Selbstwert", "Zukunft"]
    : ["Work", "Relationships", "Family", "Health", "Self-worth", "Future"];

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
    const cached = localStorage.getItem("mindmate-weekly-recap");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsed.created_at).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) setWeeklyRecap(parsed); // 24h cache
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries((data || []).map(e => ({ ...e, tags: e.tags || [], prompt_id: e.prompt_id || null })));
    } catch (error) {
      console.error("Error loading entries:", error);
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
          user_session_id: user.id, // Legacy compatibility
          source: selectedPrompt ? "guided" : "free",
          ...payload,
        } as any);
      }

      toast({
        title: language === "de" ? "Gespeichert" : "Saved",
        description: language === "de" ? "Dein Eintrag wurde gespeichert." : "Your entry has been saved.",
      });

      setViewMode("list");
      setIsEditorOpen(false);
      setDraftContent("");
      setSelectedPrompt(null);
      setSelectedTags([]);
      setSelectedEntry(null);
      loadEntries();
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({ title: language === "de" ? "Fehler" : "Error", variant: "destructive" });
    }
  };

  const handleGetPatterns = async () => {
    if (entries.length < 3) {
      toast({ title: language === "de" ? "Mehr Einträge nötig" : "Need more entries", description: language === "de" ? "Schreibe mindestens 3 Einträge." : "Write at least 3 entries." });
      return;
    }

    setIsReflecting(true);
    setShowReflection(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-reflect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "patterns",
          entries: entries.slice(0, 10).map(e => ({ date: e.created_at, title: e.title, content: e.content, mood: e.mood })),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiReflection(data.reflection);
    } catch (error) {
      console.error("Error:", error);
      toast({ title: language === "de" ? "Fehler" : "Error", variant: "destructive" });
      setShowReflection(false);
    } finally {
      setIsReflecting(false);
    }
  };

  const handleGenerateWeeklyRecap = async () => {
    if (entries.length < 3) {
      toast({ title: language === "de" ? "Mehr Einträge nötig" : "Need more entries" });
      return;
    }

    setIsLoadingRecap(true);

    try {
      // Get mood checkins from localStorage (will be migrated to Supabase)
      const moodStored = localStorage.getItem("mindmate-moods");
      const moodCheckins = moodStored ? JSON.parse(moodStored) : [];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-recap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      // Save to Supabase
      if (user) {
        await supabase.from("weekly_recaps").insert({
          user_id: user.id,
          user_session_id: user.id, // Legacy compatibility
          time_range: "7d",
          patterns: data.patterns,
          potential_needs: data.potential_needs,
          suggested_next_step: data.suggested_next_step,
          summary_bullets: data.summary_bullets,
        } as any);
      }

    } catch (error) {
      console.error("Error:", error);
      toast({ title: language === "de" ? "Fehler" : "Error", variant: "destructive" });
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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const filteredEntries = entries.filter((e) => {
    const matchesSearch = e.content.toLowerCase().includes(searchQuery.toLowerCase()) || e.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Write mode
  if (viewMode === "write") {
    return (
      <div className="min-h-screen bg-background pb-24 px-4 md:px-6 lg:px-8 py-6 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <div className="flex justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setViewMode("list"); setDraftContent(""); setSelectedPrompt(null); setSelectedTags([]); }}>
            <X className="w-4 h-4 mr-1" />{language === "de" ? "Abbrechen" : "Cancel"}
          </Button>
          <Button size="sm" disabled={!draftContent.trim()} onClick={() => setIsEditorOpen(true)}>
            {language === "de" ? "Weiter" : "Continue"}
          </Button>
        </div>

        {selectedPrompt && (
          <div className="mb-4 p-3 bg-gentle/10 rounded-xl border border-gentle/20">
            <p className="text-xs text-muted-foreground mb-1">{language === "de" ? "Deine Frage:" : "Your prompt:"}</p>
            <p className="text-sm font-medium text-foreground">{selectedPrompt}</p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          placeholder={language === "de" ? "Was beschäftigt dich?" : "What's on your mind?"}
          className="w-full min-h-[200px] bg-transparent text-lg leading-relaxed focus:outline-none resize-none"
          autoFocus
        />

        {/* Tags */}
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4" />{language === "de" ? "Tags (optional)" : "Tags (optional)"}</p>
          <div className="flex flex-wrap gap-2">
            {[...emotionTags, ...topicTags].map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedTags.includes(tag) ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                {tag}
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
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Journal" subtitle={language === "de" ? "Deine Gedanken, dein Raum" : "Your thoughts, your space"} />

      <div className="px-4 md:px-6 lg:px-8 py-4 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-6">
        {/* Weekly Recap Card */}
        {entries.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <CalmCard variant="calm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  {weeklyRecap ? (
                    <div className="space-y-3">
                      <h3 className="font-medium">{language === "de" ? "Dein Wochenrückblick" : "Your Weekly Recap"}</h3>
                      {weeklyRecap.patterns.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{language === "de" ? "Beobachtete Muster" : "Observed patterns"}</p>
                          <ul className="text-sm space-y-1">
                            {weeklyRecap.patterns.slice(0, 3).map((p, i) => <li key={i} className="text-muted-foreground">• {p}</li>)}
                          </ul>
                        </div>
                      )}
                      {weeklyRecap.suggested_next_step && (
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">{language === "de" ? "Vorschlag" : "Suggestion"}</p>
                          <p className="text-sm">{weeklyRecap.suggested_next_step}</p>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={handleGenerateWeeklyRecap} disabled={isLoadingRecap}>
                        {isLoadingRecap ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                        {language === "de" ? "Aktualisieren" : "Refresh"}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium mb-1">{language === "de" ? "Wochenrückblick" : "Weekly Recap"}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{language === "de" ? "Entdecke Muster in deinen Einträgen." : "Discover patterns in your entries."}</p>
                      <Button size="sm" onClick={handleGenerateWeeklyRecap} disabled={isLoadingRecap}>
                        {isLoadingRecap ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {language === "de" ? "Erstellen" : "Generate"}
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
            <Plus className="w-4 h-4" />{language === "de" ? "Freier Eintrag" : "Free Entry"}
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder={language === "de" ? "Suchen..." : "Search..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
            <Sparkles className="w-4 h-4 mr-2" />{language === "de" ? "Muster entdecken" : "Discover Patterns"}
          </Button>
        )}

        {/* Entries - grid on larger screens */}
        <div className="space-y-3 md:space-y-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">{language === "de" ? "Deine Einträge" : "Your entries"}</h2>

          {isLoading ? (
            <CalmCard variant="gentle" className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></CalmCard>
          ) : filteredEntries.length === 0 ? (
            <CalmCard variant="gentle" className="text-center py-8">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{searchQuery ? (language === "de" ? "Keine Einträge gefunden" : "No entries found") : (language === "de" ? "Beginne mit deinem ersten Eintrag" : "Start with your first entry")}</p>
            </CalmCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredEntries.map((entry, index) => (
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
              ))}
            </div>
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
            onSave={handleSaveEntry}
            onClose={() => { setIsEditorOpen(false); setSelectedEntry(null); setSelectedTags([]); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
