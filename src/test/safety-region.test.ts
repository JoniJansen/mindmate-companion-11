import { describe, it, expect } from "vitest";
import { allTranslations } from "@/translations";
import { countryFromLanguageTag, countryFromTimeZone, detectCountry } from "@/lib/region";
import {
  ALL_CRISIS_CONTACTS,
  GERMAN_CRISIS_CONTACTS,
  detectCrisisRegion,
  contactsForCard,
  getEmergencyNumbers,
  getSafetyResources,
  type CrisisRegion,
} from "@/lib/crisisResources";

/**
 * Safety-critical: crisis helplines must follow the user's REGION, never the
 * UI language. Audit finding A2-6 — an English UI in Germany used to show the
 * US line 988, which does not connect from Germany.
 */

// Vollzählig halten: Die Invarianten unten laufen über diese Liste, und eine
// Region, die hier fehlt, wird von keiner einzigen davon geprüft.
const ALL_REGIONS: CrisisRegion[] = ["DE", "AT", "CH", "US", "unknown"];

describe("region detection: time zone is the primary signal", () => {
  it("maps Europe/Berlin to DE", () => {
    expect(countryFromTimeZone("Europe/Berlin")).toBe("DE");
    expect(detectCountry({ timeZone: "Europe/Berlin", languages: ["en-US"] })).toEqual({
      country: "DE",
      source: "timezone",
    });
    // The decisive regression check: English UI + German time zone -> German lines.
    expect(detectCrisisRegion({ timeZone: "Europe/Berlin", languages: ["en-US"] })).toBe("DE");
  });

  it("maps US time zones (incl. legacy aliases) to US", () => {
    expect(countryFromTimeZone("America/New_York")).toBe("US");
    expect(countryFromTimeZone("America/Los_Angeles")).toBe("US");
    expect(countryFromTimeZone("US/Pacific")).toBe("US");
    expect(detectCrisisRegion({ timeZone: "America/New_York", languages: ["de-DE"] })).toBe("US");
  });

  it("gives Austria and Switzerland their own region, not Germany's", () => {
    // Bis zum 28.07.2026 fielen beide auf "unknown" zurück und bekamen die
    // deutschen 0800-Nummern zu sehen, die von dort nicht durchstellen.
    // Dieser Test hielt genau diese Notlösung fest — er prüfte den Umweg,
    // nicht die Anforderung.
    expect(countryFromTimeZone("Europe/Vienna")).toBe("AT");
    expect(countryFromTimeZone("Europe/Zurich")).toBe("CH");
    expect(detectCrisisRegion({ timeZone: "Europe/Vienna", languages: ["de-AT"] })).toBe("AT");
    expect(detectCrisisRegion({ timeZone: "Europe/Zurich", languages: ["de-CH"] })).toBe("CH");
  });
});

describe("region detection: locale fallback and unknown", () => {
  it("falls back to the region subtag of the locale for unmapped time zones", () => {
    expect(countryFromLanguageTag("en-GB")).toBe("GB");
    expect(countryFromLanguageTag("zh-Hant-TW")).toBe("TW");
    expect(countryFromLanguageTag("en")).toBeNull();
    expect(detectCountry({ timeZone: "Mars/Olympus_Mons", languages: ["en", "de-DE"] })).toEqual({
      country: "DE",
      source: "language",
    });
  });

  it("returns unknown when neither signal yields a country", () => {
    expect(detectCountry({ timeZone: null, languages: [] })).toEqual({
      country: null,
      source: "none",
    });
    expect(detectCrisisRegion({ timeZone: "Mars/Olympus_Mons", languages: ["en"] })).toBe("unknown");
  });

  it("never throws, even if Intl is broken in the runtime", () => {
    const intlMutable = Intl as unknown as { DateTimeFormat: unknown };
    const original = intlMutable.DateTimeFormat;
    intlMutable.DateTimeFormat = () => {
      throw new Error("no Intl in this webview");
    };
    try {
      expect(() => detectCrisisRegion({ languages: [] })).not.toThrow();
      expect(detectCrisisRegion({ languages: [] })).toBe("unknown");
    } finally {
      intlMutable.DateTimeFormat = original;
    }
  });

  it("detects without arguments in the real environment without throwing", () => {
    expect(ALL_REGIONS).toContain(detectCrisisRegion());
  });
});

describe("safety resources: help is never hidden behind a wrong guess", () => {
  it("shows the international list without any interaction in every region", () => {
    for (const region of ALL_REGIONS) {
      const { primary } = getSafetyResources(region);
      expect(primary.map((s) => s.id), `region ${region}`).toContain("INTERNATIONAL");
    }
  });

  it("makes every other region reachable via a visible disclosure", () => {
    for (const region of ALL_REGIONS) {
      const { primary, others } = getSafetyResources(region);
      const shown = [...primary, ...others].map((s) => s.id);
      expect(shown, `region ${region}`).toEqual(expect.arrayContaining(["DE", "US", "INTERNATIONAL"]));
    }
  });

  it("puts the detected region first and keeps every other region reachable", () => {
    for (const region of ["DE", "AT", "CH", "US"] as const) {
      const { primary, others } = getSafetyResources(region);
      expect(primary[0].id).toBe(region);
      // Kein Land darf verschwinden, nur weil ein anderes erkannt wurde:
      // eine falsche Ortsvermutung soll Hilfe verschieben, nie verbergen.
      expect(new Set([...primary, ...others].map((s) => s.id))).toEqual(
        new Set(["DE", "AT", "CH", "US", "INTERNATIONAL"]),
      );
    }
  });

  it("offers Austrian and Swiss lines with their real availability", () => {
    const at = getSafetyResources("AT").primary[0].contacts;
    expect(at.map((c) => c.value)).toContain("142");
    expect(at.map((c) => c.value)).toContain("147");

    const ch = getSafetyResources("CH").primary[0].contacts;
    expect(ch.map((c) => c.value)).toContain("143");
    // Die 143 ist rund um die Uhr erreichbar, aber NICHT kostenlos.
    // Eine falsche Kostenangabe kann jemanden vom Anruf abhalten.
    expect(ch.find((c) => c.value === "143")?.availabilityKey).toBe(
      "crisis.availability.chBaseRate",
    );
  });

  it("shows international and German lines side by side when the region is unknown", () => {
    const { primary, noticeKey } = getSafetyResources("unknown");
    expect(primary.map((s) => s.id)).toEqual(["INTERNATIONAL", "DE"]);
    expect(noticeKey).toBe("safety.region.notice.unknown");
  });

  it("uses region-based emergency numbers (112 in DE, 911 in the US, both if unsure)", () => {
    expect(getEmergencyNumbers("DE").map((e) => e.value)).toEqual(["112"]);
    expect(getEmergencyNumbers("US").map((e) => e.value)).toEqual(["911"]);
    // 112 erreicht in AT und CH die Notrufzentrale, 144 direkt die Rettung.
    expect(getEmergencyNumbers("AT").map((e) => e.value)).toEqual(["112", "144"]);
    expect(getEmergencyNumbers("CH").map((e) => e.value)).toEqual(["112", "144"]);
    expect(getEmergencyNumbers("unknown").map((e) => e.value)).toEqual(["112", "911"]);
  });
});

describe("Hilfekarte im Chat: wen die zwei Nummern erreichen", () => {
  // Die Karte zeigte bis zum 28.07.2026 schlicht die ersten zwei Einträge.
  // Für Deutschland waren das zweimal TelefonSeelsorge; die Nummer gegen
  // Kummer stand an sechster Stelle und erschien nie. Ein 15-Jähriger in
  // einer Krise bekam damit ausschließlich Erwachsenenangebote zu sehen.
  it("zeigt in jeder Region genau zwei Nummern", () => {
    for (const region of ALL_REGIONS) {
      expect(contactsForCard(region), `region ${region}`).toHaveLength(2);
    }
  });

  it("zeigt nie zweimal dieselbe Nummer", () => {
    for (const region of ALL_REGIONS) {
      const werte = contactsForCard(region).map((c) => c.value);
      expect(new Set(werte).size, `region ${region}`).toBe(werte.length);
    }
  });

  it("stellt jeder Region mit Jugendleitung genau eine davon auf die Karte", () => {
    for (const region of ["DE", "AT", "CH"] as const) {
      const jugend = contactsForCard(region).filter((c) => c.audience === "youth");
      expect(jugend, `region ${region}`).toHaveLength(1);
    }
  });

  it("nennt für Deutschland die Nummer gegen Kummer, nicht zweimal TelefonSeelsorge", () => {
    const werte = contactsForCard("DE").map((c) => c.value);
    expect(werte).toContain("116 111");
  });

  it("gibt auch ohne Jugendleitung zwei verschiedene Nummern aus", () => {
    const werte = contactsForCard("US").map((c) => c.value);
    expect(new Set(werte).size).toBe(2);
  });

  it("trägt auf jedem Karteneintrag eine Verfügbarkeitsangabe", () => {
    // Niemand darf eine Leitung wählen, die geschlossen ist, und daraus
    // schließen, dass niemand für ihn da ist.
    for (const region of ALL_REGIONS) {
      for (const contact of contactsForCard(region)) {
        expect(contact.availabilityKey, `${region}/${contact.id}`).toBeTruthy();
      }
    }
  });
});

describe("German crisis lines: correct numbers and honest availability", () => {
  const byId = Object.fromEntries(GERMAN_CRISIS_CONTACTS.map((c) => [c.id, c]));

  it("lists 116 123 as the round-the-clock TelefonSeelsorge number", () => {
    const main = byId["de-telefonseelsorge-116123"];
    expect(main.value).toBe("116 123");
    expect(main.href).toBe("tel:116123");
    expect(main.availabilityKey).toBe("crisis.availability.roundTheClockFree");
  });

  it("keeps both free TelefonSeelsorge numbers", () => {
    expect(byId["de-telefonseelsorge-0800-111-0-111"].href).toBe("tel:08001110111");
    expect(byId["de-telefonseelsorge-0800-111-0-222"].href).toBe("tel:08001110222");
  });

  it("offers chat and e-mail counselling for people who cannot call", () => {
    expect(byId["de-telefonseelsorge-chat"].href).toBe("https://www.telefonseelsorge.de/chat/");
    expect(byId["de-telefonseelsorge-mail"].href).toBe("https://www.telefonseelsorge.de/mail/");
  });

  it("marks 116 111 as a children/youth line with limited hours, never as 24/7", () => {
    const childLine = byId["de-nummer-gegen-kummer-kinder"];
    expect(childLine.value).toBe("116 111");
    expect(childLine.availabilityKey).toBe("crisis.availability.childLineHours");
    expect(childLine.availabilityKey).not.toBe("safety.24_7");
    expect(childLine.availabilityKey).not.toBe("crisis.availability.roundTheClockFree");
    expect(allTranslations["crisis.availability.childLineHours"].de).toContain("14–20 Uhr");
    expect(allTranslations[childLine.nameKey].de).toContain("Kinder- und Jugendtelefon");
  });

  it("lists the parents' helpline with its own hours", () => {
    const parentLine = byId["de-nummer-gegen-kummer-eltern"];
    expect(parentLine.value).toBe("0800 111 0 550");
    expect(parentLine.href).toBe("tel:08001110550");
    expect(parentLine.availabilityKey).toBe("crisis.availability.parentLineHours");
  });

  it("keeps German numbers identical in both languages (numbers are data, not copy)", () => {
    // Nothing in the German list may resolve its number through a translation.
    for (const contact of GERMAN_CRISIS_CONTACTS.filter((c) => c.kind !== "link")) {
      expect(contact.value, contact.id).toBeTruthy();
      expect(contact.valueKey, contact.id).toBeUndefined();
    }
  });
});

describe("crisis contact data integrity", () => {
  it("has exactly one display value source and a dialable href per contact", () => {
    for (const contact of ALL_CRISIS_CONTACTS) {
      const hasValue = typeof contact.value === "string" && contact.value.length > 0;
      const hasValueKey = typeof contact.valueKey === "string" && contact.valueKey.length > 0;
      expect(hasValue !== hasValueKey, `${contact.id}: needs value XOR valueKey`).toBe(true);
      expect(contact.href, contact.id).toMatch(/^(tel:|sms:|https:\/\/)/);
      if (contact.href.startsWith("tel:")) {
        expect(contact.href.slice(4), contact.id).toMatch(/^[+0-9]+$/);
      }
    }
  });

  it("has unique ids", () => {
    const ids = ALL_CRISIS_CONTACTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves every translation key it references (DE + EN, non-empty)", () => {
    const keys = new Set<string>();
    for (const contact of ALL_CRISIS_CONTACTS) {
      keys.add(contact.nameKey);
      keys.add(contact.descriptionKey);
      keys.add(contact.availabilityKey);
      if (contact.valueKey) keys.add(contact.valueKey);
    }
    for (const region of ALL_REGIONS) {
      const { primary, others, noticeKey } = getSafetyResources(region);
      keys.add(noticeKey);
      for (const section of [...primary, ...others]) keys.add(section.headingKey);
      for (const emergency of getEmergencyNumbers(region)) keys.add(emergency.labelKey);
    }

    const missing: string[] = [];
    for (const key of keys) {
      const entry = allTranslations[key];
      if (!entry?.en?.trim() || !entry?.de?.trim()) missing.push(key);
    }
    expect(missing).toEqual([]);
  });
});
