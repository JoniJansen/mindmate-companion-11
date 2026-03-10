import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeSecret(value: string | undefined): string {
  let normalized = (value ?? "").trim();
  normalized = normalized.replace(/^(["'`])(.*)\1$/, "$2").trim();
  normalized = normalized.replace(/^Bearer\s+/i, "").trim();
  return normalized.replace(/\s+/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT auth
    let userId: string;
    try {
      const { user } = await requireUser(req);
      userId = user.id;
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
    }

    const { action } = await req.json();

    const rawKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeKey = normalizeSecret(rawKey);
    console.log("STRIPE_SECRET_KEY debug: raw length=", rawKey?.length, "normalized length=", stripeKey.length, "first6=", stripeKey.substring(0, 6));
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }
    if (!stripeKey.startsWith("sk_")) {
      throw new Error(`Invalid Stripe secret key format (expected sk_*), got prefix: ${stripeKey.substring(0, 8)}...`);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get subscription using user_id from JWT
    const sub = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();

    if (!sub.data) {
      return new Response(JSON.stringify({ status: "inactive", isPremium: false }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const subData = sub.data;

    // Use fetch-based Stripe API calls instead of SDK to avoid Deno.core.runMicrotasks errors
    const stripeRequest = async (method: string, path: string, body?: Record<string, string>) => {
      const url = `https://api.stripe.com/v1${path}`;
      const options: RequestInit = {
        method,
        headers: {
          "Authorization": `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };
      if (body) {
        options.body = new URLSearchParams(body).toString();
      }
      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Stripe API error: ${res.status}`);
      }
      return res.json();
    };

    switch (action) {
      case "status":
        return new Response(JSON.stringify({
          status: subData.status,
          isPremium: subData.status === "active",
          planType: subData.plan_type,
          cancelAtPeriodEnd: subData.cancel_at_period_end,
          currentPeriodEnd: subData.current_period_end,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      case "cancel": {
        if (!subData.stripe_subscription_id) throw new Error("No active subscription");
        await stripeRequest("POST", `/subscriptions/${subData.stripe_subscription_id}`, {
          cancel_at_period_end: "true",
        });
        await supabase.from("subscriptions").update({ cancel_at_period_end: true }).eq("id", subData.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "reactivate": {
        if (!subData.stripe_subscription_id) throw new Error("No subscription");
        await stripeRequest("POST", `/subscriptions/${subData.stripe_subscription_id}`, {
          cancel_at_period_end: "false",
        });
        await supabase.from("subscriptions").update({ cancel_at_period_end: false }).eq("id", subData.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "portal": {
        if (!subData.stripe_customer_id) throw new Error("No customer");
        const portal = await stripeRequest("POST", "/billing_portal/sessions", {
          customer: subData.stripe_customer_id,
          return_url: `${req.headers.get("origin")}/settings`,
        });
        return new Response(JSON.stringify({ url: portal.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Subscription error:", error);
    return new Response(JSON.stringify({ error: "Request failed. Please try again." }), 
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
