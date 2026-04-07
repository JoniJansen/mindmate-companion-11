import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Native fetch wrapper for Stripe API (avoids Deno.core.runMicrotasks crash)
function normalizeSecret(value: string | undefined): string {
  let normalized = (value ?? "").trim();
  normalized = normalized.replace(/^(["'`])(.*)\1$/, "$2").trim();
  normalized = normalized.replace(/^Bearer\s+/i, "").trim();
  return normalized.replace(/\s+/g, "");
}

async function stripeRequest(path: string, params: Record<string, string>, stripeKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Stripe API error: ${res.status}`);
  }
  return res.json();
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

    const { planType, successUrl, cancelUrl } = await req.json();

    const stripeKey = normalizeSecret(Deno.env.get("STRIPE_SECRET_KEY"));
    if (!stripeKey) throw new Error("Stripe secret key not configured");
    if (!stripeKey.startsWith("sk_")) throw new Error("Invalid Stripe secret key format (expected sk_*)");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if customer already exists
    const existingSub = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = existingSub.data?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripeRequest("/customers", {
        "metadata[user_id]": userId,
      }, stripeKey);
      customerId = customer.id;

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        user_session_id: userId,
        stripe_customer_id: customerId,
        status: "inactive",
      });
    }

    const normalizedPlanType = planType === "yearly" ? "yearly" : "monthly";
    const isYearly = normalizedPlanType === "yearly";
    const unitAmount = isYearly ? "7900" : "999";
    const interval = isYearly ? "year" : "month";
    const trialDays = isYearly ? 0 : 7;
    const description = isYearly
      ? "Jährliches Abo - Spare 2 Monate!"
      : "Monatliches Abo – 7 Tage kostenlos testen";

    const origin = req.headers.get("origin") || "https://soulvay.com";
    const finalSuccessUrl = successUrl || `${origin}/settings?success=true`;
    const finalCancelUrl = cancelUrl || `${origin}/settings?canceled=true`;

    // Build checkout session params
    // Do NOT specify payment_method_types — letting Stripe use automatic
    // payment methods so Card, Apple Pay, Google Pay, PayPal, Link, Klarna,
    // etc. appear based on device/browser/region eligibility.
    const params: Record<string, string> = {
      "customer": customerId!,
      "mode": "subscription",
      "allow_promotion_codes": "true",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": "Soulvay Plus",
      "custom_text[submit][message]": "Soulvay Plus – Dein persönlicher Begleiter",
      "line_items[0][price_data][product_data][description]": description,
      "line_items[0][price_data][unit_amount]": unitAmount,
      "line_items[0][price_data][recurring][interval]": interval,
      "line_items[0][quantity]": "1",
      "success_url": finalSuccessUrl,
      "cancel_url": finalCancelUrl,
      "metadata[user_id]": userId,
      "metadata[plan_type]": normalizedPlanType,
      "subscription_data[metadata][user_id]": userId,
      "subscription_data[metadata][plan_type]": normalizedPlanType,
      "subscription_data[description]": "Soulvay Plus",
    };

    if (trialDays > 0) {
      params["subscription_data[trial_period_days]"] = String(trialDays);
    }

    const session = await stripeRequest("/checkout/sessions", params, stripeKey);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Checkout failed. Please try again." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
