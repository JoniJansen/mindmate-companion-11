import { describe, it, expect } from "vitest";

/**
 * i18n Consistency — Smoke Layer
 *
 * regression.test.ts already checks the MERGED translations object.
 * This file checks what the merge can hide:
 *  1. Each namespace module individually (so a violation is traceable to its file)
 *  2. Duplicate keys across namespaces (later namespace silently overrides earlier one)
 *  3. The structured exerciseTranslations / topicTranslations objects,
 *     which are NOT part of the flat merged object and were previously untested.
 */
import { commonTranslations } from "@/translations/common";
import { chatTranslations } from "@/translations/chat";
import { journalTranslations } from "@/translations/journal";
import { moodTranslations } from "@/translations/mood";
import { homeTranslations } from "@/translations/home";
import { companionTranslations } from "@/translations/companion";
import { settingsTranslations } from "@/translations/settings";
import { paymentsTranslations } from "@/translations/payments";
import { contentTranslations } from "@/translations/content";
import { authTranslations } from "@/translations/auth";
import { emptyStatesTranslations } from "@/translations/emptyStates";
import { allTranslations } from "@/translations";
import { exerciseTranslations, topicTranslations } from "@/hooks/useTranslation";

const namespaces: Record<string, Record<string, { en: string; de: string }>> = {
  common: commonTranslations,
  chat: chatTranslations,
  journal: journalTranslations,
  mood: moodTranslations,
  home: homeTranslations,
  companion: companionTranslations,
  settings: settingsTranslations,
  payments: paymentsTranslations,
  content: contentTranslations,
  auth: authTranslations,
  emptyStates: emptyStatesTranslations,
};

describe("i18n: namespace completeness (DE + EN, no empty strings)", () => {
  for (const [name, table] of Object.entries(namespaces)) {
    it(`namespace "${name}" has non-empty DE and EN for every key`, () => {
      const violations: string[] = [];
      for (const [key, value] of Object.entries(table)) {
        if (typeof value?.en !== "string" || value.en.trim() === "") {
          violations.push(`${key}: EN missing/empty`);
        }
        if (typeof value?.de !== "string" || value.de.trim() === "") {
          violations.push(`${key}: DE missing/empty`);
        }
      }
      expect(violations).toEqual([]);
    });
  }

  it("namespaces are not empty (guards against accidental truncation)", () => {
    for (const [name, table] of Object.entries(namespaces)) {
      expect(Object.keys(table).length, `namespace ${name}`).toBeGreaterThan(0);
    }
  });
});

describe("i18n: no silent key collisions between namespaces", () => {
  it("no key is defined in more than one namespace", () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const [name, table] of Object.entries(namespaces)) {
      for (const key of Object.keys(table)) {
        if (seen.has(key)) {
          collisions.push(`"${key}" defined in both "${seen.get(key)}" and "${name}"`);
        } else {
          seen.set(key, name);
        }
      }
    }
    expect(collisions).toEqual([]);
  });

  it("merged allTranslations contains exactly the union of all namespaces", () => {
    const totalKeys = Object.values(namespaces).reduce(
      (sum, table) => sum + Object.keys(table).length,
      0,
    );
    // If a key collided, the merged object would be smaller than the sum.
    expect(Object.keys(allTranslations).length).toBe(totalKeys);
  });
});

describe("i18n: structured exercise translations (not covered by flat-key tests)", () => {
  it("every exerciseTranslations entry has non-empty DE and EN core texts", () => {
    const violations: string[] = [];
    for (const [id, entry] of Object.entries(exerciseTranslations)) {
      for (const lang of ["en", "de"] as const) {
        const l = entry[lang];
        if (!l) {
          violations.push(`${id}: ${lang} block missing`);
          continue;
        }
        for (const field of ["title", "description", "longDescription"] as const) {
          if (typeof l[field] !== "string" || l[field].trim() === "") {
            violations.push(`${id}: ${lang}.${field} missing/empty`);
          }
        }
        if (l.steps) {
          l.steps.forEach((s, i) => {
            if (typeof s !== "string" || s.trim() === "") {
              violations.push(`${id}: ${lang}.steps[${i}] empty`);
            }
          });
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("every topicTranslations entry has non-empty DE and EN core texts", () => {
    const violations: string[] = [];
    for (const [id, entry] of Object.entries(topicTranslations)) {
      for (const lang of ["en", "de"] as const) {
        const l = entry[lang];
        if (!l) {
          violations.push(`${id}: ${lang} block missing`);
          continue;
        }
        for (const field of ["title", "description", "longDescription"] as const) {
          if (typeof l[field] !== "string" || l[field].trim() === "") {
            violations.push(`${id}: ${lang}.${field} missing/empty`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
