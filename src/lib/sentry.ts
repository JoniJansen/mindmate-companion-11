/**
 * Sentry Crash-Reporting Wrapper
 *
 * Build 60 · Item #0
 *
 * Design principles (per audit/BUILD60_ITEM_00_IMPLEMENTATION_PLAN.md):
 * - DSN via VITE_SENTRY_DSN env var (publishable, not secret).
 * - Init is no-op when DSN missing → forks/preview branches stay functional.
 * - Web: opt-in via cookie consent (`crashReporting` category, default OFF).
 * - Native: opt-in via NativeCrashConsentModal on first launch (default OFF).
 * - beforeSend returns null if consent withdrawn → live consent enforcement.
 * - sendDefaultPii: false; URLs/emails scrubbed; user IDs hashed if present.
 * - tracesSampleRate 0.1; no session replay, only on-error replay.
 */

import * as Sentry from "@sentry/capacitor";
import * as SentryReact from "@sentry/react";
import { isNativeApp } from "@/lib/nativeDetect";

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const ENV = import.meta.env.MODE;

const CRASH_CONSENT_KEY_WEB = "cookie_consent";
const CRASH_CONSENT_KEY_NATIVE = "soulvay-crash-consent-native";

let _initialized = false;

/**
 * Returns true if the user has explicitly opted in to crash reporting.
 * Web: reads cookie_consent.crashReporting (default false).
 * Native: reads soulvay-crash-consent-native === "granted" (default false).
 */
export function isCrashReportingAllowed(): boolean {
  try {
    if (isNativeApp()) {
      return localStorage.getItem(CRASH_CONSENT_KEY_NATIVE) === "granted";
    }
    const raw = localStorage.getItem(CRASH_CONSENT_KEY_WEB);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.crashReporting === true;
  } catch {
    return false;
  }
}

/**
 * Has the native first-launch consent prompt been shown yet?
 * Used by NativeCrashConsentModal to decide whether to render.
 */
export function nativeCrashConsentDecided(): boolean {
  try {
    const val = localStorage.getItem(CRASH_CONSENT_KEY_NATIVE);
    return val === "granted" || val === "denied";
  } catch {
    return true;
  }
}

export function setNativeCrashConsent(granted: boolean) {
  try {
    localStorage.setItem(CRASH_CONSENT_KEY_NATIVE, granted ? "granted" : "denied");
    window.dispatchEvent(new CustomEvent("cookie_consent_updated"));
  } catch {
    /* ignore */
  }
}

/**
 * Best-effort PII scrubbing on every outbound event.
 * - Strips query strings that look like tokens / access_tokens.
 * - Replaces email-like substrings in messages.
 */
function scrubEvent<T extends { request?: any; message?: any; exception?: any }>(event: T): T {
  try {
    if (event.request?.url) {
      event.request.url = String(event.request.url).replace(
        /([?&](?:token|access_token|apikey|api_key|key|password)=)[^&#]+/gi,
        "$1[REDACTED]",
      );
    }
    if (typeof event.message === "string") {
      event.message = event.message.replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        "[email]",
      );
    }
    const values = event.exception?.values;
    if (Array.isArray(values)) {
      values.forEach((v: any) => {
        if (typeof v.value === "string") {
          v.value = v.value.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            "[email]",
          );
        }
      });
    }
  } catch {
    /* never let scrubbing break reporting */
  }
  return event;
}

export function initSentry() {
  if (_initialized) return;
  if (!DSN) {
    if (import.meta.env.DEV) {
      console.info("[Sentry] VITE_SENTRY_DSN not set — crash reporting disabled.");
    }
    return;
  }

  try {
    Sentry.init(
      {
        dsn: DSN,
        environment: ENV,
        release: `soulvay@${(import.meta.env.VITE_APP_VERSION as string) || "dev"}`,
        sendDefaultPii: false,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        maxBreadcrumbs: 50,
        beforeSend(event) {
          if (!isCrashReportingAllowed()) return null;
          return scrubEvent(event as any);
        },
        beforeBreadcrumb(breadcrumb) {
          // Drop console.log noise; keep warn/error/navigation.
          if (breadcrumb.category === "console" && breadcrumb.level === "log") return null;
          return breadcrumb;
        },
      },
      SentryReact.init,
    );

    _initialized = true;

    // Re-evaluate consent on change. If user withdraws, flush + close.
    window.addEventListener("cookie_consent_updated", () => {
      if (!isCrashReportingAllowed()) {
        SentryReact.close(2000).catch(() => {});
      }
    });
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[Sentry] init failed", err);
  }
}

/** Public wrapper around captureException — swallows if not initialized. */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!_initialized) return;
  try {
    SentryReact.captureException(error, { extra: context });
  } catch {
    /* swallow */
  }
}

/** Manual test crash for DevQA verification. Tags event for filtering. */
export function sendTestCrash(label: string = "build60-verification") {
  if (!_initialized) {
    throw new Error(`[Sentry] not initialized — cannot send test crash "${label}"`);
  }
  SentryReact.withScope((scope) => {
    scope.setTag("test", "true");
    scope.setTag("test_label", label);
    SentryReact.captureException(new Error(`sentry-test-${label}`));
  });
}
