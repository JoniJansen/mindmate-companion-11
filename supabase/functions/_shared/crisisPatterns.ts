/**
 * Canonical crisis patterns — the single source for client AND edge functions.
 *
 * WHY THIS FILE SITS HERE
 * The Deno edge functions cannot import from `src/`, and the browser bundle
 * should not pull in Deno code. This module is plain TypeScript with no
 * imports and no runtime APIs, so both sides can consume it directly:
 *   - client: `src/lib/crisisDetection.ts`
 *   - server: `supabase/functions/chat/index.ts`
 *
 * Keeping two copies was tried and failed silently: the server list still
 * required the infinitive "nicht mehr leben wollen" and therefore missed
 * "ich will nicht mehr leben" — the single most common German phrasing —
 * while a string-comparing "sync test" stayed green.
 *
 * TUNING RULE — read before editing:
 * False negatives are the risk. False positives are acceptable.
 * A helpline shown to somebody venting about work is a small annoyance.
 * A missed disclosure is not. When in doubt, widen.
 */

export type CrisisSeverity = "none" | "low" | "medium" | "high";

export interface CrisisResult {
  detected: boolean;
  severity: CrisisSeverity;
  /** The matched text — diagnostics only, never shown to users. */
  matchedSignal?: string;
}

/**
 * High severity: explicit statements of intent to die or to end one's life.
 *
 * These are never cancelled by a past-tense marker. Somebody writing "ich will
 * mich umbringen" means it now, regardless of whether the word "damals" appears
 * elsewhere in the message.
 */
export const HIGH_SEVERITY_PATTERNS: readonly RegExp[] = [
  // — English: wanting to die —
  // "wanna" already contains the "to", so it must not require another one.
  /\bi\s+(want\s+to|wanna|wish\s+to|need\s+to|just\s+want\s+to)\s+die\b/i,
  /\bi\s+(want|wanna)\s+to\s+(kill\s+myself|end\s+(my\s+life|it\s+all|things))\b/i,
  /\bi('m|\s+am)?\s*(gonna|going\s+to)\s+(kill|end|hurt|harm)\s+myself\b/i,
  /\bkill\s+myself\b/i,
  /\btake\s+my\s+own\s+life\b/i,
  /\bend\s+my\s+life\b/i,
  /\bi\s+have\s+a\s+(plan|method)\s+to\s+(die|kill|end)\b/i,
  /\bi('m|\s+am)\s+suicidal\b/i,
  /\bsuicid(e|al)\s+(thoughts?|ideation|plan|attempt|note)\b/i,
  /\bi\s+(don'?t|do\s+not|dont)\s+want\s+to\s+(be\s+here|exist|live|wake\s+up)\b/i,
  /\bi\s+want\s+(it|everything)\s+(all\s+)?to\s+(stop|end)\b/i,
  /\bbetter\s+off\s+dead\b/i,

  // — German: wanting to die —
  /\bich\s+(will|möchte|moechte|mag)\s+(einfach\s+|gar\s+|jetzt\s+)*nicht\s+mehr\s+leben\b/i,
  /\bnicht\s+mehr\s+leben\s+wollen\b/i,
  /\bich\s+(will|möchte|moechte)\s+sterben\b/i,
  /\bich\s+(will|möchte|moechte)\s+(einfach\s+)?tot\s+sein\b/i,
  /\bmich\s+(umbringen|umzubringen)\b/i,
  /\bich\s+bringe?\s+mich\s+um\b/i,
  /\bich\s+bin\s+suizid(al|gefährdet)\b/i,
  /\bsuizidgedanken\b/i,
  /\bselbstmord(gedanken|absicht)?\b/i,
  /\bsuizid(absicht|versuch|plan)\b/i,
  /\bmir\s+das\s+leben\s+(zu\s+)?nehmen\b/i,
  /\blebensm(ü|ue)de\b/i,
  /\bnicht\s+mehr\s+aufwachen\b/i,
  /\bschluss\s+machen\s+mit\s+allem\b/i,
  /\bfür\s+immer\s+schlafen\b/i,
  /\bich\s+will\s+nicht\s+mehr\s+(da\s+sein|hier\s+sein|existieren)\b/i,
];

/**
 * Medium severity: hopelessness, self-harm, or danger from others.
 * Weaker signals — these MAY be cancelled by a past-tense marker.
 */
export const MEDIUM_SEVERITY_PATTERNS: readonly RegExp[] = [
  // — English —
  /\b(don'?t|dont)\s+want\s+to\s+live\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bnot\s+worth\s+living\b/i,
  // Transcripts drop apostrophes ("cant") or split them ("can t") — allow both.
  /\bcan'?\s?t\s+(go\s+on|do\s+this\s+anymore|take\s+it\s+anymore|keep\s+going|take\s+this\s+anymore)\b/i,
  /\bbetter\s+off\s+without\s+me\b/i,
  /\b(everyone|people|they|nobody)\s+would\s+be\s+better\s+off\s+without\s+me\b/i,
  /\b(hurting|harming|cutting|burning)\s+myself\b/i,
  /\bself[- ]?harm(ing)?\b/i,
  /\bi\s+(hurt|cut)\s+myself\b/i,
  /\bafraid\s+for\s+my\s+life\b/i,
  /\bbeing\s+(abused|beaten|attacked)\b/i,
  /\bdomestic\s+violence\b/i,
  /\bsomeone\s+is\s+hurting\s+me\b/i,
  /\bunsafe\s+at\s+home\b/i,

  // — German —
  /\bkeinen\s+sinn\s+mehr\b/i,
  /\bmir\s+selbst\s+(weh\s+tun|schaden)\b/i,
  /\bich\s+tue?\s+mir\s+weh\b/i,
  /\bich\s+(ritze|schneide)\s+mich\b/i,
  /\b(ritze|ritzen|geritzt)\b/i,
  /\bselbstverletzung\b/i,
  /\bich\s+kann\s+nicht\s+mehr(?!\s+(schlafen|einschlafen|essen|trinken|arbeiten|lernen|laufen|rennen|sehen|hören|lesen|schreiben))\b/i,
  /\bkein\s+bock\s+mehr\s+auf\s+alles\b/i,
  /\bwenn\s+ich\s+nicht\s+mehr\s+da\s+wäre\b/i,
  /\bohne\s+mich\s+(wären|sind)\s+alle\s+besser\s+dran\b/i,
  /\bwill\s+einfach\s+nur\s+noch\s+weg\b/i,
  /\bhalte?\s+das\s+nicht\s+mehr\s+aus\b/i,
  /\bich\s+habe?\s+angst\s+um\s+mein\s+leben\b/i,
  /\bwerde\s+(\w+\s+)?(geschlagen|missbraucht|bedroht)\b/i,
];

/**
 * Idioms and explicit denials — these cancel a match of ANY severity.
 *
 * Only phrases whose presence genuinely means "this is not a crisis":
 * figures of speech that borrow the vocabulary of dying, and sentences that
 * explicitly deny intent.
 */
export const STRONG_NEGATION_PATTERNS: readonly RegExp[] = [
  // Explicit denial
  /\bi\s+(don'?t|do\s+not|dont)\s+want\s+to\s+(hurt|harm|kill)\s+myself\b/i,
  /\bi('m|\s+am)\s+not\s+(suicidal|going\s+to)\b/i,
  /\bich\s+bin\s+nicht\s+suizidal\b/i,
  /\bich\s+will\s+mich\s+nicht\s+umbringen\b/i,

  // English idioms
  /\bcut\s+myself\s+some\s+slack\b/i,
  /\bdead\s+(tired|serious|line)\b/i,
  /\bkilling\s+it\b/i,
  /\bdied\s+(laughing|of\s+laughter)\b/i,
  /\bdrop[- ]?dead\s+gorgeous\b/i,
  /\bi('d|\s+would|\s+could)\s+kill\s+for\s+a\b/i,
  /\bit'?s\s+killing\s+me\s+(that|how)\b/i,
  /\bdying\s+to\s+(see|know|hear|try|meet)\b/i,
  /\bkill\s+(the|this|that|a)\s+(process|task|job|server|build|feature|branch|ticket|session)\b/i,

  // German idioms
  /\bbringt\s+mich\s+(noch\s+)?um\b/i,
  /\bkillt\s+mich\b/i,
  /\b(totlachen|totgelacht)\b/i,
  /\bsterbenslangweilig\b/i,
  /\bsterben\s+vor\s+(scham|langeweile|lachen|neugier)\b/i,
  /\bbring(e|t)?\s+(das|den|die)\s+\w+\s+um\b/i,
];

/**
 * Past-tense markers — apply to MEDIUM signals only.
 *
 * Deliberately NOT applied to HIGH severity. An earlier version cancelled any
 * match near one of these, which meant "Es geht mir nicht mehr so gut, ich will
 * mich umbringen" was silently discarded, because "nicht mehr so" sat close by.
 * Suppressing an acute disclosure is worse than showing a helpline to somebody
 * recounting their history.
 */
export const PAST_TENSE_PATTERNS: readonly RegExp[] = [
  /\bi\s+used\s+to\s+(self[- ]?harm|cut|hurt\s+myself)\b/i,
  /\bin\s+the\s+past\s+(i|years?|months?)\b/i,
  /\byears?\s+ago\b/i,
  /\bfrüher\s+(mal\s+)?(ge)?(ritzt|schnitten|habe)\b/i,
  /\bhabe\s+mich\s+früher\b/i,
  /\bist\s+(schon\s+)?lange\s+her\b/i,
  /\bdamals\b/i,
];

/** How far a cancelling phrase may sit from a match, in characters. */
const PROXIMITY_CHARS = 60;

/**
 * Flattens the differences that voice transcripts and casual typing introduce:
 * lower case, typographic apostrophes, emoji and stray punctuation between
 * words, doubled spaces. Patterns are written against plain lowercase words.
 */
export function normalizeForDetection(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    // Strip anything that is not a letter, digit, apostrophe, hyphen or space —
    // this removes emoji and punctuation that would otherwise break \b…\b runs.
    .replace(/[^\p{L}\p{N}'\- ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatchWithin(
  text: string,
  patterns: readonly RegExp[],
  start: number,
  end: number,
): boolean {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match || match.index === undefined) continue;
    const negStart = match.index;
    const negEnd = negStart + match[0].length;
    if (negEnd >= start - PROXIMITY_CHARS && negStart <= end + PROXIMITY_CHARS) return true;
  }
  return false;
}

function scan(
  text: string,
  patterns: readonly RegExp[],
  cancellers: readonly (readonly RegExp[])[],
): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match || match.index === undefined) continue;
    const start = match.index;
    const end = start + match[0].length;
    const cancelled = cancellers.some((list) => firstMatchWithin(text, list, start, end));
    if (!cancelled) return match;
  }
  return null;
}

/**
 * Detects crisis signals in one text or a list of texts.
 * Highest severity found anywhere in the input wins.
 */
export function detectCrisisIn(input: string | readonly string[]): CrisisResult {
  const texts = (Array.isArray(input) ? input : [input as string]).filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  );
  if (texts.length === 0) return { detected: false, severity: "none" };

  // HIGH first, across the whole input. Only idioms/denials can cancel it.
  for (const raw of texts) {
    const text = normalizeForDetection(raw);
    const match = scan(text, HIGH_SEVERITY_PATTERNS, [STRONG_NEGATION_PATTERNS]);
    if (match) return { detected: true, severity: "high", matchedSignal: match[0] };
  }

  // MEDIUM may additionally be cancelled by a past-tense marker.
  for (const raw of texts) {
    const text = normalizeForDetection(raw);
    const match = scan(text, MEDIUM_SEVERITY_PATTERNS, [
      STRONG_NEGATION_PATTERNS,
      PAST_TENSE_PATTERNS,
    ]);
    if (match) return { detected: true, severity: "medium", matchedSignal: match[0] };
  }

  return { detected: false, severity: "none" };
}
