# DIAGNOSIS_MASTER.md — RevenueCat Init-Pfad Wurzelursache

## Wurzel-Ursache (eine klare Aussage)

**Die `getPurchasesPlugin()`-Funktion in `src/hooks/useRevenueCat.ts` gibt den Capacitor-Plugin-Proxy `Purchases` direkt aus einer `async`-Funktion zurück. Das JavaScript-Promise-Resolution-Algorithmus prüft den Return-Value via Thenable-Detection (`proxy.then(...)`). Der Capacitor-Plugin-Proxy fängt JEDEN Property-Zugriff ab und routet `.then` als nativen Method-Call `Purchases.then()` an die iOS-Bridge weiter. Auf iOS existiert diese Method NICHT — die Bridge rejected mit `"Purchases.then() is not implemented on ios"`, aber via Fire-and-forget; die Thenable-Detection-Callbacks werden nie aufgerufen. Folge: das `await getPurchasesPlugin()` im Caller `initializeIfNeeded()` HÄNGT für immer. `Purchases.configure()` wird nie aufgerufen, kein RC-Backend-Event entsteht, kein Subscriber-Record wird angelegt, und der Purchase-Pfad fällt unweigerlich in den Fallback-Toast.**

Sicherheitsstufe: **hoch**. Per A/B-Test mit Wrapper-Fix beweisbar.

## Beweis-Kette

### 1. Code-Forensik (`audit/INIT_FLOW.md` + `PLUGIN_LINKING.md`)

Verdrahtung ist korrekt:
- SPM-Plugin-Registration: `RevenuecatPurchasesCapacitor` → `purchases-hybrid-common@18.1.0`
- Public API Key in Code (`appl_VatNsFmCDlJPOPkBGnzmhHyZrYy`) matched RC-Dashboard
- Bundle ID `com.jonathanjansen.mindmate` matched über alle 5 Layer (Code/Capacitor/Xcode/ASC/RC)
- Genau ein `Purchases.configure()`-Aufruf
- Keine StoreKit-Configuration-File-Leakage
- Keine ATS-Overrides

### 2. RC-Dashboard-Forensik (`audit/RC_TELEMETRY_BUILD58.md`)

- 0 Customer-Records in 90 Tagen, sowohl Production als auch Sandbox.
- Konsistent mit Phase-3-Befund: keine `configure()`-Calls = keine Backend-Events = keine Customers.

### 3. Simulator-Live-Log mit DOM-Overlay (`audit/SIMULATOR_DIAG_RESULT.md`)

Vor Wrapper-Fix:
- Marker-Kette stoppt bei `[B6]` (innerhalb getPurchasesPlugin)
- Unhandled-Rejection-Handler erfasst: `"Purchases.then()" is not implemented on ios`
- `[AFTER-AWAIT]` feuert NIE → await hängt

Nach Wrapper-Fix:
- Komplette Kette feuert bis inkl. `[E] configure RESOLVED {durationMs:0}` und `[G] getOfferings result`
- `setLogLevel`, `configure`, `getOfferings` werden alle erfolgreich an die native Bridge weitergereicht

### 4. Common-Issues-Checks (implizit beantwortet)

- ✓ Plugin-Version kompatibel (`@revenuecat/purchases-capacitor@13.0.1` mit `purchases-hybrid-common@18.1.0`)
- ✓ Kein Bundle-ID-Drift
- ✓ Kein StoreKit-Config-File aktiv im Scheme
- ✓ Keine ATS-Restriction
- ✓ Nur ein `configure`-Call
- — `Purchases.logIn` wird im Demo-Modus nicht aufgerufen (kein authenticated user); das ist OK, RC erzeugt anonymen `$RCAnonymousID`

## Sicherheits-Stufe

**HOCH** — die Diagnose ist mit einem A/B-Test bewiesen:

| Run | Code | Resultat |
|---|---|---|
| Vor Fix | `return mod.Purchases` | Hang bei B6, unhandled "Purchases.then() not implemented" |
| Nach Fix | `return { plugin: mod.Purchases }` | Komplette Init-Kette läuft durch, configure resolved |

Das ist kein Vermuten — wir haben den Hang induziert UND aufgelöst durch die gezielte Änderung.

## Erforderliche Fixes

| Schicht | Was muss geändert werden | Risk | Verifizierbar |
|---|---|---|---|
| **Code (Hauptfix)** | `src/hooks/useRevenueCat.ts`: `getPurchasesPlugin()` returnt `{ plugin: mod.Purchases }` statt `mod.Purchases`; Caller in `initializeIfNeeded` destructured `wrapped.plugin` | NIEDRIG (minimal-invasiv, eine Stelle) | ✅ Lokaler Simulator-Test mit Console-Log oder Network-Inspection |
| **Code (Defensiv)** | Window `unhandledrejection`-Handler hinzufügen, der `"is not implemented on ios"` als Capacitor-Bridge-Fehler erkennt + an RC subscriber attribute schickt — falls jemals wieder ein Thenable-Trap auftritt | NIEDRIG | ✅ |
| **Code (Defensiv)** | `initializeIfNeeded` mit hartem Timeout um den `await getPurchasesPlugin()` wrappen, damit ein zukünftiger ähnlicher Hang das UI nicht permanent blockiert | NIEDRIG | ✅ |
| RC Dashboard | Keine Änderung erforderlich, Konfiguration ist korrekt | — | — |
| ASC | Keine Änderung erforderlich (außer: nach Reject sind Subs `DEVELOPER_ACTION_NEEDED` — vor nächstem Submit auf `WAITING_FOR_REVIEW` flippen, wie schon mehrfach geschehen) | NIEDRIG | ✅ REST-API-Check |
| Build-Config | Keine Änderung | — | — |

## Warum ist dieser Bug bisher nie aufgefallen?

1. **Bug ist seit Tag 1 der `getPurchasesPlugin()`-Wrapper-Funktion da.** Diese Funktion wurde geschaffen als Schutz vor "RC-Crash on iPad" (Build 43). Niemand hat verifiziert ob die Returns wirklich beim Caller ankommen.
2. **Symptome maskierten das Problem als andere Probleme**:
   - Build 43: „iPad-Crash" → Fix: Lazy-Init statt Eager-Init. Tatsächlich war der Crash vermutlich der gleiche Thenable-Trap, aber die Schlussfolgerung war falsch.
   - Build 51-53: „preparing subscription hangt" → Fix: getOfferings-Timeout. Tatsächlich kam getOfferings nie zum Aufruf.
   - Build 54: „failed to load subscriptions" → Fix: Produkt-IDs case-sensitive. Hätte sein können, war es aber NICHT (Hauptursache war der hängende Init).
   - Build 55/56: „in-app purchases only on iOS app" → Fix: Toast-Text. Symptom-Fix.
   - Build 57/58: „Closure-stale-state, Configure-Timeout" → Fix: live-ref + 15s Timeout + Telemetry. Symptom-Fixes.
3. **Manuelle Simulator-Tests "bestanden"**, weil:
   - Die Paywall RENDERTE (mit hartkodierten Fallback-Preisen — sieht wie RC-geladene Preise aus)
   - Der Tester hat den StoreKit-Sheet möglicherweise via direktem `purchaseStoreProduct`-Fallback ausgelöst, der separat funktionieren könnte (auch das müsste verifiziert werden)
   - Das RC-Dashboard wurde nie nach dem Test inspiziert auf neue Customers
4. **Die Telemetry, die in Build 58 eingebaut wurde, kann den eigenen Fehler nicht melden**: weil `setAttributes` erst NACH `configure` aufgerufen wird, und configure nie läuft.

## Empfohlene nächste Aktion

### Vorschlag (warte auf User-GO)

1. **DIAG-Patches reverten**, sauberen Stand wiederherstellen.
2. **Den Fix-Patch sauber implementieren** in `src/hooks/useRevenueCat.ts` (nur die `getPurchasesPlugin`-Funktion + Caller-Destructure):
   - Keine anderen Code-Änderungen
   - Build 58's Closure-Fix, Telemetry, etc. bleiben
3. **Build 59 erstellen** + auf Simulator testen + RC-Dashboard inspizieren ob Customer-Record erscheint
4. **Erst nach erfolgreichem Local-Test mit RC-Customer-Confirmation**: Build 59 hochladen, Subs auf WAITING_FOR_REVIEW flippen, in ASC binden, submitten.

### Alternative (vorsichtiger)

1. Nur DIAG-Patches reverten.
2. Briefe den User mit dem Befund.
3. Warte auf explizites GO, was als nächstes passieren soll.

## Was wir AUS DEM SIMULATOR-TEST BEKOMMEN HABEN, das wir bisher nie hatten

| | Vor heute | Heute |
|---|---|---|
| Wissen wir, warum Apple's Reviewer eine Fehlermeldung sieht? | Vermutung (Closure, Timeout, …) | **Beweis**: configure läuft nicht, weil await hängt |
| Können wir es reproduzieren? | Nein | Ja, auf jedem Simulator, jedes Mal |
| Können wir die Reparatur lokal verifizieren? | Nein (RC-Dashboard meldete null) | **Ja**: Wrapper-Fix bringt configure auf RESOLVED |
| Wissen wir, warum bisherige Builds gescheitert sind? | „irgendwas mit RC" | Konkret: jeder Build hatte den Thenable-Trap drin |

Das ist der größte Diagnose-Schritt seit Beginn der Reject-Schleife.
