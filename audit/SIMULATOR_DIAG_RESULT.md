# SIMULATOR_DIAG_RESULT.md — Phase-3 Live-Test Befunde

Datum: 2026-05-30
Gerät: iPad Air 11" (M3) Simulator, iPadOS 26.2, UDID `446901CF-AD9F-41A8-BE79-81F4F344E234`
Build: Lokaler Debug-Build aus `useRevenueCat.ts` mit `[RC-DIAG-*]`-Markern + DOM-Overlay (nicht committed)

## Test-Setup

- AuthContext-Patch: `isDemoMode` initial = `true` → OnboardingGuard erlaubt /upgrade ohne Klick
- App.tsx-Patch: `RootRedirect` redirected immer zu /upgrade
- useRevenueCat-Patch: Console-Monkey-Patch + DOM-Overlay rendert jede `[RC-DIAG-*]`-Zeile in fixed-position Div am Bildschirm, sichtbar in Screenshots
- Window-Error- und Unhandled-Rejection-Handler erfassen alle JS-Errors

## Run 1-5: Marker-Kette gestoppt bei `[RC-DIAG-B6]`

Beobachtung über mehrere Runs: Die Marker `[A]`, `[ROOT]`, `[B]`, `[BEFORE-AWAIT]`, `[B1]`, `[B3]`, `[B4]`, `[B6]` feuern, aber **`[AFTER-AWAIT]`, `[C]`, `[OK]`, `[Clog]`, `[D]`, `[E]`, `[G]` feuern NIE**. Der Code hängt zwischen B6 (innerhalb `getPurchasesPlugin`) und der Wiederaufnahme des `await` in `initializeIfNeeded`.

## Run 6: Unhandled-Rejection-Capture liefert die Antwort

Window-Handler erfasste:

```
[UNH-REJ] "Purchases.then()" is not implemented on ios
```

### Erklärung dieser Fehlermeldung

`@revenuecat/purchases-capacitor` exportiert `Purchases` als **Capacitor-Plugin-Proxy** (`registerPlugin('Purchases', ...)`). Dieser Proxy fängt JEDE Property-Lookup ab und routet sie als nativen Method-Call über die Capacitor-Bridge weiter.

Ablauf des Hangs:

1. `getPurchasesPlugin()` ist eine `async`-Funktion.
2. Innerhalb: `await import(...)` → `mod`; `return mod.Purchases` (= der Proxy).
3. JavaScript wrapped den Return-Value mit `Promise.resolve(proxy)`.
4. `Promise.resolve` ruft die interne Thenable-Detection auf: `proxy.then(resolveCb, rejectCb)`.
5. Der Proxy fängt den `.then`-Zugriff ab und versucht, eine native Method `Purchases.then()` aufzurufen.
6. Auf iOS existiert diese Method nicht → Capacitor-Bridge rejected mit der obigen Fehlermeldung.
7. Die Rejection landet NICHT in den Resolve/Reject-Callbacks der Thenable-Detection (Capacitor verwendet Fire-and-forget), sondern als **unhandled rejection** im Window.
8. Die Promise von `getPurchasesPlugin()` bleibt **forever PENDING** → das `await` im Caller (initializeIfNeeded) wiederum **hängt für immer**.

### Konsequenzen

- `Purchases.configure()` wird **nie aufgerufen**.
- `Purchases.setLogLevel`, `Purchases.logIn`, `Purchases.getOfferings`, `Purchases.purchasePackage` werden **nie aufgerufen**.
- Kein einziger Network-Call zu api.revenuecat.com.
- Kein Subscriber-Record entsteht.
- `purchasesRef.current` bleibt `null`.
- Wenn der User „Abo starten" tippt → fällt in den `[RC-FAIL]`-Fallback-Toast.
- Reviewer-iPad zeigt „we noticed an error when we tried to complete an In App Purchase" exakt wegen dieser Kette.

## Run 7: A/B-Test mit Wrapper-Fix bestätigt Diagnose

Hypothese: Den Proxy in ein nicht-thenable-Objekt wrappen.

Patch:
```ts
// Vorher:
return mod.Purchases;
// Nachher:
return { plugin: mod.Purchases };
// Caller:
const wrapped = await getPurchasesPlugin();
const Purchases = wrapped?.plugin ?? null;
```

Ergebnis (vollständige Marker-Kette feuert):

```
[A] useRevenueCat module loaded
[RC-DIAG-ROOT] forcing redirect to /upgrade
[RC-DIAG-B] initializeIfNeeded called {isNative:true, platform:'ios', ...}
[BEFORE-AWAIT] about to await getPurchasesPlugin
[RC-DIAG-B1] getPurchasesPlugin entered
[RC-DIAG-B3] about to dynamic import
[RC-DIAG-B4] dynamic import resolved {keys:[...,"Purchases",...]}
[RC-DIAG-B6] mod.Purchases accessed {type:'object', hasConfigure:true}
[AFTER-AWAIT] await returned {purchasesType:'object', isNull:false, hasConfigure:true}  ← FEUERT!
[RC-DIAG-C] getPurchasesPlugin resolved ...
[RC-DIAG-OK] Purchases valid, proceeding to configure
[RC-DIAG-Clog] about to setLogLevel VERBOSE
[RC-DIAG-Clog] setLogLevel resolved          ← NATIVE BRIDGE CALL ERFOLGREICH!
[RC-DIAG-D] about to configure {apiKeyPrefix:'appl_VatNsFm', apiKeyLength:32, timeoutMs:15000}
[RC-DIAG-E] configure RESOLVED {configureDurationMs:0}  ← CONFIGURE WORKS!
[RC-DIAG-G] getOfferings result {loaded:false, allKeys:null, currentExists:false, packageCount:0}
```

✅ **Bewiesen**: Der Wrapper-Fix repariert den fundamentalen Init-Block. Configure läuft jetzt durch. Offerings sind zwar empty im Simulator (kein Sandbox-Account angemeldet), aber das ist erwartet — auf Apples Reviewer-iPad mit Sandbox-Account würden die Packages zurückkommen.

## Reicht das?

Ja. Die Diagnose ist **eindeutig**, mit A/B-Test verifiziert. Apples Reviewer-iPad lief seit Build 41 in genau diesen Hang. Alle bisherigen Fixes (Timeout, Closure, Toast-Text, etc.) zielten auf Symptome — die Wurzel ist diese Thenable-Trap.

## Wichtige Nebenbeobachtung

`getOfferings` resolved im Simulator mit `loaded:false`. Auf einem realen iPad mit Sandbox-Account würden Packages erwartet (die Subs sind in ASC vorhanden, `WAITING_FOR_REVIEW` beim Reviewer-Zeitpunkt). Falls das auf realer Hardware AUCH `loaded:false` liefert, hätten wir ein ZWEITES Problem (z.B. RC Offerings-Konfiguration). Aber das ist erst nach Fix #1 testbar.
