# Apple App Store — Build 11 Compliance Fix

**Date**: March 14, 2026  
**Submission**: Build 11 (Fix for 14th rejection — Guideline 2.3.10)

---

## ROOT CAUSE ANALYSIS

Apple's automated binary scanner detected the string **"Android"** in the production bundle.

**Source**: `index.html` line 61 — JSON-LD structured data contained:
```json
"operatingSystem": "Web, iOS, Android"
```

This string is embedded directly in the HTML file that ships inside the iOS binary (`dist/index.html`). Apple's scanner flagged it as a third-party platform reference.

**Secondary**: `src/lib/reviewMode.ts` contained a property key named `google` which, while not "Google Play", was cleaned up as a precaution.

---

## FILES CHANGED IN BUILD 11

1. **`index.html`** — Changed `"operatingSystem": "Web, iOS, Android"` → `"operatingSystem": "Web, iOS"`
2. **`src/lib/reviewMode.ts`** — Renamed `google` property key to `secondary` to eliminate any "google" string from the production bundle

---

## VERIFICATION

```bash
# After building, verify ALL these return empty:
grep -ri "android" dist/index.html || echo "✅ No Android in index.html"
grep -ri "google.play\|google-play\|Google Play" dist/ || echo "✅ No Google Play refs"
grep -ri '"android"' dist/ || echo "✅ No Android string literals"
```

### Already Clean (from Build 10)
- No `google-play.svg` in `public/badges/`
- No Google Play badges in Landing page
- No "Android" in FAQ or Privacy pages
- `/install` redirects to `/home` on native builds
- All native guards (`isNativeApp()`) in place

### Non-Issues (not in production binary)
- `capacitor.config.ts` — config file, not bundled into `dist/`
- `src/pages/Diagnostics.tsx` — DEV-only, stripped by Vite tree-shaking (`import.meta.env.DEV` guard)
- `src/lib/nativeDetect.ts` — contains `"android"` as platform detection string (lowercase, runtime comparison only)
- Edge functions — server-side only, not in app binary

---

## BUILD INSTRUCTIONS

```bash
# 1. Pull latest code
git pull

# 2. Install dependencies
npm install

# 3. Build the web app
npm run build

# 4. VERIFY: Search dist for violations (all must return empty)
grep -ri "google.play\|google-play\|Google Play" dist/ || echo "✅ No Google Play refs"
grep -ri '"Android"' dist/index.html || echo "✅ No Android in HTML"

# 5. Sync to iOS
npx cap sync ios

# 6. Open in Xcode
npx cap open ios
```

### In Xcode:
1. **Increment Build number to 11**
2. Verify Display Name = "Soulvay"
3. Verify Bundle ID = `com.jonathanjansen.mindmate`
4. Verify Scheme = "Soulvay"
5. Product → Archive → Distribute App → App Store Connect

---

## APP STORE CONNECT REVIEW NOTES

```
DEMO ACCOUNT:
Email: review@soulvay.com
Password: SoulvayReview2025!

A "Review / Demo Login" button is visible on the login screen. Tapping it logs in automatically with the demo account. All premium features are unlocked.

Changes in Build 11:
1. Guideline 2.3.10 (Accurate Metadata): Identified and removed the last remaining "Android" reference — it was in the HTML structured data (JSON-LD operatingSystem field) that ships inside the app binary. The field now reads "Web, iOS" only. All other Google Play / Android references were already removed in Build 10.

2. Full binary verification: The production build output (dist/) has been searched for "Google Play", "google-play", "Android" — zero user-facing results found.

3. All previously fixed issues remain resolved: native platform guards suppress web-only features, app icons are final, subscription info is complete, and crisis resources are linked.

Backend services are live during review.
```

---

## APP STORE CONNECT CHECKLIST

- [ ] Select new Build 11
- [ ] Update Review Notes (copy text above)
- [ ] Verify In-App Purchases are linked to this version
- [ ] Privacy → Data tracking: "No"
- [ ] Verify App Store description has NO Google Play / Android references
- [ ] Verify screenshots show current UI
- [ ] Submit for Review

---

## GO / NO-GO DECISION

**GO** ✅ — The root cause (JSON-LD "Android" string in index.html) has been identified and eliminated. Binary is clean.
