import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT auth - get user_id from token
    let userId: string;
    try {
      const { user } = await requireUser(req);
      userId = user.id;
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
    }

    const { action } = await req.json();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
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

    switch (action) {
      case "status":
        return new Response(JSON.stringify({
          status: subData.status,
          isPremium: subData.status === "active",
          planType: subData.plan_type,
          cancelAtPeriodEnd: subData.cancel_at_period_end,
          currentPeriodEnd: subData.current_period_end,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      case "cancel":
        if (!subData.stripe_subscription_id) throw new Error("No active subscription");
        await stripe.subscriptions.update(subData.stripe_subscription_id, { cancel_at_period_end: true });
        await supabase.from("subscriptions").update({ cancel_at_period_end: true }).eq("id", subData.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      case "reactivate":
        if (!subData.stripe_subscription_id) throw new Error("No subscription");
        await stripe.subscriptions.update(subData.stripe_subscription_id, { cancel_at_period_end: false });
        await supabase.from("subscriptions").update({ cancel_at_period_end: false }).eq("id", subData.id);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      case "portal":
        if (!subData.stripe_customer_id) throw new Error("No customer");
        const portal = await stripe.billingPortal.sessions.create({
          customer: subData.stripe_customer_id,
          return_url: `${req.headers.get("origin")}/settings`,
        });
        return new Response(JSON.stringify({ url: portal.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), 
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
