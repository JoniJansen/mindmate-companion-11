# Apple App Store Rejection Fixes - Build 8

This document summarizes all fixes made to address the Apple App Store rejection feedback from February 23, 2026 (Submission ID: ab915f64-ff13-49e4-b2b0-22a7472e39d7).

## Issue Addressed

### Guideline 2.1 - Performance - App Crashed (Take Photo in Profile)

**Problem**: App crashed when tapping "Take Photo" in the Profile section on iPhone 17 Pro Max (iOS 26.3).

**Root Cause**: The previous guard `Capacitor.isNativePlatform()` could fail silently in certain WKWebView contexts, causing the `<input type="file" accept="image/*">` element to still render on native iOS builds. When iOS presents its photo picker with a "Take Photo" option, the camera access triggered a crash inside WKWebView.

**Fix (Build 8)**:
- Replaced the single `Capacitor.isNativePlatform()` check with a robust multi-fallback `isNativeApp()` utility function
- The function checks **four independent signals** to detect native environment:
  1. `Capacitor.isNativePlatform()` (primary SDK check)
  2. `Capacitor.getPlatform()` string comparison (`'ios'` / `'android'`)
  3. Global `window.Capacitor.isNativePlatform()` (runtime fallback)
  4. `window.webkit.messageHandlers` presence (WKWebView-specific detection)
- If **any** of these signals returns true, the file input and camera button are completely removed from the DOM
- On native builds, a text notice displays: "Profilbild wird über die Web-Version geändert" (DE) / "Change profile picture via web version" (EN)

**File changed**: `src/components/settings/AccountSettings.tsx`

---

## Previously Fixed Issues (Builds 1-7)

All previously addressed issues remain resolved:

1. **Guideline 5.1.2 - Cookie Consent**: Cookie banner auto-skipped on iOS native (no tracking)
2. **Guideline 2.1 - IAP Button**: StoreKit bridge properly accesses native Capacitor plugin
3. **Guideline 3.1.2 - Subscription Info**: Full subscription details displayed on Upgrade page (title, price, duration, auto-renewal terms, legal links)
4. **Guideline 3.1.1 - External Payments**: Stripe billing links hidden on native builds
5. **Guideline 2.3.8 - App Icons**: Custom app icons configured (not placeholders)
6. **Security**: RLS policies on all tables, user_activity_log is append-only

---

## Testing Before Resubmission

1. **Camera/Avatar Crash (CRITICAL)**:
   - Build and run on physical iPhone
   - Go to Settings → Account
   - Verify: NO camera/upload button appears next to avatar
   - Verify: Text says "Profilbild wird über die Web-Version geändert"
   - Confirm: App does NOT crash

2. **Cookie Banner**: Run on iOS device → verify NO cookie banner appears
3. **In-App Purchase**: Test with Sandbox account → verify purchase flow triggers
4. **Subscription Info**: Navigate to Upgrade page → verify all details visible
5. **Privacy & Data**: Tap "Privacy & Data" in Settings → verify navigation works
6. **All Modules**: Test Chat, Journal, Mood, Topics, Toolbox for stability

---

## Build Instructions

```bash
# 1. Pull latest code
git pull

# 2. Install dependencies
npm install

# 3. Build the web app
npm run build

# 4. Sync to iOS
npx cap sync ios

# 5. Open in Xcode
npx cap open ios
```

In Xcode:
1. **Increment Build number to 8**
2. Verify App Icons are set correctly (not placeholders!)
3. Product → Archive
4. Distribute App → App Store Connect

---

## App Store Connect Review Notes

When resubmitting, add these Review Notes:

```
Demo Login:
Email: apple-review@mindmate.de
Password: MindMate2026Review!

A "Review / Demo Login" button is visible on the login screen below the regular sign-in form. Tapping this button logs in automatically with the demo account. All premium features are unlocked.

Changes in Build 8:
- Fixed camera crash in Profile section (Guideline 2.1). The avatar upload file input is now completely removed from the DOM on native iOS builds using a multi-fallback native platform detection. Users are informed to change their profile picture via the web version. No camera or photo picker is triggered.
```

---

## App Store Connect Settings Checklist

- [ ] Select new Build 8
- [ ] Update Review Notes (see above)
- [ ] Verify In-App Purchases are linked to this version
- [ ] Privacy → Data tracking: "No"
- [ ] Verify screenshots are current
- [ ] Submit for Review
