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
      // Trust layer: gentle, not alarming
      return language === "de" 
        ? "Dein Tageslimit ist erreicht" 
        : "You've reached today's limit";
    }
    if (isLow) {
      return language === "de"
        ? `Noch ${messagesRemaining} ${messagesRemaining === 1 ? "Nachricht" : "Nachrichten"} heute`
        : `${messagesRemaining} ${messagesRemaining === 1 ? "message" : "messages"} left today`;
    }
    return language === "de"
      ? `${messagesRemaining} Nachrichten übrig`
      : `${messagesRemaining} messages left`;
  };

  return (
    <div 
      className={`text-center py-2 px-4 ${
        isEmpty 
          ? "text-muted-foreground bg-muted/30" 
          : isLow 
            ? "text-amber-700/70 dark:text-amber-400/70" 
            : "text-muted-foreground"
      }`}
    >
      <p className="text-xs font-medium">{getMessage()}</p>
    </div>
  );
}
