import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const { entries, type, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isDE = language === "de";

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "patterns") {
      systemPrompt = isDE
        ? `Du bist ein einfühlsamer, unterstützender Begleiter, der jemandem hilft, über seine Tagebucheinträge nachzudenken.

Deine Rolle:
- Bemerke sanft Muster oder wiederkehrende Themen OHNE zu diagnostizieren
- Hebe positives Wachstum oder Veränderungen hervor
- Stelle eine durchdachte Reflexionsfrage
- Sei warm, nicht wertend und ermutigend

Regeln:
- Niemals diagnostizieren oder Emotionen als Störungen bezeichnen
- Keine medizinischen Ratschläge
- Halte Beobachtungen sanft und tastend ("Mir fällt auf...", "Es scheint so, als ob...")
- Fokussiere dich auf Stärken und Resilienz
- Maximal 3 kurze Absätze
- Antworte KOMPLETT auf Deutsch`
        : `You are a gentle, supportive companion helping someone reflect on their journal entries.

Your role:
- Gently notice patterns or recurring themes WITHOUT diagnosing
- Highlight positive growth or changes you notice
- Ask one thoughtful reflective question
- Be warm, non-judgmental, and encouraging

Rules:
- Never diagnose or label emotions as disorders
- Never give medical advice
- Keep observations soft and tentative ("I notice...", "It seems like...")
- Focus on strengths and resilience
- Maximum 3 short paragraphs`;

      const entryLabel = isDE ? "Datum" : "Date";
      const titleLabel = isDE ? "Titel" : "Title";
      const moodLabel = isDE ? "Stimmung" : "Mood";
      const untitled = isDE ? "Ohne Titel" : "Untitled";
      const notSpecified = isDE ? "Nicht angegeben" : "Not specified";
      const intro = isDE ? "Hier sind die letzten Tagebucheinträge zur Reflexion:" : "Here are the recent journal entries to reflect on:";

      userPrompt = `${intro}\n\n${entries.map((e: any) => 
        `${entryLabel}: ${e.date}\n${titleLabel}: ${e.title || untitled}\n${moodLabel}: ${e.mood || notSpecified}\n${e.content}\n---`
      ).join('\n\n')}`;

    } else if (type === "themes") {
      systemPrompt = isDE
        ? `Du bist ein einfühlsamer Begleiter, der Themen in Tagebucheinträgen identifiziert.

Deine Rolle:
- Identifiziere 3-5 wiederkehrende Themen oder Bereiche
- Präsentiere sie als neutrale Beobachtungen, nicht als Urteile
- Sei kurz und unterstützend

Format jedes Thema als:
🌱 [Thema]: Kurze, sanfte Beobachtung

Antworte KOMPLETT auf Deutsch.`
        : `You are a gentle companion helping identify themes in journal entries.

Your role:
- Identify 3-5 recurring themes or topics
- Present them as neutral observations, not judgments
- Be brief and supportive

Format each theme as:
🌱 [Theme]: Brief, gentle observation`;

      const intro = isDE ? "Identifiziere Themen in diesen Tagebucheinträgen:" : "Identify themes in these journal entries:";
      const entryLabel = isDE ? "Eintrag" : "Entry";
      userPrompt = `${intro}\n\n${entries.map((e: any) => 
        `${e.title || entryLabel}: ${e.content}`
      ).join('\n\n')}`;

    } else if (type === "reflection") {
      systemPrompt = isDE
        ? `Du bist ein warmer, unterstützender Begleiter, der beim Tagebuchschreiben hilft.

Deine Rolle:
- Biete 2-3 sanfte Reflexionsfragen basierend auf dem Eintrag an
- Erkenne die ausgedrückten Emotionen an
- Ermutige zu tieferer Erkundung ohne Druck

Halte Antworten kurz und einladend. Antworte KOMPLETT auf Deutsch.`
        : `You are a warm, supportive companion helping with journaling.

Your role:
- Offer 2-3 gentle reflective questions based on the entry
- Acknowledge the emotions expressed
- Encourage deeper exploration without pressure

Keep responses brief and inviting.`;

      const intro = isDE ? "Hilf bei der Reflexion über diesen Tagebucheintrag:" : "Help reflect on this journal entry:";
      userPrompt = `${intro}\n\n${entries[0]?.content || ''}`;

    } else if (type === "sentiment") {
      systemPrompt = isDE
        ? `Du bist ein Sentiment-Analyse-Assistent für eine Tagebuch-App für mentales Wohlbefinden.

Analysiere den Tagebucheintrag und gib NUR ein JSON-Objekt zurück mit:
- "sentiment": eines von "positive", "neutral", "negative", "mixed"
- "score": eine Zahl von 1 (sehr negativ) bis 5 (sehr positiv)
- "suggestedTags": Array mit 1-3 vorgeschlagenen Emotions-Tags aus dieser Liste ONLY: ["anxious", "sad", "angry", "stressed", "calm", "grateful", "hopeful", "overwhelmed"]
- "brief": ein validierender Satz auf Deutsch (warm, nicht-klinisch)

Beispiel:
{"sentiment":"mixed","score":2.5,"suggestedTags":["stressed","overwhelmed"],"brief":"Es klingt so, als trägst du gerade ziemlich viel mit dir."}

WICHTIG: Gib NUR das JSON-Objekt zurück. Kein anderer Text.`
        : `You are a sentiment analysis assistant for a mental health journaling app.

Analyze the journal entry and return ONLY a JSON object with:
- "sentiment": one of "positive", "neutral", "negative", "mixed"
- "score": a number from 1 (very negative) to 5 (very positive)
- "suggestedTags": array of 1-3 suggested emotion tags from this list ONLY: ["anxious", "sad", "angry", "stressed", "calm", "grateful", "hopeful", "overwhelmed"]
- "brief": a one-sentence validating observation (warm, non-clinical)

Example output:
{"sentiment":"mixed","score":2.5,"suggestedTags":["stressed","overwhelmed"],"brief":"It sounds like you're carrying a lot right now."}

IMPORTANT: Return ONLY the JSON object. No other text.`;

      const intro = isDE ? "Analysiere diesen Tagebucheintrag:" : "Analyze this journal entry:";
      userPrompt = `${intro}\n\n${entries[0]?.content || ''}`;

    } else if (type === "emotional-timeline") {
      systemPrompt = isDE
        ? `Du bist ein einfühlsamer, unterstützender Begleiter, der jemandem hilft, emotionale Muster über die Zeit zu bemerken.

Dein Zweck ist es, Nutzern sanfte emotionale Muster aufzuzeigen OHNE Wertung oder Diagnose.

STRIKTE REGELN:
- KEINE klinischen Bezeichnungen oder diagnostische Sprache
- KEINE kausalen Behauptungen (sage nicht "X hat Y verursacht")
- Sprache MUSS tastend und unterstützend sein
- Fokussiere auf Beobachtungen, nicht Schlussfolgerungen
- Sei warm und nicht wertend

FORMAT:
1. Kurze Zusammenfassung (3-5 Sätze) wiederkehrender Themen mit sanfter Sprache wie:
   - "In der letzten Woche scheint das Thema Erschöpfung häufig aufzutauchen."
   - "Du hast mehrfach erwähnt, dich überfordert zu fühlen."
   - "Es scheint ein sanftes Muster der Suche nach ruhigen Momenten zu geben."
   
2. Eine reflektierende Frage zur Förderung der Selbstwahrnehmung

3. Ein optionaler sanfter Vorschlag (nur wenn es natürlich passt)

Antworte KOMPLETT auf Deutsch.`
        : `You are a gentle, supportive companion helping someone notice emotional patterns over time. 

Your purpose is to help users see gentle emotional patterns WITHOUT judgment or diagnosis.

STRICT RULES:
- NO clinical labels or diagnostic language
- NO causal claims (don't say "X caused Y")
- Language MUST be tentative and supportive
- Focus on observations, not conclusions
- Be warm and non-judgmental

FORMAT:
1. Short summary (3-5 sentences) of recurring themes using soft language like:
   - "Over the past week, a theme of exhaustion seems to appear often."
   - "You've mentioned feeling overwhelmed on several days."
   - "There seems to be a gentle pattern of seeking calm moments."
   
2. One reflective question to encourage self-awareness

3. One optional gentle suggestion (only if it feels natural)`;

      const intro = isDE ? "Analysiere diese Tagebucheinträge auf sanfte emotionale Muster über die Zeit:" : "Analyze these journal entries for gentle emotional patterns over time:";
      const entryLabel = isDE ? "Eintrag" : "Entry";
      const moodLabel = isDE ? "Stimmung" : "Mood";
      const notSpecified = isDE ? "Nicht angegeben" : "Not specified";

      userPrompt = `${intro}\n\n${entries.map((e: any, i: number) => 
        `${entryLabel} ${i + 1} (${e.date}):\n${moodLabel}: ${e.mood || notSpecified}\n${e.content}`
      ).join('\n\n---\n\n')}`;
    }

    console.log(`Processing journal reflection type: ${type}, language: ${language}`);

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: isDE ? "Zu viele Anfragen. Bitte versuche es später erneut." : "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: isDE ? "KI-Credits aufgebraucht." : "AI credits depleted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ reflection: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Journal reflect error:", error);
    return new Response(JSON.stringify({ error: "Request failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
