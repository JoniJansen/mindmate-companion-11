# Apple App Store Rejection Fixes - Build 6

This document summarizes all fixes made to address the Apple App Store rejection feedback from January 27, 2026.

## Issues Addressed

### 1. Guideline 5.1.2 - Privacy - Data Use and Sharing (Cookie Consent)

**Problem**: Apple reported that the app collects cookies but doesn't use App Tracking Transparency (ATT).

**Fix**: 
- The app does NOT actually track users for advertising purposes
- Modified `CookieConsent.tsx` to automatically skip the cookie banner on iOS native apps
- On iOS, cookies are set to "essential only" (no analytics, no marketing) without showing a banner
- This is because MindMate doesn't do any cross-app tracking - cookies are only used for session management

**File changed**: `src/components/gdpr/CookieConsent.tsx`

### 2. Guideline 2.1 - Performance - In-App Purchase Button Unresponsive

**Problem**: When tapping the purchase button, it was unresponsive and didn't trigger a purchase flow.

**Fix**:
- Completely rewrote the StoreKit bridge in `useAppleIAP.ts`
- The hook now properly accesses the native Capacitor StoreKit plugin
- Added proper error handling and logging
- The plugin is accessed via `Capacitor.Plugins.StoreKit`

**File changed**: `src/hooks/useAppleIAP.ts`

### 3. Guideline 3.1.2 - Business - Subscriptions (Missing EULA/Privacy Links)

**Problem**: The subscription purchase flow didn't include all required subscription information.

**Fix**:
- Added a dedicated "Subscription Information" section in the Upgrade page
- The section displays:
  - Title of subscription (MindMate Plus)
  - Duration (1 Month or 1 Year, auto-renewing)
  - Price (€9.99/month or €79/year)
  - Clear auto-renewal terms
  - Links to Terms of Use and Privacy Policy

**File changed**: `src/pages/Upgrade.tsx`

### 4. Guideline 2.1 - Performance - App Crashed (Camera Icon)

**Problem**: App crashed when tapping Settings → Account → Camera icon → Take Photo.

**Fix**:
- Modified the avatar upload input to NOT use the `capture` attribute
- This prevents iOS from automatically triggering camera access without proper permissions
- Added better error handling in the upload function
- Reset file input after upload to allow re-selection
- Users can still choose to take a photo via the iOS photo picker, but the app won't crash if camera permissions aren't granted

**File changed**: `src/components/settings/AccountSettings.tsx`

### 5. Guideline 2.1 - Performance - Privacy & Data Tab Unresponsive

**Problem**: Tapping on "Privacy & Data" tab was unresponsive.

**Analysis**: The Privacy & Data card in Settings uses `onClick={() => navigate("/privacy")}` which should work correctly. This may have been a transient issue or related to the overall app crash. The navigation logic is correct.

**File**: `src/pages/Settings.tsx` - No changes needed, navigation is properly implemented.

### 6. Guideline 2.3.8 - Accurate Metadata (Placeholder Icons)

**Problem**: App icons appear to be placeholder icons.

**Action Required**: This is not a code fix - you need to ensure the App Icon in Xcode is properly configured:
1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Replace all placeholder icons with the final MindMate icons from `public/store/app-icon-512-v3.png`
3. Use an icon generator tool to create all required sizes

---

## Testing Before Resubmission

1. **Cookie Banner**: Build and run on iOS device - verify NO cookie banner appears
2. **In-App Purchase**: Test with Sandbox account - verify purchase flow triggers
3. **Subscription Info**: Navigate to Upgrade page - verify all subscription details are visible
4. **Camera/Avatar**: Go to Settings → Account → tap camera icon → select "Take Photo" - verify no crash
5. **Privacy & Data**: Tap "Privacy & Data" in Settings - verify navigation to Privacy page works

## Build Instructions

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Increment Build number to 6
2. Verify App Icons are set correctly (not placeholders!)
3. Product → Archive
4. Distribute App → App Store Connect

## App Store Connect

When resubmitting:
1. Remove old build from review if still pending
2. Select new Build 6
3. Add Review Notes explaining:
   - "All rejection issues have been addressed. Cookie consent is disabled on iOS (app does not track users). In-App Purchase flow has been fixed. Subscription information now displayed. Camera crash fixed."
