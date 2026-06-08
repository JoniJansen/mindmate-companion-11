# Build 60 — Pre-Submit Checklist

**Status:** Living document. Tick boxes before TestFlight / Play Console submission.
**Owner:** Solo founder. Reviewer: Claude advisor.

---

## Item #0 — Sentry Crash-Reporting (Build 60)

- [ ] `VITE_SENTRY_DSN` set in `.env` (verify `grep VITE_SENTRY_DSN .env`)
- [ ] `bun add @sentry/react@10.43.0 @sentry/capacitor@^4.0.0` successful, lockfile committed
- [ ] TypeScript check passes (`tsc --noEmit` run by harness)
- [ ] `src/lib/sentry.ts` exports `initSentry`, `captureException`, `isCrashReportingAllowed`, `sendTestCrash`
- [ ] `main.tsx` calls `initSentry()` before `createRoot(...)`
- [ ] `ErrorBoundary.tsx` + `SectionErrorBoundary.tsx` route to `captureException`
- [ ] Cookie-Consent has `crashReporting` toggle (DE+EN copy correct)
- [ ] `NativeCrashConsentModal` renders on first native launch, default OFF
- [ ] Privacy Manifest `ios/App/App/PrivacyInfo.xcprivacy` present
- [ ] **Manual Xcode step:** PrivacyInfo.xcprivacy added to **App target** → **Build Phases → Copy Bundle Resources**
- [ ] Verify in Xcode: `Build → Show Build Folder → App.app/PrivacyInfo.xcprivacy` exists
- [ ] DevQA route `/dev-qa` reachable via direct URL, not linked in navigation
- [ ] DevQA Test-Crash button shows confirm dialog before firing
- [ ] Web test-crash arrives in Sentry < 30s (filter `test:true`)
- [ ] TestFlight test-crash arrives in Sentry with symbolicated stack trace
- [ ] Consent OFF → test-crash does NOT arrive in Sentry (verify in dashboard)
- [ ] Sentry dashboard: Rate-Limit + Inbound-Filter configured to block dev events from prod alerts

## Versioning

- [ ] `CFBundleVersion` bumped to `60` in `ios/App/App/Info.plist`
- [ ] `CFBundleShortVersionString` bumped to `1.1`
- [ ] Android `versionCode` incremented
- [ ] Android `versionName "1.1"`

## Native Build Sync

- [ ] `npx cap sync ios` clean (no warnings)
- [ ] `npx cap sync android` clean
- [ ] `pod install` in `ios/App/` successful, `Podfile.lock` committed
- [ ] iOS build green in Xcode Release configuration
- [ ] Android build green in Android Studio Release configuration

## Store Compliance

- [ ] Apple App Store Connect → App Privacy → declared types match PrivacyInfo.xcprivacy
- [ ] Play Console → Data Safety → "Crash logs + Diagnostics: Collected, not shared, optional"
- [ ] `/privacy` page updated: section on Sentry/EU-Hosting
- [ ] `docs/gdpr-record-of-processing-activities.md` extended with Sentry processor entry

## Items still pending (do NOT submit until done)

- [ ] Item #1B — Native Speech-Recognition Plugin verified on physical device
- [ ] Item #1A Closure Verification (already ✅ per `audit/BUILD60_ITEM_01A_CLOSURE_VERIFICATION.md`)
