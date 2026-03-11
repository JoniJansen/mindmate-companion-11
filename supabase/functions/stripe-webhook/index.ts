import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { sendLovableEmail } from 'npm:@lovable.dev/email-js'
import { SubscriptionConfirmEmail } from '../_shared/email-templates/subscription-confirm.tsx'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// HMAC-SHA256 webhook signature verification (no Stripe SDK needed)
async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",").reduce((acc, part) => {
      const [key, value] = part.split("=");
      acc[key.trim()] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts["t"];
    const sig = parts["v1"];
    if (!timestamp || !sig) return false;

    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) return false;

    const payload = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expected = Array.from(new Uint8Array(signed))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expected === sig;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error("Webhook signature verification failed");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = JSON.parse(body);
    console.log("Stripe event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        if (userId) {
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            user_session_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: "active",
            plan_type: planType || "monthly",
          }, { onConflict: "user_id" });

          // Send subscription confirmation email
          try {
            const { data: { user: subUser } } = await supabase.auth.admin.getUserById(userId);
            if (subUser?.email) {
              const apiKey = Deno.env.get("LOVABLE_API_KEY");
              if (apiKey) {
                const normalizedPlan = planType === "yearly" ? "yearly" : "monthly";
                const templateProps = {
                  siteUrl: "https://soulvay.com",
                  planType: normalizedPlan,
                  amount: normalizedPlan === "yearly" ? "79,00 €/Jahr" : "9,99 €/Monat",
                };
                const html = await renderAsync(React.createElement(SubscriptionConfirmEmail, templateProps));
                const text = await renderAsync(React.createElement(SubscriptionConfirmEmail, templateProps), { plainText: true });
                await sendLovableEmail({
                  to: subUser.email,
                  from: "SOULVAY <hello@soulvay.com>",
                  sender_domain: "notify.soulvay.com",
                  subject: "Dein SOULVAY Plus Abo ist aktiv",
                  html,
                  text,
                  purpose: "transactional",
                  label: "subscription-confirm",
                  idempotency_key: crypto.randomUUID(),
                }, { apiKey, sendUrl: Deno.env.get("LOVABLE_SEND_URL") });
                console.log("Subscription confirmation email sent to", subUser.email);
              }
            }
          } catch (emailErr) {
            console.error("Failed to send subscription email:", emailErr);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const sub = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (sub.data?.user_id) {
          await supabase.from("subscriptions").update({
            status: subscription.status === "active" ? "active" : "inactive",
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("user_id", sub.data.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await supabase.from("subscriptions").update({
          status: "canceled",
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }).eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        if (invoice.billing_reason === "subscription_cycle") {
          await supabase.from("subscriptions").update({
            status: "active",
            updated_at: new Date().toISOString(),
          }).eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        await supabase.from("subscriptions").update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        }).eq("stripe_customer_id", customerId);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Request failed. Please try again." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
