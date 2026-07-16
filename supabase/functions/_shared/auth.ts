import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Extracts and validates the user from the Authorization header.
 * Returns the user object or throws a Response with 401.
 */
export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.claims.sub as string;
  const email = claimsData.claims.email as string;

  return { user: { id: userId, email }, supabase };
}

/**
 * Requires the authenticated user to have accepted the AI data-processing
 * disclosure (profiles.ai_consent_given === true).
 *
 * Server-side gate that prevents Gemini calls from running before consent.
 * The client-side AIConsentModal is a UX layer only — this check is the
 * source of truth.
 *
 * Apple App Review rejection May 14, 2026 (Guidelines 5.1.1(i) / 5.1.2(i)):
 * the prior client-only gate did not prevent parallel auto-fire requests
 * from leaving the device before the modal was acknowledged.
 *
 * Throws Response 403 { error: "AI_CONSENT_REQUIRED" } if no consent.
 * Returns the same { user, supabase } shape as requireUser().
 */
export async function requireAIConsent(req: Request) {
  const { user, supabase } = await requireUser(req);

  const { data, error } = await supabase
    .from("profiles")
    .select("ai_consent_given")
    .eq("user_id", user.id)
    .single();

  if (error || !data?.ai_consent_given) {
    throw new Response(
      JSON.stringify({
        error: "AI_CONSENT_REQUIRED",
        message: "AI consent is required before using AI features.",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return { user, supabase };
}

/**
 * Requires the user to have the 'admin' role.
 * Returns user + admin supabase client.
 */
export async function requireAdmin(req: Request) {
  const { user, supabase } = await requireUser(req);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: roleData, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (roleError || !roleData) {
    throw new Response(
      JSON.stringify({ error: "Forbidden - Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return { user, supabase, adminClient };
}

/**
 * Enforce a server-side premium subscription check for an ALREADY-AUTHED
 * user. Composable — call this after `requireUser`, `requireAIConsent`,
 * or any other auth helper that produced `{ user, supabase }`.
 *
 * Elite-Audit #6: without this, anyone with a valid JWT can call the
 * five premium edge functions directly via cURL and bypass the paywall.
 *
 * Deployed in a THREE-MODE feature-flag pattern because the DB layer
 * (subscriptions table) has a known write-failure bug that's tracked
 * in audit/SUBSCRIPTION_DB_FIX_PLAN_20260624.md — enforcing the gate
 * before that DB fix ships would lock out iOS/Android paying users
 * whose subs live only in the RevenueCat SDK, not the DB.
 *
 * Modes (set via `PREMIUM_GATE_MODE` Supabase env var):
 *   - "off"     (DEFAULT): skip the check entirely; preserves current
 *                 behavior. Safe to deploy before Sub-DB-Fix.
 *   - "log":    check the DB, log a warning if user is not premium,
 *                 but still allow the request. Use this AFTER Sub-DB-Fix
 *                 for a week or two to observe false-positives without
 *                 blocking anyone.
 *   - "enforce": check the DB and return 402 Payment Required if the
 *                 user is not premium. Use this once "log" mode has
 *                 stopped emitting false-positive warnings.
 *
 * Throws a 402 Response in enforce mode; returns void otherwise.
 */
export async function enforcePremium(
  user: { id: string },
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  const mode = (Deno.env.get("PREMIUM_GATE_MODE") ?? "off").toLowerCase();
  if (mode === "off") return;

  // Query the subscriptions table with the SAME rule that
  // manage-subscription/index.ts uses for `action: 'status'`:
  //   isPremium = subData.status === 'active'
  // Keep it aligned so client and server stay in sync.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const isPremium = sub?.status === "active";
  if (isPremium) return;

  // Not premium — either log or block based on mode
  if (mode === "log") {
    console.warn(JSON.stringify({
      level: "warn",
      feature: "premium-gate",
      action: "would_block",
      mode,
      userId: user.id,
      subStatus: sub?.status ?? null,
    }));
    return;
  }

  // mode === "enforce" (or any unknown value — fail closed)
  throw new Response(
    JSON.stringify({
      error: "PREMIUM_REQUIRED",
      message: "This feature requires an active Soulvay Plus subscription.",
    }),
    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Convenience combo: `requireUser` + `enforcePremium`.
 * For functions that don't also need AI consent.
 */
export async function requirePremium(req: Request) {
  const { user, supabase } = await requireUser(req);
  await enforcePremium(user, supabase);
  return { user, supabase };
}

/**
 * Convenience combo: `requireAIConsent` + `enforcePremium`.
 * For AI-generating functions that need both AI-processing consent AND
 * an active premium subscription (session-insight, generate-summary,
 * journal-reflect, weekly-recap).
 */
export async function requireAIConsentAndPremium(req: Request) {
  const { user, supabase } = await requireAIConsent(req);
  await enforcePremium(user, supabase);
  return { user, supabase };
}
