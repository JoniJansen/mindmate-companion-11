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

    const { language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather data from multiple sources
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [moodResult, journalResult, memoriesResult, insightsResult] = await Promise.all([
      supabase.from("mood_checkins").select("mood_value, feelings, created_at").eq("user_id", userId).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(30),
      supabase.from("journal_entries").select("content, mood, tags, created_at").eq("user_id", userId).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(20),
      supabase.from("user_memories").select("memory_type, content, confidence_score").eq("user_id", userId).order("confidence_score", { ascending: false }).limit(15),
      supabase.from("session_insights").select("insight_text, created_at").eq("user_id", userId).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(10),
    ]);

    const moods = moodResult.data || [];
    const journals = journalResult.data || [];
    const memories = memoriesResult.data || [];
    const insights = insightsResult.data || [];

    if (moods.length < 3 && journals.length < 2) {
      return new Response(JSON.stringify({ patterns: [], reason: "not_enough_data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataContext = [
      moods.length > 0 ? `Mood check-ins (${moods.length}):\n${moods.map((m: any) => `${new Date(m.created_at).toLocaleDateString()}: ${m.mood_value}/5, feelings: ${(m.feelings || []).join(", ")}`).join("\n")}` : "",
      journals.length > 0 ? `Journal entries (${journals.length}):\n${journals.map((j: any) => `${new Date(j.created_at).toLocaleDateString()}: ${j.content.substring(0, 150)}...`).join("\n")}` : "",
      memories.length > 0 ? `Known themes:\n${memories.map((m: any) => `[${m.memory_type}] ${m.content}`).join("\n")}` : "",
      insights.length > 0 ? `Recent session insights:\n${insights.map((i: any) => i.insight_text).join("\n")}` : "",
    ].filter(Boolean).join("\n\n---\n\n");

    const isDE = language === "de";
    const systemPrompt = isDE
      ? `Du bist ein sanfter Mustererkennungs-Assistent. Analysiere die Daten und identifiziere 2-4 emotionale Muster.

Regeln:
- Formuliere beobachtend, NIEMALS diagnostisch
- Verwende sanfte Sprache ("Es scheint...", "Ein mögliches Muster...")
- Keine klinischen Begriffe
- Fokussiere auf wiederkehrende Themen, nicht auf Bewertungen

Antworte mit einem JSON-Array. Jedes Element:
- "type": eines von "stress_cycle", "emotional_pattern", "recurring_theme", "positive_trend", "concern"
- "description": sanfte Beobachtung (1-2 Sätze, Deutsch)
- "confidence": 0.3-1.0

Antworte NUR mit dem JSON-Array.`
      : `You are a gentle pattern recognition assistant. Analyze the data and identify 2-4 emotional patterns.

Rules:
- Use observational language, NEVER diagnostic
- Use gentle language ("It seems...", "A possible pattern...")
- No clinical terms
- Focus on recurring themes, not judgments

Respond with a JSON array. Each element:
- "type": one of "stress_cycle", "emotional_pattern", "recurring_theme", "positive_trend", "concern"
- "description": gentle observation (1-2 sentences)
- "confidence": 0.3-1.0

Respond ONLY with the JSON array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: dataContext },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(JSON.stringify({ patterns: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "[]";

    let patterns: any[];
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      patterns = JSON.parse(cleaned);
    } catch {
      patterns = [];
    }

    if (!Array.isArray(patterns) || patterns.length === 0) {
      return new Response(JSON.stringify({ patterns: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clear old patterns and insert new ones
    await supabase.from("emotional_patterns").delete().eq("user_id", userId);

    const toInsert = patterns.slice(0, 5).map((p: any) => ({
      user_id: userId,
      pattern_type: p.type || "recurring_theme",
      description: String(p.description).substring(0, 500),
      confidence: Math.min(1, Math.max(0.3, Number(p.confidence) || 0.5)),
    }));

    await supabase.from("emotional_patterns").insert(toInsert);

    console.log(`Detected ${toInsert.length} patterns for user ${userId}`);

    return new Response(JSON.stringify({ patterns: toInsert }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Pattern detection error:", error);
    return new Response(JSON.stringify({ patterns: [], error: "Pattern detection failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
