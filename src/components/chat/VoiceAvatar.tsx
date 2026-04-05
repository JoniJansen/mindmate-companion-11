import { motion } from "framer-motion";
import { Volume2, Headphones, Mic } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export type AvatarStyle = "orb" | "wave" | "face";

interface VoiceAvatarProps {
  isSpeaking: boolean;
  isListening?: boolean;
  avatarStyle?: AvatarStyle;
  size?: "sm" | "md" | "lg";
  onTap?: () => void;
}

export function VoiceAvatar({ 
  isSpeaking, 
  isListening = false,
  avatarStyle = "orb", 
  size = "md",
  onTap
}: VoiceAvatarProps) {
  const { language } = useTranslation();
  
  const sizeConfig = {
    sm: { container: "w-16 h-16 sm:w-20 sm:h-20", ring: "w-20 h-20 sm:w-24 sm:h-24", icon: "w-6 h-6 sm:w-8 sm:h-8", bars: 3 },
    md: { container: "w-24 h-24 sm:w-28 sm:h-28", ring: "w-32 h-32 sm:w-36 sm:h-36", icon: "w-9 h-9 sm:w-10 sm:h-10", bars: 5 },
    lg: { container: "w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36", ring: "w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44", icon: "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12", bars: 7 },
  };

  const config = sizeConfig[size];
  const isActive = isSpeaking || isListening;

  // Status text
  const getStatusText = () => {
    if (isSpeaking) return language === "de" ? "Soulvay spricht..." : "Soulvay speaking...";
    if (isListening) return language === "de" ? "Ich höre zu..." : "Listening...";
    return language === "de" ? "Tippe zum Sprechen" : "Tap to speak";
  };

  // Orb style - Modern glowing orb like Siri
  const OrbAvatar = () => (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {isActive && (
        <>
          <motion.div
            className={`absolute ${config.ring} rounded-full`}
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className={`absolute ${config.ring} rounded-full`}
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />
        </>
      )}

      {/* Main orb */}
      <motion.div
        className={`${config.container} rounded-full relative overflow-hidden shadow-2xl`}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.9) 0%, hsl(var(--primary)) 50%, hsl(var(--primary) / 0.8) 100%)
          `,
          boxShadow: isActive 
            ? "0 0 60px hsl(var(--primary) / 0.5), 0 0 100px hsl(var(--primary) / 0.3), inset 0 0 30px hsl(var(--primary-foreground) / 0.1)"
            : "0 0 30px hsl(var(--primary) / 0.3), inset 0 0 20px hsl(var(--primary-foreground) / 0.05)",
        }}
        animate={isActive ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 25%, hsl(var(--primary-foreground) / 0.25) 0%, transparent 50%)",
          }}
        />
        
        {/* Sound waves inside orb when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[...Array(config.bars)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary-foreground/60 rounded-full"
                animate={{
                  height: ["12%", `${30 + Math.random() * 40}%`, "12%"],
                }}
                transition={{
                  duration: 0.4 + Math.random() * 0.3,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Listening indicator */}
        {isListening && !isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mic className={`${config.icon} text-primary-foreground/80`} />
          </div>
        )}

        {/* Idle state icon */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Headphones className={`${config.icon} text-primary-foreground/60`} />
          </div>
        )}
      </motion.div>
    </div>
  );

  // Wave style - Audio waveform visualization
  const WaveAvatar = () => (
    <div className="relative flex items-center justify-center">
      {/* Background circle */}
      <motion.div
        className={`${config.container} rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center`}
        animate={isActive ? {
          borderColor: ["hsl(var(--primary) / 0.3)", "hsl(var(--primary) / 0.6)", "hsl(var(--primary) / 0.3)"],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      >
        {/* Wave bars */}
        <div className="flex items-center justify-center gap-1 h-1/2">
          {[...Array(config.bars)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-primary rounded-full"
              animate={isActive ? {
                height: ["20%", `${50 + Math.random() * 50}%`, "20%"],
              } : {
                height: "20%",
              }}
              transition={{
                duration: 0.3 + Math.random() * 0.4,
                repeat: Infinity,
                delay: i * 0.08,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Outer pulse */}
      {isActive && (
        <motion.div
          className={`absolute ${config.ring} rounded-full border-2 border-primary/40`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
    </div>
  );

  // Face style - Friendly animated face (improved)
  const FaceAvatar = () => (
    <div className="relative flex items-center justify-center">
      {/* Glow effect */}
      {isActive && (
        <motion.div
          className={`absolute ${config.ring} rounded-full bg-primary/20 blur-xl`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}

      {/* Face container */}
      <motion.div
        className={`${config.container} rounded-full relative overflow-hidden`}
        style={{
          background: "linear-gradient(145deg, #FFE5B4 0%, #FFDAB3 50%, #F5C6A5 100%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 -4px 12px rgba(0,0,0,0.1)",
        }}
        animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        {/* Blush */}
        <div className="absolute top-[45%] left-[15%] w-[18%] h-[12%] rounded-full bg-pink-300/40" />
        <div className="absolute top-[45%] right-[15%] w-[18%] h-[12%] rounded-full bg-pink-300/40" />

        {/* Eyes */}
        <div className="absolute top-[32%] left-0 right-0 flex justify-center gap-[22%]">
          <motion.div
            className="w-[10%] h-[10%] bg-[#3D2314] rounded-full relative"
            animate={isSpeaking ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2.5 }}
          >
            {/* Eye highlight */}
            <div className="absolute top-[15%] left-[20%] w-[35%] h-[35%] bg-white rounded-full" />
          </motion.div>
          <motion.div
            className="w-[10%] h-[10%] bg-[#3D2314] rounded-full relative"
            animate={isSpeaking ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2.5, delay: 0.05 }}
          >
            <div className="absolute top-[15%] left-[20%] w-[35%] h-[35%] bg-white rounded-full" />
          </motion.div>
        </div>

        {/* Eyebrows */}
        <div className="absolute top-[24%] left-0 right-0 flex justify-center gap-[20%]">
          <div className="w-[12%] h-[3%] bg-[#5D4037] rounded-full transform -rotate-6" />
          <div className="w-[12%] h-[3%] bg-[#5D4037] rounded-full transform rotate-6" />
        </div>

        {/* Nose */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[6%] h-[8%] bg-[#E8B89D] rounded-full" />

        {/* Mouth */}
        <motion.div
          className="absolute top-[62%] left-1/2 -translate-x-1/2 bg-[#C0392B] rounded-full overflow-hidden"
          style={{
            width: isSpeaking ? "18%" : "22%",
            height: isSpeaking ? "12%" : "6%",
          }}
          animate={isSpeaking ? {
            height: ["10%", "16%", "8%", "14%", "10%"],
            width: ["16%", "14%", "18%", "15%", "16%"],
          } : {}}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          {/* Teeth */}
          {isSpeaking && (
            <div className="absolute top-0 left-0 right-0 h-[30%] bg-white" />
          )}
        </motion.div>
      </motion.div>
    </div>
  );

  const renderAvatar = () => {
    switch (avatarStyle) {
      case "wave": return <WaveAvatar />;
      case "face": return <FaceAvatar />;
      case "orb":
      default: return <OrbAvatar />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Make avatar tappable - min 44px touch target */}
      <button 
        onClick={onTap}
        className="min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-full transition-all duration-150"
        aria-label={getStatusText()}
      >
        {renderAvatar()}
      </button>
      
      {/* Status indicator - also tappable, stable display */}
      <button
        onClick={onTap}
        className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-muted/50 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {isSpeaking && (
          <Volume2 className="w-4 h-4 text-primary animate-pulse-gentle" />
        )}
        {isListening && !isSpeaking && (
          <Mic className="w-4 h-4 text-primary animate-pulse-gentle" />
        )}
        <span className="text-sm text-muted-foreground font-medium">
          {getStatusText()}
        </span>
      </button>
    </div>
  );
}