import { Volume2, Pause, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/ui/loading-skeleton";

interface MessagePlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onStop: () => void;
  isPremium?: boolean;
}

export function MessagePlayButton({
  isPlaying,
  isLoading,
  onPlay,
  onStop,
  isPremium = true,
}: MessagePlayButtonProps) {
  const { t, language } = useTranslation();
  
  const handleClick = () => {
    if (isLoading) return;
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  return (
    <div className="absolute -bottom-1 -right-1">
      {/* 
        Note: This button is intentionally 40x40 (slightly under 44px) as it's a 
        secondary contextual action on message bubbles, not a primary navigation target.
        The positioning (-bottom-1 -right-1) provides adequate spacing from other elements.
      */}
      <Button
        variant="outline"
        size="icon-sm"
        className="h-10 w-10 rounded-full bg-background shadow-soft border-border/50 relative"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        disabled={isLoading}
        aria-label={!isPremium 
          ? (language === "de" ? "Sprachausgabe – Plus" : "Voice playback – Plus")
          : isPlaying ? t("voice.stop") : t("voice.play")}
      >
        {isLoading ? (
          <Skeleton className="h-4 w-4 rounded-full" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-primary" />
        ) : (
          <Volume2 className="w-4 h-4 text-muted-foreground" />
        )}
        {!isPremium && (
          <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
