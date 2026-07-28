# P0 — Safety & Release Gate: Findings

**Grundlage:** `docs/STATUS.md`, Repo `main` @ `65d8b06`
**Durchgeführt:** 2026-07-25/26 · **Modus:** Block A, read-only. Keine Zeile Code geändert, nichts committet.
**Anlass:** 12 Beta-Tester mit realer psychischer Belastung wurden öffentlich rekrutiert (LinkedIn-Post ist live).

**Methodik:** Sechs parallele read-only Verifikations-Läufe (A1–A8). Jede sicherheitsrelevante Behauptung wurde von der Hauptsession **selbst am File nachgeprüft**, nicht aus dem Agentenbericht übernommen. Belege als `Pfad:Zeile`. Nicht aus dem Repo Beweisbares ist als **NICHT VERIFIZIERBAR** markiert.

**Legende:** Schweregrad `kritisch` / `hoch` / `mittel` / `niedrig` · Aufwand `S` (Stunden) / `M` (1–3 Tage) / `L` (größer)

---

## Zusammenfassung

| Bereich | Ergebnis |
|---|---|
| A1 RLS/Mandantentrennung | **Unauffällig.** Alle 21 Tabellen mit RLS, Policies eng. Der als „gefährlichste Lücke" vermutete Bereich ist der gesündeste. |
| A2 Krisenpfad | **Schwerste Mängel des gesamten Audits.** 3 kritische, 4 hohe Befunde. |
| A3 Datenabfluss | 2 hohe Befunde (Inhalts-Log an Dritten, fehlende AV-Verträge). |
| A4 Secrets | 1 mittlerer Befund (Keystore-Passwort). Keystore-Datei selbst nie im Git. |
| A5 Betroffenenrechte | Löschung funktioniert; Export unvollständig, keine granulare Memory-Kontrolle. |
| A6 Kosten | TTS ohne jedes Pro-Nutzer-Limit, kein Kill-Switch. |
| A7 Testlage | **Krisenpfad-Coverage von 100 % ist ein False Positive.** Metriken repo-weit unbrauchbar. |
| A8 Öffentliche Aussagen | Falsche E2E-Verschlüsselungs-Behauptung im Store-Listing weiterhin vorhanden. |

---

## A1 — Row-Level-Security & Mandantentrennung

### A1-1 · RLS vollständig aktiviert · **unauffällig** (Positivbefund)
Alle **21** in Migrationen erstellten Tabellen haben `ENABLE ROW LEVEL SECURITY`. Kein Gegenbeispiel.
*Beleg:* Abgleich `CREATE TABLE` vs. `ALTER TABLE … ENABLE ROW LEVEL SECURITY` über `supabase/migrations/*.sql` — Differenzmenge leer.

### A1-2 · Frühere `USING (true)`-Policies wurden ersetzt · **unauffällig** (Positivbefund)
Migrationen vom 30.12./24.01. legten `journal_entries`, `mood_checkins`, `weekly_recaps`, `subscriptions` mit `USING (true)` an (jeder liest alles). Diese wurden gedroppt (`20260124151717…sql:60-120`) und in der Härtungs-Migration `20260311101812…sql` durch `auth.uid() = user_id` ersetzt. `chat_messages` nutzt korrekt eine `EXISTS`-Unterabfrage auf die eigene Konversation. `voice_sessions` `auth.uid() = user_id` (`20260312142849…sql:16-26`). E-Mail-Tabellen nur `service_role` (`20260311104447…sql`). `user_roles` über `has_role(auth.uid(),'admin')`.
**Einschränkung:** Das ist der **Repo-Stand der Migrationen**. Ob die Live-DB identisch ist → **NICHT VERIFIZIERBAR** (kein Dashboard-Zugriff, Lovable-managed).

### A1-3 · IDOR-Stichprobe negativ · **unauffällig** (Positivbefund)
`delete-account/index.ts:21`, `verify-apple-receipt/index.ts:65`, `manage-subscription/index.ts:27` leiten `user_id` aus dem JWT ab, nie aus dem Body. `delete-account:17` dokumentiert das explizit.
**Einschränkung:** Stichprobe, kein erschöpfender Beweis über alle 23 Functions.

### A1-4 · `analytics_events`: anonymer Insert erlaubt · **niedrig** · S
`CREATE POLICY "Anyone can insert analytics events" … TO anon, authenticated WITH CHECK (true)` (`supabase/migrations/20260317142723…sql:22-25`). Lesen ist auf `service_role` beschränkt (`:28-31`). Risiko: Spam/Pollution, kein Datenabfluss.

### A1-5 · `daily_prompts` für alle Authentifizierten lesbar · **niedrig** · —
`FOR SELECT TO authenticated USING (true)` (`20260311101812…sql:17`). Geteilter Inhalt, keine Nutzerdaten. Kein Handlungsbedarf.

---

## A2 — Krisenpfad ⚠️ schwerster Bereich

### A2-1 · Tageslimit blockiert die Krisenerkennung · **kritisch** · S
Der 429-Abbruch bei 15 Nachrichten (`supabase/functions/chat/index.ts:784`) liegt **57 Zeilen vor** `detectCrisis()` (`:841`). Ein Free-Nutzer, der sein Tageslimit erreicht hat und dann eine Suizidäußerung schreibt, erhält: *„Daily message limit reached. Upgrade to Premium for unlimited messages."* Die Erkennung läuft nie, es wird nichts geloggt, keine Hilfe angezeigt.
*Selbst verifiziert.*

### A2-2 · Krisenhilfe existiert nur als LLM-Anweisung · **kritisch** · M
`detectCrisis()` (`chat/index.ts:206-237`, reine Regex) setzt lediglich einen anderen System-Prompt (`:843`). Die Notrufnummern stehen ausschließlich im Prompt-Text (`:393-398`) und müssen vom Gemini-Modell **generiert** werden. Es existiert keine deterministische Krisenausgabe im Code. Bei Gateway-Fehler liefern **alle** Pfade generische Texte: 429 → „I need a moment to rest.", 402 → „Service temporarily unavailable.", sonst → „Something went wrong. Please try again." (`:889-925`). Kein `AbortController`/Timeout auf dem Gateway-Fetch → Hänger laufen bis zum Plattformlimit.
*Selbst verifiziert.*

### A2-3 · Null ausführende Testabdeckung des Krisenpfads · **kritisch** · M
Kein Test importiert oder ruft `detectCrisis`. Die Coverage zeigt für `supabase/functions/chat` **100 %** — das ist ein **False Positive**: Die Datei wird nur als Rohtext geladen (`src/test/release-gate.test.ts:114`, `import(…/chat/index.ts?raw)`) und lediglich auf die Strings `"Access-Control-Allow-Origin"` und `"OPTIONS"` geprüft. Die Krisenlogik wird nie ausgeführt. Dieselbe Scheinabdeckung bei `create-checkout`, `delete-account`, `generate-summary`, `journal-reflect`, `manage-subscription`, `text-to-speech`, `weekly-recap`.
*Selbst verifiziert.* → Die Metrik erzeugt aktiv falsches Vertrauen.

### A2-4 · Tagebuch, Mood und alle 5 KI-Functions ohne jede Krisenerkennung · **hoch** · M
Zählung ergibt exakt **0 Treffer** für Krisenmuster in `src/pages/Journal.tsx`, `src/pages/Mood.tsx`, `supabase/functions/journal-reflect/index.ts`. Ebenso ohne Erkennung: `weekly-recap`, `session-insight`, `extract-memories`, `detect-patterns`. Betroffen sind damit: Tagebuch-Text, Tagebuch-Diktat (Transkript landet im selben Textfeld, `Journal.tsx:484-501`) und die Mood-Freitextnotiz (`Mood.tsx:138-153`, wird zusätzlich als `journal_entries` dupliziert).
*Selbst verifiziert (Trefferzählung).*

### A2-5 · Demo-Chat: keine Erkennung, kein Safety-Link · **hoch** · S
`src/components/landing/DemoChat.tsx` ruft dieselbe Edge Function mit Anon-Key (`:255-262`), scheitert aber an `requireAIConsent` (`chat/index.ts:700` → `_shared/auth.ts:59-79`) **vor** dem Krisen-Check. Fehlerpfad `:281` → generischer Text `:344`. Im gesamten Bauteil kein `/safety`-Link.
**Besonders relevant:** Der Demo-Chat ist der erste Kontakt, den über LinkedIn geworbene Interessenten mit dem Produkt haben.

### A2-6 · Notrufnummern an UI-Sprache statt Region · **hoch** · S
Auswahl über `crisisLinesByLang[language]` (`src/pages/Safety.tsx:29,116-120`); `language` stammt aus localStorage/`navigator.language` (`src/hooks/useTranslation.ts:478-490`). Kein Geo/Country-Code irgendwo. Folge: englische UI in Deutschland → 988 und „Text HOME to 741741" (in DE wirkungslos); deutsche UI im Ausland → 112. Der Krisen-Prompt (`chat/index.ts:393-398`) mischt DE- und US-Nummern fest, unabhängig von allem.

### A2-7 · Private Handynummer einer Dritten öffentlich · **hoch** · S
`src/pages/Safety.tsx:36` enthält `"+49 177 6536493"` (Jutta Jansen) im Klartext auf der Route `/safety`, die ohne Login erreichbar ist (`src/App.tsx:232`) und indexierbar ist. Erfordert ihre ausdrückliche Einwilligung oder Entfernung. **Entscheidung liegt beim Betreiber, nicht beim Code.**

### A2-8 · AI-Consent-403 vor dem Krisen-Check · **mittel** · S
`requireAIConsent` (`chat/index.ts:700`) wirft aus `_shared/auth.ts:70-76` vor allem anderen. Wer den KI-Consent nicht erteilt hat, erhält bei einer Krisenäußerung keinerlei Erkennung.

### A2-9 · Erkennungs-Reichweite begrenzt · **mittel** · M
Nur die letzten 4 Nachrichten (`chat/index.ts:207-210`), nur `role === "user"`, nur DE/EN-Regex (HIGH `:122-133`, MEDIUM `:136-155`, Negation `:158-175`). Der zweite Safety-Button erscheint erst ab 5 Nachrichten (`src/components/chat/ChatActionButtons.tsx:21,39`); der Header-Button ist immer sichtbar (`src/pages/Chat.tsx:503`).

### A2-10 · Toter Code mit abweichenden Krisenressourcen · **niedrig** · S
`src/data/companionAgentPrompts.ts` hat keinen Importer, enthält aber Krisenressourcen (`:91`, `:94-95`, nur US-988). Divergenzrisiko bei künftiger Reaktivierung.

### A2-11 · Safety-Seite ohne Login erreichbar, im Precache · **unauffällig** (Positivbefund)
`src/App.tsx:232` ohne Guard, abgesichert durch `src/test/release-gate.test.ts:97-101`. PWA-Precache greift laut `vite.config.ts:59` (`globPatterns` erfasst den Lazy-Chunk).
**Offline-Verhalten zur Laufzeit → NICHT VERIFIZIERBAR** (kein SW-Test durchgeführt).

---

## A3 — Datenabfluss

### A3-1 · KI-abgeleiteter Gesprächsinhalt landet im Log eines Dritten · **hoch** · S
`supabase/functions/generate-summary/index.ts:149` loggt bei Parse-Fehler `"Content:", content` — das ist die KI-Zusammenfassung des Chats (Art.-9-Ableitung). Edge-Function-Logs liegen im Lovable-Account.

### A3-2 · Lovable fehlt im Prozessor-Register, kein einziger AV-Vertrag · **hoch** · L
Lovable ist faktisch Haupt-Empfänger aller Art.-9-Inhalte (alle KI-Prompts, `chat/index.ts:867`), fehlt aber vollständig in `docs/gdpr-processor-register.md`; das Register modelliert stattdessen eine direkte Google-Beziehung, die der Code nicht nutzt. `compliance/processor-agreements/` enthält nur `.gitkeep.md` — **keine einzige DPA-Datei**. Das Register behauptet gleichzeitig „✅ Filed" (`:124-130`) und widerspricht sich selbst (`:141`).

### A3-3 · Was an das Gateway rausgeht · **hoch** (Transparenz) · M
Im System-Prompt gehen mit: `user_memories.content` (Top-5), `emotional_patterns.description`, `session_insights.insight_text` (`chat/index.ts:801-822,843`), Klarname (`profiles.display_name`, `:838`), Companion-Profil, sowie die gekappte Konversation (`:861,877`). Weitere Functions senden Tagebucheinträge (`journal-reflect:216`), Mood-Notizen + Tagebuch (`weekly-recap:56,115`), vollen Gesprächstext (`session-insight:83`, `generate-summary:96`).
**Training-/Retention-Ausschluss beim Lovable-Gateway → NICHT VERIFIZIERBAR** (keine Konfiguration, kein Header, keine Doku im Repo).

### A3-4 · Sentry-Scrubbing unvollständig · **mittel** · S
`scrubEvent` (`src/lib/sentry.ts:82-111`) bereinigt nur Token-Query-Params, E-Mails in `message` und in `exception.values[].value`. **Nicht** bereinigt: `extra`, `contexts`, `tags`, beliebiger Freitext in Exception-Messages. `captureException(error, context)` legt `context` ungescrubbt als `extra` ab (`:158-165`).
*Aktuell entschärft:* Beide realen Aufrufer übergeben nur `boundary`/`section`/`componentStack` (`ErrorBoundary.tsx:28-31`, `SectionErrorBoundary.tsx:36-40`).
**Positivbefund:** Session Replay ist **nicht** aktiv (keine `replayIntegration`, kein `@sentry/replay`). Netzwerk-Breadcrumbs erfassen keine Bodies. `sendDefaultPii: false` (`:128`).

### A3-5 · Krisen-Status im Klartext-Log · **mittel** · S
`chat/index.ts:846` loggt `CRISIS DETECTED for user <uuid> | severity=… | signal=…` in die Lovable-Logs. Kein Nachrichtentext, aber eine hochsensible Art.-9-Ableitung samt Nutzer-ID.

### A3-6 · Notification-Texte inhaltsfrei · **niedrig** (weitgehend Positivbefund)
Alle geplanten Texte sind generische Vorlagen (`src/hooks/usePushNotifications.ts:345-407`) — kein Chat-, Tagebuch- oder Memory-Inhalt, keine Stimmungswerte. Restrisiko: Sie offenbaren auf dem Sperrbildschirm die Nutzung einer Mental-Health-App („Wie fühlst du dich wirklich?"). Zwei stärker diagnostische Vorlagen (`patternDiscovered:389`, `insightGenerated:399`) sind definiert, aber **ohne Sender** — bei Aktivierung neu zu bewerten.

### A3-7 · Analytics ohne Freitext · **niedrig** (Positivbefund)
Kein Event-Property enthält Freitext, Notizen, Memory-Inhalte, E-Mails oder Nachrichtentext. Grenzwertig: `mood_value` und `need` (gesundheitsnah) landen mit `user_id` in der **eigenen** Tabelle, kein Drittabfluss.

### A3-8 · Supabase-Region widersprüchlich · **mittel** · S
`docs/gdpr-processor-register.md:50` nennt USA/AWS us-east-1; `docs/STATUS.md:90` nennt EU. **NICHT VERIFIZIERBAR** aus dem Code — muss extern geklärt werden, ist für Art. 9 + Kassen-Anträge relevant.

---

## A4 — Secrets & Historie

### A4-1 · Keystore-Passwort im Klartext, doppelt verwendet · **mittel** · S
`android/app/build.gradle:22` (`storePassword 'soulvay2026'`) und `:24` (`keyPassword 'soulvay2026'`) — dasselbe Passwort für beides. Eingeführt in Commit `13ea5e8` (2026-04-20), in HEAD unverändert. Einzige zwei Fundstellen im gesamten Baum.
**Entschärfend:** Die Keystore-Datei selbst lag **nie** im Git (`git log --all -- '*.jks' '*.keystore'` leer; `.gitignore:27-28`). Sie existiert nur lokal untracked. Ohne die Datei ist das Passwort allein nicht verwertbar. **Das Zeitfenster für einen neuen Keystore ist offen, solange Android nicht veröffentlicht ist.**

### A4-2 · Kein echtes Secret in der Historie · **niedrig** (Positivbefund)
Kein `sk_live`/`sk_test`/`whsec_`-Wert, kein `service_role`-JWT, kein RevenueCat-/Google-/OpenAI-Key, keine `.p8`, keine Private-Key-Blobs. Treffer waren durchweg Redaction-Regexe, Test-Fixtures, RLS-Grants oder Variablennamen.
*Einschränkung:* `gitleaks`/`trufflehog` nicht verfügbar → musterbasierter Scan, nicht garantiert erschöpfend für High-Entropy-Secrets.

### A4-3 · `.env` getrackt, aber nur public-Werte · **niedrig** · S
Enthält ausschließlich `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SENTRY_DSN` — alle landen ohnehin im Frontend-Bundle. Bad practice, kein P0.

### A4-4 · Untracked-Notizen mit ASC-Kennungen · **niedrig** · S
`ASC_VERIFY.md` enthält App-Store-Connect **Key ID** und **Issuer ID** (nicht den privaten `.p8`). Übrige Notizen ohne Secrets. `.gitignore`-Vorschlag liegt vor (nicht angewendet, Löschung nicht ohne Rückfrage).

---

## A5 — Betroffenenrechte

### A5-1 · Export unvollständig, kein Verantwortlichen-Export · **hoch** · M
Export existiert nur als Client-Self-Service (`src/components/settings/AccountSettings.tsx:494-511`), keine Edge Function. Abgedeckt: 10 Tabellen. **Fehlen:** `user_activity_log` (enthält die **Krisen-Flags** `crisis_high/medium`, gesetzt `chat/index.ts:849-855`), `analytics_events`, `companion_profiles`, `subscriptions`, `daily_chat_usage`, E-Mail-Tabellen.
*Selbst verifiziert:* `user_activity_log` kommt im Export nicht vor.
Der Verantwortliche kann eine Art-15-Anfrage **nicht selbst** erfüllen — nur der eingeloggte Nutzer, und dann unvollständig.

### A5-2 · E-Mail-PII überlebt die Kontolöschung · **mittel** · M
`delete-account/index.ts` löscht 15 Tabellen inkl. `analytics_events` (`:38-101`) und ruft `auth.admin.deleteUser` (`:112`). Nicht erfasst, weil ohne `user_id`: `email_send_log.recipient_email`, `suppressed_emails.email` (bewusst append-only, keine DELETE-Policy), `email_unsubscribe_tokens.email` (`20260311104447…sql:23-160`). Echte Spannung Suppression-Compliance ↔ Art. 17. Ebenfalls unberührt: Sentry, Edge-Function-Logs, Stripe/RevenueCat, Provider-Backups.

### A5-3 · Consent-Widerruf löscht keine abgeleiteten Daten · **mittel** · M
`revokeAIConsent` (`src/contexts/AuthContext.tsx:127-134`) kippt nur das Flag. Bereits extrahierte `user_memories`, `emotional_patterns`, `session_insights` bleiben, werden bei erneutem Consent wieder in den Prompt injiziert (`chat/index.ts:740-822`).

### A5-4 · Keine granulare Memory-Kontrolle · **mittel** · M
Kein UI zum Einsehen aller, Korrigieren (Art. 16) oder Einzel-Löschen (Art. 17) von `user_memories`. `MemoryMomentCard.tsx` zeigt eine Memory read-only; alle Hooks sind SELECT-only. RLS erlaubt UPDATE/DELETE (`20260310155721…sql:16-17`), aber keine Oberfläche nutzt sie. Betrifft automatisiert abgeleitete Aussagen über die Psyche.

### A5-5 · Fehlender CASCADE-Backstop · **niedrig** · S
Nur 8 von ~16 Nutzertabellen haben `ON DELETE CASCADE` zu `auth.users`. Ohne Cascade: `conversations`, `session_insights`, `emotional_patterns`, `user_memories`, `voice_sessions`, `daily_chat_usage`, `user_activity_log`, `analytics_events`. Die manuelle Schleife deckt sie ab; es fehlt Defense-in-Depth.

---

## A6 — Verbrauch & Kosten

### A6-1 · TTS ohne jedes Pro-Nutzer-Limit · **hoch** · M
`supabase/functions/text-to-speech/index.ts` hat nur `requirePremium` (`:18`, Default wirkungslos, s. A6-3) und einen Zeichen-Cap von 2000 pro Request (`:61`). Kein Tages-/Nutzerzähler. Das 429 bei `:105` ist lediglich das **durchgereichte** ElevenLabs-Limit, kein eigenes.
*Selbst verifiziert.* Größenordnung bei automatisiertem Missbrauch: vierstellig €/Tag; Backstop ist nur das gemeinsame ElevenLabs-Kontingent → **ein Angreifer kann es für alle Nutzer erschöpfen** (Kosten + DoS).

### A6-2 · Kein Kill-Switch, kein Budgetlimit · **mittel-hoch** · M
Keine Feature-Flag/Circuit-Breaker/Budget-Mechanik in `supabase/functions/`. Einzige relevante Env-Var ist `PREMIUM_GATE_MODE` (Paywall, kein Verbrauchslimit). Keine Notbremse bei Kosten-Runaway.

### A6-3 · Premium-Gate wirkungslos · **hoch** · S
Code-Default `"off"` (`_shared/auth.ts:140`); auch der aktuell gesetzte Modus `"log"` lässt Requests durch (`:157-167`). Nur `"enforce"` blockt (402). Damit haben TTS und die fünf Premium-Functions faktisch **keine** serverseitige Abo-Durchsetzung — jeder Authentifizierte kann sie per cURL aufrufen.
*Selbst verifiziert.* Laufzeitwert → **NICHT VERIFIZIERBAR** (Env-Var außerhalb des Repos).

### A6-4 · `elevenlabs-conversation-token` ohne Premium-Prüfung · **hoch** · S
Nur `requireUser` (`elevenlabs-conversation-token/index.ts:17`), obwohl Realtime-Voice clientseitig als Premium gilt (`src/hooks/useVoiceMode.ts:24`). Jeder Authentifizierte kann unbegrenzt signierte ElevenLabs-URLs erzeugen; `agentId` wird ungeprüft aus dem Body übernommen (`:38`).
*Selbst verifiziert.*

### A6-5 · Free-Tier-Zähler nicht atomar · **mittel** · S
`chat/index.ts:780-797`: read-then-write, Upsert nicht awaited und nicht atomar. Paralleler Burst umgeht das 15er-Limit; schlägt der Upsert still fehl, steigt der Zähler nie.
*Selbst verifiziert.*

### A6-6 · `generate-companion` ohne Premium-Gate und ohne Längenlimit · **mittel** · S
`generate-companion/index.ts:25` (nur `requireAIConsent`), `:32` (`appearance_prompt` ohne Cap) → unbegrenzte kostenpflichtige Bildgenerierung (`:55`).

---

## A7 — Test- & Absicherungslage

### A7-1 · Coverage-Metrik unbrauchbar, Krisenpfad-Wert irreführend · **kritisch** · S
Siehe A2-3 für den False Positive. Zusätzlich fehlt `coverage.exclude` in `vitest.config.ts`, wodurch Build-Artefakte (`public/assets/*.js`, `native-bridge.js`, `sw.js`) mitgezählt werden. Headline „19,03 % Statements" ist dadurch bedeutungslos.
Reale src-Werte: `src/` 69,93 · `components` 14,61 · `contexts` 4,04 · `hooks` 19,48 · `lib` 41,46 · `pages` 38,94.
Krisenrelevant: `src/pages/Chat.tsx` 65,2 Stmts / **39,08 Branch**; `src/lib/brand.ts` **0 %**.

### A7-2 · Lint-Zahl um Faktor 10 verfälscht · **mittel** · S
`eslint.config.js:8` ignoriert nur `["dist"]`. Der Lauf scannt die verschachtelten Git-Worktrees unter `.claude/worktrees/` mit — **628 von 723 Datei-Einträgen** stammen daher. Gemeldet: 3103 Probleme. **Real (Worktrees ausgeschlossen): 289 Probleme = 225 Errors + 64 Warnings**, davon nur **9** die i18n-Regel.
→ Die im Projekt kolportierte Zahl „~2800 Altlasten, überwiegend i18n" ist falsch. Real sind **280 Nicht-i18n-Probleme**, verteilt auf: `no-explicit-any` 172 · `exhaustive-deps` 32 · `no-empty` 24 · `only-export-components` 19 · `rules-of-hooks` 5 · u. a.

### A7-3 · Leere catch-Blöcke in beiden Error-Boundaries · **mittel** · S
`src/components/ErrorBoundary.tsx:43` und `src/components/SectionErrorBoundary.tsx:49` — Fehler werden verschluckt. Weitere Beispiele: `src/contexts/AuthContext.tsx:22,23,107,115` (4× `no-explicit-any` auf Auth-Typen) + `:151` fehlende Dependency; `src/components/gdpr/CookieConsent.tsx:57` `any` im Consent-Pfad.

### A7-4 · E2E deckt keinen einzigen kritischen Flow ab, läuft nicht in CI · **hoch** · M
`e2e/` enthält nur `master-validation.spec.ts` (5 Smoke-Tests). Krise **nein**, Journal-Speichern **nein**, Kauf/Entitlement **nein**, Kontolöschung **nein**, Auth nur „Buttons sichtbar" (`:16,42`). `grep -ri playwright .github/` → 0 Treffer; CI fährt nur Vitest, Lint mit `continue-on-error: true`.
→ Beide Qualitätsgates sind faktisch wirkungslos.

---

## A8 — Konsistenz öffentlicher Aussagen

### A8-1 · Falsche E2E-Verschlüsselungs-Behauptung im Store-Listing · **kritisch** · S
`docs/google-play-store-listing.md:55` „• Ende-zu-Ende verschlüsselt" und `:130` „• End-to-end encrypted". Beides ist sachlich falsch (nur TLS-Transport + At-Rest beim Provider) und würde mit Veröffentlichung nutzersichtbar.
*Selbst verifiziert — beide Zeilen sind unverändert vorhanden.*

### A8-2 · Mein eigenes Statusdokument behauptet eine nicht existierende Korrektur · **hoch** · S
`docs/STATUS.md:91` (von mir am 2026-07-25 geschrieben) sagt, die Falschaussage sei „im neuen Entwurf korrigiert". **Das ist unzutreffend** — `docs/google-play-store-listing.md` ist die einzige Listing-Datei im Repo und enthält den Claim weiterhin. Ich hatte die Angabe aus einem Agentenbericht übernommen, ohne sie am File zu prüfen.
→ Der Audit-Trail selbst war an dieser Stelle unzuverlässig. Genau der Fehlermodus, den Arbeitsregel 4 adressiert.

### A8-3 · Landing und Demo-Chat ohne Nicht-Therapie-Hinweis · **kritisch** · S
`src/pages/Landing.tsx` enthält **0 Treffer** für Therapie/Ersatz/Notfall/Krise. `src/components/landing/DemoChat.tsx` hat keinen Disclaimer; einziges Vertrauenselement ist das Badge „Privat & verschlüsselt" (`:69/:80`).
→ Der über LinkedIn geworbene Interessent trifft zuerst auf genau die Fläche mit dem geringsten Schutz (vgl. A2-5).

### A8-4 · `src/lib/brand.ts` ist toter Code · **hoch** · M
Die zentrale Trust-Boundary- und Krisen-Microcopy (`:26`, `:69`, `:133-150`) hat **null Importer** (selbst verifiziert), 0 % Coverage. Ein Governance-Artefakt ohne jede Wirkung. Die tatsächlich sichtbaren Disclaimer stammen aus anderen, hartcodierten Quellen.

### A8-5 · Sichtbare Disclaimer: Bestand · **teils Positivbefund**
Onboarding: sichtbar und als Pflicht-Gate mit Checkbox (`src/pages/Onboarding.tsx:375-378`, blockiert `:216`) — **gut**.
Chat-Erstkontakt: sichtbar (`src/pages/Chat.tsx:517`), aber nach einmaligem Wegklicken dauerhaft weg, ohne Wiedervorlage (`src/components/chat/ChatDisclaimer.tsx:6,14-23`) — **mittel**.
Landing/Demo: fehlt (A8-3).

### A8-6 · Keine Heilversprechen gefunden · **unauffällig** (Positivbefund)
Kein Treffer für werbende Wirkaussagen. Alle Fundstellen sind **verneinend** formuliert: `src/pages/Terms.tsx:28,168`, `FAQ.tsx:205`, `About.tsx:93`, `Onboarding.tsx:61-62,88-89`, `Privacy.tsx:306`. HWG-Risiko aus dem Nutzertext derzeit nicht erkennbar.

### A8-7 · Unqualifiziertes „verschlüsselt" · **niedrig** · S
`src/components/landing/DemoChat.tsx:69/80` „Private & encrypted" / „Privat & verschlüsselt" und `src/pages/Terms.tsx:120/260`. Nicht wörtlich falsch, aber ohne Qualifizierung — in Kombination mit A8-1 unglücklich. Korrekt formuliert dagegen: `Privacy.tsx:63,84`, `FAQ.tsx:36,153` (nennen TLS explizit).

---

## NICHT VERIFIZIERBAR — Gesamtliste

| # | Was | Grund |
|---|---|---|
| 1 | Ob die Live-DB die Policies der Migrationen tatsächlich trägt | Kein Dashboard-Zugriff (Lovable-managed) |
| 2 | Laufzeitwert von `PREMIUM_GATE_MODE` | Env-Var außerhalb des Repos |
| 3 | Training-/Retention-Ausschluss beim Lovable-Gateway | Keine Konfiguration/Doku/Header im Repo |
| 4 | Verarbeitungsregionen aller Anbieter; Supabase EU vs. USA | Widersprüchliche Doku, aus Code nicht ableitbar |
| 5 | Existenz/Inhalt der AV-Verträge | Ordner enthält nur `.gitkeep.md` |
| 6 | Ob `/safety` im installierten PWA-Build offline lädt | Kein Service-Worker-Laufzeittest (read-only) |
| 7 | Reale False-Negative-Rate der Krisen-Regexe | Keine Testdaten, Testschreiben ausgeschlossen |
| 8 | Ob der Demo-Request zur Laufzeit 401 oder 403 liefert | Statische Analyse, kein Deploy-Lauf |
| 9 | Sentry-Retention/-Scrubbing serverseitig | Extern konfiguriert |
| 10 | Ob Stripe/RevenueCat serverseitig Löschung erhalten | `delete-account` ruft sie nicht; Prozessor-Retention unbekannt |
| 11 | Ob `docs/google-play-store-listing.md` der eingereichte Stand ist | Kein Veröffentlichungsstand im Repo |
| 12 | Ob Secrets/Keystore-Passwort bereits extern kompromittiert sind | Aus dem Repo nicht feststellbar |
| 13 | Vollständigkeit des Secret-Scans für neuartige High-Entropy-Secrets | `gitleaks`/`trufflehog` nicht verfügbar |

---

## Ampel nach Bereich

| Bereich | Status |
|---|---|
| RLS / Mandantentrennung | 🟢 unauffällig (Repo-Stand) |
| Secrets | 🟡 ein handlungsrelevanter Fund, entschärft |
| Datenabfluss | 🟠 zwei hohe Befunde |
| Betroffenenrechte | 🟠 funktionsfähig, aber lückenhaft |
| Kostenkontrolle | 🟠 TTS offen, kein Kill-Switch |
| Testlage / Metriken | 🔴 Metriken erzeugen falsches Vertrauen |
| Öffentliche Aussagen | 🔴 falsche Verschlüsselungsaussage, fehlende Disclaimer |
| **Krisenpfad** | **🔴 nicht verantwortbar im jetzigen Zustand** |

---

**⛔ Block A abgeschlossen. Keine Codeänderung erfolgt. Warte auf Freigabe für Block B.**
