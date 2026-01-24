import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface MessageLimitIndicatorProps {
  messagesRemaining: number;
  dailyLimit: number;
  isPremium: boolean;
}

export function MessageLimitIndicator({ 
  messagesRemaining, 
  dailyLimit, 
  isPremium 
}: MessageLimitIndicatorProps) {
  const { language } = useTranslation();

  // Don't show for premium users
  if (isPremium) return null;

  // Don't show if plenty of messages remaining (more than half)
  if (messagesRemaining > dailyLimit / 2) return null;

  const isLow = messagesRemaining <= 3;
  const isEmpty = messagesRemaining <= 0;

  const getMessage = () => {
    if (isEmpty) {
      return language === "de" 
        ? "Keine Nachrichten mehr heute" 
        : "No messages left today";
    }
    if (isLow) {
      return language === "de"
        ? `Noch ${messagesRemaining} ${messagesRemaining === 1 ? "Antwort" : "Antworten"} heute`
        : `${messagesRemaining} ${messagesRemaining === 1 ? "response" : "responses"} left today`;
    }
    return language === "de"
      ? `${messagesRemaining} Antworten übrig`
      : `${messagesRemaining} responses left`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`text-center py-1.5 ${isEmpty ? "text-destructive/70" : isLow ? "text-amber-600/70" : "text-muted-foreground"}`}
    >
      <p className="text-xs">{getMessage()}</p>
    </motion.div>
  );
}
