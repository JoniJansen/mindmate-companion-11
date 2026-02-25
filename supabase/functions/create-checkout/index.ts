import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT auth - get user_id from token, not from body
    let userId: string;
    try {
      const { user } = await requireUser(req);
      userId = user.id;
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
    }

    const { planType, successUrl, cancelUrl } = await req.json();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if customer already exists
    let existingSub = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = existingSub.data?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        user_session_id: userId,
        stripe_customer_id: customerId,
        status: "inactive",
      });
    }

    const priceConfig = planType === "yearly" 
      ? { unit_amount: 7900, interval: "year" as const, trial_days: 0 }
      : { unit_amount: 999, interval: "month" as const, trial_days: 7 };

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Soulvay Plus",
              description: planType === "yearly" 
                ? "Jährliches Abo - Spare 2 Monate!" 
                : "Monatliches Abo – 7 Tage kostenlos testen",
            },
            unit_amount: priceConfig.unit_amount,
            recurring: { interval: priceConfig.interval },
          },
          quantity: 1,
        },
      ],
      subscription_data: priceConfig.trial_days > 0 
        ? { trial_period_days: priceConfig.trial_days }
        : undefined,
      success_url: successUrl || `${req.headers.get("origin")}/settings?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/settings?canceled=true`,
      metadata: { user_id: userId, plan_type: planType },
    });

    return new Response(
      JSON.stringify({ url: checkoutSession.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
