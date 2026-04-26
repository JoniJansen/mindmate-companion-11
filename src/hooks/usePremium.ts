import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTranslation } from "./useTranslation";
import { deactivateReviewMode } from "@/lib/reviewMode";
import { useRevenueCat } from "./useRevenueCat";
import { getSimulatedPremiumOverride } from "./useEntitlementSimulator";

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
const STORAGE_KEY = "soulvay-premium-state";

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

// Module-level deduplication: prevents multiple usePremium instances from
// firing concurrent subscription checks on mount.
let _lastCheckAt = 0;
let _checkInFlight: Promise<void> | null = null;
let _lastServerResult = false; // cache last known server result for error fallback
const CHECK_COOLDOWN_MS = 10_000; // 10s between checks

const getDefaultState = (): StoredState => ({
  isPremium: false,
  dailyMessagesUsed: 0,
  lastResetDate: getToday(),
  isReviewMode: false,
});

export function usePremium() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const [state, setState] = useState<StoredState>(getDefaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  // Server-verified premium status – only this authorizes premium features
  const [serverVerifiedPremium, setServerVerifiedPremium] = useState<boolean | null>(null);
  
  // RevenueCat integration for iOS
  const { 
    isAvailable: isRevenueCatAvailable, 
    isUnavailable: isRevenueCatUnavailable,
    isPremium: isRevenueCatPremium,
    offerings,
    initializeIfNeeded: initializeRevenueCat,
    purchasePackage,
    restorePurchases,
    checkEntitlements,
  } = useRevenueCat();

  // Load state from localStorage (cache only – NOT authoritative for premium)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredState = JSON.parse(stored);
        const today = getToday();
        if (parsed.isReviewMode || parsed.planType === "review") {
          deactivateReviewMode();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultState()));
          setState(getDefaultState());
          return;
        }
        
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
      if (import.meta.env.DEV) console.warn("Failed to load premium state:", e);
    }
    setIsLoaded(true);
  }, []);

  // Sync RevenueCat premium status (RevenueCat SDK does its own server validation)
  useEffect(() => {
    if (isRevenueCatPremium) {
      setServerVerifiedPremium(true);
      if (!state.isPremium) {
        if (import.meta.env.DEV) console.log("[Premium] RevenueCat premium detected, syncing to local state");
        const newState: StoredState = {
          ...state,
          isPremium: true,
          planType: "revenuecat",
          subscriptionStatus: "active",
        };
        saveState(newState);
      }
    }
  }, [isRevenueCatPremium, state.isPremium]);

  // Reset module-level cache when user logs out to prevent cross-account stale state
  useEffect(() => {
    if (!user) {
      _lastCheckAt = 0;
      _lastServerResult = false;
      _checkInFlight = null;
    }
  }, [user]);

  // Check subscription status from backend (source of truth)
  // Uses module-level deduplication to prevent N parallel calls from N hook instances.
  const checkSubscriptionStatus = useCallback(async (force = false) => {
    if (!user) return;

    // Deduplication: skip if a recent check already ran (unless forced)
    const now = Date.now();
    if (!force && now - _lastCheckAt < CHECK_COOLDOWN_MS) return;

    // If another instance is already in-flight, piggyback on it
    if (_checkInFlight) {
      await _checkInFlight;
      return;
    }

    // Set cooldown BEFORE creating the async work to prevent races
    _lastCheckAt = Date.now();

    const doCheck = async () => {
      setIsCheckingSubscription(true);
      try {
        // First check RevenueCat if available (SDK does server-side validation)
        if (isRevenueCatAvailable) {
          const hasPremium = await checkEntitlements();
          if (hasPremium) {
            setServerVerifiedPremium(true);
            return;
          }
        }

        // Backend check via Edge Function (server-side Stripe validation)
        // userId is derived from JWT on server — never sent in body
        const { data, error } = await supabase.functions.invoke("manage-subscription", {
          body: { action: "status" },
        });

        if (error) {
          if (import.meta.env.DEV) console.warn("Failed to check subscription:", error);
          setServerVerifiedPremium(_lastServerResult);
          return;
        }

        if (data) {
          const isPremiumFromServer = data.isPremium || false;
          _lastServerResult = isPremiumFromServer;
          setServerVerifiedPremium(isPremiumFromServer);
          
          // Update localStorage cache for all hook instances to read
          const newCachedState: StoredState = {
            isPremium: isPremiumFromServer,
            dailyMessagesUsed: 0,
            lastResetDate: getToday(),
            planType: data.planType,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            currentPeriodEnd: data.currentPeriodEnd,
            subscriptionStatus: data.status,
          };
          try {
            // Merge with existing state to preserve dailyMessagesUsed
            const existing = localStorage.getItem(STORAGE_KEY);
            if (existing) {
              const parsed = JSON.parse(existing);
              newCachedState.dailyMessagesUsed = parsed.dailyMessagesUsed || 0;
              newCachedState.lastResetDate = parsed.lastResetDate || getToday();
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newCachedState));
          } catch (e) {
            if (import.meta.env.DEV) console.warn("Failed to save premium state:", e);
          }
          
          setState(prev => ({
            ...prev,
            isPremium: isPremiumFromServer,
            planType: data.planType,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            currentPeriodEnd: data.currentPeriodEnd,
            subscriptionStatus: data.status,
          }));
        } else {
          setServerVerifiedPremium(false);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn("Failed to check subscription status:", e);
        setServerVerifiedPremium(_lastServerResult);
      } finally {
        setIsCheckingSubscription(false);
        _checkInFlight = null;
      }
    };

    _checkInFlight = doCheck();
    await _checkInFlight;
  }, [user, isRevenueCatAvailable, checkEntitlements]);

  // Check subscription on mount, when user changes, and every 15 minutes
  useEffect(() => {
    if (user && isLoaded) {
      checkSubscriptionStatus();

      // Auto-refresh every 15 minutes to catch delayed webhooks
      const interval = setInterval(() => {
        checkSubscriptionStatus(true); // force bypass cooldown for scheduled refresh
      }, 15 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user, isLoaded]);

  // Save state to localStorage
  const saveState = useCallback((newState: StoredState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Failed to save premium state:", e);
    }
  }, []);

  // Increment message count (call after user sends a message)
  const incrementMessageCount = useCallback(() => {
    setState(prev => {
      if (prev.isPremium) return prev; // Premium users have unlimited
      const today = getToday();
      const newState: StoredState = {
        ...prev,
        dailyMessagesUsed: prev.dailyMessagesUsed + 1,
        lastResetDate: today,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        if (import.meta.env.DEV) console.warn("Failed to save premium state:", e);
      }
      return newState;
    });
  }, []);

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
      throw new Error(language === "de"
        ? "Bitte verwalte dein Abo in den iOS Einstellungen → Abonnements"
        : "Please manage your subscription in iOS Settings → Subscriptions");
    }

    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { action: "cancel" },
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
      throw new Error(language === "de"
        ? "Bitte verwalte dein Abo in den iOS Einstellungen → Abonnements"
        : "Please manage your subscription in iOS Settings → Subscriptions");
    }

    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { action: "reactivate" },
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
      body: { action: "portal" },
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
      if (import.meta.env.DEV) console.warn("createCheckoutSession called on iOS - should use RevenueCat");
      return;
    }

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
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

  // DEV: entitlement simulator override
  const simOverride = getSimulatedPremiumOverride();
  
  // Compute final premium status:
  // Priority: Simulator (DEV only) > RevenueCat entitlement > server-verified backend subscription.
  // localStorage is cache/UX state only and never authorizes premium access.
  const verifiedPremium = isRevenueCatPremium || serverVerifiedPremium === true;
  const finalIsPremium = simOverride !== null ? simOverride.isPremium : verifiedPremium;
  const finalPlanType = simOverride !== null ? simOverride.planType : state.planType;
  const finalSubscriptionStatus = simOverride !== null ? simOverride.subscriptionStatus : state.subscriptionStatus;

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
    planType: finalPlanType,
    cancelAtPeriodEnd: state.cancelAtPeriodEnd,
    currentPeriodEnd: state.currentPeriodEnd,
    subscriptionStatus: finalSubscriptionStatus,
    
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
