# Claude Code Runbook — Build 13 (Elite Execution)

**Purpose:** Everything terminal-based to get the Soulvay app through Apple review on attempt #21.
**Context:** Claude in Cowork has already made all code changes in this repo (see `docs/apple-rejection-fixes-build13.md`). This runbook is for Claude Code running on the user's Mac to complete the build + deploy pipeline.

---

## ⚡ THE PROMPT (copy-paste this into Claude Code)

```
Du bist Claude Code und übernimmst den Mac-Terminal-Teil der Soulvay Build-13-Auslieferung. Kontext: Claude in Cowork hat bereits alle iOS-Rejection-Fixes gemacht (Apple-Button auf iOS ausgeblendet, iOS-IAP-Härtung, Apple-Entitlement + Native-SignIn-Infrastruktur als Reserve, Bundle-ID angeglichen auf mindmate). Ich brauch dich für: Build, Cap-Sync, Git-Commit, Push, und optional iOS-Archive via CLI.

Arbeite im Ordner ~/soulvay. Alles muss sauber durchlaufen — Elite-Niveau. Bei Fehlern: stoppen, analysieren, berichten (nicht raten).

Schritt 1 — Preflight:
- Prüfe node --version. Muss >=22 sein (sonst brew install node@22 && brew link --overwrite --force node@22).
- Prüfe git status — zeige mir die modifizierten + neuen Dateien.

Schritt 2 — Build + Sync:
- npm install (falls nötig)
- npm run build
- Binary-Scan: grep -r "Google Play\\|Play Store\\|\\"Android\\"" dist/ sollte nichts finden (Guideline 2.3.10)
- npx cap sync ios
- Verifiziere: @capacitor-community/apple-sign-in und @revenuecat/purchases-capacitor müssen beide in "Found X Capacitor plugins for ios" auftauchen

Schritt 3 — Git Commit + Push:
- git add -A
- Commit-Message (mehrzeilig, aussagekräftig):
  "Build 13: iOS Rejection Fixes (Submission 94047bc0)

  - Guideline 2.1(a): Apple Sign-In Button auf iOS ausgeblendet
    (nicht erforderlich da kein anderer Social-Login auf iOS)
    Native Apple-SignIn-Infrastruktur bleibt als Reserve erhalten.
  - Guideline 3.1.1: iOS-IAP-Pfad gehärtet — kein Stripe-Fallback mehr
    möglich. Flexibles Produkt-ID-Matching (soulvay_* + mindmate_*).
  - Guideline 3.1.2(c): Apple-EULA-Link permanent auf iOS sichtbar.
  - Bundle-ID in capacitor.config auf com.jonathanjansen.mindmate angeglichen.
  - App.entitlements + CODE_SIGN_ENTITLEMENTS eingetragen.
  - @capacitor-community/apple-sign-in ergänzt.
  
  Files: docs/apple-rejection-fixes-build13.md,
         docs/app-store-connect-snippets-build13.md,
         docs/claude-code-runbook-build13.md"
- git push origin feat/app-store-ready
- Falls Remote-Branch nicht existiert: git push -u origin feat/app-store-ready

Schritt 4 — Ausgabe:
Nach erfolgreichem Push, gib mir:
a) Den Commit-Hash
b) Die GitHub-PR-URL (falls gh CLI verfügbar: gh pr create --base main --head feat/app-store-ready --title "Build 13: iOS Apple-Review Fixes" --body "Siehe docs/apple-rejection-fixes-build13.md")
c) Eine EIN-SATZ-Zusammenfassung was jetzt passieren muss (Xcode öffnen)

Nicht machen:
- KEIN Xcode-Archive via xcodebuild — das macht der User in Xcode (er muss Build Number auf 42 setzen + Signing prüfen)
- KEIN merge zu main — das macht der User nach dem PR
- KEIN npm audit fix oder package-Updates — nur das was im Runbook steht

Fertig? Dann bestätige: "Build 13 bereit für Xcode-Archive. Build Number 41 → 42 erhöhen, dann Archive + Upload."
```

---

## 📋 What happens AFTER Claude Code finishes

1. **User in Xcode:**
   - `npx cap open ios`
   - Target App → General → Build = 42
   - Product → Archive
   - Distribute App → App Store Connect → Upload
   - Wait for "Ready to Submit" in App Store Connect (10–30 min)

2. **Claude in Cowork (me) resumes:**
   - Open App Store Connect via Chrome
   - Attach Build 42 to the version
   - Set License Agreement → Apple Standard EULA
   - Paste Review Notes from `docs/app-store-connect-snippets-build13.md`
   - Verify IAP products linked
   - Submit for Review

3. **Lovable (web deployment):**
   - After Claude Code pushed, user merges the PR in Lovable or GitHub
   - Lovable auto-redeploys web app with the same hardened iOS-aware logic
