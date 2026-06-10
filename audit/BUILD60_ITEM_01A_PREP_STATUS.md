# Item #1A Verifikation Vorbereitung — Status

**Datum**: 2026-05-31 ~23:00

## Daten gesammelt

### Preview-URL — GEKLÄRT (Production, keine separate Sandbox erkennbar)

**Verifiziert via direktes Öffnen am 2026-05-31 ~23:15**:
- `https://mindmate-companion-11.lovable.app` → **HTTP-Redirect auf `https://soulvay.com/auth`**
- Bedeutung: Lovable hat Production auf Custom-Domain `soulvay.com` deployed
- Es existiert kein direkt zugänglicher Lovable-Sandbox-Preview mit eigener Test-DB (Lovable könnte aber via Database-Branching o.ä. einen anbieten — siehe Lovable-Frage)

**Konsequenz**: Test-Accounts würden in Production-Supabase-DB landen, gemeinsam mit echten Usern.

Lovable-Projekt-ID: `dc1f3645-7930-4a62-8f99-9c8b700fe75a`
Tech stack: `new_style_vite_react_shadcn_ts` (Vite + React + Shadcn + TypeScript)
Production-URL: `https://soulvay.com`

### Free-Test-Account
**Status**: nicht angelegt — Registrierung + E-Mail-Verifikation steht aus.

Geplante Test-E-Mail (User-Sub-Adresse via Gmail-Alias):
```
joni.jansen00+test60free@gmail.com
```

### Premium-Mechanismus
**Status**: unklar — Frage an Lovable steht aus.

## Sentry-Secret hinterlegen

**Status**: noch NICHT hinterlegt — wird beim Item-#0-Implementation gemacht.

**Begründung**: Lovable Project Settings hat keinen klassischen "Secrets"-Tab (komplette Sidebar durchgescrollt am 2026-05-31 ~23:00). Da `VITE_*` Variablen in Vite-Builds öffentlich sind, kann die DSN bei Implementation einfach via `.env`-Datei eingetragen werden — keine Pre-Hinterlegung nötig.

Sentry-DSN (für Item #1B Crash-Reporting):
```
VITE_SENTRY_DSN=https://b27656040d83a07366807675d5ba1fb0@o4511514750943232.ingest.de.sentry.io/4511514822967376
```

**Lovable-Workflow für Secrets**: Es gibt keinen klassischen "Secrets"-Tab in Project Settings. Lovable handhabt Variablen üblicherweise via:
1. Chat-Befehl: "Add a secret called VITE_SENTRY_DSN with value [...]"
2. Direkt im Code via `.env`-Datei (Vite-Public-Variablen `VITE_*` sind sowieso öffentlich)

Da die Sentry-DSN **nicht geheim** ist (Public Token, landet im Frontend-Bundle), reicht `.env`-Eintrag oder Hardcoded — keine strenge Secret-Verwaltung erforderlich.

## Lovable-Vorarbeit gefunden

Lovable hat im Chat-Verlauf bereits drei Diagnose-Files erstellt (NICHT im lokalen Git-Repo, nur in Lovables Workspace):

| Datei | Inhalt laut Chat-Zitat |
|---|---|
| `audit/BUILD60_ITEM_01A_DRIFT_CHECK.md` | "kein Drift, Code synchron zum Verifikations-Doc" |
| `audit/BUILD60_ITEM_00_CRASH_REPORTING_DIAGNOSIS.md` | Empfehlung Sentry EU, Opt-In-Consent, ~3,5 h Aufwand |
| `audit/BUILD60_ITEM_01B_DIAGNOSIS.md` | Empfehlung `@capacitor-community/speech-recognition` (Cap-8-Tag verifizieren), Thenable-Trap-Risiko niedrig aber Wrapper-Pattern Pflicht, ~9 h Aufwand |

**Lovables Reihenfolge-Empfehlung**: `#1A-Closure → #0 Sentry → #1B Native` ✅ matched unsere Reihenfolge.

## Offene Punkte für morgen früh

### Tasks
1. **Preview-URL verifizieren**: `https://mindmate-companion-11.lovable.app` öffnen, prüfen dass Soulvay-Landing erscheint
2. **Free-Test-Account anlegen**: Registrierung via Preview-URL mit Test-E-Mail
3. **Sentry-DSN via Lovable-Chat hinterlegen**: 
   ```
   Add a secret VITE_SENTRY_DSN with value 
   https://b27656040d83a07366807675d5ba1fb0@o4511514750943232.ingest.de.sentry.io/4511514822967376
   ```
4. **Entitlement-Simulator klären** — Lovable-Chat-Frage:
   ```
   Gibt es im Dev-Build von Soulvay einen Entitlement-Simulator zum Toggle 
   zwischen Free/Premium für Test-Zwecke? Wenn ja, wie aktivieren? Wenn nein, 
   was wäre der einfachste Weg, einen Test-Account temporär als Premium zu 
   markieren ohne echte Stripe-Zahlung?
   ```
5. **Lovable-Diagnose-Files runter-syncen**: Über Lovable-Git-Sync oder manuelles Copy aus Chat
6. **Browser-Tests 1-8 fahren** gemäß ursprünglichem #1A-Verifikations-Prompt

### Erwartete Zeit morgen
30–45 Min konzentriert.

## Was Claude Code NICHT gemacht hat (per User-Anweisung)

- Keine Account-Registrierung (Captcha-/Email-Risiko)
- Keine Lovable-Chat-Anweisungen gesendet (würde AI-Code-Changes auslösen)
- Keine Code-Änderungen
- Keine Settings-Modifikationen
- Keine Supabase-Backend-Manipulation
