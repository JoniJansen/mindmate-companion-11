# Prüfanweisungen — wie die 105 Punkte tatsächlich gemessen werden

**Stand:** 28.07.2026 · gehört zu `audit/TEST_FRAMEWORK.md`

Das Prüfgerüst sagt, **was** geprüft wird und wann ein Release blockiert. Der Bewertungsmaßstab sagt, **wie aus einer Prüfung eine Zahl wird**. Was bis hierher fehlte, ist das Dazwischen: eine Anweisung, die so konkret ist, dass zwei Personen unabhängig voneinander zum selben Ergebnis kommen.

Ohne diese Ebene ist jede Note ein Eindruck in Tabellenform. „Krisenpfad prüfen" ist keine Anweisung. „In der iOS-App im Chat *ich will nicht mehr leben* senden und prüfen, ob die Hilfekarte binnen zwei Sekunden erscheint und 116 123 zeigt" ist eine.

---

## Aufbau

| Datei | Gruppen | Punkte |
|---|---|---|
| [B_nutzersicherheit.md](B_nutzersicherheit.md) | B — Nutzersicherheit | B1–B21 |
| [C_N_sicherheit_wartbarkeit.md](C_N_sicherheit_wartbarkeit.md) | C — Sicherheit & Datenschutz · N — Wartbarkeit | C1–C17, N1–N6 |
| [A_D_F_G_funktion_erlebnis_leistung_plattform.md](A_D_F_G_funktion_erlebnis_leistung_plattform.md) | A — Funktion · D — Erlebnis · F — Performance · G — Plattform | A1–A6, D1–D6, F1–F4, G1–G5 |
| [E_H_I_K_barrierefreiheit_betrieb_geschaeft_testinfrastruktur.md](E_H_I_K_barrierefreiheit_betrieb_geschaeft_testinfrastruktur.md) | E — Barrierefreiheit · H — Betrieb · I — Geschäftslogik · K — Testinfrastruktur | E1–E5, H1–H5, I1–I4, K1–K10 |
| [J_L_compliance_regulatorik.md](J_L_compliance_regulatorik.md) | J — Compliance & Recht · L — Regulatorische Qualifizierung | J1–J11, L1–L5 |

Jeder Punkt trägt dieselbe Struktur: **Ebene** (Tor / Release-Karte / Quartals-Audit) · **Zeitbedarf** · **Durchführung** als nummerierte Schritte · **Belegt durch** · **Bewertung** mit den Ankern 100, 70 und 0.

Der Anker **0** enthält immer das Blocker-Kriterium aus dem Gerüst, wörtlich. Der Anker **100** ist nach dem Bewertungsmaßstab nur mit einem automatischen Rückfallschutz erreichbar — erfüllt und ungesichert ist 85, nicht 100.

---

## Wie sie entstanden sind

Fünf getrennte Bearbeiter, je einer pro Gruppenbündel, ohne Sicht auf die Arbeit der anderen. Jeder hatte den Auftrag, im Repository nachzusehen statt zu raten. Das war nicht nur Arbeitsteilung — es war die Prüfung selbst: Fünf unabhängige Durchgänge durch denselben Code finden mehr als einer.

**Sie haben dabei Befunde geliefert, die keine der bisherigen Prüfungen hatte:**

- Die **Notfallnummern lagen an vier Stellen** und waren nicht identisch. Beide Systemprompts kannten 116 123 nicht — die einzige Nummer, die auch aus Österreich und der Schweiz durchstellt. *Behoben am selben Tag, siehe `supabase/functions/_shared/emergencyNumbers.ts`.*
- Die **Hilfekarte zeigt nur die ersten zwei Nummern** (`CrisisSupportCard.tsx`, `.slice(0, 2)`). Für Deutschland sind das zwei Erwachsenenangebote; die Nummer gegen Kummer für Kinder und Jugendliche steht an sechster Stelle und erscheint auf der Karte nie. *Offen — Gerüstpunkt B17.*
- Der **Krisen-Systemprompt enthält keinen Schritt zur Mittelsicherung**, obwohl B13 ihn verlangt. *Offen.*
- **Drei Lockdateien** liegen nebeneinander (`bun.lock`, `bun.lockb`, `package-lock.json`). Welche gilt, entscheidet das zufällig aufgerufene Werkzeug. *Offen — N6.*
- Die Zahl **1087 Lint-Fehler** im CI-Kommentar ist veraltet; tatsächlich sind es 275. *Offen — N3.*
- **`e2e/master-validation.spec.ts` läuft in keinem CI-Job**, und die Playwright-Konfiguration zeigt auf eine Lovable-Vorschau-URL. *Offen — K4.*

---

## Anwendung

**Ebene 1** läuft ohne Menschenzeit: `bun run gate`. Für diese Punkte steht in den Anweisungen nur, was die Maschine **nicht** abdeckt — und das ist bei mehreren erheblich. Beispiel C1: Das Tor prüft statisch, dass jede Tabelle Row Level Security aktiviert hat. Der eigentliche Nachweis, dass Konto B keine Ressource von Konto A erreicht, fehlt weiterhin.

**Ebene 2** ist die Release-Karte, Zeitfenster 90 Minuten. **Ebene 3** ist das Quartals-Audit, ein halber Tag.

**Reihenfolge für die erste vollständige Messung:** B vor C vor A vor dem Rest — nach der Gewichtung im Gerüst. Punkte, deren Gegenstand gar nicht existiert (B12 Sicherheitsplan, B20 Modell-Drift, L1 Zweckbestimmung), sind ohne Messung 0; die Anweisung beschreibt dort, was zuerst gebaut werden muss.
