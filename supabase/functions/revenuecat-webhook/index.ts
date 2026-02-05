import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("RevenueCat webhook error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
