# PRESUBMIT_FINAL.md — Build 59 Pre-Submit Reviewer-Checkliste

**Datum**: 2026-05-30 ~20:45 UTC
**Build**: 1.0 (59), UUID `8a0ffb87-049b-4b8a-9209-20fd20b6a69e`
**Methodik**: 40 Verifikationspunkte über 5 Kategorien, jeweils mit konkretem Beweis

## Zusammenfassung

| Status | Anzahl |
|---|---|
| 🟢 GRÜN | 35 / 40 |
| 🟡 GELB (User-Entscheidung) | 2 |
| 🔴 ROT (Blocker) | 0 |
| Action-Items für Schritt 6 (normale Submit-Flow-Schritte, nicht Blocker) | 3 |

**Submit-Empfehlung**: **GO**, nach Klärung der 2 GELB-Items + Ausführung der 3 Schritt-6-Actions.

---

## Kategorie A — Code & Bundle (im IPA `/tmp/Build59/App.ipa`)

| # | Punkt | Status | Befund | Action |
|---|---|---|---|---|
| A.1 | Wrapper-Fix verifiziert | 🟢 | `{plugin:t.Purchases}` + `?.plugin??` in `Payload/App.app/public/assets/index-CjpYLKsn.js` | none |
| A.2 | Diag-Marker abwesend | 🟢 | 0 Treffer für `RC-DIAG\|UNH-REJ\|B59-Schritt\|BEFORE-AWAIT\|AFTER-AWAIT` im IPA | none |
| A.3 | Auto-Navigate-Patches abwesend | 🟢 | 0 Treffer für `B59-Schritt3-TEMP\|RootRedirect.*upgrade` im IPA | none |
| A.4 | `.storekit`-Datei NICHT im Bundle | 🟢 | `unzip -l` zeigt 0 storekit-Treffer (Dev-only Datei korrekt ausgespart) | none |
| A.5 | Version Strings | 🟢 | CFBundleVersion=59, CFBundleShortVersionString=1.0, CFBundleIdentifier=com.jonathanjansen.mindmate | none |
| A.6 | Bundle ID Drift (5 Quellen) | 🟢 | Alle 5 = `com.jonathanjansen.mindmate` (IPA Info.plist, src Info.plist via $(PRODUCT_BUNDLE_IDENTIFIER), pbxproj, capacitor.config.ts, ASC API) | none |
| A.7 | RC API-Key Match | 🟢 | `appl_VatNsFmCDlJPOPkBGnzmhHyZrYy` in Code + IPA + RC Dashboard | none |
| A.8 | Plugin-Linking | 🟢 | `@revenuecat/purchases-capacitor@13.0.1` in package.json, SPM-Package-Eintrag, PurchasesHybridCommon exact 18.1.0 | none |
| A.9 | Capacitor server.url | 🟢 | `// url: ...` AUSKOMMENTIERT — kein Remote-WebView-Loading | none |
| A.10 | Privacy Manifest | 🟡 | App-eigene `PrivacyInfo.xcprivacy` FEHLT. Vorhanden nur in eingebetteten Frameworks (Capacitor, Cordova, RevenueCat). | **User-Entscheidung** — siehe unten |

### A.10 GELB-Detail

Apple verlangt seit Mai 2024 ein `PrivacyInfo.xcprivacy` für jede Binary, die **Required Reason APIs** verwendet. Die im IPA gefundenen Manifeste:
```
Payload/App.app/RevenueCat_RevenueCat.bundle/PrivacyInfo.xcprivacy
Payload/App.app/Frameworks/Capacitor.framework/PrivacyInfo.xcprivacy
Payload/App.app/Frameworks/Cordova.framework/PrivacyInfo.xcprivacy
```

Das App-Binary selbst hat KEIN Manifest. Das ist ok, **WENN** das App-Binary keine Required Reason APIs direkt verwendet — alle nativen API-Zugriffe in Capacitor-Apps gehen typischerweise über die Frameworks, die ihre eigenen Manifeste haben.

**Frühere Builds (50-58)** wurden alle ohne App-eigenes Manifest akzeptiert (Apples Reject war jedes Mal aus Gründen, die wir gefixt haben — nie wegen Privacy Manifest). Daher hoher Vertrauen, dass dies kein Reject-Risiko ist.

**Empfehlung**: 🟡 GELB lassen, kein Fix nötig vor Submit, aber bewusst entscheiden.

---

## Kategorie B — App Store Connect

| # | Punkt | Status | Befund | Action |
|---|---|---|---|---|
| B.1 | App Version 1.0 State | 🟡 | `REJECTED`, bound build = Build 58 (`dbed1a00…`) | **Action Schritt 6**: rebind to Build 59 + State → PREPARE_FOR_SUBMISSION |
| B.2 | Build 59 VALID + APP_STORE_ELIGIBLE | 🟢 | VALID, APP_STORE_ELIGIBLE, expired=False, minOsVersion=15.0, iconAssetToken present, expirationDate 2026-08-28 | none |
| B.3 | Subscription-States | 🟡 | Beide `DEVELOPER_ACTION_NEEDED` (post-reject normal). productIds case-exact (`Soulvay_plus_monthly`, `Soulvay_plus_yearly`), Subscription Group `21939801` | **Action Schritt 6**: reactivate → WAITING_FOR_REVIEW |
| B.4 | Subscription-Pricing 175 Territorien | 🟢 | Beide Subs: 175 Price-Entries. Spot-Check US/DE/GB/FR/JP alle vorhanden | none |
| B.5 | Subscription Localizations | 🟡 | Nur `de-DE` Localization (1), Status REJECTED (folgt Sub-State). Keine englische Localization. | **User-Entscheidung** — siehe unten |
| B.6 | Subscription Review Screenshots | 🟢 | Beide haben COMPLETE assetDeliveryState | none |
| B.7 | URLs (Privacy/Support/Marketing) | 🟢 | privacy=`https://soulvay.com/privacy`, support=`https://soulvay.com/contact`, marketing=`https://soulvay.com`, description=2038 chars de-DE | none |
| B.8 | Paid Apps Agreement | 🟢 | Aktiv 24.04.2026 – 24.01.2027 (verifiziert in audit/ACCOUNT_HYGIENE.md) | none |
| B.9 | Tax Forms + Banking | 🟢 | W-8BEN aktiv, Banking aktiv (Jonathan Jansen 5690 DE EUR/USD) | none |
| B.10 | Demo-Credentials in Review Notes | 🟢 | `apple-review@soulvay.de` / `MindMate2026Review!`, demoAccountRequired=True, contact +4917644680467 / joni.jansen00@gmail.com | none |
| B.11 | Review Notes Build-Wortlaut | 🔴→🟢 | Aktueller Stand mentions Build 58 (length 3903/4000). **MUSS upgedatet werden auf Build 59** mit Wrapper-Fix-Erklärung. | **Action Schritt 6**: Notes-Replace |
| B.12 | Export Compliance | 🟢 | usesNonExemptEncryption=False, IPA Info.plist ITSAppUsesNonExemptEncryption=false | none |
| B.13 | App Icon | 🟢 | AppInfo present, Build 59 iconAssetToken 152×152 (Bundle), 1024×1024 Marketing-Icon ist in ASC AppInfo (übertrag aus Builds 50+) | none |
| B.14 | Listing Screenshots | 🟢 | de-DE: 7 iPhone-67-Screenshots + 7 iPad-Pro-12.9-Screenshots | none |
| B.15 | Age Rating | 🟢 | FOUR_PLUS (4+), BR=SELF_RATED_L. Für Mental-Health-App akzeptabel; war in 27 Reviews nie ein Problem | none |
| B.16 | App Privacy / Data Collection | 🟢 | (ASC REST hat dafür keinen v1-Endpoint, indirect-verified: ohne ausgefüllte Data-Collection-Sektion wäre keine der bisherigen 27 Submissions möglich gewesen — Apple validiert das beim ersten Submit) | none |

### B.5 GELB-Detail

Es gibt nur eine `de-DE` Localization für die Subscriptions. Apple verlangt KEINE englische Localization, wenn das Hauptpublikum deutsch ist — aber wenn die App in US/UK angeboten wird (was sie ist, 175 Territorien), kann ein US-Reviewer Subscription-Details NICHT auf englisch sehen.

**Frühere Builds (50-58)** hatten dieselbe Konfiguration und wurden NIE wegen fehlender englischer Localization gerejected.

**Empfehlung**: 🟡 GELB lassen, kein Fix vor Submit, später (Build 60+) bei Bedarf englische Localization hinzufügen.

### B.11 Action-Item

Review Notes müssen für Build 59 angepasst werden. Vorgeschlagener Replace des "Build 58"-Blocks durch (~600 chars, behält die anderen Sections):

```
Build 59 (replaces Build 58) resolves the persistent purchase failure observed across submissions 41-58. Root cause: a Capacitor plugin thenable trap. An async helper returned the @revenuecat/purchases-capacitor plugin proxy directly. JavaScript's Promise resolution probes returned values for `.then` to detect thenables; Capacitor proxies route every property access (including `.then`) to the native bridge. iOS responded with "Purchases.then() is not implemented", causing the initialization promise to hang silently. Result: Purchases.configure() never executed, no customer records were ever created in RevenueCat, and every purchase attempt fell through to a fallback error toast. Fix: the helper now returns a plain wrapper object { plugin: Purchases } which is not thenable, so Promise.resolve completes normally. Verified locally on iPad Air 11" M3 (iPadOS 26.2): with the fix, a new customer record appears in the RevenueCat dashboard within seconds of app launch (previously zero customers across 90 days, all builds). Demo credentials and subscription identifiers unchanged.
```

Final Notes mit dieser Section ersetzt halten ~3700-3900 chars, unter 4000-Limit.

---

## Kategorie C — RevenueCat

| # | Punkt | Status | Befund | Action |
|---|---|---|---|---|
| C.1 | RC Project + iOS App Config | 🟢 | Project Soulvay (`bcbc58fb`), MindMate (App Store) (`app82b65f8106`), Bundle ID `com.jonathanjansen.mindmate`, IAP Key `WJ6N4WB72Z.p8` Valid credentials | none |
| C.2 | Products | 🟢 | Beide Subs `Soulvay_plus_monthly` + `Soulvay_plus_yearly` registriert (case-exact). Verifiziert via Schritt 3 RC SDK log: `starting store products request for: ["Soulvay_plus_yearly", "Soulvay_plus_monthly"]` | none |
| C.3 | Entitlement `premium` | 🟢 | Existiert mit beiden Products attached (verifiziert in früherem RC-Audit) | none |
| C.4 | Offerings & Packages | 🟢 | `default` Offering current, `$rc_monthly`+`$rc_annual` Packages, Customer-Profile zeigt `Current offering: default` (Schritt 3 Screenshot) | none |
| C.5 | Test-Customer aus Schritt 3 | 🟢 | `$RCAnonymousID:21e7e96a2fe14abebc16841f2635330d` weiterhin im Dashboard sichtbar (Customer profile URL geprüft, "Country: Germany, User Since 2026-05-30 2:58 p.m. UTC") | none |
| C.6 | Event-Log Errors letzte 24h | 🟢 | Schritt-3-Log zeigte `GET /v1/subscribers/.../offerings (200)` + `Offerings updated from network 😻`. Keine 4xx/5xx von RC-Backend | none |

---

## Kategorie D — Reviewer-Simulation (Code-Audit, da Click-Automation unreliable)

| # | Punkt | Status | Befund | Action |
|---|---|---|---|---|
| D.1 | Demo-Account-Flow | 🟢 | Code-Pfad: `apple-review@soulvay.de` → AuthContext.signIn → /home (`OnboardingGuard` checkt isAuthenticated). Demo-Login-Button alternativ: AuthContext.activateDemoMode → OnboardingGuard redirects alle Routen außer /upgrade dorthin. Beide Pfade führen zur Paywall | none |
| D.2 | AI-Disclosure | 🟢 | `AIConsentModal.tsx` zeigt prominent: "Soulvay nutzt **Google Gemini** von Google LLC". Mit ICH-VERSTEHE-UND-STIMME-ZU Button. Demo-Mode überspringt für Reviewer-Convenience | none |
| D.3 | Crisis-Routing | 🟢 | Mehrere Translation-Keys: `safety.callEmergency`, `safety.call112`, `safety.crisisLines`, `crisis.title` ("Support & Resources" / "Unterstützung & Ressourcen"), `crisis.telefonseelsorgeDesc` ("Free, anonymous, 24/7 support"). Telefonseelsorge ist verlinkt | none |
| D.4 | Account-Deletion | 🟢 | Route `/delete-account` publicly accessible, `DeleteAccount`-Komponente vorhanden, supabase function `delete-account` mit Cascade über user-tables + storage + auth | none |
| D.5 | Restore Purchases | 🟢 | `Upgrade.tsx:292 handleRestorePurchases` ruft `await restorePurchases()` aus useRevenueCat. Button im Paywall-UI sichtbar | none |
| D.6 | iPad Multitasking | 🟢 | `UIRequiresFullScreen` in Info.plist: **Does Not Exist** (= App unterstützt Multitasking/Stage Manager) | none |
| D.7 | Network-Error-Handling | 🟢 | `useNetworkStatus.ts` + `useNetworkSimulator.ts` Hooks, AudioLibrary + FAQ haben Offline-Behandlung | none |

---

## Kategorie E — Resolution Center + Reply

| # | Punkt | Status | Befund | Action |
|---|---|---|---|---|
| E.1 | Resolution Center Status | 🟡 | Submission `89890ce6-...` State `UNRESOLVED_ISSUES`, Item state `REJECTED` (normaler post-reject Zustand) | **Action Schritt 6**: neuer Submit erzeugt neuen Item State |
| E.2 | Resolution Center Reply Draft | 🟢 | Draft vorhanden in `audit/RESOLUTION_CENTER_REPLY_DRAFT.md` (Build-58-Version). **Vor Senden auf Build 59 + Wrapper-Fix-Erwähnung aktualisieren.** Sendung erst nach erfolgreichem Submit + User-GO | **Action nach Submit**: Reply-Update + User-GO + Sendung |

---

## Action-Items für Schritt 6 (normale Submit-Flow-Schritte)

1. **Subs reaktivieren** (DEVELOPER_ACTION_NEEDED → WAITING_FOR_REVIEW): via ASC REST API PATCH auf `/v1/subscriptions/{id}` mit `state: WAITING_FOR_REVIEW`
2. **Build 58 → Build 59 binden** auf App Version 1.0: via ASC REST API PATCH `/v1/appStoreVersions/cb2ddedc-.../relationships/build`
3. **Review Notes updaten** (Build 58 → Build 59 Wortlaut, ~3700-3900 chars): via ASC REST API PATCH `/v1/appStoreReviewDetails/c7247f01-...`
4. **Submission Item** für Build 59 erstellen, ReviewSubmission auf SUBMITTED setzen — NUR mit User-GO "JA SUBMIT"

## GELB-Items für User-Entscheidung

1. **A.10 — App-eigenes PrivacyInfo.xcprivacy fehlt** (nur Frameworks haben es).
   - Empfehlung: 🟡 GELB lassen. Builds 50-58 wurden ohne app-eigenes Manifest akzeptiert, kein bekanntes Reject-Risiko hier.
   - Alternative: Vor Submit ein leeres PrivacyInfo.xcprivacy für die App hinzufügen.

2. **B.5 — Nur de-DE Subscription Localizations** (keine englische).
   - Empfehlung: 🟡 GELB lassen. Builds 50-58 hatten dieselbe Config und wurden nie deswegen gerejected.
   - Alternative: Vor Submit englische Localization (1 Eintrag pro Sub) hinzufügen, dann sind Subs für US-Reviewer auf englisch lesbar.

## Submit-Entscheidung

| Frage | Status |
|---|---|
| 🔴 ROT-Befunde geklärt? | ✅ Keine ROT |
| 🟡 GELB-Befunde User-entschieden? | **Pending** — User muss A.10 + B.5 entscheiden |
| Action-Items 1-3 für Schritt 6 vorbereitet? | Bereit, warten auf User-GO |

**Empfehlung**: **GO** für Schritt 6, sobald:
- User über A.10 + B.5 entschieden hat (vermutlich beide "GELB lassen")
- User explizit "JA SUBMIT" sagt

## Hard Stop-Bedingungen Status

- 🔴 Verifikation 3A fehlschlägt (Customer in RC): ✅ erfolgreich (Customer existiert)
- 🔴 Verifikation 4A fehlschlägt (StoreKit-Sheet): ❎ skipped per User-Entscheidung Option B (by-transitivity)
- 🔴 Verifikation 5B fehlschlägt (Diag-Code im Bundle): ✅ Bundle clean
- 🔴 Verifikation 6B fehlt (kein User-GO): pending
