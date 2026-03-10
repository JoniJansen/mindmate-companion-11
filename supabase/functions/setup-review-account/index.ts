import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Review accounts configuration - credentials loaded from environment
const REVIEW_ACCOUNTS = [
  {
    email: Deno.env.get("REVIEW_ACCOUNT_APPLE_EMAIL") || "",
    password: Deno.env.get("REVIEW_ACCOUNT_APPLE_PASSWORD") || "",
    displayName: "Apple Reviewer",
  },
  {
    email: Deno.env.get("REVIEW_ACCOUNT_GOOGLE_EMAIL") || "",
    password: Deno.env.get("REVIEW_ACCOUNT_GOOGLE_PASSWORD") || "",
    displayName: "Google Reviewer",
  },
  {
    email: Deno.env.get("TEST_ACCOUNT_ALINA_EMAIL") || "",
    password: Deno.env.get("TEST_ACCOUNT_ALINA_PASSWORD") || "",
    displayName: "Alina",
  },
];

async function setupAccount(
  supabase: any,
  account: { email: string; password: string; displayName: string }
): Promise<{ success: boolean; message: string; userId?: string }> {
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existingUser = existingUsers.users.find(
    (u: any) => u.email === account.email
  );

  if (existingUser) {
    console.log(`Review account already exists: ${account.email} (${existingUser.id})`);

    // Ensure email is confirmed
    if (!existingUser.email_confirmed_at) {
      await supabase.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      });
      console.log("Email confirmed for", account.email);
    }

    // Ensure subscription exists
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", existingUser.id)
      .maybeSingle();

    if (!subscription) {
      await supabase.from("subscriptions").insert({
        user_id: existingUser.id,
        user_session_id: existingUser.id,
        status: "active",
        plan_type: "review",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cancel_at_period_end: false,
      });
      console.log("Created subscription for", account.email);
    }

    return {
      success: true,
      message: `Account ${account.email} already exists`,
      userId: existingUser.id,
    };
  }

  // Create new review account
  console.log("Creating new review account:", account.email);

  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { display_name: account.displayName },
    });

  if (createError) {
    throw new Error(`Failed to create ${account.email}: ${createError.message}`);
  }

  console.log("Review account created:", newUser.user.id);

  // Create profile
  await supabase.from("profiles").upsert({
    user_id: newUser.user.id,
    display_name: account.displayName,
    language: "en",
  });

  // Create permanent subscription
  await supabase.from("subscriptions").insert({
    user_id: newUser.user.id,
    user_session_id: newUser.user.id,
    status: "active",
    plan_type: "review",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
    cancel_at_period_end: false,
  });

  return {
    success: true,
    message: `Account ${account.email} created successfully`,
    userId: newUser.user.id,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Setup all review accounts
    const results = [];
    for (const account of REVIEW_ACCOUNTS) {
      const result = await setupAccount(supabase, account);
      results.push(result);
    }

    return new Response(
      JSON.stringify({ success: true, accounts: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Setup review account error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
