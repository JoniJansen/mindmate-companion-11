/**
 * Per-companion voice personality mapping.
 * Maps archetype → ElevenLabs voice ID + speech characteristics.
 * 
 * Voice selection criteria:
 * - Mira, Lina, Sofia → warm female (Matilda / Sarah)
 * - Elena → contemplative female (Lily)
 * - Ava → bright curious female (Sarah)
 * - Noah, Jonas → calm male (George)
 * - Kai, Theo → grounded male (Liam)
 * - Arin → androgynous neutral (River)
 */

import type { VoiceType } from "@/hooks/useVoiceSettings";

export interface CompanionVoiceProfile {
  voiceType: VoiceType;
  /** Description for UI display */
  voiceLabel: string;
  voiceLabelDe: string;
}

const companionVoiceProfiles: Record<string, CompanionVoiceProfile> = {
  mira: {
    voiceType: "femaleSoft",
    voiceLabel: "Warm & gentle",
    voiceLabelDe: "Warm & sanft",
  },
  noah: {
    voiceType: "male",
    voiceLabel: "Calm & clear",
    voiceLabelDe: "Ruhig & klar",
  },
  elena: {
    voiceType: "femaleBright",
    voiceLabel: "Serene & reflective",
    voiceLabelDe: "Ruhig & reflektierend",
  },
  kai: {
    voiceType: "maleDeep",
    voiceLabel: "Grounded & direct",
    voiceLabelDe: "Geerdet & direkt",
  },
  lina: {
    voiceType: "femaleSoft",
    voiceLabel: "Soft & patient",
    voiceLabelDe: "Sanft & geduldig",
  },
  theo: {
    voiceType: "maleDeep",
    voiceLabel: "Wise & steady",
    voiceLabelDe: "Weise & beständig",
  },
  ava: {
    voiceType: "female",
    voiceLabel: "Bright & curious",
    voiceLabelDe: "Aufgeweckt & neugierig",
  },
  jonas: {
    voiceType: "male",
    voiceLabel: "Structured & thoughtful",
    voiceLabelDe: "Strukturiert & durchdacht",
  },
  sofia: {
    voiceType: "neutralWarm",
    voiceLabel: "Warm & perceptive",
    voiceLabelDe: "Warm & einfühlsam",
  },
  arin: {
    voiceType: "neutral",
    voiceLabel: "Calm & minimal",
    voiceLabelDe: "Ruhig & minimalistisch",
  },
};

export function getCompanionVoiceProfile(archetypeId: string): CompanionVoiceProfile {
  return companionVoiceProfiles[archetypeId] || companionVoiceProfiles.mira;
}
