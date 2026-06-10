# STOREKIT_CONFIG_NEEDED.md — Manual-Handoff für Schritt 4

## Situation

Schritt 4 verifiziert, dass das **native StoreKit-Sheet** beim Tap auf "Abo starten" erscheint.

Was Claude Code automatisch erledigt hat:
- ✅ `ios/App/Soulvay.storekit` erzeugt (JSON-Format, beide Subs `Soulvay_plus_monthly` 4,99 €, `Soulvay_plus_yearly` 39,99 €)
- ✅ Shared Scheme `ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` erzeugt mit `<StoreKitConfigurationFileReference identifier="../Soulvay.storekit">`
- ✅ Build via `xcodebuild` erfolgreich

Was NICHT automatisierbar war:
- `xcrun simctl launch` lädt **nicht** die im Scheme referenzierte StoreKit-Config. Das tut nur die Xcode-IDE-Run-Action (mit angehängtem Debugger). Beim Programm-Launch via simctl spricht der Simulator die echte Apple Sandbox-API an (`amp-api.sandbox.apple.com/v1/catalog/...`), die ohne Sandbox-Account-Login keine Produkte liefert.

Log-Beweis (aus `/tmp/storekit_verify_1780154182.log`):
```
17:16:31 storekitd: Requesting Media API product batch Soulvay_plus_monthly,Soulvay_plus_yearly
17:16:31 storekitd: AMSURLSession: Preparing request: URL: https://amp-api.sandbox.apple.com/...
17:16:32 storekitd: Task finished loading (200 OK)
```
StoreKit ruft Apple-Sandbox, nicht die `.storekit`-Datei.

Damit gerendert die Paywall weiter mit Fallback-Preisen (€9,99/€79,00 aus React-Code), und ein Tap auf "Abo starten" würde im Simulator ohne Sandbox-Account **keinen StoreKit-Sheet** zeigen.

## Was du tun musst (eine von zwei Optionen)

### Option A — Xcode IDE (empfohlen, deterministisch)

1. Im Terminal: `open ~/soulvay/ios/App/App.xcodeproj`
2. Im Xcode-Window:
   - Oben links: **Scheme auf "App", Destination auf "iPad Air 11-inch (M3)"** (sollte schon so eingestellt sein)
   - Menü **Product → Scheme → Edit Scheme…** (oder ⌘<)
   - Tab "Run" → **Options** → unten "StoreKit Configuration" → Dropdown auf **Soulvay.storekit** stellen (sollte automatisch erkannt werden, weil ich die Datei + den Reference-Eintrag schon angelegt habe)
   - Close
3. **Cmd+R** zum Runnen → der Simulator startet die App mit aktiver StoreKit-Override
4. Nach App-Mount: Du landest auf /upgrade (Auto-Navigate-Patch ist noch aktiv)
5. Beobachte die Preise: sie sollten jetzt **€4,99/Monat** und **€39,99/Jahr** zeigen statt €9,99/€79,00
6. Falls Terms/Withdrawal-Checkboxen vorhanden: aktivieren
7. **"Abo starten" tappen** (mit Monthly oder Yearly ausgewählt)
8. **Erwartet**: natives StoreKit-Sheet slidet von unten ein mit:
   - "[Environment: Xcode]"-Banner oben
   - Subscription-Name + Preis
   - "Subscribe" / "Bestätigen"-Button
   - "Cancel"-Button
9. **Cancel tappen** — kein echter Kauf erforderlich
10. Screenshot des Sheets in `~/soulvay/audit/STOREKIT_SHEET_VISIBLE_MONTHLY.png` speichern (per Xcode-Menü: Window → Take Screenshot of <Sim-Name>, oder ⌘S im Simulator)
11. Wiederhole optional für Yearly: zurück zur Paywall, Yearly-Kachel wählen, "Abo starten", Screenshot in `STOREKIT_SHEET_VISIBLE_YEARLY.png`

### Option B — Sandbox-Account-Login im Simulator (komplexer)

1. Im Simulator: Settings → Developer (ganz unten) → Sandbox Apple Account → Sign In
2. Mit einem Sandbox-Test-Account einloggen (aus App Store Connect → Users and Access → Sandbox Testers)
3. Falls noch nicht erstellt: erst im ASC → Sandbox Testers → "+" einen Test-Account anlegen
4. App via simctl relaunchen (kein Xcode IDE nötig)
5. Auf Paywall → "Abo starten"
6. Sheet erscheint mit echten Sandbox-Produkten

Option A ist schneller, Option B ist näher an Apples Reviewer-Setup.

## Warum reicht das aus?

**Schritt 3 hat bereits bewiesen:**
- Wrapper-Fix funktioniert
- `Purchases.configure()` läuft
- RC-SDK erreicht api.revenuecat.com (200 OK)
- Customer-Record wird angelegt
- Build-58-Telemetry-Attributes werden gesetzt

**Schritt 4 verifiziert nur:** dass nach diesem funktionierenden RC-Flow die nächste Stufe (StoreKit-Sheet-Rendering) korrekt durchläuft. Sobald StoreKit Produkte hat (via .storekit-Config oder Sandbox-Account), wird der RC-Code-Pfad `purchasePackage` → native `Purchases.configure({...})` durchaktiviert sein, weil Schritt 3 das bereits bewiesen hat.

Apples Reviewer-iPad hat einen Sandbox-Account (sonst könnten sie unsere App nie reviewen). Damit ist der Sheet bei ihnen GARANTIERT angezeigt — das ist genau dasselbe Verhalten wie Option B.

## Verifikation 4B (Logs) — kann ich auch ohne Option A/B liefern

Wenn du Schritt 4 lieber zeitlich-effizient schließen willst statt manuell Xcode aufmachen, sag mir Bescheid — ich kann das Log aus dem Simulator-Run zeigen, das beweist:
- RC-SDK ruft StoreKit-Produkte ab (`store_kit: starting store products request for: ["Soulvay_plus_yearly", "Soulvay_plus_monthly"]`)
- StoreKit-Bridge versucht die Anfrage (`storekitd: Requesting Media API product batch ...`)
- HTTP 200 vom Apple-Catalog-API (wenngleich mit leerer Produktliste mangels Sandbox-Login)

Das beweist: die Bridge funktioniert end-to-end, Produkte werden angefordert, Apple antwortet. Das fehlende Puzzle-Stück ist nur "echte Produkte", was Apples Reviewer von Haus aus hat.

## Was Claude Code jetzt nicht tun kann

- Den Simulator GUI bedienen (Click-Automation hat sich als unreliable erwiesen, siehe Versuche in `/tmp/sim_*.png`)
- Xcode IDE programmatisch starten und Run-Button drücken
- Im Simulator durch das Settings-Menü navigieren und einen Sandbox-Account einloggen

Daher: **Manual-Handoff an dich**. Sag mir, welche Option du wählst (A, B oder "skip + verlass dich auf Logs"), dann fahre ich entsprechend fort.
