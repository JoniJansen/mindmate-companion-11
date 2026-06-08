# Item #0 — Sentry Crash-Reporting · Phase B Verification

**Datum:** 2026-06-08
**Phase:** B (Implementation complete, awaiting User-runtime-verification)
**Vorgänger:** `audit/BUILD60_ITEM_00_IMPLEMENTATION_PLAN.md` (Phase A, GO erteilt)

---

## 1. Diff-Summary

### NEU
| File | Zweck |
|---|---|
| `src/lib/sentry.ts` | Init-Wrapper, Consent-Check, scrubEvent, captureException, sendTestCrash |
| `src/components/gdpr/NativeCrashConsentModal.tsx` | First-launch Opt-In Modal (Native-only, default OFF) |
| `ios/App/App/PrivacyInfo.xcprivacy` | Apple Privacy Manifest (CrashData + PerformanceData + OtherDiagnosticData) |
| `audit/BUILD60_VERSIONING.md` | Build-Number-Bump Referenz |
| `audit/BUILD60_PRE_SUBMIT_CHECKLIST.md` | Living-Document, Pre-Submit-Gate |
| `audit/BUILD60_ITEM_00_VERIFICATION.md` | dieses Dokument |

### EDIT
| File | Change |
|---|---|
| `.env` | `+ VITE_SENTRY_DSN=...` |
| `package.json` | `+ @sentry/react@10.43.0`, `+ @sentry/capacitor@^4.0.0` |
| `src/main.tsx` | `+ import { initSentry }; initSentry()` vor `createRoot()` |
| `src/components/ErrorBoundary.tsx` | `componentDidCatch` ruft `captureException` |
| `src/components/SectionErrorBoundary.tsx` | `componentDidCatch` zusätzlich `captureException` (logError bleibt) |
| `src/components/gdpr/CookieConsent.tsx` | `crashReporting` Feld + DE/EN-Strings + Switch + AcceptAll/RejectAll |
| `src/pages/DevQA.tsx` | Warning-Banner + Sentry-Section + Test-Crash-Button + Confirm-AlertDialog |
| `src/App.tsx` | DevQA always-loadable (Direkt-URL only); mount `NativeCrashConsentModal` |

---

## 2. Vorher / Nachher pro Funktionsbereich

### 2.1 Crash-Reporting (vorher = keines)
**Vorher:** `ErrorBoundary` loggte nur in DEV-Console. Production-Crashes nur via Apple Crash Reports (verzögert, ohne Breadcrumbs).
**Nachher:** Web + Native Crashes fließen nach Consent-Grant in Sentry EU. Stack-Traces, Breadcrumbs, Release-Tags. `beforeSend` filtert ohne Consent.

### 2.2 Consent-Architektur
**Vorher:** 3 Cookie-Kategorien (essential, analytics, marketing). Kein Crash-Reporting-Opt-In.
**Nachher:**
- Web: 4 Kategorien, `crashReporting` Default OFF, im Settings-Dialog togglebar.
- Native: separate Storage-Key `soulvay-crash-consent-native`, First-Launch-Modal (DSGVO Art. 6 (1) a), Default OFF.
- `cookie_consent_updated` Event triggert `Sentry.close()` bei Withdrawal.

### 2.3 Privacy-Manifest
**Vorher:** kein `PrivacyInfo.xcprivacy` (Apple seit Mai 2024 verpflichtend → tatsächlich überfällig).
**Nachher:** Manifest deklariert exakt die drei Datentypen, die Sentry-SDK ebenfalls deklariert (Linked=false, Tracking=false, Purpose=AppFunctionality). Match-Required-Risiko ausgeräumt.

### 2.4 DevQA-Page
**Vorher:** Nur in DEV-Mode geladen (`import.meta.env.DEV`).
**Nachher:** In allen Builds via Direkt-URL `/dev-qa` erreichbar, nicht in Navigation verlinkt. Rotes Warning-Banner oben. Test-Crash-Button mit AlertDialog-Confirm. Consent-Status sichtbar.

---

## 3. Verifikations-Checks (Lovable-Sandbox / Code-Statik)

| # | Check | Erwartet | Ergebnis |
|---|---|---|---|
| C1 | `bun add` exit code 0 | ✅ | ✅ `installed @sentry/react@10.43.0`, `@sentry/capacitor@4.0.0` |
| C2 | TypeScript compile (Harness `tsc --noEmit`) | grün | ✅ (replaysSessionSampleRate-Fehler entfernt, Cap-Options sauber) |
| C3 | `grep VITE_SENTRY_DSN .env` | match | ✅ |
| C4 | Privacy-Manifest XML well-formed | match | ✅ (deckungsgleich mit Sentry-Doku) |
| C5 | DevQA Route in `App.tsx` | direkt-URL, kein NavLink | ✅ |
| C6 | NativeCrashConsentModal mount in `App.tsx` | nach DelayedCookieConsent | ✅ |

---

## 4. Manuelle User-Tests (in Sandbox-Preview ausführen)

### Test A — Web Consent OFF → kein Sentry-Event
1. `/dev-qa` öffnen (Direkt-URL eintippen).
2. Status-Zeile prüfen: muss "OFF (events dropped by beforeSend)" zeigen.
3. "Send Test Crash" → Confirm → Toast erscheint.
4. Sentry-Dashboard (filter `test:true`) → **kein Event** in den nächsten 60s.

### Test B — Web Consent ON → Event arrives
1. Cookie-Banner öffnen (Footer-Link oder DevTools `localStorage.removeItem('cookie_consent'); location.reload()`).
2. Im Settings-Dialog `Stabilitätsdaten` aktivieren → Save.
3. `/dev-qa` reload → Status "ON".
4. "Send Test Crash" → Toast → Sentry-Dashboard < 30s zeigt Event `sentry-test-devqa-manual` mit Tag `test:true`.

### Test C — Consent Withdrawal → no further events
1. Nach Test B: Cookie-Settings öffnen, Stabilitätsdaten OFF → Save.
2. Innerhalb 2s sollte Sentry.close() laufen (siehe Console DEV-Mode).
3. Erneut "Send Test Crash" → kein Event mehr im Dashboard.

### Test D — Native Opt-In Modal (nur TestFlight)
1. Frischer Install → App-Launch.
2. Nach ~1.2s: Modal "Hilfst du uns, Soulvay stabiler zu machen?" erscheint.
3. "Nein danke" → Modal weg, `soulvay-crash-consent-native` = `denied` in localStorage.
4. App neustarten → Modal erscheint NICHT mehr.
5. `/dev-qa` → Status "OFF".

### Test E — Native Opt-In → Crash arrives
1. Frischer Install → "Ja, helfen" tippen.
2. `/dev-qa` → Status "ON".
3. "Send Test Crash" → Sentry-Dashboard zeigt symbolisierten iOS-Stacktrace.

---

## 5. Bundle-Size-Impact

Geschätzt aus `@sentry/react@10.43.0` (~60 KB gzip) + `@sentry/capacitor@4.0.0` (~3 KB gzip wrapper).
**Nicht-gemessen:** Vite-Bundle-Analyzer wurde nicht ausgeführt (User-seitig nach Native-Build verifizieren). **Schwelle für STOPP:** > +100 KB gzip → Tree-Shaking-Config prüfen.

Empfohlene Verifikation nach Pull:
```bash
bun run build && ls -la dist/assets/*.js | sort -k5 -n
```
Vergleich mit Build-59-Baseline.

---

## 6. 503-Use-Case (Bonus — wartet auf Live-Daten)

Im #1A-Verifikations-Audit wurden drei HTTP 503-Responses auf Supabase-REST-HEAD-Requests beobachtet (journal_entries, mood_checkins, weekly_recaps). Diese sind **netzwerk-seitige Errors**, nicht JavaScript-Crashes — Sentry's `captureException` greift hier nur, wenn das Frontend den Fehler in einen Throw umwandelt (z.B. `throw new Error('503')` im catch-Block des Fetch).

**Aktion (nicht in dieser PR):** Future-Item #X — Supabase-Client-Wrapper, der non-2xx-Responses an Sentry mit `captureMessage` meldet (level: warning). Markiert als Sentry-Use-Case-#1 für Post-Deployment-Beobachtung.

---

## 7. Apple-Re-Review-Risiko-Bewertung

| Faktor | Bewertung |
|---|---|
| Privacy-Manifest hinzugefügt | **Netto-Verbesserung** — war ohnehin überfällig |
| Drei DataTypes (CrashData/Performance/OtherDiagnostic) | matched Sentry-SDK-Manifest → Static-Analyzer happy |
| NSPrivacyTracking: false | korrekt, Sentry trackt nicht userübergreifend |
| Keine neuen Entitlements | ✅ |
| Keine neuen Permissions im Info.plist | ✅ (Mic-Description bleibt, kein Sentry-spezifisches) |
| Data Safety (Play Console) | manuelle User-Aktion vor Submit (Checklist) |

**Re-Review-Risiko: NIEDRIG.** Build 60 sollte Apple-Review in der üblichen 24-48h-Schiene durchlaufen, sofern PrivacyInfo.xcprivacy korrekt im Xcode-Target hinzugefügt wird (siehe Pre-Submit-Checkliste).

---

## 8. GO / NO-GO für Item #1B

**Empfehlung: GO** für #1B Pre-Install-Check, **sobald** User Tests A–E in Sandbox + TestFlight verifiziert hat.

Begründung:
- Item #0 bringt Crash-Sichtbarkeit für #1B-Native-Bugs → genau die richtige Reihenfolge.
- Keine #0↔#1B-Architektur-Konflikte.
- Sentry-Init ist synchron, kein Thenable-Trap-Risiko (Cap-Init-Pattern unterscheidet sich von RevenueCat).
- Capacitor 8 + `@sentry/capacitor` 4.0.0 sauber kompatibel (Peer verifiziert).

**NO-GO-Trigger:**
- Test B fehlschlägt (Event arrives nicht trotz Consent ON)
- Test A fehlschlägt (Event arrives obwohl Consent OFF) — beforeSend-Filter defekt
- Xcode-Build failt nach `PrivacyInfo.xcprivacy`-Eintrag
- Apple-TestFlight-Symbolication scheitert

---

## 9. Bekannte Limitierungen / Follow-ups

| # | Punkt | Plan |
|---|---|---|
| F1 | `VITE_APP_VERSION` env-var nicht gesetzt → Release-Tag = `soulvay@dev` | Build-Pipeline nachziehen, Item #X |
| F2 | DevQA-Banner ist nur Visual, kein technischer Gate gegen End-User | OK — Route-Discovery-Risiko niedrig genug |
| F3 | Settings-Page hat noch keine UI um Crash-Consent nachträglich auf Native zu ändern | Item #X — small follow-up, ein Toggle-Switch im Privacy-Block |
| F4 | Bundle-Size nicht gemessen (Sandbox baut nicht produktiv) | User-Verifikation nach `bun run build` |

---

## 10. Status

**Phase B: IMPLEMENTATION COMPLETE.**
Waiting on User-Verifikation (Tests A–E) → dann offizielles #0-Closure → dann #1B-Diagnose.
