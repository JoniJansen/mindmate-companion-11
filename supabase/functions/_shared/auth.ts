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
