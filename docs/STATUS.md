# Soulvay — Status-Snapshot

**Stand:** 2026-07-25 · Branch `main` @ `65d8b06` · nur Ist-Zustand, keine Empfehlungen.

---

## 1. Stack

| Ebene | Technologie |
|---|---|
| Sprache | TypeScript 5.8 (strict), Deno-TS in Edge Functions |
| Frontend | React 18.3, Vite 5.4, Tailwind CSS 3.4, shadcn/ui, framer-motion 12 |
| State | TanStack Query 5 (Server-State), React Contexts (Auth, Tour), Custom Hooks + localStorage (Theme, Präferenzen, Onboarding) |
| Native | Capacitor 8 — Targets: iOS (live, Build 64), Android (Debug-APK), PWA. Plugins: local-notifications, haptics, status-bar, speech-recognition, splash-screen, keyboard |
| Backend | Supabase (Lovable-Cloud-managed, Projekt `djnbvnufmegiursvqbhp`) — 23 Deno Edge Functions |
| DB | Supabase Postgres (Lovable-managed, kein direkter Dashboard-Zugriff — siehe `audit/SUPABASE_ACCESS_MODEL.md`) |
| Auth | Supabase Auth (E-Mail/Passwort), Demo-Mode ohne Account (3 Nachrichten) |
| Billing | RevenueCat (iOS IAP) + Stripe (Web) + Apple-Receipt-Verify, je eigener Webhook |
| Monitoring | Sentry 10.60 (consent-gated), eigene Analytics-Edge-Function |
| KI/Audio | Gemini via Lovable-Gateway (Text), ElevenLabs `eleven_multilingual_v2` (TTS) |
| CI | GitHub Actions: Tests blockierend, Lint non-blocking |

## 2. Verzeichnisbaum (Tiefe 3, ohne node_modules/build/.git)

```
.
├── .claude/            (agents, worktrees ×5)
├── .github/workflows/  (CI)
├── android/            (app/src, gradle)
├── assets/             (icon-only.png — Icon-Quelle)
├── audit/              (Elite-Audit-, Krankenkassen-, ZPP-, Status-Docs)
├── compliance/         (gdpr-documents, legal-pages, processor-agreements)
├── docs/               (Store-Listing-Entwürfe, dieses Dokument)
├── e2e/                (Playwright)
├── ios/App/            (App, CapApp-SPM)
├── public/             (badges, companions/hires, store)
├── scripts/
├── src/
│   ├── assets/
│   ├── components/     (admin, auth, chat, companion(s), gdpr, home, journal,
│   │                    landing, layout, mood, premium, routing, settings,
│   │                    shared, streak, toolbox, tour, ui)
│   ├── contexts/  data/  hooks/  integrations/  lib/  pages/ (33)
│   ├── test/ (14 Testdateien)  translations/ (11 Namespaces)
└── supabase/functions/ (23 Functions + _shared)
```

291 TS/TSX-Dateien in `src/`, 33 Pages.

## 3. Feature-Inventar

**Funktioniert heute (Web/iOS; Android baubar, auf A50 sichtgeprüft):**
Landing mit Demo-Chat (3 Nachrichten ohne Account) · Auth inkl. Passwort-Reset · Onboarding · Companion-Chat mit Streaming, Companion-Auswahl/-Generierung, Krisen-Erkennung · Companion-Gedächtnis (Extraktion + seit heute sichtbare Memory-Karte auf Home) · Tagebuch mit Voice-Eintrag (SpeechRecognition) · Mood-Check-ins + stimmungsabhängige Übungs-Brücke (heute neu) · Toolbox mit 10 Übungen + animiertem Player + TTS (4 heute neu) · Weekly Recap · Session-Summary · Timeline · Chat-Verlauf · Themes/Accent-Farben + Dark Mode (inkl. Android-Statusbar-Sync, heute neu) · Einstellungen (Notifications, Voice, Account, Companion) · Premium-Abo über 3 Zahlwege · i18n DE/EN · PWA-Install · lokale Reminder nativ (heute neu, auf Gerät ungetestet) · Haptik (heute neu) · Safety-Seite · Admin- und DevQA-Seiten (unverlinkt, Direkt-URL).

**Angefangen / eingeschränkt:**
Streak-Nudge nur Web (braucht Tagesaktivität zur Feuerzeit) · Remote-Push existiert nicht (nur lokale Notifications) · `WeeklyRecap.tsx`-Komponente verwaist (Recap läuft inline in Journal) · Multi-KI-Selector nur als Strategie-Doku (`audit/`) · `journal.startWriting`/`yourEntries`-Keys möglicherweise ungenutzt (dynamische Verwendung unklar) · TTS ohne Fallback bei ElevenLabs-Ausfall.

## 4. Git

- **Branch:** `main`, synchron mit `origin/main` @ `65d8b06`.
- **Working Tree:** sauber bis auf 10 untracked Altlasten (6 Session-Notizen im Root: `ASC_VERIFY.md`, `DIAGNOSE.md`, `FIX_CLOSURE.md`, `MANUAL_TEST_NEEDED.md`, `RC_VERIFY.md`, `ROOT_CAUSE.md`; dazu `ios/…/xcshareddata/`, `ios/App/ExportOptions.plist`, `ios/App/Soulvay.storekit`, `supabase/.temp/`).
- **Log (letzte 30, gekürzt — heute = oberste 9):** 5× Upgrade-Runde (Features/Native/Polish/i18n+Tests/Docs), Chat-Sprach-Fix, Android-Statusbar, Android-Icon, Kassen-Kontakt-Umstellung; davor Sub-DB-Fix + Sentry-Alignment (`905e5ff`), Elite-Audit-Serie (#5–#10), Krankenkassen-Paket.
- **Offene Branches:** `feat/app-store-ready`, `backup/pre-lovable-sync-20260407`, 9× `claude/*`-Session-Branches (Worktrees, teils veraltet).

## 5. Qualitäts-Gates

| Gate | Stand |
|---|---|
| Tests | 196/196 grün (14 Dateien; heute 125 → 196). Keine Coverage-Messung konfiguriert. |
| Typecheck | `tsc --noEmit`: 0 Fehler |
| Build | `vite build` grün (PWA precache ~20 MB, 163 Einträge) |
| Lint | repo-weit **rot**: ~2.800 Bestandsfehler (überwiegend i18n-Ternary-Regel in `supabase/functions/`); CI-Lint non-blocking; heutige Dateien einzeln clean |
| E2E | Playwright-Setup vorhanden (`e2e/`), nicht in CI |

## 6. Dependencies

- 72 Dependencies + 17 Dev-Dependencies.
- **Deutlich veraltet (Majors):** React 18 → 19, Vite 5 → 8, Tailwind 3 → 4.
- **Bekannte Vulnerabilities (`bun audit`):** `tar < 7.5.7` über `@capacitor/cli` — 6× high, 2× moderate (Path-Traversal-Familie). Dev-/Build-Kette, nicht im Client-Bundle.

## 7. KI-Layer

- **Modell:** `google/gemini-3-flash-preview` über das Lovable-AI-Gateway (`supabase/functions/chat/index.ts:874`); kein direkter Google-API-Key im Repo.
- **Prompts:** inline in 7 Edge Functions — `chat`, `detect-patterns`, `extract-memories`, `generate-summary`, `session-insight`, `journal-reflect`, `weekly-recap`. Kein zentrales Prompt-Verzeichnis.
- **Guardrails:** AI-Consent-Modal + serverseitige Prüfung (`requireAIConsentAndPremium` in `_shared/auth.ts`) · Premium-Gate 3-Modi (`off`/`log`/`enforce`), seit 2026-07-21 auf `log` · Krisen-Erkennung mit Verweis auf Hilfsangebote (kein Therapie-Anspruch, `src/lib/brand.ts`) · Demo-Mode auf 3 Nachrichten begrenzt · Sentry nur nach Consent.

## 8. Datenmodell

- **Nutzerdaten:** Konto (E-Mail), Präferenzen, Konversationen + Nachrichten, Companion-Memories (extrahierte Persönliches-Fakten mit Confidence), Tagebuch-Einträge, Mood-Check-ins, Abo-Status (`subscriptions`, seit 2026-07-21 mit UNIQUE-Index auf `user_id`), Analytics-Events, E-Mail-Queue.
- **Speicherort:** Supabase Postgres im Lovable-Cloud-Projekt (EU-Region laut Lovable). Kein direkter DB-Zugriff des Eigentümers (siehe `audit/SUPABASE_ACCESS_MODEL.md`).
- **Verschlüsselung:** TLS im Transport, At-Rest-Verschlüsselung des Providers. **Keine Ende-zu-Ende-Verschlüsselung.**
  - *Korrektur 2026-07-26:* Dieser Eintrag behauptete zuvor, eine gegenteilige Aussage im Store-Listing sei „im neuen Entwurf korrigiert". Das war unzutreffend — die Falschaussage stand unverändert in `docs/google-play-store-listing.md:55,130` und wurde erst am 2026-07-26 tatsächlich entfernt (Befund A8-2 in `audit/P0_FINDINGS.md`). Die ursprüngliche Angabe stammte aus einem ungeprüften Agentenbericht.
- Journal-/Mood-Daten sind Gesundheitsdaten i.S.d. Play-Data-Safety-Deklaration (Details: `audit/PLAYSTORE_RELEASE_RUNBOOK.md`).

## 9. Änderungen der letzten Agent-Sessions (heute, 5 Agenten + Hauptsession)

1. **Heute-Paket-Agent:** MemoryMomentCard, MoodExerciseBridge + moodExerciseMap, 4 Übungen in `exercises.ts`, Übersetzungen, 11 Tests → Commit `1841a35`.
2. **Native-Agent:** `notificationSchedule.ts` (pure, getestet), `localReminders.ts`, `usePushNotifications.ts`-Umbau, `haptics.ts` + 4 Einbaustellen, cap sync (iOS/Android-Projektdateien), 9 Tests → `5f20af8`.
3. **Polish-Agent:** AnimatePresence-Route-Fades in AppLayout, EmptyState-Komponente + Namespace, Skeletons (Journal/Recap/ChatHistory/Timeline), 7 tote Dateien + verwaiste Keys entfernt → `7cf97a6`.
4. **QA-Agent:** 48 Tests (i18n-Konsistenz, Routen-Smoke, Greeting, RootRedirect, Übungs-Daten); Fund: 27 Ghost-Keys → Fix durch **i18n-Agent** (27 Keys + Ratchet-Test) → `20a4ea6`.
5. **Audit-Agenten (Vortag/heute):** `APP_STATUS_2026-07-21.md`, `FEATURE_UPGRADE_PLAN.md`, ZPP-Verifizierung (Prüfung kostenfrei, Kapitel-5/7-Unterscheidung) → `65d8b06`; außerdem Playstore-Runbook (unversioniert).
6. **Hauptsession:** Chat-Sprach-Fix (`85ca979`), Android-Icon (`911e7b0`), Statusbar-Theme-Sync (`dee7e40`), Sentry-Capacitor-Alignment (`905e5ff`), Kassen-Kontakt-Umstellung (`2db1185`), LinkedIn-Tester-Post veröffentlicht, Handout-PDF erzeugt.

## 10. Die 5 größten Sorgen — ungeschönt

1. **Das Backend gehört faktisch nicht uns.** Produktions-DB, Env-Vars und Server-Logs liegen im Lovable-Account; jede Server-Operation läuft über deren Chat-KI (Credits, Latenz, Fehlerrisiko — sie meldete diese Woche "Build grün", während die CI rot war). Kein Backup-/Export-Weg in Eigenregie verifiziert.
2. **Der heutige Native-Schub ist auf keinem echten Gerät verifiziert.** Reminder-Scheduling, Permission-Flows, Haptik und Statusbar-Verhalten sind nur test-/code-verifiziert; Samsung-Akku-Optimierung kann inexakte Alarme zusätzlich verzögern oder schlucken. iOS-Build 65 mit all dem steht aus.
3. **Lint ist strukturell blind.** ~2.800 Bestandsfehler, CI non-blocking — neue echte Fehler sind im Rauschen unsichtbar. Absicherung existiert nur punktuell (i18n-Ratchet, Tests).
4. **Sicherheits-Altlasten:** Ein Klartext-Keystore-Passwort liegt in der Git-Historie (`android/app/build.gradle`, Fund im Playstore-Runbook); dazu die tar-Vulnerabilities in der Build-Kette. Beides ungefixt.
5. **Monetarisierung ist erst seit dieser Woche überhaupt messbar.** Der Abo-Webhook-Fix (UNIQUE-Index) ist Tage alt, das Premium-Gate steht auf `log` statt `enforce` — wie viele Nutzer Premium-Funktionen unbezahlt nutzen und ob die Abo-Datenlage stimmt, ist bis zur Log-Auswertung (ab 2026-08-04) unbekannt.
