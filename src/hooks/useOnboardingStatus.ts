import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

// Module-level sync guard — ensures only ONE sync per user session across all hook instances
let _syncedUserId: string | null = null;

/**
 * Onboarding status — uses server (profiles.onboarding_completed) as source of truth.
 * localStorage is kept in sync as a fast cache for pre-auth checks (e.g. RootRedirect).
 */
export function useOnboardingStatus() {
  const { user } = useAuth();

  // On login: sync onboarding status between server and localStorage (once per user)
  useEffect(() => {
    if (!user || _syncedUserId === user.id) return;
    _syncedUserId = user.id;

    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.onboarding_completed) {
          localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
        } else {
          const localCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
          if (localCompleted && data) {
            await supabase
              .from("profiles")
              .update({ onboarding_completed: true } as any)
              .eq("user_id", user.id);
          }
        }
      } catch {
        // Network error — rely on localStorage cache
      }
    })();
  }, [user]);

  // Reset sync flag on logout
  useEffect(() => {
    if (!user) _syncedUserId = null;
  }, [user]);

  // Check if onboarding has been completed (fast, localStorage-based for guards)
  const hasCompletedOnboarding = useCallback((): boolean => {
    try {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  // Mark onboarding as completed — writes to both server and localStorage
  const completeOnboarding = useCallback(async () => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    } catch {
      // Storage not available
    }

    // Server-side persistence (fire-and-forget if no user yet;
    // AuthContext will re-sync on sign-in via ensureCompanionProfile)
    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true } as any)
          .eq("user_id", user.id);
      } catch {
        // Will be synced on next login
      }
    }
  }, [user]);

  // Reset onboarding status (for testing or re-onboarding)
  const resetOnboarding = useCallback(async () => {
    try {
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch {
      // Storage not available
    }

    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: false } as any)
          .eq("user_id", user.id);
      } catch {
        // Best effort
      }
    }
  }, [user]);

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
