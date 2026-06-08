# Build 60 — Versioning Bump (Reference)

**Status:** Reference document. **NOT auto-executed** — User runs the version bump manually in Xcode + `android/app/build.gradle` before submitting to TestFlight / Play Console.

## Current State (Build 59)

| Platform | Field | Current Value | Source |
|---|---|---|---|
| iOS | `CFBundleVersion` | `51` | `ios/App/App/Info.plist` |
| iOS | `CFBundleShortVersionString` | `1.0` | `ios/App/App/Info.plist` |
| Android | `versionCode` | TBD — verify in `android/app/build.gradle` | gradle |
| Android | `versionName` | TBD | gradle |

## Build 60 Target

| Platform | Field | New Value | Notes |
|---|---|---|---|
| iOS | `CFBundleVersion` | `60` | match build label |
| iOS | `CFBundleShortVersionString` | `1.1` | minor bump — Sentry + Privacy Manifest + Mic-Plugin warrant marketing-version bump |
| Android | `versionCode` | increment by 1 from current | required by Play Store |
| Android | `versionName` | `1.1` | match iOS |

## Manual Steps (User, after Lovable merge)

1. Open `ios/App/App.xcodeproj` in Xcode.
2. Select **App** target → **General** → bump **Version** to `1.1`, **Build** to `60`.
3. Open `android/app/build.gradle`. Bump `versionCode` and set `versionName "1.1"`.
4. Verify in CI: `grep -r "CFBundleVersion" ios/App/App/Info.plist` shows `60`.
5. Commit with message: `chore(release): bump to v1.1 build 60`.

## Why not edit `Info.plist` automatically?

`CFBundleVersion` in this project is currently a literal string `51`, not a Xcode variable. Auto-editing the plist is safe but the version bump is also coupled to Apple App Store Connect release notes (German + English copy needed). Keeping the bump as a user-controlled step prevents premature submission.
