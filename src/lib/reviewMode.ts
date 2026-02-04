/**
 * Review Mode Configuration
 * 
 * This module provides robust Apple App Store review support.
 * The review account gets automatic premium access and bypasses rate limits.
 */

// Review account credentials - stored securely, not exposed in UI
export const REVIEW_CREDENTIALS = {
  email: "apple-review@mindmate.de",
  password: "MindMate2026Review!",
} as const;

// Check if current user is the review account
export const isReviewAccount = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === REVIEW_CREDENTIALS.email.toLowerCase();
};

// Check if review mode is active (based on localStorage flag or account)
export const isReviewModeActive = (): boolean => {
  try {
    // Check localStorage flag
    if (localStorage.getItem("mindmate_review_mode") === "active") {
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
    localStorage.setItem("mindmate_review_mode", "active");
    // Also set premium state
    localStorage.setItem("mindmate-premium-state", JSON.stringify({
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
    localStorage.removeItem("mindmate_review_mode");
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
