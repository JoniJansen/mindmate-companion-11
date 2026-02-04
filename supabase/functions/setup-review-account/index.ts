import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Review account credentials
const REVIEW_EMAIL = "apple-review@mindmate.de";
const REVIEW_PASSWORD = "MindMate2026Review!";
const REVIEW_DISPLAY_NAME = "Apple Reviewer";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if review account already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find(u => u.email === REVIEW_EMAIL);

    if (existingUser) {
      console.log("Review account already exists:", existingUser.id);
      
      // Ensure email is confirmed
      if (!existingUser.email_confirmed_at) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error("Error confirming email:", updateError);
        } else {
          console.log("Email confirmed for review account");
        }
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
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
        });
        console.log("Created subscription for existing review account");
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Review account already exists",
          userId: existingUser.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new review account
    console.log("Creating new review account...");
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: REVIEW_EMAIL,
      password: REVIEW_PASSWORD,
      email_confirm: true, // Auto-confirm email - no verification needed!
      user_metadata: {
        display_name: REVIEW_DISPLAY_NAME,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log("Review account created:", newUser.user.id);

    // Create profile for review user
    const { error: profileError } = await supabase.from("profiles").upsert({
      user_id: newUser.user.id,
      display_name: REVIEW_DISPLAY_NAME,
      language: "en",
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // Create permanent subscription for review user
    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: newUser.user.id,
      user_session_id: newUser.user.id,
      status: "active",
      plan_type: "review",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
    });

    if (subError) {
      console.error("Error creating subscription:", subError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Review account created successfully",
        userId: newUser.user.id,
        email: REVIEW_EMAIL,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Setup review account error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
