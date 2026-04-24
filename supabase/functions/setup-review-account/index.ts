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
  {
    email: Deno.env.get("TEST_ACCOUNT_STEFAN_EMAIL") || "",
    password: Deno.env.get("TEST_ACCOUNT_STEFAN_PASSWORD") || "",
    displayName: "Stefan",
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
    // Authentication: require shared secret to prevent unauthorized access
    const setupSecret = Deno.env.get("SETUP_SECRET");
    const callerSecret = req.headers.get("x-setup-secret");
    if (!setupSecret || callerSecret !== setupSecret) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Setup all review accounts
    const results = [];
    for (const account of REVIEW_ACCOUNTS) {
      if (!account.email || !account.password) {
        console.log("Skipping account with missing credentials:", JSON.stringify({ email: account.email ? "set" : "empty", password: account.password ? "set" : "empty", displayName: account.displayName }));
        results.push({ success: false, message: `Skipped ${account.displayName}: missing email or password` });
        continue;
      }
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
      JSON.stringify({ success: false, error: "Request failed. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
