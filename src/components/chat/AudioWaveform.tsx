import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface AudioWaveformProps {
  isListening: boolean;
  barCount?: number;
  size?: "sm" | "md" | "lg";
}

export function AudioWaveform({ isListening, barCount = 5, size = "md" }: AudioWaveformProps) {
  const { t } = useTranslation();
  
  const sizeConfig = {
    sm: { height: 24, barWidth: 3, gap: 2, iconSize: 12 },
    md: { height: 32, barWidth: 4, gap: 3, iconSize: 16 },
    lg: { height: 48, barWidth: 6, gap: 4, iconSize: 20 },
  };

  const config = sizeConfig[size];
  const bars = Array.from({ length: barCount }, (_, i) => i);

  // Different animation patterns for each bar to create organic feel
  const getBarAnimation = (index: number) => {
    const patterns = [
      [0.3, 0.8, 0.5, 1, 0.4, 0.7, 0.3],
      [0.5, 1, 0.3, 0.8, 0.6, 0.4, 0.5],
      [0.4, 0.6, 1, 0.5, 0.8, 0.3, 0.4],
      [0.6, 0.4, 0.7, 1, 0.3, 0.9, 0.6],
      [0.3, 0.9, 0.4, 0.6, 1, 0.5, 0.3],
    ];
    return patterns[index % patterns.length];
  };

  const getBarDelay = (index: number) => {
    return index * 0.08;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Microphone icon with pulse */}
      <div className="relative">
        <motion.div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10"
          animate={isListening ? {
            scale: [1, 1.1, 1],
            backgroundColor: ["hsl(var(--primary) / 0.1)", "hsl(var(--primary) / 0.2)", "hsl(var(--primary) / 0.1)"],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Mic 
            className={`transition-colors duration-300 ${
              isListening ? "text-primary" : "text-muted-foreground"
            }`}
            style={{ width: config.iconSize, height: config.iconSize }}
          />
        </motion.div>
        
        {/* Active recording indicator dot */}
        {isListening && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        )}
      </div>

      {/* Waveform bars */}
      <div 
        className="flex items-center justify-center"
        style={{ 
          height: config.height,
          gap: config.gap,
        }}
      >
        {bars.map((index) => (
          <motion.div
            key={index}
            className="rounded-full bg-primary"
            style={{
              width: config.barWidth,
            }}
            initial={{ height: config.height * 0.2 }}
            animate={isListening ? {
              height: getBarAnimation(index).map(h => config.height * h),
            } : {
              height: config.height * 0.2,
            }}
            transition={isListening ? {
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: getBarDelay(index),
            } : {
              duration: 0.3,
            }}
          />
        ))}
      </div>

      {/* Status label */}
      <motion.span
        className="text-xs font-medium ml-1"
        animate={{
          color: isListening ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        }}
      >
        {isListening ? t("voice.listening") : t("voice.tapToSpeak")}
      </motion.span>
    </div>
  );
}
