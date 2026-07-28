#!/usr/bin/env node
/**
 * Das Tor — Ebene 1 des Prüfgerüsts (audit/TEST_FRAMEWORK.md).
 *
 * Läuft bei jedem PR, kostet null Menschenzeit, blockiert bei Rot.
 * Jede Prüfung nennt den Gerüstpunkt, den sie abdeckt, damit das
 * Bewertungsblatt maschinell befüllbar bleibt.
 *
 * Aufruf:  bun run gate        (oder: node scripts/gate.mjs)
 * Exit 0 = alle Tore offen · Exit 1 = mindestens eines rot
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const ergebnisse = [];

function pruefe(punkt, titel, fn) {
  try {
    const r = fn();
    ergebnisse.push({ punkt, titel, ok: r.ok, note: r.note, wert: r.wert ?? null });
  } catch (e) {
    ergebnisse.push({ punkt, titel, ok: false, note: `Prüfung selbst fehlgeschlagen: ${e.message}` });
  }
}

// Farbcodes entfernen. Vitest schreibt unter CI ANSI-Sequenzen mitten in die
// Zusammenfassung ("Tests \x1b[2m 15 passed"), lokal am Terminal nicht.
// Genau daran ist der erste CI-Lauf dieses Tors gescheitert: lokal grün,
// in der CI vier rote Punkte — und keiner davon war ein echter Mangel.
const OHNE_FARBE = /\[[0-9;]*m/g;

function sh(cmd) {
  const out = execSync(cmd, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // Umgebung festnageln, damit lokal und in der CI dieselbe Ausgabe entsteht.
    // Ein Tor, dessen Ergebnis vom Terminal abhängt, misst nicht die App.
    env: { ...process.env, CI: "true", NO_COLOR: "1", FORCE_COLOR: "0" },
  });
  return out.replace(OHNE_FARBE, "");
}

// Vitest-Zusammenfassung auswerten. Eine Stelle statt drei Kopien, damit ein
// Formatwechsel künftig an einem Ort auffällt.
function testZahlen(out) {
  const m = out.match(/Tests\s+(\d+)\s+passed(?:\s*\|\s*(\d+)\s+failed)?\s+\((\d+)\)/);
  if (m) return { bestanden: Number(m[1]), gescheitert: Number(m[2] ?? 0), gesamt: Number(m[3]) };
  // "Tests 12 failed | 3 passed (15)" — umgekehrte Reihenfolge bei Rot.
  const f = out.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed\s+\((\d+)\)/);
  if (f) return { bestanden: Number(f[2]), gescheitert: Number(f[1]), gesamt: Number(f[3]) };
  return null;
}

// Wenn die Zusammenfassung nicht auswertbar ist, muss der Grund sichtbar sein.
// "Testlauf nicht auswertbar" allein kostete beim ersten CI-Lauf eine
// Fehlersuche, die eine einzige Zeile Ausgabe erspart hätte.
function unlesbar(out) {
  const letzte = out.trim().split("\n").filter((l) => l.trim()).slice(-2).join(" · ");
  return `Zusammenfassung nicht auswertbar — letzte Ausgabe: ${letzte.slice(0, 160)}`;
}

function lies(p) {
  return readFileSync(join(ROOT, p), "utf8");
}

function alleDateien(dir, endungen) {
  const out = [];
  const gehe = (d) => {
    for (const e of readdirSync(join(ROOT, d))) {
      const rel = `${d}/${e}`;
      if (e === "node_modules" || e === "dist" || e.startsWith(".")) continue;
      const st = statSync(join(ROOT, rel));
      if (st.isDirectory()) gehe(rel);
      else if (endungen.some((x) => e.endsWith(x))) out.push(rel);
    }
  };
  gehe(dir);
  return out;
}

// ── B1 · Krisenerkennung: Trefferquote gegen unabhängigen Korpus ──────────
pruefe("B1", "Krisenerkennung trifft", () => {
  const out = sh("bunx vitest run src/test/crisis-detection.test.ts 2>&1 || true");
  const z = testZahlen(out);
  if (!z) return { ok: false, note: unlesbar(out) };
  const quote = (z.bestanden / z.gesamt) * 100;
  return {
    ok: quote >= 95,
    wert: quote.toFixed(1),
    note: `${z.bestanden}/${z.gesamt} Fälle (${quote.toFixed(1)} %), gefordert ≥ 95 %`,
  };
});

// ── B2/B3/B5 · Invarianten: Hilfe nie hinter einem Gate ───────────────────
pruefe("B2/B3/B5", "Krisenhilfe steht vor jedem Gate", () => {
  const out = sh("bunx vitest run src/test/crisis-invariants.test.ts 2>&1 || true");
  const z = testZahlen(out);
  if (!z) return { ok: false, note: unlesbar(out) };
  return { ok: z.bestanden === z.gesamt, wert: `${z.bestanden}/${z.gesamt}`, note: `${z.bestanden}/${z.gesamt} Zusicherungen` };
});

// ── B3 · Jede Eingabefläche ist überwacht ─────────────────────────────────
pruefe("B3", "Alle Eingabeflächen überwacht", () => {
  const flaechen = {
    "Chat (Composer)": "src/hooks/useChatComposer.ts",
    "Demo-Chat": "src/components/landing/DemoChat.tsx",
    Tagebuch: "src/pages/Journal.tsx",
    "Mood-Notiz": "src/pages/Mood.tsx",
    Sprachmodus: "src/hooks/useConversationalVoice.ts",
  };
  const fehlend = Object.entries(flaechen)
    .filter(([, p]) => !/detectCrisis|crisisWatch\.check/.test(lies(p)))
    .map(([n]) => n);
  return { ok: fehlend.length === 0, wert: `${5 - fehlend.length}/5`, note: fehlend.length ? `ohne Prüfung: ${fehlend.join(", ")}` : "alle fünf Flächen" };
});

// ── B7 · Falsch-Positiv-Rate ──────────────────────────────────────────────
pruefe("B7", "Alltagssprache löst nicht aus", () => {
  // Die tatsächlich ausgeführten Testnamen zählen, nicht Vorkommen im Quelltext:
  // die Negativfälle stehen in Schleifen, eine frühere Fassung dieser Prüfung
  // zählte deshalb drei Schleifen statt aller Fälle.
  // Schwelle 50, nicht 30: Das Gerüst fordert ≥ 50 Fälle, das Tor ließ 30
  // durchgehen — ein Tor, das laxer ist als die Norm, die es durchsetzen soll.
  const out = sh("bunx vitest run src/test/crisis-detection.test.ts --reporter=verbose 2>&1 || true");
  const anzahl = (out.match(/ignores:/g) || []).length;
  return { ok: anzahl >= 50, wert: anzahl, note: `${anzahl} ausgeführte Negativfälle, gefordert ≥ 50` };
});

// ── B21 · Muster werden geteilt, nicht dupliziert ─────────────────────────
pruefe("B21", "Erkennung aus einer Quelle", () => {
  const server = lies("supabase/functions/chat/index.ts");
  const geteilt = server.includes('from "../_shared/crisisPatterns.ts"');
  const dupliziert = /const HIGH_SEVERITY_PATTERNS|const NEGATION_PATTERNS/.test(server);
  return { ok: geteilt && !dupliziert, note: geteilt ? (dupliziert ? "Duplikat wieder eingeführt" : "Server importiert die geteilte Quelle") : "Server nutzt eigene Muster" };
});

// ── K10 · Regressionsnetz: die vorhandene Testsuite ───────────────────────
pruefe("K10", "Testsuite grün", () => {
  const out = sh("bun run test 2>&1 || true");
  const z = testZahlen(out);
  if (!z) return { ok: false, note: unlesbar(out) };
  return { ok: z.bestanden === z.gesamt, wert: `${z.bestanden}/${z.gesamt}`, note: `${z.bestanden} von ${z.gesamt}` };
});

// ── A6 · Keine Geister-Übersetzungsschlüssel ──────────────────────────────
pruefe("A6", "Keine Geister-Schlüssel", () => {
  const out = sh("bunx vitest run src/test/i18n-no-ghost-keys.test.ts 2>&1 || true");
  const z = testZahlen(out);
  if (!z) return { ok: false, note: unlesbar(out) };
  return { ok: z.gescheitert === 0, wert: `${z.bestanden}/${z.gesamt}`, note: "Ratchet über alle t()-Aufrufe" };
});

// ── N3 · Analysierbarkeit: Typprüfung ─────────────────────────────────────
pruefe("N3", "Typprüfung fehlerfrei", () => {
  try {
    sh("./node_modules/.bin/tsc --noEmit");
    return { ok: true, note: "0 Fehler" };
  } catch (e) {
    const n = ((e.stdout || "") + (e.stderr || "")).split("\n").filter((l) => l.includes("error TS")).length;
    return { ok: false, wert: n, note: `${n} Typfehler` };
  }
});

// ── C3 · Keine Geheimnisse im Klartext ────────────────────────────────────
pruefe("C3", "Keine Klartext-Geheimnisse", () => {
  const muster = [
    [/\bsk_live_[A-Za-z0-9]{10,}/, "Stripe-Live-Schlüssel"],
    [/\bwhsec_[A-Za-z0-9]{10,}/, "Stripe-Webhook-Geheimnis"],
    [/storePassword\s+['"][^'"]+['"]/, "Keystore-Passwort im Klartext"],
    [/"role"\s*:\s*"service_role"/, "Service-Role-Token"],
  ];
  const dateien = [...alleDateien("src", [".ts", ".tsx"]), "android/app/build.gradle"].filter((p) => existsSync(join(ROOT, p)));
  const funde = [];
  for (const d of dateien) {
    const inhalt = lies(d);
    for (const [re, name] of muster) if (re.test(inhalt)) funde.push(`${name} in ${d}`);
  }
  return { ok: funde.length === 0, wert: funde.length, note: funde.length ? funde.join(" · ") : "keine Funde" };
});

// ── C1 · Mandantentrennung, statischer Teil: RLS auf jeder Tabelle ────────
pruefe("C1", "Jede Tabelle hat RLS", () => {
  const dir = "supabase/migrations";
  if (!existsSync(join(ROOT, dir))) return { ok: false, note: "Migrationsverzeichnis fehlt" };
  const sql = readdirSync(join(ROOT, dir)).filter((f) => f.endsWith(".sql")).map((f) => lies(`${dir}/${f}`)).join("\n");
  const tabellen = new Set([...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)/gi)].map((m) => m[1].toLowerCase()));
  const mitRls = new Set([...sql.matchAll(/ALTER TABLE (?:public\.)?(\w+) ENABLE ROW LEVEL SECURITY/gi)].map((m) => m[1].toLowerCase()));
  const ohne = [...tabellen].filter((t) => !mitRls.has(t));
  return { ok: ohne.length === 0, wert: `${tabellen.size - ohne.length}/${tabellen.size}`, note: ohne.length ? `ohne RLS: ${ohne.join(", ")}` : `alle ${tabellen.size} Tabellen` };
});

// ── I4 · Beworbene Funktionen existieren ──────────────────────────────────
pruefe("I4", "Keine verkauften Geisterfunktionen", () => {
  const p = "src/components/premium/FeatureMatrix.tsx";
  if (!existsSync(join(ROOT, p))) return { ok: false, note: "Preistabelle nicht gefunden" };
  const matrix = lies(p);
  const alleQuellen = alleDateien("src", [".ts", ".tsx"]).map(lies).join("\n");
  // Jede beworbene Funktion braucht mindestens eine Spur außerhalb der Preistabelle.
  const namen = [...matrix.matchAll(/en:\s*"([^"]{4,40})"/g)].map((m) => m[1]);
  const verwaist = namen.filter((n) => {
    const kern = n.split(" ")[0].toLowerCase();
    if (kern.length < 5) return false;
    return !alleQuellen.toLowerCase().includes(kern);
  });
  return { ok: verwaist.length === 0, wert: verwaist.length, note: verwaist.length ? `ohne Entsprechung: ${verwaist.join(", ")}` : `${namen.length} Einträge geprüft` };
});

// ── K6/K7 · Gerüst-Integrität und Zuordnungstreue ─────────────────────────
pruefe("K6/K7", "Prüfgerüst widerspruchsfrei", () => {
  try {
    sh("python3 scripts/check-framework.py");
    return { ok: true, note: "vollständig" };
  } catch {
    return { ok: false, note: "check-framework.py meldet Mängel" };
  }
});

// ── Ausgabe ───────────────────────────────────────────────────────────────
const rot = ergebnisse.filter((r) => !r.ok);
const breite = Math.max(...ergebnisse.map((r) => r.punkt.length));

console.log("\n  DAS TOR — Ebene 1 des Prüfgerüsts\n");
for (const r of ergebnisse) {
  const zeichen = r.ok ? "✓" : "✗";
  console.log(`  ${zeichen}  ${r.punkt.padEnd(breite)}  ${r.titel}`);
  console.log(`     ${" ".repeat(breite)}  ${r.note}`);
}
console.log(`\n  ${ergebnisse.length - rot.length} von ${ergebnisse.length} Toren offen`);
if (rot.length) {
  console.log(`\n  ROT: ${rot.map((r) => r.punkt).join(", ")}`);
  console.log("  Ein rotes Tor blockiert den Merge.\n");
} else {
  console.log("  Alle Tore offen.\n");
}

process.exit(rot.length ? 1 : 0);
