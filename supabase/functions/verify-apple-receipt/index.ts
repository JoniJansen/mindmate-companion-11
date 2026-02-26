import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Apple's receipt verification endpoints
const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

interface AppleReceiptResponse {
  status: number;
  environment?: string;
  receipt?: {
    bundle_id: string;
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date_ms: string;
      expires_date_ms?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date_ms: string;
    expires_date_ms?: string;
  }>;
  pending_renewal_info?: Array<{
    auto_renew_status: string;
    product_id: string;
  }>;
}

async function verifyWithApple(receiptData: string, isProduction: boolean): Promise<AppleReceiptResponse> {
  const url = isProduction ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL;
  const appSharedSecret = Deno.env.get("APPLE_SHARED_SECRET") || "";
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receiptData,
      "password": appSharedSecret,
      "exclude-old-transactions": true,
    }),
  });
  
  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user from JWT - userId derived from token, not request body
    const { user } = await requireUser(req);
    const userId = user.id;

    const { receiptData } = await req.json();

    if (!receiptData) {
      throw new Error("Receipt data is required");
    }

    // First try production, if status 21007 it's a sandbox receipt
    let appleResponse = await verifyWithApple(receiptData, true);
    
    // Status 21007 means this is a sandbox receipt
    if (appleResponse.status === 21007) {
      console.log("Sandbox receipt detected, verifying with sandbox...");
      appleResponse = await verifyWithApple(receiptData, false);
    }

    console.log("Apple verification status:", appleResponse.status);

    // Status 0 means valid receipt
    if (appleResponse.status !== 0) {
      const errorMessages: Record<number, string> = {
        21000: "App Store could not read the receipt",
        21002: "Receipt data was malformed",
        21003: "Receipt could not be authenticated",
        21004: "Shared secret does not match",
        21005: "Receipt server is currently unavailable",
        21006: "Receipt is valid but subscription has expired",
        21008: "Receipt is from production but sent to sandbox",
        21010: "This receipt could not be authorized",
      };
      
      throw new Error(errorMessages[appleResponse.status] || `Unknown error: ${appleResponse.status}`);
    }

    // Get the latest subscription info
    const latestReceipt = appleResponse.latest_receipt_info?.[0];
    const pendingRenewal = appleResponse.pending_renewal_info?.[0];
    
    if (!latestReceipt) {
      throw new Error("No subscription found in receipt");
    }

    // Check if subscription is active
    const expiresDate = latestReceipt.expires_date_ms 
      ? new Date(parseInt(latestReceipt.expires_date_ms)) 
      : null;
    
    const isActive = expiresDate ? expiresDate > new Date() : false;
    const autoRenewStatus = pendingRenewal?.auto_renew_status === "1";

    // Determine plan type from product ID
    const productId = latestReceipt.product_id;
    let planType = "monthly";
    if (productId.includes("yearly") || productId.includes("annual")) {
      planType = "yearly";
    }

    // Update subscription in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const subscriptionData = {
      user_id: userId,
      user_session_id: userId,
      status: isActive ? "active" : "expired",
      plan_type: planType,
      current_period_start: new Date(parseInt(latestReceipt.purchase_date_ms)).toISOString(),
      current_period_end: expiresDate?.toISOString() || null,
      cancel_at_period_end: !autoRenewStatus,
      // Store Apple-specific identifiers
      stripe_customer_id: `apple_${latestReceipt.original_transaction_id}`,
      stripe_subscription_id: `apple_txn_${latestReceipt.transaction_id}`,
    };

    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Database upsert error:", upsertError);
      throw new Error("Failed to update subscription");
    }

    return new Response(
      JSON.stringify({
        success: true,
        isActive,
        expiresDate: expiresDate?.toISOString(),
        productId,
        planType,
        autoRenewStatus,
        environment: appleResponse.environment,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Apple receipt verification error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
