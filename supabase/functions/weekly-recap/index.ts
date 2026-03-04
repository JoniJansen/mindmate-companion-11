import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    // JWT auth
    try {
      await requireUser(req);
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
    }

    const { mood_checkins, journal_entries, time_range, language } = await req.json() as RequestBody;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const moodSummary = mood_checkins.length > 0
      ? `Mood check-ins (${mood_checkins.length} entries):\n${mood_checkins.map(m => `- ${new Date(m.created_at).toLocaleDateString()}: Mood ${m.mood_value}/5, Feelings: ${m.feelings.join(", ") || "none noted"}${m.note ? `, Note: "${m.note}"` : ""}`).join("\n")}`
      : "No mood check-ins available.";

    const journalSummary = journal_entries.length > 0
      ? `Journal entries (${journal_entries.length} entries):\n${journal_entries.map(e => `- ${new Date(e.created_at).toLocaleDateString()}${e.title ? ` "${e.title}"` : ""}: "${e.content.substring(0, 200)}..."`).join("\n")}`
      : "No journal entries available.";

    const timeRangeText = time_range === "7d" ? "the last 7 days" : time_range === "14d" ? "the last 14 days" : "the last 30 days";

    const systemPrompt = language === "de" 
      ? `Du bist ein einfühlsamer Begleiter, der emotionale Daten mit Wärme und Zurückhaltung analysiert.

SPRACHSTIL:
- Beobachtend, niemals diagnostisch ("Du scheinst..." statt "Du hast...")
- Zusammenhängend erzählend, nicht nur Aufzählungen
- Weniger ist mehr: maximal 3-5 Muster
- Zahlen nur wenn bedeutsam (nicht "3 Mal diese Woche" sondern "wiederholt")
- Vorschlagen, nicht vorschreiben ("Vielleicht..." statt "Du solltest...")
- Schwierigkeiten anerkennen ohne zu dramatisieren
- Mit sanfter Vorwärtsbewegung enden

STRIKTE REGELN:
- NIEMALS klinische Begriffe oder Diagnosen
- KEINE medizinischen Ratschläge
- Bei besorgniserregenden Mustern sanft erwähnen, dass professionelle Unterstützung hilfreich sein könnte

Antworte IMMER im folgenden JSON-Format:
{
  "patterns": ["Beobachtung 1", "Beobachtung 2", "Beobachtung 3"],
  "potential_needs": ["Mögliches Bedürfnis 1", "Mögliches Bedürfnis 2"],
  "suggested_next_step": "Ein sanfter, druckloser Vorschlag",
  "summary_bullets": ["Zusammenhängender Absatz der die Woche reflektiert, 3-4 Sätze"]
}`
      : `You are an empathetic companion analyzing emotional data with warmth and restraint.

LANGUAGE STYLE:
- Observational, never diagnostic ("You seem to..." not "You have...")
- Coherent narrative, not just bullet lists
- Less is more: 3-5 patterns maximum
- Numbers only if meaningful (not "3 times this week" but "repeatedly")
- Suggest, don't prescribe ("Perhaps..." not "You should...")
- Acknowledge difficulty without dramatizing
- End with gentle forward momentum

STRICT RULES:
- NEVER use clinical terms or diagnoses
- NO medical advice
- If data shows concerning patterns, gently mention that professional support might be helpful

ALWAYS respond in the following JSON format:
{
  "patterns": ["Observation 1", "Observation 2", "Observation 3"],
  "potential_needs": ["Potential need 1", "Potential need 2"],
  "suggested_next_step": "A gentle, pressure-free suggestion",
  "summary_bullets": ["A coherent paragraph reflecting on the week, 3-4 sentences"]
}`;

    const userPrompt = language === "de"
      ? `Analysiere die folgenden Daten aus ${timeRangeText} und erstelle einen sanften Wochenrückblick:\n\n${moodSummary}\n\n${journalSummary}`
      : `Analyze the following data from ${timeRangeText} and create a gentle weekly recap:\n\n${moodSummary}\n\n${journalSummary}`;

    console.log("Generating weekly recap for", time_range);

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

    let recap;
    try {
      recap = JSON.parse(content);
    } catch {
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
