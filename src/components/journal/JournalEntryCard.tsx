import { motion } from "framer-motion";
import { Calendar, Lock, ChevronRight, MessageSquare } from "lucide-react";
import { CalmCard } from "@/components/shared/CalmCard";
import { useTranslation } from "@/hooks/useTranslation";

interface JournalEntryCardProps {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  source: string | null;
  createdAt: string;
  onClick: () => void;
  index: number;
}

const formatDate = (dateString: string, language: "en" | "de" = "en") => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return language === "de" ? "Heute" : "Today";
  if (date.toDateString() === yesterday.toDateString()) return language === "de" ? "Gestern" : "Yesterday";
  return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", { month: "short", day: "numeric" });
};

export function JournalEntryCard({ 
  title, 
  content, 
  mood, 
  source,
  createdAt, 
  onClick, 
  index 
}: JournalEntryCardProps) {
  const { language } = useTranslation();
  const isFromChat = source === 'chat';
  const preview = content.length > 100 ? content.substring(0, 100) + "..." : content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: "easeOut" }}
    >
      <CalmCard 
        variant="elevated" 
        className="cursor-pointer hover:shadow-elevated transition-all duration-200"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {/* Mood emoji or chat icon */}
          <div className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center text-lg shrink-0 border border-border/30">
            {isFromChat ? (
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            ) : (
              mood || "📝"
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate leading-tight">
                {title || (language === "de" ? "Ohne Titel" : "Untitled Entry")}
              </h3>
              {isFromChat && (
                <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {language === "de" ? "Chat" : "Chat"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
              {preview}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{formatDate(createdAt, language as "en" | "de")}</span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-1" />
        </div>
      </CalmCard>
    </motion.div>
  );
}
