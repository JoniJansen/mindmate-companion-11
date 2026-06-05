# Item #0 — Crash-Reporting: Diagnose

**Datum:** 2026-06-05  
**Status:** Diagnose (read-only). Keine Implementation, keine Installation.  
**Scope:** Production-Crash-Sichtbarkeit für Soulvay Web + iOS + Android ab Build 60.

---

## 1. Problemstellung

Soulvay läuft seit 2026-06-01 live (Build 59, iOS). Aktuell keine Crash-Telemetrie integriert:
- Apple App Store Connect liefert Crashes verzögert (Stunden bis Tage), aggregiert, **ohne Breadcrumbs** und nur für User mit aktiviertem "Share with App Developers".
- `track-event`/`analytics-dashboard` deckt Produkt-Events, nicht Runtime-Errors/Stack-Traces.
- `useAnalytics` ist Cookie-Consent-gated → keine Pre-Consent-Crash-Sicht.
- Build 60 bringt Mic-Plugin (Native), Card-Elevation, Übungstexte. Regressionen würden ohne Crash-Reporting erst über 1★-Reviews sichtbar.

---

## 2. Provider-Vergleich

| Provider | Web | Capacitor-Plugin | DSGVO-Tauglichkeit | Free Tier | Empfehlung |
|----------|-----|------------------|--------------------|-----------|------------|
| **Sentry** | `@sentry/react` (offiziell, aktiv) | `@sentry/capacitor` (offiziell maintained) | DPA verfügbar, EU-Region (`ingest.de.sentry.io`) wählbar, PII opt-in | Developer: 5k Errors + 10k Replays + 10M Performance Units/Monat | **Primär-Empfehlung** |
| Bugsnag | `@bugsnag/js` | `@bugsnag/capacitor` (Community, weniger aktiv) | DPA, kein nativer EU-Endpoint | Free: 7,5k Errors/Monat | Alternative |
| Firebase Crashlytics | (nur Native) | Capacitor-Community-Plugin, native-only | Google-Datenfluss USA → DSGVO-Reibung | Unlimited | NICHT empfohlen — keine Web-Abdeckung, US-Datentransfer |
| Datadog RUM | `@datadog/browser-rum` | kein offizielles Capacitor-Plugin | EU-Region | Trial-based | Overkill |
| Eigenbau (Edge Function) | trivial | Window.onerror + Capacitor-Listener | volle Kontrolle | kostenlos | hoher Wartungsaufwand, kein Symbolicate/Stack-Resolve, kein Dedupe |

**Empfehlung: Sentry** — beste Web+Native-Abdeckung, EU-Hosting, ausreichendes Free-Tier-Limit, etabliert in der Capacitor-Community.

---

## 3. Architektur-Skizze (NICHT implementiert)

```
src/
  lib/
    sentry.ts             # init() einmalig in main.tsx; DSN aus VITE_SENTRY_DSN
  components/
    ErrorBoundary.tsx     # bereits vorhanden — Sentry.captureException ergänzen
main.tsx                  # initSentry() VOR React-Render
```

**Init-Pattern (Skizze):**
```ts
import * as Sentry from "@sentry/react";
import { init as initCap } from "@sentry/capacitor";

initCap(
  {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `soulvay@${APP_VERSION}+${BUILD_NUMBER}`,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,           // DSGVO: keine PII per default
    beforeSend(event) {
      if (!hasCrashConsent()) return null;
      return scrubEvent(event);      // entfernt URLs mit Tokens, email-likes
    },
  },
  Sentry.init,
);
```

---

## 4. Thenable-Trap-Risiko (Build-59-Lesson)

`@sentry/capacitor` `init()` ist **synchron** und gibt `void` zurück — **kein Thenable**, kein `Promise.resolve(plugin)`-Risiko. Im Gegensatz zum RevenueCat-Bug bezieht sich der Aufruf nicht auf einen Proxy, der mit `then`-Property als Promise interpretiert werden könnte. Risiko: **niedrig**.

Caveat: `Sentry.captureException()` ist ebenfalls synchron. Flushing vor App-Kill braucht `await Sentry.close(2000)` in `App.addListener('appStateChange')` — sauber dokumentieren.

---

## 5. DSGVO / Privacy

| Aspekt | Maßnahme |
|--------|----------|
| Rechtsgrundlage | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse — Stabilität) ODER explizite Einwilligung |
| Cookie-Consent | Neue Kategorie `crashReporting` im `CookieConsent.tsx`; default **OFF**, opt-in. `beforeSend` returnt `null` ohne Consent. |
| PII | `sendDefaultPii: false`. User-ID nur als opaker Hash (`hash(user.id)`) statt Email. |
| Datenfluss | Sentry EU-Region (`o*.ingest.de.sentry.io`) — kein US-Transfer. |
| DPA | Sentry GmbH (Deutschland) bietet AVV — in `compliance/processor-agreements/` ablegen. |
| Datenschutzerklärung | `/privacy` ergänzen um Abschnitt "Stabilitäts-Telemetrie via Sentry (EU)". |
| Record of Processing | `docs/gdpr-record-of-processing-activities.md` erweitern. |

---

## 6. Apple / Privacy-Manifest

- `PrivacyInfo.xcprivacy` muss `NSPrivacyCollectedDataTypes` erweitern: `OtherDiagnosticData` (linked = false, used for tracking = false, purpose = `AppFunctionality`).
- Kein `NSPrivacyTracking`-Flag nötig (Sentry tracked nicht userübergreifend).
- App Review Notes: kurzer Satz "Diagnostic data via Sentry (EU), user-opt-in". Re-Review-Risiko **niedrig**.
- Keine neuen Entitlements, keine Background-Modes.

## 7. Android / Play Console

- Data Safety-Formular: "Crash logs" + "Diagnostics" → "Collected, not shared, optional".
- Keine zusätzliche Permission (nutzt `INTERNET`, schon vorhanden).

---

## 8. Cost-Analyse

Free Tier (Sentry Developer): 5k Errors/Monat. Bei Build 59 mit aktuell niedrigem User-Stand (< 1k Installs) realistisch ausreichend. Trigger-Punkt für Team-Plan ($26/Monat): > 50k Errors/Monat oder Bedarf an Replay/Performance über Free-Limit hinaus.

**Sample-Rate-Empfehlung Build 60:** `tracesSampleRate: 0.1`, `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1.0` (nur Replay bei Crash) — minimiert Quota-Verbrauch.

---

## 9. Implementations-Aufwand (geschätzt nach GO)

| Schritt | Aufwand |
|---------|---------|
| Sentry-Account + EU-Projekt + DSN | 15 min (User-Aktion) |
| `bun add @sentry/react @sentry/capacitor` | 5 min |
| `src/lib/sentry.ts` + `main.tsx`-Hook | 30 min |
| `CookieConsent.tsx` Kategorie + `ErrorBoundary`-Integration | 45 min |
| `PrivacyInfo.xcprivacy` + AndroidManifest Review | 20 min |
| `npx cap sync` + iOS Pod-Install + Android Gradle-Sync | 15 min |
| Verifikations-Doc + manuelle Crash-Tests (Web/iOS/Android) | 60 min |
| DSGVO-Doku-Update (`/privacy`, RoPA) | 30 min |
| **Summe** | **~3,5 h** |

---

## 10. Verifikations-Plan (für spätere Implementation)

1. Web: `throw new Error('sentry-test')` in DevQA-Route → Event erscheint im Sentry-Dashboard < 30 s.
2. iOS Simulator (TestFlight-Build): forcierter Crash via DevQA → Sentry erhält Stack-Trace.
3. Android Emulator: dito.
4. Consent OFF → kein Event landet (verify im Dashboard).
5. PII-Scrubbing: Test-Event mit Email im Payload → Email maskiert.
6. Release-Tag stimmt mit `CFBundleVersion`/`versionCode` überein.

---

## 11. Bekannte Risiken

| Risiko | Mitigation |
|--------|-----------|
| Sentry-Init überschneidet sich mit Service-Worker (Edge-Case bei PWA) | Init nach `serviceWorker.ready` triggern oder global try/catch |
| Doppel-Reporting (Web-SDK + Capacitor-Plugin auf Native) | `@sentry/capacitor` deaktiviert das React-SDK auf Native-Plattform automatisch — Doku bestätigen |
| Replay-Feature könnte sensible Inhalte aufzeichnen (Chat-Texte) | Replay nur on-error + Mask `input,textarea,[data-private]` |
| Free-Tier-Quota-Spike bei Loop-Crash | `Sentry.init({ maxBreadcrumbs: 50, beforeSend dedupe })` + Alert in Sentry konfigurieren |

---

## 12. Stop-Bedingungen / GO-Voraussetzungen

- **STOPP**, falls User Sentry aus Cost/Privacy-Gründen ablehnt → Bugsnag-Re-Diagnose.
- **GO erst**, wenn: (a) Sentry-Account + EU-Projekt steht, (b) `VITE_SENTRY_DSN` als Secret bereit, (c) User OK mit Opt-In-Consent-Default.
- Implementation **nach** #1A-Verifikation-Closure (kein Architektur-Konflikt erwartet, aber serielle Disziplin).

---

## 13. Empfehlung

**GO für Implementation als Item #0 in Build 60.** Provider: Sentry, EU-Region, Opt-In via Cookie-Consent. Vor #1B implementieren — damit #1B-Native-Bugs sofort sichtbar werden.
