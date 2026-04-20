# Apple Review Fix — Build 13 (20. April 2026)

Behebung der drei Beanstandungen aus Apples Review vom **11. April 2026** (Submission ID `94047bc0-d2a4-4751-9ee4-18d8838a5413`).

| # | Apple-Guideline | Befund | Status |
|---|-----------------|--------|--------|
| 1 | 2.1(a) App Completeness | „Sign in with Apple" zeigt Fehlermeldung | ✅ Code-Fix drin, Xcode-Capability muss User setzen |
| 2 | 3.1.1 In-App Purchase | Abos liefen über Stripe statt IAP | ✅ Code-Fix drin, App Store Connect muss User prüfen |
| 3 | 3.1.2(c) EULA-Link | Terms of Use fehlen in App-Beschreibung | ⏳ App Store Connect Metadaten — User-Action |

---

## Root Cause — warum alle drei Probleme auftraten

1. **Sign in with Apple** lief über `lovable.auth.signInWithOAuth("apple")`, einen Web-OAuth-Redirect. In einer Capacitor-iOS-App ist `window.location.origin` aber `capacitor://localhost`, und diese URL steht nicht auf Apples Redirect-Whitelist → Fehler. Zusätzlich fehlte das `com.apple.developer.applesignin`-Entitlement komplett im Xcode-Projekt.

2. **Stripe-Fallback auf iOS**: `src/pages/Upgrade.tsx` fiel bei jedem Problem mit RevenueCat auf Stripe Checkout zurück (z. B. wenn die IAP-Produkt-IDs nicht matchten oder RevenueCat noch nicht initialisiert war). Auf iOS hat der Reviewer exakt das gesehen.

3. **EULA-Link** fehlte in der App-Beschreibung (Metadaten in App Store Connect).

---

## Was sich im Code geändert hat

### `src/pages/Upgrade.tsx`

- **Harte iOS-Trennung**: Wenn `isIOSApp()` → niemals Stripe. Ist RevenueCat nicht verfügbar oder fehlen Offerings, wird eine klare Fehlermeldung gezeigt, aber kein Stripe-Checkout geöffnet.
- `isIOSApp()` statt `isRevenueCatAvailable` steuert jetzt die Anzeige der Apple-EULA- und Apple-Zahlungs-Hinweise — auch wenn RevenueCat noch lädt, sieht der Reviewer alle Apple-Pflichtangaben.
- Neuer Import: `findPackageForPlan` statt manueller Offerings-Suche.

### `src/hooks/useRevenueCat.ts`

- `LEGACY_REVENUECAT_PRODUCTS` hinzugefügt (`mindmate_plus_*`) — Code ist jetzt tolerant gegenüber beiden Produkt-ID-Konventionen.
- Neue Funktion `findPackageForPlan(offerings, plan)`: tolerantes Matching nach Package-Identifier (`monthly`, `$rc_monthly`, `annual`, …), Produkt-ID (current + legacy), Substring, Last-Resort-Einzelpaket.

### `src/lib/appleSignIn.ts` (neu)

- Native Apple-Sign-In-Wrapper über `@capacitor-community/apple-sign-in`.
- Generiert eine Raw-Nonce, hasht sie mit SHA-256 (Apple erwartet den Hash), übergibt die Raw-Nonce an Supabase zur Verifikation.
- Ruft `supabase.auth.signInWithIdToken({ provider: "apple", token, nonce })` — der native Flow, den Apple erwartet.
- User-Cancel → wirft keinen Fehler, gibt `false` zurück.

### `src/pages/Auth.tsx`

- Apple-Button prüft jetzt `isNativeIOS()`: auf iOS → `signInWithAppleNative()`, auf Web → weiterhin Lovable-OAuth.
- Fehler-Toasts werden in beiden Pfaden sauber gezeigt.

### `ios/App/App/App.entitlements` (neu)

```xml
<dict>
  <key>com.apple.developer.applesignin</key>
  <array><string>Default</string></array>
</dict>
```

### `ios/App/App.xcodeproj/project.pbxproj`

- `CODE_SIGN_ENTITLEMENTS = App/App.entitlements;` in beiden Build-Configs (Debug + Release) der App-Target.

### `package.json`

- `@capacitor-community/apple-sign-in: ^7.0.0` als Dependency ergänzt.

---

## Was DU noch tun musst (in dieser Reihenfolge)

### Schritt 1 — Dependencies installieren (Terminal, 1 Minute)

```bash
cd ~/soulvay
npm install
npx cap sync ios
```

`npx cap sync ios` verlinkt das native Apple-Sign-In-Plugin ins Xcode-Projekt.

### Schritt 2 — Apple Developer Portal (developer.apple.com, 3 Minuten)

1. **Certificates, Identifiers & Profiles** → **Identifiers** → klick auf `com.jonathanjansen.mindmate`.
2. Scrolle zu Capabilities → Häkchen bei **„Sign In with Apple"** setzen.
3. **Save**. Provisioning Profiles werden automatisch neu generiert.

### Schritt 3 — Supabase Apple Provider (falls noch nicht gemacht, 5 Minuten)

Authentication → Providers → **Apple** aktivieren. Brauchst dafür:
- **Services ID**: in Apple Developer Portal → Identifiers → + → Services IDs. Z. B. `com.jonathanjansen.soulvay.auth`.
- **Team ID**: oben rechts im Developer Portal (10-stellig, deiner ist `N8CCLYYYSL`).
- **Key ID**: Keys → + → Key mit „Sign In with Apple"-Berechtigung anlegen → `.p8`-Datei downloaden.
- **Private Key**: Inhalt der `.p8`-Datei.

Der **Native ID-Token-Flow** (den wir eingebaut haben) braucht *keine* Redirect-URL — Supabase verifiziert das Identity Token direkt mit Apples Public Keys.

### Schritt 4 — Xcode (2 Minuten)

```bash
npx cap open ios
```

1. Projekt-Navigator → **App** Target → Reiter **Signing & Capabilities**.
2. Prüfen, ob **Sign In with Apple** als Capability aufgelistet ist. Falls nicht: **+ Capability** → „Sign In with Apple" hinzufügen. (Xcode merged das mit unserer `App.entitlements`.)
3. **Build Number** auf **42** hochsetzen (aktuell 41).
4. **Product → Archive → Distribute App → App Store Connect**.

### Schritt 5 — App Store Connect Metadaten (5 Minuten)

**5a. Terms of Use / EULA (Guideline 3.1.2c):**
- **My Apps → Soulvay → App Information → License Agreement**
- Klick auf **Edit** neben „License Agreement"
- Wähle **„Use Apple's Standard EULA"** → Save
- *Alternativ*: in der App-Beschreibung ganz unten diese Zeile einfügen:

```
Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
```

**5b. IAP-Produkte prüfen (Guideline 3.1.1):**
- **My Apps → Soulvay → In-App Purchases / Subscriptions**
- Notiere die **exakten Product-IDs** und schick sie mir:
  - Monats-Abo: `________________________` (sollte `soulvay_plus_monthly` oder `mindmate_plus_monthly` sein)
  - Jahres-Abo: `________________________`
- Status muss **„Ready to Submit"** sein (nicht „Missing Metadata").
- Im neuen Build (42) müssen die Produkte **ausgewählt** und mit dem Build verknüpft sein.

**5c. Apple-Review-Antwort vorbereiten:**
Beim erneuten Einreichen unter **App Review Information → Notes** diesen Text einfügen:

```
Changes in Build 42 (Resubmission for Submission ID 94047bc0-d2a4-4751-9ee4-18d8838a5413):

1. Guideline 2.1(a) - Sign in with Apple bug resolved:
   The app now uses the native ASAuthorizationAppleIDProvider via the Capacitor plugin
   @capacitor-community/apple-sign-in. The previous web-OAuth redirect flow has been
   removed from the iOS build. The "Sign In with Apple" capability is now enabled and
   the com.apple.developer.applesignin entitlement is present.

2. Guideline 3.1.1 - In-App Purchase enforced on iOS:
   All subscription purchases on iOS now go exclusively through Apple In-App Purchase
   via RevenueCat / StoreKit. The Stripe fallback has been removed from the iOS code
   path at src/pages/Upgrade.tsx (hard guard on isIOSApp()).

3. Guideline 3.1.2(c) - EULA link added:
   Apple's Standard EULA is now linked in the App Information section and is also
   shown inline on the Upgrade screen inside the app.

Demo account:
Email: review@soulvay.com
Password: SoulvayReview2025!

A "Review / Demo Login" button is available on the login screen.
```

### Schritt 6 — Testing vor Submission

Auf einem iPad (oder Simulator mit iPadOS 26.4):
1. App komplett deinstallieren.
2. Neuen Build installieren.
3. **Sign in with Apple** antippen → natives Sheet erscheint → durchlaufen → User wird eingeloggt.
4. Upgrade-Screen öffnen → **Apple-EULA-Link sichtbar**, **Apple-Zahlungstext sichtbar**.
5. „Jetzt starten" → **Apples Purchase-Sheet** erscheint (nicht Stripe-Checkout!).
6. Mit Sandbox-Account kaufen → Plus aktiviert.
7. Kurzes Screen-Recording machen (beide Flows) — das braucht Apple in Schritt 5c.

---

## Offene Punkte / Cleanup (NACH Review-Approval)

- **Bundle-ID-Mismatch**: `capacitor.config.ts` sagt `com.jonathanjansen.soulvay`, Xcode-Projekt sagt `com.jonathanjansen.mindmate`. Nicht akut problematisch (Xcode ist die Source of Truth), aber verwirrend. Entweder Xcode auf `soulvay` umziehen (neue App in App Store Connect) oder `capacitor.config.ts` an `mindmate` anpassen.
- **Product-IDs**: Code und Docs entscheiden für einen einheitlichen Präfix (`soulvay_plus_*` oder `mindmate_plus_*`) und `LEGACY_REVENUECAT_PRODUCTS` danach entfernen.
- **Alte Rejection-Docs** (`apple-rejection-fixes-build8..12.md`) archivieren oder löschen.

---

## Verification Checklist (vor Submit abhaken)

- [ ] `npm install` lief durch, keine Fehler
- [ ] `npx cap sync ios` lief durch, Plugin ist verlinkt
- [ ] Sign In with Apple Capability im Apple Developer Portal aktiviert
- [ ] Supabase Apple Provider konfiguriert und getestet
- [ ] In Xcode Build Number auf 42 erhöht
- [ ] Archive erfolgreich, Upload zu App Store Connect erfolgreich
- [ ] App Information → License Agreement auf „Use Apple's Standard EULA" gesetzt
- [ ] IAP-Produkte in „Ready to Submit", an Build 42 gebunden
- [ ] Review Notes eingefügt (Text aus Schritt 5c)
- [ ] Auf iPad Air (iPadOS 26.4) erfolgreich Sign-in + Purchase durchlaufen
- [ ] Screen-Recording für Apple vorbereitet
- [ ] Submit for Review
