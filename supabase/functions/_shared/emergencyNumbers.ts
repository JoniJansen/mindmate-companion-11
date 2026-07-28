/**
 * Notfallnummern — die eine Quelle für Client, Edge-Functions und Systemprompts.
 *
 * WARUM DIESE DATEI EXISTIERT
 * Die Nummern lagen an vier Stellen: in `src/lib/crisisResources.ts` (die
 * Hilfekarte), in `src/translations/content.ts`, im Systemprompt der
 * Chat-Function und im Sprachmodus-Prompt. Sie waren nicht identisch — die
 * beiden Prompts kannten **116 123 nicht**, also ausgerechnet die Nummer, die
 * in ganz Europa einheitlich zur Telefonseelsorge führt. Wer in Österreich
 * oder der Schweiz eine Krise offenlegte, bekam vom Modell deutsche
 * 0800-Nummern genannt, die von dort nicht durchstellen.
 *
 * Dieselbe Bauart hatte schon einmal Schaden angerichtet: Die Krisenmuster
 * lagen doppelt im Code, Client und Server drifteten auseinander, und der
 * Server verfehlte monatelang „ich will nicht mehr leben". Deshalb steht diese
 * Datei neben `crisisPatterns.ts` — reines TypeScript, keine Importe, keine
 * Laufzeit-APIs, damit Browser und Deno sie gleichermaßen lesen können.
 *
 * Gerüstpunkte: N1 (eine Quelle je Regel) und B4 (regionale Richtigkeit).
 * Zuletzt gegen die Betreiberseiten geprüft: 28.07.2026.
 */

export interface EmergencyLine {
  /** Anzeigeform, wie sie gewählt wird. */
  readonly number: string;
  readonly name: string;
  /** Öffnungszeiten und Kosten — Pflichtangabe, nie weglassen. */
  readonly availability: string;
}

/**
 * 116 123 und 116 111 sind EU-weit harmonisierte Kurznummern und stehen
 * deshalb zuerst: Sie funktionieren in DE, AT und CH gleichermaßen, während
 * die 0800-Nummern nationale Sonderwege sind.
 */
export const EMERGENCY_LINES: Readonly<Record<string, readonly EmergencyLine[]>> = {
  DE: [
    { number: "116 123", name: "TelefonSeelsorge", availability: "rund um die Uhr, kostenfrei" },
    { number: "0800 111 0 111", name: "TelefonSeelsorge", availability: "rund um die Uhr, kostenfrei" },
    { number: "116 111", name: "Nummer gegen Kummer (Kinder und Jugendliche)", availability: "Mo–Sa 14–20 Uhr, kostenfrei" },
  ],
  AT: [
    { number: "142", name: "TelefonSeelsorge Österreich", availability: "rund um die Uhr, kostenfrei" },
    { number: "147", name: "Rat auf Draht (Kinder und Jugendliche)", availability: "rund um die Uhr, kostenfrei" },
  ],
  CH: [
    { number: "143", name: "Die Dargebotene Hand", availability: "rund um die Uhr, 20 Rappen pro Anruf" },
    { number: "147", name: "Pro Juventute (junge Menschen)", availability: "rund um die Uhr, kostenfrei" },
  ],
  US: [
    { number: "988", name: "Suicide & Crisis Lifeline", availability: "24/7, free" },
    { number: "741741", name: "Crisis Text Line (text HOME)", availability: "24/7, free" },
  ],
} as const;

/** Rettungsdienst je Region. 112 trägt in ganz Europa. */
export const EMERGENCY_SERVICES: Readonly<Record<string, string>> = {
  DE: "112",
  AT: "112 oder 144",
  CH: "112 oder 144",
  US: "911",
} as const;

/**
 * Die Liste, die einem Systemprompt beigelegt wird.
 *
 * Bewusst über ALLE deutschsprachigen Regionen, nicht nur über die vermutete:
 * Das Modell kennt den Aufenthaltsort nicht sicher, und eine Nummer zu viel
 * schadet niemandem — eine fehlende schon.
 */
export function crisisLinesForPrompt(language: "de" | "en"): string {
  const regionen = language === "de" ? (["DE", "AT", "CH"] as const) : (["US"] as const);
  const zeilen = regionen.flatMap((region) =>
    EMERGENCY_LINES[region].map(
      (line) => `     * ${line.name}: ${line.number} — ${region}, ${line.availability}`,
    ),
  );
  const notruf =
    language === "de"
      ? "     * Rettungsdienst: 112 (DE/AT/CH), zusätzlich 144 in AT und CH"
      : "     * Emergency services: 911 (US) / 112 (EU)";
  return [...zeilen, notruf].join("\n");
}
