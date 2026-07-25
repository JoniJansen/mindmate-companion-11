import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { allTranslations } from "@/translations";

/**
 * i18n Ratchet — No Ghost Keys
 *
 * Scans all source files for literal `t("...")` / `t('...')` calls and fails
 * if a referenced key is not defined in the merged translations object.
 * Users would otherwise see the raw key (e.g. "summary.keyThemes") in the UI,
 * because useTranslation's t() falls back to returning the key itself.
 *
 * Scope & determinism notes:
 * - `allTranslations` (the merge of every namespace in src/translations/) is
 *   the single source of truth: t() resolves exclusively from it. The
 *   structured exerciseTranslations/topicTranslations in useTranslation.ts are
 *   accessed via their own getters (never via t()), so they are out of scope.
 * - Only STRING LITERAL keys are checked. Dynamic keys built with template
 *   strings (e.g. t(`mood.${id}`)) cannot be statically verified without
 *   false positives, so the regex deliberately does not match backticks.
 *   Dynamic keys remain covered at runtime by the DEV console warning in t().
 * - src/translations/ itself is excluded (keys are defined there, and values
 *   could coincidentally contain matching text), as are test files (they may
 *   reference intentionally-missing keys when testing fallback behavior).
 */

// Vitest runs with cwd = project root (where vitest.config.ts lives).
// import.meta.url is not a file:// URL under the jsdom environment, so we
// resolve from cwd instead.
const SRC_DIR = join(process.cwd(), "src");

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      // "translations" skip = src/translations/ (keys are defined there)
      if (entry === "node_modules" || entry === "translations") continue;
      collectSourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

// Matches t("some.key") / t('some.key'), including multi-line formatting.
// \b prevents matching e.g. format(...), expect(...); the character class
// excludes quotes/backticks/newlines so template strings and string
// concatenation are never (mis)matched.
const T_CALL_RE = /\bt\(\s*(["'])([^"'`\n]+?)\1\s*\)/g;

describe("i18n: every literal t() key is defined (no ghost keys)", () => {
  const files = collectSourceFiles(SRC_DIR);
  const ghosts: string[] = [];
  let totalCalls = 0;

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    let match: RegExpExecArray | null;
    T_CALL_RE.lastIndex = 0;
    while ((match = T_CALL_RE.exec(content))) {
      totalCalls++;
      const key = match[2];
      if (!(key in allTranslations)) {
        const line = content.slice(0, match.index).split("\n").length;
        ghosts.push(`"${key}" @ ${relative(SRC_DIR, file)}:${line}`);
      }
    }
  }

  it("finds a plausible number of t() calls (guards against a broken scanner)", () => {
    // ~970 literal t() calls existed when this ratchet was added. If the
    // regex or file walk silently breaks, this floor fails loudly instead
    // of the suite going green on an empty scan.
    expect(totalCalls).toBeGreaterThan(500);
  });

  it("references no translation key that is missing from allTranslations", () => {
    expect(ghosts).toEqual([]);
  });
});
