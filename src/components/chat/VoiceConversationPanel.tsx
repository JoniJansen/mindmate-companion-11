import { memo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2 } from "lucide-react";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { useCompanionVisualState, type CompanionVisualState } from "@/hooks/useCompanionVisualState";
import { useTranslation } from "@/hooks/useTranslation";
import { getCompanionVoiceProfile } from "@/data/companionVoiceProfiles";
import type { CompanionProfile } from "@/hooks/useCompanion";

interface VoiceConversationPanelProps {
  companion: CompanionProfile;
  avatarUrl?: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isStreamingActive: boolean;
  liveTranscript: string;
  lastAssistantMessage: string;
  onToggleRecording: () => void;
  onClose: () => void;
}

/**
 * Premium full-screen voice conversation panel.
 * Shows the companion's animated portrait with state-driven visuals.
 * Minimalist, cinematic, intimate.
 */
export const VoiceConversationPanel = memo(function VoiceConversationPanel({
  companion,
  avatarUrl,
  isListening,
  isSpeaking,
  isThinking,
  isStreamingActive,
  liveTranscript,
  lastAssistantMessage,
  onToggleRecording,
  onClose,
}: VoiceConversationPanelProps) {
  const { language } = useTranslation();
  const voiceProfile = getCompanionVoiceProfile(companion.archetype);

  const visualState = useCompanionVisualState({
    isListening,
    isThinking: isThinking || isStreamingActive,
    isSpeaking,
  });

  // Status text
  const getStatusText = (): string => {
    switch (visualState) {
      case "listening":
        return language === "de" ? "Ich höre dir zu…" : "I'm listening…";
      case "thinking":
        return language === "de" ? `${companion.name} denkt nach…` : `${companion.name} is reflecting…`;
      case "speaking":
        return language === "de" ? `${companion.name} spricht…` : `${companion.name} is speaking…`;
      default:
        return language === "de" ? "Tippe auf das Mikrofon" : "Tap the microphone";
    }
  };

  // Truncate transcript for display
  const displayTranscript = liveTranscript.length > 200
    ? "…" + liveTranscript.slice(-200)
    : liveTranscript;

  // Truncate last response for subtitle display
  const displayResponse = lastAssistantMessage.length > 300
    ? lastAssistantMessage.slice(0, 300) + "…"
    : lastAssistantMessage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
      style={{ willChange: "opacity" }}
    >
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.06) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Close button */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center transition-colors hover:bg-muted"
          aria-label={language === "de" ? "Schließen" : "Close"}
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
          {language === "de" ? "Sprachmodus" : "Voice mode"}
        </span>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main content — centered companion */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-8">
        {/* Companion Avatar — large, animated */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <CompanionAvatarAnimated
            archetype={companion.archetype}
            avatarUrl={avatarUrl}
            name={companion.name}
            state={visualState}
            size="xl"
          />
        </motion.div>

        {/* Companion name + voice label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-lg font-semibold text-foreground">{companion.name}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {language === "de" ? voiceProfile.voiceLabelDe : voiceProfile.voiceLabel}
          </p>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 h-8 flex items-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={visualState}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-muted-foreground font-medium flex items-center gap-2"
            >
              {visualState === "speaking" && (
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              )}
              {getStatusText()}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Transcript / Response area */}
        <div className="mt-6 w-full max-w-sm min-h-[80px] flex items-start justify-center">
          <AnimatePresence mode="wait">
            {/* Live transcript while listening */}
            {isListening && liveTranscript && (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-center px-4"
              >
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  "{displayTranscript}"
                </p>
              </motion.div>
            )}

            {/* Last assistant response as subtitle while speaking */}
            {isSpeaking && lastAssistantMessage && (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-center px-4"
              >
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {displayResponse}
                </p>
              </motion.div>
            )}

            {/* Thinking placeholder */}
            {(isThinking || isStreamingActive) && !isSpeaking && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/40"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom controls — minimal */}
      <div className="relative z-10 flex flex-col items-center pb-10 pt-4 gap-4">
        {/* Primary mic button */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onToggleRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            isListening
              ? "bg-primary shadow-primary/30"
              : "bg-card border border-border/50 shadow-md"
          }`}
          aria-label={isListening
            ? (language === "de" ? "Aufnahme stoppen" : "Stop recording")
            : (language === "de" ? "Sprechen" : "Speak")
          }
        >
          {isListening ? (
            <Mic className="w-6 h-6 text-primary-foreground" />
          ) : (
            <Mic className="w-6 h-6 text-muted-foreground" />
          )}
        </motion.button>

        {/* Listening ring pulse */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute bottom-[calc(2.5rem+32px-28px)] w-14 h-14 rounded-full border-2 border-primary/40"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0, 0.4],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              style={{ pointerEvents: "none" }}
            />
          )}
        </AnimatePresence>

        <p className="text-[11px] text-muted-foreground/50">
          {isListening
            ? (language === "de" ? "Tippe zum Stoppen" : "Tap to stop")
            : (language === "de" ? "Tippe zum Sprechen" : "Tap to speak")
          }
        </p>
      </div>
    </motion.div>
  );
});
