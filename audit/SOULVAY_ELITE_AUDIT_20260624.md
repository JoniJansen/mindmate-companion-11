# Soulvay — Elite-Audit (Verbesserungs-Backlog)

*Stand: 2026-06-24. Ergebnis eines **read-only** Mehr-Agenten-Audits (6 Agenten: Performance, Accessibility, Security, Test-Abdeckung, Code-Gesundheit). Nur Empfehlungen — nichts ist angewendet. Voller Roh-Output im Workflow-Run `whs1bift3`.*

## Kurzfazit
Soulvay ist im Kern **solide gebaut** — die sicherheitskritischen Fundamente (JWT-Auth, RLS, server-seitige AI-Consent- und Premium-Prüfung, RevenueCat-Lazy-Init) tragen die hart erkämpften Lehren früherer App-Store-Ablehnungen. Größtes durchgängiges Thema: **fehlende Single-Source-of-Truth-Disziplin** (parallele Logik, ~335 inline-i18n-Ternaries, Tests die Kopien der Logik prüfen). Akut blockierend: **die Test-Suite ist rot (2/110), niemand merkt es, keine CI.**

## Was schon gut ist (NICHT anfassen)
- **Security/Backend:** Edge-Auth zentral über JWT (nie `user_id` aus dem Body), server-seitiger AI-Consent-Gate, lückenlose RLS, Webhooks verifizieren Signatur & schlagen fehl-geschlossen, Secrets sauber getrennt.
- **Performance-Fundament:** Route-Code-Splitting (~25 Lazy-Pages), RevenueCat & Fonts lazy/self-hosted, Netzwerk-Dedup, sinnvolle TanStack-Query-Defaults.
- **a11y-Basics:** 44×44px-Tap-Targets, 16px-Inputs (kein iOS-Zoom), Radix-Fokus-Trapping, `HtmlLangSync` + `<main>`-Landmark.
- **Code-Hygiene:** saubere geteilte Utilities (`logger` mit Secret-Redaction, `nativeDetect`, `errorMapper`), de/en-Key-Parität, ErrorBoundaries mit Sentry.

## Top 10 mit größtem Hebel
Rang nach (Schwere ⨯ Hebel ÷ Aufwand), Duplikate über Dimensionen zusammengeführt.

| # | Titel | Bereich | Schwere | Aufwand | Wo | Fix |
|---|-------|---------|---------|---------|-----|-----|
| 1 | **Test-Suite ROT (2/110) + keine CI** | Tests | Kritisch | Quick | `src/test/phase2-hardening.test.ts:31-48`; `.github/workflows/` fehlt | Veraltete Preference-Tests fixen/löschen, `"test":"vitest run"` ergänzen, minimaler GitHub-Actions-Check (`vitest run`+`lint`) auf PRs |
| 2 | **1,26 MB Logo-PNG eager + im PWA-Precache** | Performance | Hoch | Quick | `src/assets/logo.png` (1024²); `public/logo.png`, `public/favicon.png` | Auf reale Größe (256²) als WebP → ~10-30 KB. Ein geteiltes `<Logo/>`. PWA-Icons/Favicon auf Soll-Größe |
| 3 | **`process-email-queue` ohne Auth öffentlich** | Security | Hoch | Quick | `supabase/functions/process-email-queue/index.ts:41-44`; `config.toml:26-27` | `verify_jwt=false` + kein Code-Check = jeder triggert Queue-Drain unter Service-Role. `x-cron-secret` gegen `CRON_SECRET` prüfen (wie `setup-review-account`) |
| 4 | **Kontoauflösung löscht `analytics_events` nicht (GDPR Art. 17)** | Security | Hoch | Quick | `delete-account/index.ts:55-69` | Enthält `crisis_resource_viewed`, `mood_logged` → `"analytics_events"` zur `tablesToDelete` hinzufügen |
| 5 | **Kein globales `prefers-reduced-motion` (~100 Animationen)** | a11y | Hoch | Medium | `App.tsx` (kein `MotionConfig`); `index.css` | Für Mental-Health-App echter Schaden. `<MotionConfig reducedMotion="user">` + CSS-`@media`-Kill-Switch |
| 6 | **Premium-AI-Features nur client-seitig gated** | Security | Mittel | Medium | `usePremium.ts:413-420` vs. `text-to-speech`/`session-insight`/`generate-summary`/`journal-reflect`/`weekly-recap` | Nicht-Premium kann bezahlte Funktionen direkt aufrufen. `requirePremium()` in `_shared`, 402/403 in den Premium-Funktionen |
| 7 | **Chat re-rendert ganze Liste + parst Markdown pro Drip-Tick** | Performance | Hoch | Medium | `useStreamingDisplay.ts:60-81`; `ChatMessages.tsx:68-115`; `Chat.tsx:567-568` | memoized `<ChatMessageItem>` per id+content, `onRetry/onContinue` via `useCallback`, `ChatMessageContent` `useMemo` |
| 8 | **`usePremium` ohne Behavioral-Coverage (umsatz-/review-kritisch)** | Tests | Hoch | Medium | `usePremium.ts:402-424` & `:136-231` | Reine Funktion `resolvePremium({...})` extrahieren + Unit-Tests (Demo→non-premium, Server=false+Cache=true→non-premium) |
| 9 | **~335 inline `language==="de"?…` Ternaries umgehen i18n** | Code Health | Hoch | Large | 40+ Dateien | Schrittweise nach `t()` migrieren (Chat→Home→Settings→Upgrade), Lint-Guard gegen neue Inline-Strings |
| 10 | **Chat-Stream keine Live-Region — Screenreader hört AI nicht** | a11y | Hoch | Quick | `ChatMessages.tsx:55-137` | `role="log" aria-live="polite"` auf der finalen Nachricht; Typing-Indikator als `aria-live`-Status |

> **Unsicherheit:** Schweregrade aus statischer Analyse. #2/#3/#4 faktisch belegbar, risikoarm. #7 vor Fix einmal mit React-DevTools-Profiler auf echtem iPhone bestätigen. a11y-Kontrastwerte berechnet, nicht auf Gerät verifiziert.

## Schnelle Siege (zuerst)
**#1** (Tests grün + CI) → entblockt alles · **#2** (Logo 1,26 MB → ~20 KB) → größter Perf-Gewinn pro Minute · **#3** (Endpoint absichern) · **#4** (GDPR-Lücke, ein Array-Eintrag) · **#10** (Chat-Live-Region) · Fokus-Indikator-Kontrast (`index.css :focus-visible`).

## Vorgehen
Items auswählen → `frontend-feature`/`supabase-edge` setzen um → `code-reviewer` + `qa-test` verifizieren → Ship erst auf dein GO. *(Größere Brocken & volle Detail-Findings: im Run-Output `whs1bift3`; bei Bedarf erweitere ich dieses Doc.)*
