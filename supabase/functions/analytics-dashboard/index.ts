import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Admin role check
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, days = 30 } = await req.json();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    if (action === "funnel") {
      // Get event counts for key funnel steps
      const funnelEvents = [
        "page_view",
        "demo_chat_started",
        "demo_chat_converted",
        "onboarding_completed",
        "first_chat_sent",
        "voice_trial_started",
        "premium_cta_clicked",
        "premium_subscribed",
        "purchase_completed",
      ];

      const counts: Record<string, number> = {};

      for (const eventName of funnelEvents) {
        const { count } = await adminClient
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", eventName)
          .gte("created_at", since);
        counts[eventName] = count || 0;
      }

      // Unique sessions
      const { count: uniqueSessions } = await adminClient
        .from("analytics_events")
        .select("session_id", { count: "exact", head: true })
        .gte("created_at", since);

      // Total users (profiles)
      const { count: totalUsers } = await adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Active subscriptions
      const { count: activeSubscriptions } = await adminClient
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      return new Response(
        JSON.stringify({
          period_days: days,
          since,
          total_users: totalUsers || 0,
          unique_sessions: uniqueSessions || 0,
          active_subscriptions: activeSubscriptions || 0,
          funnel: counts,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "daily") {
      // Last N days event counts per day
      const { data: rawEvents } = await adminClient
        .from("analytics_events")
        .select("event_name, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(10000);

      const dailyMap: Record<string, Record<string, number>> = {};
      for (const e of rawEvents || []) {
        const day = e.created_at.slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = {};
        dailyMap[day][e.event_name] = (dailyMap[day][e.event_name] || 0) + 1;
      }

      return new Response(JSON.stringify({ daily: dailyMap }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use 'funnel' or 'daily'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analytics-dashboard error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
