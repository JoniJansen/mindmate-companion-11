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

## Lesson 4 — Layout-Native-Feel: Safe-Area-Padding reicht nicht

### Was passiert ist

Build 61 enthielt Lovable-Layout-Fixes für mehrere Cluster-A-Symptome (Tagebuch-Zoom, Avatar-Sichtbarkeit, Abo-Seite-Statusbar). User-Test auf TestFlight Build 61 zeigte:

| Was Build 61 fixen sollte | Resultat |
|---|---|
| Tagebuch Zoom-Effekt beim Tippen | ⚠️ Teilweise besser — "manchmal Layout-Probleme" |
| Avatar-Sichtbarkeit | ✅ OK (Start-Screen sauber) |
| Statusbar beim Scrollen | ❌ NEU FAIL — Seiten "verrutschen", schwarzer Statusbar-Bereich |
| Chat-Header-Tabs | ❌ NEU FAIL — "Frei reden / Klären / Beruhigen / Muster" abgequetscht/schlecht formatiert |
| Generelles Look-and-Feel | ⚠️ "Fühlt sich wie Internetseite an, nicht wie native App" |

### Root Cause

**Safe-Area-Padding (CSS `env(safe-area-inset-*)`) reicht nicht** für ein iOS-Native-Look-and-Feel auf Capacitor-Apps.

Was Capacitor-Apps brauchen die nur mit CSS-Safe-Area schwer zu erreichen sind:
1. **Statusbar-State während Scrolling**: iOS-Native-Apps lassen die Statusbar bei Scroll-Verhalten dynamisch transparent/opaque werden (mit Background-Match). WebView-Default ist statisch.
2. **Tab-Bar Native-Layout**: Tab-Komponenten in WebView werden als HTML rendered, brauchen sehr genaue CSS-Anpassung an iOS-System-Defaults (Höhe, Padding, Schrift, Active-State).
3. **Bounce-Scrolling und Pull-Refresh**: Native-iOS hat Bounce + Pull-Refresh out-of-box. WebView-Default ist gestoppt.
4. **Keyboard-Behavior**: Native iOS verschiebt Input automatisch oberhalb Tastatur. WebView braucht expliziten `ResizeMode`-Setup in Capacitor-Config + JS-Listener.
5. **System-Tap-Highlight**: Native-iOS hat subtilen Tap-Highlight. WebView hat default-`-webkit-tap-highlight-color` der oft falsch aussieht.

### Was Build 62 braucht (Tiefere iOS-WebView-Anpassungen)

```css
/* Bessere Tap-Behavior */
* { -webkit-tap-highlight-color: transparent; }

/* Bounce-Scrolling enabled */
html, body { overscroll-behavior-y: auto; -webkit-overflow-scrolling: touch; }

/* iOS-System-Font-Stack */
body { font-family: -apple-system, BlinkMacSystemFont, ...; }
```

Plus Capacitor-Config-Edit (`capacitor.config.ts`):
```typescript
{
  ios: {
    contentInset: 'always',          // Status-Bar overlay
    scrollEnabled: true,
    backgroundColor: '#...',         // Match-Color für Statusbar-Background
    // Plus StatusBar-Plugin für dynamic State-Management
  }
}
```

Plus Status-Bar-Plugin: `@capacitor/status-bar` mit `setStyle(...)` + `setBackgroundColor(...)` Calls bei Route-Changes.

### Lesson für Build 62 Layout-Aufträge

**Anders als der erste Lovable-Auftrag (CSS Safe-Area-Padding) erfordert "Native-Feel" mehrere Layer**:

1. **CSS-Layer**: Safe-Area, Tap-Highlight, Font-Stack, Overflow-Behavior
2. **Capacitor-Config-Layer**: contentInset, StatusBar-Plugin, Keyboard-Plugin
3. **Component-Layer**: Tab-Components mit iOS-spezifischem Styling
4. **JS-Layer**: Status-Bar-State-Management bei Route-Changes

Layout-Bugs auf Native sind oft **Layer-übergreifend**. Ein CSS-Fix alleine reicht nicht — die Capacitor-Config + Plugin-Calls müssen mit-fixed werden.

→ **Build-62-Lovable-Aufträge sollten Layout-Bugs in Schichten formulieren**, nicht "fix dieses CSS-Detail".

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

## Lesson 9 — App Store Connect Subscription-Approval-Chain

Apple-Guideline 3.1.1: Subscriptions können nicht approved werden bevor ein Binary existiert das die IAPs kaufbar macht.

**Circular Dependency**:
- Build braucht Subscription-Setup
- Subscription-Setup braucht Build mit funktionalen IAPs

**Lösung**:
1. Build mit funktionalen IAPs hochladen
2. ASC neue App-Version-Submission anlegen
3. Subscriptions mit Build verknüpfen
4. Apple reviewed Build + Subscriptions gemeinsam
5. Bei Erfolg: "Cleared for Sale"

**Wichtigste strategische Erkenntnis**:
Solo-Founder dürfen nicht annehmen "App ist live" = "Monetization funktioniert". Beides muss separat verifiziert werden.

**Solo-Founder-Pre-Marketing-Checklist**:
- [ ] App ist im App Store erhältlich
- [ ] Subscriptions sind "Cleared for Sale"
- [ ] Echter Sandbox-Kauf mit Test-Account verifiziert
- [ ] RevenueCat zeigt aktive Customer-Sessions

**Soulvay-Fall**: Build 59 ist live, aber Subscriptions sind nicht "Cleared for Sale" → Build 63 ist erster Binary der Guideline-3.1.1 erfüllen kann.

---

## Lesson 10 — Selektives git add bei Multi-File-Audit-Verzeichnissen

**Vorfall** (2026-06-10 Abend): `git add audit/` hat 26 Files mit-committet (`b22a4be`) wo nur 2 explizit angefragt waren. Inklusive `.claude_local_backup`-Files die conventional als "lokal-only" markiert sind.

**Regel**:
- **IMMER selektiv**: `git add audit/SPECIFIC_FILE.md` oder `git add path/to/file.ext`
- **NIEMALS directory-wide** bei Multi-File-Verzeichnissen mit Mixed-Content
- Bei Audit-Trail-Verzeichnissen die Local-Backups oder Tool-Artefakte enthalten könnten: **Single-File-Adds erzwingen**

**Anti-Pattern**:
```bash
git add audit/        # Fügt alle 26 Files hinzu inkl. Backups
git add src/          # Fügt unwillkürlich alle Source-Files hinzu
git add .             # Worst case — fügt alles hinzu
```

**Pattern**:
```bash
git add audit/BUILD64_APPLE_REVIEW_FIXES.md \
         audit/BUILD61_BLOCKER_SUBSCRIPTION_FLOW.md \
         audit/BUILD60_ENGINEERING_LESSONS_MASTER.md
```

**Wenn versehentlich passiert**:
- Soft-Revert via `git rm <files> + commit + push` (history bleibt sichtbar, kein force-push)
- `.gitignore`-Eintrag für Tool-Artefakte hinzufügen (z.B. `audit/*.claude_local_backup`)
- **NIEMALS force-push** ohne explizite User-Genehmigung (history-destructive)

**Prävention für Build 64+**:
- Pre-Commit-Hook der bei `git add audit/` warnt und um Bestätigung fragt
- Konvention im RELEASE.md festschreiben

---

## Lesson 11 — Bundle-grep ist Pflicht vor "Fix done" Declaration

**Vorfall** (Build 64, 2026-06-10 ~20:00): Lovable hat einen Apple-Review-Fix in `src/components/topics/TopicDetail.tsx` gemacht. File-Edit war korrekt im Source. Aber:

- TopicDetail.tsx hat 0 Importer in der Codebase
- Vite tree-shaked die File aus dem Production-Bundle
- Fix-Marker `journal_prompt` war 0 Treffer im Bundle
- Echter Step-Handler war in `src/pages/Topics.tsx` (`handleStepAction`)

**Hätte Apple-Reject mit Guideline 2.1 ausgelöst.** Empirie-Check via Bundle-grep hat den Wais-Patch rechtzeitig entdeckt.

**Regel**: Source-Code-Edit ist NICHT hinreichend. **Bundle-grep für distinctive Fix-Marker** ist Pflicht-Verifikation vor "Fix done".

**Solo-Founder-Pre-Submit-Check (verbindlich ab Build 65)**:

1. **Source-Edit done** ✅
2. **Bundle-grep für distinctive Fix-Marker** ≥ 1 Treffer ✅
   - Wähle einen Marker der charakteristisch + nicht-minifiable ist (z.B. Analytics-Event-Name, lokalStorage-Key, hardcoded UI-String)
   - Pattern: `grep -l "MARKER" ios/App/App/public/assets/*.js`
3. **Bei Apple-Review-relevanten Fixes**: empirische TestFlight-Verifikation auf iPhone
4. **Bei Tree-Shaking-Risiko-Files** (Components ohne klaren Importer): Vor Patch checken `grep -rln "ComponentName" src/`

**Anti-Pattern**:
- "Lovable hat die richtige File gefunden, also ist's gefixt" → Wais-Patch-Risiko
- "Source kompiliert ohne Fehler" → Tree-Shaking versteckt Fehler
- "Audit-Doc sagt 'fix applied'" → Doc-Drift vs Bundle-Realität

**Pattern für Future-Fixes mit AI-Agents**:
```bash
# 1. Vor Patch: ist die File überhaupt im aktiven Code-Pfad?
grep -rln "FileName\|from.*path/to/FileName" src/

# 2. Source-Edit
# 3. Build
bun run build:ios

# 4. Bundle-grep für distinctive Marker
grep -l "distinctive_marker" ios/App/App/public/assets/*.js
# Muss ≥ 1 Treffer haben

# 5. Bei 0 Treffer: STOP — Fix ist im Bundle nicht vorhanden, Wais-Patch-Risiko
```

**Strategische Erkenntnis**: Bei Vite/React/Capacitor-Apps gibt es 3 separate Code-Welten:
- Source (`src/**`) — was Mensch + AI editieren
- Dist (`dist/**`) — was Vite kompiliert (tree-shaking, minify, code-split)
- Bundle (`ios/App/App/public/**`) — was wirklich auf dem Device läuft

Diese sind nicht synonym. Bundle ist Wahrheit.

---

## Connection zu Build-60-Submission-Plan

Diese Lessons sind **nicht** Submission-Blocker. Build 61 ist auf TestFlight, alle 3 Issues sind gefixt + dokumentiert. Submission-Pfad bleibt:

1. Build 61 TestFlight-Test (User auf iPhone, 25-30 Min mit Berater-Checkliste)
2. Bei Test-Success: Push origin/main + Apple-Submission separat planen
3. Bei Test-Bugs: Lovable für Code-Bugs, Pipeline-Tools sind bereit

Pipeline-Hardening macht jeden zukünftigen Build deterministisch — Lesson 1-3 sollten nicht wiederkehren.
