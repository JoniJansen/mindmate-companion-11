/**
 * Per-companion voice personality mapping.
 * Maps archetype → ElevenLabs voice ID + speech characteristics.
 * 
 * Voice selection criteria:
 * - Mira → warm female (Matilda) — soft, gentle
 * - Sofia → warm female (Jessica) — warm, perceptive
 * - Elena → contemplative female (Lily) — serene
 * - Ava → bright curious female (Sarah) — bright
 * - Lina → neutral warm female (Alice) — patient
 * - Noah → calm male (George) — clear
 * - Jonas → structured male (Daniel) — thoughtful
 * - Kai → grounded male (Liam) — direct
 * - Theo → wise neutral (Brian) — steady
 * - Arin → minimalist neutral (River) — calm
 * 
 * Speed differentiation ensures companions feel distinct even 
 * when voice types are similar.
 */

import type { VoiceType, VoiceSpeed } from "@/hooks/useVoiceSettings";

export interface CompanionVoiceProfile {
  voiceType: VoiceType;
  /** Per-companion speed override (takes priority over global setting) */
  speedOverride?: VoiceSpeed;
  /** Direct ElevenLabs voice ID override (bypasses voiceType lookup) */
  directVoiceId?: string;
  /** Description for UI display */
  voiceLabel: string;
  voiceLabelDe: string;
}

const companionVoiceProfiles: Record<string, CompanionVoiceProfile> = {
  mira: {
    voiceType: "femaleSoft",
    // Matilda — XrExE9yKIg1WjnnlVkGX
    voiceLabel: "Warm & gentle",
    voiceLabelDe: "Warm & sanft",
  },
  noah: {
    voiceType: "male",
    // George — JBFqnCBsd6RMkjVDRZzb
    speedOverride: 0.9,
    voiceLabel: "Calm & clear",
    voiceLabelDe: "Ruhig & klar",
  },
  elena: {
    voiceType: "femaleBright",
    // Lily — pFZP5JQG7iQjIQuC4Bku
    speedOverride: 0.9,
    voiceLabel: "Serene & reflective",
    voiceLabelDe: "Ruhig & reflektierend",
  },
  kai: {
    voiceType: "maleDeep",
    // Liam — TX3LPaxmHKxFdv7VOQHJ
    voiceLabel: "Grounded & direct",
    voiceLabelDe: "Geerdet & direkt",
  },
  lina: {
    voiceType: "neutralWarm",
    // Alice — Xb7hH8MSUJpSbSDYk0k2
    speedOverride: 0.9,
    voiceLabel: "Soft & patient",
    voiceLabelDe: "Sanft & geduldig",
  },
  theo: {
    // Brian — nPczCjzI2devNBz1zQrb (wise, steady male)
    voiceType: "neutral",
    directVoiceId: "nPczCjzI2devNBz1zQrb",
    speedOverride: 0.9,
    voiceLabel: "Wise & steady",
    voiceLabelDe: "Weise & beständig",
  },
  ava: {
    voiceType: "female",
    // Sarah — EXAVITQu4vr4xnSDxMaL
    speedOverride: 1.1,
    voiceLabel: "Bright & curious",
    voiceLabelDe: "Aufgeweckt & neugierig",
  },
  jonas: {
    // Daniel — onwK4e9ZLuTAKqWW03F9 (structured male)
    voiceType: "male",
    directVoiceId: "onwK4e9ZLuTAKqWW03F9",
    voiceLabel: "Structured & thoughtful",
    voiceLabelDe: "Strukturiert & durchdacht",
  },
  sofia: {
    // Jessica — cgSgspJ2msm6clMCkdW9 (warm female, distinct from Mira's Matilda)
    voiceType: "femaleSoft",
    directVoiceId: "cgSgspJ2msm6clMCkdW9",
    voiceLabel: "Warm & perceptive",
    voiceLabelDe: "Warm & einfühlsam",
  },
  arin: {
    voiceType: "neutral",
    // River — SAz9YHcvj6GT2YYXdXww (androgynous)
    speedOverride: 0.9,
    voiceLabel: "Calm & minimal",
    voiceLabelDe: "Ruhig & minimalistisch",
  },
};

export function getCompanionVoiceProfile(archetypeId: string): CompanionVoiceProfile {
  return companionVoiceProfiles[archetypeId] || companionVoiceProfiles.mira;
}
