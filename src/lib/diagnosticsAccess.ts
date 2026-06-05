/**
 * Diagnostics access gate (TIGHTENED).
 *
 * Allows /diagnostics + Entitlement-/Network-Simulator ONLY in:
 *   1. Local DEV builds (`import.meta.env.DEV === true`)
 *   2. Lovable Editor Sandbox hosts: `id-preview--<uuid>.lovable.app`
 *      (UUID-protected, not SEO-indexed, only reachable via Lovable editor)
 *
 * Explicitly BLOCKED:
 *   - soulvay.com / www.soulvay.com (production custom domain)
 *   - mindmate-companion-11.lovable.app (published preview — shares the same
 *     production Supabase DB; broad `.lovable.app` whitelist would allow
 *     privilege escalation via the Entitlement Simulator).
 *   - Any other `*.lovable.app` host that does not start with `id-preview--`.
 *
 * SSR-safe: returns false when `window` is not defined.
 */
export function isDiagnosticsAllowed(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host.startsWith("id-preview--") && host.endsWith(".lovable.app");
}

