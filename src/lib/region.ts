/**
 * Region detection for safety-critical content (crisis helplines).
 *
 * WHY THIS EXISTS
 * Emergency and crisis numbers must follow the user's PHYSICAL LOCATION, never
 * the UI language. Before this module, the Safety page picked helplines by UI
 * language: somebody sitting in Germany with the app set to English was shown
 * the US line 988 — a number that does not connect from Germany.
 *
 * SIGNALS (in order of trust)
 *  1. IANA time zone via `Intl.DateTimeFormat().resolvedOptions().timeZone`.
 *     Follows the device's actual location, independent of language.
 *  2. Region subtag of the browser/OS locale (`navigator.languages`, e.g.
 *     "de-DE" -> DE). Weaker: it describes a preferred locale, not a location.
 *  3. Nothing usable -> `null`. The UI must then show international resources
 *     next to local ones instead of guessing (see crisisResources.ts).
 *
 * Every read is wrapped defensively: a page whose entire purpose is to be
 * reachable during a crisis must never crash because `Intl` or `navigator`
 * behaves unexpectedly on some device or webview.
 */

/** ISO 3166-1 alpha-2 country code (uppercase). */
export type CountryCode = string;

/** Which signal produced a detection result (useful for tests + diagnostics). */
export type RegionSource = "timezone" | "language" | "none";

export interface RegionDetection {
  /** Uppercase ISO 3166-1 alpha-2 code, or null when nothing could be determined. */
  country: CountryCode | null;
  source: RegionSource;
}

export interface RegionDetectionInput {
  timeZone?: string | null;
  languages?: readonly string[] | null;
}

/**
 * IANA time zone -> country. Deliberately not exhaustive: it covers the
 * regions we ship curated helplines for (DE, US) plus the neighbours most
 * likely to be confused with them, so that e.g. Vienna or Zurich are NOT
 * silently treated as Germany (the free 0800 TelefonSeelsorge numbers are
 * German lines). Anything unmapped falls through to the locale signal.
 * Keys are lowercase; lookups are case-insensitive.
 */
const TIME_ZONE_COUNTRY: Readonly<Record<string, CountryCode>> = {
  // --- Germany ---
  "europe/berlin": "DE",
  "europe/busingen": "DE",

  // --- German-speaking neighbours (explicitly NOT Germany) ---
  "europe/vienna": "AT",
  "europe/zurich": "CH",
  "europe/vaduz": "LI",
  "europe/luxembourg": "LU",

  // --- Rest of Europe (keeps "not Germany" decisions honest) ---
  "europe/amsterdam": "NL",
  "europe/brussels": "BE",
  "europe/paris": "FR",
  "europe/monaco": "MC",
  "europe/rome": "IT",
  "europe/madrid": "ES",
  "africa/ceuta": "ES",
  "atlantic/canary": "ES",
  "europe/lisbon": "PT",
  "atlantic/madeira": "PT",
  "atlantic/azores": "PT",
  "europe/london": "GB",
  "europe/dublin": "IE",
  "europe/copenhagen": "DK",
  "europe/stockholm": "SE",
  "europe/oslo": "NO",
  "europe/helsinki": "FI",
  "europe/warsaw": "PL",
  "europe/prague": "CZ",
  "europe/bratislava": "SK",
  "europe/budapest": "HU",
  "europe/ljubljana": "SI",
  "europe/zagreb": "HR",
  "europe/belgrade": "RS",
  "europe/sarajevo": "BA",
  "europe/skopje": "MK",
  "europe/podgorica": "ME",
  "europe/tirane": "AL",
  "europe/athens": "GR",
  "europe/bucharest": "RO",
  "europe/sofia": "BG",
  "europe/tallinn": "EE",
  "europe/riga": "LV",
  "europe/vilnius": "LT",
  "europe/malta": "MT",
  "asia/nicosia": "CY",
  "europe/istanbul": "TR",

  // --- United States ---
  "america/new_york": "US",
  "america/detroit": "US",
  "america/kentucky/louisville": "US",
  "america/kentucky/monticello": "US",
  "america/indiana/indianapolis": "US",
  "america/indiana/vincennes": "US",
  "america/indiana/winamac": "US",
  "america/indiana/marengo": "US",
  "america/indiana/petersburg": "US",
  "america/indiana/vevay": "US",
  "america/indiana/tell_city": "US",
  "america/indiana/knox": "US",
  "america/indianapolis": "US",
  "america/chicago": "US",
  "america/menominee": "US",
  "america/north_dakota/center": "US",
  "america/north_dakota/new_salem": "US",
  "america/north_dakota/beulah": "US",
  "america/denver": "US",
  "america/boise": "US",
  "america/phoenix": "US",
  "america/los_angeles": "US",
  "america/anchorage": "US",
  "america/juneau": "US",
  "america/sitka": "US",
  "america/metlakatla": "US",
  "america/yakutat": "US",
  "america/nome": "US",
  "america/adak": "US",
  "pacific/honolulu": "US",

  // --- Canada (adjacent, must not be mistaken for the US list) ---
  "america/toronto": "CA",
  "america/montreal": "CA",
  "america/vancouver": "CA",
  "america/edmonton": "CA",
  "america/winnipeg": "CA",
  "america/halifax": "CA",
  "america/st_johns": "CA",
  "america/regina": "CA",
};

/** Legacy/alias time zone prefixes that map to a country as a whole. */
const TIME_ZONE_PREFIX_COUNTRY: ReadonlyArray<readonly [string, CountryCode]> = [
  ["us/", "US"], // e.g. "US/Pacific", "US/Eastern"
  ["canada/", "CA"],
];

function readTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function readLanguages(): readonly string[] {
  try {
    if (typeof navigator === "undefined") return [];
    const list = navigator.languages;
    if (Array.isArray(list) && list.length > 0) return list;
    return navigator.language ? [navigator.language] : [];
  } catch {
    return [];
  }
}

/** "Europe/Berlin" -> "DE". Returns null for unmapped/invalid zones. */
export function countryFromTimeZone(timeZone: string | null | undefined): CountryCode | null {
  if (!timeZone || typeof timeZone !== "string") return null;
  const normalized = timeZone.trim().toLowerCase();
  if (!normalized) return null;

  const exact = TIME_ZONE_COUNTRY[normalized];
  if (exact) return exact;

  for (const [prefix, country] of TIME_ZONE_PREFIX_COUNTRY) {
    if (normalized.startsWith(prefix)) return country;
  }
  return null;
}

/** "de-DE" -> "DE", "zh-Hant-TW" -> "TW", "en" -> null. */
export function countryFromLanguageTag(tag: string | null | undefined): CountryCode | null {
  if (!tag || typeof tag !== "string") return null;
  const subtags = tag.trim().split(/[-_]/).slice(1);
  for (const subtag of subtags) {
    // Region subtags are exactly two letters; four letters is a script
    // subtag ("Hant"), longer ones are variants.
    if (/^[A-Za-z]{2}$/.test(subtag)) return subtag.toUpperCase();
  }
  return null;
}

/**
 * Detects the user's country. Pass explicit values to make behaviour testable;
 * without arguments the real environment is read (defensively).
 */
export function detectCountry(input?: RegionDetectionInput): RegionDetection {
  const timeZone = input?.timeZone !== undefined ? input.timeZone : readTimeZone();
  const fromTimeZone = countryFromTimeZone(timeZone);
  if (fromTimeZone) return { country: fromTimeZone, source: "timezone" };

  const languages = input?.languages !== undefined ? input.languages : readLanguages();
  for (const tag of languages ?? []) {
    const fromLanguage = countryFromLanguageTag(tag);
    if (fromLanguage) return { country: fromLanguage, source: "language" };
  }

  return { country: null, source: "none" };
}
