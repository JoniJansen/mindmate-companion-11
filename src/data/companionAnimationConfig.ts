/**
 * Per-character animation tuning parameters.
 * Shared animation system with subtle personality differentiation.
 */

export interface CompanionAnimationTuning {
  /** Breathing cycle duration in seconds */
  breathDuration: number;
  /** Idle float amplitude in pixels */
  floatAmplitude: number;
  /** Float cycle duration in seconds */
  floatDuration: number;
  /** Glow warmth — maps to opacity intensity (0-1) */
  glowIntensity: number;
  /** Glow pulse duration in seconds */
  glowPulseDuration: number;
  /** Presence feel — affects overall animation energy */
  presence: "soft" | "steady" | "grounded";
}

const defaultTuning: CompanionAnimationTuning = {
  breathDuration: 5,
  floatAmplitude: 2,
  floatDuration: 6,
  glowIntensity: 0.4,
  glowPulseDuration: 4,
  presence: "steady",
};

/**
 * Per-archetype tuning overrides.
 * Characters share one animation framework but feel subtly distinct.
 */
const tuningOverrides: Record<string, Partial<CompanionAnimationTuning>> = {
  mira: {
    breathDuration: 5.5,
    floatAmplitude: 2.5,
    glowIntensity: 0.5,
    glowPulseDuration: 4.5,
    presence: "soft",
  },
  noah: {
    breathDuration: 6,
    floatAmplitude: 1.2,
    glowIntensity: 0.3,
    glowPulseDuration: 5,
    presence: "steady",
  },
  elena: {
    breathDuration: 6.5,
    floatAmplitude: 1.8,
    floatDuration: 7,
    glowIntensity: 0.35,
    glowPulseDuration: 5.5,
    presence: "soft",
  },
  kai: {
    breathDuration: 5,
    floatAmplitude: 1,
    floatDuration: 5,
    glowIntensity: 0.3,
    glowPulseDuration: 4,
    presence: "grounded",
  },
  lina: {
    breathDuration: 6,
    floatAmplitude: 2.2,
    floatDuration: 7,
    glowIntensity: 0.45,
    glowPulseDuration: 5,
    presence: "soft",
  },
  theo: {
    breathDuration: 6,
    floatAmplitude: 1.3,
    floatDuration: 6,
    glowIntensity: 0.35,
    glowPulseDuration: 4.5,
    presence: "grounded",
  },
  ava: {
    breathDuration: 4.5,
    floatAmplitude: 2.8,
    floatDuration: 5.5,
    glowIntensity: 0.45,
    glowPulseDuration: 3.5,
    presence: "steady",
  },
  jonas: {
    breathDuration: 5.5,
    floatAmplitude: 1.2,
    floatDuration: 6,
    glowIntensity: 0.3,
    glowPulseDuration: 4.5,
    presence: "grounded",
  },
  sofia: {
    breathDuration: 5.5,
    floatAmplitude: 2,
    glowIntensity: 0.45,
    glowPulseDuration: 4.5,
    presence: "soft",
  },
  arin: {
    breathDuration: 7,
    floatAmplitude: 1.5,
    floatDuration: 8,
    glowIntensity: 0.25,
    glowPulseDuration: 6,
    presence: "steady",
  },
};

export function getAnimationTuning(archetypeId: string): CompanionAnimationTuning {
  return { ...defaultTuning, ...tuningOverrides[archetypeId] };
}
