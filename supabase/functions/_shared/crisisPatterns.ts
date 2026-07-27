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
  /\bich\s+(will|möchte|moechte|mag)\s+(einfach\s+|gar\s+|jetzt\s+)*nicht\s+mehr\s+(da\s+sein|hier\s+sein|existieren|sein)\b/i,

  // — English slang and moderation-evading spellings —
  // "unalive" and "kms" are how this is written on TikTok/Instagram to get past
  // content filters. A detector that does not know them is blind to the people
  // most used to writing that way.
  /\bkms\b/i,
  /\bunalive\s+(myself|my\s?self)\b/i,
  /\bunaliving\s+myself\b/i,
  /\b(off|end|neck)\s+myself\b/i,
  /\bi'?m?\s+(wanna|want\s+to|gonna|going\s+to|finna|might\s+just)\s+(off|end|neck)\s+(it|myself|it\s+all)\b/i,
  /\bi\s+wish\s+i\s+(was|were)\s+dead\b/i,
  /\bi\s+wish\s+i\s+could\s+(just\s+)?disappear\s+forever\b/i,
  /\bi\s+(don'?t|dont)\s+(wanna|want\s+to)\s+(be\s+alive|live)\s+anymore\b/i,
  /\bwhat\s+if\s+i\s+just\s+(wasn'?t|wasnt)\s+here\b/i,
  /\bi('d|\s+would)\s+be\s+better\s+off\s+gone\b/i,
  /\bthoughts\s+of\s+ending\s+(my\s+life|it\s+all)\b/i,
  /\bending\s+it\s+all\b/i,
  /\bi'?m?(\s+am)?\s+done\s+with\s+life\b/i,
  /\bi\s+can'?\s?t\s+live\s+like\s+this\s+anymore\b/i,
  /\bi\s+want\s+to\s+commit\b/i,
  /\bnever\s+wake\s+up\b/i,

  // — German: subjunctive and indirect forms, the way people actually write —
  /\bwas\s+wenn\s+ich\s+(einfach\s+)?nicht\s+mehr\s+(wäre|da\s+wäre)\b/i,
  /\b(ich\s+)?(hab|habe)\s+keine\s+lust\s+mehr\s+zu\s+leben\b/i,
  /\bich\s+mag\s+nicht\s+mehr\b/i,
  /\bich\s+(wär|wäre|waere)\s+lieber\s+tot\b/i,
  /\bam\s+liebsten\s+(wäre|waere)\s+ich\s+tot\b/i,
  /\bam\s+liebsten\s+würde\s+ich\s+(mich\s+)?(sterben|umbringen|vor\s+den\s+zug)\b/i,
  /\bich\s+w(ü|ue)rde\s+am\s+liebsten\s+sterben\b/i,
  /\bich\s+denke?\s+(oft\s+)?an[s]?\s+(sterben|suizid|selbstmord)\b/i,
  /\bich\s+denke?\s+(oft\s+)?(über|ueber)\s+suizid\s+nach\b/i,
  /\bmein\s+leben\s+beenden\b/i,
  /\bich\s+will\s+mich\s+(selbst\s+)?t(ö|oe)ten\b/i,
  /\bich\s+bin\s+es\s+leid\s+zu\s+leben\b/i,
  /\bvor\s+den\s+zug\s+werfen\b/i,
  /\bvon\s+(der\s+)?br(ü|ue)cke\s+springen\b/i,
  /\btabletten\s+gesammelt\b/i,
  /\bich\s+will\s+mir\s+(was|etwas)\s+antun\b/i,
  /\bmir\s+(was|etwas)\s+an(zu)?tun\b/i,
  /\bwie\s+ich\s+es\s+machen\s+w(ü|ue)rde\b/i,
  /\bumbrigen\b/i,
  /\bsuizid\b/i,
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
  /\bkann\s+ich\s+nicht\s+mehr\b/i,
  /\bich\s+kann\s+nicht\s+mehr(?!\s+(schlafen|einschlafen|essen|trinken|arbeiten|lernen|laufen|rennen|sehen|hören|lesen|schreiben))\b/i,
  /\bkein\s+bock\s+mehr\s+auf\s+alles\b/i,
  /\bwenn\s+ich\s+nicht\s+mehr\s+da\s+wäre\b/i,
  /\bohne\s+mich\s+(wären|sind)\s+alle\s+besser\s+dran\b/i,
  /\bwill\s+einfach\s+nur\s+noch\s+weg\b/i,
  /\bhalte?\s+das\s+nicht\s+mehr\s+aus\b/i,
  /\bich\s+habe?\s+angst\s+um\s+mein\s+leben\b/i,
  /\bwerde\s+(\w+\s+)?(geschlagen|missbraucht|bedroht|misshandelt)\b/i,

  // — Self-harm, current phrasings —
  /\bich\s+(hab|habe)\s+mich\s+(heute\s+|gestern\s+|wieder\s+)*(verletzt|geschnitten)\b/i,
  /\bich\s+verletze\s+mich\b/i,
  /\bich\s+f(ü|ue)ge\s+mir\s+\w*\s*(verletzungen|schmerzen)\s+zu\b/i,
  /\bich\s+schneide\s+mir?\b/i,
  /\bich\s+brenne\s+mich\b/i,
  /\bich\s+schlage\s+mich\s+selbst\b/i,
  /\bsh[- ]?gedanken\b/i,
  /\brelapsed\s+on\s+sh\b/i,
  /\bi\s+cut\s+again\b/i,
  /\bi\s+want\s+to\s+cut\b/i,
  /\bscratching\s+myself\b/i,
  /\bi\s+burned\s+myself\b/i,

  // — Danger from others, ACTIVE voice —
  // The passive-only patterns ("werde geschlagen") missed every real phrasing:
  // people write about the person doing it, not about themselves being acted on.
  /\b(mein|meine)\s+\w+\s+(schl(ä|ae)gt|misshandelt|missbraucht|bedroht|verletzt|vergewaltigt)\s+mich\b/i,
  /\b(mein|meine)\s+\w+\s+(hat|hatte)\s+mich\s+(missbraucht|geschlagen|vergewaltigt)\b/i,
  /\ber\s+bedroht\s+mich\b/i,
  /\bich\s+(hab|habe)\s+angst\s+vor\s+(meinem|meiner)\b/i,
  /\bich\s+f(ü|ue)hle\s+mich\s+zuhause\s+nicht\s+sicher\b/i,
  /\b(mein|meine)\s+\w+\s+tut\s+mir\s+weh\b/i,
  /\bmy\s+(boyfriend|girlfriend|husband|wife|partner|dad|father|mom|mother|ex)\s+(hits|beats|abuses|abused|threatens|hurts|raped)\s+me\b/i,
  /\bhe\s+threatened\s+to\s+kill\s+me\b/i,
  /\b(he|she|they)\s+(is|keeps|was)?\s*(beating|hitting|hurting|abusing|threatening)\s+me\b/i,
  /\b(i'?m|i\s+am)\s+scared\s+(he|she|they)\s+(will|might)\s+(kill|hurt)\s+me\b/i,
  /\bi\s+want\s+to\s+hurt\s+someone\b/i,
  /\bich\s+will\s+jemanden\s+umbringen\b/i,
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

/**
 * Cancellation is scoped to the CLAUSE a phrase appears in, not to a character
 * window. The window version suppressed real disclosures:
 *   "dieser bug bringt mich noch um. ich will mich umbringen"  -> nothing
 *   "ich hab gesagt ich bin nicht suizidal aber ich will sterben" -> nothing
 * The second is the exact shape in which people disclose, so it mattered most.
 * Splitting first means an idiom or a denial can only neutralise its own
 * clause — never the sentence that follows it.
 */
const CLAUSE_SPLIT = /[.!?;,\n]+|\b(?:aber|jedoch|allerdings|trotzdem|but|however|though|and|und)\b/i;

export function splitIntoClauses(text: string): string[] {
  return text
    .split(CLAUSE_SPLIT)
    .map((part) => (part ?? "").trim())
    .filter((part) => part.length > 0);
}

/**
 * Flattens the differences that voice transcripts and casual typing introduce:
 * lower case, typographic apostrophes, emoji and stray punctuation between
 * words, doubled spaces. Patterns are written against plain lowercase words.
 */
export function normalizeForDetection(text: string): string {
  return text
    // NFD-decomposed umlauts arrive from iOS/macOS paths: "lebensmüde" becomes
    // "u" + combining diaeresis, which \p{L} does not cover — the word was
    // silently split into "lebensmu de" and never matched.
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[-_/]+/g, " ")
    // Strip anything that is not a letter, digit, apostrophe, hyphen or space —
    // this removes emoji and punctuation that would otherwise break \b…\b runs.
    .replace(/[^\p{L}\p{N}'\- ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAny(clause: string, patterns: readonly RegExp[]): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = clause.match(pattern);
    if (match) return match;
  }
  return null;
}

/**
 * Evaluates ONE clause. A canceller only counts if it appears in the same
 * clause — that is the whole point of splitting first.
 */
function scanClause(
  clause: string,
  patterns: readonly RegExp[],
  cancellers: readonly (readonly RegExp[])[],
): RegExpMatchArray | null {
  const match = matchesAny(clause, patterns);
  if (!match) return null;
  for (const list of cancellers) {
    if (matchesAny(clause, list)) return null;
  }
  return match;
}

/**
 * Detects crisis signals in one text or a list of texts.
 * Highest severity found in any clause wins.
 */
export function detectCrisisIn(input: string | readonly string[]): CrisisResult {
  const texts = (Array.isArray(input) ? input : [input as string]).filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  );
  if (texts.length === 0) return { detected: false, severity: "none" };

  // Split on the raw text — normalisation strips the punctuation that marks
  // clause boundaries — then normalise each clause for matching.
  const clauses = texts
    .flatMap((text) => splitIntoClauses(text))
    .map((clause) => normalizeForDetection(clause))
    .filter((clause) => clause.length > 0);

  for (const clause of clauses) {
    const match = scanClause(clause, HIGH_SEVERITY_PATTERNS, [STRONG_NEGATION_PATTERNS]);
    if (match) return { detected: true, severity: "high", matchedSignal: match[0] };
  }

  for (const clause of clauses) {
    const match = scanClause(clause, MEDIUM_SEVERITY_PATTERNS, [
      STRONG_NEGATION_PATTERNS,
      PAST_TENSE_PATTERNS,
    ]);
    if (match) return { detected: true, severity: "medium", matchedSignal: match[0] };
  }

  return { detected: false, severity: "none" };
}
