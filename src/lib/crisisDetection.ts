/**
 * Deterministic crisis detection — client-side, no network, no model.
 *
 * WHY THIS EXISTS
 * Crisis support used to depend entirely on the language model: the server
 * detected a crisis, swapped the system prompt, and *asked Gemini* to name the
 * helplines. If the gateway was slow, rate-limited or down, the user in crisis
 * got "Something went wrong. Please try again." The same gap opened for anyone
 * who had not granted AI consent, was offline, or used the demo chat.
 *
 * This module is the floor beneath that. It runs locally, in the browser, on
 * every text surface, before any gate.
 *
 * The patterns themselves live in `supabase/functions/_shared/crisisPatterns.ts`
 * so that the edge functions and this layer cannot drift apart — they did once,
 * and the server silently stopped recognising the most common German phrasing
 * while a string-comparing test stayed green.
 */

import {
  detectCrisisIn,
  type CrisisResult,
  type CrisisSeverity,
  HIGH_SEVERITY_PATTERNS,
  MEDIUM_SEVERITY_PATTERNS,
  STRONG_NEGATION_PATTERNS,
  PAST_TENSE_PATTERNS,
} from "../../supabase/functions/_shared/crisisPatterns";

export type { CrisisResult, CrisisSeverity };
export {
  HIGH_SEVERITY_PATTERNS,
  MEDIUM_SEVERITY_PATTERNS,
  STRONG_NEGATION_PATTERNS,
  PAST_TENSE_PATTERNS,
};

/** Detects crisis signals in a single text or a list of texts. */
export function detectCrisis(input: string | string[]): CrisisResult {
  return detectCrisisIn(input);
}
