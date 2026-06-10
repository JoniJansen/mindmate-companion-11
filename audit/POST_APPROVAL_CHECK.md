# Soulvay Post-Approval Status — 2026-05-30/31

## Apple-Approval erhalten
- App genehmigt unter Build 59 (Wrapper-Fix)
- Auto-Release nach Approval konfiguriert

## Check 1 — Paid Apps Agreement (Apple Geschäftliches) ✅

| Item | Status | Gültigkeit |
|---|---|---|
| **Vertrag für gebührenpflichtige Apps** (= Paid Apps Agreement) | **Aktiv** | 24.04.2026 – 24.01.2027 |
| Vertrag für kostenlose Apps | Aktiv | 06.04.2026 – 24.01.2027 |
| Bankkonto Jonathan Jansen (5690) | Aktiv | DE, EUR/USD |
| Steuerformular W-8BEN | Aktiv | seit 24.04.2026 |
| Steuerformular U.S. Foreign Status Cert | Aktiv | seit 24.04.2026 |
| Compliance DSA + DAC7 | Beide Aktiv | seit 24.04.2026 |

→ **Erlöse können fließen.** Keine Blocker.

## Check 2 — App Version Release (REST, früher gemacht) ✅

| Feld | Wert |
|---|---|
| **App Version 1.0 State** | **`READY_FOR_SALE`** ✅ (App ist live im App Store) |
| releaseType | `AFTER_APPROVAL` (Auto-Release nach Approval) |
| Bound Build | Build 59 (`8a0ffb87-...`), VALID, APP_STORE_ELIGIBLE |
| ReviewSubmission `ccb6834f-...` | `COMPLETE` |

## Check 3 — Subscriptions (REST, früher gemacht)

| Sub | State | Localization de-DE |
|---|---|---|
| `Soulvay_plus_monthly` | `WAITING_FOR_REVIEW` | `WAITING_FOR_REVIEW` |
| `Soulvay_plus_yearly` | `WAITING_FOR_REVIEW` | `WAITING_FOR_REVIEW` |

Subs sind in der Review-Queue. Blockieren App-Release NICHT. Werden separat approved.

## Check 4 — RevenueCat ✅

### App-Konfiguration MindMate (App Store) — `app82b65f8106`

| Item | Status |
|---|---|
| App Name | MindMate (App Store) |
| Bundle ID | `com.jonathanjansen.mindmate` ✅ matched Code/IPA/ASC |
| In-App Purchase Key (P8) | **`WJ6N4WB72Z.p8` Valid credentials** ✅ |
| Key ID | `WJ6N4WB72Z` |
| Issuer ID | `ed351cd4-cae5-4fcd-92bc-48f0c2a4c286` |
| ASC API Key (zusätzlich, für Produkt-Import) | nicht hochgeladen ⚠️ (optional, blockiert nicht) |
| Apple Server-to-Server Notification URL | `https://api.revenuecat.com/v1/incoming-webhook` (sichtbar in Config) |

### Products

| Product | Identifier | Status | Entitlements |
|---|---|---|---|
| Soulvay Plus Jährlich | `Soulvay_plus_yearly` | ⚠️ "Could not check" (ASC API key fehlt für Status-Poll, blockiert nicht) | 1 |
| Soulvay Plus Monatlich | `Soulvay_plus_monthly` | ⚠️ "Could not check" | 1 |

Beide Produkte registriert + mit Entitlement verknüpft. Status-Anzeige nur kosmetisch (RC kann ohne ASC API key keinen Status-Poll machen — Transaktionen funktionieren trotzdem über den IAP P8 Key).

### Entitlements

| Identifier | Display Name | Products |
|---|---|---|
| **`premium`** | Soulvay Plus | **2 products** ✅ (matched code `PREMIUM_ENTITLEMENT = 'premium'`) |
| MindMate Pro | MindMate Premium | 3 products (legacy, von Anfang Februar) |

### Offerings

| Offering | Display | Packages | Status |
|---|---|---|---|
| **`default`** | The standard set of packages | **3 packages** ✅ | Aktiv (Current Offering) |

### Sandbox Customer Records

| Item | Status |
|---|---|
| Active Trials | 0 |
| Active Subscriptions | 0 |
| MRR | 0 USD |
| Test-Customer aus Schritt 3 (`$RCAnonymousID:21e7e96a...`) | weiterhin im Dashboard sichtbar |

Erwartungsgemäß noch keine Production-Customers — App ist gerade erst live.

## Gesamtempfehlung

**Szenario B (Auto-Release) ist eingetreten.** Die App ist live. Du musst NICHTS tun.

### Optional (nicht zeitkritisch)

1. **App im echten App Store öffnen** auf iPhone/iPad → "Soulvay" suchen → eigene App live sehen
2. **RC ASC API Key hochladen** (verbessert nur die "Status"-Anzeige in RC, blockiert nichts) — Nice-to-have für Build 60 Wartung
3. **Erste Production-Käufe abwarten** — RC dashboard wird "Active Subscriptions" + MRR zeigen, sobald reale User kaufen
4. **Subscription-Approval von Apple abwarten** — typisch innerhalb 24h nach App-Approval

## Was JETZT NICHT passiert
- Keine Release-Klicks (App ist schon live)
- Keine Vertrags-Akzeptanz (alles aktiv)
- Keine Settings-Änderungen
- Keine Builds
- Keine Code-Aktionen

---

# 🎉 Soulvay ist live im App Store.

**Build 59 mit dem Capacitor-Plugin-Thenable-Trap-Fix hat nach 27 Rejections den Durchbruch gebracht.**

Wurzel-Bug:
- `getPurchasesPlugin()` returnte den Capacitor-Plugin-Proxy direkt aus async function
- Promise-Resolution probed `.then` → Capacitor-Proxy fängt `.then`-Call ab + routet als nativen `Purchases.then()`-Method-Call
- iOS hat keinen → Fire-and-forget Rejection
- `await` hängt für immer → `Purchases.configure()` nie aufgerufen
- Folge: alle Purchase-Versuche → Fallback-Toast = Apple-Reject Guideline 2.1(b)

Fix:
```ts
interface PurchasesPluginWrapper { readonly plugin: PurchasesPlugin }
return { plugin: mod.Purchases };
// caller:
const wrapper = await getPurchasesPlugin();
Purchases = wrapper?.plugin ?? null;
```

A/B-Test-bewiesen, deterministisch verifiziert via RC-Customer-Record innerhalb Sekunden nach App-Launch. 35/40 Pre-Submit-Audit-Punkte GRÜN, 2 GELB bewusst akzeptiert (Privacy Manifest, englische Sub-Localizations — vorgemerkt für Build 60).
