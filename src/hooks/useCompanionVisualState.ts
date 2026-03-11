/**
 * Maps real app states → companion visual states.
 * Single source of truth for what the companion "looks like" at any moment.
 * Includes micro-delay before speaking to simulate natural transition.
 */

import { useState, useEffect, useRef } from "react";

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
 * Adds a ~200ms micro-delay before entering "speaking" for cinematic realism.
 */
export function useCompanionVisualState({
  isListening = false,
  isThinking = false,
  isSpeaking = false,
  isSuccess = false,
}: UseCompanionVisualStateParams): CompanionVisualState {
  const [delayedSpeaking, setDelayedSpeaking] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSpeaking && !delayedSpeaking) {
      // Micro-delay: keep "thinking" look for 200ms before entering speaking
      timeoutRef.current = window.setTimeout(() => {
        setDelayedSpeaking(true);
      }, 200);
    } else if (!isSpeaking && delayedSpeaking) {
      setDelayedSpeaking(false);
    }
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [isSpeaking, delayedSpeaking]);

  if (isSuccess) return "success";
  if (delayedSpeaking) return "speaking";
  if (isSpeaking || isThinking) return "thinking"; // Show thinking during speaking delay
  if (isListening) return "listening";
  return "idle";
}
