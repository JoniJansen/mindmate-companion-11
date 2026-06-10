# Build 60 — Engineering Lessons Master-Doc

**Konsolidierung der 3 Build-60-Iteration-Lessons**
**Datum**: 2026-06-10
**Scope**: Drei separate Engineering-Fehler-Klassen entdeckt + gefixt während Build-60-TestFlight-Prep + Build-61-Pipeline-Fix.

---

## Übersicht — Was schief ging und was wir gelernt haben

| Iteration | Symptom | Root Cause | Fix-Commit | Lessons-Doc |
|---|---|---|---|---|
| #1 (gestern Abend) | Build-Fail in Xcode: Files at wrong path | pbxproj — Files nicht als Children der App-PBXGroup registriert | `8356dc4` | Diese Doc, Abschnitt 1 |
| #2 (heute Mittag) | Archive zeigt Version 1.0 (51) statt 1.1 (60) | Info.plist hat hardcoded Versionen (Capacitor-Pattern) statt `$(VARIABLE)` | `9ab2e6d` | `BUILD60_INFOPLIST_HARDCODED_LESSON.md` |
| #3 (heute Nachmittag) | TestFlight Build 60 zeigt altes Verhalten (Mic-Gate trotz Item #1A) | Stale Bundle — `ios/App/App/public/` von 30.05., dist/ nie neu gebaut | `46b0264` | `BUILD60_TESTFLIGHT_BUG_AUDIT.md` Cluster B |

**Gemeinsamer Nenner**: Capacitor-Setup hat **Build-Pipeline-Edge-Cases** die naive Xcode-Workflows nicht abdecken. Pipeline-Hardening ist hoch-leveraged — verhindert Re-Occurrence aller drei Klassen.

---

## Lesson 1 — pbxproj-Group-Membership ist load-bearing

### Was passiert ist

Für Build 60 musste registriert werden:
- `ios/App/App/de.lproj/InfoPlist.strings` (DE-Permission-Texte)
- `ios/App/App/PrivacyInfo.xcprivacy` (Apple Privacy Manifest)

**Erste Version (gestern)**: SHA1-derived UUIDs in `PBXBuildFile`, `PBXFileReference`, `PBXResourcesBuildPhase`, `PBXVariantGroup` — komplette Registrierung, aber **NICHT** als Children der App-PBXGroup.

**Build-Failure**:
```
Build input file cannot be found: '.../ios/App/de.lproj/InfoPlist.strings'
                                              ^^^ should be: ios/App/App/de.lproj/...
```

→ Xcode versuchte Pfad-Resolution via `<group>` sourceTree, fand aber keine PBXGroup die das File als Child hatte → resolvte ab Project-Root (ios/App/) statt App-Group (ios/App/App/).

### Root Cause

Bei `sourceTree = "<group>"` löst Xcode den Pfad **relativ zum PBXGroup-Container** auf, in dem das File als Child gelistet ist. Wenn keine Group das File als Child hat → Fallback auf Project-Root → wrong path.

### Fix (commit `8356dc4`)

Zwei Zeilen in der App-PBXGroup-Children-Liste (504EC3061FED79650016851F):
```
50B271D01FEDC1A000F3C39B /* public */,
+ DB5B4796711073DFF41249FA /* InfoPlist.strings */,
+ 069E4ED96F7C21A119587F97 /* PrivacyInfo.xcprivacy */,
```

### Lesson für Future-File-Registrierungen

**Bei direkten pbxproj-Edits IMMER 5 Stellen registrieren**:
1. `PBXBuildFile` (Compile-Phase-Reference)
2. `PBXFileReference` (File-Metadata)
3. `PBXResourcesBuildPhase` (oder Compile-Phase, je nach File-Type)
4. **`PBXGroup` Children-List** ← häufigster Vergessen-Spot
5. Bei localized Files: `PBXVariantGroup` + `knownRegions`

**Verifikation nach Edit**:
- `plutil -lint ios/App/App.xcodeproj/project.pbxproj` — Syntax
- `xcodebuild -list -project ios/App/App.xcodeproj/` — Schemes resolved?
- `xcodebuild -showBuildSettings ... | grep -i INFOPLIST_PATH` — Path correctly resolved?

**Alternative**: Statt direkten pbxproj-Edits — Xcode-UI "File → Add Files to Project" verwenden. Xcode kümmert sich um alle 5 Registrierungs-Stellen automatisch. Direkter pbxproj-Edit ist nur dann sauber wenn deterministisch reproduzierbar (z.B. CI-Build-Script mit `xcodeproj`-Ruby-Library).

---

## Lesson 2 — Capacitor Info.plist überschreibt pbxproj-Version-Settings

### Was passiert ist

Für Build 60 wurde in `project.pbxproj` gebumpt:
- `MARKETING_VERSION = 1.0 → 1.1` (Debug + Release configs)
- `CURRENT_PROJECT_VERSION = 51 → 60` (Debug + Release configs)

`plutil -lint` grün. `xcodebuild -list` grün.

**Aber Xcode Archive zeigte trotzdem `1.0 (51)`** im Organizer.

### Root Cause

Capacitor-Projects haben Info.plist mit **hardcoded Werten** statt Apple-Standard-Variable-Pattern:

```xml
<!-- Apple-Standard (Variable wird eingesetzt aus pbxproj): -->
<key>CFBundleShortVersionString</key>
<string>$(MARKETING_VERSION)</string>      ← Best Practice

<!-- Capacitor-Pattern (hardcoded String): -->
<key>CFBundleShortVersionString</key>
<string>1.0</string>                       ← Was Soulvay hatte
```

**Resolution-Priorität**: Hardcoded-String in Info.plist **gewinnt** über pbxproj-Build-Setting. Daher waren pbxproj-Bumps **unwirksam** (no-op) für den Archive-Build.

### Fix (commit `9ab2e6d`)

Direkter Edit von `ios/App/App/Info.plist`:
```diff
- <string>1.0</string>      (CFBundleShortVersionString)
+ <string>1.1</string>
- <string>51</string>       (CFBundleVersion)
+ <string>60</string>
```

Plus Audit-Doc `BUILD60_INFOPLIST_HARDCODED_LESSON.md` mit 5 Lessons für Future-Bumps.

### Lesson für Future-Version-Bumps

**Pre-Bump-Check IMMER per PlistBuddy**:
```bash
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/App/App/Info.plist
```

- Wenn Hardcoded-String → Info.plist DIREKT bumpen
- Wenn `$(MARKETING_VERSION)` → pbxproj-Setting bumpen
- Wenn Mix oder unklar → Xcode-UI General-Tab-Bump (kümmert sich um beides)

**Post-Archive-Verifikation IMMER**:
```bash
LATEST=$(ls -dt ~/Library/Developer/Xcode/Archives/*/*.xcarchive | head -1)
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" \
  "$LATEST/Products/Applications/App.app/Info.plist"
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" \
  "$LATEST/Products/Applications/App.app/Info.plist"
```

Erwartet: Soll-Werte. Falls anders → STOP, NICHT uploaden (sonst Reject-Risiko wegen falscher Build-Number).

**Build-62-Backlog**: Migrate Info.plist zu `$(MARKETING_VERSION)`-Variables → einheitlicher One-Source-of-Truth in pbxproj.

---

## Lesson 3 — Stale Bundle Pipeline-Gap

### Was passiert ist

Build 60 wurde heute Mittag (14:01) archived. User-Tests auf iPhone zeigten:
- Mic-Symbol hat Schloss-Icon, klick triggert Premium-Modal
- Aber Code-Analyse (HEAD): Item #1A wirksam, kein Mic-Gate

**Diskrepanz zwischen Code und Runtime.**

### Root Cause

Forensik-Workflow (`wf_7e903390-428`) zeigte:
- `ios/App/App/public/` mtime: 2026-06-09 16:00 (gestern, vor pipeline-Run)
- `dist/` mtime: 2026-05-30 (11 Tage alt zum Archive-Zeitpunkt)
- Vite-Cache: März 2026
- 0 Treffer für `mic_free_attempt`-String im public/-Bundle
- Aber 1 Treffer im Source

→ **`npx cap sync ios` hat ein STALE `dist/` ins public/ kopiert.** `vite build` lief nie zwischen Source-Edits und dem Archive.

### Fix (commit `46b0264`)

```bash
rm -rf dist node_modules/.vite          # Wipe stale cache
bun run build                           # Fresh Vite build (5.13s)
grep -l 'mic_free_attempt' dist/assets/*.js   # Verify Item #1A in dist/
npx cap sync ios                        # Sync dist/ → ios/App/App/public/
grep -l 'mic_free_attempt' ios/App/App/public/assets/*.js   # Verify Item #1A in public/
```

Plus Pipeline-Hardening in `package.json`:
```json
"build:ios": "rm -rf dist && vite build && npx cap sync ios",
"verify:ios": "grep -q 'mic_free_attempt' ios/App/App/public/assets/*.js && echo '✅ Item #1A im Bundle' || (echo '❌ FAIL' && exit 1)"
```

Plus `CFBundleVersion` 60 → 61.

### Lesson für Future-Builds

**GitHub-HEAD ≠ Runtime-Bundle bei Capacitor-Apps.** Zwei separate Code-Stände:
1. GitHub-Repo Code (HEAD)
2. Eingebettetes Bundle in `ios/App/App/public/`

Pre-Archive-Checkliste (Pflicht — siehe `RELEASE.md`):
```bash
bun run build:ios       # Frischer Build + cap sync atomic
bun run verify:ios      # Bundle-Marker-Verifikation
ls -lat ios/App/App/public/assets/*.js | head -3   # mtime visual check
```

**Hard-Marker für Item-#1A im Bundle**: String `mic_free_attempt` (Analytics-Event-Name, wird nicht weg-minified). Source-Kommentare wie "Build 60 #1A" und "STT is FREE" werden beim Minify entfernt — daher NICHT als Verify-Marker geeignet.

---

## Strukturelle Gemeinsamkeiten der 3 Lessons

### Common Pattern: Capacitor-Setup-Edge-Cases

Alle drei Bugs gehen auf **Capacitor-Setup-Pattern** zurück die naive Xcode-Workflows nicht abdecken:

| Lesson | Capacitor-Pattern | Naive Annahme |
|---|---|---|
| 1 | pbxproj manuell editieren (statt Xcode-UI) | Xcode-UI braucht man nicht — pbxproj ist YAML-artig |
| 2 | Info.plist mit hardcoded Versionen | pbxproj-Settings sind Wahrheit |
| 3 | `cap sync` kopiert dist/ unverändert | `cap sync` macht auch `vite build` |

### Common Mitigation: Empirische Verifikation auf File-System-Ebene

Alle drei Bugs ließen sich durch File-System-Inspection vor/nach jedem Schritt entdecken:
- mtime-Vergleiche (`ls -lat`)
- Content-Greps (`grep -l` für Marker-Strings)
- Plist-Reads (`PlistBuddy -c "Print :..."` )

**Code-Analyse + Git-Log alleine sind nicht hinreichend.**

### Common Process: Drei-Ebenen-System (Lovable + Claude Code + User)

| Ebene | Stärke | Schwäche |
|---|---|---|
| Lovable (Code-Worker) | Sauberer Code im HEAD | Sieht nur HEAD, nicht Runtime |
| Claude Code (Investigator) | Tiefe Forensik, Workflow-Spawn | Verlässt sich auf Code-Reading |
| User (Empirie) | Wahrheit über Runtime-Verhalten | Sieht nicht warum |

**Erst alle drei zusammen** brachten die Wahrheit bei jeder der 3 Iterationen. Niemand hätte alleine alle 3 Bugs in unter 24h gefunden.

---

## Cumulative Pipeline-Hardening nach Build 60

| Layer | Was eingebaut | Quelle |
|---|---|---|
| Source-Code | Surgical pbxproj edits + Info.plist edit | Lesson 1, 2 |
| package.json | `build:ios` + `verify:ios` Scripts | Lesson 3 |
| Documentation | 3 Audit-Docs + Master-Doc + `RELEASE.md` | Alle 3 Lessons |
| Process | Pre-Archive-Checkliste in `RELEASE.md` | Lesson 3 |

### Offene Backlog-Items für Build 62+

1. **Migrate Info.plist zu `$(VARIABLE)`-Pattern** (Lesson 2 Follow-up)
2. **Xcode-Run-Script-Phase**: `bun run verify:ios` als Pre-Archive-Hook
3. **CI-Gate**: Release-Gate-Test um Bundle-Inhalts-Check erweitern
4. **Sentry-dSYM-Upload-Pipeline** (Build 61 entdeckt, siehe BUILD60_TESTFLIGHT_BUG_AUDIT.md)
5. **TestFlight-Smoke-Test-Automation** (Detox/Maestro für 5-Min-Healthcheck pre-Apple-Submission)

---

## Meta-Lesson: Engineering-Disziplin in Solo-Founder-Mode

Diese 3 Lessons in 24h zeigen ein robustes Pattern:

1. **Empirisch verifizieren, nicht annehmen.** User-Test schlug Code-Analyse drei Mal.
2. **Lessons mit-committen, nicht nur Code-Fixes.** Audit-Docs verhindern Re-Occurrence.
3. **Multi-Tool-Workflow akzeptieren.** Lovable für Speed, Claude Code für Forensik, User für Empirie — keine Tool-Loyalty.
4. **Pipeline-Hardening hat höchsten ROI.** 10-Min-Investment in `verify:ios` Script verhindert Stunden Debug.
5. **Doc-First wenn unsicher.** Lieber 3 Docs schreiben als 1 Bug ungelöst lassen.

Solo-Founder-Engineering-Niveau erreicht durch Disziplin, nicht durch Genialität.

---

## Connection zu Build-60-Submission-Plan

Diese Lessons sind **nicht** Submission-Blocker. Build 61 ist auf TestFlight, alle 3 Issues sind gefixt + dokumentiert. Submission-Pfad bleibt:

1. Build 61 TestFlight-Test (User auf iPhone, 25-30 Min mit Berater-Checkliste)
2. Bei Test-Success: Push origin/main + Apple-Submission separat planen
3. Bei Test-Bugs: Lovable für Code-Bugs, Pipeline-Tools sind bereit

Pipeline-Hardening macht jeden zukünftigen Build deterministisch — Lesson 1-3 sollten nicht wiederkehren.
