import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    try {
      await requireUser(req);
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
    }

    const { messages, language = "en" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!messages || messages.length < 2) {
      return new Response(
        JSON.stringify({ error: "Not enough conversation to summarize" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating summary for", messages.length, "messages, language:", language);

    const conversationText = messages
      .map((m: Message) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = language === "de"
      ? `Du bist ein einfühlsamer Begleiter für mentales Wohlbefinden, der ein Gespräch analysiert und eine hilfreiche Zusammenfassung erstellt.

Erstelle eine JSON-Antwort mit folgender Struktur:
{
  "summary": "Eine warme Zusammenfassung in 2-3 Sätzen darüber, was die Person geteilt und besprochen hat",
  "emotionalThemes": ["Thema 1", "Thema 2", "Thema 3"],
  "nextStep": "Ein kleiner, umsetzbarer und ermutigender nächster Schritt",
  "moodProgression": {
    "start": "Emoji für die Anfangsstimmung",
    "end": "Emoji für die Endstimmung",
    "insight": "Kurze Einschätzung zur Stimmungsveränderung"
  }
}

Richtlinien:
- Sei warm, mitfühlend und bestärkend
- Identifiziere 2-4 emotionale Themen (z.B. "Stressbewältigung", "Selbstmitgefühl", "Grenzen setzen")
- Der nächste Schritt sollte klein, machbar und konkret sein
- Verwende passende Emojis für die Stimmung (😔😟😐🙂😊😌🥲💭)
- Fokussiere dich auf die Erfahrung der Person, nicht auf die KI-Antworten
- Halte alles prägnant und umsetzbar
- Antworte KOMPLETT auf Deutsch

Antworte NUR mit gültigem JSON, kein Markdown oder zusätzlicher Text.`
      : `You are a compassionate mental wellness assistant analyzing a conversation to create a helpful summary for the user.

Your task is to generate a JSON response with the following structure:
{
  "summary": "A warm, 2-3 sentence summary of what the user shared and discussed",
  "emotionalThemes": ["theme1", "theme2", "theme3"],
  "nextStep": "One small, actionable, encouraging next step the user can take",
  "moodProgression": {
    "start": "emoji representing initial mood",
    "end": "emoji representing ending mood",
    "insight": "Brief insight about the mood shift"
  }
}

Guidelines:
- Be warm, compassionate, and validating
- Identify 2-4 emotional themes (e.g., "stress management", "self-compassion", "boundary setting")
- The next step should be small, achievable, and specific
- Use appropriate emojis for mood (😔😟😐🙂😊😌🥲💭)
- Focus on the user's experience, not the AI's responses
- Keep everything concise and actionable

Respond ONLY with valid JSON, no markdown or additional text.`;

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
          { role: "user", content: language === "de"
            ? `Bitte analysiere dieses Gespräch und erstelle eine Zusammenfassung auf Deutsch:\n\n${conversationText}`
            : `Please analyze this conversation and generate a summary:\n\n${conversationText}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: language === "de" ? "Bitte warte einen Moment und versuche es erneut." : "Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: language === "de" ? "Dienst vorübergehend nicht verfügbar." : "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: language === "de" ? "Zusammenfassung konnte nicht erstellt werden." : "Failed to generate summary." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    let summary;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      summary = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse summary JSON:", parseError, "Content:", content);
      summary = language === "de" ? {
        summary: "Danke, dass du heute mit mir geteilt hast. Unser Gespräch hat wichtige Themen berührt.",
        emotionalThemes: ["Reflexion", "Selbstwahrnehmung"],
        nextStep: "Nimm dir einen Moment, um darüber nachzudenken, was dich aus unserem Gespräch am meisten berührt hat.",
        moodProgression: {
          start: "💭",
          end: "🙂",
          insight: "Du hast dir Zeit genommen, deine Gedanken und Gefühle zu erkunden."
        }
      } : {
        summary: "Thank you for sharing with me today. Our conversation touched on important topics.",
        emotionalThemes: ["reflection", "self-awareness"],
        nextStep: "Take a few moments to reflect on what resonated with you most from our chat.",
        moodProgression: {
          start: "💭",
          end: "🙂",
          insight: "You took time to explore your thoughts and feelings."
        }
      };
    }

    console.log("Summary generated successfully");

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Summary generation error:", error);
    return new Response(
      JSON.stringify({ error: "Summary generation failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
