# Sentry Setup für Soulvay — Verifikations-Log

**Datum**: 2026-05-31 ~22:50 (lokal)
**Org**: `soulvay` (Subdomain `soulvay.sentry.io`)
**Region**: **EU (Frankfurt)** — verifiziert via `ingest.de.sentry.io` Domain in DSNs

## Alter Projekt-Status (falsch konfiguriert)

| Feld | Wert |
|---|---|
| Name | `apple` |
| Platform | iOS Cocoa Swift (falsch — Soulvay ist Capacitor-React) |
| DSN | `https://615e9f8343676ec7b95764782f1e041d@o4511514750943232.ingest.de.sentry.io/4511514758152272` |
| Status | ✅ **gelöscht 2026-05-31 ~23:00** durch User-Klick in Sentry-UI |
| Errors zum Lösch-Zeitpunkt | 1 (irrelevant, falsche Platform) |
| Transactions | 0 |

## Neues Projekt-Status (korrekt)

| Feld | Wert |
|---|---|
| Name | `capacitor` (intern in Sentry) |
| Platform | **Capacitor** ✅ |
| Region | EU (Frankfurt) ✅ |
| **DSN** | `https://b27656040d83a07366807675d5ba1fb0@o4511514750943232.ingest.de.sentry.io/4511514822967376` |
| Organization Slug | `soulvay` |
| Project Slug | `capacitor` |
| Project-ID | `4511514822967376` |
| Org-ID | `4511514750943232` |
| Alert Defaults | "Alert me on high priority issues" + Email-Notify (Sentry-Defaults belassen) |

## Empfehlung an Lovable (für Implementation #1B Crash-Reporting)

1. **DSN als Lovable Secret hinzufügen**:
   - Name: `VITE_SENTRY_DSN`
   - Wert: `https://b27656040d83a07366807675d5ba1fb0@o4511514750943232.ingest.de.sentry.io/4511514822967376`

2. **Capacitor-Init-Code im React-Stack** (`src/main.tsx` oder ähnlich):
   ```ts
   import * as Sentry from '@sentry/capacitor';
   import * as SentryReact from '@sentry/react';

   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     // Forward init from @sentry/react
     environment: import.meta.env.MODE,
     release: __APP_VERSION__,  // optional, via Vite define
     tracesSampleRate: 0.1,
     // additional config per BUILD60_ITEM_00_CRASH_REPORTING_DIAGNOSIS.md
   }, SentryReact.init);
   ```

3. **NPM-Dependencies**:
   ```
   npm install --save @sentry/capacitor @sentry/react
   ```
   Versionen müssen synchron sein — siehe `npm info @sentry/capacitor peerDependencies`.

4. **Source-Maps-Upload** (für lesbare Stack-Traces in Production):
   - Auth Token erforderlich (siehe nächster Punkt unten)
   - Standard via `@sentry/vite-plugin` im `vite.config.ts`

5. **Auth Token**: Sentry zeigt diesen typisch im weiteren Setup-Flow oder unter Settings → Auth Tokens. **Nicht ins Git pushen** — als Lovable Secret `SENTRY_AUTH_TOKEN` hinterlegen.

## Pending User-Entscheidungen

### 1. ~~Altes `apple`-Projekt löschen~~ ✅ erledigt

Verifiziert via Projects-Dashboard: nur noch `capacitor` in der Sidebar.

### 2. Source Maps Auth Token

Beim weiteren Setup-Flow zeigt Sentry ggf. einen Auth Token. Falls nicht: Settings → Auth Tokens → "Create New Token" mit Scope `project:releases` + `org:read`. Token sicher speichern (Lovable Secret).

## Was als nächstes

- DSN-Übergabe an Lovable für Item #1B (Crash Reporting Implementation)
- Implementation in einem späteren Step
- Erste Production-Events nach Build 60 Deploy → Sentry Dashboard

## Was Claude Code NICHT gemacht hat (per User-Anweisung)

- Keine Project-Erstellung (User klickte)
- Keine Project-Löschung (User entscheidet später)
- Keine Settings-Änderungen
- Keine Team-/Member-/Integration-Konfiguration
