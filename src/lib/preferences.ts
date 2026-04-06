/**
 * Centralized Preferences Service — Single Source of Truth
 * 
 * All modules (Settings, Chat, Voice, Journal, Companion) MUST read/write
 * preferences through this service. Direct localStorage access is prohibited
 * for preference data.
 * 
 * Storage key: "soulvay-preferences"
 * localStorage is the primary store; profile language syncs from server on login.
 */

export interface AppPreferences {
  language: "en" | "de";
  tone: "gentle" | "neutral" | "structured";
  addressForm: "du" | "sie";
  notifications: boolean;
  innerDialogue: boolean;
}

const STORAGE_KEY = "soulvay-preferences";
const LEGACY_KEY = "mindmate-preferences";

const DEFAULT_PREFERENCES: AppPreferences = {
  language: "en",
  tone: "gentle",
  addressForm: "du",
  notifications: true,
  innerDialogue: false,
};

// In-memory cache to avoid repeated JSON.parse calls
let _cached: AppPreferences | null = null;
let _listeners: Array<(prefs: AppPreferences) => void> = [];

/**
 * Read current preferences. Returns cached value if available.
 * Falls back to localStorage → legacy key → defaults.
 */
export function getPreferences(): AppPreferences {
  if (_cached) return _cached;

  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      _cached = { ...DEFAULT_PREFERENCES, ...parsed };
      return _cached;
    }
  } catch {
    // Corrupted storage — return defaults
  }

  _cached = { ...DEFAULT_PREFERENCES };
  return _cached;
}

/**
 * Update one or more preferences atomically.
 * Writes to primary key, keeps legacy key in sync during migration.
 * Notifies all listeners.
 */
export function setPreferences(partial: Partial<AppPreferences>): AppPreferences {
  const current = getPreferences();
  const updated = { ...current, ...partial };

  try {
    const json = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, json);
    // Legacy sync — will be removed when migration period ends
    localStorage.setItem(LEGACY_KEY, json);
  } catch {
    // Storage full or unavailable
  }

  _cached = updated;
  _listeners.forEach(fn => fn(updated));
  
  // Dispatch custom event for same-tab reactivity (useTranslation, etc.)
  try { window.dispatchEvent(new Event("soulvay-preferences-changed")); } catch {}
  
  return updated;
}

/**
 * Subscribe to preference changes. Returns unsubscribe function.
 */
export function onPreferencesChange(listener: (prefs: AppPreferences) => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter(fn => fn !== listener);
  };
}

/**
 * Get a single preference value.
 */
export function getPreference<K extends keyof AppPreferences>(key: K): AppPreferences[K] {
  return getPreferences()[key];
}

/**
 * Get the app language. Convenience shortcut used across the codebase.
 */
export function getAppLanguage(): "en" | "de" {
  return getPreference("language");
}

/**
 * Invalidate the in-memory cache. Call after external writes (e.g. onboarding).
 */
export function invalidatePreferencesCache(): void {
  _cached = null;
}
