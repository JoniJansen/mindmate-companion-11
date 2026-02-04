# Apple App Store Review - Build 7 Fixes

This document summarizes all fixes made to address the Apple App Store rejection (Guideline 2.1 - Information Needed) from February 2026.

## Issue: Apple Could Not Login With Demo Credentials

**Problem**: Apple Review team was unable to log in with the provided demo credentials. This blocked the review process.

## Complete Solution Implemented

### A) Review Login Button (CRITICAL FIX)

**File**: `src/pages/Auth.tsx`

- Added a dedicated **"Review / Demo Login"** button on the login page
- Button is always visible when in login mode
- Uses hardcoded credentials that bypass all verification:
  - Email: `apple-review@mindmate.de`
  - Password: `MindMate2026Review!`
- Email input is normalized (trim, lowercase) to prevent issues
- Detailed error messages for troubleshooting

### B) Review Account Setup

**File**: `supabase/functions/setup-review-account/index.ts`

Created a dedicated edge function that:
- Creates the review account with `email_confirm: true` (no email verification needed!)
- Auto-creates a profile with display name "Apple Reviewer"
- Auto-creates an active subscription with `plan_type: "review"`
- Subscription valid for 1 year

**Account Created**:
- User ID: `0e6c17f2-6aad-436e-a491-5deb16243cf0`
- Email: `apple-review@mindmate.de`
- Status: Active, Email Confirmed

### C) Review Mode with Premium Bypass

**File**: `src/lib/reviewMode.ts`

- `isReviewAccount()` - Checks if user email matches review account
- `isReviewModeActive()` - Checks localStorage flag
- `activateReviewMode()` - Sets localStorage flags for premium access
- `getDeviceInfo()` - Returns device info for iPad detection

**File**: `src/hooks/usePremium.ts`

- Added automatic detection of review account
- Review accounts get instant premium access
- No subscription check needed for review mode

### D) Review Instructions Page

**File**: `src/pages/ReviewInstructions.tsx`

A dedicated page for Apple reviewers with:
- Step-by-step testing checklist
- Quick navigation to all app features
- App information summary
- Links to system status page

### E) System Status / Self-Test Page

**File**: `src/pages/ReviewStatus.tsx`

A diagnostic page that runs automated checks:
1. Authentication status
2. Review account detection
3. Database connectivity
4. Subscription status (confirms premium is active)
5. Network connectivity
6. Device info (iPad detection)
7. Chat API availability

### F) Route Configuration

**File**: `src/App.tsx`

- `/review-instructions` - Review guide page
- `/review-status` - System diagnostics page
- Both accessible without OnboardingGuard (critical for review)

---

## Credentials for App Store Connect

```
Demo Account Username: apple-review@mindmate.de
Demo Account Password: MindMate2026Review!
```

## Testing Flow for Apple

1. Open app on iPad
2. Tap **"Review / Demo Login"** button on login screen
3. Automatically redirected to Review Instructions page
4. All premium features are unlocked
5. Can test Chat, Journal, Mood, Toolbox, Settings

## Verification Checklist Before Submission

- [ ] Review account exists: `apple-review@mindmate.de`
- [ ] Email is confirmed (no verification needed)
- [ ] Subscription is active with `plan_type: review`
- [ ] Review Login button visible on Auth page
- [ ] Login works without email verification
- [ ] Premium features accessible after login
- [ ] iPad layout stable (no overflow, clipped content)
- [ ] Review Instructions page loads correctly
- [ ] System Status page shows all green checks

## Build Instructions

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Increment Build number to 7
2. Product → Archive
3. Distribute App → App Store Connect

## App Store Connect Notes

Add to Review Notes:
```
Demo credentials:
Email: apple-review@mindmate.de
Password: MindMate2026Review!

A "Review / Demo Login" button is available on the login screen for easy access. This account has all premium features unlocked and requires no email verification.
```
