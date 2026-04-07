import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user } = await requireUser(req);
    const userId = user.id;

    const { messages, conversation_id, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!messages || messages.length < 6) {
      return new Response(JSON.stringify({ insight: null, reason: "not_enough_messages" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if insight already exists for this conversation
    if (conversation_id) {
      const { data: existing } = await supabase
        .from("session_insights")
        .select("id")
        .eq("user_id", userId)
        .eq("conversation_id", conversation_id)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ insight: null, reason: "already_exists" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const isDE = language === "de";
    const conversationText = messages
      .filter((m: any) => m.role === "user")
      .map((m: any) => m.content)
      .join("\n\n");

    const systemPrompt = isDE
      ? `Du bist ein einfühlsamer Begleiter. Generiere EINE EINZIGE reflektive Beobachtung basierend auf dem Gespräch.

Die Beobachtung sollte:
- Etwas Tiefgründiges hervorheben, das der Nutzer geteilt hat
- Sanft und nicht-wertend formuliert sein
- Zum Nachdenken anregen
- Maximal 2 Sätze lang sein

Beginne mit Formulierungen wie:
- "Was aus diesem Gespräch heraussticht, ist..."
- "Ein Thema, das sich durchzieht, ist..."
- "Etwas, das mir auffällt, ist..."

Antworte NUR mit dem Beobachtungstext. Kein JSON, kein Markdown, keine Überschriften.`
      : `You are a gentle companion. Generate ONE SINGLE reflective observation based on the conversation.

The observation should:
- Highlight something meaningful the user shared
- Be gentle and non-judgmental
- Invite further reflection
- Be maximum 2 sentences

Start with phrases like:
- "Something that stands out from this conversation is..."
- "A theme that runs through what you shared is..."
- "What I notice is..."

Respond ONLY with the observation text. No JSON, no markdown, no headers.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: isDE
            ? `Generiere eine Beobachtung für dieses Gespräch:\n\n${conversationText}`
            : `Generate an observation for this conversation:\n\n${conversationText}` },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(JSON.stringify({ insight: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const insightText = (data.choices?.[0]?.message?.content || "").trim();

    if (!insightText || insightText.length < 10) {
      return new Response(JSON.stringify({ insight: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to database
    const { error } = await supabase.from("session_insights").insert({
      user_id: userId,
      conversation_id: conversation_id || null,
      insight_text: insightText,
    });

    if (error) console.error("Insert insight error:", error);

    console.log(`Session insight generated for user ${userId}`);

    return new Response(JSON.stringify({ insight: insightText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Session insight error:", error);
    return new Response(JSON.stringify({ insight: null, error: "Failed to generate insight" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
