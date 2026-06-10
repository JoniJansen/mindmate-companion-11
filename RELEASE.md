# Soulvay iOS Release Checklist

Pre-Archive-Checkliste für TestFlight-Builds. **Pflicht für jeden iOS-Build ab Build 61.**

Eingeführt nach Build 60 Stale-Bundle-Incident (siehe `audit/BUILD60_ENGINEERING_LESSONS_MASTER.md` Lesson 3).

---

## Quick-Reference (5-Min-Build)

```bash
cd /Users/jonathanjansen/soulvay

bun run build:ios        # 1. Fresh build + cap sync atomic
bun run verify:ios       # 2. Bundle-Marker check (muss ✅ Item #1A im Bundle sagen)

# 3. Version-Bump in Info.plist (z.B. 61 → 62)
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 62" ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/App/App/Info.plist
plutil -lint ios/App/App/Info.plist

# 4. Xcode → Cmd+Shift+K → Product → Archive

# 5. Organizer → verify Version + Build → Distribute App
```

---

## Detailed Pre-Archive Checklist

### Phase 1 — Source-State Verify

```bash
git status                                  # Working tree clean?
git log --oneline -5                        # Latest commits sind in Build?
git diff --stat HEAD~5 HEAD                 # Was hat sich geändert?
```

**Gate**: Working tree muss clean sein oder explizit-staged Files für diesen Build.

### Phase 2 — Fresh Build (Pflicht)

```bash
# Wipe stale cache
rm -rf dist node_modules/.vite

# Fresh Vite build
bun run build
```

**Gate**: Build muss in <30s erfolgreich durchlaufen. Bei Errors → fix Source-Code, nicht Build überspringen.

### Phase 3 — Bundle-Marker-Verifikation

```bash
# Item #1A marker (Mic frei für alle User)
grep -l 'mic_free_attempt' dist/assets/*.js

# Sentry-Init marker (Crash-Reporting aktiv)
grep -l 'Sentry.init\|@sentry' dist/assets/*.js | head -1

# RevenueCat marker (Premium-Subscriptions aktiv)
grep -l 'configurePurchases\|purchases-capacitor' dist/assets/*.js | head -1
```

**Gate**: Alle 3 Marker müssen mindestens 1 Treffer haben. Bei 0 Treffer → Feature ist nicht im Bundle, NICHT archivieren.

### Phase 4 — Capacitor Sync

```bash
npx cap sync ios
```

**Erwartete Output-Zeilen**:
- `✔ Copying web assets from dist to ios/App/App/public in <Nms>`
- `[info] Found <N> Capacitor plugins for ios:` (sollte enthalten: speech-recognition, RevenueCat, Sentry)
- `✔ update ios in <Nms>`
- `[info] Sync finished in <Ns>`

**Gate**: Sync muss erfolgreich sein + alle erwarteten Plugins discovered.

### Phase 5 — Runtime-Bundle-Verifikation

```bash
# mtime visual check — muss frisch sein (Sekunden bis Minuten alt)
ls -lat ios/App/App/public/assets/index-*.js | head -3

# Item #1A im Runtime-Bundle (nicht nur Source!)
bun run verify:ios

# Hash-Match dist/ ↔ public/ (sollte identisch sein nach cap sync)
ls dist/assets/index-*.js
ls ios/App/App/public/assets/index-*.js
```

**Gate**: `bun run verify:ios` muss `✅ Item #1A im Bundle` ausgeben. Hash-Match zwischen dist/ und public/.

### Phase 6 — Version-Bump

```bash
# Aktueller Stand
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/App/App/Info.plist

# Bump
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion <NEW_BUILD_NUMBER>" ios/App/App/Info.plist
# Bei Major/Minor-Bump auch CFBundleShortVersionString:
# /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString 1.2" ios/App/App/Info.plist

# Verify
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/App/App/Info.plist
plutil -lint ios/App/App/Info.plist
```

**Gate**:
- `CFBundleVersion` höher als bisheriger App-Store-Build (sonst Apple-Reject)
- `plutil -lint` muss `OK` ausgeben

### Phase 7 — Xcode Archive

In Xcode:

1. **File → Close Workspace** (Cmd+Ctrl+W) wenn Project bereits offen war
2. **Reopen**: `open ios/App/App.xcodeproj`
3. **Warten** bis Indexing fertig (oben rechts in Xcode)
4. **Clean Build Folder**: Cmd+Shift+K
5. **Product → Archive**

**Erwartete Dauer**: 5-15 Min auf MacBook Pro M-Series.

### Phase 8 — Archive-Verifikation (Pflicht vor Upload)

```bash
LATEST=$(ls -dt ~/Library/Developer/Xcode/Archives/*/*.xcarchive 2>/dev/null | head -1)
echo "Archive: $LATEST"

# Version-Check
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" \
  "$LATEST/Products/Applications/App.app/Info.plist"
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" \
  "$LATEST/Products/Applications/App.app/Info.plist"

# Item #1A im Archive-Bundle
grep -l "mic_free_attempt" \
  "$LATEST/Products/Applications/App.app/public/assets/"*.js 2>/dev/null
```

**Gate**:
- Version + Build matchen Info.plist
- Item #1A grep findet 1+ Treffer
- Bei Mismatch → STOP, NICHT uploaden, root-cause-Analyse

### Phase 9 — Distribute App

In Xcode Organizer:

1. Archive auswählen
2. **Distribute App** klicken
3. Flow: App Store Connect → Upload → Automatically manage signing → Upload
4. Apple validiert + uploaded (1-5 Min)
5. **Bestätigung**: "Upload Successful"

### Phase 10 — Post-Upload-Hygiene

```bash
# Audit-Doc updaten mit Build-Number + Datum
# Commit lokalen Stand
git status
git add ios/App/App/Info.plist audit/<aktuelle-doc>
git commit -m "release: Build <N> uploaded to TestFlight"

# KEIN push bis User-Re-Test bestätigt Build funktioniert
```

---

## Häufige Failure-Modes + Recovery

### Failure: `bun run verify:ios` sagt `❌ FAIL: Item #1A NICHT im Bundle`

**Diagnose**:
```bash
# Ist Marker im Source vorhanden?
grep -rn "mic_free_attempt" src/ 2>/dev/null

# Wurde fresh build gemacht?
ls -lat dist/assets/index-*.js | head -3
ls -lat ios/App/App/public/assets/index-*.js | head -3
```

**Fix**:
- Source fehlt Marker → Item #1A wurde aus Code entfernt, Bug
- Build veraltet → `rm -rf dist node_modules/.vite && bun run build:ios`

### Failure: Archive zeigt Pre-Bump-Version im Organizer

**Diagnose**: Capacitor Info.plist hat hardcoded Version (Lesson 2).

```bash
grep -A 1 "CFBundleVersion\|CFBundleShortVersionString" ios/App/App/Info.plist
```

**Fix**: Direkten Info.plist-Edit per PlistBuddy (Phase 6 oben). NICHT auf pbxproj-Bumps verlassen.

### Failure: Build Failed — "input file cannot be found"

**Diagnose**: pbxproj-File-Reference ohne PBXGroup-Children-Eintrag (Lesson 1).

```bash
# Check: ist das Phantom-File in der App-PBXGroup-Children-Liste?
grep -A 10 "504EC3061FED79650016851F /\* App \*/ = {" ios/App/App.xcodeproj/project.pbxproj
```

**Fix**: File-UUID zur App-PBXGroup-Children-Liste hinzufügen (commit `8356dc4` als Referenz).

### Failure: Sentry dSYM Upload Warning

**Wortlaut**: `Upload Symbols Failed - The archive did not include a dSYM for the Sentry.framework with the UUIDs [...]`

**Bedeutung**: Non-blocking. Build geht durch. Aber: Sentry-Framework-eigene Crashes nicht symbolizierbar.

**Fix für Build 62+**:
1. Sentry-Wizard ausführen: `npx @sentry/wizard@latest -i ios`
2. Oder manuell: SourceMap-Upload-Script in Xcode-Build-Phase einfügen

---

## Pre-Push-Checkliste (nach TestFlight-Test-Success)

Pipeline-Fix-Commits werden ERST gepusht nachdem User-Re-Test auf iPhone die Bug-Fixes verifiziert hat.

```bash
# Lokal-Status
git status
git log --oneline origin/main..HEAD       # Commits ahead of origin?

# Push nur wenn User-GO explizit
git push origin main
```

**Gate**: User-GO required. Push wäre fatal wenn TestFlight-Test bestätigt dass Fix NICHT wirkt.

---

## Build-62-Backlog-Items

1. **Migrate Info.plist zu `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)`** — One-Source-of-Truth-Pattern (Lesson 2 Follow-up)
2. **Xcode-Run-Script-Phase**: `cd $SRCROOT/../.. && bun run verify:ios || exit 1` vor "Copy Bundle Resources"
3. **CI-Gate**: `src/test/release-gate.test.ts` um Bundle-Inhalts-Check erweitern
4. **Sentry-dSYM-Upload-Pipeline**: Wizard-Setup für automatischen dSYM-Upload
5. **TestFlight-Smoke-Test**: Detox/Maestro für 5-Min-Healthcheck pre-Apple-Submission

---

## Audit-Doc-References

| Doc | Was abgedeckt |
|---|---|
| `audit/BUILD60_INFOPLIST_HARDCODED_LESSON.md` | Lesson 2 detailliert |
| `audit/BUILD60_TESTFLIGHT_BUG_AUDIT.md` | Cluster B (Stale Bundle) + Build 61 Status |
| `audit/BUILD60_ENGINEERING_LESSONS_MASTER.md` | Konsolidierte 3 Lessons |
| `RELEASE.md` (diese Doc) | Pre-Archive-Checkliste |

---

**Letzte Aktualisierung**: 2026-06-10 (nach Build 61 Pipeline-Fix-Iteration)
