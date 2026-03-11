import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Volume2, AlertCircle } from "lucide-react";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { useTranslation } from "@/hooks/useTranslation";
import { getCompanionVoiceProfile } from "@/data/companionVoiceProfiles";
import {
  type VoicePhase,
  deriveVoicePhase,
  phaseToVisualState,
  getPhaseStatusKey,
  isMicActive,
} from "@/hooks/useVoiceStateMachine";
import type { CompanionProfile } from "@/hooks/useCompanion";

interface VoiceConversationPanelProps {
  companion: CompanionProfile;
  avatarUrl?: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isStreamingActive: boolean;
  isTTSLoading: boolean;
  isCooldown?: boolean;
  sttError?: string | null;
  liveTranscript: string;
  lastAssistantMessage: string;
  streamingContent: string;
  onToggleRecording: () => void;
  onClose: () => void;
}

/**
 * Premium full-screen face-to-face companion voice panel.
 * Driven by explicit VoicePhase state machine for deterministic UI.
 */
export const VoiceConversationPanel = memo(function VoiceConversationPanel({
  companion,
  avatarUrl,
  isListening,
  isSpeaking,
  isThinking,
  isStreamingActive,
  isTTSLoading,
  isCooldown,
  sttError,
  liveTranscript,
  lastAssistantMessage,
  streamingContent,
  onToggleRecording,
  onClose,
}: VoiceConversationPanelProps) {
  const { language } = useTranslation();
  const voiceProfile = getCompanionVoiceProfile(companion.archetype);
  const lang = (language === "de" ? "de" : "en") as "en" | "de";

  // Derive phase from state machine
  const phase = useMemo(() => deriveVoicePhase({
    voiceModeEnabled: true,
    isListening,
    isComposerBusy: isThinking,
    isStreamingActive,
    isTTSLoading,
    isSpeaking,
    hasPendingTranscript: false,
    sttError: sttError || null,
  }), [isListening, isThinking, isStreamingActive, isTTSLoading, isSpeaking, sttError]);

  const visualState = phaseToVisualState(phase);
  const micActive = isMicActive(phase);
  const statusText = getPhaseStatusKey(phase, companion.name, lang);

  // Show streaming content during streaming phase, response during tts_loading/speaking
  const subtitleContent = useMemo(() => {
    if (phase === "streaming" && streamingContent) {
      const text = streamingContent.length > 300 ? streamingContent.slice(-300) + "…" : streamingContent;
      return { type: "response" as const, text };
    }
    if ((phase === "tts_loading" || phase === "speaking") && lastAssistantMessage) {
      const text = lastAssistantMessage.length > 300 ? lastAssistantMessage.slice(0, 300) + "…" : lastAssistantMessage;
      return { type: "response" as const, text };
    }
    if (phase === "listening" && liveTranscript) {
      const text = liveTranscript.length > 200 ? "…" + liveTranscript.slice(-200) : liveTranscript;
      return { type: "transcript" as const, text };
    }
    return null;
  }, [phase, streamingContent, lastAssistantMessage, liveTranscript]);

  // Error state for STT
  const hasSTTError = sttError === "not-allowed" || sttError === "not-available";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
      style={{
        willChange: "opacity",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 25%, hsl(var(--primary) / 0.08) 0%, transparent 60%)`,
          }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: phase === "speaking" ? [0.04, 0.08, 0.04] : 0.04,
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(ellipse at 50% 80%, hsl(var(--primary)) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-3 pb-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center transition-colors hover:bg-muted active:scale-95"
          aria-label={lang === "de" ? "Schließen" : "Close"}
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
          {lang === "de" ? "Sprachmodus" : "Face to face"}
        </span>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-4">
        {/* Companion Avatar */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <CompanionAvatarAnimated
            archetype={companion.archetype}
            avatarUrl={avatarUrl}
            name={companion.name}
            state={visualState}
            size="2xl"
          />
        </motion.div>

        {/* Name + voice label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-5 text-center"
        >
          <p className="text-xl font-semibold text-foreground">{companion.name}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {lang === "de" ? voiceProfile.voiceLabelDe : voiceProfile.voiceLabel}
          </p>
        </motion.div>

        {/* Phase status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 h-8 flex items-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm text-muted-foreground font-medium flex items-center gap-2"
            >
              {phase === "speaking" && (
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              )}
              {hasSTTError && (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
              {hasSTTError
                ? (lang === "de" ? "Mikrofon nicht verfügbar" : "Microphone unavailable")
                : statusText
              }
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Subtitle area — always shows something meaningful */}
        <div className="mt-5 w-full max-w-md min-h-[80px] flex items-start justify-center">
          <AnimatePresence mode="wait">
            {subtitleContent?.type === "transcript" && (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-center px-4"
              >
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  "{subtitleContent.text}"
                </p>
              </motion.div>
            )}

            {subtitleContent?.type === "response" && (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-center px-4"
              >
                <p className="text-[15px] text-foreground/70 leading-relaxed">
                  {subtitleContent.text}
                </p>
              </motion.div>
            )}

            {!subtitleContent && (phase === "processing" || phase === "streaming" || phase === "tts_loading") && (
              <motion.div
                key="thinking-dots"
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

      {/* Bottom controls */}
      <div className="relative z-10 flex flex-col items-center pb-8 pt-4 gap-4">
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onToggleRecording}
            disabled={hasSTTError || phase === "processing" || phase === "streaming" || phase === "tts_loading"}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg disabled:opacity-50 ${
              micActive
                ? "bg-primary shadow-primary/30"
                : "bg-card border border-border/50 shadow-md"
            }`}
            aria-label={micActive
              ? (lang === "de" ? "Aufnahme stoppen" : "Stop recording")
              : (lang === "de" ? "Sprechen" : "Speak")
            }
          >
            <Mic className={`w-6 h-6 ${micActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
          </motion.button>

          {/* Listening pulse ring */}
          <AnimatePresence>
            {micActive && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 2, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
                style={{ pointerEvents: "none" }}
              />
            )}
          </AnimatePresence>
        </div>

        <p className="text-[11px] text-muted-foreground/50">
          {hasSTTError
            ? (lang === "de" ? "Bitte Mikrofonzugriff erlauben" : "Please allow microphone access")
            : micActive
              ? (lang === "de" ? "Tippe zum Stoppen" : "Tap to stop")
              : (lang === "de" ? "Tippe zum Sprechen" : "Tap to speak")
          }
        </p>
      </div>
    </motion.div>
  );
});
