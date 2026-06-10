# BUILD 60 — TestFlight Bug Audit

**Datum**: 2026-06-10
**Build**: 60 (uploaded 14:01-14:16) → ersetzt durch Build 61 (Pipeline-Fix)
**Discovery-Methode**: Empirisch durch User-Test auf TestFlight Build 60 auf iPhone

---

## Cluster-Übersicht

| Cluster | Symptom | Status |
|---|---|---|
| A | Layout/UI-Polish (Avatar, Safe-Area, Tagebuch-Zoom) | TBD nach Build 61 |
| **B** | **Mic-Gate sichtbar trotz Item #1A** | **Root Cause: Stale Bundle. Build 61 Fix.** |
| C-I | Weitere Bugs aus 10-Cluster-Liste | TBD nach Build 61 |

---

## Cluster B — Stale Bundle (Pipeline-Bug)

### Symptom (User-Empirie auf TestFlight Build 60)

User-Report auf iPhone nach Install von Build 60:

| Symbol | Schloss sichtbar? | Klick-Verhalten |
|---|---|---|
| 🎙️ Mikrofon | **JA** | Premium-Modal "Sprachgespräche - Premium-Funktion" |
| 🔊 Lautsprecher | **NEIN** | Premium-Modal kommt trotzdem |

### Erwartetes Verhalten (laut HEAD-Code)

Per Code-Analyse (`src/components/chat/ChatInputBar.tsx` + `src/pages/Chat.tsx`):

- 🎙️ Mikrofon: KEIN Schloss, KEIN Modal (Item #1A: STT ist frei für alle User)
- 🔊 Lautsprecher: MIT Schloss, Modal beim Klick (TTS ist Premium-only)

→ **Realität auf TestFlight Build 60 ist genau umgekehrt** + Lautsprecher zeigt keinen Schloss-Indikator aber triggert trotzdem Modal.

### Root Cause: Stale Bundle (NICHT Code-Bug)

Forensik-Workflow (Run ID `wf_7e903390-428`) hat empirisch bewiesen:

| Datenpunkt | Wert | Bedeutung |
|---|---|---|
| Archive-Zeit | 2026-06-10 13:58:05 (Commit `8356dc4`) | Heute Mittag |
| `ios/App/App/public/` mtime | 2026-06-09 16:00:24 | **22h 40min älter** als Archive |
| `dist/` mtime | 2026-05-30 20:32:40 | **11 Tage alt** zum Archive-Zeitpunkt |
| Vite-Cache mtime | März 2026 | Kein Build seit Monaten |
| Hash | `index-CjpYLKsn.js` (1.001.520 B) in dist/ UND public/ | Byte-identisch |
| `grep mic_free_attempt` im public/JS | **0 Treffer** | Item #1A NICHT im Bundle |
| Item-#1A-Marker im Source | Vorhanden (`Chat.tsx:377`, `useChatVoice.ts:46`) | Source ist korrekt |
| `webDir` in capacitor.config.ts | `dist` | Cap sync kopiert dist/ unverändert |
| `package.json` Build-Pipeline | Nur `vite build` — kein `build:ios` mit cap sync | **Pipeline-Gap** |

→ **Xcode hat Build 60 mit einem Bundle vom 30. Mai (!) archiviert.** Vor dem Archive lief weder `vite build` noch `cap sync ios`. Der React-Code im public/ Bundle war Pre-Item-#1A.

### Warum Code-Analyse fehlschlug

Lovable + Claude Code haben den GitHub-HEAD analysiert. Beide haben blind den Source-Code gelesen, OHNE das eingebettete Runtime-Bundle in `ios/App/App/public/` zu inspizieren. Bei Capacitor-Apps können diese auseinanderlaufen.

User-Empirie auf dem echten Device war die einzige Quelle der Wahrheit.

---

## Fix für Build 61

### Pipeline-Steps (commit `[TBD]`)

```bash
cd /Users/jonathanjansen/soulvay
rm -rf dist node_modules/.vite                    # Wipe stale cache
bun run build                                      # Fresh Vite build
grep -l 'mic_free_attempt' dist/assets/*.js       # Verify Item #1A in dist/
npx cap sync ios                                   # Sync dist/ → ios/App/App/public/
grep -l 'mic_free_attempt' ios/App/App/public/assets/*.js  # Verify Item #1A in public/
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 61" ios/App/App/Info.plist  # Bump
plutil -lint ios/App/App/Info.plist                # Syntax check
```

### Verifikation post-Fix

| Check | Status |
|---|---|
| `dist/` mtime = jetzt | ✅ 2026-06-10 17:04 |
| `ios/App/App/public/` mtime = jetzt | ✅ 2026-06-10 17:05 |
| `grep mic_free_attempt dist/assets/*.js` | ✅ 1 Datei (`index-Dz5QV0ya.js`) |
| `grep mic_free_attempt ios/App/App/public/assets/*.js` | ✅ 1 Datei (`index-Dz5QV0ya.js`) |
| Capacitor plugin discovery | ✅ 3 Plugins: speech-recognition@7.0.1, RevenueCat, Sentry |
| Info.plist `CFBundleVersion` | ✅ 60 → 61 |
| Info.plist `CFBundleShortVersionString` | ✅ 1.1 (unverändert) |
| `plutil -lint` | ✅ OK |

---

## Pipeline-Hardening (gegen Regression)

### Neue package.json Scripts

```json
"build:ios": "rm -rf dist && vite build && npx cap sync ios",
"verify:ios": "grep -q 'mic_free_attempt' ios/App/App/public/assets/*.js && echo '✅ Item #1A im Bundle' || (echo '❌ FAIL: Item #1A NICHT im Bundle' && exit 1)"
```

### Pre-Archive-Checkliste für Build 62+

Pflicht-Steps vor jedem iOS-Archive in Xcode:

```bash
bun run build:ios       # 1. Frischer Build + cap sync
bun run verify:ios      # 2. Bundle-Marker-Verifikation
ls -lat ios/App/App/public/assets/*.js | head -3   # 3. mtime visual check
# Bump CFBundleVersion in Info.plist
# DANN Xcode Archive
```

### Empfohlene Xcode-Integration (Build 62+ Backlog)

Run-Script-Phase in Xcode-Build-Phase vor "Copy Bundle Resources":

```bash
cd "$SRCROOT/../../"
npm run verify:ios || exit 1
```

→ Archive bricht ab wenn Item #1A nicht im Bundle ist.

---

## Lessons Learned

### #1 — GitHub-HEAD ≠ Runtime-Bundle bei Capacitor-Apps

**Bei Capacitor-Apps gibt es zwei separate Code-Stände:**
1. **GitHub-Repo Code** (aktueller HEAD)
2. **Eingebettetes Bundle** in `ios/App/App/public/` (was wirklich in der App läuft)

Diese können auseinanderlaufen wenn `bun run build` + `npx cap sync ios` nicht ordentlich ausgeführt wurden.

### #2 — Empirische Verifikation auf Device ist Königsweg

Code-Analyse + Git-Log sind notwendig, aber NICHT hinreichend. Die einzige Wahrheit über das Verhalten in der gebauten App ist:

```bash
# Verify Item #1A im RUNTIME-Bundle vor Archive
grep "mic_free_attempt" ios/App/App/public/assets/*.js
ls -lat ios/App/App/public/index.html  # Sollte aktuell sein
```

Plus User-Test auf TestFlight-Build mit konkretem Klick-Test.

### #3 — Vite-Cache + Bundle-Hash können hinterrücks stale werden

Stale-Cache-Indikatoren:
- `node_modules/.vite/deps_temp_*` mtime > 7 Tage alt → wipe nötig
- `dist/` mtime ≠ letztes Source-Edit → fresh build nötig
- Hash-Suffix in `dist/assets/index-*.js` identisch über Wochen → Build hat nie wirklich gelaufen

### #4 — `npx cap sync` ist Mittel, nicht Garantie

`cap sync` kopiert NUR `dist/` → `ios/App/App/public/`. Wenn `dist/` stale ist, ist auch das Resultat stale. **`vite build` MUSS vorher laufen.**

→ Daher `build:ios` Script: macht beides atomic.

### #5 — Drei-Ebenen-System (Lovable + Claude Code + User) ist wertvoll

| Ebene | Output bei diesem Bug |
|---|---|
| Lovable (Code-Worker) | "Item #1A im HEAD, kein Mic-Gate" — korrekt für HEAD |
| Claude Code (Investigator) | "Item #1A bestätigt für HEAD" — korrekt für HEAD |
| User (Empirie) | "Auf iPhone sehe ich Mic-Gate" — korrekt für Runtime |

Erst alle drei Perspektiven zusammen brachten die Wahrheit: HEAD korrekt, Runtime falsch, Root Cause Stale Bundle.

### #6 — Pipeline-Bugs sind teurer als Code-Bugs

Code-Bug = 5 Min Edit. Pipeline-Bug = 2 Stunden Forensik + komplettes Re-Build + Re-Upload + User-Re-Test.

→ Investition in `build:ios` Script + verify-Script ist hoch-leveraged. Verhindert Re-Occurrence.

---

## Status nach Pipeline-Fix

| Item | Status |
|---|---|
| `dist/` frisch gebaut | ✅ |
| `ios/App/App/public/` synced + frisch | ✅ |
| Item #1A im Bundle | ✅ |
| `CFBundleVersion` = 61 | ✅ |
| `package.json` build:ios + verify:ios Scripts | ✅ |
| Audit-Doc (dieses File) | ✅ |
| Commit pending | ⏳ |
| Xcode Archive 1.1 (61) pending | ⏳ User |
| TestFlight Upload pending | ⏳ User |
| User-Re-Test auf iPhone pending | ⏳ User |

---

## Connection zu anderen Phasen

- **B1.3 Block 3.1/3.2 (gestern)**: pbxproj Edits + cap sync — Bundle wurde aber NICHT frisch gebaut
- **B1.3 Block 4 (heute Mittag)**: Info.plist hardcoded Issue gefixt (`9ab2e6d`), aber Pipeline-Gap nicht erkannt
- **B1.3 Block 5 (heute Nachmittag)**: Pipeline-Fix für Build 61 (dieser Doc)

Engineering-Reifung: 4 separate Fehler-Klassen über 2 Tage. Alle empirisch entdeckt + sauber gefixt. Engineering-Reifung über mehrere Iterationen ist normal — wichtig ist dass jeder Fehler dokumentiert + Pipeline-gehärtet wird.

---

## Build-62-Backlog

1. **Migrate Info.plist to `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)` variables** (aus Build 60 Lesson)
2. **Xcode-Run-Script-Phase**: `npm run verify:ios` vor Copy-Resources
3. **CI-Gate**: Release-Gate-Test um Bundle-Inhalts-Check erweitern
4. ~~**`RELEASE.md`**: Pre-Archive-Checkliste dokumentieren~~ — ✅ erledigt in Build 61 (siehe `RELEASE.md`)
5. **Build-Cluster A, C-I**: nach Build 61 User-Test priorisieren
6. **Sentry-dSYM-Upload-Pipeline**: dSYM-Warning beim Build 61 Upload — siehe unten

---

## Build 61 — Upload-Status (2026-06-10 17:15-17:25)

### Upload erfolgreich

| Item | Status |
|---|---|
| Xcode Archive | ✅ Erstellt, Version 1.1 (61) |
| Organizer-Anzeige | ✅ "1.1 (61)" bestätigt |
| Distribute App → App Store Connect → Upload | ✅ Erfolgreich |
| Apple-Email | ✅ "Soulvay 1.1 (61) is ready to test on iOS" |
| TestFlight-Processing | ✅ Apple processed in <60 Min |

### dSYM-Warning beim Upload (non-blocking)

**Wortlaut**:
```
Upload Symbols Failed
The archive did not include a dSYM for the Sentry.framework with the
UUIDs [4F5D2992-8CC4-3EAC-83D9-F3544DB4142A]. Ensure that the archive's
dSYM folder includes a DWARF file for Sentry.framework with the
expected UUIDs.
```

**Bedeutung**:
- Apple konnte für `Sentry.framework` keine Debug-Symbols (.dSYM) extrahieren
- Build 61 wurde **trotzdem erfolgreich uploaded** — die Warning ist non-blocking
- Bedeutung für Crash-Reports: Falls Sentry.framework selbst crashed, kann Apple den Stack-Trace nicht symbolizieren (zeigt nur Adressen statt Methoden-Namen). **App-Code-Crashes sind unbetroffen.**

**Root Cause (vermutlich)**:
- `@sentry/capacitor@4.0.0` SPM-Plugin liefert `Sentry.framework` ohne mit-eingebettete dSYMs
- Capacitor-SPM-Setup hat keinen automatischen dSYM-Upload-Pfad zu Sentry oder Apple konfiguriert

**Action für Build 62 (NICHT für Build 61)**:
1. Prüfen ob Sentry-Capacitor-Plugin neuere Version (4.0.1+) dSYMs mit-bundlet
2. Falls nicht: SourceMap-Upload-Script in Xcode-Build-Phase einfügen (Sentry hat offiziellen Wizard: `npx @sentry/wizard@latest -i ios`)
3. Bei nächstem Archive verifizieren: Organizer → Archive auswählen → "Download Debug Symbols" verfügbar?

**Sicherheitscheck Build 61**: ✅ Apple-Validierung lief durch, App ist auf TestFlight, kein Reject-Risiko aus dieser Warning.

### Sentry-Confirmation — Item #0 Native-Test D PASSED

**Sentry-Email-Bestätigung (aus separater Quelle)**:
> "You've sent a few events to Sentry — congrats, you've made great progress in your setup"

**Bedeutung**:
- Sentry-SDK initialisiert sich auf Native-iOS erfolgreich
- Mindestens 1 Event wurde an Sentry-Backend übermittelt
- End-to-End-Pipeline funktioniert: App → Sentry-SDK → Sentry-Backend
- **Item #0 (Native-Crash-Reporting Test D) ist damit empirisch positiv**

**Verbleibender Test für Item #0**:
- Test E: Real-Crash auf Native auslösen + verifizieren dass Sentry-Dashboard Event empfängt (pending iPhone-Test)

### Was Build 61 ändert vs Build 60

| Verhalten | Build 60 (Stale Bundle) | Build 61 (Frisches Bundle) |
|---|---|---|
| Mic-Button Schloss-Icon | JA (Pre-#1A-Code) | KEIN Schloss (#1A wirksam) |
| Mic-Klick | Premium-Modal | Permission-Dialog / Aufnahme startet |
| Lautsprecher-Klick | Premium-Modal | Premium-Modal (korrekt, TTS gated) |
| Layout-Bugs (Cluster A) | Pre-Lovable-Fix-Code | Lovable-Layout-Fixes wirksam |
| Item #1A im Bundle | 0 Treffer (`mic_free_attempt`) | 1 Treffer (verifiziert) |

### Test-Strategie Build 61

User folgt **Option C** (Berater-Empfehlung): Verifikations-Test (15 Min) + Stichproben (10-15 Min) = 25-30 Min.

**11 Tests in 3 Clustern** (siehe Berater-Checkliste):
- A1-A4: Layout-Verifikation
- B1-B2: Mic-Gate-Verifikation (Kernfrage)
- C1-C5: Stichproben (Sentry-Toggle, Dead-Buttons, Sprach-Inkonsistenz, Stimmungs-Filter)

**Erwartung**:
- B1-B2 müssen ✅ sein (Pipeline-Fix sollte Mic-Gate eliminieren)
- A1-A4 müssen ✅ sein (wenn Lovable-Layout-Fixes im Source sind)
- C1-C5: Mix — manche zeigen Bundle-Cache-Artefakte (auto-gefixt), andere bleiben echte Code-Bugs für Lovable

### Verbleibender git-Status nach Phase 2

- Local HEAD: `46b0264` (Pipeline-Fix-Commit)
- Origin: `9ab2e6d` (1 commit behind)
- **KEIN push** bis User-GO nach TestFlight-Test-Success
- Push-Plan: Nach Cluster-Test → falls B1 grün → push origin/main

---

## Build 61 — TestFlight-Test-Resultate (2026-06-10 Abend)

### Test-Strategie und -Methodik

User-Test auf iPhone via TestFlight Build 1.1 (61). Option-C-Strategie (Verifikation + Stichproben, ~25 Min). 11 Tests in 3 Clustern plus offene Empirie.

### Test-Resultate kompakt

**Cluster A — Layout-Stabilität:**

| Test | Ergebnis | Detail |
|---|---|---|
| Start-Screen | ✅ OK | Tageszeit-Begrüßung funktioniert sauber |
| A3 Tagebuch Zoom-Effekt | ⚠️ Teilweise | Stabiler aber "Layout-Probleme manchmal" |
| A4 Tagebuch Mic-Position | ❌ FAIL | Mic unverändert unten, nicht näher am Textfeld |
| Generell-Empfindung | ⚠️ "Fühlt sich wie Internetseite an, nicht wie native App" |
| **NEU** Statusbar beim Scrollen | ❌ FAIL | Seiten "verrutschen", Statusbar-Bereich wird schwarz |
| **NEU** Chat-Header-Tabs | ❌ FAIL | "Frei reden / Klären / Beruhigen / Muster" abgequetscht/schlecht formatiert auf iPhone |

**Cluster B — Native-Mic (HAUPTERFOLG):**

| Test | Ergebnis | Detail |
|---|---|---|
| B1 Mic-Symbol | ✅ **OK** | KEIN Schloss, Aufnahme startet einwandfrei |
| B2 Lautsprecher | ✅ **OK** | MIT Schloss, Premium-Modal "Sprachgespräche" (korrekt gated) |

→ **Pipeline-Fix war wirksam.** Item #1A funktioniert auf Native iOS wie erwartet. Cluster B komplett gefixt.

**Cluster C — Stichproben:**

| Test | Ergebnis | Detail |
|---|---|---|
| C1 Sentry-Consent | ✅ **OK** | Modal "Hilfst du uns, Soulvay stabiler zu machen?" erschien beim Start auf Native iOS |
| C2 "Stresssignale erkennen" Dead Button | ⏳ Nicht erneut getestet | Verbleibt für Build-62-Run |
| C3 Jonas Begrüßung | ❌ FAIL | Weiterhin auf Englisch: *"I'm here to listen. Take your time – share what's on your mind."* — sollte Deutsch sein |
| C4 Settings-Sprache | ⏳ Nicht erneut getestet | Verbleibt für Build-62-Run |
| C5 Stimmung 30-Tage-Filter | ❌ FAIL | Zeigt 90-Tage-Daten statt 30 |

→ **Item #0 Test D (Sentry Native-Crash-Reporting) ist hiermit empirisch PASSED.** C1-Befund auf iPhone bestätigt die Sentry-Confirmation-Email von vorhin. End-to-End-Pipeline (Native iOS → Sentry-SDK → Sentry-Backend) ist funktional.

### Neuer Kritischer Bug (Blocker für App-Store-Submission)

**❌ Soulvay Plus Abo-Flow hängt bei "Abo wird vorbereitet..."**

Reproduktion auf TestFlight Build 61:
1. Settings → Plus entdecken
2. Jahres-Abo wählen
3. AGB-Häkchen setzen
4. Widerruf-Häkchen setzen
5. "Abo wird vorbereitet" klicken
6. **Symptom**: Lädt endlos, kein Abo-Abschluss möglich

**Impact**: BLOCKER für App-Store-Submission von Version 1.1. Build 51 (1.0) ist live aber 1.1 mit neuen Features (Native-Mic, Sentry, Privacy-Manifest) kann nicht released werden ohne funktionierenden Abo-Flow.

Vollständige Diagnose + Hypothesen + Action-Items in `audit/BUILD61_BLOCKER_SUBSCRIPTION_FLOW.md`.

### Build-60 → Build-61 Gefixt-Übersicht

| Was Build 61 gefixt hat | Beweis |
|---|---|
| Mic-Symbol Lock-Icon entfernt auf Native | B1 ✅ |
| Mic-Klick triggert keine Premium-Modal | B1 ✅ |
| Lautsprecher korrekt gated (TTS Premium) | B2 ✅ |
| Sentry-Consent-Modal auf Native iOS | C1 ✅ |
| Sentry-Backend empfängt Events (Item #0 Test D) | Sentry-Confirmation-Email + C1 |
| Tagebuch Zoom-Effekt | A3 ⚠️ teilweise besser |

### Bleibt für Build 62

**Kritisch (Blocker)**:
- ❌ Abo-Flow hängt (siehe separate Doc)

**Hoch (UI-Polish + Compliance)**:
- ❌ Jonas Begrüßung auf Englisch (Sprach-Inkonsistenz)
- ❌ Stimmung-Filter 30-Tage zeigt 90-Tage-Daten
- ❌ Statusbar-Verhalten beim Scrollen (Native-Feel)
- ❌ Chat-Header-Tabs schlechte Formatierung iPhone
- ❌ Tagebuch Mic-Position

**Mittel (Optimierung)**:
- ⚠️ Tagebuch Layout-Probleme manchmal
- ⚠️ Genereller "Internetseite-Look" — tiefere iOS-WebView-Anpassungen nötig

**Verbleibend (nicht erneut getestet)**:
- ⏳ C2 Stresssignale-Dead-Button
- ⏳ C4 Settings-Sprache

### Push-Entscheidung

**B1 ✅ verifiziert** → Pipeline-Fix-Wirksamkeit bestätigt → Pre-Push-Checkliste in `RELEASE.md` durchlaufen → **Push origin/main genehmigt.**

3 Commits werden geleinsam gepusht:
- `46b0264 fix(build): Build 61 pipeline-fix`
- `987649d docs(release): consolidate Build 60 engineering lessons`
- `<NEW> docs: Build 61 test results + Abo-Blocker-Diagnose` (dieser Commit)
