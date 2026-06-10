# BUILD60 — Info.plist Hardcoded Version Lesson Learned

**Datum**: 2026-06-10
**Phase**: B1.3 Block 4 (TestFlight-Build-Vorbereitung)
**Diskovery-Methode**: Empirisch durch Xcode Organizer der `1.0 (51)` für heutigen Archive zeigte trotz pbxproj-Bumps auf `1.1` / `60`

---

## Was passiert ist

### Erwartung (gestriges Setup)

Per `audit/BUILD60_VERSIONING.md` (Lovable) sollten zwei Bumps gemacht werden:
- **iOS**: `MARKETING_VERSION` (1.0 → 1.1) + `CURRENT_PROJECT_VERSION` (51 → 60)
- **Android**: `versionName` ("1.0" → "1.1") + `versionCode` (43 → 44)

User-Berater + Claude Code entschieden für **direkten pbxproj-Edit** (statt Xcode-UI):
```
Commit 61db6c4 — chore(release): Build 60 — version bump to v1.1 + register native resources
ios/App/App.xcodeproj/project.pbxproj:
    CURRENT_PROJECT_VERSION = 51 → 60 (Debug + Release configs)
    MARKETING_VERSION = 1.0 → 1.1 (Debug + Release configs)
```

`plutil -lint` grün. `xcodebuild -list` grün (alle 7 Schemes resolved). Commit gepushed.

### Tatsächlicher Befund (heute, in Xcode)

User machte `Product → Archive` in Xcode. Archive wurde erstellt: `App 10.06.26, 14.01.xcarchive` um `2026-06-10 14:01:23`.

Aber **Organizer zeigte für den neuen Build: "1.0 (51)"**, NICHT "1.1 (60)".

CLI-Verifikation der `.xcarchive`:
```bash
PlistBuddy -c "Print :CFBundleShortVersionString" "App 10.06.26, 14.01.xcarchive/Products/Applications/App.app/Info.plist"
→ 1.0   ❌ (sollte 1.1)
PlistBuddy -c "Print :CFBundleVersion" "..."
→ 51    ❌ (sollte 60)
```

Plus Archive-Outer-Info.plist (`<archive>/Info.plist`):
```xml
<key>CFBundleShortVersionString</key>
<string>1.0</string>
<key>CFBundleVersion</key>
<string>51</string>
```

→ **Der Archive enthielt komplett die alten Versionsnummern**, obwohl pbxproj auf 1.1 / 60 gesetzt war.

---

## Root Cause

### Capacitor-Setup-Pattern

`ios/App/App/Info.plist` hat **hardcoded Werte** für die Version-Keys, statt Xcode's Standard-Variable-Pattern:

```xml
<!-- Hat hardcoded Werte (Capacitor-Pattern): -->
<key>CFBundleShortVersionString</key>
<string>1.0</string>        ← HARDCODED
<key>CFBundleVersion</key>
<string>51</string>         ← HARDCODED

<!-- Andere Keys nutzen Variables (Apple-Standard-Pattern): -->
<key>CFBundleExecutable</key>
<string>$(EXECUTABLE_NAME)</string>       ✅
<key>CFBundleIdentifier</key>
<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>   ✅
<key>CFBundleName</key>
<string>$(PRODUCT_NAME)</string>          ✅
```

### Build-Resolution-Priorität

Xcode's Build löst Info.plist-Werte so auf:
1. **Wenn Info.plist eine `$()` Variable hat** → Build-Setting aus pbxproj (z.B. `MARKETING_VERSION = 1.1`) wird eingesetzt
2. **Wenn Info.plist einen hardcoded String hat** → Hardcoded-Wert "gewinnt", pbxproj-Setting **wird ignoriert**

Daher waren die gestern committed Edits an `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` (in `project.pbxproj`) **unwirksam** für den Archive-Build.

### Warum Lovable's Doku Recht hatte

`audit/BUILD60_VERSIONING.md` sagte explizit:

> *"`CFBundleVersion` in this project is currently a literal string `51`, not a Xcode variable."*

> *"Auto-editing the plist is safe but the version bump is also coupled to Apple App Store Connect release notes..."*

> *"Manual Steps (User, after Lovable merge): 1. Open `ios/App/App.xcodeproj` in Xcode. 2. Select **App** target → **General** → bump **Version** to `1.1`, **Build** to `60`."*

Xcode's General-Tab-Bump **editiert direkt `Info.plist`** (das ist der "natürliche" Pfad in einem Capacitor-Project). Hätten wir das gemacht, wäre Info.plist auf 1.1 / 60 gesetzt + Archive hätte korrekte Werte.

---

## Korrektur (Commit `[hash TBD nach Archive-Success]`)

### Edit

```diff
- <key>CFBundleShortVersionString</key>
- <string>1.0</string>
- <key>CFBundleVersion</key>
- <string>51</string>
+ <key>CFBundleShortVersionString</key>
+ <string>1.1</string>
+ <key>CFBundleVersion</key>
+ <string>60</string>
```

Plus `plutil -lint` grün (Syntax-Check).

### Verifikation (post-fix)

| Check | Status |
|---|---|
| `PlistBuddy "Print :CFBundleShortVersionString"` | 1.1 ✅ |
| `PlistBuddy "Print :CFBundleVersion"` | 60 ✅ |
| `plutil -lint` | OK ✅ |
| Xcode Archive zeigt im Organizer | (pending User-Archive-Retry) |

---

## Welche Edits gestern wirksam waren

| Edit | Datei | Effective? |
|---|---|---|
| `versionCode 43 → 44` | `android/app/build.gradle` | ✅ Ja — Android nutzt build.gradle direkt |
| `versionName "1.0" → "1.1"` | `android/app/build.gradle` | ✅ Ja |
| `MARKETING_VERSION = 1.1` | `ios/App/App.xcodeproj/project.pbxproj` (Debug + Release) | ❌ Nein — von hardcoded Info.plist überschrieben |
| `CURRENT_PROJECT_VERSION = 60` | `ios/App/App.xcodeproj/project.pbxproj` (Debug + Release) | ❌ Nein — gleicher Grund |
| `CFBundleShortVersionString: 1.0 → 1.1` | `ios/App/App/Info.plist` | ✅ Ja (heutiger Fix) |
| `CFBundleVersion: 51 → 60` | `ios/App/App/Info.plist` | ✅ Ja (heutiger Fix) |

→ Die pbxproj-Bumps sind **technisch redundant** (no-op), aber **harmlos** (sie schaden nicht). Können drin bleiben — werden in Build 61 (Variables-Migration) plötzlich wirksam.

---

## Build-61-Backlog-Item

### "Migrate Info.plist to Xcode-Standard-Variable-Pattern"

**Goal**: Future Version-Bumps via einfachen pbxproj-Edit (oder Xcode-UI-General-Bump) wirksam machen.

**Konkret**:
```xml
<key>CFBundleShortVersionString</key>
<string>$(MARKETING_VERSION)</string>     ← war: hardcoded "1.1"
<key>CFBundleVersion</key>
<string>$(CURRENT_PROJECT_VERSION)</string>   ← war: hardcoded "60"
```

**Effekt**: pbxproj's `MARKETING_VERSION = 1.1` und `CURRENT_PROJECT_VERSION = 60` werden dann beim Build eingesetzt → konsistentes One-Source-of-Truth-Pattern.

**Test nach Migration**:
1. pbxproj: bump `MARKETING_VERSION 1.1 → 1.2`
2. Clean + Archive
3. PlistBuddy zeigt: 1.2 ✅

**Aufwand**: 2-Line-Edit in Info.plist + Test-Build verifizieren. ~10 Min.

**Priorität**: Build 61 oder Build 60.5 (post-Submit-Cleanup). NICHT in Build 60 (Build-Druck, plus heutiger Direkt-Fix funktioniert).

---

## Lessons Learned für Future-Bumps

### 1. Bei Capacitor-Projects: **IMMER Info.plist DIREKT prüfen**

Vor Versions-Bump:
```bash
PlistBuddy -c "Print :CFBundleShortVersionString" ios/App/App/Info.plist
PlistBuddy -c "Print :CFBundleVersion" ios/App/App/Info.plist
```

Wenn Hardcoded-String → Info.plist DIREKT bumpen.
Wenn `$(VARIABLE)` → pbxproj-Setting bumpen.

### 2. Empirische Verifikation NACH Archive

Nicht der Erwartung trauen — Archive-Inhalt CHECKEN:
```bash
PlistBuddy -c "Print :CFBundleShortVersionString" \
  ~/Library/Developer/Xcode/Archives/<latest>/Products/Applications/App.app/Info.plist
```

→ Sollte Soll-Wert zeigen. Falls nicht: Capacitor-Hardcoded-Pattern check.

### 3. Xcode Organizer ist die Wahrheit

Vor TestFlight-Upload: Im Organizer **die angezeigten Versions-Nummern verifizieren**. Wenn Organizer falsche Version zeigt → NICHT uploaden (sonst Apple-Reject wegen falscher Build-Number / wegen "Build-Number muss höher als bisheriger sein").

### 4. Audit-Docs auch zitieren wenn sie was sagen

`audit/BUILD60_VERSIONING.md` hatte explizit auf das Hardcoded-Pattern hingewiesen. Wir haben es übersehen und sind den theoretisch-saubereren pbxproj-Pfad gegangen. Doku zu vertrauen statt zu eigenen Annahmen — Engineering-Disziplin.

### 5. **Lovable's Strategy-Doku-Wert**

`BUILD60_VERSIONING.md` war richtig. Hat uns aber 2 Stunden Debug-Time gekostet weil wir es übersehen haben. Lessons für Future-Phases: **vor Action immer die einschlägige Strategy-Doku lesen.**

---

## Connection zu anderen Phasen

- **B1.3 Block 3.1 (gestern Abend)**: pbxproj Version-Bumps gemacht (no-op, aber committed in 61db6c4)
- **B1.3 Block 3.2 (gestern Abend)**: pbxproj File-Registrations (Localization + PrivacyInfo) — funktionierte initially nicht wegen App-Group-children-Missing → gefixt heute in `8356dc4`
- **B1.3 Block 4 (heute)**: Info.plist hardcoded Issue entdeckt + gefixt (dieser Doc)

Engineering-Reifung: 3 separate Fehler-Klassen heute & gestern. Alle empirisch entdeckt + sauber gefixt. Engineering-Reifung über mehrere Iterationen ist normal.

---

## Status nach Edit

- Working tree: 1 modified file (`ios/App/App/Info.plist`)
- Pending Action: User-Archive-Retry in Xcode
- Pending Commit: nach Archive-Success
- Pending Audit-Doc-Commit: dieses File mit-committen

User-Berater + Claude Code sequence:
1. User macht Cmd+Shift+K + Archive in Xcode (5-15 Min Wartezeit)
2. Organizer-Verifikation: Build 1.1 (60) ✓
3. CLI-Verifikation des Archive-Inhalts: PlistBuddy zeigt 1.1 + 60
4. Bei beiden grün: Commit (Info.plist + dieses Audit-Doc atomic)
5. Block A.4 — TestFlight-Upload via Organizer
