/**
 * React hook for the centralized preferences service.
 * Provides reactive access to preferences with automatic re-renders on changes.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getPreferences,
  setPreferences,
  onPreferencesChange,
  type AppPreferences,
} from "@/lib/preferences";

export function usePreferences() {
  const [preferences, setLocal] = useState<AppPreferences>(getPreferences);

  useEffect(() => {
    // Sync with external changes (e.g. other tabs, onboarding writes)
    const unsubscribe = onPreferencesChange(setLocal);
    return unsubscribe;
  }, []);

  const updatePreference = useCallback(
    <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
      const updated = setPreferences({ [key]: value });
      setLocal(updated);
      return updated;
    },
    []
  );

  const updatePreferences = useCallback(
    (partial: Partial<AppPreferences>) => {
      const updated = setPreferences(partial);
      setLocal(updated);
      return updated;
    },
    []
  );

  return {
    preferences,
    updatePreference,
    updatePreferences,
  };
}
