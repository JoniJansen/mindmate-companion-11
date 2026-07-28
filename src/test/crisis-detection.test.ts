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

// ─────────────────────────────────────────────────────────────────────────────
// Unabhängiger Negativkorpus, 28.07.2026.
//
// Erstellt von einer Instanz, die die Erkennungsmuster ausdrücklich nicht
// gelesen hat, und anschließend von einer zweiten adversarisch gegengeprüft.
// Die Gegenprüfung hat zehn Fälle verworfen — dokumentiert samt Begründung in
// audit/KRISEN_GRAUBEREICH.md. Verworfen wurde vor allem fast die gesamte
// Verneinungs-Kategorie: Sätze wie "ich habe keine solchen Gedanken, ich bin
// einfach nur müde" als harmlos einzuchecken würde die Regel "Verneinung heißt
// sicher" festschreiben — und durch dasselbe Raster fiele dann auch
// "ich will nicht mehr leben".
//
// Deckt Gerüstpunkt B7 ab (Falsch-Positiv-Rate, gefordert ≥ 50 Fälle).
// ─────────────────────────────────────────────────────────────────────────────
describe("crisis detection — independent negative corpus (must NOT fire)", () => {
  const cases = [
    // Fünf Fälle stehen hier bewusst NICHT — sie lösen weiterhin aus, weil die
    // Regeln, die sie unterdrückt hätten, im adversarischen Angriff 40 echte
    // Krisenäußerungen mitgelöscht haben. Begründung je Fall in
    // audit/KRISEN_GRAUBEREICH.md, Abschnitt B.
    // Kategorie 1 — Redewendungen und Idiome
    "ich sterbe vor Hunger",
    "ich sterbe vor Durst, gibt es hier irgendwo Wasser",
    "ich bin todm\u00fcde",
    "der Vortrag war zum Sterben langweilig",
    "ich lach mich tot",
    "das war echt zum Totlachen",
    "ich sch\u00e4me mich zu Tode",
    "Totgesagte leben l\u00e4nger",
    "nur \u00fcber meine Leiche kommt das Sofa in dieses Wohnzimmer",
    "ich habe mich totgesucht nach meinen Schl\u00fcsseln",
    "mein Handy ist tot, der Akku ist leer",
    "der Drucker ist mal wieder gestorben",
    "mein Laptop hat gestern endg\u00fcltig den Geist aufgegeben",
    "she is absolutely killing it at work right now",
    "I'm dead tired after that long flight",
    // Kategorie 2 — Gaming und Sport
    "der Endboss hat mich dreimal hintereinander gekillt",
    "das Spiel ging in sudden death",
    "mein Charakter ist beim Raid gestorben, ich respawne gleich",
    "ich habe nur noch ein Leben \u00fcbrig, dann ist Game over",
    "unser Team ist in der Verl\u00e4ngerung komplett gestorben",
    "meine Pflanze auf dem Balkon ist leider eingegangen",
    "mein Tamagotchi ist gestorben, als ich acht war",
    "wir haben die Gegner im Match komplett vernichtet",
    "I died right at the final checkpoint again",
    "that last boss killed me like ten times in a row",
    "the match went into sudden death overtime",
    // Kategorie 3 — Übertreibung im Alltagsfrust
    "dieser Job bringt mich noch um",
    "die Hitze killt mich heute komplett",
    "diese Deadline bringt mich fast ins Grab",
    "der Stau heute Morgen hat mich fast umgebracht",
    "das Meeting war m\u00f6rderisch lang",
    "die Steuererkl\u00e4rung ist der Tod jeder guten Laune",
    "diese Kopfschmerzen bringen mich um den Verstand",
    "der Umzug am Wochenende hat mich fast erledigt",
    "ich sterbe gleich, wenn ich heute noch eine Excel-Tabelle sehen muss",
    "meine Nachbarn mit ihrer Bohrmaschine bringen mich noch ins Grab",
    // Kategorie 4 — Berichte über Dritte oder Vergangenes
    "mein Opa ist letztes Jahr gestorben, ich denke oft an ihn",
    "meine Oma ist friedlich im Schlaf eingeschlafen",
    "meine Nachbarin hat ihren Mann durch Krebs verloren",
    "unser Hund musste letzte Woche eingeschl\u00e4fert werden",
    "auf der Beerdigung meines Onkels waren \u00fcber hundert Leute",
    "mein Kollege spricht offen dar\u00fcber, dass sein Bruder gestorben ist",
    "my grandfather passed away last spring and I still miss him",
    "a classmate of mine died in an accident when we were teenagers",
    // Kategorie 5 — Medien, Bücher, Nachrichten, Serien
    "in der Serie stirbt in jeder Folge irgendjemand",
    "ich lese gerade einen Krimi, in dem drei Menschen ermordet werden",
    "in den Nachrichten ging es heute um die Suizidrate bei Jugendlichen",
    "der Podcast behandelt das Thema Sterbehilfe sehr sachlich",
    "im Film hat sich am Ende jemand umgebracht, das war ziemlich heftig",
    "ich habe gestern eine Doku \u00fcber Suizidpr\u00e4vention gesehen",
    "der Roman endet damit, dass die Hauptfigur ins Wasser geht",
    "the show killed off my favorite character in season three",
    // Kategorie 6 — Fachliche oder berufliche Rede
    "ich arbeite auf der Palliativstation und begleite sterbende Menschen",
    "als Pflegekraft erlebe ich den Tod fast jede Woche",
    "ich schreibe meine Bachelorarbeit \u00fcber Suizidpr\u00e4vention",
    "in meiner Ausbildung lernen wir, Krisensignale fr\u00fch zu erkennen",
    "als Not\u00e4rztin muss ich manchmal den Tod feststellen",
    "ich mache eine Fortbildung zum Thema Trauerbegleitung",
    "I volunteer on a crisis helpline two evenings a month",
    // Kategorie 7 — Genesung mit ausdrücklichem Gegenwartsbezug
    // "fr\u00fcher wollte ich nicht mehr leben, heute geht es mir richtig gut" steht
    // hier bewusst NICHT. Der Satz l\u00f6st weiterhin aus \u2014 begr\u00fcndet in
    // audit/KRISEN_GRAUBEREICH.md und im Testfall \u00fcber die Vergangenheitsform
    // weiter unten. Ein zur\u00fcckliegender Suizidversuch ist der st\u00e4rkste bekannte
    // Einzelpr\u00e4diktor; bei dieser Gruppe blenden wir das Angebot nicht aus.
    "vor zehn Jahren war ich in einer schweren Krise, die liegt weit hinter mir",
    "ich habe meine Therapie erfolgreich abgeschlossen und f\u00fchle mich seitdem stabil",
    "damals war ich in der Klinik, heute stehe ich fest im Leben",
    "ich bin froh, dass ich mir damals Hilfe geholt habe, seitdem geht es mir gut",
    "meine dunkelste Zeit ist lange vorbei, ich bin heute dankbar, dass ich sie \u00fcberstanden habe",
    "I used to struggle a lot years ago, but I am in a good place now",
    // Kategorie 8 — Erschöpfung mit klarer zeitlicher oder sachlicher Begrenzung
    "ich bin heute echt fertig, ich brauche einfach mal Schlaf",
    "ich bin total ausgelaugt von dieser Woche",
    "ich bin frustriert und will heute einfach nichts mehr machen",
    "ich habe keine Lust mehr auf diese Arbeitswoche, Freitag kann kommen",
    "ich bin traurig, weil mein Urlaub schon wieder vorbei ist",
    "I'm exhausted and just want to sleep for twelve hours",
    // Kategorie 9 — Englischer Alltag und Slang
    "this deadline is killing me",
    "I could just die of embarrassment",
    "I'm dead serious about this",
    "that joke killed me, I laughed for minutes",
    "my phone battery is dead again",
    "the party was dead boring",
    "I'm dying laughing at this meme",
    "we absolutely murdered that presentation today",
    "I would kill for a coffee right now",
    "he is drop dead gorgeous",
    // Kategorie 10 — Verneinung mit ausdrücklichem Schutzfaktor
    "ich will auf keinen Fall sterben, ich habe noch so viel vor",
    "I have no intention of hurting myself, I just needed to vent",
  ];
  for (const text of cases) {
    it(`ignores: "${text}"`, () => {
      const result = detectCrisis(text);
      expect(result.detected).toBe(false);
      expect(result.severity).toBe("none");
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Adversarischer Angriff auf die Kontextregeln, 28.07.2026.
//
// Nachdem der unabhängige Negativkorpus 16 Fehlalarme gezeigt hatte, wurden
// vier Kontextregeln eingebaut. Eine dritte Instanz hat sie daraufhin
// angegriffen — nicht durch Raten, sondern indem sie jeden Kandidatensatz
// zweimal gegen den echten Code laufen ließ: einmal mit und einmal ohne die
// jeweilige Regel. Ergebnis: 58 echte Krisenäußerungen wurden von den neuen
// Regeln verschluckt, 44 davon auf der höchsten Stufe.
//
// Drei der vier Regeln wurden daraufhin ersatzlos entfernt. Diese Sätze sind
// der Beleg, dass sie nicht zurückkommen dürfen — jede künftige Regel, die
// einen davon stilllegt, bricht hier.
//
// Der letzte Fall ("im suicidal") war kein Schaden der Regeln, sondern eine
// bestehende Lücke: das Wort "suicidal" fehlte in den Wortstämmen, und das
// Literalmuster verlangte zwingend "i'm" oder "i am".
// ─────────────────────────────────────────────────────────────────────────────
describe("crisis detection — adversarial attack on the context rules", () => {
  const mustDetect = [
    "Am liebsten wuerde ich einfach respawnen ich will nicht mehr da sein",
    "Mein leben ist wie ein level das ich nie schaffe ich bin so lebensmuede",
    "Nach der letzten runde chemo bin ich einfach nur noch lebensmuede",
    "Ich hab die nachrichten gesehen und dachte nur ich will auch sterben",
    "Seit der reportage ueber suizid denke ich nur noch daran",
    "In dem buch bringt sich der held um und ich versteh ihn zu gut ich will auch tot sein",
    "Game over waere ehrlich gesagt eine erleichterung ich will nicht mehr aufwachen",
    "Ich will einfach nur noch weg so wie am ende der staffel",
    "Seit der doku ueber depression denke ich staendig ans sterben",
    "Beim match heute hab ich die ganze zeit gedacht wie gern ich tot waere",
    "In der verlaengerung hab ich nur gedacht ich waer lieber tot",
    "Ich fuehl mich wie ein tamagotchi das keiner mehr fuettert ich will nicht mehr da sein",
    "Meine woche ist ein endboss den ich nicht mehr schaffe ich bin lebensmuede",
    "Ich arbeite als pflegekraft und bin selbst lebensmuede",
    "Ich arbeite beim krisendienst und habe selbst suizidgedanken",
    "Ich schreibe meine bachelorarbeit ueber suizid und merke dass ich selbst sterben will",
    "Ich mache eine fortbildung zu trauerbegleitung und bin danach jedes mal lebensmuede",
    "Als notaerztin sehe ich das jeden tag und will inzwischen selbst nicht mehr aufwachen",
    "Ich sitze im ethikseminar ueber sterbehilfe und denke die ganze zeit ich waere lieber tot",
    "Ich hab bei der beratungsstelle angerufen und wieder aufgelegt jetzt will ich einfach tot sein",
    "Ich arbeite in der palliativpflege und beneide meine patienten weil sie sterben duerfen",
    "Ich mache ein praktikum im hospiz und moechte selber sterben",
    "Meine recherche zum thema hat mich total getriggert jetzt denke ich nur noch ans sterben",
    "Im seminar ging es um suizidpraevention und ich hab gemerkt dass ich selbst suizidgedanken habe",
    "Seit dem studium der pflege bin ich lebensmuede",
    "Ich bin journalistin und schreibe ueber suizid weil ich selbst nicht mehr aufwachen will",
    "In der vorlesung ueber suizidrate sass ich da und wusste ich bin genau die statistik ich will sterben",
    "Seit meine mutter gestorben ist macht das alles keinen sinn mehr",
    "Seit meine schwester tot ist gibt es keinen grund mehr zu leben",
    "Meine freundin ist gestorben und alles hat keinen sinn mehr",
    "Seit mein vater tot ist will einfach nur noch weg",
    "My mother died and life is not worth living anymore",
    "My brother killed himself and now there is no reason to live",
    "Seit mein bruder weg ist halte das nicht mehr aus",
    "Mein opa ist gestorben und seitdem kein bock mehr auf alles",
    "Her friend said everyone would be better off without me",
    "Mein partner sagt sowas jeden tag someone is hurting me",
    "Seit meine oma tot ist waere schluss machen mit allem eine erloesung",
    "Mein kollege hat es getan und seitdem sind suizidgedanken jeden tag da",
    "Ich denke nicht daran aufzugeben, aber manchmal will einfach nur noch weg",
    "Ich hatte nie vor jemandem wehzutun, trotzdem gibt es keinen grund mehr zu leben",
    "Ich habe nicht die absicht das zu tun, aber der gedanke an suizid ist jeden tag da",
    "I have no intention of doing anything, but there is no reason to live anymore",
    "Ich habe nicht vor etwas zu machen, aber lebensmuede beschreibt es ganz gut",
    "Ich denke nicht daran es zu tun, aber nicht mehr aufwachen waere schoen",
    "Ich hatte nie vor jemandem das anzutun, aber suizidgedanken sind seit wochen da",
    "Ich habe nicht vor irgendwas zu machen, trotzdem waere schluss machen mit allem das beste",
    "Ich denke nicht daran wegzulaufen, aber selbstmord ist jeden tag ein thema",
    "Ich hatte nie vor dass es so weit kommt, aber das leben hat keinen sinn mehr",
    "im at the point where dying sounds peaceful",
    "im planning to overdose tonight",
    "im already dead inside and nothing helps",
    "im cutting again and nobody knows",
    "im ready to be dead",
    "im at my limit and dying feels easier than this",
    "im almost dead inside",
    "im pretty much dead already",
    "im seriously considering the overdose",
    "im suicidal",
  ];
  for (const text of mustDetect) {
    it(`detects despite context: "${text.slice(0, 55)}"`, () => {
      expect(detectCrisis(text).detected).toBe(true);
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
