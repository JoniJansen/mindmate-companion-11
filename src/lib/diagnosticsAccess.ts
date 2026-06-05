/**
 * Diagnostics access gate.
 *
 * Allows /diagnostics + Entitlement-/Network-Simulator in:
 *   1. Local DEV builds (`import.meta.env.DEV === true`)
 *   2. Lovable Sandbox/Preview hosts ending in `.lovable.app`
 *      (covers id-preview--*.lovable.app and *.lovable.app preview URLs)
 *
 * Explicitly BLOCKED on production custom domains (soulvay.com, www.soulvay.com,
 * any non-lovable.app host) — Diagnostics page must never ship to end users.
 *
 * SSR-safe: returns false when `window` is not defined.
 */
export function isDiagnosticsAllowed(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "lovable.app" || host.endsWith(".lovable.app");
}
