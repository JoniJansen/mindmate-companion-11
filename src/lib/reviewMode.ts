/**
 * Review Mode Configuration
 * 
 * This module provides robust App Store review support for Apple and Google Play.
 * Review accounts get automatic premium access and bypass rate limits.
 */

// Review account emails only — passwords are stored server-side as secrets
export const REVIEW_EMAILS_CONFIG = {
  apple: "apple-review@mindmate.de",
  google: "google-review@mindmate.de",
} as const;

// All review emails for checking
const REVIEW_EMAILS = [
  REVIEW_EMAILS_CONFIG.apple.toLowerCase(),
  REVIEW_EMAILS_CONFIG.google.toLowerCase(),
];

// Check if current user is a review account (Apple or Google)
export const isReviewAccount = (email?: string | null): boolean => {
  if (!email) return false;
  return REVIEW_EMAILS.includes(email.toLowerCase().trim());
};

// Check if review mode is active (based on localStorage flag or account)
export const isReviewModeActive = (): boolean => {
  try {
    if (localStorage.getItem("soulvay_review_mode") === "active") return true;
    // Legacy fallback
    if (localStorage.getItem("mindmate_review_mode") === "active") return true;
    return false;
  } catch {
    return false;
  }
};

// Activate review mode
export const activateReviewMode = (): void => {
  try {
    localStorage.setItem("soulvay_review_mode", "active");
    localStorage.setItem("soulvay-premium-state", JSON.stringify({
      isPremium: true,
      dailyMessagesUsed: 0,
      lastResetDate: new Date().toISOString().split("T")[0],
      planType: "review",
      subscriptionStatus: "active",
    }));
    // Legacy compat
    localStorage.setItem("mindmate_review_mode", "active");
    localStorage.setItem("mindmate-premium-state", JSON.stringify({
      isPremium: true,
      dailyMessagesUsed: 0,
      lastResetDate: new Date().toISOString().split("T")[0],
      planType: "review",
      subscriptionStatus: "active",
    }));
  } catch {
    if (import.meta.env.DEV) console.warn("Failed to activate review mode");
  }
};

// Deactivate review mode
export const deactivateReviewMode = (): void => {
  try {
    localStorage.removeItem("soulvay_review_mode");
    localStorage.removeItem("mindmate_review_mode");
  } catch {
    if (import.meta.env.DEV) console.warn("Failed to deactivate review mode");
  }
};

// Check if running on iOS (for iPad-specific adjustments)
export const isIOSDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || 
    (userAgent.includes("mac") && "ontouchend" in document);
};

// Check if running on iPad specifically
export const isIPad = (): boolean => {
  if (typeof window === "undefined") return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes("ipad") || 
    (userAgent.includes("mac") && "ontouchend" in document && window.innerWidth >= 768);
};

// Get device info for diagnostics
export const getDeviceInfo = (): {
  isIOS: boolean;
  isIPad: boolean;
  viewportWidth: number;
  viewportHeight: number;
  userAgent: string;
} => {
  return {
    isIOS: isIOSDevice(),
    isIPad: isIPad(),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    userAgent: window.navigator.userAgent,
  };
};
