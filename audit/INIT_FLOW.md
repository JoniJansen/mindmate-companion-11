# INIT_FLOW.md — RevenueCat Init-Pfad lückenlos rekonstruiert

## Trigger-Kette

```
Apple-Reviewer öffnet App
   ↓
App.tsx mountet
   ↓
<SubscriptionRestoreInitializer/> rendert  (return null, KEINE Init!)
   ↓ (siehe Kommentar in App.tsx:113-122)
   "RevenueCat is no longer auto-initialized at app launch (caused
    crashes on some iPad devices, e.g. iPad Air M3 / Build 43 rejection).
    RevenueCat now lazy-initializes only when the user opens /upgrade
    or explicitly calls restorePurchases."
   ↓
Reviewer tippt „Review / Demo Login"
   ↓
Demo-Mode wird gesetzt, Route → / (Home / Onboarding)
   ↓
Reviewer navigiert zu /upgrade  (vielleicht direkt von Home, oder via Side-Menu)
   ↓
src/pages/Upgrade.tsx useEffect Zeile 69-75:
   if (isIOSApp() && !isRevenueCatAvailable && !isRevenueCatUnavailable) {
     initializeRevenueCat().catch(...)
   }
   ↓
src/hooks/usePremium.ts forwardet → useRevenueCat.initializeIfNeeded()
   ↓
src/hooks/useRevenueCat.ts:321 initializeIfNeeded()
   - hasInitializedRef.current Guard
   - initInFlightRef.current Guard
   ↓
   getPurchasesPlugin()  (Zeile 218-227)
     - isCapacitorIOS() check: window.Capacitor.getPlatform() === 'ios'
     - Dynamic await import('@revenuecat/purchases-capacitor')
     ↓ (wenn !iOS oder import fehlschlägt → setIsUnavailable(true), return)
   ↓
   Promise.race([
     Purchases.configure({ apiKey: 'appl_VatNsFmCDlJPOPkBGnzmhHyZrYy' }),
     setTimeout(15000)
   ])
   ↓ (wenn race fail → catch-Block, setIsUnavailable(true), kein setAttributes-Call)
   ↓
   purchasesRef.current = Purchases
   setIsAvailable(true)
   console.log('[RevenueCat] configured in Xms')
   ↓
   Purchases.setAttributes({rc_configure_success, rc_configure_error, rc_configure_duration_ms})
     .catch(()=>{ /* swallowed */ })          ← FIRE-AND-FORGET, kein Beweis dass es ankam
   ↓
   supabase.auth.getUser() → if (user) await Purchases.logIn({appUserID: user.id})
     ← KRITISCH: Im Demo-Login-Pfad gibt es KEINEN user (auth bleibt anonym),
       also wird logIn NICHT aufgerufen. App_user_id bleibt der von RC SDK
       generierte anonyme `$RCAnonymousID:xxxx`.
   ↓
   Promise.race([
     Purchases.getOfferings(),
     setTimeout(8000)
   ])
   - if (resolves with packages) → setOfferings(current)
   - if (empty/null/timeout) → setOfferingsTimedOut(true)
   ↓
   Purchases.setAttributes({rc_offerings_loaded, rc_offerings_package_count})
     .catch(()=>{ /* swallowed */ })
   ↓
   checkEntitlements() / Purchases.getCustomerInfo() — best effort
```

## Conditions die Abbruch erzwingen können

| Position | Condition | Wenn true → |
|---|---|---|
| `isCapacitorIOS()` | window.Capacitor.getPlatform() !== 'ios' | return null, no init |
| `getPurchasesPlugin` try/catch | import wirft | setIsUnavailable, kein Network-Call |
| `Purchases.configure` inner try/catch | configure resolves > 15s ODER throws | setIsUnavailable, KEINE setAttributes, KEIN Network-Footprint sichtbar im RC-Dashboard |
| `Purchases.logIn` | kein authenticated user (z.B. Demo-Login) | überspringt logIn → app_user_id bleibt anonym |

## Schlussfolgerungen

1. **`Purchases.configure()` wird im Production-Code via `npm run build` zu einem Capacitor-Bridge-Call.** Der eigentliche Native-Call läuft in Swift (`PurchasesPlugin.swift`).

2. **Wenn `configure()` SCHEITERT, gibt es keinen einzigen RC-Backend-Call.** Das bedeutet: kein Customer-Record im Dashboard. Dies ist mit der RC-Beobachtung (0 Customers in 90 Tagen) **vollständig konsistent**.

3. **`setAttributes` ist fire-and-forget.** Selbst bei Success ist das catch silent. Wenn der Network-Call zu api.revenuecat.com fehlschlägt, würden wir es nicht erfahren.

4. **`logIn` wird im Demo-Pfad NICHT aufgerufen.** Apple-Reviewer nutzen den Demo-Login → app_user_id bleibt anonym mit Prefix `$RCAnonymousID:`. Im RC-Dashboard wäre der Reviewer als anonymer Customer mit dieser ID zu finden — aber sie ist nicht in den Listen.

5. **Lazy-Init bedeutet**: Wenn der Reviewer NIE /upgrade öffnet (z.B. weil er an Login oder Consent scheitert), wird configure() NIE aufgerufen. Aber die Reject-Notiz „we noticed an error when we tried to complete an In App Purchase" impliziert, dass der Reviewer den Purchase-Flow erreichte — also irgendwo bricht es zwischen /upgrade-Mount und purchasePackage ab.
