/**
 * Platform Separation System for Soulvay
 * 
 * Centralizes all platform/environment detection and visibility rules
 * so that store badges, auth methods, and distribution CTAs are
 * correct across web, iOS, and native mobile.
 * 
 * Rules:
 * - Web: may show all store badges, all auth methods
 * - iOS native: hide competitor refs, show Apple-specific UI
 * - Native mobile: hide store badge sections
 */

import { isNativeApp, isNativeIOS } from "./nativeDetect";

// ── Core Platform Detection ──

let _platformCache: "web" | "ios" | "other-native" | null = null;

function detectPlatform(): "web" | "ios" | "other-native" {
  if (_platformCache) return _platformCache;

  if (!isNativeApp()) {
    _platformCache = "web";
    return "web";
  }

  if (isNativeIOS()) {
    _platformCache = "ios";
    return "ios";
  }

  // If native but not iOS
  _platformCache = "other-native";
  return "other-native";
}

/** Current runtime platform */
export function getPlatform(): "web" | "ios" | "other-native" {
  return detectPlatform();
}

// ── Convenience Checks ──

/** Running in a web browser (not a Capacitor native shell) */
export function isWeb(): boolean {
  return getPlatform() === "web";
}

/** Running inside the iOS native app (Capacitor) */
export function isIOSApp(): boolean {
  return getPlatform() === "ios";
}

/** Running inside a non-iOS native app (Capacitor) */
export function isOtherNativeApp(): boolean {
  return getPlatform() === "other-native";
}

// ── Visibility Rules ──

/** True on web only — surfaces like landing footer, install page, marketing CTAs */
export function isWebDistributionSurface(): boolean {
  return isWeb();
}

/** True when any store badges may be shown (web only, never inside native apps) */
export function shouldShowStoreBadges(): boolean {
  return isWeb();
}

/** True when the Apple App Store badge specifically should be shown */
export function shouldShowAppleStoreBadge(): boolean {
  return isWeb();
}

/** True when OAuth sign-in should be available as an auth option */
export function shouldShowGoogleAuth(): boolean {
  return isWeb() || isIOSApp();
}

/** True when Apple Sign-In should be available as an auth option */
export function shouldShowAppleAuth(): boolean {
  // Show on web (both options available) and iOS (required by Apple)
  return isWeb() || isIOSApp();
}

/** True when store messaging should be shown */
export function shouldShowStoreMessaging(): boolean {
  return isWeb();
}

/** True when the "Review / Demo Login" button should be visible */
export function shouldShowReviewLogin(): boolean {
  // Never show in native apps — only in dev mode or Lovable preview
  if (isNativeApp()) return false;
  return (
    import.meta.env.DEV ||
    (typeof window !== "undefined" && window.location.hostname.includes("lovable"))
  );
}

/**
 * Platform-aware FAQ answer for "Is there a mobile app?"
 * Avoids mentioning competitor stores inside native apps.
 */
export function getMobileAppFAQ(language: "en" | "de"): { q: string; a: string } {
  const platform = getPlatform();

  if (platform !== "web") {
    return language === "de"
      ? { q: "Gibt es eine mobile App?", a: "Du nutzt bereits die Soulvay App! Alle Funktionen stehen dir direkt hier zur Verfügung." }
      : { q: "Is there a mobile app?", a: "You're already using the Soulvay app! All features are available right here." };
  }

  // Web
  return language === "de"
    ? { q: "Gibt es eine mobile App?", a: "Ja! Soulvay ist als mobile App verfügbar. Du kannst die App auch direkt über deinen Browser installieren." }
    : { q: "Is there a mobile app?", a: "Yes! Soulvay is available as a mobile app. You can also install it directly from your browser." };
}
