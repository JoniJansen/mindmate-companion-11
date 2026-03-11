import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getArchetype } from "@/data/companions";
import { getAnimationTuning } from "@/data/companionAnimationConfig";
import type { CompanionVisualState } from "@/hooks/useCompanionVisualState";

interface CompanionAvatarAnimatedProps {
  archetype?: string;
  avatarUrl?: string | null;
  name?: string;
  state?: CompanionVisualState;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showPresenceDot?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-9 h-9", glow: "w-14 h-14", ring: "w-12 h-12", dot: "w-2.5 h-2.5" },
  md: { container: "w-12 h-12", glow: "w-20 h-20", ring: "w-16 h-16", dot: "w-3 h-3" },
  lg: { container: "w-20 h-20", glow: "w-28 h-28", ring: "w-24 h-24", dot: "w-3.5 h-3.5" },
  xl: { container: "w-28 h-28", glow: "w-40 h-40", ring: "w-36 h-36", dot: "w-4 h-4" },
  "2xl": { container: "w-44 h-44", glow: "w-60 h-60", ring: "w-52 h-52", dot: "w-4 h-4" },
};

/**
 * Premium animated companion avatar.
 * State-driven: idle, listening, thinking, speaking, success.
 * Per-character tuning via companionAnimationConfig.
 * GPU-accelerated, memoized for chat performance.
 */
export const CompanionAvatarAnimated = memo(function CompanionAvatarAnimated({
  archetype,
  avatarUrl,
  name,
  state = "idle",
  size = "md",
  showPresenceDot = false,
  className = "",
}: CompanionAvatarAnimatedProps) {
  const arch = archetype ? getArchetype(archetype) : undefined;
  const tuning = useMemo(() => getAnimationTuning(archetype || ""), [archetype]);
  const sizes = sizeMap[size];
  const imgSrc = avatarUrl || arch?.defaultAvatar;

  // --- State-dependent animation values ---
  const breathScale = useMemo(() => {
    switch (state) {
      case "listening": return [1, 1.025, 1];
      case "thinking": return [1, 1.015, 1];
      case "speaking": return [1, 1.03, 1];
      case "success": return [1, 1.04, 1, 1.02, 1];
      default: return [1, 1.02, 1]; // idle
    }
  }, [state]);

  const breathDuration = useMemo(() => {
    switch (state) {
      case "listening": return tuning.breathDuration * 0.8;
      case "thinking": return tuning.breathDuration * 1.3;
      case "speaking": return tuning.breathDuration * 0.5;
      case "success": return 1.8;
      default: return tuning.breathDuration;
    }
  }, [state, tuning.breathDuration]);

  const glowOpacity = useMemo(() => {
    const base = tuning.glowIntensity;
    switch (state) {
      case "listening": return [base, base + 0.15, base];
      case "thinking": return [base * 0.8, base + 0.1, base * 0.8];
      case "speaking": return [base, base + 0.25, base];
      case "success": return [base, base + 0.35, base + 0.1, base];
      default: return [base * 0.6, base, base * 0.6];
    }
  }, [state, tuning.glowIntensity]);

  const glowScale = useMemo(() => {
    switch (state) {
      case "listening": return [1, 1.15, 1];
      case "thinking": return [1, 1.08, 1];
      case "speaking": return [1, 1.2, 1];
      case "success": return [1, 1.3, 1.1, 1];
      default: return [1, 1.1, 1];
    }
  }, [state]);

  const ringBorderOpacity = useMemo(() => {
    switch (state) {
      case "listening": return 0.4;
      case "thinking": return 0.25;
      case "speaking": return 0.5;
      case "success": return 0.6;
      default: return 0.15;
    }
  }, [state]);

  // Presence dot color
  const dotColor = useMemo(() => {
    switch (state) {
      case "listening": return "bg-blue-400";
      case "thinking": return "bg-amber-400";
      case "speaking": return "bg-emerald-400";
      case "success": return "bg-emerald-400";
      default: return "bg-emerald-400";
    }
  }, [state]);

  const isSmall = size === "sm";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Ambient glow — skip on sm for perf */}
      {!isSmall && (
        <motion.div
          className={`absolute ${sizes.glow} rounded-full`}
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
            willChange: "transform, opacity",
          }}
          animate={{
            scale: glowScale,
            opacity: glowOpacity,
          }}
          transition={{
            duration: state === "success" ? 1.8 : tuning.glowPulseDuration,
            repeat: state === "success" ? 0 : Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Float + Breathe wrapper */}
      <motion.div
        className="relative"
        style={{ willChange: "transform" }}
        animate={{
          y: isSmall ? 0 : [0, -tuning.floatAmplitude, 0],
        }}
        transition={{
          duration: tuning.floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Breathing scale on the portrait */}
        <motion.div
          style={{ willChange: "transform" }}
          animate={{ scale: breathScale }}
          transition={{
            duration: breathDuration,
            repeat: state === "success" ? 0 : Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Ring border — intensity varies by state */}
          <div
            className={`${sizes.container} rounded-full overflow-hidden flex items-center justify-center`}
            style={{
              boxShadow: `0 0 0 ${isSmall ? "1.5px" : "2px"} hsl(var(--primary) / ${ringBorderOpacity})`,
              transition: "box-shadow 0.6s ease",
            }}
          >
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={name || "Companion"}
                className="w-full h-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                <span className={size === "xl" ? "text-4xl" : size === "lg" ? "text-2xl" : "text-lg"}>
                  {arch?.emoji || "🌿"}
                </span>
              </div>
            )}
          </div>

          {/* Speaking rhythm indicator — subtle ring pulse */}
          <AnimatePresence>
            {state === "speaking" && !isSmall && (
              <motion.div
                className={`absolute inset-0 rounded-full border-2 border-primary/30`}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                style={{ willChange: "transform, opacity" }}
              />
            )}
          </AnimatePresence>

          {/* Listening soft highlight ring */}
          <AnimatePresence>
            {state === "listening" && !isSmall && (
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.15, 0],
                  scale: [1, 1.08, 1],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 60%, transparent 100%)",
                  willChange: "transform, opacity",
                }}
              />
            )}
          </AnimatePresence>

          {/* Success warmth pulse — one-shot */}
          <AnimatePresence>
            {state === "success" && !isSmall && (
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{
                  background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
                  willChange: "transform, opacity",
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Presence dot */}
      {showPresenceDot && (
        <motion.div
          className={`absolute -bottom-0.5 -right-0.5 ${sizes.dot} rounded-full ${dotColor} border-2 border-background z-10`}
          animate={state !== "idle" ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
});
