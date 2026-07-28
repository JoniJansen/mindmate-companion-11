# P0 Handoff — Zweitmeinung ohne Repo-Zugriff

**Projekt:** Soulvay — Mental-Health-Companion-App (React/Vite/Capacitor, iOS live Build 64, Android vor Erstveröffentlichung, Supabase-Backend Lovable-managed).
**Anlass:** 12 Beta-Tester mit realer psychischer Belastung wurden öffentlich über LinkedIn rekrutiert. Der Post ist live, Zusagen laufen ein. Noch ist niemand im Test.
**Scope:** Block A, read-only Verifikation. Kein Code geändert. Detaildokument: `audit/P0_FINDINGS.md`.
**Vertrauensstufe:** Alle mit „✓" markierten Befunde wurden von der Hauptsession selbst am File nachgeprüft, nicht aus Subagenten-Berichten übernommen.

---

## 1. Findings-Tabelle

| ID | Befund | Beleg | Schwere | Aufwand |
|---|---|---|---|---|
| A2-1 ✓ | Das 15-Nachrichten-Tageslimit bricht 57 Zeilen **vor** der Krisenerkennung ab — wer sein Limit erreicht hat und dann suizidale Inhalte schreibt, bekommt „Upgrade to Premium" statt Hilfe | `supabase/functions/chat/index.ts:784` vs. `:841` | kritisch | S |
| A2-2 ✓ | Krisenhilfe existiert nur als Anweisung im LLM-System-Prompt; alle Gateway-Fehlerpfade liefern generisches „Something went wrong" | `chat/index.ts:393-398`, `:889-925` | kritisch | M |
| A2-3 ✓ | Null ausführende Testabdeckung des Krisenpfads — die angezeigten 100 % sind ein False Positive (Datei wird nur als Rohtext auf zwei CORS-Strings geprüft) | `src/test/release-gate.test.ts:114` | kritisch | M |
| A8-1 ✓ | Falsche Ende-zu-Ende-Verschlüsselungs-Behauptung im Play-Store-Listing, zweisprachig | `docs/google-play-store-listing.md:55,130` | kritisch | S |
| A8-3 ✓ | Landing und Demo-Chat tragen keinen Nicht-Therapie-Hinweis — genau die Fläche, auf der geworbene Interessenten zuerst landen | `src/pages/Landing.tsx` (0 Treffer), `src/components/landing/DemoChat.tsx` | kritisch | S |
| A7-1 ✓ | Coverage-Metrik repo-weit unbrauchbar (keine `coverage.exclude`, Build-Artefakte mitgezählt) | `vitest.config.ts` | kritisch | S |
| A2-4 ✓ | Tagebuch (Text + Diktat), Mood-Freitext und alle 5 KI-Functions haben exakt 0 Krisenerkennung | `src/pages/Journal.tsx`, `src/pages/Mood.tsx`, `supabase/functions/journal-reflect/index.ts` (je 0 Treffer) | hoch | M |
| A2-5 | Demo-Chat: keine Erkennung, kein Safety-Link, Consent-Gate greift vorher | `DemoChat.tsx:255-262,281,344` | hoch | S |
| A2-6 | Notrufnummern hängen an der UI-Sprache statt an der Region — englische UI in Deutschland zeigt US-Nummer 988 | `src/pages/Safety.tsx:29,116-120` | hoch | S |
| A2-7 ✓ | Private Handynummer einer dritten Person im Klartext auf öffentlicher, login-freier Route | `src/pages/Safety.tsx:36` | hoch | S |
| A6-1 ✓ | TTS ohne jedes Pro-Nutzer-Limit; das 429 ist nur das durchgereichte ElevenLabs-Limit → ein Account kann das gemeinsame Kontingent erschöpfen (Kosten + DoS) | `supabase/functions/text-to-speech/index.ts:18,61,105` | hoch | M |
| A6-3 ✓ | Premium-Gate faktisch wirkungslos (Default `off`, aktueller Modus `log` lässt durch) — 5 KI-Functions per cURL für jeden Authentifizierten offen | `supabase/functions/_shared/auth.ts:140,157-167` | hoch | S |
| A6-4 ✓ | `elevenlabs-conversation-token` ohne Premium-Prüfung, `agentId` ungeprüft aus dem Body | `elevenlabs-conversation-token/index.ts:17,38` | hoch | S |
| A3-1 | KI-generierte Gesprächszusammenfassung wird bei Parse-Fehler in die Logs eines Dritten geschrieben | `supabase/functions/generate-summary/index.ts:149` | hoch | S |
| A3-2 | Lovable — faktischer Haupt-Empfänger aller Art.-9-Inhalte — fehlt im Prozessor-Register; kein einziger AV-Vertrag als Datei vorhanden | `docs/gdpr-processor-register.md:124-141`, `compliance/processor-agreements/` (nur `.gitkeep.md`) | hoch | L |
| A5-1 ✓ | Datenexport unvollständig (u. a. fehlen die Krisen-Flags) und nur vom Nutzer selbst auslösbar — der Verantwortliche kann Art. 15 nicht erfüllen | `src/components/settings/AccountSettings.tsx:494-511` | hoch | M |
| A7-4 | Kein E2E-Test deckt einen kritischen Flow ab; Playwright läuft nicht in CI, Lint ist non-blocking | `e2e/master-validation.spec.ts`, `.github/workflows/ci.yml` | hoch | M |
| A8-2 ✓ | Das Statusdokument behauptet eine Korrektur der Verschlüsselungs-Falschaussage, die nie stattfand | `docs/STATUS.md:91` | hoch | S |
| A8-4 ✓ | Zentrale Trust-Boundary- und Krisen-Microcopy ist toter Code (null Importer, 0 % Coverage) | `src/lib/brand.ts` | hoch | M |
| A4-1 ✓ | Keystore-Passwort im Klartext und für Store + Key doppelt verwendet; Keystore-Datei selbst nie im Git | `android/app/build.gradle:22,24`, seit `13ea5e8` | mittel | S |
| A6-2 | Kein Kill-Switch, kein Budgetlimit für den KI-Layer | keine Fundstelle in `supabase/functions/` | mittel-hoch | M |
| A6-5 ✓ | Free-Tier-Zähler nicht atomar (read-then-write, nicht awaited) → Limit per Burst umgehbar | `chat/index.ts:780-797` | mittel | S |
| A5-2 | E-Mail-PII überlebt die Kontolöschung (append-only Tabellen ohne DELETE-Policy) | `20260311104447…sql:23-160` | mittel | M |
| A5-3 | Consent-Widerruf löscht bereits extrahierte Memories nicht; sie kehren bei erneutem Consent in den Prompt zurück | `src/contexts/AuthContext.tsx:127-134` | mittel | M |
| A5-4 | Keine granulare Einsicht/Korrektur/Löschung einzelner KI-Memories (Art. 16/17) | kein UI; RLS erlaubt es (`20260310155721…sql:16-17`) | mittel | M |
| A3-4 | Sentry-Scrubbing deckt `extra`/`contexts`/`tags` und freien Exception-Text nicht ab (aktuell durch Aufrufer entschärft) | `src/lib/sentry.ts:82-111,158-165` | mittel | S |
| A3-5 | Krisen-Status samt Nutzer-ID im Klartext-Log eines Dritten | `chat/index.ts:846` | mittel | S |
| A7-2 ✓ | Lint-Zahl um Faktor 10 verfälscht (Worktrees mitgescannt): real 289 statt 3103 Probleme, davon nur 9 die i18n-Regel | `eslint.config.js:8` | mittel | S |
| A7-3 | Leere catch-Blöcke in beiden Error-Boundaries — Fehler werden verschluckt | `ErrorBoundary.tsx:43`, `SectionErrorBoundary.tsx:49` | mittel | S |
| A2-8 | AI-Consent-403 greift ebenfalls vor der Krisenerkennung | `chat/index.ts:700` | mittel | S |
| A2-9 | Erkennung nur auf den letzten 4 Nachrichten, nur DE/EN-Regex | `chat/index.ts:207-210` | mittel | M |
| A3-8 | Supabase-Verarbeitungsregion widersprüchlich dokumentiert (USA vs. EU) | `gdpr-processor-register.md:50` vs. `STATUS.md:90` | mittel | S |
| A1-4 ✓ | `analytics_events` erlaubt anonyme Inserts (Lesen nur `service_role`) | `20260317142723…sql:22-31` | niedrig | S |
| A5-5 | 8 Nutzertabellen ohne `ON DELETE CASCADE`-Backstop | `supabase/migrations/` | niedrig | S |
| A2-10 | Toter Code mit abweichenden, US-only Krisenressourcen | `src/data/companionAgentPrompts.ts:94-95` | niedrig | S |
| A8-7 | Unqualifiziertes „verschlüsselt" in nutzersichtbarem Text | `DemoChat.tsx:69,80`, `Terms.tsx:120,260` | niedrig | S |

**Positivbefunde (verifiziert, kein Handlungsbedarf):**
Alle 21 Tabellen haben RLS aktiv; die früheren `USING (true)`-Policies auf Tagebuch/Mood/Recaps wurden nachweislich durch `auth.uid() = user_id` ersetzt ✓ · IDOR-Stichprobe negativ, `user_id` stammt überall aus dem JWT ✓ · kein echtes Secret in der Git-Historie, Keystore-Datei nie committet ✓ · Sentry Session Replay nicht aktiv, keine Request-Bodies in Breadcrumbs · Analytics ohne Freitext/PII · Notification-Texte inhaltsfrei · keine Heilversprechen im Nutzertext, alle Aussagen verneinend formuliert · Onboarding-Disclaimer als Pflicht-Gate mit Checkbox · Safety-Seite ohne Login erreichbar und testgesichert.

---

## 2. Was NICHT verifizierbar war — und warum

Der bestimmende Faktor: **Das Produktionsbackend gehört dem Betreiber faktisch nicht.** Supabase läuft Lovable-managed, ohne Dashboard-Zugriff. Alles Folgende ließ sich deshalb nur aus Repo-Artefakten ableiten:

1. **Ob die Live-Datenbank die geprüften RLS-Policies tatsächlich trägt.** Verifiziert ist der Migrationsstand im Repo. Ein Drift zwischen Migrationen und Live-DB wäre unsichtbar. → Nur ein Cross-Tenant-Test mit zwei echten Konten schließt das; er ist spezifiziert, aber nicht ausgeführt.
2. **Laufzeitwert von `PREMIUM_GATE_MODE`** — Env-Var außerhalb des Repos. Verifiziert ist nur der Code-Default `off` und dass auch `log` durchlässt.
3. **Training-/Retention-Ausschluss beim Lovable-KI-Gateway** — keine Konfiguration, kein Header, keine Vertragsunterlage im Repo. Alle Chat-, Tagebuch- und Memory-Inhalte laufen über diesen Gateway.
4. **Verarbeitungsregionen** aller Anbieter; speziell Supabase EU vs. USA — die eigene Doku widerspricht sich.
5. **Existenz der AV-Verträge** — der Ordner enthält nur eine Platzhalterdatei. Das Register behauptet gleichzeitig „abgelegt".
6. **Offline-Verfügbarkeit der Safety-Seite im installierten PWA-Build** — Konfiguration spricht dafür, ein Service-Worker-Laufzeittest fand nicht statt (read-only).
7. **Reale False-Negative-Rate der Krisen-Regexe** — es existieren keine Testdaten, und Testschreiben war in Block A ausgeschlossen.
8. **Vollständigkeit des Secret-Scans** — `gitleaks`/`trufflehog` waren nicht verfügbar; der Scan war musterbasiert.

---

## 3. Wo ich die Priorisierung für falsch halte

**(a) A1 vs. A2.** Das Mandat setzt RLS/Mandantentrennung an die höchste Stelle („die gefährlichste Lücke im gesamten Dokument"). Ex ante ist das die richtige paranoide Reihenfolge — ex post ist RLS der **gesündeste** Bereich des Projekts und der Krisenpfad der mit Abstand schlechteste. **Empfehlung: In Block B B2 vor B1 ziehen.** B1 reduziert sich realistisch auf „Cross-Tenant-Test schreiben und als CI-Gate verankern", weil keine Lücke zu schließen ist.

**(b) B5 (Lint-Ratchet) beruht auf einer falschen Prämisse.** Das Mandat sagt „Bestand als Baseline einfrieren, die 2.800 Altlasten nicht anfassen". Real sind es **289** Probleme; die 2.800 entstehen dadurch, dass ESLint die verschachtelten Git-Worktrees mitscannt. Würde man den gemeldeten Bestand einfrieren, fröre man überwiegend Phantom-Einträge ein und der Ratchet wäre wirkungslos. **Zuerst `eslint.config.js` um ein `ignores` für `.claude/worktrees/` ergänzen, dann Baseline bilden.** Analog für Coverage (`vitest.config.ts` braucht `coverage.exclude`) — sonst misst der Ratchet Artefakte.

**(c) B4 (Secrets) hat eine harte Deadline, die die Reihenfolge sticht.** Ein neuer Android-Keystore ist nur **vor** der ersten Play-Veröffentlichung möglich; danach ist der Signaturschlüssel unwiderruflich. Das ist unabhängig von Position 4 in der Liste zu erledigen, sobald ein Play-Upload ansteht. Entschärfend: Die Keystore-Datei lag nie im Git, nur das Passwort — das senkt die Dringlichkeit, hebt aber die Frist nicht auf.

**(d) Ein Punkt fehlt im Mandat ganz und gehört meines Erachtens in Block B:** das Free-Tier-Tageslimit als solches. Unabhängig vom Reihenfolge-Bug (A2-1) ist die Produktentscheidung „15 Nachrichten pro Tag, dann Upgrade-Hinweis" bei einer Zielgruppe mit psychischer Belastung eigenständig zu bewerten. Der Bug ist ein Code-Fix; die Frage, ob jemand in einer schlechten Nacht überhaupt abgeschnitten werden darf, ist eine Produktentscheidung, die nur der Betreiber treffen kann.

---

## 4. Was im Mandat gar nicht vorkommt — und wichtig ist

**(1) Die Qualitätsmetriken dieses Projekts erzeugen aktiv falsches Vertrauen.**
Das ist der wichtigste Fund außerhalb des Mandats. Zwei unabhängige Instrumente lügen in dieselbe Richtung:
- Coverage meldet für den Krisenpfad **100 %**. Tatsächlich wird die Datei nur als Rohtext geladen und auf zwei CORS-Strings geprüft (`src/test/release-gate.test.ts:114`). Dieselbe Scheinabdeckung besteht für sieben weitere Edge Functions, darunter `delete-account` und `text-to-speech`.
- Lint meldet 3.103 Probleme, davon angeblich „~2.800 i18n-Altlasten". Real: 289 Probleme, davon 9 i18n. Der Rest stammt aus mitgescannten Worktrees.

Konsequenz für eine Zweitmeinung: **Jede frühere Qualitätsaussage in diesem Projekt — auch in `docs/STATUS.md` — sollte als unbelegt behandelt werden, bis sie erneut gemessen wurde.** „196 Tests grün" bedeutet nicht, dass die kritischen Pfade getestet sind; es bedeutet, dass 196 Tests grün sind.

**(2) Der Rekrutierungstrichter führt direkt auf die ungeschützteste Fläche.**
LinkedIn-Post → Landing-Page → Demo-Chat. Diese Kette hat: keinen Nicht-Therapie-Hinweis (A8-3), keine Krisenerkennung (A2-5), keinen Safety-Link, und als einziges Vertrauenselement ein Badge „Privat & verschlüsselt", dessen Formulierung in dieselbe Richtung überzeichnet wie die falsche Store-Aussage. Menschen, die auf einen Post über eine Mental-Health-App reagieren, sind im Mittel nicht die stabilste Kohorte — sie treffen zuerst auf die schwächste Schutzschicht.

**(3) Der Audit-Trail selbst war unzuverlässig.**
`docs/STATUS.md:91` behauptete eine Korrektur, die es nie gab (A8-2). Geschrieben wurde das von mir am Vortag, auf Basis eines Subagenten-Berichts, ohne Prüfung am File. Das ist derselbe Fehlermodus, den das Mandat unter Regel 4 adressiert — und er ist hier nachweislich schon einmal eingetreten. Eine Zweitmeinung sollte stichprobenartig auch die mit „✓" markierten Befunde nachziehen.

**(4) Ein Governance-Artefakt ohne Wirkung.**
`src/lib/brand.ts` enthält die durchdachte Trust-Boundary-Sprache und Krisen-Microcopy — und hat null Importer. Die tatsächlich sichtbaren Disclaimer stammen aus hartcodierten Strings an anderen Stellen. Wer die Datei liest, hält das Thema für gelöst.

**(5) Latenter Leak im toten Code.**
`chat/index.ts:848` extrahiert 200 Zeichen der letzten Nutzernachricht in eine Variable, die anschließend nicht verwendet wird. Heute kein Leak. Sobald jemand diesen „unfertigen" Code vervollständigt — etwa durch Loggen oder Persistieren —, wird daraus ein Krisennachrichten-Leak in die Logs eines Dritten.

**(6) Der Chat-Disclaimer verschwindet dauerhaft.**
`ChatDisclaimer.tsx:6,14-23` — einmal weggeklickt, kommt er nie wieder. Über die 14-tägige Testphase sieht ein Tester ihn faktisch einmal.

**(7) Die Krisenhilfe im LLM-Prompt ist geografisch inkohärent.**
`chat/index.ts:393-398` mischt Telefonseelsorge, US-Lifeline 988, Crisis Text Line und „112 (EU) / 911 (US)" in einer festen Liste — unabhängig von Sprache, Region oder Nutzer. Selbst wenn das Modell die Passage korrekt wiedergibt, erhält ein deutscher Nutzer US-Nummern mitserviert.

---

## 5. Einschätzung in einem Satz

**Nein.** Die App ist im jetzigen Zustand nicht verantwortbar für zwölf Menschen mit psychischer Belastung — weil ein Nutzer in einer Krise, der sein Tageslimit erreicht hat, statt Hilfe eine Kaufaufforderung erhält, weil die Krisenhilfe bei einem Ausfall des Sprachmodells ersatzlos entfällt, und weil kein einziger Test diese Pfade absichert.

**Zusatz zur Einordnung:** Das ist kein Urteil über das Produkt, sondern über einen konkreten, kleinen und schnell behebbaren Zustand. Die drei kritischen Krisenbefunde sind zusammen mit Aufwand S–M zu schließen. Danach ist eine erneute Bewertung sinnvoll — und die Antwort kann dann anders lauten.
