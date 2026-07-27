import { useCallback, useRef, useState } from "react";
import { detectCrisis, type CrisisResult } from "@/lib/crisisDetection";

/**
 * Watches text for crisis signals and drives the inline support card.
 *
 * Used by every surface where a person writes freely: chat (including the
 * logged-out demo), journal, and the mood note. The check itself is local and
 * synchronous, so it can run before a message is sent and regardless of
 * consent, quota, subscription or connectivity.
 *
 * Dismissal is per occurrence, never permanent. A user who closes the card and
 * later writes something concerning again gets it again — the opposite of the
 * chat disclaimer, which disappears forever after one tap.
 */
export function useCrisisWatch() {
  const [isVisible, setIsVisible] = useState(false);
  const dismissedSignal = useRef<string | null>(null);

  const check = useCallback((input: string | string[]): CrisisResult => {
    const result = detectCrisis(input);

    if (result.detected) {
      // Re-open unless this is the exact signal the user just dismissed.
      if (result.matchedSignal !== dismissedSignal.current) {
        dismissedSignal.current = null;
        setIsVisible(true);
      }
    }

    return result;
  }, []);

  const dismiss = useCallback((signal?: string) => {
    dismissedSignal.current = signal ?? null;
    setIsVisible(false);
  }, []);

  return { isVisible, check, dismiss };
}
