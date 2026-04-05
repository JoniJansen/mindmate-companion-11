/**
 * Review Mode Configuration
 * 
 * This module provides robust App Store review support for Apple and Google Play.
 * Review accounts get automatic premium access and bypass rate limits.
 */

// Review account credentials - loaded from environment variables
// Set VITE_REVIEW_EMAIL and VITE_REVIEW_PASSWORD in your .env file
export const REVIEW_CREDENTIALS = {
  email: import.meta.env.VITE_REVIEW_EMAIL || "apple-review@soulvay.de",
  password: import.meta.env.VITE_REVIEW_PASSWORD || "",
} as const;

export const GOOGLE_REVIEW_CREDENTIALS = {
  email: import.meta.env.VITE_GOOGLE_REVIEW_EMAIL || "google-review@soulvay.de",
  password: import.meta.env.VITE_REVIEW_PASSWORD || "",
} as const;

// All review emails for checking
const REVIEW_EMAILS = [
  REVIEW_CREDENTIALS.email.toLowerCase(),
  GOOGLE_REVIEW_CREDENTIALS.email.toLowerCase(),
];

// Check if current user is a review account (Apple or Google)
export const isReviewAccount = (email?: string | null): boolean => {
  if (!email) return false;
  return REVIEW_EMAILS.includes(email.toLowerCase().trim());
};

// Check if review mode is active (based on localStorage flag or account)
export const isReviewModeActive = (): boolean => {
  try {
    // Check localStorage flag
    if (localStorage.getItem("soulvay_review_mode") === "active") {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Activate review mode
export const activateReviewMode = (): void => {
  try {
    localStorage.setItem("soulvay_review_mode", "active");
    // Also set premium state
    localStorage.setItem("soulvay-premium-state", JSON.stringify({
      isPremium: true,
      dailyMessagesUsed: 0,
      lastResetDate: new Date().toISOString().split("T")[0],
      planType: "review",
      subscriptionStatus: "active",
    }));
  } catch {
    console.warn("Failed to activate review mode");
  }
};

// Deactivate review mode
export const deactivateReviewMode = (): void => {
  try {
    localStorage.removeItem("soulvay_review_mode");
  } catch {
    console.warn("Failed to deactivate review mode");
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
