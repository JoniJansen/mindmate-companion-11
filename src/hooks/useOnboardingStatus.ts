import { useCallback } from "react";

const ONBOARDING_COMPLETED_KEY = "soulvay_onboarding_completed";
const TAB_HINTS_SEEN_KEY = "soulvay_tab_hints_seen";

export interface TabHintsSeen {
  chat: boolean;
  journal: boolean;
  topics: boolean;
  mood: boolean;
  toolbox: boolean;
}

const defaultTabHints: TabHintsSeen = {
  chat: false,
  journal: false,
  topics: false,
  mood: false,
  toolbox: false,
};

export function useOnboardingStatus() {
  // Check if onboarding has been completed
  const hasCompletedOnboarding = useCallback((): boolean => {
    try {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  // Mark onboarding as completed
  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    } catch {
      // Storage not available
    }
  }, []);

  // Reset onboarding status (for testing or re-onboarding)
  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch {
      // Storage not available
    }
  }, []);

  // Get tab hints seen status
  const getTabHintsSeen = useCallback((): TabHintsSeen => {
    try {
      const stored = localStorage.getItem(TAB_HINTS_SEEN_KEY);
      if (stored) {
        return { ...defaultTabHints, ...JSON.parse(stored) };
      }
    } catch {
      // Use defaults
    }
    return defaultTabHints;
  }, []);

  // Mark a specific tab hint as seen
  const markTabHintSeen = useCallback((tab: keyof TabHintsSeen) => {
    try {
      const current = getTabHintsSeen();
      const updated = { ...current, [tab]: true };
      localStorage.setItem(TAB_HINTS_SEEN_KEY, JSON.stringify(updated));
    } catch {
      // Storage not available
    }
  }, [getTabHintsSeen]);

  // Check if a specific tab hint has been seen
  const hasSeenTabHint = useCallback((tab: keyof TabHintsSeen): boolean => {
    return getTabHintsSeen()[tab];
  }, [getTabHintsSeen]);

  // Reset all tab hints (for testing)
  const resetTabHints = useCallback(() => {
    try {
      localStorage.removeItem(TAB_HINTS_SEEN_KEY);
    } catch {
      // Storage not available
    }
  }, []);

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
    getTabHintsSeen,
    markTabHintSeen,
    hasSeenTabHint,
    resetTabHints,
  };
}
