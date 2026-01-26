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
    <div className="absolute -bottom-2 -right-2">
      <Button
        variant="outline"
        size="icon-sm"
        className="h-8 w-8 rounded-full bg-background shadow-soft border-border/50 relative"
        onClick={handleClick}
        disabled={isLoading}
        aria-label={!isPremium 
          ? (language === "de" ? "Sprachausgabe – Plus" : "Voice playback – Plus")
          : isPlaying ? t("voice.stop") : t("voice.play")}
      >
        {isLoading ? (
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
        ) : isPlaying ? (
          <Pause className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        {!isPremium && (
          <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
