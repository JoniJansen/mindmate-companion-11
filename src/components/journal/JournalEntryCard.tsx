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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <CalmCard 
        variant="elevated" 
        className="cursor-pointer hover:shadow-elevated transition-shadow"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {/* Mood emoji or chat icon */}
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
            {isFromChat ? (
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            ) : (
              mood || "📝"
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">
                {title || (language === "de" ? "Ohne Titel" : "Untitled Entry")}
              </h3>
              {isFromChat && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {language === "de" ? "aus Chat" : "from chat"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {preview}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(createdAt, language as "en" | "de")}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CalmCard>
    </motion.div>
  );
}
