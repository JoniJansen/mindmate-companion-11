import { memo, useEffect, useRef, forwardRef } from "react";
import { motion } from "framer-motion";

interface VoiceWaveformProps {
  /** 0–1 normalized volume level */
  level: number;
  /** Number of bars */
  barCount?: number;
  /** Color class for bars */
  colorClass?: string;
  /** Whether the waveform is active */
  active?: boolean;
}

/**
 * Smooth waveform visualizer driven by real-time audio levels.
 * Each bar oscillates with slight phase offsets for an organic feel.
 */
export const VoiceWaveform = memo(forwardRef<HTMLDivElement, VoiceWaveformProps>(function VoiceWaveform({
  level,
  barCount = 5,
  colorClass = "bg-primary/60",
  active = true,
}, ref) {
  // Smooth the level to avoid jitter
  const smoothedRef = useRef(0);
  const displayLevel = active ? level : 0;

  useEffect(() => {
    smoothedRef.current = smoothedRef.current * 0.6 + displayLevel * 0.4;
  }, [displayLevel]);

  const clamped = Math.min(1, Math.max(0, displayLevel));

  return (
    <div ref={ref} className="flex items-center justify-center gap-[3px] h-8">
      {Array.from({ length: barCount }).map((_, i) => {
        const phase = (i - Math.floor(barCount / 2)) / barCount;
        const offset = Math.abs(phase);
        const minH = 6;
        const maxH = 28;
        const variation = 1 - offset * 0.5;
        const h = minH + (maxH - minH) * clamped * variation;

        return (
          <motion.div
            key={i}
            className={`w-[3px] rounded-full ${colorClass}`}
            animate={{
              height: active ? h : minH,
              opacity: active ? 0.5 + clamped * 0.5 : 0.25,
            }}
            transition={{
              height: { type: "spring", stiffness: 300, damping: 20, mass: 0.5 },
              opacity: { duration: 0.15 },
            }}
          />
        );
      })}
    </div>
  );
}));