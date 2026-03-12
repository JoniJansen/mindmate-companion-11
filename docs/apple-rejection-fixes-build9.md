# Apple App Store Rejection Fixes - Build 9

This document summarizes all fixes made to address the Apple App Store rejection feedback from March 11, 2026 (Submission ID: ab915f64-ff13-49e4-b2b0-22a7472e39d7).

## Issues Addressed

### 1. Guideline 2.3.10 - Performance - Accurate Metadata (Google Play References)

**Problem**: The app binary includes information about third-party platforms (Google Play) that is not relevant for App Store users.

**Root Cause**: The Landing page contained Google Play Store badge images and text references ("Coming soon to App Store & Google Play"), FAQ answers mentioned "iOS and Android", and the Privacy Policy referenced "iOS/Android subscriptions".

**Fix (Build 9)**:
- **Removed all Google Play badge images** from Landing page (both hero and footer sections)
- **Updated store text** from "App Store & Google Play" to "App Store" only
- **Updated FAQ answers** to remove "Android" references — now says "available on iOS as well as a progressive web app"
- **Updated Privacy Policy** (both EN and DE) to reference "iOS subscriptions" instead of "iOS/Android subscriptions"
- **Removed `google-play.svg` badge** usage from the entire codebase
- **Updated `reviewMode.ts`** comment to remove "Google Play" reference

**Files changed**:
- `src/pages/Landing.tsx`
- `src/pages/FAQ.tsx`
- `src/pages/Privacy.tsx`
- `src/lib/reviewMode.ts`

### 2. Guideline 2.3.8 - Performance - Accurate Metadata (App Icons)

**Problem**: The app icons appear to be placeholder icons.

**Action Required**: This is NOT a code fix — you must ensure the App Icon in Xcode is properly configured:
1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Replace ALL icon sizes with the final Soulvay icon from `public/store/app-icon-512-v3.png`
3. Use an icon generator tool (e.g., https://www.appicon.co) to create all required sizes
4. Ensure the 1024x1024 App Store icon is set correctly
5. **Verify ALL icon slots are filled** — empty slots cause this rejection

### 3. Architecture Hardening: Centralized Native Detection

**Improvement**: Created `src/lib/nativeDetect.ts` — a single, cached, fail-closed native platform detection utility used across all components.

Previously, native detection was duplicated inconsistently across 6+ files with different check strategies. Now all components import from one source:

```typescript
import { isNativeApp } from "@/lib/nativeDetect";
```

This ensures:
- **Fail-closed behavior**: If detection fails, web-only UI (badges, billing links, install prompts) may show, but native-only features won't crash
- **Cached result**: Detection runs once per session, no repeated checks
- **4-signal strategy**: Capacitor SDK → getPlatform() → runtime fallback → WKWebView detection

**Files updated to use centralized detection**:
- `src/components/settings/AccountSettings.tsx`
- `src/components/settings/SettingsSupportSection.tsx`
- `src/components/premium/SubscriptionSection.tsx`
- `src/components/gdpr/CookieConsent.tsx`
- `src/pages/Landing.tsx`
- `src/pages/Auth.tsx`

---

## Previously Fixed Issues (Builds 1-8)

All previously addressed issues remain resolved:

1. **Guideline 5.1.2 - Cookie Consent**: Cookie banner auto-skipped on native builds (no tracking)
2. **Guideline 2.1 - IAP Button**: StoreKit bridge properly accesses native Capacitor plugin
3. **Guideline 3.1.2 - Subscription Info**: Full subscription details displayed on Upgrade page
4. **Guideline 3.1.1 - External Payments**: Stripe billing links hidden on native builds
5. **Guideline 2.1 - Camera Crash**: Avatar upload completely removed from DOM on native builds
6. **Security**: RLS policies on all tables, user_activity_log is append-only
7. **Edge Function Security**: All functions use JWT auth, generic error messages, no data leakage

---

## Testing Before Resubmission

### CRITICAL (New Issues)
1. **Google Play References (Guideline 2.3.10)**:
   - Build and search the entire `dist/` output for "Google Play" — must return ZERO results
   - Search for "google-play" — must return ZERO results
   - Search for "Android" in visible UI text — only acceptable in technical/diagnostic contexts
   - Landing page: Verify only App Store badge shown (no Google Play badge)
   - FAQ: Verify mobile app answer does NOT mention "Android"
   - Privacy: Verify "iOS subscriptions" not "iOS/Android"

2. **App Icons (Guideline 2.3.8)**:
   - In Xcode: Open Assets.xcassets → AppIcon
   - Verify ALL icon slots are filled with the Soulvay icon
   - Verify 1024x1024 icon is not a placeholder
   - Verify icons are consistent (same design at all sizes)

### Regression Checks
3. **Cookie Banner**: Run on iOS device → verify NO cookie banner appears
4. **In-App Purchase**: Test with Sandbox account → verify purchase flow triggers
5. **Subscription Info**: Navigate to Upgrade page → verify all details visible
6. **Camera/Avatar**: Settings → Account → verify NO upload button on native
7. **Privacy & Data**: Tap in Settings → verify navigation works
8. **Billing Links**: Settings → Subscription → verify NO "Manage billing" on native
9. **Install App**: Settings → verify NO "Install App" card on native
10. **All Modules**: Test Chat, Journal, Mood, Topics, Toolbox for stability

---

## Build Instructions

```bash
# 1. Pull latest code
git pull

# 2. Install dependencies
npm install

# 3. Build the web app
npm run build

# 4. VERIFY: Search dist for Google Play references (must be empty!)
grep -ri "google.play\|google-play\|Google Play" dist/ || echo "✅ No Google Play references found"

# 5. Sync to iOS
npx cap sync ios

# 6. Open in Xcode
npx cap open ios
```

In Xcode:
1. **Increment Build number to 9**
2. **CRITICAL: Verify App Icons** in Assets.xcassets → AppIcon (ALL sizes filled, no placeholders!)
3. Verify Display Name is "Soulvay"
4. Verify Bundle ID is `com.jonathanjansen.mindmate`
5. Product → Archive
6. Distribute App → App Store Connect

---

## App Store Connect Review Notes

When resubmitting, add these Review Notes:

```
Demo Login:
A "Review / Demo Login" button is visible on the login screen below the regular sign-in form. Tapping this button logs in automatically with the demo account. All premium features are unlocked.

Changes in Build 9:
1. Guideline 2.3.10 (Accurate Metadata): ALL Google Play references have been completely removed from the app binary. The Landing page, FAQ, and Privacy Policy no longer mention Google Play, Android, or any non-Apple platforms. Only the App Store badge is displayed.
2. Guideline 2.3.8 (App Icons): App icons have been verified and updated to use the final Soulvay branding — no placeholder icons remain. All icon slots in the asset catalog are filled.
3. Architecture: Native platform detection has been centralized into a single utility module for consistent behavior across all screens.
```

---

## App Store Connect Settings Checklist

- [ ] Select new Build 9
- [ ] Update Review Notes (see above)
- [ ] Verify In-App Purchases are linked to this version
- [ ] Privacy → Data tracking: "No"
- [ ] Verify screenshots are current (no Google Play references visible)
- [ ] Verify App Store description does NOT mention Google Play or Android
- [ ] Submit for Review

---

## Post-Submission Monitoring

After submitting Build 9:
1. Monitor App Store Connect for review status updates
2. If approved, verify the live app on TestFlight
3. If rejected again, check the specific guideline and file mentioned
