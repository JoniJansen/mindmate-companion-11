import { memo, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Volume2, Loader2, RefreshCw } from "lucide-react";
import { CompanionAvatarAnimated } from "@/components/companion/CompanionAvatarAnimated";
import { VoiceWaveform } from "@/components/chat/VoiceWaveform";
import { useTranslation } from "@/hooks/useTranslation";
import { getCompanionVoiceProfile } from "@/data/companionVoiceProfiles";
import type { CompanionProfile } from "@/hooks/useCompanion";
import type { RealtimeVoiceStatus, RealtimeVoicePhase } from "@/hooks/useConversationalVoice";

interface RealtimeVoicePanelProps {
  companion: CompanionProfile;
  avatarUrl?: string | null;
  status: RealtimeVoiceStatus;
  phase: RealtimeVoicePhase;
  isSpeaking: boolean;
  userTranscript: string;
  agentTranscript: string;
  onStartSession: () => void;
  onEndSession: () => void;
  onClose: () => void;
  onResetError?: () => void;
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
}

// ─── Audio Level Poller (optimized: useRef to avoid re-renders per frame) ───
function useAudioLevels(
  active: boolean,
  getInput?: () => number,
  getOutput?: () => number,
) {
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const rafRef = useRef<number>(0);
  const lastInputRef = useRef(0);
  const lastOutputRef = useRef(0);

  useEffect(() => {
    if (!active || (!getInput && !getOutput)) {
      setInputLevel(0);
      setOutputLevel(0);
      return;
    }

    let running = true;
    let frameCount = 0;
    const poll = () => {
      if (!running) return;
      frameCount++;
      // Only update React state every 3rd frame (~20fps) to reduce re-renders
      if (frameCount % 3 === 0) {
        const newIn = getInput ? getInput() : 0;
        const newOut = getOutput ? getOutput() : 0;
        // Only setState if value changed meaningfully (>2% threshold)
        if (Math.abs(newIn - lastInputRef.current) > 0.02) {
          lastInputRef.current = newIn;
          setInputLevel(newIn);
        }
        if (Math.abs(newOut - lastOutputRef.current) > 0.02) {
          lastOutputRef.current = newOut;
          setOutputLevel(newOut);
        }
      }
      rafRef.current = requestAnimationFrame(poll);
    };
    poll();

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, getInput, getOutput]);

  return { inputLevel, outputLevel };
}

// ─── Subtitle Area ───
const SubtitleArea = memo(function SubtitleArea({
  isSpeaking,
  agentTranscript,
  phase,
  userTranscript,
  isConnecting,
}: {
  isSpeaking: boolean;
  agentTranscript: string;
  phase: RealtimeVoicePhase;
  userTranscript: string;
  isConnecting: boolean;
}) {
  const content = useMemo(() => {
    if (isSpeaking && agentTranscript) {
      const text = agentTranscript.length > 300 ? agentTranscript.slice(-300) + "…" : agentTranscript;
      return { type: "response" as const, text };
    }
    if (phase === "listening" && userTranscript) {
      const text = userTranscript.length > 200 ? "…" + userTranscript.slice(-200) : userTranscript;
      return { type: "transcript" as const, text };
    }
    return null;
  }, [isSpeaking, agentTranscript, phase, userTranscript]);

  return (
    <div className="mt-5 w-full max-w-md min-h-[80px] flex items-start justify-center">
      <AnimatePresence mode="wait">
        {content?.type === "transcript" && (
          <motion.p
            key="transcript"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm text-foreground/80 leading-relaxed italic text-center px-4"
          >
            "{content.text}"
          </motion.p>
        )}
        {content?.type === "response" && (
          <motion.p
            key="response"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-[15px] text-foreground/70 leading-relaxed text-center px-4"
          >
            {content.text}
          </motion.p>
        )}
        {!content && isConnecting && (
          <motion.div
            key="dots"
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
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── Main Panel ───
export const RealtimeVoicePanel = memo(function RealtimeVoicePanel({
  companion,
  avatarUrl,
  status,
  phase,
  isSpeaking,
  userTranscript,
  agentTranscript,
  onStartSession,
  onEndSession,
  onClose,
  onResetError,
  getInputVolume,
  getOutputVolume,
}: RealtimeVoicePanelProps) {
  const { language } = useTranslation();
  const voiceProfile = getCompanionVoiceProfile(companion.archetype);
  const lang = (language === "de" ? "de" : "en") as "en" | "de";

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const isError = status === "error";

  // Auto-start session when panel opens (if not already connected/connecting)
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoStartedRef.current && status === "disconnected") {
      autoStartedRef.current = true;
      // Brief delay for panel animation to complete
      const timer = setTimeout(() => onStartSession(), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Poll audio levels at 60fps while connected
  const { inputLevel, outputLevel } = useAudioLevels(isConnected, getInputVolume, getOutputVolume);

  // Derive visual state with smooth transitions
  const visualState = isSpeaking ? "speaking" : phase === "listening" ? "listening" : "idle";

  const statusText = useMemo(() => {
    if (isConnecting) return lang === "de" ? "Verbinde…" : "Connecting…";
    if (isError) return lang === "de" ? "Verbindungsfehler" : "Connection error";
    if (isSpeaking) return lang === "de" ? `${companion.name} spricht…` : `${companion.name} is speaking…`;
    if (phase === "listening") return lang === "de" ? "Ich höre zu…" : "Listening…";
    return lang === "de" ? "Tippe zum Starten" : "Tap to start";
  }, [isConnecting, isError, isSpeaking, phase, companion.name, lang]);

  const handleClose = useCallback(() => {
    if (isConnected) onEndSession();
    onClose();
  }, [isConnected, onEndSession, onClose]);

  const handleRetry = useCallback(() => {
    onResetError?.();
    // Brief delay so state resets before new attempt
    setTimeout(() => onStartSession(), 100);
  }, [onResetError, onStartSession]);

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
            opacity: isSpeaking ? [0.04, 0.12, 0.04] : phase === "listening" ? [0.03, 0.06, 0.03] : 0.03,
          }}
          transition={{ duration: isSpeaking ? 1.5 : 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(ellipse at 50% 80%, hsl(var(--primary)) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-3 pb-2">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center transition-colors hover:bg-muted active:scale-95"
          aria-label={lang === "de" ? "Schließen" : "Close"}
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
          {lang === "de" ? "Echtzeit-Gespräch" : "Live conversation"}
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

        {/* Audio level waveform */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="mt-4 h-10 flex items-center justify-center"
            >
              {isSpeaking ? (
                <VoiceWaveform
                  level={outputLevel}
                  barCount={7}
                  colorClass="bg-primary/70"
                  active
                />
              ) : phase === "listening" ? (
                <VoiceWaveform
                  level={inputLevel}
                  barCount={7}
                  colorClass="bg-accent-foreground/50"
                  active
                />
              ) : (
                <VoiceWaveform level={0} barCount={7} active={false} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 h-8 flex items-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={statusText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-muted-foreground font-medium flex items-center gap-2"
            >
              {isSpeaking && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
              {isConnecting && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
              {statusText}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Error recovery UI */}
        <AnimatePresence>
          {isError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex flex-col items-center gap-3"
            >
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                {lang === "de"
                  ? "Die Verbindung konnte nicht hergestellt werden. Bitte versuche es erneut."
                  : "Couldn't establish connection. Please try again."}
              </p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "de" ? "Erneut versuchen" : "Try again"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtitle area */}
        <SubtitleArea
          isSpeaking={isSpeaking}
          agentTranscript={agentTranscript}
          phase={phase}
          userTranscript={userTranscript}
          isConnecting={isConnecting}
        />
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 flex flex-col items-center pb-8 pt-4 gap-4">
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={isConnected ? onEndSession : isError ? handleRetry : onStartSession}
            disabled={isConnecting}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg disabled:opacity-50 ${
              isConnected
                ? "bg-destructive shadow-destructive/30"
                : isError
                ? "bg-primary shadow-primary/30"
                : "bg-primary shadow-primary/30"
            }`}
            aria-label={isConnected
              ? (lang === "de" ? "Gespräch beenden" : "End conversation")
              : isError
              ? (lang === "de" ? "Erneut versuchen" : "Try again")
              : (lang === "de" ? "Gespräch starten" : "Start conversation")
            }
          >
            {isError ? (
              <RefreshCw className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Mic className={`w-6 h-6 ${isConnected ? "text-destructive-foreground" : "text-primary-foreground"}`} />
            )}
          </motion.button>

          {/* Active listening pulse ring */}
          <AnimatePresence>
            {isConnected && phase === "listening" && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-destructive/30"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ pointerEvents: "none" }}
              />
            )}
          </AnimatePresence>

          {/* Speaking glow ring */}
          <AnimatePresence>
            {isConnected && isSpeaking && (
              <motion.div
                className="absolute inset-[-4px] rounded-full border-2 border-primary/40"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                style={{ pointerEvents: "none" }}
              />
            )}
          </AnimatePresence>
        </div>

        <p className="text-[11px] text-muted-foreground/50">
          {isConnecting
            ? (lang === "de" ? "Verbindung wird hergestellt…" : "Establishing connection…")
            : isError
              ? (lang === "de" ? "Tippe zum erneuten Versuch" : "Tap to retry")
              : isConnected
                ? (lang === "de" ? "Tippe zum Beenden" : "Tap to end")
                : (lang === "de" ? "Tippe zum Starten" : "Tap to start")
          }
        </p>
      </div>
    </motion.div>
  );
});
