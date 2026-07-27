import { describe, it, expect } from "vitest";
import {
  detectCrisis,
  HIGH_SEVERITY_PATTERNS,
} from "@/lib/crisisDetection";

/**
 * Test corpus for the deterministic crisis layer.
 *
 * The asymmetry is deliberate and matches the tuning rule in
 * `src/lib/crisisDetection.ts`: a missed crisis is the failure that matters.
 * Positive cases are therefore exhaustive and phrased the way people actually
 * write — lower case, no punctuation, slang, half-sentences. Negative cases
 * cover the idioms that borrow the vocabulary of dying, because a layer that
 * cries wolf on "this deadline is killing me" gets ignored when it counts.
 */

describe("crisis detection — explicit statements (German)", () => {
  const cases = [
    "ich will nicht mehr leben",
    "ich will mich umbringen",
    "ich denke darüber nach mich umzubringen",
    "ich will sterben",
    "ich möchte sterben",
    "ich bin lebensmüde",
    "ich will einfach nicht mehr aufwachen",
    "ich will schluss machen mit allem",
    "ich denke daran mir das leben zu nehmen",
  ];
  for (const text of cases) {
    it(`detects: "${text}"`, () => {
      const result = detectCrisis(text);
      expect(result.detected).toBe(true);
      expect(result.severity).toBe("high");
    });
  }
});

describe("crisis detection — explicit statements (English)", () => {
  const cases = [
    "i want to die",
    "i want to kill myself",
    "i am going to hurt myself",
    "i have a plan to end it",
    "i want to take my own life",
    "i'm suicidal",
    "i have suicidal thoughts",
    "i don't want to wake up",
    "i want it all to stop",
  ];
  for (const text of cases) {
    it(`detects: "${text}"`, () => {
      const result = detectCrisis(text);
      expect(result.detected).toBe(true);
      expect(result.severity).toBe("high");
    });
  }
});

describe("crisis detection — indirect and paraphrased", () => {
  const cases = [
    "wenn ich nicht mehr da wäre würde es niemandem auffallen",
    "ohne mich wären alle besser dran",
    "es hat alles keinen sinn mehr",
    "ich halte das nicht mehr aus",
    "ich kann nicht mehr",
    "everyone would be better off without me",
    "there is no reason to live",
    "i can't go on",
    "i can't do this anymore",
    "life is not worth living",
  ];
  for (const text of cases) {
    it(`detects: "${text}"`, () => {
      expect(detectCrisis(text).detected).toBe(true);
    });
  }
});

describe("crisis detection — slang and youth language", () => {
  const cases = [
    "hab kein bock mehr auf alles",
    "ich will einfach nur noch weg",
    "ich ritze mich wieder",
    "hab mich gestern geritzt",
    "i've been cutting myself again",
    "i keep hurting myself",
  ];
  for (const text of cases) {
    it(`detects: "${text}"`, () => {
      expect(detectCrisis(text).detected).toBe(true);
    });
  }
});

describe("crisis detection — self-harm and danger from others", () => {
  const cases = [
    "ich will mir selbst weh tun",
    "ich werde zuhause geschlagen",
    "ich habe angst um mein leben",
    "i am being abused at home",
    "someone is hurting me",
    "i feel unsafe at home",
  ];
  for (const text of cases) {
    it(`detects: "${text}"`, () => {
      expect(detectCrisis(text).detected).toBe(true);
    });
  }
});

describe("crisis detection — voice transcript style (no punctuation, lower case)", () => {
  const cases = [
    "also ich weiß auch nicht ich will einfach nicht mehr leben verstehst du",
    "ähm ja ich glaube ich bin lebensmüde",
    "i mean i guess i want to die i don't know",
    "so yeah i'm suicidal i think that's the word",
    "ich kann nicht mehr ich halte das nicht mehr aus",
  ];
  for (const text of cases) {
    it(`detects: "${text.slice(0, 40)}..."`, () => {
      expect(detectCrisis(text).detected).toBe(true);
    });
  }
});

describe("crisis detection — must NOT fire on idioms and everyday speech", () => {
  const cases = [
    "ich bring das projekt heute noch um",
    "dieser bug bringt mich noch um",
    "der termin killt mich",
    "wir haben uns totgelacht",
    "der vortrag war sterbenslangweilig",
    "ich könnte sterben vor scham",
    "i need to kill the background process",
    "let me kill this task and restart",
    "this deadline is killing me that i can't finish it",
    "i'm dying to see the new season",
    "i'd kill for a coffee right now",
    "we died laughing at that joke",
    "i'm dead tired after that meeting",
    "she is drop-dead gorgeous",
    "ich kann nicht mehr schlafen seit wochen",
    "ich kann nicht mehr essen ohne übelkeit",
  ];
  for (const text of cases) {
    it(`ignores: "${text}"`, () => {
      const result = detectCrisis(text);
      expect(result.detected).toBe(false);
      expect(result.severity).toBe("none");
    });
  }
});

describe("crisis detection — past tense should not fire on its own", () => {
  const cases = [
    "früher habe ich mich geritzt aber das ist lange her",
    "i used to cut myself years ago",
    "damals war ich lebensmüde, heute geht es mir gut",
  ];
  for (const text of cases) {
    it(`ignores historical reference: "${text}"`, () => {
      expect(detectCrisis(text).detected).toBe(false);
    });
  }
});

describe("crisis detection — present statement wins over nearby past tense", () => {
  it("fires when a current statement follows a historical one", () => {
    const text =
      "i used to cut myself years ago and i got better for a long time " +
      "but this week is different and now i want to die";
    const result = detectCrisis(text);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("high");
  });

  it("fires on a current German statement after a historical clause", () => {
    const text =
      "früher habe ich mich geritzt das ist lange her und ging lange gut " +
      "aber gerade will ich mich umbringen";
    expect(detectCrisis(text).detected).toBe(true);
  });
});

describe("crisis detection — input handling", () => {
  it("accepts an array of messages and finds a signal in any of them", () => {
    const result = detectCrisis(["hallo", "wie geht es dir", "ich will sterben"]);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("high");
  });

  it("prefers high severity even when a medium signal appears first", () => {
    const result = detectCrisis(["ich kann nicht mehr", "ich will mich umbringen"]);
    expect(result.severity).toBe("high");
  });

  it("returns none for empty, blank or non-string input", () => {
    expect(detectCrisis("").detected).toBe(false);
    expect(detectCrisis("   ").detected).toBe(false);
    expect(detectCrisis([]).detected).toBe(false);
    expect(detectCrisis(["", "  "]).detected).toBe(false);
  });

  it("handles typographic apostrophes like plain ones", () => {
    expect(detectCrisis("i don’t want to wake up").detected).toBe(true);
  });

  it("is not confused by extra whitespace", () => {
    expect(detectCrisis("ich   will    sterben").detected).toBe(true);
  });
});

describe("crisis detection — kept in sync with the server copy", () => {
  /**
   * The edge function `supabase/functions/chat/index.ts` carries its own copy
   * of these patterns (it runs in Deno and cannot import from `src/`). Silent
   * divergence would mean the server stops recognising something the client
   * still flags, or vice versa. Rather than compare every pattern — the client
   * list is deliberately broader — this asserts that the server still contains
   * the core high-severity signals.
   */
  it("server still carries the core high-severity signals", async () => {
    const mod = await import("../../supabase/functions/chat/index.ts?raw");
    const source: string = (mod as { default?: string }).default ?? (mod as unknown as string);

    expect(typeof source).toBe("string");
    expect(source.length).toBeGreaterThan(1000);

    const coreSignals = [
      "want\\s+to\\s+(die",
      "mich\\s+umbringen",
      "lebensmüde",
      "suicid",
    ];
    for (const signal of coreSignals) {
      expect(source).toContain(signal);
    }
  });

  it("client high-severity list has not shrunk below the server baseline", () => {
    // Guards against someone deleting patterns during a refactor. The client
    // list may grow freely; it must never fall below what the server knows.
    expect(HIGH_SEVERITY_PATTERNS.length).toBeGreaterThanOrEqual(10);
  });
});
