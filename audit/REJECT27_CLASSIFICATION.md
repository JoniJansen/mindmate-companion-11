# REJECT27_CLASSIFICATION.md — Klassifikation Reject #27 (Build 58)

Datum Erhebung: 2026-05-29
Methodik: RevenueCat Dashboard inspection (read-only, lesend) + lokaler Code-Crosscheck.
Eingangs-Hypothesen (User-Vorgabe): A) Configure failed, B) Offerings empty, C) Purchase Error, D) Keine Telemetrie findbar, E) Cancelled, F) Success.

## Befund

**Szenario D — Keine Telemetrie-Daten findbar.**

Begründung: Es existiert in `bcbc58fb` **kein einziger Customer-Record** — weder vom Reviewer des Build 58 Reviews am 28. Mai 2026, noch von irgendeinem anderen Nutzer in den letzten 90 Tagen. Das schließt A/B/C/E/F als datenbasiert beweisbar aus, weil keine der Build-58-Subscriber-Attributes zur Auswertung verfügbar sind.

## Was das Fehlen jeglicher Customer-Records *impliziert* (nicht beweist)

Mögliche Erklärungen, geordnet nach Wahrscheinlichkeit:

1. **Reviewer hat die App gar nicht gestartet ODER nicht weit genug navigiert um RC zu triggern**: Die Build 58 Instrumentation setzt Attribute erst *innerhalb* von `initializeRevenueCat()` → `Purchases.configure()` → success/catch. Wenn der Reviewer den Demo-Login nicht öffnet (z.B. wenn das initiale Login-Screen-Layout einen Reject ausgelöst hat *bevor* `/upgrade` gesehen wurde), würde RC nichts mitbekommen.
2. **`Purchases.configure()` failt sofort und stillschweigend, vor dem setAttributes-Aufruf**: Das wäre konsistent mit dem hartnäckigen Pattern. Aber dieselbe Code-Pfad-Architektur lief im Simulator (Build 58 manueller Test) und zeigte den StoreKit-Sheet → in der Simulator-Umgebung *funktioniert* es. Eine Differenz zwischen Sim und realem iPad kommt am ehesten von: signiertem vs. unsigniertem Bundle, Sandbox-Account vs. lokaler Sim-Identität, Netzwerk-Erreichbarkeit von api.revenuecat.com.
3. **Falscher RC Public API Key compiled-in**: **Verifiziert: NICHT der Fall.** iOS-Code (`src/hooks/useRevenueCat.ts:7`) und RC-Dashboard Public Key für MindMate stimmen überein (`appl_VatNsFmCDlJPOPkBGnzmhHyZrYy`).
4. **Sandbox-Customers landen in einem anderen Projekt/Bucket**: Sandbox-Customers in RC werden im selben Projekt geführt, getrennt nur durch ein Flag, nicht durch eine separate Project-ID. Sandbox-Toggle ON im Dashboard → trotzdem 0.
5. **Reviewer-Netzwerk blockiert api.revenuecat.com**: Möglich aber selten — Apple-internes Netzwerk ist eigentlich offen.

## Was nicht ohne Build 59 (oder Live-Reviewer-Interview) entschieden werden kann

- Welcher der 5 Punkte oben tatsächlich vorlag.
- Ob die im manuellen Simulator-Test verifizierte „StoreKit-Sheet erscheint"-Beobachtung repräsentativ für das TestFlight-/Distribution-Build ist (Simulator vs. signiertes Distribution-Bundle können sich verhalten).
- Ob `Purchases.configure()` auf dem Reviewer-iPad jemals zur Ausführung kam.

## Aussagewert für Phone-Call / Resolution-Center-Reply

Hoch. Die Information „wir haben Build-58-Telemetrie eingebaut, aber im RC-Dashboard ist null Reviewer-Datensatz gelandet" ist die wichtigste Faktenaussage, die wir Apple geben können. Die Frage an Apple lautet damit nicht mehr „was ging schief" sondern „kam das App-Backend (RC) überhaupt zum Zug, oder wurde die App vorher schon abgebrochen?". Das ist eine konkrete, beantwortbare Frage.

## Kein Build 59 jetzt

Gemäß User-Anweisung wird kein Code-Fix und kein Build 59 erstellt, bis Apple konkrete Fehlerdetails liefert oder eine andere Datenquelle die Lücke schließt.
