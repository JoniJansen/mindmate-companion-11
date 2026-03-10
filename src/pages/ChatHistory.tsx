import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MessageCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useChatPersistence } from "@/hooks/useChatPersistence";

interface Conversation {
  id: string;
  title: string | null;
  chat_mode: string;
  created_at: string;
  updated_at: string;
}

export default function ChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { loadRecentConversations, deleteConversation } = useChatPersistence();

  useEffect(() => {
    loadRecentConversations(50).then((data) => {
      setConversations(data);
      setIsLoading(false);
    });
  }, [loadRecentConversations]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  const handleOpen = (id: string) => {
    navigate("/chat", { state: { conversationId: id } });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return language === "de" ? "Heute" : "Today";
    if (diffDays === 1) return language === "de" ? "Gestern" : "Yesterday";
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const modeLabels: Record<string, { en: string; de: string }> = {
    talk: { en: "Talk", de: "Freireden" },
    clarify: { en: "Clarify", de: "Klären" },
    calm: { en: "Calm", de: "Beruhigen" },
    patterns: { en: "Patterns", de: "Muster" },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {language === "de" ? "Gesprächsverlauf" : "Conversation History"}
          </h1>
        </div>
      </div>

      <div className="px-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              {language === "de"
                ? "Deine Gespräche erscheinen hier, sobald du mit Soulvay chattest."
                : "Your conversations will appear here once you start chatting with Soulvay."}
            </p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate("/chat")}>
              {language === "de" ? "Gespräch starten" : "Start a conversation"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {conversations.map((conv, i) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleOpen(conv.id)}
                  className="w-full text-left rounded-2xl p-4 border bg-card border-border/30 hover:border-primary/20 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {conv.title || (language === "de" ? "Gespräch" : "Conversation")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conv.updated_at)}
                        </span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-primary/70">
                          {modeLabels[conv.chat_mode]?.[language] || conv.chat_mode}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(conv.id, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
