/**
 * Platform Separation System for Soulvay
 * 
 * Centralizes all platform/environment detection and visibility rules
 * so that store badges, auth methods, and distribution CTAs are
 * correct across web, iOS, and Android.
 * 
 * Rules:
 * - Web: may show all store badges, all auth methods
 * - iOS native: hide Google Play refs, show Apple-specific UI
 * - Android native: hide App Store refs, show Android-specific UI
 * - Both native: hide "download" / install / store badge sections
 */

import { isNativeApp, isNativeIOS } from "./nativeDetect";

// ── Core Platform Detection ──

let _platformCache: "web" | "ios" | "android" | null = null;

function detectPlatform(): "web" | "ios" | "android" {
  if (_platformCache) return _platformCache;

  if (!isNativeApp()) {
    _platformCache = "web";
    return "web";
  }

  if (isNativeIOS()) {
    _platformCache = "ios";
    return "ios";
  }

  // If native but not iOS → Android
  _platformCache = "android";
  return "android";
}

/** Current runtime platform */
export function getPlatform(): "web" | "ios" | "android" {
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

/** Running inside the Android native app (Capacitor) */
export function isAndroidApp(): boolean {
  return getPlatform() === "android";
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
  // Show on web, never inside Android app (irrelevant) or iOS app (already installed)
  return isWeb();
}

/** True when the Google Play badge specifically should be shown */
export function shouldShowGooglePlayBadge(): boolean {
  // Show on web, never inside iOS app (competitor ref) or Android app (already installed)
  return isWeb();
}

/** True when Google Sign-In should be available as an auth option */
export function shouldShowGoogleAuth(): boolean {
  // Available everywhere — Google Sign-In is allowed on all platforms
  return true;
}

/** True when Apple Sign-In should be available as an auth option */
export function shouldShowAppleAuth(): boolean {
  // Required on iOS, optional elsewhere
  // Currently not implemented — returns true on iOS to prepare for future addition
  return isIOSApp();
}

/** True when the "Review / Demo Login" button should be visible */
export function shouldShowReviewLogin(): boolean {
  return (
    import.meta.env.DEV ||
    (typeof window !== "undefined" && window.location.hostname.includes("lovable")) ||
    isNativeApp()
  );
}

/**
 * Platform-aware FAQ answer for "Is there a mobile app?"
 * Avoids mentioning competitor stores inside native apps.
 */
export function getMobileAppFAQ(language: "en" | "de"): { q: string; a: string } {
  const platform = getPlatform();

  if (platform === "ios") {
    return language === "de"
      ? { q: "Gibt es eine mobile App?", a: "Du nutzt bereits die Soulvay App! Alle Funktionen stehen dir direkt hier zur Verfügung." }
      : { q: "Is there a mobile app?", a: "You're already using the Soulvay app! All features are available right here." };
  }

  if (platform === "android") {
    return language === "de"
      ? { q: "Gibt es eine mobile App?", a: "Du nutzt bereits die Soulvay App! Alle Funktionen stehen dir direkt hier zur Verfügung." }
      : { q: "Is there a mobile app?", a: "You're already using the Soulvay app! All features are available right here." };
  }

  // Web
  return language === "de"
    ? { q: "Gibt es eine mobile App?", a: "Ja! Soulvay ist als mobile App verfügbar. Du kannst die App auch direkt über deinen Browser installieren." }
    : { q: "Is there a mobile app?", a: "Yes! Soulvay is available as a mobile app. You can also install it directly from your browser." };
}
