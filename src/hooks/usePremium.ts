import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { isReviewAccount, isReviewModeActive, activateReviewMode } from "@/lib/reviewMode";
import { useRevenueCat, PREMIUM_ENTITLEMENT } from "./useRevenueCat";

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
  isReviewMode?: boolean;
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
  isReviewMode?: boolean;
}

const getToday = () => new Date().toISOString().split("T")[0];

const getDefaultState = (): StoredState => ({
  isPremium: false,
  dailyMessagesUsed: 0,
  lastResetDate: getToday(),
  isReviewMode: false,
});

export function usePremium() {
  const { user } = useAuth();
  const [state, setState] = useState<StoredState>(getDefaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  
  // RevenueCat integration for iOS
  const { 
    isAvailable: isRevenueCatAvailable, 
    isPremium: isRevenueCatPremium,
    offerings,
    purchasePackage,
    restorePurchases,
    checkEntitlements,
  } = useRevenueCat();

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

  // Sync RevenueCat premium status to local state
  useEffect(() => {
    if (isRevenueCatPremium && !state.isPremium) {
      if (import.meta.env.DEV) console.log("[Premium] RevenueCat premium detected, syncing to local state");
      const newState: StoredState = {
        ...state,
        isPremium: true,
        planType: "revenuecat",
        subscriptionStatus: "active",
      };
      saveState(newState);
    }
  }, [isRevenueCatPremium, state.isPremium]);

  // Check for review mode and auto-grant premium
  useEffect(() => {
    if (user) {
      const isReview = isReviewAccount(user.email) || isReviewModeActive();
      
      if (isReview && !state.isPremium) {
        if (import.meta.env.DEV) console.log("[Premium] Review mode detected, granting premium access");
        activateReviewMode();
        
        const reviewState: StoredState = {
          ...state,
          isPremium: true,
          planType: "review",
          subscriptionStatus: "active",
          isReviewMode: true,
        };
        saveState(reviewState);
      }
    }
  }, [user, state.isPremium]);

  // Check subscription status from backend
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user || isCheckingSubscription) return;
    
    setIsCheckingSubscription(true);
    try {
      // First check RevenueCat if available
      if (isRevenueCatAvailable) {
        const hasPremium = await checkEntitlements();
        if (hasPremium) {
          setIsCheckingSubscription(false);
          return;
        }
      }

      // Fallback to backend check
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { userId: user.id, action: "status" },
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
  }, [user, isCheckingSubscription, state, isRevenueCatAvailable, checkEntitlements]);

  // Check subscription on mount and when user changes
  useEffect(() => {
    if (user && isLoaded) {
      checkSubscriptionStatus();
    }
  }, [user, isLoaded]);

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

  // Cancel subscription - only for web/Stripe subscriptions
  const cancelSubscription = useCallback(async () => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    // For RevenueCat, users manage subscriptions through App Store
    if (isRevenueCatAvailable) {
      throw new Error("Bitte verwalte dein Abo in den iOS Einstellungen → Abonnements");
    }

    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { userId: user.id, action: "cancel" },
    });

    if (error) {
      throw new Error(error.message);
    }

    await checkSubscriptionStatus();
    return data;
  }, [user, checkSubscriptionStatus, isRevenueCatAvailable]);

  // Reactivate subscription - only for web/Stripe subscriptions
  const reactivateSubscription = useCallback(async () => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    // For RevenueCat, users manage subscriptions through App Store
    if (isRevenueCatAvailable) {
      throw new Error("Bitte verwalte dein Abo in den iOS Einstellungen → Abonnements");
    }

    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { userId: user.id, action: "reactivate" },
    });

    if (error) {
      throw new Error(error.message);
    }

    await checkSubscriptionStatus();
    return data;
  }, [user, checkSubscriptionStatus, isRevenueCatAvailable]);

  // Open billing portal - only for web/Stripe subscriptions
  const openBillingPortal = useCallback(async () => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    // For RevenueCat, direct to App Store subscriptions
    if (isRevenueCatAvailable) {
      // Open App Store subscription management
      window.location.href = "https://apps.apple.com/account/subscriptions";
      return;
    }

    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { userId: user.id, action: "portal" },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }, [user, isRevenueCatAvailable]);

  // Legacy upgrade method - deprecated, use Upgrade page
  const upgradeToPremium = useCallback(() => {
    window.location.href = "/upgrade";
  }, []);

  // Create checkout session - deprecated for iOS, kept for web fallback
  const createCheckoutSession = useCallback(async (planType: "monthly" | "yearly") => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    // For iOS, this shouldn't be called - use RevenueCat instead
    if (isRevenueCatAvailable) {
      console.warn("createCheckoutSession called on iOS - should use RevenueCat");
      return;
    }

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        userId: user.id,
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
  }, [user, isRevenueCatAvailable]);

  // Downgrade from premium (for testing or cancellation)
  const downgradeFromPremium = useCallback(() => {
    const newState: StoredState = {
      ...state,
      isPremium: false,
    };
    saveState(newState);
  }, [state, saveState]);

  // Compute final premium status (RevenueCat OR local state)
  const finalIsPremium = state.isPremium || isRevenueCatPremium;

  // Feature flags
  const canUseVoice = finalIsPremium;
  const canUseWeeklyRecap = finalIsPremium;
  const canUseSessionSummary = finalIsPremium;
  const canUseGuidedJournal = finalIsPremium;
  const canUsePatternMode = finalIsPremium;
  const canUseClarifyMode = finalIsPremium;
  const canUseReminders = finalIsPremium;

  const messagesRemaining = finalIsPremium 
    ? Infinity 
    : Math.max(0, DAILY_MESSAGE_LIMIT - state.dailyMessagesUsed);

  return {
    // State
    isPremium: finalIsPremium,
    isLoaded,
    dailyMessagesUsed: state.dailyMessagesUsed,
    dailyMessageLimit: DAILY_MESSAGE_LIMIT,
    messagesRemaining,
    planType: state.planType,
    cancelAtPeriodEnd: state.cancelAtPeriodEnd,
    currentPeriodEnd: state.currentPeriodEnd,
    subscriptionStatus: state.subscriptionStatus,
    
    // RevenueCat specific
    isRevenueCatAvailable,
    offerings,
    purchasePackage,
    restorePurchases,
    
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
