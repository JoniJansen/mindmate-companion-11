import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface VoiceAvatarProps {
  isSpeaking: boolean;
  avatarType?: "female" | "male";
  size?: "sm" | "md" | "lg";
}

export function VoiceAvatar({ isSpeaking, avatarType = "female", size = "md" }: VoiceAvatarProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const ringSize = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-36 h-36",
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing ring when speaking */}
      {isSpeaking && (
        <>
          <motion.div
            className={`absolute ${ringSize[size]} rounded-full bg-primary/20`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className={`absolute ${ringSize[size]} rounded-full bg-primary/10`}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
        </>
      )}

      {/* Avatar container */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg relative overflow-hidden`}
        animate={isSpeaking ? {
          scale: [1, 1.02, 1],
        } : {}}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Face representation */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Eyes */}
          <div className="absolute top-[35%] left-0 right-0 flex justify-center gap-3">
            <motion.div
              className="w-2 h-2 bg-primary-foreground rounded-full"
              animate={isSpeaking ? {
                scaleY: [1, 0.6, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-primary-foreground rounded-full"
              animate={isSpeaking ? {
                scaleY: [1, 0.6, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 2,
                delay: 0.1,
              }}
            />
          </div>

          {/* Mouth - animates when speaking */}
          <motion.div
            className="absolute top-[55%] w-4 h-1.5 bg-primary-foreground rounded-full"
            animate={isSpeaking ? {
              scaleY: [1, 2, 1, 1.5, 1],
              scaleX: [1, 0.8, 1, 0.9, 1],
            } : {
              scaleY: 1,
              scaleX: 1,
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Subtle glow overlay when speaking */}
          {isSpeaking && (
            <motion.div
              className="absolute inset-0 bg-primary-foreground/10 rounded-full"
              animate={{
                opacity: [0, 0.2, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          )}
        </div>

        {/* Sound indicator */}
        <div className="absolute bottom-1 right-1">
          {isSpeaking ? (
            <Volume2 className="w-3 h-3 text-primary-foreground/70" />
          ) : (
            <VolumeX className="w-3 h-3 text-primary-foreground/50" />
          )}
        </div>
      </motion.div>

      {/* Status text */}
      <motion.div
        className="absolute -bottom-6 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {isSpeaking ? "Spricht..." : "Bereit"}
      </motion.div>
    </div>
  );
}
