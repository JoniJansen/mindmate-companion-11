import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionId } from "./useSessionId";

export interface PremiumState {
  isPremium: boolean;
  dailyMessagesUsed: number;
  dailyMessageLimit: number;
  messagesRemaining: number;
  lastResetDate: string;
  planType?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
  subscriptionStatus?: string;
}

const DAILY_MESSAGE_LIMIT = 15;
const STORAGE_KEY = "mindmate-premium-state";

interface StoredState {
  isPremium: boolean;
  dailyMessagesUsed: number;
  lastResetDate: string;
  planType?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
  subscriptionStatus?: string;
}

const getToday = () => new Date().toISOString().split("T")[0];

const getDefaultState = (): StoredState => ({
  isPremium: false,
  dailyMessagesUsed: 0,
  lastResetDate: getToday(),
});

export function usePremium() {
  const sessionId = useSessionId();
  const [state, setState] = useState<StoredState>(getDefaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

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

  // Check subscription status from backend
  const checkSubscriptionStatus = useCallback(async () => {
    if (!sessionId || isCheckingSubscription) return;
    
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { sessionId, action: "status" },
      });

      if (error) {
        console.warn("Failed to check subscription:", error);
        return;
      }

      if (data) {
        const newState: StoredState = {
          ...state,
          isPremium: data.isPremium || false,
          planType: data.planType,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          currentPeriodEnd: data.currentPeriodEnd,
          subscriptionStatus: data.status,
        };
        saveState(newState);
      }
    } catch (e) {
      console.warn("Failed to check subscription status:", e);
    } finally {
      setIsCheckingSubscription(false);
    }
  }, [sessionId, isCheckingSubscription, state]);

  // Check subscription on mount and when session ID changes
  useEffect(() => {
    if (sessionId && isLoaded) {
      checkSubscriptionStatus();
    }
  }, [sessionId, isLoaded]);

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

  // Create checkout session for upgrade
  const createCheckoutSession = useCallback(async (planType: "monthly" | "yearly") => {
    if (!sessionId) {
      throw new Error("No session ID");
    }

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        sessionId,
        planType,
        successUrl: `${window.location.origin}/settings?success=true`,
        cancelUrl: `${window.location.origin}/settings?canceled=true`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }, [sessionId]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!sessionId) {
      throw new Error("No session ID");
    }

    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { sessionId, action: "cancel" },
    });

    if (error) {
      throw new Error(error.message);
    }

    await checkSubscriptionStatus();
    return data;
  }, [sessionId, checkSubscriptionStatus]);

  // Reactivate subscription
  const reactivateSubscription = useCallback(async () => {
    if (!sessionId) {
      throw new Error("No session ID");
    }

    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { sessionId, action: "reactivate" },
    });

    if (error) {
      throw new Error(error.message);
    }

    await checkSubscriptionStatus();
    return data;
  }, [sessionId, checkSubscriptionStatus]);

  // Open billing portal
  const openBillingPortal = useCallback(async () => {
    if (!sessionId) {
      throw new Error("No session ID");
    }

    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { sessionId, action: "portal" },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }, [sessionId]);

  // Legacy upgrade method (now uses checkout)
  const upgradeToPremium = useCallback(() => {
    createCheckoutSession("monthly");
  }, [createCheckoutSession]);

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
    planType: state.planType,
    cancelAtPeriodEnd: state.cancelAtPeriodEnd,
    currentPeriodEnd: state.currentPeriodEnd,
    subscriptionStatus: state.subscriptionStatus,
    
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
    checkSubscriptionStatus,
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
    openBillingPortal,
  };
}
