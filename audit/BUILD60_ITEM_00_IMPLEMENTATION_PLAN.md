# Item #0 — Sentry Crash-Reporting · Phase A Implementation Plan

**Datum:** 2026-06-08
**Status:** Phase A (Mini-Diagnose, read-only). KEINE Implementation, KEINE Installation.
**Voraussetzung:** Item #1A Closure (`audit/BUILD60_ITEM_01A_CLOSURE_VERIFICATION.md`) verifiziert grün.
**GO/NO-GO-Entscheidung:** User nach Lektüre dieses Dokuments.

---

## 0. Setup-Input vom User (verifiziert)

| Feld | Wert |
|---|---|
| Projekt | `soulvay-prod` (Platform: Capacitor) |
| Region | EU Frankfurt (`ingest.de.sentry.io`) |
| Org Slug | `soulvay` |
| Project Slug | `capacitor` |
| DSN | `https://b27656040d83a07366807675d5ba1fb0@o4511514750943232.ingest.de.sentry.io/4511514822967376` |

DSN-Charakter: ein DSN ist **keine geheime Credential** im Sinne eines API-Keys — er identifiziert nur das Sentry-Projekt und wird zwingend im Client-Bundle ausgeliefert (Web + Native Bundle). Sentry-Doku bestätigt: "The DSN is not a secret." Schutz gegen Quota-Abuse erfolgt serverseitig via Rate-Limits + Inbound-Filter im Sentry-Dashboard, nicht via Geheimhaltung.

→ **Konsequenz für Hinterlegung:** siehe Klärung 1.

---

## 1. Klärung — Wo wird die DSN hinterlegt?

**Empfehlung: `.env` als `VITE_SENTRY_DSN` (Build-Zeit, Vite inlinet ins Bundle).**

Begründung:
- Lovable Secrets (`add_secret`) sind ausschließlich **Runtime-Secrets für Edge Functions** — sie werden NICHT in den Client-Build injiziert. Eine Hinterlegung dort wäre wirkungslos für den Sentry-Client.
- Die existierende `.env` enthält bereits öffentliche `VITE_SUPABASE_*`-Keys nach demselben Muster. DSN passt strukturell rein.
- Vite-Konvention: nur `VITE_`-prefixed Variablen werden geleakt → bewusste Markierung.

**Aktion in Phase B:**
```
.env  (NEU-Zeile, append):
VITE_SENTRY_DSN="https://b27656040d83a07366807675d5ba1fb0@o4511514750943232.ingest.de.sentry.io/4511514822967376"
```

Fallback wenn `import.meta.env.VITE_SENTRY_DSN` leer ist → `initSentry()` returnt früh ohne Init, kein Crash. So bleiben Forks/Preview-Branches ohne DSN funktional.

---

## 2. Klärung — Versionen & Cap-8-Kompatibilität

| Paket | Geplante Version | Peer-Range | Cap-8-Status |
|---|---|---|---|
| `@sentry/capacitor` | **`^4.0.0`** (latest stable) | `@capacitor/core: >=3.0.0`, `@sentry/react: 10.43.0` | ✅ kompatibel (Cap 8 erfüllt `>=3.0.0`) |
| `@sentry/react` | **`10.43.0`** (peer-locked exakt) | React `>=16.14` | ✅ React 18.3.1 erfüllt |

Verifiziert per `npm view @sentry/capacitor version peerDependencies`:
```
version = '4.0.0'
peerDependencies = {
  '@capacitor/core': '>=3.0.0',
  '@sentry/angular': '10.43.0',
  '@sentry/react': '10.43.0',
  '@sentry/vue': '10.43.0'
}
```

**Lesson-Learned aus #1B-Vorbereitung angewandt:** Peer-Version von `@sentry/react` ist **exakt gepinnt** (kein Caret-Range). D.h. wir müssen `@sentry/react@10.43.0` exakt installieren, nicht `^10.43.0`, um Drift-Warnings zu vermeiden. Bun installiert per Default exakt was im manifest steht, aber wir nutzen bewusst die exakte Version in `package.json`.

Cap-8-Native-Side: `@sentry/capacitor` v4 enthält iOS-Pod `Sentry/HybridSDK` und Android-Aar `io.sentry:sentry-android` — beides ist mit der in `android/variables.gradle` definierten `minSdkVersion = 24` kompatibel (Sentry-Android min ist API 21). iOS-Min ist iOS 13 (Sentry) vs. Cap 8 default iOS 13 → passt.

**Kein bekannter Konflikt.** Verifikation in Phase B-Schritt 1: nach `bun add` direkt TypeScript-Check + Vite-Build.

---

## 3. Klärung — Cookie-Consent-Erweiterung

**State-Owner:** `src/components/gdpr/CookieConsent.tsx` (Zeilen 8–20). State lebt als `ConsentSettings` in `localStorage["cookie_consent"]`, JSON-serialisiert. Zwei Helper exportiert: `isAnalyticsAllowed()`, `isMarketingAllowed()`.

**Erweiterung (minimal-invasiv):**
1. Type um Feld erweitern: `crashReporting: boolean` (default `false`).
2. `defaultSettings` ergänzen: `crashReporting: false`.
3. Im Settings-Dialog **dritte Sektion** ergänzen (analog zu `marketing`-Block, Zeilen 272–281). Texte de/en:
   - DE: "Stabilitätsdaten" / "Hilft uns, Abstürze und Fehler zu erkennen, damit wir die App stabil halten können. Anonymisiert, EU-Hosting (Sentry GmbH)."
   - EN: "Stability Data" / "Helps us detect crashes and errors so we can keep the app stable. Anonymous, EU-hosted (Sentry GmbH)."
4. **Neuer Helper** exportieren: `isCrashReportingAllowed(): boolean` (analog `isAnalyticsAllowed`).
5. `handleAcceptAll`: setzt zusätzlich `crashReporting: true`. `handleRejectAll`: `crashReporting: false`.
6. **Native (Capacitor) Spezialfall** (Zeile 83–94): Bei `isCapacitorNative()` wird Banner skipped + Essential-only forciert. **Wir setzen dort `crashReporting: true` als Default** — Begründung: Apple-Privacy-Manifest deklariert die Datenerhebung bereits, AppTrackingTransparency ist nicht relevant (Sentry trackt nicht user-übergreifend), und ohne Crash-Reporting auf Native verlieren wir genau die Plattform mit dem höchsten Crash-Risiko. **Alternative zur Diskussion:** auf Native ein einmaliges In-App-Modal "Diagnosedaten teilen?" beim ersten Launch — Aufwand +30 Min, Apple-Review-konform.

**Cross-Component-Read im `beforeSend`:**
```ts
// src/lib/sentry.ts
import { isCrashReportingAllowed } from "@/components/gdpr/CookieConsent";

beforeSend(event) {
  if (!isCrashReportingAllowed()) return null;
  return scrubEvent(event);
}
```
Read ist synchron via `localStorage` → keine Race-Conditions, kein Async-Boundary.

**Event-Listener auf Consent-Change:** `CookieConsent.tsx` dispatcht bereits `cookie_consent_updated` (Zeile 182). `sentry.ts` registriert Listener → bei Disable in laufender Session `Sentry.close()` oder `Sentry.getClient()?.getOptions().enabled = false`. Implementations-Detail in Phase B.

---

## 4. Klärung — ErrorBoundary-Integration

`src/components/ErrorBoundary.tsx` (existiert) loggt aktuell nur in DEV-Console (Zeile 28). Erweiterung minimal:

```ts
public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  if (import.meta.env.DEV) console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  // Sentry — silent if not initialized or consent missing (beforeSend filtert).
  try {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
  } catch { /* swallow — never let logging break the fallback UI */ }
}
```

Bestehende Fallback-UI bleibt 1:1 erhalten. `SectionErrorBoundary.tsx` analog erweitern (1 Aufruf).

`main.tsx` Global-Handler (Zeilen 47–58) — `window.addEventListener("error" | "unhandledrejection")` — sind **bereits captured durch das Sentry-SDK selbst** (es installiert eigene Listener). Doppelung vermeiden → wir lassen die bestehenden DEV-Logs unverändert und verlassen uns auf Sentrys Auto-Instrumentation.

---

## 5. Klärung — Privacy-Manifest (iOS)

**Datei NEU:** `ios/App/App/PrivacyInfo.xcprivacy` (existiert aktuell nicht — verifiziert via Filelist).

**Konkrete XML:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeCrashData</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePerformanceData</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeOtherDiagnosticData</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array/>
</dict>
</plist>
```

**Begründung der drei DataTypes:** Sentrys offizielles Privacy-Manifest deklariert genau diese drei (CrashData, PerformanceData, OtherDiagnosticData). Wenn wir nur einen davon listen, wird der App-Review-Static-Analyzer Apples Manifest-Diff melden ("Sentry SDK declares X but app manifest omits it") → potenzielle Re-Review.

**Re-Review-Risiko:** Apple verlangt seit Mai 2024 ein Privacy-Manifest. Soulvay hat aktuell keines (verifiziert: Datei fehlt). Das Hinzufügen ist **erforderlich** unabhängig von Sentry — Build 60 ist der richtige Zeitpunkt. Risiko: **niedrig**, sofern die deklarierten Types mit den tatsächlich gesendeten Sentry-Daten übereinstimmen (tun sie).

**Xcode-Projekt-Integration:** Datei wird in `ios/App/App/` abgelegt und muss in `project.pbxproj` als Bundle-Ressource gelistet werden. Wenn Lovable das pbxproj-Update nicht zuverlässig macht, dokumentieren wir Manual-Step für den User in Xcode ("Add file to App target, Copy items if needed").

**Android-Pendant:** Keine analoge Manifest-Pflicht. `AndroidManifest.xml` (Zeile 35 zeigt nur `INTERNET`) bleibt unverändert. Play-Console-Data-Safety-Formular muss user-seitig nach Deploy ergänzt werden — nicht-Code-Aktion.

---

## 6. Klärung — Verifikations-Plan ohne Production-User zu beunruhigen

**Drei Test-Vehikel:**

1. **DevQA-Route Trigger** — `src/pages/DevQA.tsx` existiert. Wir fügen einen Button "Send Test Crash" ein, der `throw new Error("sentry-verification-build60")` ausführt. Route ist nicht öffentlich verlinkt → kein Produktions-Risiko.

2. **Environment-Tag** — Sentry-Init mit `environment: import.meta.env.MODE` → "development" / "production". Im Sentry-Dashboard können wir Test-Events einfach filtern und nicht versehentlich mit echten Crashes vermischen. Test-Events bekommen zusätzlich `tags: { test: true }` über die Trigger-Route.

3. **Native-Test in TestFlight Internal Lane** — kein App-Store-Submit nötig. Build mit Sentry → in TestFlight zur internen Gruppe → Crash triggern → Sentry-Dashboard verifiziert Stack-Trace + Symbolication.

**Was wir NICHT tun:** Keine künstlichen Crashes auf der Live-Production-URL `soulvay.com`. Keine Tests gegen Real-User-Sessions.

**Erfolgskriterien (alle drei müssen ✅ sein, sonst NO-GO für #1B):**
- Web-Test-Crash erscheint < 30s in Sentry mit korrektem Stack-Trace
- iOS-TestFlight-Build sendet Crash mit dSYM-symbolisiertem Trace
- Consent OFF → Test-Crash erscheint NICHT in Sentry (beforeSend-Filter verifiziert)
- DSN-leer-Pfad (lokaler Branch ohne `.env`-Eintrag) crashed nicht und blockiert App-Start nicht

---

## 7. Stop-Bedingungen (aus User-Prompt übernommen + erweitert)

| # | Trigger | Action |
|---|---|---|
| S1 | `@sentry/capacitor` nicht Cap-8-kompatibel | STOPP — bereits ausgeräumt in §2, aber re-verify nach `bun add` |
| S2 | DSN-Hinterlegung scheitert | STOPP — `.env` ist Standard-Mechanismus, kein Fail-Pfad bekannt |
| S3 | Privacy-Manifest erhöht Re-Review-Risiko über Diagnose-Bewertung | STOPP — `xcprivacy` ohnehin überfällig, kein zusätzliches Risiko |
| S4 | ErrorBoundary-Integration bricht bestehendes Error-Handling | STOPP — Integration ist `try/catch`-gewrappt, kein bekannter Fail-Pfad |
| S5 | TypeScript-Check fail nach `bun add` | STOPP — briefen mit konkretem Error |
| S6 | Bundle-Size +>100 KB gzip nach Sentry-Add | STOPP — briefen, ggf. Tree-Shaking-Config |
| S7 | Apple-Build (`npx cap sync ios` + Pod-Install) failt | STOPP — Native-spezifischer Pfad, kein "weiter mit Web" |

---

## 8. Was Phase B konkret tun wird (zur Information, nicht zur Ausführung)

Reihenfolge non-negotiable (jedes Step mit Verifikation, Stop bei rot):

1. `bun add @sentry/react@10.43.0 @sentry/capacitor@^4.0.0` → Vite-Build + TypeScript-Check grün
2. `.env` append `VITE_SENTRY_DSN=...` (+ Doku im `audit`-File)
3. `src/lib/sentry.ts` NEU — `initSentry()` + `scrubEvent()` + Consent-Listener
4. `src/main.tsx` — `initSentry()` Aufruf VOR `createRoot()`
5. `src/components/ErrorBoundary.tsx` + `src/components/SectionErrorBoundary.tsx` — `Sentry.captureException` in `componentDidCatch`
6. `src/components/gdpr/CookieConsent.tsx` — `crashReporting`-Kategorie + Helper-Export
7. `ios/App/App/PrivacyInfo.xcprivacy` NEU + pbxproj-Eintrag-Doku
8. `src/pages/DevQA.tsx` — "Send Test Crash"-Button (env-gated, nicht in Production-Build sichtbar wenn gewünscht)
9. `audit/BUILD60_ITEM_00_VERIFICATION.md` — Test-Crash-Screenshot + 503-Use-Case-Notiz
10. Hinweis an User: `npx cap sync` + iOS-Pod-Install + Build-Bump (CFBundleVersion 51→60, versionCode entsprechend) — **NICHT von Lovable ausgeführt** (Native-Build läuft lokal beim User)

**Geschätzte Brutto-Zeit Phase B:** 3 h Code + 1 h Verifikations-Doku. Keine Parallelisierung mit #1B.

---

## 9. Offene Frage an den User (entscheidet Phase B)

**Q1 — Native-Crash-Reporting-Consent-Default:**
Auf iOS/Android wird der Cookie-Banner aktuell ge-skipped (Apple-Tracking-Vorgaben). Soll Crash-Reporting auf Native:
- **(A) Default-ON sein** (empfohlen — Privacy-Manifest deklariert es, max. Crash-Sichtbarkeit, kein Tracking) — **0 Min Mehraufwand**
- **(B) Hinter einem In-App-Opt-In-Modal beim ersten Launch** (konservativer, mehr User-Vertrauen) — **+30 Min**

Default in der Diagnose: A. Bestätige A oder wähle B.

**Q2 — DevQA-Test-Crash-Button in Production sichtbar?**
- **(A) Nur in DEV-Mode** (`import.meta.env.DEV`) — Sandbox/Local only
- **(B) In Production sichtbar** (für TestFlight-Verifikation nach Submit)

Empfehlung: B mit Route-Guard (`/devqa` nur via direkt-URL erreichbar, nicht verlinkt). Bestätige.

---

## 10. Empfehlung

**GO für Phase B** sobald Q1 + Q2 beantwortet. Keine Blocker identifiziert. Cap-8-Kompatibilität verifiziert. Privacy-Manifest ist netto Compliance-Verbesserung, nicht Risiko-Erhöhung. Bundle-Size-Estimate: ~60 KB gzip für `@sentry/react` Core (innerhalb Toleranz).
