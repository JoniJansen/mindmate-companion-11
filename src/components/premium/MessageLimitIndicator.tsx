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
  const { t } = useTranslation();

  // Don't show for premium users
  if (isPremium) return null;

  const messagesUsed = dailyLimit - messagesRemaining;
  const isLow = messagesRemaining <= 3;
  const isEmpty = messagesRemaining <= 0;

  const getMessage = () => {
    if (isEmpty) {
      return t("messageLimit.dailyReached");
    }
    // Always show usage counter for transparency (same text for low + normal)
    return `${messagesUsed}${t("messageLimit.ofSep")}${dailyLimit}${t("messageLimit.messagesTodaySuffix")}`;
  };

  return (
    <div 
      className={`text-center py-1.5 px-4 border-b border-border/30 ${
        isEmpty 
          ? "text-muted-foreground bg-muted/30" 
          : isLow 
            ? "text-amber-700/70 dark:text-amber-400/70" 
            : "text-muted-foreground/70"
      }`}
    >
      <p className="text-[11px] font-medium">{getMessage()}</p>
    </div>
  );
}
