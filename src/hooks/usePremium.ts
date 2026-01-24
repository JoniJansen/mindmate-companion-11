import { useState, useEffect, useCallback } from "react";

export interface PremiumState {
  isPremium: boolean;
  dailyMessagesUsed: number;
  dailyMessageLimit: number;
  messagesRemaining: number;
  lastResetDate: string;
}

const DAILY_MESSAGE_LIMIT = 15;
const STORAGE_KEY = "mindmate-premium-state";

interface StoredState {
  isPremium: boolean;
  dailyMessagesUsed: number;
  lastResetDate: string;
}

const getToday = () => new Date().toISOString().split("T")[0];

const getDefaultState = (): StoredState => ({
  isPremium: false,
  dailyMessagesUsed: 0,
  lastResetDate: getToday(),
});

export function usePremium() {
  const [state, setState] = useState<StoredState>(getDefaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage and check for daily reset
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredState = JSON.parse(stored);
        const today = getToday();
        
        // Reset daily counter if it's a new day
        if (parsed.lastResetDate !== today) {
          const reset: StoredState = {
            ...parsed,
            dailyMessagesUsed: 0,
            lastResetDate: today,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
          setState(reset);
        } else {
          setState(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load premium state:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: StoredState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn("Failed to save premium state:", e);
    }
  }, []);

  // Increment message count (call after user sends a message)
  const incrementMessageCount = useCallback(() => {
    if (state.isPremium) return; // Premium users have unlimited
    
    const today = getToday();
    const newState: StoredState = {
      ...state,
      dailyMessagesUsed: state.dailyMessagesUsed + 1,
      lastResetDate: today,
    };
    saveState(newState);
  }, [state, saveState]);

  // Check if user can send more messages
  const canSendMessage = useCallback((): boolean => {
    if (state.isPremium) return true;
    return state.dailyMessagesUsed < DAILY_MESSAGE_LIMIT;
  }, [state]);

  // Upgrade to premium (will be connected to payment later)
  const upgradeToPremium = useCallback(() => {
    const newState: StoredState = {
      ...state,
      isPremium: true,
    };
    saveState(newState);
  }, [state, saveState]);

  // Downgrade from premium (for testing or cancellation)
  const downgradeFromPremium = useCallback(() => {
    const newState: StoredState = {
      ...state,
      isPremium: false,
    };
    saveState(newState);
  }, [state, saveState]);

  // Feature flags
  const canUseVoice = state.isPremium;
  const canUseWeeklyRecap = state.isPremium;
  const canUseSessionSummary = state.isPremium;
  const canUseGuidedJournal = state.isPremium;
  const canUsePatternMode = state.isPremium;
  const canUseClarifyMode = state.isPremium;
  const canUseReminders = state.isPremium;

  const messagesRemaining = state.isPremium 
    ? Infinity 
    : Math.max(0, DAILY_MESSAGE_LIMIT - state.dailyMessagesUsed);

  return {
    // State
    isPremium: state.isPremium,
    isLoaded,
    dailyMessagesUsed: state.dailyMessagesUsed,
    dailyMessageLimit: DAILY_MESSAGE_LIMIT,
    messagesRemaining,
    
    // Feature flags
    canUseVoice,
    canUseWeeklyRecap,
    canUseSessionSummary,
    canUseGuidedJournal,
    canUsePatternMode,
    canUseClarifyMode,
    canUseReminders,
    
    // Actions
    incrementMessageCount,
    canSendMessage,
    upgradeToPremium,
    downgradeFromPremium,
  };
}
