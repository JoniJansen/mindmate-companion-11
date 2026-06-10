# Build 61 — Abo-Flow Blocker für App-Store-Submission

**Datum**: 2026-06-10 Abend
**Build**: TestFlight 1.1 (61), aktueller HEAD `987649d`
**Severity**: 🔴 BLOCKER für App-Store-Submission Version 1.1
**Discovery-Methode**: User-Test auf iPhone (TestFlight Build 61)
**Discovered by**: User-Test im Soulvay Plus Flow

---

## Symptom

Klick auf "Abo wird vorbereitet" Button → **infinite Loading-State.** Kein Abo-Abschluss möglich, kein Fehler-Toast, kein Modal — nur endloses Spinner-Verhalten.

## Reproduktion

Auf TestFlight Build 1.1 (61) verifiziert:

1. App öffnen → Onboarding/Login durchlaufen falls nötig
2. **Settings → Plus entdecken**
3. **Jahres-Abo** auswählen (Monats-Abo nicht erneut getestet)
4. **AGB-Häkchen** setzen
5. **Widerruf-Häkchen** setzen
6. **"Abo wird vorbereitet"** Button klicken
7. **Symptom**: Button geht in Loading-State, bleibt darin

**Reproduktions-Rate**: 100% (User-Test auf einem iPhone). Multi-Device-Verifikation pending.

## Impact

### Kommerzieller Impact

- **Build 51 (1.0)** ist im App Store live mit funktionierendem Abo-Flow
- **Build 61 (1.1)** auf TestFlight enthält Native-Mic + Sentry + Privacy-Manifest aber Abo broken
- → **Version 1.1 KANN NICHT submitted werden** an App Store ohne funktionierenden Abo
- → Apple würde bei Review den Abo-Flow testen und rejecten (Subscription-Funktion ist Pflicht in IAP-Apps)

### Strategischer Impact

- Soulvay-Roadmap (Native-Mic, B2B-Version, Android Play Store) blocked
- Revenue-Generation aus Build 1.1 Features pausiert
- TestFlight-Tester können keine Premium-Features konsumieren

## Bezugnehmender Code (aus Forensik B58/B59 bekannt)

| File | Rolle |
|---|---|
| `src/hooks/useRevenueCat.ts` | RevenueCat-SDK-Wrapper, `configurePurchases()` + `purchasePackage()` |
| `src/components/premium/UpgradePrompt.tsx` | Premium-Modal UI |
| `src/components/settings/SettingsPremiumSection.tsx` | "Plus entdecken" Eintrag |
| `src/pages/PlusDiscover.tsx` (oder ähnlich) | Plus-Discovery-Page mit Abo-Auswahl |

Build 58 hatte einen Closure-Stale-State-Bug in `handleUpgrade`, gefixt in commits 15-18 (TaskList). Build 59 hatte einen Wrapper-Fix in `useRevenueCat.ts` (commits 30-36).

→ Möglicherweise ist Build 61 mit dem korrekten Code drin, aber **Capacitor SPM-Plugin-Linking** oder **iOS Sandbox-Auth** ist gebrochen.

## Diagnose-Hypothesen (für Lovable Build 62)

### Hypothese A: RevenueCat-Wrapper-Regression

**Möglichkeit**: Build 59-Wrapper-Fix in `useRevenueCat.ts` ist im aktuellen HEAD aber durch späteren Refactor regressiert.

**Beweis-Pfad**:
- `git log --oneline -- src/hooks/useRevenueCat.ts | head -10` — Letzter Edit-Commit?
- `git diff origin/main..HEAD -- src/hooks/useRevenueCat.ts` — Diff seit Build 51 (1.0)?
- Lokal-Test: Browser-Console während Klick auf "Abo wird vorbereitet" — was loggt RC?

**Wahrscheinlichkeit**: MITTEL. Build 59 funktionierte mit dem Wrapper-Fix.

### Hypothese B: StoreKit-Sandbox-Account-Issue

**Möglichkeit**: User hat keinen Sandbox-Tester-Account auf dem iPhone konfiguriert, oder der Account ist nicht für die Test-Region (DE/AT/CH) freigegeben.

**Beweis-Pfad**:
- Settings → App Store → Sandbox-Konto auf iPhone gesetzt?
- Sandbox-Tester in App Store Connect → Users and Access → Sandbox?
- Test mit verschiedenem Sandbox-Account?

**Wahrscheinlichkeit**: NIEDRIG. User hat App schon mehrmals auf Sandbox getestet (B58/B59). Aber jeder neuer iPhone-Build könnte den Cache invalidieren.

### Hypothese C: Capacitor-SPM-Plugin-Hang

**Möglichkeit**: `@revenuecat/purchases-capacitor@13.1.1` SPM-Plugin initialisiert sich auf Build 61 anders als auf Build 58/59. SPM-Migration in Block 3 (gestern) hat möglicherweise unbemerkt etwas verändert.

**Beweis-Pfad**:
- `npx cap sync ios` Output von heute: "Found 3 Capacitor plugins... @revenuecat/purchases-capacitor@13.1.1" ✓
- Lokal-Build + Simulator-Test mit aktivem `Console.app` für nativen RC-Plugin-Log
- Check `ios/App/Package.resolved` — RC-Version-Pin korrekt?

**Wahrscheinlichkeit**: MITTEL-HOCH. SPM-Migration ist neu, und der Bug ist NEU in Build 61.

### Hypothese D: AGB-Häkchen-State-Issue / Button-Handler-Race

**Möglichkeit**: Der "Abo wird vorbereitet"-Button setzt sich in Loading-State per Closure-State, aber die `purchasePackage()`-Promise resolved nie zurück zum Update-State, weil der Closure stale ist (analog zum Build-58-Bug).

**Beweis-Pfad**:
- Wiederherstellen der Build-58-Forensik-Tests (commits 15-18 TaskList)
- `git show 4aa2dab:src/hooks/useRevenueCat.ts` oder ähnliche aktuelle Versionen prüfen
- Browser-Console während Klick: kommt eine Event-Log-Zeile mit "configurePurchases" / "purchasePackage"?

**Wahrscheinlichkeit**: NIEDRIG-MITTEL. Build 58 hatte das Problem, Build 59 fixed es.

---

## Action-Items für Build 62

### Sofort (Lovable Lokal-Forensik)

1. **Web-Test auf soulvay.com**: Reproduziert das Problem auf Web-PWA? Wenn ja → Code-Bug, wenn nein → Capacitor-spezifisch
2. **Code-Diff letzte 7 Tage** auf `useRevenueCat.ts`, `UpgradePrompt.tsx`, `PlusDiscover.tsx`: Welche Edits seit Build 58/59?
3. **Lokal-Browser-Test** (Chrome Dev Console offen): Console-Log + Network-Tab beim Klick auf "Abo wird vorbereitet"

### Falls Web-OK aber Native-FAIL (Capacitor-spezifisch)

4. **Lokal-Build + iOS-Simulator**:
   - `bun run build:ios`
   - Xcode → Simulator-Run
   - Console.app während Klick → RevenueCat-Plugin-Logs
5. **Verifikation**: Build-58-Forensik wiederholen (TaskList commits 25-29 Phase 1-5)

### Falls Code-Bug auf Web auch reproduzierbar

6. **Wrapper-Reapply**: Build-59-Wrapper-Fix (TaskList #30) prüfen ob im aktuellen HEAD wirksam
7. **Closure-Stale-State**: `live-ref getter` Pattern aus Build-58-Fix (TaskList #15)

### Submission-Strategie

8. **Build 51 bleibt live** im App Store mit funktionierendem Abo
9. **Build 62 wird Submission-Kandidat** für 1.1 nach Abo-Fix verifiziert
10. **TestFlight-Tester** weiterhin Build 61 für Native-Mic/Sentry-Verifikation

---

## Verbindung zu früheren Abo-Bugs

Soulvay hat eine reiche Historie von Abo-Bugs (TaskList #1-36):
- **Build 55-56**: RevenueCat SDK-Signaturen + Error-Handling
- **Build 57**: Platform-Detection-Bug
- **Build 58**: Closure-Stale-State in handleUpgrade
- **Build 59**: Wrapper-Fix in useRevenueCat.ts (Goldstandard-Verifikation)

→ **Lesson**: Abo-Flow ist sensitiv für jede SDK-Update, Capacitor-Version-Change, und Code-Refactor. Build 62 sollte das Abo-Flow als Pre-Submit-Regression-Test etablieren.

## Build-62-Pre-Submit-Test-Pattern (vorgeschlagen)

Vor jeder zukünftigen Submission ein systematischer Abo-Smoke-Test:

```bash
# Lokaler Web-Test (auf localhost:5173)
bun run dev
# → Browser → Abo-Flow durchklicken
# → Web-Console + Network-Tab erwarten: kein Hang

# Lokaler Native-Test (Simulator + Console.app)
bun run build:ios
# → Xcode → Simulator Run
# → Abo-Flow durchklicken
# → Console.app erwarten: RC-Plugin-Logs ohne Hang

# Nach Archive (per RELEASE.md Phase 8)
# → Sandbox-Account auf TestFlight-iPhone setzen
# → Abo-Flow durchklicken
# → Apple Sandbox-Receipt validieren via RC-Dashboard
```

Falls einer der drei Tests fehlschlägt → STOP, nicht uploaden.

---

## Reviewer-Doku-Updates für Build 62

Build 59 hatte "Reviewer-Notes" mit dem Cancel-Fix-Hinweis. Build 62 Reviewer-Notes ergänzen um:

```
Build 62 Subscription-Flow:
- Annual + Monthly subscriptions tested in Sandbox  
- AGB + Widerruf checkboxes validated
- "Abo wird vorbereitet" → RC purchasePackage() → Sandbox-Receipt
- Cancel + Restore flows tested per ASC guidance
```

---

## Status nach Build-61-Discovery

- **Build 61**: Pipeline-Fix wirksam (B1 ✅, B2 ✅, C1 ✅), aber Abo-Bug entdeckt
- **Build 62**: Wird Abo-Fix-Build, ETA TBD (abhängig von Diagnose-Tiefe)
- **App-Store-Submission Version 1.1**: PAUSIERT bis Build 62 Abo-Verifikation
- **Build 51 (1.0)**: bleibt live im App Store, funktional

## Push-Decision

Build-61-Audit + dieses Blocker-Doc werden zu origin/main gepusht. Lovable-Auftrag #1 (Abo-Blocker) bekommt diesen Doc als Referenz mit.

---

## POST-MORTEM 10. Juni 2026 — Chrome-Claude RC + ASC Diagnose

### Befund 1 — RevenueCat ist KORREKT konfiguriert

Via Chrome-Claude-Analyse verifiziert: Default Offering mit 3 Packages (Monthly, Yearly, Lifetime), Premium Entitlement korrekt mit Soulvay_plus_yearly + Soulvay_plus_monthly verknüpft, Bundle ID `com.jonathanjansen.mindmate` korrekt, In-app purchase P8-Key hinterlegt als "Valid credentials". Project: Soulvay (`app82b65f8106`). Initial-Verdacht "RC nicht konfiguriert" damit entkräftet.

App Store Connect API-Key in RevenueCat: NICHT hochgeladen — das ist aber nur Monitoring-Limit ("Could not check" Dashboard-Hinweis), kein Funktions-Blocker.

### Befund 2 — Apple Product IDs sind Text-Style, nicht numerisch

Apple unterscheidet:
- **Apple-ID** (intern numerisch, für Berichte): `6759345265` (Yearly), `6759344728` (Monthly)
- **Product-ID** (Text, für Integrationen wie RevenueCat): `Soulvay_plus_yearly`, `Soulvay_plus_monthly`

RC ist exakt korrekt konfiguriert mit den Text-Style-Identifiern. Frühere Annahme dass die numerischen IDs eingetragen sein müssten war falsch.

### Befund 3 — App Store Connect Subscription-Approval-Chain ist der ECHTE Blocker

Apple-Guideline 3.1.1 verlangt: Subscriptions können nicht approved werden bevor ein Binary existiert das die IAPs kaufbar macht.

**Circular Dependency**:
- Build braucht Subscription-Setup
- Subscription-Setup braucht Build mit funktionalen IAPs

**Aktueller ASC-Status**:
- Build 59 ist live (Version 1.0)
- Beide Subscriptions Status: "Entwickleraktion erforderlich"
- Apple-Ablehnungsgrund: Guideline 3.1.1

**Apple-Ablehnungstext** (verbatim):
> "We have begun the review of your In-App Purchases but aren't able to continue because your submitted In-App Purchases indicate a change of business model for the app. In order to approve your new In-App Purchase business model, we have to verify the purchasability of the items being sold. Please upload a new binary and make sure that your new In-App Purchase products are available for purchase at the time of review."

**Auflösung**:
1. Upload Build mit funktionalen IAPs
2. Neue App-Version-Submission mit verknüpften Subscriptions
3. Apple reviewed Build + Subscriptions gemeinsam
4. Bei Erfolg: Subscriptions werden "Cleared for Sale"

### Befund 4 — Build 59 (Live) hat noch nie funktionierende Abos gehabt

Subscriptions waren während Review nicht kaufbar (Silent-Failure-Pattern in `getOfferings()` — der gleiche Bug den Lovable jetzt in Build 63 mit `withTimeout` gefixt hat). Apple konnte deshalb nicht approven.

→ **Soulvay hat seit Live-Gang keinen User-Kauf abschließen können.** Erkenntnis rechtzeitig VOR Marketing-Push entdeckt. Build 63 ist der erste Binary der Apples Guideline-3.1.1-Anforderung erfüllen kann.

### Aktionsplan (Updated 2026-06-10 Abend)

1. ✅ Build 63 vorbereitet (commit `506b042`) und gepusht
2. ✅ Build 63 in Xcode archivieren + zu ASC uploaden
3. ✅ ASC Submission-Infrastruktur verifiziert komplett (Demo-Account, Paywall-Screenshots, Review-Notes, Sandbox-Tester)
4. ✅ Apple-Review-Risk-Fixes für Build 64 implementiert (Lovable commits `298a535`, `374eb47`, `412f5b0`):
   - Apple Guideline 2.3.1 — fabrizierte Statistiken in CommunityInsights.tsx entfernt
   - Apple Guideline 2.1 — Dead-Button "Stresssignale erkennen" → Journal-Navigation
   - Apple Guideline 5.1.1 — Sentry-Consent-Modal verifiziert konform (keine Änderung)
5. ⏳ Build 64 Archive + Upload (morgen früh 2026-06-11, 8:30-9:30)
6. ⏳ ASC: Neue Version 1.1 anlegen
7. ⏳ Build 64 mit Version 1.1 verknüpfen
8. ⏳ Beide Subscriptions in Version 1.1 als "Bundled In-App Purchase" anhaken
9. ⏳ Version 1.1 zur Apple-Review einreichen
10. ⏳ Apple-Review abwarten (24-48h, erwartete Live-Time: 13.-15. Juni 2026)
11. ⏳ Nach Approval: Subscriptions "Cleared for Sale"

Vollständige Build-64-Doku in `audit/BUILD64_APPLE_REVIEW_FIXES.md`.
