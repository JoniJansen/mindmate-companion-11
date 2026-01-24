import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MoodCheckin {
  mood_value: number;
  feelings: string[];
  note?: string;
  created_at: string;
}

interface JournalEntry {
  content: string;
  mood?: string;
  title?: string;
  created_at: string;
}

interface RequestBody {
  mood_checkins: MoodCheckin[];
  journal_entries: JournalEntry[];
  time_range: "7d" | "14d" | "30d";
  language: "en" | "de";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood_checkins, journal_entries, time_range, language } = await req.json() as RequestBody;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Combine data for analysis
    const moodSummary = mood_checkins.length > 0
      ? `Mood check-ins (${mood_checkins.length} entries):
${mood_checkins.map(m => `- ${new Date(m.created_at).toLocaleDateString()}: Mood ${m.mood_value}/5, Feelings: ${m.feelings.join(", ") || "none noted"}${m.note ? `, Note: "${m.note}"` : ""}`).join("\n")}`
      : "No mood check-ins available.";

    const journalSummary = journal_entries.length > 0
      ? `Journal entries (${journal_entries.length} entries):
${journal_entries.map(e => `- ${new Date(e.created_at).toLocaleDateString()}${e.title ? ` "${e.title}"` : ""}: "${e.content.substring(0, 200)}..."`).join("\n")}`
      : "No journal entries available.";

    const timeRangeText = time_range === "7d" ? "the last 7 days" : time_range === "14d" ? "the last 14 days" : "the last 30 days";

    const systemPrompt = language === "de" 
      ? `Du bist ein einfühlsamer psychologischer Begleiter, der Muster in emotionalen Daten analysiert.

STRIKTE REGELN:
- Verwende NIEMALS klinische Begriffe oder Diagnosen
- Formuliere IMMER beobachtend, nicht bewertend
- Sei sanft und unterstützend
- Biete keine medizinischen Ratschläge an
- Wenn die Daten besorgniserregende Muster zeigen (z.B. anhaltend niedrige Stimmung), erwähne sanft, dass professionelle Unterstützung hilfreich sein könnte

Antworte IMMER im folgenden JSON-Format:
{
  "patterns": ["Beobachtung 1", "Beobachtung 2", "Beobachtung 3"],
  "potential_needs": ["Mögliches Bedürfnis 1", "Mögliches Bedürfnis 2"],
  "suggested_next_step": "Ein konkreter, sanfter Vorschlag",
  "summary_bullets": ["Zusammenfassungspunkt 1", "Punkt 2", "Punkt 3"]
}`
      : `You are an empathetic psychological companion analyzing emotional data patterns.

STRICT RULES:
- NEVER use clinical terms or diagnoses
- ALWAYS phrase observations neutrally, not judgmentally
- Be gentle and supportive
- Do not provide medical advice
- If data shows concerning patterns (e.g., persistently low mood), gently mention that professional support might be helpful

ALWAYS respond in the following JSON format:
{
  "patterns": ["Observation 1", "Observation 2", "Observation 3"],
  "potential_needs": ["Potential need 1", "Potential need 2"],
  "suggested_next_step": "A specific, gentle suggestion",
  "summary_bullets": ["Summary point 1", "Point 2", "Point 3"]
}`;

    const userPrompt = language === "de"
      ? `Analysiere die folgenden Daten aus ${timeRangeText} und erstelle einen sanften Wochenrückblick:

${moodSummary}

${journalSummary}

Erstelle 3-5 beobachtete Muster (neutral formuliert), 2 mögliche Bedürfnisse (nicht-präskriptiv), 1 vorgeschlagenen nächsten Schritt (Toolbox-Übung oder Thema-Pfad), und 3-6 Zusammenfassungspunkte.`
      : `Analyze the following data from ${timeRangeText} and create a gentle weekly recap:

${moodSummary}

${journalSummary}

Create 3-5 observed patterns (neutrally phrased), 2 potential needs (non-prescriptive), 1 suggested next step (Toolbox exercise or Topic path), and 3-6 summary bullets.`;

    console.log("Generating weekly recap for", time_range, "with", mood_checkins.length, "moods and", journal_entries.length, "entries");

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
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate recap." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    // Parse JSON response
    let recap;
    try {
      recap = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recap = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    return new Response(
      JSON.stringify({
        patterns: recap.patterns || [],
        potential_needs: recap.potential_needs || [],
        suggested_next_step: recap.suggested_next_step || "",
        summary_bullets: recap.summary_bullets || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Weekly recap error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
