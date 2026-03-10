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

    const { content, source, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing memories to avoid duplicates
    const { data: existingMemories } = await supabase
      .from("user_memories")
      .select("content, memory_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const existingContext = (existingMemories || [])
      .map((m: any) => `[${m.memory_type}] ${m.content}`)
      .join("\n");

    const isDE = language === "de";

    const systemPrompt = isDE
      ? `Du bist ein Gedächtnisextraktor für eine Companion-App. Analysiere den folgenden Text und extrahiere wichtige persönliche Kontextinformationen.\n\nExtrahiere NUR bedeutsame, wiederkehrende oder wichtige Informationen wie:\n- Stressquellen (Arbeit, Beziehungen, Gesundheit)\n- Wichtige Lebensthemen oder Entscheidungen\n- Emotionale Muster oder wiederkehrende Gefühle\n- Ziele oder Wünsche\n\nBereits gespeicherte Erinnerungen (NICHT duplizieren):\n${existingContext || "Keine"}\n\nAntworte NUR mit einem JSON-Array. Jedes Element hat:\n- "type": eines von "theme", "stressor", "goal", "context"\n- "content": kurzer, klarer Satz (max 15 Wörter)\n- "confidence": Zahl 0.5-1.0\n\nWenn nichts Bedeutsames gefunden wird, antworte mit leerem Array: []\nAntworte NUR mit dem JSON-Array.`
      : `You are a memory extractor for a companion app. Analyze the following text and extract important personal context.\n\nExtract ONLY meaningful, recurring, or important information such as:\n- Stress sources (work, relationships, health)\n- Important life topics or decisions\n- Emotional patterns or recurring feelings\n- Goals or aspirations\n\nAlready stored memories (DO NOT duplicate):\n${existingContext || "None"}\n\nRespond ONLY with a JSON array. Each element has:\n- "type": one of "theme", "stressor", "goal", "context"\n- "content": short, clear sentence (max 15 words)\n- "confidence": number 0.5-1.0\n\nIf nothing meaningful is found, respond with empty array: []\nRespond ONLY with the JSON array.`;

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
          { role: "user", content: `Source: ${source}\n\n${content}` },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(JSON.stringify({ extracted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "[]";

    let memories: any[];
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      memories = JSON.parse(cleaned);
    } catch {
      memories = [];
    }

    if (!Array.isArray(memories) || memories.length === 0) {
      return new Response(JSON.stringify({ extracted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert new memories (max 5 per extraction)
    const toInsert = memories.slice(0, 5).map((m: any) => ({
      user_id: userId,
      memory_type: ["theme", "stressor", "goal", "context"].includes(m.type) ? m.type : "context",
      content: String(m.content).substring(0, 200),
      confidence_score: Math.min(1, Math.max(0.3, Number(m.confidence) || 0.7)),
    }));

    const { error } = await supabase.from("user_memories").insert(toInsert);
    if (error) console.error("Insert error:", error);

    // Keep max 50 memories per user — prune oldest if exceeded
    const { count } = await supabase
      .from("user_memories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (count && count > 50) {
      const { data: oldest } = await supabase
        .from("user_memories")
        .select("id")
        .eq("user_id", userId)
        .order("confidence_score", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(count - 50);

      if (oldest && oldest.length > 0) {
        await supabase
          .from("user_memories")
          .delete()
          .in("id", oldest.map((o: any) => o.id));
      }
    }

    console.log(`Extracted ${toInsert.length} memories for user ${userId}`);

    return new Response(JSON.stringify({ extracted: toInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extract memories error:", error);
    return new Response(JSON.stringify({ error: "Memory extraction failed", extracted: 0 }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
