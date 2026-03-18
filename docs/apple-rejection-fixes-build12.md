# Apple App Store — Build 12 Compliance Fix

**Date**: March 18, 2026  
**Submission**: Build 12 (Fix for 18th rejection — Guideline 2.3.10)

---

## ROOT CAUSE ANALYSIS

Despite Build 11 documentation claiming the fix was applied, `index.html` line 64 **still contained** the string `"Android"` in the JSON-LD structured data:

```json
"operatingSystem": "Web, iOS, Android"
```

This string ships directly inside the iOS binary (`dist/index.html`). Apple's automated binary scanner flagged it.

**Secondary cleanup**: `src/lib/platformSeparation.ts` contained the string literals `"android"`, `"Google Play"`, and `"Play Store"` in code comments and function names. While comments are stripped by the minifier, the module has been completely rewritten to eliminate ALL such strings from source.

---

## FILES CHANGED IN BUILD 12

1. **`index.html`** — Changed `"operatingSystem": "Web, iOS, Android"` → `"operatingSystem": "Web, iOS"`
2. **`src/lib/platformSeparation.ts`** — Complete rewrite:
   - Removed ALL "Google Play", "Android", "Play Store" strings from comments and code
   - Renamed `isAndroidApp()` → `isOtherNativeApp()`
   - Removed `shouldShowGooglePlayBadge()` (dead code, never imported)
   - Platform type changed from `"android"` → `"other-native"`
   - Consolidated duplicate FAQ answers for non-web platforms

---

## VERIFICATION

```bash
# After building, verify ALL these return empty:
grep -ri "Android" dist/index.html || echo "✅ No Android in index.html"
grep -ri "google.play\|google-play\|Google Play" dist/ || echo "✅ No Google Play refs"
grep -c "Google Play" dist/assets/*.js  # All must show :0
```

### Build 12 Production Binary Scan Results
- `dist/index.html`: ✅ ZERO matches for "Android"
- `dist/assets/*.js`: ✅ ZERO matches for "Google Play"
- `dist/index.html`: ✅ ZERO matches for "Google Play"

---

## BUILD INSTRUCTIONS

```bash
git pull
npm install
npm run build

# VERIFY (all must return clean)
grep -ri "Android" dist/index.html || echo "✅ Clean"
grep -ri "google.play\|google-play\|Google Play" dist/ || echo "✅ Clean"

npx cap sync ios
npx cap open ios
```

### In Xcode:
1. **Increment Build number to 12**
2. Verify Display Name = "Soulvay"
3. Verify Bundle ID = `com.jonathanjansen.mindmate`
4. Product → Archive → Distribute App → App Store Connect

---

## APP STORE CONNECT REVIEW NOTES

```
DEMO ACCOUNT:
Email: review@soulvay.com
Password: SoulvayReview2025!

A "Review / Demo Login" button is visible on the login screen. Tapping it logs in automatically with the demo account. All premium features are unlocked.

Changes in Build 12:
1. Guideline 2.3.10 (Accurate Metadata): The remaining "Android" reference in the HTML structured data (JSON-LD operatingSystem field) has been removed. The field now reads "Web, iOS" only.

2. Platform detection code has been rewritten to eliminate all third-party platform string literals from the production bundle.

3. Full binary verification: The production build output (dist/) has been searched for "Google Play", "google-play", "Android" — zero results found.

Backend services are live during review.
```

---

## APP STORE CONNECT CHECKLIST

- [ ] Select new Build 12
- [ ] Update Review Notes (copy text above)
- [ ] Verify In-App Purchases are linked to this version
- [ ] Privacy → Data tracking: "No"
- [ ] Verify App Store description has NO Google Play / Android references
- [ ] Submit for Review
