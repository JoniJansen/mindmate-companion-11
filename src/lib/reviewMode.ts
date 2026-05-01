/**
 * Device detection helpers used by the diagnostics page.
 *
 * NOTE: All previous review-account logic (REVIEW_EMAILS_CONFIG, isReviewAccount,
 * activateReviewMode, deactivateReviewMode, isReviewModeActive) was REMOVED.
 *
 * The Apple-review demo flow no longer touches Supabase auth at all — it runs
 * entirely client-side via `isDemoMode` in AuthContext. See AuthContext.tsx.
 */

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
