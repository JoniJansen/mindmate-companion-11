import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalmCard } from "@/components/shared/CalmCard";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { AIReflectionPanel } from "@/components/journal/AIReflectionPanel";
import { useSessionId } from "@/hooks/useSessionId";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  source: string | null;
  created_at: string;
}

const prompts = [
  "What small moment brought you peace today?",
  "What are you grateful for right now?",
  "What's been on your mind lately?",
  "How are you really feeling today?",
  "What would make tomorrow better?",
];

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiReflection, setAiReflection] = useState("");
  const [isReflecting, setIsReflecting] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const sessionId = useSessionId();
  const { toast } = useToast();

  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  // Load entries
  useEffect(() => {
    if (!sessionId) return;
    loadEntries();
  }, [sessionId]);

  // Check for saved chat content
  useEffect(() => {
    const savedContent = localStorage.getItem('journal_from_chat');
    if (savedContent && sessionId) {
      localStorage.removeItem('journal_from_chat');
      setEditingEntry({
        id: '',
        title: 'Chat Summary',
        content: savedContent,
        mood: null,
        source: 'chat',
        created_at: new Date().toISOString(),
      });
      setShowEditor(true);
    }
  }, [sessionId]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEntry = async (entry: { title: string; content: string; mood: string }) => {
    if (!sessionId) return;

    if (editingEntry?.id) {
      // Update existing
      const { error } = await supabase
        .from('journal_entries')
        .update({
          title: entry.title || null,
          content: entry.content,
          mood: entry.mood || null,
        })
        .eq('id', editingEntry.id);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_session_id: sessionId,
          title: entry.title || null,
          content: entry.content,
          mood: entry.mood || null,
          source: editingEntry?.source || 'manual',
        });

      if (error) throw error;
    }

    await loadEntries();
    setEditingEntry(null);
  };

  const handleGetPatterns = async () => {
    if (entries.length < 2) {
      toast({
        title: "Not enough entries",
        description: "Write at least 2 journal entries to see patterns.",
      });
      return;
    }

    setIsReflecting(true);
    setShowReflection(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-reflect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'patterns',
            entries: entries.slice(0, 10).map(e => ({
              date: e.created_at,
              title: e.title,
              content: e.content,
              mood: e.mood,
            })),
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiReflection(data.reflection);
    } catch (error) {
      console.error('Error getting patterns:', error);
      toast({
        title: "Error",
        description: "Failed to get AI reflection. Please try again.",
        variant: "destructive",
      });
      setShowReflection(false);
    } finally {
      setIsReflecting(false);
    }
  };

  const handleGetThemes = async () => {
    if (entries.length < 3) {
      toast({
        title: "Not enough entries",
        description: "Write at least 3 journal entries to see themes.",
      });
      return;
    }

    setIsReflecting(true);
    setShowReflection(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journal-reflect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'themes',
            entries: entries.slice(0, 15).map(e => ({
              title: e.title,
              content: e.content,
            })),
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiReflection(data.reflection);
    } catch (error) {
      console.error('Error getting themes:', error);
      toast({
        title: "Error",
        description: "Failed to get themes. Please try again.",
        variant: "destructive",
      });
      setShowReflection(false);
    } finally {
      setIsReflecting(false);
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Journal" subtitle="Your private space" />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant="calm" 
            className="flex-1 justify-start gap-3" 
            size="lg"
            onClick={() => {
              setEditingEntry(null);
              setShowEditor(true);
            }}
          >
            <Plus className="w-5 h-5" />
            New Entry
          </Button>
          
          {entries.length >= 2 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleGetPatterns}
              className="gap-2"
              disabled={isReflecting}
            >
              <Sparkles className="w-4 h-4" />
              Patterns
            </Button>
          )}
        </div>

        {/* AI Reflection */}
        <AnimatePresence>
          {showReflection && (
            <div className="mb-6">
              <AIReflectionPanel
                reflection={aiReflection}
                isLoading={isReflecting}
                onClose={() => setShowReflection(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CalmCard variant="gentle" className="text-center py-8">
              <p className="text-muted-foreground mb-2">No entries yet</p>
              <p className="text-sm text-muted-foreground">
                Start writing to capture your thoughts
              </p>
            </CalmCard>
          </motion.div>
        ) : (
          <>
            {/* Themes button for more entries */}
            {entries.length >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetThemes}
                  className="w-full justify-center gap-2 text-muted-foreground"
                  disabled={isReflecting}
                >
                  <TrendingUp className="w-4 h-4" />
                  Discover themes in your entries
                </Button>
              </motion.div>
            )}

            {/* Entries list */}
            <div className="space-y-3">
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
                  onClick={() => {
                    setEditingEntry(entry);
                    setShowEditor(true);
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Writing prompt */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <CalmCard variant="gentle">
              <h4 className="font-medium text-foreground mb-2">Today's Prompt</h4>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{randomPrompt}"
              </p>
            </CalmCard>
          </motion.div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <JournalEditor
            initialContent={editingEntry?.content}
            initialTitle={editingEntry?.title || ""}
            initialMood={editingEntry?.mood || ""}
            source={editingEntry?.source || undefined}
            onSave={handleSaveEntry}
            onClose={() => {
              setShowEditor(false);
              setEditingEntry(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
