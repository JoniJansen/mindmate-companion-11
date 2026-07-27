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
 * every text surface, before any gate. The model may still add warmth and
 * context on top — it must never be the only thing standing between a person
 * and a phone number.
 *
 * TUNING RULE — read before editing any pattern below:
 * False negatives are the risk. False positives are acceptable.
 * Showing a helpline to somebody who was talking about a work deadline is a
 * small annoyance. Not showing one to somebody who needed it is not. When in
 * doubt, widen the pattern.
 *
 * Patterns are kept in sync with the server-side copy in
 * `supabase/functions/chat/index.ts` — see the sync test in
 * `src/test/crisis-detection.test.ts`.
 */

export type CrisisSeverity = "none" | "low" | "medium" | "high";

export interface CrisisResult {
  detected: boolean;
  severity: CrisisSeverity;
  /** Source of the matched pattern — for tests and diagnostics, never shown to users. */
  matchedSignal?: string;
}

/**
 * High severity: direct, unambiguous statements of intent to die or self-harm.
 */
export const HIGH_SEVERITY_PATTERNS: readonly RegExp[] = [
  // — English —
  /\b(i\s+want\s+to\s+(die|kill\s+myself|end\s+(my\s+life|it\s+all)))\b/i,
  /\b(i('m|\s+am)\s+going\s+to\s+(kill|hurt|harm)\s+myself)\b/i,
  /\b(i\s+have\s+a\s+(plan|method)\s+to\s+(die|kill|end))\b/i,
  /\b(take\s+my\s+own\s+life)\b/i,
  /\b(suicid(e|al)\s+(thoughts?|ideation|plan|attempt|note))\b/i,
  /\b(i('m|\s+am)\s+suicidal)\b/i,
  /\b(i\s+(don'?t|do\s+not)\s+want\s+to\s+wake\s+up)\b/i,
  /\b(i\s+want\s+it\s+all\s+to\s+(stop|end))\b/i,
  // — German —
  /\b(nicht\s+mehr\s+leben\s+wollen)\b/i,
  /\b(mich\s+umbringen)\b/i,
  /\b(mich\s+umzubringen)\b/i,
  /\b(ich\s+will\s+sterben)\b/i,
  /\b(ich\s+möchte\s+sterben)\b/i,
  /\b(lebensmüde)\b/i,
  // Filler words ("einfach", "gar") sit between the parts in spoken language
  // and in voice transcripts, so they are allowed for.
  /\bich\s+will\s+(einfach\s+|gar\s+)*nicht\s+mehr\s+leben\b/i,
  /\b(nicht\s+mehr\s+aufwachen)\b/i,
  /\b(schluss\s+machen\s+mit\s+allem)\b/i,
  /\bmir\s+das\s+leben\s+(zu\s+)?nehmen\b/i,
  /\b(für\s+immer\s+schlafen)\b/i,
];

/**
 * Medium severity: strong distress, hopelessness, self-harm, or danger from
 * others. Concerning enough to surface help, but more context-dependent.
 */
export const MEDIUM_SEVERITY_PATTERNS: readonly RegExp[] = [
  // — English —
  /\b(don'?t\s+want\s+to\s+live)\b/i,
  /\b(no\s+reason\s+to\s+live)\b/i,
  /\b(not\s+worth\s+living)\b/i,
  /\b(can'?t\s+go\s+on)\b/i,
  /\b(can'?t\s+do\s+this\s+anymore)\b/i,
  /\b(better\s+off\s+(dead|without\s+me))\b/i,
  /\b((everyone|people|they)\s+would\s+be\s+better\s+off\s+without\s+me)\b/i,
  /\b(hurting\s+myself)\b/i,
  /\b(self[- ]?harm(ing)?)\b/i,
  /\b(cutting\s+myself)\b/i,
  /\b(burn(ing)?\s+myself)\b/i,
  /\b(afraid\s+for\s+my\s+life)\b/i,
  /\b(being\s+(abused|beaten|attacked))\b/i,
  /\b(domestic\s+violence)\b/i,
  /\b(someone\s+is\s+hurting\s+me)\b/i,
  /\b(unsafe\s+at\s+home)\b/i,
  // — German —
  /\b(keinen\s+sinn\s+mehr)\b/i,
  /\b(mir\s+selbst\s+(weh\s+tun|schaden))\b/i,
  /\b(ritze|ritzen|geritzt)\b/i,
  // "ich kann nicht mehr" standing alone is a distress signal; followed by a
  // concrete verb it is usually a complaint ("... mehr schlafen"). The lookahead
  // keeps the signal without firing on every sleep or appetite problem.
  /\bich\s+kann\s+nicht\s+mehr(?!\s+(schlafen|einschlafen|essen|trinken|arbeiten|lernen|laufen|rennen|sehen|hören|lesen|schreiben))\b/i,
  /\b(kein\s+bock\s+mehr\s+auf\s+alles)\b/i,
  /\b(wenn\s+ich\s+nicht\s+mehr\s+da\s+wäre)\b/i,
  /\b(ohne\s+mich\s+(wären|sind)\s+alle\s+besser\s+dran)\b/i,
  /\b(alles\s+(beenden|hinschmeißen\s+für\s+immer))\b/i,
  /\b(will\s+einfach\s+nur\s+noch\s+weg)\b/i,
  /\b(halte\s+das\s+nicht\s+mehr\s+aus)\b/i,
  /\b(ich\s+habe\s+angst\s+um\s+mein\s+leben)\b/i,
  // One intervening word covers "werde zuhause geschlagen", "werde oft geschlagen".
  /\bwerde\s+(\w+\s+)?(geschlagen|missbraucht|bedroht)\b/i,
];

/**
 * Negation and idiom patterns that CANCEL a nearby match.
 *
 * Two jobs: past-tense references ("I used to cut myself") and figures of
 * speech that borrow the vocabulary of dying ("this deadline is killing me").
 * They only cancel a match that sits close by — see `isNegationProximate`.
 */
export const STRONG_NEGATION_PATTERNS: readonly RegExp[] = [
  // — Explicit negation —
  /\b(i\s+(don'?t|do\s+not)\s+want\s+to\s+(hurt|harm|kill)\s+myself)\b/i,
  /\b(i('m|\s+am)\s+not\s+(suicidal|going\s+to))\b/i,
  /\b(ich\s+bin\s+nicht\s+suizidal)\b/i,
  // — English idioms —
  /\b(cut\s+myself\s+some\s+slack)\b/i,
  /\b(dead\s+(tired|serious|line))\b/i,
  /\b(killing\s+it)\b/i,
  /\b(died\s+(laughing|of\s+laughter))\b/i,
  /\b(drop[- ]?dead\s+gorgeous)\b/i,
  /\b(i('d|\s+would|\s+could)\s+kill\s+for\s+a)\b/i,
  /\b(it'?s\s+killing\s+me\s+(that|how))\b/i,
  /\b(dying\s+to\s+(see|know|hear|try))\b/i,
  /\b(kill\s+(the|this|that|a)\s+(process|task|job|server|build|feature|branch|ticket))\b/i,
  // — German idioms —
  /\b(bringt\s+mich\s+(noch\s+)?um)\b/i,
  /\b(killt\s+mich)\b/i,
  /\b(totlachen|totgelacht)\b/i,
  /\b(sterbenslangweilig)\b/i,
  /\b(sterben\s+vor\s+(scham|langeweile|lachen|neugier))\b/i,
  /\b(bring(e|t)?\s+(das|den|die)\s+\w+\s+um)\b/i,
];

/**
 * Past-tense markers. These describe *when* something happened, not whether it
 * is true — so they are weaker than the strong list above and can be overridden
 * by a marker that swings the sentence back to the present (see ADVERSATIVE).
 */
export const TEMPORAL_NEGATION_PATTERNS: readonly RegExp[] = [
  /\b(i\s+used\s+to\s+(self[- ]?harm|cut|hurt\s+myself))\b/i,
  /\b(no\s+longer)\b/i,
  /\b(in\s+the\s+past)\b/i,
  /\b(years?\s+ago)\b/i,
  /\b(früher\s+(mal\s+)?(ge)?(ritzt|schnitten|habe))\b/i,
  /\b(nicht\s+mehr\s+so)\b/i,
  /\b(ist\s+lange\s+her)\b/i,
  /\b(damals)\b/i,
];

/**
 * Words that swing a sentence from "back then" to "right now".
 *
 * Without this, "früher habe ich mich geritzt, das ist lange her — aber gerade
 * will ich mich umbringen" would be silently dismissed as a historical account,
 * because the past-tense marker sits within reach of the present-tense
 * statement. That is the single most dangerous false negative this layer can
 * produce, so a contrast marker between the two cancels the cancellation.
 */
const ADVERSATIVE_MARKERS =
  /\b(aber|jedoch|allerdings|trotzdem|jetzt|gerade|heute|inzwischen|mittlerweile|seit\s+kurzem|but|however|now|today|lately|currently|this\s+(week|time))\b/i;

/** How far (in characters) a negation may sit from a match and still cancel it. */
const PROXIMITY_CHARS = 50;

/**
 * Normalises text before matching.
 *
 * Voice transcripts arrive without punctuation, in lower case, and sometimes
 * with doubled spaces or typographic apostrophes. Patterns are written against
 * plain lowercase words, so we flatten those differences instead of writing
 * every pattern twice.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[​-‍﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True when a negation pattern sits close enough to the crisis match to be
 * about the same statement.
 *
 * Deliberately proximity-based rather than global: in "I used to cut myself
 * years ago but now I want to die" the past-tense marker belongs to the first
 * clause. A global check would swallow the second one.
 */
function isNegationProximate(text: string, matchIndex: number, matchLength: number): boolean {
  const start = matchIndex;
  const end = matchIndex + matchLength;

  const withinReach = (negStart: number, negEnd: number) =>
    negEnd >= start - PROXIMITY_CHARS && negStart <= end + PROXIMITY_CHARS;

  // Strong negations and idioms cancel outright.
  for (const negPattern of STRONG_NEGATION_PATTERNS) {
    const negMatch = text.match(negPattern);
    if (!negMatch || negMatch.index === undefined) continue;
    if (withinReach(negMatch.index, negMatch.index + negMatch[0].length)) return true;
  }

  // Past-tense markers only cancel when nothing pulls the statement back into
  // the present between the marker and the match.
  for (const negPattern of TEMPORAL_NEGATION_PATTERNS) {
    const negMatch = text.match(negPattern);
    if (!negMatch || negMatch.index === undefined) continue;
    const negStart = negMatch.index;
    const negEnd = negStart + negMatch[0].length;
    if (!withinReach(negStart, negEnd)) continue;

    const between = negEnd <= start ? text.slice(negEnd, start) : text.slice(end, negStart);
    if (ADVERSATIVE_MARKERS.test(between)) continue;

    return true;
  }

  return false;
}

function scan(text: string, patterns: readonly RegExp[]): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined && !isNegationProximate(text, match.index, match[0].length)) {
      return match;
    }
  }
  return null;
}

/**
 * Detects crisis signals in a single text or a list of texts.
 *
 * Accepts a list so the chat can pass the last few user messages: someone may
 * build up to a statement across several short lines. Highest severity found
 * anywhere in the input wins.
 */
export function detectCrisis(input: string | string[]): CrisisResult {
  const texts = (Array.isArray(input) ? input : [input]).filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  );

  if (texts.length === 0) return { detected: false, severity: "none" };

  // High severity across the whole input beats medium in any single part.
  for (const raw of texts) {
    const text = normalize(raw);
    const match = scan(text, HIGH_SEVERITY_PATTERNS);
    if (match) {
      return { detected: true, severity: "high", matchedSignal: match[0] };
    }
  }

  for (const raw of texts) {
    const text = normalize(raw);
    const match = scan(text, MEDIUM_SEVERITY_PATTERNS);
    if (match) {
      return { detected: true, severity: "medium", matchedSignal: match[0] };
    }
  }

  return { detected: false, severity: "none" };
}
