# Build 60 — Status-Snapshot

**Datum:** 2026-06-05  
**Modus:** Read-only Bestandsaufnahme. Keine Code-Änderungen.  
**Basis:** Build 59 (Version 1.0) live im App Store seit 2026-06-01.

---

## 1. Item-Status-Übersicht

| ID | Beschreibung | Status | Dokumente | Letzte Aktivität | Offene Punkte |
|----|--------------|--------|-----------|------------------|---------------|
| #1A | Mic-Input Free (Web + iOS-Safari) | **Implementiert, Verifikation ausstehend** | Diagnose (`BUILD60_ITEM_01_DIAGNOSIS.md`), Verifikation (`BUILD60_ITEM_01A_VERIFICATION.md`) | 2026-06-02 | Manuelle Tests 2.A–2.E durch User noch nicht bestätigt; Telemetrie-Sichtcheck im Backend offen |
| #1B | Mic-Input Free (iOS-/Android-Native via Capacitor-Plugin) | Geplant | — | — | Plugin nicht installiert; Thenable-Trap-Risiko (Build-59-Lesson); iOS-`NSMicrophoneUsageDescription` prüfen; Android-`RECORD_AUDIO` fehlt |
| #2 | Card-Elevation-System (3 Schatten-Stufen) | Geplant | — | — | Tailwind-Tokens noch nicht definiert |
| #3 | Page-Transitions zwischen Tabs (optional) | Geplant (optional) | — | — | `framer-motion` 12 ist vorhanden — keine neue Dep nötig |
| #5 | Übungs-Sicherheits-Pass | Geplant | — | — | Trigger-Warnungen, Crisis-Off-Ramp, Methodik-Quellen für `data/exercises.ts` |
| #6 | Tagebuch-Voice + Editor-Polish | Geplant | — | — | Wartet auf #1A-Verifikation und #1B (gemeinsame STT-Logik) |
| #8 | Companion-Avatar-Polish (Glow + Wechsel-Cache) | Geplant | — | — | — |
| #4 | Chat-Virtualisierung (`react-virtuoso`) | **Bewusst raus aus Build 60** | — | — | Verschoben — kein Akut-Problem laut Build-59-Daten |
| #7 | Topics-Redesign | **Bewusst raus aus Build 60** | — | — | Eigener Design-Pass später |

---

## 2. Code-Stand

**Geänderte Files seit Build 59 (Build-60-Scope):**
- `src/hooks/useAnalytics.ts` — +7 Event-Typen (Mic-Funnel).
- `src/components/chat/ChatInputBar.tsx` — Mic-Lock-Badge & `canUseVoice`-Gating für Mic entfernt.
- `src/pages/Chat.tsx` — `handleToggleRecording` entkoppelt von Premium; Paywall-Telemetrie für TTS/F2F ergänzt.
- `src/hooks/useChatVoice.ts` — `onFinalTranscript` ohne `canUseVoice`-Gate; Permission-Tracking.
- Neue Audit-Docs: `BUILD60_ITEM_01_DIAGNOSIS.md`, `BUILD60_ITEM_01A_VERIFICATION.md`, `BUILD60_OBSERVATIONS.md`, `BUILD_60_CONCEPT.md`.

**High-Level-Diff:** rein additiv + Gate-Lockerung in 4 Files. Keine Edge-Function-, Schema- oder Routing-Änderung.  
**Branch/PR-Status:** unbekannt (Lovable-Workflow committet direkt; klassisches Git-Branching/PR-Modell ist hier nicht abbildbar).  
**Build-Nummer:** noch nicht erhöht; `package.json` führt keine native Build-Nummer (liegt in `ios/App/App.xcodeproj` und `android/app/build.gradle`).

---

## 3. Verifikations-Stand Item #1A

**Implementiert:** Mic-Button für Free aktiv, TTS- und F2F-Gates bleiben intakt, 7 neue Telemetrie-Events verdrahtet.  
**Tests durchgelaufen:** keine automatisierten Tests für die Änderung (`src/test/*` bislang nicht ergänzt). Lovable-Build/TS-Check läuft implizit grün.  
**Tests fehlen:**
- Manuelle Tests 2.A–2.E im Verifikations-Doc (Free-Happy-Path, TTS-Gate, F2F-Gate, Premium-Regression, Edge-Cases).
- Backend-Sichtcheck der neuen Events in `track-event` / `analytics-dashboard`.

**Bekannte offene Punkte:**
- iOS-Native: `isSpeechSupported=false` → Mic-Button rendert nicht. **Bewusst** — Scope #1B.
- Android-Native: zusätzlich `RECORD_AUDIO` fehlt. **Bewusst** — Scope #1B.
- Memory `mem://technical/audio/native-speech-recognition-plugin` veraltet (verweist auf nicht installiertes Plugin).
- Marketing-Claim "Spracheingabe frei" darf erst nach #1B raus (sonst Guideline-2.1-Mismatch-Risiko).

---

## 4. Telemetrie und Beobachtungs-System

**Neue Events Build 60:** `mic_free_attempt`, `mic_permission_granted`, `mic_permission_denied`, `mic_transcription_success`, `mic_transcription_failure`, `mic_to_tts_paywall_triggered`, `mic_to_f2f_paywall_triggered`.

**Pipeline (bestehend):** `useAnalytics` → localStorage-Queue → `track-event` Edge Function → Postgres. Batch 15 s / 25 Events, `sendBeacon`-Fallback bei Unload. Cookie-Consent erforderlich (außer `page_view`).

**Dashboards/Logs:**
- `supabase/functions/analytics-dashboard` + `useAnalyticsDashboard`-Hook im Admin-Bereich (`AnalyticsDashboardSection.tsx`) — Funnel + Daily.
- Supabase-Edge/Postgres-Logs (`analytics_query`-Tool) verfügbar.
- Crash-Reporting: **nicht integriert** (kein Sentry/Crashlytics). Apple/Play-Store-Crash-Reports nur über Apple-Connect / Play-Console.

**Build-59-Live-Daten:** im Codebase **nicht** einsehbar. Downloads/Crashes/RevenueCat-Customers liegen in den jeweiligen Provider-Dashboards (App Store Connect, RevenueCat, Stripe) — **unbekannt** aus Agent-Sicht.

---

## 5. Offene Risiken

| Risiko | Schwere | Anmerkung |
|--------|---------|-----------|
| Mic-Lücke iOS/Android-Native | hoch | App-Store-User sehen Free-Mic-Feature heute nicht; widerspricht künftigem Marketing |
| Capacitor-Plugin-Install (#1B) | mittel | Thenable-Trap aus Build 59; Pod-Install, Permission-Strings, Web-Fallback müssen wasserdicht sein |
| Apple-Re-Review #1B | mittel | Neue `NSMicrophoneUsageDescription`-Begründung + ggf. Audio-Background-Mode prüfen; Free-Voice-Feature darf nicht als "Account-Required für Kernfunktion" gelesen werden (Guideline 5.1.1) |
| Apple-Re-Review #5 | niedrig-mittel | Meditations-/Breath-Übungen müssen Crisis-Off-Ramp und Disclaimer klar haben — sonst Guideline 1.4.1 |
| Kein Crash-Reporting | mittel | Build-60-Regressionen würden ohne Sentry erst über User-Reports auffallen |
| Cookie-Consent-Blocker | niedrig | Telemetrie zählt nur consented Users — bei Reporting kommunizieren |
| Memory-Drift | niedrig | `native-speech-recognition-plugin`-Memory veraltet; muss nach #1B aktualisiert werden |

---

## 6. Empfohlene nächste Phase

**Empfehlung — strikte Reihenfolge:**

1. **#1A-Verifikation abschließen** (User-Pflicht: 2.A–2.E in Preview/Web durchspielen, Backend-Sichtcheck Events). Ohne grünes #1A kein #1B-Start — sonst vermischen sich Web- und Native-Bugs.
2. **#1B-Diagnose starten** (read-only): Plugin-Auswahl, Permission-Strategie iOS+Android, Web-Fallback-Routing, Thenable-Trap-Mitigation. Eigenes Doc `BUILD60_ITEM_01B_DIAGNOSIS.md`. **Noch keine** Plugin-Installation.
3. **Erst nach #1B-GO**: Plugin-Install + iOS-Pod + Android-Permission + End-to-End-Test im jeweiligen Native-Build.
4. **Parallel zulässig (nur weil rein visuell / kein Voice-Conflict):** #2 Card-Elevation — pure Tailwind-Token-Definition, kein State-Risiko. **Nicht** parallel: #6 (hängt an STT-Architektur), #5 (Apple-Review-relevant, eigene Konzentration), #8 (kleiner, aber besser nach #2 für Schatten-Konsistenz).

**Strukturell vor weiterer Implementation zu klären:**
- Soll ein **leichtgewichtiges Crash-Reporting** (Sentry-Capacitor) Teil von Build 60 sein? Aktuell blind nach Release.
- Native Build-Number-Bump-Konvention für Build 60 festlegen (iOS `CFBundleVersion`, Android `versionCode`).

---

## 7. Android-Vorbereitung

Aktueller `AndroidManifest.xml` enthält nur `INTERNET`. Für Play-Store-Release fehlt einiges, das **opportunistisch** mit #1B mitgenommen werden sollte, ohne iOS-Fokus zu stören:

| Punkt | Aktion | Aufwand | iOS-Risiko |
|-------|--------|---------|------------|
| `RECORD_AUDIO`-Permission | Manifest + Runtime-Request via Capacitor-Plugin | klein | keiner |
| `POST_NOTIFICATIONS` (Android 13+) | Manifest + Runtime-Prompt | klein | keiner |
| Network Security Config (cleartext nur Dev) | XML + Manifest-Verweis | klein | keiner |
| Capacitor-Plugin-Konfiguration `capacitor.config.ts` (`SpeechRecognition`, `PushNotifications` Permission-Strings DE) | Config-Block | klein | keiner — gilt für beide Plattformen |
| Google Play Datenschutz-Formular (Data Safety) | Mic-Daten als "nicht gesammelt/nicht geteilt; nur on-device → API" deklarieren | mittel (außerhalb Code) | keiner |
| Play Console Store-Listing | Doc `google-play-store-listing.md` existiert — finalisieren | mittel | keiner |
| App Bundle Signing / `versionCode`-Strategie | `android/app/build.gradle` Bump-Konvention | klein | keiner |
| Android-spezifische E2E-Smoke (Capacitor) | später, nach #1B | mittel | keiner |

**Empfehlung:** Permission- und Manifest-Vorbereitung **gemeinsam mit #1B**-Plugin-Install (gleiche Code-Region, gleicher Test-Zyklus). Play-Console-Formulare/Signing in eigene Build-61-Phase.

---

## Was nicht bestimmbar ist (explizit "unbekannt")

- Live-Downloads Build 59 (App Store Connect — nicht im Code).
- Crash-Rate Build 59 (kein Crash-Reporting integriert).
- RevenueCat-Customers / Conversions (Dashboard-extern).
- Tatsächlicher Branch-/PR-Stand (Lovable committet linear; Git-Branching nicht abbildbar).
- Ob `mem://`-Memories seit Build 59 manuell angepasst wurden außerhalb dieses Snapshots.
