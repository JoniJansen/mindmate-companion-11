import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { sendLovableEmail } from 'npm:@lovable.dev/email-js'
import { SubscriptionConfirmEmail } from '../_shared/email-templates/subscription-confirm.tsx'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RevenueCat webhook event types
type RevenueCatEventType = 
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "NON_RENEWING_PURCHASE"
  | "SUBSCRIPTION_PAUSED"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "PRODUCT_CHANGE"
  | "TRANSFER";

interface RevenueCatEvent {
  type: RevenueCatEventType;
  app_user_id: string;
  original_app_user_id: string;
  product_id: string;
  entitlement_id?: string;
  entitlement_ids?: string[];
  period_type?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  environment?: string;
  store?: string;
  is_trial_conversion?: boolean;
  cancel_reason?: string;
  grace_period_expiration_at_ms?: number;
  auto_resume_at_ms?: number;
  price?: number;
  currency?: string;
  price_in_purchased_currency?: number;
}

interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatEvent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify RevenueCat webhook authorization — fail closed
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET")?.trim();
    if (!webhookSecret) {
      console.error("REVENUECAT_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.error("RevenueCat webhook: invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: RevenueCatWebhookPayload = await req.json();
    const event = payload.event;

    console.log(`RevenueCat webhook received: ${event.type}`, {
      app_user_id: event.app_user_id,
      product_id: event.product_id,
      environment: event.environment,
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from RevenueCat app_user_id (we set this to Supabase user ID during login)
    const userId = event.app_user_id || event.original_app_user_id;
    
    if (!userId || userId.startsWith("$RCAnonymousID")) {
      console.log("Skipping anonymous user event");
      return new Response(
        JSON.stringify({ success: true, message: "Skipped anonymous user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine subscription status based on event type
    let status: string;
    let cancelAtPeriodEnd = false;

    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
        status = "active";
        break;
      case "CANCELLATION":
        status = "active"; // Still active until expiration
        cancelAtPeriodEnd = true;
        break;
      case "EXPIRATION":
        status = "expired";
        break;
      case "BILLING_ISSUE":
        status = "past_due";
        break;
      case "SUBSCRIPTION_PAUSED":
        status = "paused";
        break;
      default:
        status = "active";
    }

    // Determine plan type from product ID
    let planType = "monthly";
    if (event.product_id?.includes("yearly") || event.product_id?.includes("annual")) {
      planType = "yearly";
    }

    // Build subscription data
    const subscriptionData = {
      user_id: userId,
      user_session_id: userId,
      status,
      plan_type: planType,
      current_period_start: event.purchased_at_ms 
        ? new Date(event.purchased_at_ms).toISOString() 
        : null,
      current_period_end: event.expiration_at_ms 
        ? new Date(event.expiration_at_ms).toISOString() 
        : null,
      cancel_at_period_end: cancelAtPeriodEnd,
      // Store RevenueCat identifiers
      stripe_customer_id: `rc_${event.original_app_user_id}`,
      stripe_subscription_id: `rc_${event.product_id}_${Date.now()}`,
    };

    // Upsert subscription
    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Failed to upsert subscription:", upsertError);
      throw new Error(`Database error: ${upsertError.message}`);
    }

    console.log(`Subscription updated for user ${userId}:`, {
      status,
      planType,
      cancelAtPeriodEnd,
    });

    // Send subscription confirmation email for new purchases
    if (event.type === "INITIAL_PURCHASE") {
      try {
        const { data: { user: rcUser } } = await supabase.auth.admin.getUserById(userId);
        if (rcUser?.email) {
          const apiKey = Deno.env.get("LOVABLE_API_KEY");
          if (apiKey) {
            const templateProps = {
              siteUrl: "https://soulvay.com",
              planType,
              amount: planType === "yearly" ? "79,00 €/Jahr" : "9,99 €/Monat",
            };
            const html = await renderAsync(React.createElement(SubscriptionConfirmEmail, templateProps));
            const text = await renderAsync(React.createElement(SubscriptionConfirmEmail, templateProps), { plainText: true });
            await sendLovableEmail({
              to: rcUser.email,
              from: "SOULVAY <hello@soulvay.com>",
              sender_domain: "notify.soulvay.com",
              subject: "Dein SOULVAY Plus Abo ist aktiv",
              html,
              text,
              purpose: "transactional",
              label: "subscription-confirm",
              idempotency_key: crypto.randomUUID(),
            }, { apiKey, sendUrl: Deno.env.get("LOVABLE_SEND_URL") });
            console.log("Subscription confirmation email sent to", rcUser.email);
          }
        }
      } catch (emailErr) {
        console.error("Failed to send subscription email:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${event.type} event`,
        userId,
        status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("RevenueCat webhook error:", error instanceof Error ? error.message : error);
    
    return new Response(
      JSON.stringify({ error: "Webhook processing failed.", success: false }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
