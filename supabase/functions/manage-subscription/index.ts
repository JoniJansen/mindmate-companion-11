import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
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
    const { sessionId, action } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get subscription info
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_session_id", sessionId)
      .single();

    if (subError || !sub) {
      return new Response(
        JSON.stringify({ status: "inactive", isPremium: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different actions
    switch (action) {
      case "status": {
        // Just return current status
        const isPremium = sub.status === "active";
        return new Response(
          JSON.stringify({
            status: sub.status,
            isPremium,
            planType: sub.plan_type,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: sub.current_period_end,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel": {
        if (!sub.stripe_subscription_id) {
          throw new Error("No active subscription found");
        }

        // Cancel at period end (don't cancel immediately)
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        await supabase.from("subscriptions").update({
          cancel_at_period_end: true,
        }).eq("user_session_id", sessionId);

        return new Response(
          JSON.stringify({ success: true, message: "Subscription will cancel at period end" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reactivate": {
        if (!sub.stripe_subscription_id) {
          throw new Error("No subscription found");
        }

        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: false,
        });

        await supabase.from("subscriptions").update({
          cancel_at_period_end: false,
        }).eq("user_session_id", sessionId);

        return new Response(
          JSON.stringify({ success: true, message: "Subscription reactivated" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "portal": {
        if (!sub.stripe_customer_id) {
          throw new Error("No customer found");
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: sub.stripe_customer_id,
          return_url: `${req.headers.get("origin")}/settings`,
        });

        return new Response(
          JSON.stringify({ url: portalSession.url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Manage subscription error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
