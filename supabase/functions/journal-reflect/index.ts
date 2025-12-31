import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entries, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "patterns") {
      systemPrompt = `You are a gentle, supportive companion helping someone reflect on their journal entries.

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

      userPrompt = `Here are the recent journal entries to reflect on:\n\n${entries.map((e: any) => 
        `Date: ${e.date}\nTitle: ${e.title || 'Untitled'}\nMood: ${e.mood || 'Not specified'}\n${e.content}\n---`
      ).join('\n\n')}`;
    } else if (type === "themes") {
      systemPrompt = `You are a gentle companion helping identify themes in journal entries.

Your role:
- Identify 3-5 recurring themes or topics
- Present them as neutral observations, not judgments
- Be brief and supportive

Format each theme as:
🌱 [Theme]: Brief, gentle observation`;

      userPrompt = `Identify themes in these journal entries:\n\n${entries.map((e: any) => 
        `${e.title || 'Entry'}: ${e.content}`
      ).join('\n\n')}`;
    } else if (type === "reflection") {
      systemPrompt = `You are a warm, supportive companion helping with journaling.

Your role:
- Offer 2-3 gentle reflective questions based on the entry
- Acknowledge the emotions expressed
- Encourage deeper exploration without pressure

Keep responses brief and inviting.`;

      userPrompt = `Help reflect on this journal entry:\n\n${entries[0]?.content || ''}`;
    } else if (type === "emotional-timeline") {
      systemPrompt = `You are a gentle, supportive companion helping someone notice emotional patterns over time. 

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

3. One optional gentle suggestion (only if it feels natural)

Example output:
"Looking at your recent entries, a gentle theme of needing rest seems to emerge. You've mentioned feeling tired on a few occasions, and there's a sense of wanting more quiet moments. It's completely natural to feel this way, especially during busy periods.

What do you notice about the times when you felt most at peace?

If it feels right, you might consider setting aside a few minutes each day just for stillness—even just five minutes can make a difference."`;

      userPrompt = `Analyze these journal entries for gentle emotional patterns over time:\n\n${entries.map((e: any, i: number) => 
        `Entry ${i + 1} (${e.date}):\nMood: ${e.mood || 'Not specified'}\n${e.content}`
      ).join('\n\n---\n\n')}`;
    }

    console.log(`Processing journal reflection type: ${type}`);

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
