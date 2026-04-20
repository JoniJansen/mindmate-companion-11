# Lovable Prompt — Build 13 Sync

**Purpose:** Nach dem GitHub-Push von Build 13 soll Lovable die Web-App redeployen und eine kurze Qualitätskontrolle durchlaufen.

---

## ⚡ THE PROMPT (copy-paste into Lovable)

```
Ich habe gerade über Claude Code in meinem lokalen Repo Build 13 fertiggestellt und nach GitHub gepusht (Branch: feat/app-store-ready). Die Änderungen beheben drei Apple-Rejection-Punkte (Guidelines 2.1a, 3.1.1, 3.1.2c). Bitte übernimm diese drei Aufgaben:

1. PULL + MERGE:
Ziehe die aktuellsten Commits vom feat/app-store-ready-Branch und merge sie nach main. Falls ein PR gebraucht wird, erstelle ihn und merge ihn direkt (keine offenen Punkte — alle Änderungen sind bereits vollständig dokumentiert in docs/apple-rejection-fixes-build13.md).

2. QUALITY-CHECK nach dem Merge:
Stelle sicher, dass die Web-App nach dem Redeploy weiterhin:
a) Korrekt auf /auth den Apple-Button ANZEIGT (auf Web, nicht iOS — wir sind ja im Browser)
b) Auf /upgrade den Stripe-Checkout-Flow nutzt (nicht Apple IAP — das ist nur für iOS-native)
c) Keine Regressions zeigt — die iOS-spezifischen Guards (isIOSApp()) dürfen den Web-Flow nie aktivieren

3. COMMIT-QUALITÄT:
Falls du zusätzliche Commits machst (z. B. automatische Lovable-Fixes oder Formatierung), halte sie minimal. Keine Funktionsänderungen ohne ausdrückliche Rücksprache.

Kontext für die Review:
- Die Änderungen sind primär iOS-relevant und ändern das Web-Verhalten NICHT
- src/lib/platformSeparation.ts: shouldShowAppleAuth() gibt jetzt isWeb() zurück (war: isWeb() || isIOSApp()) — das blendet den Apple-Button auf iOS aus, zeigt ihn aber weiterhin auf Web
- src/pages/Upgrade.tsx: harte isIOSApp()-Trennung zwischen Stripe (Web) und RevenueCat (iOS)
- src/hooks/useRevenueCat.ts: neue findPackageForPlan()-Funktion, tolerantes Produkt-ID-Matching
- src/lib/appleSignIn.ts: neuer Native-Apple-SignIn-Wrapper (nur iOS-aktiv, auf Web nicht geladen)
- capacitor.config.ts: Bundle-ID auf com.jonathanjansen.mindmate angeglichen
- ios/: Entitlements-Datei + pbxproj-Update (iOS-Build-only, beeinflusst Web nicht)

Wenn der Deploy durch ist und der Web-Smoke-Test (Punkt 2) sauber läuft, bestätige mit "Web-App Build 13 deployed und verifiziert."
```

---

## Wenn Lovable nachfragt

- **„Sollen auch die Screenshots/Marketing-Texte aktualisiert werden?"** → Nein, nur der Code-Merge + Deploy.
- **„Soll ich die Bundle-ID in den Deployment-Settings ändern?"** → Nein, das ist nur für den Capacitor-Native-Build relevant, nicht für die Web-Deployment.
- **„Soll ich die Supabase-URL in den Env Vars ändern?"** → Nein, die bleibt wie sie ist (`djnbvnufmegiursvqbhp.supabase.co` für Lovables gemanagtes Supabase).
