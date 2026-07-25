/**
 * Mood → Exercise bridge logic.
 *
 * After a low-mood check-in we gently offer one matching exercise from the
 * toolbox (auto-start via location.state.startExercise). Pure frontend
 * mapping — kept as a plain module so it stays unit-testable.
 */

/** Mood values at or below this are considered a strained check-in (1–5 scale). */
export const LOW_MOOD_THRESHOLD = 2;

export function shouldOfferExercise(moodValue: number): boolean {
  return moodValue <= LOW_MOOD_THRESHOLD;
}

/**
 * Picks the exercise that best fits the reported feelings.
 * Feelings arrive as stable tag IDs (see FEELING_TAG_IDS in tagUtils).
 * Returns null when the mood isn't low — no offer in that case.
 */
export function getRecommendedExerciseId(moodValue: number, feelings: string[]): string | null {
  if (!shouldOfferExercise(moodValue)) return null;

  // Acute anxiety → sensory grounding brings you back to the present
  if (feelings.includes("anxious")) return "grounding-54321";

  // Stress/overwhelm → long exhale calms the nervous system
  if (feelings.includes("stressed") || feelings.includes("overwhelmed")) return "breathing-478";

  // Exhaustion → gentle body scan instead of effortful breathing
  if (feelings.includes("tired")) return "body-scan";

  // Default: the quick, low-barrier breathing exercise
  return "breathing-60";
}
