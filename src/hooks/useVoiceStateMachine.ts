/**
 * Explicit voice state machine.
 * Single source of truth — replaces scattered boolean collisions.
 * 
 * States: idle → listening → processing → streaming → tts_loading → speaking → cooldown → idle
 * Derived from compositor booleans, NOT stored independently.
 */

export type VoicePhase =
  | "idle"
  | "listening"
  | "processing"    // user stopped talking, auto-send fired, waiting for AI
  | "streaming"     // AI is streaming response tokens
  | "tts_loading"   // stream done, TTS audio being fetched
  | "speaking"      // TTS audio playing
  | "cooldown";     // brief pause before re-enabling mic

export interface VoiceStateInputs {
  voiceModeEnabled: boolean;
  isListening: boolean;
  isComposerBusy: boolean;     // composer.isLoading but not yet streaming
  isStreamingActive: boolean;
  isTTSLoading: boolean;
  isSpeaking: boolean;
  hasPendingTranscript: boolean;
  sttError: string | null;
}

/**
 * Pure function: derives voice phase from current booleans.
 * Priority order ensures deterministic state even with async overlaps.
 */
export function deriveVoicePhase(inputs: VoiceStateInputs): VoicePhase {
  if (!inputs.voiceModeEnabled) return "idle";

  // Priority: speaking > tts_loading > streaming > processing > listening > idle
  if (inputs.isSpeaking) return "speaking";
  if (inputs.isTTSLoading) return "tts_loading";
  if (inputs.isStreamingActive) return "streaming";
  if (inputs.isComposerBusy && !inputs.isStreamingActive) return "processing";
  if (inputs.isListening) return "listening";
  if (inputs.hasPendingTranscript) return "processing";

  return "idle";
}

/**
 * Maps voice phase → companion visual state for avatar animations.
 */
export function phaseToVisualState(phase: VoicePhase) {
  switch (phase) {
    case "listening": return "listening" as const;
    case "processing": return "thinking" as const;
    case "streaming": return "thinking" as const;
    case "tts_loading": return "thinking" as const;
    case "speaking": return "speaking" as const;
    case "cooldown": return "idle" as const;
    default: return "idle" as const;
  }
}

/**
 * Whether STT auto-restart should be suppressed in this phase.
 */
export function shouldSuppressSTT(phase: VoicePhase): boolean {
  return phase === "processing" || phase === "streaming" || phase === "tts_loading" || phase === "speaking" || phase === "cooldown";
}

/**
 * Whether the mic button should appear active/recording.
 */
export function isMicActive(phase: VoicePhase): boolean {
  return phase === "listening";
}

/**
 * Status text key for each phase.
 */
export function getPhaseStatusKey(phase: VoicePhase, companionName: string, lang: "en" | "de"): string {
  switch (phase) {
    case "listening":
      return lang === "de" ? "Ich höre dir zu…" : "I'm listening…";
    case "processing":
      return lang === "de" ? `${companionName} denkt nach…` : `${companionName} is reflecting…`;
    case "streaming":
      return lang === "de" ? `${companionName} formuliert…` : `${companionName} is composing…`;
    case "tts_loading":
      return lang === "de" ? `${companionName} bereitet sich vor…` : `${companionName} is preparing…`;
    case "speaking":
      return lang === "de" ? `${companionName} spricht…` : `${companionName} is speaking…`;
    case "cooldown":
      return lang === "de" ? "Einen Moment…" : "One moment…";
    default:
      return lang === "de" ? "Tippe auf das Mikrofon" : "Tap the microphone";
  }
}
