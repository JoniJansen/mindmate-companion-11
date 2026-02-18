import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Calendar, MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RecentThought {
  id: string;
  content: string;
  mood: string | null;
  created_at: string;
  source: string | null;
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recentThoughts, setRecentThoughts] = useState<RecentThought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const speechLang = language === "de" ? "de-DE" : "en-US";
  
  const { 
    isListening, 
    fullTranscript, 
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(speechLang, { continuous: true });

  // Load recent thoughts
  useEffect(() => {
    if (!user) return;
    
    const loadRecentThoughts = async () => {
      try {
        const { data } = await supabase
          .from('journal_entries')
          .select('id, content, mood, created_at, source')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        
        setRecentThoughts(data || []);
      } catch (error) {
        console.error('Error loading recent thoughts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecentThoughts();
  }, [user]);

  // Update input from speech
  useEffect(() => {
    if (fullTranscript) {
      setInputValue(fullTranscript);
    }
  }, [fullTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsRecording(false);
    } else {
      resetTranscript();
      startListening();
      setIsRecording(true);
    }
  };

  const handleSaveThought = async () => {
    if (!inputValue.trim() || !user) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          user_session_id: user.id, // Legacy field for compatibility
          content: inputValue.trim(),
          source: 'voice-dump',
        });
      
      if (error) throw error;
      
      toast({
        title: language === "de" ? "Gedanke gespeichert" : "Thought saved",
        description: language === "de" ? "Dein Gedanke wurde in der Timeline gespeichert." : "Your thought has been saved to the timeline.",
      });
      
      setInputValue("");
      resetTranscript();
      
      // Reload recent thoughts
      const { data } = await supabase
        .from('journal_entries')
        .select('id, content, mood, created_at, source')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setRecentThoughts(data || []);
    } catch (error) {
      console.error('Error saving thought:', error);
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: language === "de" ? "Konnte nicht gespeichert werden." : "Could not save thought.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTalkToSoulvay = () => {
    if (inputValue.trim()) {
      // Pass the thought to chat
      localStorage.setItem('mindmate-initial-message', inputValue.trim());
    }
    navigate("/chat");
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (language === "de") {
      if (diffMins < 1) return "Gerade eben";
      if (diffMins < 60) return `vor ${diffMins} Min`;
      if (diffHours < 24) return `vor ${diffHours} Std`;
      if (diffDays === 1) return "Gestern";
      return `vor ${diffDays} Tagen`;
    } else {
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    }
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (language === "de") {
      if (hour < 12) return "Guten Morgen";
      if (hour < 18) return "Guten Tag";
      return "Guten Abend";
    } else {
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 safe-top">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-foreground"
        >
          {greeting()}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1"
        >
          {language === "de" ? "Wie geht es dir?" : "How are you?"}
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-6">
        {/* Voice/Text Input Area - THE PRIMARY FEATURE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-card rounded-3xl border border-border/50 shadow-card overflow-hidden">
            {/* Recording Indicator */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-primary/5 border-b border-border/30 px-4 py-3 flex items-center gap-3"
                >
                  <motion.div
                    className="w-3 h-3 rounded-full bg-destructive"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {language === "de" ? "Ich höre zu..." : "Listening..."}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Text Area */}
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={language === "de" 
                  ? "Was geht dir durch den Kopf? Schreib oder sprich einfach drauf los..." 
                  : "What's on your mind? Just type or talk..."}
                className="w-full bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[100px] text-base leading-relaxed"
                rows={3}
              />
            </div>
            
            {/* Actions */}
            <div className="px-4 pb-4 flex items-center justify-between">
              {/* Voice Button */}
              {isSpeechSupported && (
                <Button
                  variant={isRecording ? "default" : "ghost"}
                  size="icon"
                  onClick={handleVoiceToggle}
                  className={`rounded-full w-12 h-12 ${isRecording ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              )}
              
              <div className="flex gap-2">
                {/* Save to Timeline */}
                <Button
                  variant="outline"
                  onClick={handleSaveThought}
                  disabled={!inputValue.trim() || isSaving}
                  className="rounded-xl"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {language === "de" ? "Speichern" : "Save"}
                </Button>
                
                {/* Talk to Soulvay */}
                <Button
                  onClick={handleTalkToSoulvay}
                  className="rounded-xl gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {language === "de" ? "Reden" : "Talk"}
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            {language === "de" 
              ? "Lade deine Gedanken ab. Kein Ziel nötig." 
              : "Unload your thoughts. No goal needed."}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <Button
            variant="outline"
            className="h-auto py-4 px-4 rounded-2xl flex flex-col items-start gap-1 bg-card border-border/50"
            onClick={() => navigate("/chat")}
          >
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">
              {language === "de" ? "Mit mir reden" : "Talk to me"}
            </span>
            <span className="text-xs text-muted-foreground">
              {language === "de" ? "Innerer Dialog" : "Inner dialogue"}
            </span>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto py-4 px-4 rounded-2xl flex flex-col items-start gap-1 bg-card border-border/50"
            onClick={() => navigate("/timeline")}
          >
            <Calendar className="w-5 h-5 text-calm" />
            <span className="font-medium text-foreground">
              {language === "de" ? "Meine Timeline" : "My Timeline"}
            </span>
            <span className="text-xs text-muted-foreground">
              {language === "de" ? "Gedanken & Muster" : "Thoughts & patterns"}
            </span>
          </Button>
        </motion.div>

        {/* Recent Thoughts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {language === "de" ? "Letzte Gedanken" : "Recent thoughts"}
            </h2>
            {recentThoughts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-auto py-1"
                onClick={() => navigate("/timeline")}
              >
                {language === "de" ? "Alle" : "All"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentThoughts.length === 0 ? (
            <div className="bg-muted/30 rounded-2xl p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {language === "de" 
                  ? "Noch keine Gedanken. Lade einfach ab, was dir durch den Kopf geht." 
                  : "No thoughts yet. Just unload what's on your mind."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentThoughts.map((thought, index) => (
                <motion.button
                  key={thought.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => navigate("/timeline")}
                  className="w-full text-left bg-card rounded-xl p-4 border border-border/30 hover:border-border/60 transition-colors"
                >
                  <p className="text-sm text-foreground line-clamp-2">
                    {truncateText(thought.content)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(thought.created_at)}
                    </span>
                    {thought.mood && (
                      <span className="text-xs">{thought.mood}</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Safe Area */}
      <div className="pb-6 safe-bottom" />
    </div>
  );
}
