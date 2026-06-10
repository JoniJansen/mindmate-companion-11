# RC_TELEMETRY_BUILD58.md — RevenueCat Dashboard Befund

Erhebung: 2026-05-29 (Tag nach Reject #27)
Projekt: Soulvay (`bcbc58fb`)
App: MindMate (App Store) (`app82b65f8106`)
Bundle ID: `com.jonathanjansen.mindmate`
Public SDK API Key in RC: `appl_VatNsFmCDlJPOPkBGnzmhHyZrYy`
Public SDK API Key im iOS Code (`src/hooks/useRevenueCat.ts:7`): `appl_VatNsFmCDlJPOPkBGnzmhHyZrYy` ✅ MATCH

## Suchstrategie

Die Anweisung war, den Reviewer-Account zu finden und seine Subscriber-Attributes (`build_number`, `rc_configure_success`, `purchase_last_outcome` etc.) auszulesen.

Versuchte Filter:
| Filter | Sandbox Toggle | Ergebnis |
|---|---|---|
| Customers → Active subscription (Status filter) | OFF | 0 Customers |
| Customers → Active subscription (Status filter) | ON  | 0 Customers |
| Customers → Sandbox (Made Sandbox Purchase = True) | OFF | 0 Customers, "No Customers to show" |
| Customers → Sandbox (Made Sandbox Purchase = True) | ON  | 0 Customers, "No Customers to show" |
| Filter „Last Seen Date Later than 3 days ago" | ON  | wurde nicht angewendet (Filter-Dropdown ließ keine custom subscriber-attribute filtern; `build` / `sandbox` als Filterfeld → „No options") |
| Analytics → Charts → New Customers (Last 90 days, Line) | sandbox toggle nicht in Chart-View verfügbar | flacher Wert 0 von 2026-03-01 bis 2026-05-29 |

## Reviewer-Subscriber gefunden?

**Nein.** Es existiert **kein einziger Customer-Datensatz** in diesem RC-Projekt — weder im Production- noch im Sandbox-Bereich, weder mit Subscription noch ohne, weder in den letzten 48h noch in den letzten 90 Tagen.

## Konsequenz für die Reviewer-Attribute-Tabelle

Da kein Customer existiert, kann keines der in `useRevenueCat.ts` gesetzten Build-58-Attribute ausgelesen werden:

| Attribute | Wert | Bedeutung |
|---|---|---|
| `build_number` | **nicht erhebbar** | kein Customer-Record vorhanden |
| `platform_detected` | **nicht erhebbar** | dito |
| `is_native` | **nicht erhebbar** | dito |
| `ua_snippet` | **nicht erhebbar** | dito |
| `rc_configure_success` | **nicht erhebbar** | dito |
| `rc_configure_error` | **nicht erhebbar** | dito |
| `rc_configure_duration_ms` | **nicht erhebbar** | dito |
| `rc_offerings_loaded` | **nicht erhebbar** | dito |
| `rc_offerings_package_count` | **nicht erhebbar** | dito |
| `purchase_attempt_at` | **nicht erhebbar** | dito |
| `purchase_attempt_plan` | **nicht erhebbar** | dito |
| `purchase_attempt_path` | **nicht erhebbar** | dito |
| `purchase_last_outcome` | **nicht erhebbar** | dito |
| `purchase_last_error` | **nicht erhebbar** | dito |

## Weitere RC-Dashboard-Beobachtungen

1. **Banner**: „Your email address is not yet confirmed. Please click the link in the confirmation email."
   - Möglicher Hinweis auf Account-Hygiene-Risiko (nicht zwingend bzgl. Apple-Reject relevant).
2. **Onboarding-Widget**: „Let's get you ready to start using RevenueCat. (2 of 6)" → SDK-Integration-Schritt ist noch nicht als „done" markiert, obwohl der Public API Key korrekt im iOS-Code steckt. Das ist UI-Status, nicht zwingend funktionale Aussage.
3. **App Store Connect API Key in RC**: **nicht hochgeladen** (P8 key file, Required) — RC kann keine Produkte aus ASC importieren, keine historische Preisaktualisierung. Dies ist *nicht* die SDK-Konfiguration, sondern eine zusätzliche Integration (für Server-Funktionen, nicht für Käufe an sich).
4. **In-App Purchase Key in RC**: hochgeladen (`WJ6N4WB72Z.p8`, Issuer `ed351cd4-cae5-4fcd-92bc-48f0c2a4c286`) → „Valid credentials" ✅ — der StoreKit-2-Pfad ist korrekt eingerichtet.
5. **Apple Server-to-Server Notification URL** in RC Dashboard verfügbar (`https://api.revenuecat.com/v1/incoming-webhook…`), aber nicht überprüft, ob in ASC eingetragen.
6. Active Trials, Active Subscriptions, MRR, Revenue, New Customers über die letzten 90 Tage: **alle 0** (sowohl Production als auch Sandbox).
