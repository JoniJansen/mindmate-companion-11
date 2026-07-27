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

describe("crisis detection — past tense cancels medium signals only", () => {
  const cases = [
    "früher habe ich mich geritzt aber das ist lange her",
    "i used to cut myself years ago",
  ];
  for (const text of cases) {
    it(`ignores historical self-harm reference: "${text}"`, () => {
      expect(detectCrisis(text).detected).toBe(false);
    });
  }

  it("still fires on an explicit statement, even in a past-tense sentence", () => {
    // Deliberate. Past-tense markers used to cancel high-severity matches too,
    // which meant "Es geht mir nicht mehr so gut, ich will mich umbringen" was
    // silently discarded because "nicht mehr so" sat nearby. Words like
    // "damals", "no longer" and "nicht mehr so" are ordinary speech, not
    // reliable tense markers. Showing a calm card to somebody recounting their
    // recovery is the acceptable side of that trade.
    expect(detectCrisis("damals war ich lebensmüde, heute geht es mir gut").detected).toBe(true);
  });
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

/**
 * Regression corpus from the adversarial review of 2026-07-27.
 *
 * Every case below was a MISS in the first implementation. They are grouped
 * separately as a reminder of why: the original 73 tests were written from the
 * patterns, so they only ever asserted what the patterns already did. These
 * were written from the opposite direction — how do people actually type — and
 * broke eight of them immediately.
 */
describe("crisis detection — regressions found by adversarial review", () => {
  const mustDetect: ReadonlyArray<[string, string]> = [
    ["most common German phrasing (server missed it entirely)", "ich will nicht mehr leben"],
    ["polite German variant", "ich möchte sterben"],
    ["German self-description", "ich bin suizidal"],
    ["German present tense, spaced verb", "ich bringe mich um"],
    ["German compound noun", "ich habe selbstmordgedanken"],
    ["umlaut typed as vowel pair", "ich bin lebensmuede"],
    ["colloquial English contraction", "i wanna die"],
    ["dropped apostrophe from transcript", "i can t take it anymore"],
    ["emoji between words", "ich will nicht 😭 mehr leben"],
    ["everyday 'no longer' must not cancel an acute statement", "I no longer see a point, I want to die"],
    ["everyday 'nicht mehr so' must not cancel", "Es geht mir nicht mehr so gut, ich will mich umbringen"],
    ["'damals' must not cancel a present statement", "Damals hat es angefangen, ich will mich umbringen"],
    ["past marker AFTER the statement must not cancel it", "Jetzt will ich mich umbringen. Früher habe ich sowas nie gedacht."],
  ];

  for (const [why, text] of mustDetect) {
    it(`${why}: "${text.slice(0, 45)}"`, () => {
      expect(detectCrisis(text).detected).toBe(true);
    });
  }
});

describe("crisis detection — patterns are shared, not duplicated", () => {
  /**
   * The previous version of this test compared substrings of the server source
   * and passed while the server was blind to "ich will nicht mehr leben".
   * A string comparison cannot detect a semantic gap, so both sides now import
   * the same module and the test asserts exactly that — no second copy exists.
   */
  it("the edge function imports the shared patterns instead of redefining them", async () => {
    const mod = await import("../../supabase/functions/chat/index.ts?raw");
    const source: string = (mod as { default?: string }).default ?? (mod as unknown as string);

    expect(source).toContain('from "../_shared/crisisPatterns.ts"');
    expect(source).toContain("detectCrisisIn");

    // No local redefinition may creep back in.
    expect(source).not.toContain("const HIGH_SEVERITY_PATTERNS");
    expect(source).not.toContain("const NEGATION_PATTERNS");
  });

  it("the pattern lists are non-trivial", () => {
    expect(HIGH_SEVERITY_PATTERNS.length).toBeGreaterThanOrEqual(20);
  });
});

/**
 * Second adversarial corpus (2026-07-27, run #2).
 *
 * The first rebuild passed its own tests and still missed 75 of 129 independent
 * phrasings — whole categories were blind: TikTok spellings ("kms", "unalive"),
 * domestic violence in the active voice ("mein mann schlägt mich"), and any
 * disclosure that followed a denial ("I told them I'm not suicidal but ...").
 * These cases come from outside the implementation and are kept verbatim so a
 * future refactor cannot quietly narrow the detector again.
 */
describe("crisis detection — second adversarial corpus", () => {
  const mustDetect = [
    "was wenn ich einfach nicht mehr wäre",
    "ich hab keine lust mehr zu leben",
    "ich mag nicht mehr",
    "am liebsten würde ich mich vor den zug werfen",
    "ich denke ans sterben",
    "ich habe mir überlegt wie ich es machen würde",
    "ich will mich umbrigen",
    "ich wuerde am liebsten sterben",
    "ich wär lieber tot",
    "mein leben beenden",
    "ich will von der brücke springen",
    "ich hab schon tabletten gesammelt",
    "ich denk oft dran mir was anzutun",
    "ich will mir was antun",
    "ich will mich selbst töten",
    "ich bin es leid zu leben",
    "ich möchte nicht mehr da sein",
    "ich will einfach nicht mehr existieren",
    "am liebsten wäre ich tot",
    "ich denke über suizid nach",
    "ich denke an suizid",
    "kms",
    "i wanna kms fr",
    "i want to unalive myself",
    "thinking about unaliving myself",
    "im gonna off myself",
    "i wanna off myself",
    "i might just end it",
    "i wish i was dead",
    "i wish i were dead",
    "i wish i could just disappear forever",
    "i dont wanna be alive anymore",
    "i dont wanna live anymore",
    "what if i just wasnt here anymore",
    "i'd be better off gone",
    "ngl i been thinking bout ending it all",
    "im finna end it",
    "i wanna sleep and never wake up",
    "i've been having thoughts of ending my life",
    "i want to neck myself",
    "i want to commit",
    "im done with life",
    "i cant live like this anymore",
    "ich hab mich heute wieder verletzt",
    "ich verletze mich selbst",
    "ich hab mich geschnitten gestern nacht",
    "ich schneide mir in den arm",
    "ich brenne mich mit zigaretten",
    "ich schlage mich selbst wenn ich wütend bin",
    "sh gedanken sind wieder da",
    "i relapsed on sh last night",
    "i cut again yesterday",
    "i want to cut",
    "i've been scratching myself till it bleeds",
    "i burned myself again",
    "mein freund schlägt mich",
    "mein mann schlägt mich regelmäßig",
    "mein vater hat mich missbraucht",
    "ich werde zuhause misshandelt",
    "ich habe angst vor meinem partner",
    "er bedroht mich mit dem messer",
    "ich fühle mich zuhause nicht sicher",
    "mein partner tut mir weh",
    "my boyfriend hits me",
    "my husband beats me",
    "i'm scared he will kill me",
    "he threatened to kill me",
    "i want to hurt someone",
    "ich will jemanden umbringen",
    "dieser bug bringt mich noch um. ich will mich umbringen",
    "i'm not going to work today. i want to kill myself",
    "let me kill the process first. then i want to kill myself",
    "ich bring das projekt um. ich will nicht mehr leben",
    "ich hab gesagt ich bin nicht suizidal aber das stimmt nicht ich will sterben",
    "i told my therapist i'm not suicidal but honestly i want to die",
    "everyone keeps asking if i'm not suicidal and i keep lying, i want to kill myself",
    "he abused me years ago and he is beating me again now",
    "damals war ich in therapie. ich kann nicht mehr",
    "damals ging es mir schlecht, heute ritze ich mich wieder",
    "ich habe mich früher geritzt aber heute ritze ich mich wieder",
    "i used to cut myself but i cut myself again last night",
    "vor 3 jahren war ich in der klinik, jetzt kann ich nicht mehr",
    "ich bin lebensmüde",
    "ich-will-sterben",
  ];

  const mustNotDetect = [
    "ich bring das projekt um",
    "dieser bug bringt mich noch um",
    "kill the background process",
    "ich kann nicht mehr schlafen",
    "we died laughing",
    "ich bin nicht suizidal",
    "früher habe ich mich geritzt aber das ist lange her",
    "i used to cut myself years ago",
    "ich kill den boss im spiel",
    "der vortrag war sterbenslangweilig",
    "i'd kill for a coffee",
    "she is drop-dead gorgeous",
    "i'm dead tired",
    "dying to see the new season",
    "ich könnte sterben vor scham",
    "it's killing me that i missed it",
    "let me kill this task",
  ];

  for (const text of mustDetect) {
    it(`detects: "${text.slice(0, 50)}"`, () => {
      expect(detectCrisis(text).detected).toBe(true);
    });
  }

  for (const text of mustNotDetect) {
    it(`ignores: "${text.slice(0, 50)}"`, () => {
      expect(detectCrisis(text).detected).toBe(false);
    });
  }

  it("handles NFD-decomposed umlauts (iOS and macOS deliver these)", () => {
    // "lebensmüde" as u + combining diaeresis. Before normalize("NFC") the
    // combining mark was stripped as punctuation and the word fell apart into
    // "lebensmu de", matching nothing.
    expect(detectCrisis("ich bin lebensmüde".normalize("NFD")).detected).toBe(true);
  });
});

/**
 * Third adversarial corpus (2026-07-27, run #3).
 *
 * Run #2 still missed 13 of 13 independently chosen phrasings. The cause was
 * not a gap in the list but the approach: literal phrase patterns require an
 * exact word sequence, and language has inflection and free word order.
 * "kill myself" matched, "killing myself" did not. "ich will sterben" matched,
 * "manchmal will ich einfach sterben" did not.
 *
 * The concept layer in crisisPatterns.ts matches word stems and combines them
 * within a clause instead. These cases pin that behaviour down.
 */
describe("crisis detection — third adversarial corpus (stems and word order)", () => {
  const mustDetect = [
    "ich will mich aufhängen",
    "ich will nicht mehr weiterleben",
    "ich hab mir schon einen strick gekauft",
    "ich ritz mich seit wochen",
    "meine mutter sperrt mich ein und schlägt mich mit dem gürtel",
    "i keep thinking about killing myself",
    "life isnt worth living anymore",
    "i self harmed again",
    "manchmal will ich einfach sterben",
    "ich tue mir selbst weh",
    "i am going to jump off the bridge tonight",
    "he abused me years ago and he is beating me again now",
    "ich denke oft ans sterben",
    "ich würde am liebsten einschlafen und nicht mehr aufwachen",
    "mein mann schlägt mich",
  ];

  const mustNotDetect = [
    "ich kill den boss im spiel",
    "der stress bringt mich langsam um",
    "ich hab mich beim rasieren geschnitten",
    "ich kann nicht mehr aufhören an sie zu denken",
    "mein kopf tut mir weh",
    "mein rücken tut mir weh",
    "ich könnte sterben vor scham",
  ];

  for (const text of mustDetect) {
    it(`detects: "${text.slice(0, 50)}"`, () => {
      expect(detectCrisis(text).detected).toBe(true);
    });
  }

  for (const text of mustNotDetect) {
    it(`ignores: "${text.slice(0, 50)}"`, () => {
      expect(detectCrisis(text).detected).toBe(false);
    });
  }
});
