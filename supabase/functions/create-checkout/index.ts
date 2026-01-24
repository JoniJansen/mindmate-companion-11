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
    const { userId, sessionId, planType, successUrl, cancelUrl } = await req.json();

    // Support both userId (new) and sessionId (legacy)
    const userIdentifier = userId || sessionId;
    
    if (!userIdentifier) {
      throw new Error("User ID is required");
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

    // Check if customer already exists (try user_id first, then user_session_id)
    let existingSub = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userIdentifier)
      .maybeSingle();

    if (!existingSub.data) {
      existingSub = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_session_id", userIdentifier)
        .maybeSingle();
    }

    let customerId = existingSub.data?.stripe_customer_id;

    // Create new customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          user_id: userIdentifier,
        },
      });
      customerId = customer.id;

      // Create subscription record
      await supabase.from("subscriptions").upsert({
        user_id: userIdentifier,
        user_session_id: userIdentifier,
        stripe_customer_id: customerId,
        status: "inactive",
      });
    }

    // Define price based on plan type
    // Monthly: €9.99/month with 7-day free trial
    // Yearly: €79/year (no trial - already discounted)
    const priceConfig = planType === "yearly" 
      ? { unit_amount: 7900, interval: "year" as const, trial_days: 0 }
      : { unit_amount: 999, interval: "month" as const, trial_days: 7 };

    // Create checkout session with trial for monthly plan
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card", "sepa_debit", "paypal"],
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "MindMate Plus",
              description: planType === "yearly" 
                ? "Jährliches Abo - Spare 2 Monate!" 
                : "Monatliches Abo – 7 Tage kostenlos testen",
            },
            unit_amount: priceConfig.unit_amount,
            recurring: {
              interval: priceConfig.interval,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: priceConfig.trial_days > 0 
        ? { trial_period_days: priceConfig.trial_days }
        : undefined,
      success_url: successUrl || `${req.headers.get("origin")}/settings?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/settings?canceled=true`,
      metadata: {
        user_id: userIdentifier,
        plan_type: planType,
      },
    });

    return new Response(
      JSON.stringify({ url: checkoutSession.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
