/**
 * Maps real app states → companion visual states.
 * Single source of truth for what the companion "looks like" at any moment.
 */

export type CompanionVisualState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "success";

interface UseCompanionVisualStateParams {
  isListening?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
  isSuccess?: boolean;
}

/**
 * Derives the current visual state from app booleans.
 * Priority: success > speaking > thinking > listening > idle
 */
export function useCompanionVisualState({
  isListening = false,
  isThinking = false,
  isSpeaking = false,
  isSuccess = false,
}: UseCompanionVisualStateParams): CompanionVisualState {
  if (isSuccess) return "success";
  if (isSpeaking) return "speaking";
  if (isThinking) return "thinking";
  if (isListening) return "listening";
  return "idle";
}
