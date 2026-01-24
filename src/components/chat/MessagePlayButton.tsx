import { motion } from "framer-motion";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessagePlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function MessagePlayButton({
  isPlaying,
  isLoading,
  onPlay,
  onStop,
}: MessagePlayButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute -bottom-2 -right-2"
    >
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-full bg-background shadow-soft border-border/50"
        onClick={isPlaying ? onStop : onPlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        ) : isPlaying ? (
          <VolumeX className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </Button>
    </motion.div>
  );
}
