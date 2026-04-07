import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getArchetype } from "@/data/companions";
import { resolveLocalAssetUrl } from "@/hooks/useAvatarUrl";

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

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
  xl: "text-2xl",
};

function getInitials(name?: string): string {
  if (!name) return "S";
  return name.charAt(0).toUpperCase();
}

export function CompanionAvatar({ avatarUrl, archetype, name, size = "md", animate = true, className = "" }: CompanionAvatarProps) {
  const arch = archetype ? getArchetype(archetype) : undefined;
  const rawSrc = avatarUrl || arch?.defaultAvatar;
  const imgSrc = rawSrc ? resolveLocalAssetUrl(rawSrc) : undefined;
  const [imgError, setImgError] = useState(false);

  // Reset imgError when image source changes
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl, archetype]);
  const showImage = imgSrc && !imgError;

  const content = showImage ? (
    <img
      src={imgSrc}
      alt={name || "Companion"}
      className="w-full h-full object-cover rounded-full"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  ) : (
    <span className={`${textSizeMap[size]} font-semibold text-primary`}>
      {getInitials(name || arch?.name)}
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
