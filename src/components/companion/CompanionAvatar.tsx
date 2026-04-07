import { motion } from "framer-motion";
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

export function CompanionAvatar({ avatarUrl, archetype, name, size = "md", animate = true, className = "" }: CompanionAvatarProps) {
  const arch = archetype ? getArchetype(archetype) : undefined;
  
  // Use custom avatar, or fall back to default archetype avatar
  const imgSrc = avatarUrl || arch?.defaultAvatar;

  const content = imgSrc ? (
    <img
      src={imgSrc}
      alt={name || "Companion"}
      className="w-full h-full object-cover rounded-full"
      loading="lazy"
    />
  ) : (
    <span className={`${size === "xl" ? "text-4xl" : size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm"}`}>
      {arch?.emoji || "🌿"}
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
      {/* Subtle breathing glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/6"
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
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
