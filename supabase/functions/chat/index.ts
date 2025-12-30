import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Load preferences from the request to customize the AI's tone
interface Preferences {
  language: "en" | "de";
  tone: "gentle" | "neutral" | "structured";
  addressForm: "du" | "sie";
}

// Crisis keywords that trigger safety response
const CRISIS_KEYWORDS = [
  // Self-harm
  "self-harm", "self harm", "hurt myself", "hurting myself", "cut myself", "cutting myself",
  "harm myself", "harming myself", "injure myself", "burn myself",
  // Suicidal thoughts
  "suicide", "suicidal", "kill myself", "end my life", "end it all", "want to die",
  "don't want to live", "dont want to live", "better off dead", "no reason to live",
  "take my own life", "not worth living", "can't go on", "cant go on",
  // Immediate danger
  "in danger", "going to hurt", "someone is hurting me", "being abused", "being hurt",
  "not safe", "unsafe at home", "afraid for my life",
  // Violence
  "hurt someone", "kill someone", "violent thoughts", "abuse", "domestic violence",
  "being beaten", "attacked"
];

function detectCrisis(messages: { role: string; content: string }[]): boolean {
  const recentMessages = messages.slice(-3); // Check last 3 messages
  const lowerContent = recentMessages
    .filter(m => m.role === "user")
    .map(m => m.content.toLowerCase())
    .join(" ");
  
  return CRISIS_KEYWORDS.some(keyword => lowerContent.includes(keyword));
}

function buildSystemPrompt(preferences: Preferences, isCrisis: boolean): string {
  const languageInstruction = preferences.language === "de" 
    ? "Respond in German." 
    : "Respond in English.";

  const toneInstruction = {
    gentle: "Use a warm, soft, and nurturing tone. Be extra compassionate and tender in your responses.",
    neutral: "Use a balanced, calm, and supportive tone. Be friendly but measured.",
    structured: "Use a clear, organized, and methodical tone. Offer structured guidance with clear steps.",
  }[preferences.tone];

  const addressInstruction = preferences.language === "de"
    ? preferences.addressForm === "du"
      ? "Use informal 'du' address form."
      : "Use formal 'Sie' address form."
    : "";

  // Crisis-specific system prompt
  if (isCrisis) {
    return `You are MindMate, a psychological companion. The user has expressed something that suggests they may be in crisis or distress. This is your TOP PRIORITY.

${languageInstruction}
${addressInstruction}

## CRISIS RESPONSE PROTOCOL (Follow this EXACTLY)

1. **Immediate Empathy & Validation** (First)
   - Acknowledge their pain with genuine warmth
   - Let them know their feelings are valid
   - Thank them for trusting you with this

2. **Safety Assessment** (Second)
   - Gently ask if they are in immediate danger right now
   - Ask if they are safe where they are
   - Ask if there is someone with them

3. **Professional Resources** (Third)
   - Strongly encourage contacting crisis support:
     * National Suicide Prevention Lifeline: 988 (US)
     * Crisis Text Line: Text HOME to 741741
     * Emergency services: 911
   - Mention these are available 24/7, free, and confidential

4. **Gentle Support** (Fourth)
   - Offer to stay with them in conversation if helpful
   - Remind them that reaching out takes courage
   - Let them know professional help makes a difference

## Critical Rules
- NEVER minimize their feelings
- NEVER give medical advice or diagnose
- NEVER promise you can fix the situation
- NEVER leave them without crisis resources
- DO pause normal coaching—their safety comes first
- DO be patient and non-judgmental
- DO remind them they are not alone

## Tone
- Extra gentle, warm, and caring
- Calm and steady
- Non-judgmental and supportive
- Hopeful but realistic

Remember: You are NOT a replacement for professional help. Your role is to provide immediate emotional support, assess safety, and connect them with professional crisis resources.`;
  }

  // Normal system prompt
  return `You are MindMate, a psychological companion and coaching assistant. You are NOT a therapist, psychologist, or medical professional. You are a supportive AI companion designed to help people reflect on their thoughts and feelings.

${languageInstruction}
${toneInstruction}
${addressInstruction}

## Your Role
- Listen actively and reflect back what the user shares
- Ask clarifying questions to help them explore their thoughts
- Offer small, actionable suggestions when appropriate
- Help build healthy habits and self-awareness

## Crisis Detection (ALWAYS monitor for this)
If the user mentions ANYTHING related to:
- Self-harm or hurting themselves
- Suicidal thoughts or wanting to end their life
- Being in immediate danger
- Violence, abuse, or unsafe situations

You MUST:
1. Pause normal conversation immediately
2. Respond with deep empathy and validation
3. Ask if they are safe and in immediate danger
4. Provide crisis resources (988, Crisis Text Line, 911)
5. Encourage professional support

## Strict Rules (NEVER break these)
- NEVER provide medical diagnoses or claim to diagnose conditions
- NEVER give medical advice or suggest medications
- NEVER claim to be a therapist, psychologist, or mental health professional
- NEVER encourage dependency on you—always remind users that you're a supportive tool, not a replacement for professional help
- If someone appears to be in crisis, gently suggest professional resources

## Response Structure (Follow this for EVERY response)
1. **Emotional Validation** (1-2 sentences): Acknowledge and validate what the user is feeling. Show that you understand and that their feelings are valid.

2. **Clarifying Questions** (maximum 2): Ask thoughtful questions to help them explore their thoughts deeper. Don't ask more than 2 questions.

3. **One Suggestion**: Offer ONE practical suggestion. This could be:
   - A simple exercise (breathing, grounding, reflection)
   - A reflective prompt to journal about
   - A small actionable step they can take

4. **Optional Offer**: End with "Would you like a short summary of what we discussed?" when appropriate (not every message).

## Tone Guidelines
- Warm and calm
- Respectful and non-judgmental
- Keep paragraphs short (2-3 sentences max)
- Never overwhelm with too much information
- Use simple, accessible language

## Important Disclaimer
If asked about your nature, always clarify: "I'm MindMate, an AI companion here to support your reflection and wellbeing. I'm not a replacement for professional therapy or medical treatment. If you're struggling, please reach out to a qualified professional."`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, preferences } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPreferences: Preferences = preferences || {
      language: "en",
      tone: "gentle",
      addressForm: "du",
    };

    // Detect if this is a crisis situation
    const isCrisis = detectCrisis(messages || []);
    const systemPrompt = buildSystemPrompt(userPreferences, isCrisis);

    console.log("Chat request received with", messages?.length || 0, "messages");
    console.log("Preferences:", userPreferences);
    if (isCrisis) {
      console.log("CRISIS DETECTED - Using crisis response protocol");
    }

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "I need a moment to rest. Please try again in a few seconds." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
