/**
 * Centralized native platform detection for Capacitor builds.
 *
 * Uses a multi-signal fail-closed strategy:
 * 1. Capacitor SDK import (primary)
 * 2. Capacitor.getPlatform() runtime check
 * 3. WKWebView messageHandlers detection (iOS-specific)
 *
 * If ANY signal returns true, the app is considered native.
 * This prevents false negatives that could expose web-only UI on native builds.
 */

let _cachedResult: boolean | null = null;

export function isNativeApp(): boolean {
  if (_cachedResult !== null) return _cachedResult;

  if (typeof window === "undefined") {
    _cachedResult = false;
    return false;
  }

  try {
    const Capacitor = (window as any).Capacitor;
    if (Capacitor) {
      if (typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform()) {
        _cachedResult = true;
        return true;
      }

      const platform = typeof Capacitor.getPlatform === "function"
        ? Capacitor.getPlatform()
        : Capacitor.platform;

      if (platform && platform !== "web") {
        _cachedResult = true;
        return true;
      }
    }
  } catch {
    // Continue with fallbacks
  }

  try {
    if ((window as any).webkit?.messageHandlers) {
      _cachedResult = true;
      return true;
    }
  } catch {
    // Continue
  }

  _cachedResult = false;
  return false;
}

export function isNativeIOS(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const Capacitor = (window as any).Capacitor;
    if (Capacitor) {
      const platform = typeof Capacitor.getPlatform === "function"
        ? Capacitor.getPlatform()
        : Capacitor.platform;

      if (platform === "ios") return true;
    }

    if ((window as any).webkit?.messageHandlers) return true;
  } catch {
    // Fallback
  }

  return false;
}
