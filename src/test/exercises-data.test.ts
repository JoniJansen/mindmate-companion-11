import { describe, it, expect } from "vitest";

/**
 * Exercise Data Validation — Smoke Layer
 *
 * Generic over ALL entries in src/data/exercises.ts (intentionally NOT
 * hardcoded to exercise names, so newly added exercises are covered
 * automatically). Protects:
 *  - the ExercisePlayer timing engine (step durations pair 1:1 with
 *    translated instructions — a length mismatch desyncs audio and timer)
 *  - German users (every exercise must have a DE translation entry,
 *    otherwise getExerciseDisplay silently falls back to English)
 */
import { exercises, getExerciseById, type Exercise } from "@/data/exercises";
import { exerciseTranslations } from "@/hooks/useTranslation";

const VALID_CATEGORIES: Exercise["category"][] = [
  "breathing",
  "cognitive",
  "journaling",
  "values",
  "boundaries",
  "grounding",
];

describe("exercises.ts: structural validity (generic over all entries)", () => {
  it("contains at least the original 6 exercises", () => {
    expect(exercises.length).toBeGreaterThanOrEqual(6);
  });

  it("all exercise ids are unique and resolvable via getExerciseById", () => {
    const ids = exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(getExerciseById(id)?.id).toBe(id);
    }
  });

  it("every exercise has valid base fields (title, description, category, icon, color)", () => {
    const violations: string[] = [];
    for (const ex of exercises) {
      if (!ex.id?.trim()) violations.push(`(unknown): empty id`);
      if (!ex.title?.trim()) violations.push(`${ex.id}: empty title`);
      if (!ex.description?.trim()) violations.push(`${ex.id}: empty description`);
      if (!ex.longDescription?.trim()) violations.push(`${ex.id}: empty longDescription`);
      if (!ex.duration?.trim()) violations.push(`${ex.id}: empty duration label`);
      if (!VALID_CATEGORIES.includes(ex.category)) violations.push(`${ex.id}: invalid category "${ex.category}"`);
      if (typeof ex.icon !== "function" && typeof ex.icon !== "object") violations.push(`${ex.id}: missing icon`);
      if (!ex.color?.trim()) violations.push(`${ex.id}: empty color`);
    }
    expect(violations).toEqual([]);
  });

  it("every exercise has durationSeconds > 0", () => {
    const violations = exercises
      .filter((ex) => !(Number.isFinite(ex.durationSeconds) && ex.durationSeconds > 0))
      .map((ex) => `${ex.id}: durationSeconds=${ex.durationSeconds}`);
    expect(violations).toEqual([]);
  });

  it("every exercise has at least one step; all steps have non-empty instruction and duration > 0 when set", () => {
    const violations: string[] = [];
    for (const ex of exercises) {
      if (!Array.isArray(ex.steps) || ex.steps.length === 0) {
        violations.push(`${ex.id}: no steps`);
        continue;
      }
      ex.steps.forEach((step, i) => {
        if (!step.instruction?.trim()) violations.push(`${ex.id}: steps[${i}] empty instruction`);
        if (step.duration !== undefined && !(Number.isFinite(step.duration) && step.duration > 0)) {
          violations.push(`${ex.id}: steps[${i}] invalid duration=${step.duration}`);
        }
      });
    }
    expect(violations).toEqual([]);
  });

  it("prompts, when present, are non-empty strings", () => {
    const violations: string[] = [];
    for (const ex of exercises) {
      ex.prompts?.forEach((p, i) => {
        if (!p?.trim()) violations.push(`${ex.id}: prompts[${i}] empty`);
      });
    }
    expect(violations).toEqual([]);
  });
});

describe("exercises.ts ↔ exerciseTranslations: DE + EN coverage", () => {
  it("every exercise has a translation entry with non-empty DE and EN texts", () => {
    const violations: string[] = [];
    for (const ex of exercises) {
      const tr = exerciseTranslations[ex.id];
      if (!tr) {
        violations.push(`${ex.id}: no exerciseTranslations entry — German users would see English`);
        continue;
      }
      for (const lang of ["en", "de"] as const) {
        const l = tr[lang];
        if (!l?.title?.trim()) violations.push(`${ex.id}: ${lang}.title missing/empty`);
        if (!l?.description?.trim()) violations.push(`${ex.id}: ${lang}.description missing/empty`);
        if (!l?.longDescription?.trim()) violations.push(`${ex.id}: ${lang}.longDescription missing/empty`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("translated step lists match the data step count (player pairs instruction[i] with steps[i].duration)", () => {
    const violations: string[] = [];
    for (const ex of exercises) {
      const tr = exerciseTranslations[ex.id];
      if (!tr) continue; // reported by the previous test
      for (const lang of ["en", "de"] as const) {
        const steps = tr[lang]?.steps;
        if (steps && steps.length !== ex.steps.length) {
          violations.push(
            `${ex.id}: ${lang} has ${steps.length} translated steps but data has ${ex.steps.length} — timing desync`,
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("translated prompt lists match the data prompt count", () => {
    const violations: string[] = [];
    for (const ex of exercises) {
      const tr = exerciseTranslations[ex.id];
      if (!tr || !ex.prompts?.length) continue;
      for (const lang of ["en", "de"] as const) {
        const prompts = tr[lang]?.prompts;
        if (prompts && prompts.length !== ex.prompts.length) {
          violations.push(`${ex.id}: ${lang} has ${prompts.length} prompts but data has ${ex.prompts.length}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("no orphan translation ids (catches typos when adding new exercises)", () => {
    const known = new Set(exercises.map((e) => e.id));
    const orphans = Object.keys(exerciseTranslations).filter((id) => !known.has(id));
    expect(orphans).toEqual([]);
  });
});
