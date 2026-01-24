import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client to verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the requesting user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if the user is an admin using direct query with service role
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "list-users": {
        // Get all users from auth.users
        const { data: users, error } = await adminClient.auth.admin.listUsers({
          page: params.page || 1,
          perPage: params.perPage || 50,
        });

        if (error) throw error;

        // Get all subscriptions
        const { data: subscriptions } = await adminClient
          .from("subscriptions")
          .select("*");

        // Get all profiles
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("*");

        // Map users with their subscription and profile data
        const enrichedUsers = users.users.map((u) => {
          const sub = subscriptions?.find((s) => s.user_id === u.id);
          const profile = profiles?.find((p) => p.user_id === u.id);
          return {
            id: u.id,
            email: u.email,
            displayName: profile?.display_name || null,
            isPremium: sub?.status === "active",
            planType: sub?.plan_type || null,
            subscriptionStatus: sub?.status || "inactive",
            currentPeriodEnd: sub?.current_period_end || null,
            createdAt: u.created_at,
          };
        });

        return new Response(JSON.stringify({ users: enrichedUsers, total: users.users.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set-premium": {
        const { targetUserId, isPremium, planType = "yearly" } = params;

        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "targetUserId required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if subscription exists
        const { data: existingSub } = await adminClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", targetUserId)
          .single();

        if (isPremium) {
          const subscriptionData = {
            user_id: targetUserId,
            user_session_id: "admin-granted",
            status: "active",
            plan_type: planType,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false,
          };

          if (existingSub) {
            const { error } = await adminClient
              .from("subscriptions")
              .update(subscriptionData)
              .eq("user_id", targetUserId);
            if (error) throw error;
          } else {
            const { error } = await adminClient
              .from("subscriptions")
              .insert(subscriptionData);
            if (error) throw error;
          }
        } else {
          // Revoke premium
          if (existingSub) {
            const { error } = await adminClient
              .from("subscriptions")
              .update({
                status: "canceled",
                cancel_at_period_end: true,
              })
              .eq("user_id", targetUserId);
            if (error) throw error;
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "search-users": {
        const { query } = params;

        if (!query || query.length < 2) {
          return new Response(JSON.stringify({ users: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Search in auth.users by email
        const { data: allUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        
        const filteredUsers = allUsers?.users.filter(
          (u) => u.email?.toLowerCase().includes(query.toLowerCase())
        ) || [];

        // Get subscriptions and profiles for filtered users
        const userIds = filteredUsers.map((u) => u.id);
        
        const { data: subscriptions } = await adminClient
          .from("subscriptions")
          .select("*")
          .in("user_id", userIds);

        const { data: profiles } = await adminClient
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        const enrichedUsers = filteredUsers.map((u) => {
          const sub = subscriptions?.find((s) => s.user_id === u.id);
          const profile = profiles?.find((p) => p.user_id === u.id);
          return {
            id: u.id,
            email: u.email,
            displayName: profile?.display_name || null,
            isPremium: sub?.status === "active",
            planType: sub?.plan_type || null,
            subscriptionStatus: sub?.status || "inactive",
            currentPeriodEnd: sub?.current_period_end || null,
            createdAt: u.created_at,
          };
        });

        return new Response(JSON.stringify({ users: enrichedUsers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Admin function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
