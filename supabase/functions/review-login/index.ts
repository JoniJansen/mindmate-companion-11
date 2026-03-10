import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform } = await req.json();

    // Determine which review account to use
    let email: string | undefined;
    let password: string | undefined;

    if (platform === "google") {
      email = Deno.env.get("REVIEW_ACCOUNT_GOOGLE_EMAIL")?.trim();
      password = Deno.env.get("REVIEW_ACCOUNT_GOOGLE_PASSWORD")?.trim();
    } else {
      // Default to Apple review account
      email = Deno.env.get("REVIEW_ACCOUNT_APPLE_EMAIL")?.trim();
      password = Deno.env.get("REVIEW_ACCOUNT_APPLE_PASSWORD")?.trim();
    }

    if (!email || !password) {
      console.error("Review account credentials not configured for platform:", platform);
      return new Response(
        JSON.stringify({ error: "Review account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sign in using the Supabase client with anon key (regular auth flow)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Review login failed:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Review login error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
