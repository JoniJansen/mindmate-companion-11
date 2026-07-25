import { describe, it, expect } from "vitest";
import { exercises, getExerciseById } from "@/data/exercises";
import { exerciseTranslations, translations } from "@/hooks/useTranslation";
import { getRecommendedExerciseId, shouldOfferExercise, LOW_MOOD_THRESHOLD } from "@/lib/moodExerciseMap";

describe("Feature Upgrade — Exercise library", () => {
  const NEW_IDS = ["breathing-478", "breathing-box", "pmr-short", "body-scan"];

  it("all new exercises exist and are retrievable by id", () => {
    for (const id of NEW_IDS) {
      const ex = getExerciseById(id);
      expect(ex, `exercise ${id} missing`).toBeDefined();
      expect(ex!.steps.length).toBeGreaterThan(0);
    }
  });

  it("every exercise has a DE translation whose steps match the data step count", () => {
    for (const ex of exercises) {
      const tr = exerciseTranslations[ex.id];
      expect(tr, `translation for ${ex.id} missing`).toBeDefined();
      expect(tr.de.title).toBeTruthy();
      expect(tr.de.description).toBeTruthy();
      expect(tr.de.longDescription).toBeTruthy();
      expect(tr.en.title).toBeTruthy();
      // DE steps drive the player display + TTS — count must match exactly
      expect(tr.de.steps, `DE steps for ${ex.id} missing`).toBeDefined();
      expect(tr.de.steps!.length, `DE step count mismatch for ${ex.id}`).toBe(ex.steps.length);
    }
  });

  it("4-7-8 breathing follows the correct 4s/7s/8s rhythm for all four cycles", () => {
    const ex = getExerciseById("breathing-478")!;
    const cycleDurations = ex.steps.slice(3, 15).map((s) => s.duration);
    expect(cycleDurations).toEqual([4, 7, 8, 4, 7, 8, 4, 7, 8, 4, 7, 8]);
  });

  it("box breathing uses an even 4-4-4-4 rhythm for all three cycles", () => {
    const ex = getExerciseById("breathing-box")!;
    const cycleDurations = ex.steps.slice(2, 14).map((s) => s.duration);
    expect(cycleDurations).toEqual(Array(12).fill(4));
  });

  it("PMR alternates ~5s tension (spoken count) with ~10s release for five muscle groups", () => {
    const ex = getExerciseById("pmr-short")!;
    // Steps 2..11 are 5 tension/release pairs
    const pairs = ex.steps.slice(2, 12);
    expect(pairs.length).toBe(10);
    pairs.forEach((step, i) => {
      if (i % 2 === 0) {
        // Tension step: counts to 5 in the instruction
        expect(step.instruction).toContain("1... 2... 3... 4... 5");
      } else {
        // Release step: at least ~10s to let go
        expect(step.duration!).toBeGreaterThanOrEqual(10);
      }
    });
  });

  it("new exercises have durationSeconds equal to the sum of their step durations", () => {
    for (const id of NEW_IDS) {
      const ex = getExerciseById(id)!;
      const sum = ex.steps.reduce((acc, s) => acc + (s.duration || 0), 0);
      expect(ex.durationSeconds, `durationSeconds mismatch for ${id}`).toBe(sum);
    }
  });
});

describe("Feature Upgrade — Mood → Exercise bridge", () => {
  it("only offers an exercise for low moods (<= threshold)", () => {
    expect(LOW_MOOD_THRESHOLD).toBe(2);
    expect(shouldOfferExercise(1)).toBe(true);
    expect(shouldOfferExercise(2)).toBe(true);
    expect(shouldOfferExercise(3)).toBe(false);
    expect(shouldOfferExercise(5)).toBe(false);
    expect(getRecommendedExerciseId(4, ["anxious"])).toBeNull();
  });

  it("maps feelings to the matching exercise", () => {
    expect(getRecommendedExerciseId(2, ["anxious"])).toBe("grounding-54321");
    expect(getRecommendedExerciseId(1, ["stressed"])).toBe("breathing-478");
    expect(getRecommendedExerciseId(2, ["overwhelmed"])).toBe("breathing-478");
    expect(getRecommendedExerciseId(2, ["tired"])).toBe("body-scan");
    expect(getRecommendedExerciseId(2, [])).toBe("breathing-60");
    // Acute anxiety takes priority over stress
    expect(getRecommendedExerciseId(1, ["stressed", "anxious"])).toBe("grounding-54321");
  });

  it("every recommendable exercise id exists in the exercise data", () => {
    const feelingSets = [["anxious"], ["stressed"], ["overwhelmed"], ["tired"], []];
    for (const feelings of feelingSets) {
      const id = getRecommendedExerciseId(1, feelings)!;
      expect(getExerciseById(id), `recommended id ${id} not found`).toBeDefined();
    }
  });

  it("bridge i18n keys exist in EN and DE", () => {
    for (const key of ["mood.exerciseBridge.invite", "mood.exerciseBridge.start"]) {
      expect(translations[key]).toBeDefined();
      expect(translations[key].en).toBeTruthy();
      expect(translations[key].de).toBeTruthy();
    }
  });
});

describe("Feature Upgrade — Memory Moment card", () => {
  it("memory moment i18n keys exist and the title supports name interpolation", () => {
    const keys = [
      "home.memoryMomentTitle",
      "home.memoryMomentIntro",
      "home.memoryMomentQuestion",
      "home.memoryMomentMsg",
      "home.memoryMomentContinue",
      "home.talkAboutIt",
      "home.notNow",
    ];
    for (const key of keys) {
      expect(translations[key], `${key} missing`).toBeDefined();
      expect(translations[key].en).toBeTruthy();
      expect(translations[key].de).toBeTruthy();
    }
    expect(translations["home.memoryMomentTitle"].en).toContain("{name}");
    expect(translations["home.memoryMomentTitle"].de).toContain("{name}");
  });
});
