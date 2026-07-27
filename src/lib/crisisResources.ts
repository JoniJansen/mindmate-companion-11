/**
 * Crisis helpline data, grouped by REGION (never by UI language).
 *
 * Rules for this file:
 *  - Phone numbers, short codes and URLs are data, not copy: they are identical
 *    in every language and therefore live here as literals, never in
 *    src/translations/. Only names, descriptions and availability texts are
 *    translated (via the *Key fields, resolved with t() at render time).
 *  - Every entry MUST carry an availability text. Nobody may call a line that
 *    is closed and conclude that nobody is there for them.
 *  - International resources are always part of what is shown without any
 *    interaction, so a wrong region guess can never hide help.
 *
 * German numbers verified against telefonseelsorge.de and
 * nummergegenkummer.de (2026-07-26).
 */

import { detectCountry, type RegionDetectionInput } from "@/lib/region";

/** Regions we ship a curated list for; "unknown" = show international first. */
export type CrisisRegion = "DE" | "US" | "unknown";

export type CrisisSectionId = "DE" | "US" | "INTERNATIONAL";

export type CrisisContactKind = "phone" | "text" | "link";

export interface CrisisContact {
  /** Stable identifier — React key and test anchor. */
  id: string;
  kind: CrisisContactKind;
  /** Dialable target: tel:, sms: or https:. */
  href: string;
  /**
   * Literal display value (phone number / short code). Never translated.
   * Exactly one of `value` / `valueKey` is set.
   */
  value?: string;
  /** Translation key for the display label of link entries (chat, mail, list). */
  valueKey?: string;
  nameKey: string;
  descriptionKey: string;
  /** Opening hours / cost — mandatory on every entry. */
  availabilityKey: string;
}

export interface CrisisSection {
  id: CrisisSectionId;
  headingKey: string;
  contacts: CrisisContact[];
}

export interface EmergencyNumber {
  /** Digits only — used for tel: and as display fallback. */
  value: string;
  labelKey: string;
}

export const INTERNATIONAL_CRISIS_URL = "https://www.iasp.info/resources/Crisis_Centres/";

/** Germany — TelefonSeelsorge (24/7) and Nummer gegen Kummer (limited hours). */
export const GERMAN_CRISIS_CONTACTS: readonly CrisisContact[] = [
  {
    id: "de-telefonseelsorge-116123",
    kind: "phone",
    value: "116 123",
    href: "tel:116123",
    nameKey: "crisis.de.telefonseelsorge.name",
    descriptionKey: "crisis.de.telefonseelsorge.mainDesc",
    availabilityKey: "crisis.availability.roundTheClockFree",
  },
  {
    id: "de-telefonseelsorge-0800-111-0-111",
    kind: "phone",
    value: "0800 111 0 111",
    href: "tel:08001110111",
    nameKey: "crisis.de.telefonseelsorge.name",
    descriptionKey: "crisis.de.telefonseelsorge.altDesc",
    availabilityKey: "crisis.availability.roundTheClockFree",
  },
  {
    id: "de-telefonseelsorge-0800-111-0-222",
    kind: "phone",
    value: "0800 111 0 222",
    href: "tel:08001110222",
    nameKey: "crisis.de.telefonseelsorge.name",
    descriptionKey: "crisis.de.telefonseelsorge.altDesc",
    availabilityKey: "crisis.availability.roundTheClockFree",
  },
  {
    id: "de-telefonseelsorge-chat",
    kind: "link",
    href: "https://www.telefonseelsorge.de/chat/",
    valueKey: "crisis.de.telefonseelsorgeChat.label",
    nameKey: "crisis.de.telefonseelsorgeChat.name",
    descriptionKey: "crisis.de.telefonseelsorgeChat.desc",
    availabilityKey: "crisis.availability.seeWebsite",
  },
  {
    id: "de-telefonseelsorge-mail",
    kind: "link",
    href: "https://www.telefonseelsorge.de/mail/",
    valueKey: "crisis.de.telefonseelsorgeMail.label",
    nameKey: "crisis.de.telefonseelsorgeMail.name",
    descriptionKey: "crisis.de.telefonseelsorgeMail.desc",
    availabilityKey: "crisis.availability.mailReply",
  },
  {
    id: "de-nummer-gegen-kummer-kinder",
    kind: "phone",
    value: "116 111",
    href: "tel:116111",
    nameKey: "crisis.de.childLine.name",
    descriptionKey: "crisis.de.childLine.desc",
    // NOT 24/7 — mislabelling this line as always available was the original bug.
    availabilityKey: "crisis.availability.childLineHours",
  },
  {
    id: "de-nummer-gegen-kummer-eltern",
    kind: "phone",
    value: "0800 111 0 550",
    href: "tel:08001110550",
    nameKey: "crisis.de.parentLine.name",
    descriptionKey: "crisis.de.parentLine.desc",
    availabilityKey: "crisis.availability.parentLineHours",
  },
];

/** United States. */
export const US_CRISIS_CONTACTS: readonly CrisisContact[] = [
  {
    id: "us-lifeline-988",
    kind: "phone",
    value: "988",
    href: "tel:988",
    nameKey: "crisis.us.lifeline.name",
    descriptionKey: "crisis.us.lifeline.desc",
    availabilityKey: "safety.24_7",
  },
  {
    id: "us-crisis-text-line",
    kind: "text",
    value: "741741",
    href: "sms:741741?body=HOME",
    nameKey: "crisis.us.textLine.name",
    descriptionKey: "crisis.us.textLine.desc",
    availabilityKey: "safety.24_7",
  },
  {
    id: "us-samhsa",
    kind: "phone",
    value: "1-800-662-4357",
    href: "tel:18006624357",
    nameKey: "crisis.us.samhsa.name",
    descriptionKey: "crisis.us.samhsa.desc",
    availabilityKey: "safety.24_7",
  },
];

/** Always shown, in every region — the escape hatch from a wrong guess. */
export const INTERNATIONAL_CRISIS_CONTACTS: readonly CrisisContact[] = [
  {
    id: "international-iasp",
    kind: "link",
    href: INTERNATIONAL_CRISIS_URL,
    valueKey: "crisis.findLocalResources",
    nameKey: "crisis.international",
    descriptionKey: "crisis.crisisCentersWorldwide",
    availabilityKey: "safety.variesByLocation",
  },
];

function section(id: CrisisSectionId): CrisisSection {
  switch (id) {
    case "DE":
      return {
        id,
        headingKey: "safety.region.heading.de",
        contacts: [...GERMAN_CRISIS_CONTACTS],
      };
    case "US":
      return {
        id,
        headingKey: "safety.region.heading.us",
        contacts: [...US_CRISIS_CONTACTS],
      };
    case "INTERNATIONAL":
      return {
        id,
        headingKey: "safety.region.heading.international",
        contacts: [...INTERNATIONAL_CRISIS_CONTACTS],
      };
  }
}

export interface SafetyResources {
  region: CrisisRegion;
  /** Explains which region is being shown and why. */
  noticeKey: string;
  /** Rendered immediately, without any tap. Always contains INTERNATIONAL. */
  primary: CrisisSection[];
  /** Behind an always-visible disclosure ("in another country?"). */
  others: CrisisSection[];
}

/**
 * Maps a detected country onto the curated lists.
 * Countries without a curated list (incl. AT/CH — the German 0800 lines do not
 * connect from there) intentionally resolve to "unknown": international help
 * comes first, the German list stays visible underneath.
 */
export function toCrisisRegion(country: string | null | undefined): CrisisRegion {
  if (country === "DE") return "DE";
  if (country === "US") return "US";
  return "unknown";
}

/** Detects the crisis region from device signals (time zone, then locale). */
export function detectCrisisRegion(input?: RegionDetectionInput): CrisisRegion {
  return toCrisisRegion(detectCountry(input).country);
}

/**
 * Ordering of the helpline sections.
 * Invariant: INTERNATIONAL is always part of `primary`, so help is reachable
 * even when the region guess is wrong.
 */
export function getSafetyResources(region: CrisisRegion): SafetyResources {
  switch (region) {
    case "DE":
      return {
        region,
        noticeKey: "safety.region.notice.de",
        primary: [section("DE"), section("INTERNATIONAL")],
        others: [section("US")],
      };
    case "US":
      return {
        region,
        noticeKey: "safety.region.notice.us",
        primary: [section("US"), section("INTERNATIONAL")],
        others: [section("DE")],
      };
    default:
      // Location unclear: international first, German list equally visible.
      return {
        region: "unknown",
        noticeKey: "safety.region.notice.unknown",
        primary: [section("INTERNATIONAL"), section("DE")],
        others: [section("US")],
      };
  }
}

/** Emergency services number(s) for the detected region. */
export function getEmergencyNumbers(region: CrisisRegion): EmergencyNumber[] {
  switch (region) {
    case "DE":
      return [{ value: "112", labelKey: "safety.emergency.call112" }];
    case "US":
      return [{ value: "911", labelKey: "safety.emergency.call911" }];
    default:
      return [
        { value: "112", labelKey: "safety.emergency.call112Europe" },
        { value: "911", labelKey: "safety.emergency.call911Us" },
      ];
  }
}

/** All contacts across all regions — used by tests to check key integrity. */
export const ALL_CRISIS_CONTACTS: readonly CrisisContact[] = [
  ...GERMAN_CRISIS_CONTACTS,
  ...US_CRISIS_CONTACTS,
  ...INTERNATIONAL_CRISIS_CONTACTS,
];
