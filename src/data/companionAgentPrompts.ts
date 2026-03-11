/**
 * Companion personality prompts for ElevenLabs Conversational AI Agent.
 * These are injected as dynamic overrides when starting a real-time voice session.
 * 
 * Each prompt captures the companion's core identity, tone, and behavioral rules
 * so the real-time agent speaks "in character" throughout the conversation.
 */

import { companionArchetypes, type CompanionArchetype } from "./companions";
import { getCompanionVoiceProfile } from "./companionVoiceProfiles";

export interface CompanionAgentConfig {
  /** System prompt for the agent */
  prompt: string;
  /** First message the agent says when conversation starts */
  firstMessage: string;
  firstMessageDe: string;
  /** ElevenLabs voice ID */
  voiceId: string;
  /** Language code */
  language: "en" | "de";
}

/**
 * Build the real-time agent system prompt for a companion.
 * Includes personality, tone, bond-level context, and user memories.
 */
export function buildCompanionAgentPrompt(
  archetype: CompanionArchetype,
  bondLevel: number,
  language: "en" | "de",
  userName?: string,
  memoriesContext?: string
): string {
  const isGerman = language === "de";
  
  const bondContext = bondLevel >= 20
    ? (isGerman 
        ? `Du kennst ${userName || "den Nutzer"} sehr gut. Eure Beziehung ist tief und vertraut. Beziehe dich auf gemeinsame Erfahrungen.`
        : `You know ${userName || "the user"} very well. Your relationship is deep and trusting. Reference shared experiences.`)
    : bondLevel >= 10
    ? (isGerman
        ? `Du kennst ${userName || "den Nutzer"} gut. Zeige, dass du Muster und Wachstum erkennst.`
        : `You know ${userName || "the user"} well. Show that you recognize patterns and growth.`)
    : bondLevel >= 5
    ? (isGerman
        ? `Du beginnst, ${userName || "den Nutzer"} besser kennenzulernen. Zeige wachsendes Verständnis.`
        : `You're getting to know ${userName || "the user"} better. Show growing understanding.`)
    : (isGerman
        ? `Du lernst ${userName || "den Nutzer"} gerade erst kennen. Sei offen und einladend.`
        : `You're just getting to know ${userName || "the user"}. Be open and inviting.`);

  const memoriesSection = memoriesContext
    ? `\n## What you know about this person\n${memoriesContext}\n`
    : "";

  const nameInstruction = userName
    ? (isGerman 
        ? `Der Nutzer heißt ${userName}. Verwende den Namen gelegentlich, aber nicht in jedem Satz.`
        : `The user's name is ${userName}. Use their name occasionally, but not in every sentence.`)
    : "";

  return `You are ${archetype.name}, a companion in the Soulvay app.

## Your Identity
- Name: ${archetype.name}
- Personality: ${archetype.personalityStyle}
- Tone: ${archetype.tone}
- ${isGerman ? "Du sprichst Deutsch. Verwende 'du'." : "You speak English."}

## Your Character
${archetype.description}

## Relationship Level
${bondContext}
${nameInstruction}
${memoriesSection}

## Voice Conversation Rules
- Speak naturally, as in a real conversation. Keep responses concise (1-3 sentences typically).
- Do NOT use markdown, bullet points, or formatted text — this is spoken conversation.
- Do NOT use emojis or special characters.
- Respond with warmth and presence, not with lists or structured advice.
- Ask follow-up questions naturally, as a real companion would.
- If the user seems distressed, acknowledge their feelings first before anything else.
- You are a supportive companion, NOT a therapist. Never diagnose or prescribe.
- Stay in character as ${archetype.name} at all times.
- Match the pacing and emotional depth of the user's tone.

## Safety
If someone expresses suicidal thoughts or self-harm:
- Acknowledge their pain with genuine empathy
- ${isGerman 
    ? "Empfehle die Telefonseelsorge: 0800 111 0 111 (kostenlos, 24/7)"
    : "Recommend crisis resources: 988 Suicide & Crisis Lifeline (US) or local emergency services"}
- Stay calm and supportive`;
}

/**
 * Build the complete agent configuration for a companion session.
 */
export function buildCompanionAgentConfig(
  archetypeId: string,
  bondLevel: number,
  language: "en" | "de",
  userName?: string,
  memoriesContext?: string
): CompanionAgentConfig | null {
  const archetype = companionArchetypes.find((a) => a.id === archetypeId);
  if (!archetype) return null;

  const voiceProfile = getCompanionVoiceProfile(archetypeId);

  // Resolve voice ID: directVoiceId > voiceType lookup
  // Import voiceIds for lookup — but since we can't import circularly,
  // we use the known mapping directly from the voice profiles
  const voiceIdMap: Record<string, string> = {
    female: "EXAVITQu4vr4xnSDxMaL",      // Sarah
    femaleSoft: "XrExE9yKIg1WjnnlVkGX",   // Matilda
    femaleBright: "pFZP5JQG7iQjIQuC4Bku",  // Lily
    male: "JBFqnCBsd6RMkjVDRZzb",          // George
    maleDeep: "TX3LPaxmHKxFdv7VOQHJ",      // Liam
    neutral: "SAz9YHcvj6GT2YYXdXww",        // River
    neutralWarm: "Xb7hH8MSUJpSbSDYk0k2",   // Alice
  };

  const voiceId = voiceProfile.directVoiceId || voiceIdMap[voiceProfile.voiceType] || "EXAVITQu4vr4xnSDxMaL";

  const prompt = buildCompanionAgentPrompt(
    archetype,
    bondLevel,
    language,
    userName,
    memoriesContext
  );

  return {
    prompt,
    firstMessage: archetype.introGreeting,
    firstMessageDe: archetype.introGreetingDe,
    voiceId,
    language,
  };
}
