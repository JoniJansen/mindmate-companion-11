# STOREKIT_MANUAL_TEST_STEPS.md — Manuelle Anleitung für Schritt 4 (Option A)

**Geschätzte Zeit**: 5 Minuten
**Ergebnis**: Screenshots des nativen StoreKit-Sheets + paralleler Log-Mitschnitt

---

## Pre-Check (bereits erledigt von Claude Code) ✅

- Auto-Navigate-Patches **aktiv** (RootRedirect → /upgrade, isDemoMode = true) → du landest direkt auf der Paywall
- `ios/App/Soulvay.storekit` existiert (Monatlich 4,99 € / Jährlich 39,99 €)
- `ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` existiert mit `StoreKitConfigurationFileReference`
- iPad Air 11-inch (M3) Simulator (UDID `446901CF-AD9F-41A8-BE79-81F4F344E234`) ist gebootet

---

## SCHRITT 1 — Terminal 1: Log-Stream starten (BEVOR Xcode-Run)

Kopiere und paste in ein **neues Terminal-Fenster**:

```bash
LOG_FILE="/tmp/storekit_manual_$(date +%s).log"
echo "Logging to: $LOG_FILE"
xcrun simctl spawn 446901CF-AD9F-41A8-BE79-81F4F344E234 log stream \
  --level=debug \
  --predicate '
    process == "App" OR
    subsystem CONTAINS[c] "revenuecat" OR
    subsystem CONTAINS[c] "Purchases" OR
    subsystem CONTAINS[c] "StoreKit" OR
    eventMessage CONTAINS[c] "purchasePackage" OR
    eventMessage CONTAINS[c] "SKProduct" OR
    eventMessage CONTAINS[c] "purchase_attempt"
  ' | tee "$LOG_FILE"
```

Lass das Terminal-Fenster offen und laufen — Logs streamen live durch.

**Notiere den `$LOG_FILE`-Pfad** (z.B. `/tmp/storekit_manual_1780155123.log`), den brauche ich später.

---

## SCHRITT 2 — Xcode öffnen

In einem anderen Terminal oder im Finder:

```bash
open ~/soulvay/ios/App/App.xcodeproj
```

Xcode startet und lädt das Projekt (ein paar Sekunden warten).

---

## SCHRITT 3 — StoreKit Configuration auswählen

In Xcode:

1. Menü: **Product → Scheme → Edit Scheme…** (oder Shortcut `⌘ <`)
2. Linke Seite: **Run** auswählen
3. Tab oben: **Options**
4. Section **StoreKit Configuration** → Dropdown öffnen
5. Wähle **`Soulvay.storekit`** (sollte erscheinen, weil ich die Datei + Scheme-Reference angelegt habe)
6. **Close** (unten rechts)

> **Wenn `Soulvay.storekit` nicht im Dropdown erscheint**: STOP. Sag mir Bescheid. Dann muss die Datei manuell hinzugefügt werden via File → Add Files to "App"…

---

## SCHRITT 4 — Destination + Run

1. Toolbar oben: **Destination** Dropdown → **iPad Air (M3) (iOS 26.2)** auswählen
   (sollte vorhanden sein, weil Simulator schon booted ist)
2. **⌘ R** drücken (oder Play-Button)
3. Xcode baut + launcht die App im Simulator

Erste Builds dauern ~30 s; danach ein paar Sekunden.

---

## SCHRITT 5 — Verifikation: Preise auf der Paywall

Nach App-Mount (~3-5 s):

- Du landest automatisch auf der **Soulvay Plus** Paywall (dank der Auto-Navigate-Patches)
- **PRÜFE DIE PREISE**:

| Erwartet (StoreKit-Config aktiv) | Falls Fallback (Config NICHT aktiv) |
|---|---|
| Monatlich: **4,99 €/Monat** | Monatlich: 9,99 €/Monat |
| Jährlich: **39,99 €/Jahr** | Jährlich: 79,00 €/Jahr |

> **Wenn die Preise NICHT 4,99/39,99 sind**: STOPP. Screenshot + Pfad an mich. Die StoreKit-Config wurde nicht aktiviert; entweder Scheme-Setting falsch oder Xcode hat sie nicht geladen.

---

## SCHRITT 6 — "Abo starten" tappen (kein Confirm!)

Wenn die Preise korrekt sind (4,99/39,99):

1. Stelle sicher dass **Monatlich** (linke Kachel) ausgewählt ist (oder Jährlich, beide testen wir später ggf.)
2. **Terms- und Withdrawal-Checkboxen** unten auf der Paywall: beide aktivieren (falls vorhanden)
3. **"Abo starten"** Button tappen

**Erwartet**: Natives StoreKit-Sheet slidet von unten ein mit:
- **"[Environment: Xcode]"-Banner** am oberen Rand (proof: Local StoreKit aktiv)
- **Subscription-Name** ("Soulvay Plus Monatlich")
- **Preis** ("4,99 €/Monat")
- **"Subscribe"** / **"Bestätigen"** Button (groß, unten)
- **"Cancel"** Button (oben links oder neben Subscribe)

---

## SCHRITT 7 — Screenshot machen

Im Simulator: **⌘ S** (oder Menü Simulator → File → Save Screen)
- Speichern als: `~/soulvay/audit/STOREKIT_SHEET_VISIBLE_MONTHLY.png`

Optional für Yearly:
- **Cancel** tappen → zurück zur Paywall
- **Jährlich**-Kachel auswählen
- "Abo starten" → neuer Sheet erscheint
- **⌘ S** → speichern als `~/soulvay/audit/STOREKIT_SHEET_VISIBLE_YEARLY.png`

---

## SCHRITT 8 — Aufräumen

1. Im Simulator-Sheet: **Cancel** tappen (KEIN Confirm!)
2. In Xcode: **⌘ .** (Stop-Button) — App wird gestoppt
3. Im Terminal 1 (Log-Stream): **Ctrl+C** — Log-Stream stoppen

---

## SCHRITT 9 — Mir die Daten geben

Schicke mir bitte:

1. **Log-Datei-Pfad**: `/tmp/storekit_manual_XXXXXXX.log` (aus Terminal 1)
2. **Screenshot-Pfad(e)**:
   - `~/soulvay/audit/STOREKIT_SHEET_VISIBLE_MONTHLY.png`
   - (optional) `~/soulvay/audit/STOREKIT_SHEET_VISIBLE_YEARLY.png`
3. **Beobachtung**: hat das Sheet "[Environment: Xcode]"-Banner gezeigt? Welcher Preis stand drauf?

Dann führe ich Verif 4A (Screenshot-Analyse) + Verif 4B (Log-Analyse) durch.

---

## Stop-Bedingungen (wenn etwas schiefgeht)

| Symptom | Aktion |
|---|---|
| Preise auf Paywall sind 9,99/79,00 (Fallback) statt 4,99/39,99 | STOPP nach Schritt 5, melden — StoreKit-Config-Setting im Scheme prüfen |
| Statt Sheet erscheint roter Toast "Käufe gerade nicht verfügbar" | STOPP, Toast-Wortlaut + erste 50 Zeilen aus Log nach "Abo starten"-Tap melden |
| Xcode meckert beim Build über fehlende File-Reference | STOPP, Fehlertext melden |
| Soulvay.storekit nicht im Dropdown | STOPP, im Dropdown checken ob "Choose File…" Option da ist → manuell `ios/App/Soulvay.storekit` auswählen |

---

## Was Claude Code als nächstes (nach deinem Return) tut

- Verif 4A: Screenshot inspizieren ([Environment: Xcode]-Banner, Preis, Buttons)
- Verif 4B: Log mit folgenden greps analysieren:
  - `purchasePackage` / `purchaseStoreProduct` Aufrufe
  - `SKProductsRequest` / `SKPayment` Bridge-Activity
  - `purchase_attempt` Telemetrie aus Build 58
  - Errors (muss leer sein)
  - StoreKit-Config-Aktiv-Marker (`Test transactions`, `Soulvay.storekit`, etc.)
- Doku in `audit/STOREKIT_SHEET_RESULT.md`
