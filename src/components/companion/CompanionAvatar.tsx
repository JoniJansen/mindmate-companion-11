import { motion } from "framer-motion";
import { User } from "lucide-react";
import { getArchetype } from "@/data/companions";

interface CompanionAvatarProps {
  avatarUrl?: string | null;
  archetype?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-28 h-28",
};

const iconSizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export function CompanionAvatar({ avatarUrl, archetype, name, size = "md", animate = true, className = "" }: CompanionAvatarProps) {
  const arch = archetype ? getArchetype(archetype) : undefined;
  const emoji = arch?.emoji || "🌿";

  const content = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name || "Companion"}
      className="w-full h-full object-cover rounded-full"
      loading="lazy"
    />
  ) : (
    <span className={`${size === "xl" ? "text-4xl" : size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm"}`}>
      {emoji}
    </span>
  );

  if (!animate) {
    return (
      <div className={`${sizeMap[size]} rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      className={`relative ${sizeMap[size]} rounded-full flex items-center justify-center overflow-hidden ${className}`}
      style={{ willChange: "transform, opacity" }}
    >
      {/* Breathing glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/8"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Inner circle */}
      <div className="relative z-10 w-full h-full rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
        {content}
      </div>
    </motion.div>
  );
}
