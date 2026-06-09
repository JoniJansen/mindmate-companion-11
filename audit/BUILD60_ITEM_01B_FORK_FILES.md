# Build 60 — Item #1B — Fork-Files (Phase B1.0)

**Status:** Ready-to-copy Artefakte für User-Push auf Fork.
**Datum:** 2026-06-08
**Pfad:** B1.0-mac (Mac mit Xcode bestätigt)
**Fork-URL:** https://github.com/JoniJansen/capacitor-speech-recognition-spm
**User-GO:** erhalten — Phase B1.0 läuft.

> **Lovable-Rolle in dieser Phase:** Liefert nur Text-Artefakte. **Kein Push, keine Fork-Manipulation, keine Branch-Settings-Änderung.** User pusht selbst via GitHub-Web-Editor.

---

## 1. `Package.swift` — vollständiger Inhalt

**Position im Fork:** Repo-Root (gleiches Verzeichnis wie `package.json` und `CapacitorCommunitySpeechRecognition.podspec`).

**Filename exakt:** `Package.swift` (case-sensitiv, kein `.txt`-Suffix).

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorCommunitySpeechRecognition",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "CapacitorCommunitySpeechRecognition",
            targets: ["CapacitorCommunitySpeechRecognition"]
        )
    ],
    dependencies: [
        .package(
            url: "https://github.com/ionic-team/capacitor-swift-pm.git",
            from: "7.0.0"
        )
    ],
    targets: [
        .target(
            name: "CapacitorCommunitySpeechRecognition",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm")
            ],
            path: "ios/Plugin",
            exclude: ["Info.plist"],
            resources: [],
            publicHeadersPath: "."
        )
    ]
)
```

**Hinweise zur Sicherheit der Vorlage:**
- `swift-tools-version: 5.9` matched Soulvays `CapApp-SPM/Package.swift` → keine Toolchain-Drift.
- `platforms: [.iOS(.v14)]` matched Upstream-Podspec-Deployment-Target → Konsumenten mit höherem Target (Soulvay: 15) überschreiben das ohnehin per Aggregation.
- `from: "7.0.0"` lässt SPM auf das engere `exact: "8.0.1"` aus Soulvays `CapApp-SPM` resolven — verifiziert in B1.1.
- `path: "ios/Plugin"` zeigt 1:1 auf bestehende Upstream-Struktur (`Plugin.h`, `Plugin.m`, `Plugin.swift`, `Info.plist`) — **kein Datei-Move**, Upstream bleibt mergebar.
- `exclude: ["Info.plist"]` verhindert dass SPM die Plist als Resource bundlet.
- `publicHeadersPath: "."` macht `Plugin.h` als ObjC-Bridging-Header sichtbar.

---

## 2. README-Patch

### 2.1 Wo einfügen?

Im aktuellen Upstream-README (`https://github.com/capacitor-community/speech-recognition/blob/master/README.md`) ist die typische Struktur:

```
# @capacitor-community/speech-recognition
<badges>
## Maintainers
## Installation
   npm install ...
   npx cap sync
## Configuration
## Supported methods
...
```

**Zwei Patches:**

**Patch A — Fork-Notice ganz am Anfang** (vor dem `#` H1-Titel, oder direkt nach H1 / vor Badges-Zeile):
- **Begründung:** Erster Eindruck. Jeder, der das Repo öffnet, muss sofort sehen, dass dies ein Fork ist und wo der Upstream liegt.

**Patch B — "Swift Package Manager" Sub-Sektion innerhalb `## Installation`** (direkt nach dem bestehenden `npm install` / `npx cap sync` Block):
- **Begründung:** Konsumenten lesen `## Installation` als Erstes. SPM gehört dort logisch hin, parallel zu npm/Cocoapods.

### 2.2 Patch A — Fork-Notice (direkt nach dem H1 `# @capacitor-community/speech-recognition`)

```markdown
> **⚠️ Fork Notice**
>
> This is a fork of [@capacitor-community/speech-recognition](https://github.com/capacitor-community/speech-recognition) with added **Swift Package Manager (SPM)** support for Capacitor 7+ projects that have migrated away from CocoaPods.
>
> - **Upstream:** https://github.com/capacitor-community/speech-recognition
> - **Upstream PR:** pending (will be linked here once submitted)
> - **Maintained by:** [@JoniJansen](https://github.com/JoniJansen) for the [Soulvay](https://soulvay.com) iOS/Android build.
> - **Goal:** Merge SPM support back upstream — this fork is intended as a temporary bridge.
>
> All other functionality is identical to upstream. Issues unrelated to SPM should be reported on the upstream repository.
```

### 2.3 Patch B — SPM-Installations-Sektion (innerhalb `## Installation`, nach dem bestehenden npm-Block)

```markdown
### Swift Package Manager (Capacitor 7+ with SPM)

If your Capacitor project uses Swift Package Manager instead of CocoaPods
(see [Capacitor SPM migration](https://capacitorjs.com/docs/ios/spm)),
install this fork directly from GitHub:

```bash
npm install github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.1
npx cap sync ios
```

Or with `bun`:

```bash
bun add github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.1
npx cap sync ios
```

`npx cap sync ios` will detect the `Package.swift` and add the plugin as
a Swift Package dependency to your `CapApp-SPM/Package.swift` automatically.

**Android installation is unchanged** — Gradle picks up the plugin the same
way as the upstream package.
```

> ⚠️ **GitHub Markdown-Hinweis:** Der innere ```bash-Block schließt den äußeren ```markdown-Block nicht — beim Einfügen ins README einfach den Inhalt zwischen "### Swift Package Manager…" und dem letzten Satz übernehmen (ohne die äußere ```markdown-Hülle).

---

## 3. Schritt-für-Schritt für User (GitHub-Web-Editor)

### 3.1 `Package.swift` anlegen
1. Fork öffnen: https://github.com/JoniJansen/capacitor-speech-recognition-spm
2. Sicherstellen: Branch-Selector zeigt `master` (Default-Branch des Upstreams).
3. Oben rechts: **Add file** → **Create new file**.
4. Filename-Feld: `Package.swift` (exakt, kein `.txt`).
5. Editor-Inhalt: Block aus Sektion 1 dieses Dokuments 1:1 einfügen.
6. Ganz nach unten scrollen → **Commit message**: `feat(ios): add Swift Package Manager support`.
7. Optional **Extended description**: `Adds Package.swift exposing CapacitorCommunitySpeechRecognition as an SPM target. Sources unchanged. CocoaPods consumers unaffected.`
8. Auswahl: **Commit directly to the `master` branch**.
9. Klick: **Commit new file**.

### 3.2 README.md patchen
1. Im Fork-Root auf `README.md` klicken.
2. Rechts oben: **Stift-Icon** (Edit this file).
3. **Patch A** einfügen: direkt nach der H1-Zeile `# @capacitor-community/speech-recognition`, vor allen Badges/Inhalten.
4. **Patch B** einfügen: scrolle bis `## Installation`, finde den bestehenden `npm install …` / `npx cap sync` Block, füge den SPM-Sub-Block **direkt darunter** ein (vor der nächsten `##` Sektion, typischerweise `## Configuration`).
5. **Preview changes** Tab klicken → visuell prüfen, dass beide Patches korrekt rendern.
6. Scroll runter → **Commit message**: `docs: add SPM installation instructions and fork notice`.
7. **Commit directly to the `master` branch**.
8. Klick: **Commit changes**.

---

## 4. Tag-Erstellung `v7.0.1-spm.1`

1. Fork-Hauptseite → rechte Sidebar → **Releases** (oder direkt: `https://github.com/JoniJansen/capacitor-speech-recognition-spm/releases/new`).
2. Klick: **Create a new release** (bzw. **Draft a new release**).
3. **Choose a tag**: in das Feld `v7.0.1-spm.1` tippen → unten erscheint *"Create new tag: v7.0.1-spm.1 on publish"* → das anklicken.
4. **Target**: `master` (sollte default sein, nach den beiden Commits aus Sektion 3).
5. **Release title**: `v7.0.1-spm.1 — SPM support`
6. **Describe this release** (Body):
   ```
   First SPM-enabled release of the fork.

   - Adds Package.swift (no source changes vs. upstream v7.0.1).
   - README documents SPM installation path.
   - Upstream parity: based on @capacitor-community/speech-recognition v7.0.1.
   - Intended as bridge until upstream PR is merged.
   ```
7. **Set as the latest release** angehakt lassen.
8. Klick: **Publish release**.

> Damit existiert der Git-Tag `v7.0.1-spm.1`, den `bun add github:...#v7.0.1-spm.1` deterministisch auflöst.

---

## 5. Lokale Mac-Verifikation (Pfad B1.0-mac)

Im Terminal (Voraussetzung: Xcode-Command-Line-Tools installiert — bei einem TestFlight-Build-Mac immer der Fall):

```bash
cd ~/Desktop
git clone https://github.com/JoniJansen/capacitor-speech-recognition-spm.git
cd capacitor-speech-recognition-spm
swift build
```

### 5.1 Erwartetes Ergebnis (grün)
```
Fetching https://github.com/ionic-team/capacitor-swift-pm.git
...
Build complete!
```
Dauer: <30s beim ersten Lauf (lädt `capacitor-swift-pm`), <5s bei Re-Builds.

### 5.2 Mögliche Fehler → Mitigations-Pfad

| Symptom | Diagnose | Aktion |
|---|---|---|
| `'Capacitor/Capacitor.h' file not found` o.ä. | Mixed-Swift+ObjC-Header-Issue (§10 der Strategie-Doku) | STOPP, Output an Lovable schicken → Modulemap-Workaround (Option A) bauen |
| `error: target 'CapacitorCommunitySpeechRecognition' must contain only Swift files / mixed sources` | SPM akzeptiert Mixed-Target nicht in dieser Konfig | STOPP, Output an Lovable → ObjC-Subtarget-Split-Plan |
| `the package dependency 'capacitor-swift-pm' requires versions...` | Version-Constraint zu strikt | STOPP, ggf. `from: "7.0.0"` auf `from: "6.0.0"` lockern (klären) |
| `error: unknown package 'capacitor-swift-pm'` | Tippfehler in `Package.swift` | Sektion 1 nochmal 1:1 vergleichen |
| Build hängt >2 Min beim Fetch | Netzwerk/Cache | `swift package reset && swift build` |

Bei jedem Fehler: **vollständigen Terminal-Output kopieren** und in den Chat einfügen — Lovable kann dann gezielt §10-Mitigation triggern, ohne raten zu müssen.

---

## 6. Phase-B1.0-Checkliste

- [ ] Fork existiert: https://github.com/JoniJansen/capacitor-speech-recognition-spm
- [ ] `Package.swift` im Fork-Root committed (Sektion 3.1)
- [ ] README-Patch A (Fork-Notice) committed (Sektion 3.2)
- [ ] README-Patch B (SPM-Installation) committed (Sektion 3.2)
- [ ] Tag `v7.0.1-spm.1` als Release publiziert (Sektion 4)
- [ ] Lokaler `swift build` grün (`Build complete!`) auf User-Mac (Sektion 5)
- [ ] Output (oder Erfolgsmeldung) an Lovable zurückgemeldet
- [ ] → **Bereit für Phase B1.1** (Soulvay konsumiert Fork via `bun add github:...#v7.0.1-spm.1`)

---

## Lovable-Disziplin in dieser Phase
- ❌ **Kein** direkter Push auf den Fork.
- ❌ **Keine** Fork-Account-Manipulation, keine Token-Anforderung.
- ❌ **Keine** Branch-Protection-/Settings-Änderungen.
- ✅ Nur Text-Artefakte (dieses Dokument) — User pusht selbst.
- ✅ Bei Mac-Build-Fehler: §10-Mitigation aus Strategie-Doku, **nach** User-GO.

---

## Status
- [x] Sektionen 1-6 komplett
- [x] Package.swift-Vorlage 1:1 kopierbar
- [x] README-Patches mit klarer Einfüge-Position
- [x] Mac-Verifikations-Pfad mit Fehler-Tabelle
- [ ] **User-Aktion:** Sektionen 3 → 4 → 5 abarbeiten
- [ ] Rückmeldung an Lovable für Phase B1.1

---

# Phase B1.0.2 — `prepare`-Script Fix (v7.0.1-spm.3)

**Status:** Lokal-Build empirisch verifiziert. Patch bereit für User-Push. Soulvay-Re-Install pending.

## 1. Root Cause Recap

`bun add github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.2` installiert das Repo, aber **kein `dist/`** — npm/bun führen bei GitHub-Installs **kein `prepublishOnly`** aus, nur `prepare`. Das Plugin-`package.json` definiert aber nur `prepublishOnly`. Resultat: `main`/`module`/`types` zeigen ins Leere → TS2307 in `nativeSpeech.ts`.

## 2. Lokal-Build-Verifikation (durchgeführt)

```bash
git clone --branch v7.0.1-spm.2 \
  https://github.com/JoniJansen/capacitor-speech-recognition-spm.git /tmp/spm-test
cd /tmp/spm-test
npm install          # 523 packages, 11s — grün
npm run build        # docgen + tsc + rollup — grün
ls dist/             # docs.json, esm/, plugin.cjs.js, plugin.js (+maps)
ls dist/esm/         # index.{js,d.ts}, definitions.{js,d.ts}, web.{js,d.ts}
```

**Ergebnis:** Build-Pipeline (clean → docgen → tsc → rollup) funktioniert out-of-the-box mit `npm install` allein. Keine Mock-Fixes nötig, keine fehlenden devDependencies.

## 3. Aktuelles `scripts`-Block im Fork-`package.json`

```json
"scripts": {
  "verify": "...",
  "verify:ios": "...",
  "verify:android": "...",
  "verify:web": "npm run build",
  "lint": "...",
  "fmt": "...",
  "eslint": "...",
  "prettier": "...",
  "swiftlint": "...",
  "docgen": "docgen --api SpeechRecognitionPlugin --output-readme README.md --output-json dist/docs.json",
  "build": "npm run clean && npm run docgen && tsc && rollup -c rollup.config.mjs",
  "clean": "rimraf ./dist",
  "watch": "tsc --watch",
  "prepublishOnly": "npm run build",
  "release": "commit-and-tag-version"
}
```

**`prepare` fehlt — das ist der einzige Patch.**

## 4. Patch (genau eine Zeile)

In `package.json` der Fork-Wurzel, im `scripts`-Block, **eine neue Zeile** ergänzen (am Ende, vor der schließenden `}`):

**Vorher (letzter Eintrag):**
```json
    "release": "commit-and-tag-version"
  },
```

**Nachher:**
```json
    "release": "commit-and-tag-version",
    "prepare": "npm run build"
  },
```

Begründung:
- `prepare` läuft automatisch nach `npm install` / `bun add` aus Git-Sources
- Ruft das vorhandene `build`-Script (clean → docgen → tsc → rollup) auf
- Keine neuen devDependencies nötig (alle bereits in `devDependencies` vorhanden)
- `prepublishOnly` bleibt für npm-Registry-Publish redundant erhalten — schadet nicht

## 5. User-Push-Anleitung

**Option A — GitHub Web-Editor (5 Min, niedrigste Toolchain-Last):**

1. https://github.com/JoniJansen/capacitor-speech-recognition-spm/blob/master/package.json öffnen
2. Stift-Icon (Edit) klicken
3. Im `scripts`-Block die Zeile `"release": "commit-and-tag-version"` zu `"release": "commit-and-tag-version",` ergänzen (Komma hinzufügen)
4. Direkt darunter neue Zeile: `    "prepare": "npm run build"`
5. Commit-Message: `feat(build): add prepare script for auto-build on git-source install`
6. Commit description (optional):
   ```
   Without this script, `npm install` / `bun add` from GitHub URLs
   skips the build step (only `prepublishOnly` was defined, which
   runs only for registry publishes). Consumers then get a package
   with no dist/ and TS2307 errors. The `prepare` lifecycle hook
   runs after install from git sources and produces dist/ as
   expected by main/module/types fields.
   ```
7. Commit directly to the `master` branch
8. Nach Commit: Release erstellen
   - https://github.com/JoniJansen/capacitor-speech-recognition-spm/releases/new
   - Tag: `v7.0.1-spm.3` (Target: master, latest commit)
   - Title: `v7.0.1-spm.3 — Add prepare script for git-source install`
   - Description: siehe Sektion 7 unten
   - Publish

**Option B — gh CLI lokal (für Power-User):**

```bash
cd /pfad/zu/capacitor-speech-recognition-spm
git pull origin master
# package.json editieren (Komma + neue Zeile, siehe Sektion 4)
git add package.json
git commit -m "feat(build): add prepare script for auto-build on git-source install"
git push origin master
git tag v7.0.1-spm.3
git push origin v7.0.1-spm.3
gh release create v7.0.1-spm.3 --title "v7.0.1-spm.3 — Add prepare script" --notes-file RELEASE_NOTES_spm3.md
```

## 6. Soulvay-Re-Install nach Tag-Veröffentlichung

```bash
bun pm cache rm
bun add github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.3
```

Verifikations-Checks:

| Check | Erwartung |
|---|---|
| `package.json` Dependency | `"github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.3"` |
| `node_modules/.../dist/` existiert | ✅ (vorher: fehlt) |
| `node_modules/.../dist/esm/index.js` | enthält Plugin-Registrierung |
| `node_modules/.../dist/esm/index.d.ts` | Type-Declarations vorhanden |
| `node_modules/.../ios/Plugin/` | nur `Info.plist`, `Plugin.swift`, `Package.swift` (Pure-Swift bleibt) |
| TypeScript-Compile (Harness) | grün, kein TS2307 mehr |
| `nativeSpeech.ts` Import | resolved cleanly |
| Vite-Build (Harness) | grün, Plugin nicht im Web-Bundle (kein Import-Pfad lädt es) |

## 7. Release-Notes für v7.0.1-spm.3

```markdown
# v7.0.1-spm.3 — Add prepare script for git-source install

## What's New

Adds a `prepare` script to `package.json` so that `npm install` / `bun add`
from a GitHub URL automatically builds the `dist/` output.

## Why

The package's `main`, `module`, and `types` fields point to `dist/...`,
but `dist/` is gitignored. Previously only `prepublishOnly` triggered
the build, which runs only on `npm publish` — not on git-source installs.
Consumers installing via `bun add github:JoniJansen/...#tag` therefore
got a package with no compiled output and TypeScript module resolution
errors (TS2307).

The `prepare` lifecycle hook runs automatically after install from git
sources (and before publish), producing the expected `dist/` tree.

## Includes

- All changes from v7.0.1-spm.2 (Pure-Swift `CAPBridgedPlugin` migration,
  SPM Package.swift, no Plugin.m/h)
- One-line addition: `"prepare": "npm run build"` in `scripts`

## Verification

Locally cloned, ran `npm install && npm run build` — produced clean
`dist/{esm,plugin.js,plugin.cjs.js,docs.json}`. No devDependency
changes required.

## Consumer install

    bun add github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.3

After install, `node_modules/@capacitor-community/speech-recognition/dist/`
should exist and TypeScript imports should resolve.
```

## 8. Stop-Bedingungen NACH Re-Install

- `dist/` fehlt trotzdem → `prepare` hat nicht gefeuert; bun-spezifisches Issue prüfen, Fallback: `postinstall` als zusätzlicher Hook
- TS2307 bleibt → Cache nicht geleert, oder Tag nicht gepusht
- Neue Compile-Errors aus Plugin-Code → STOPP, Plugin-API hat sich gegenüber Snapshot geändert
- Vite-Build bricht weil Plugin im Web-Bundle landet → Tree-Shaking-Issue, separater Brief

## 9. Was nach Phase B1.0.2 wartet

Sobald v7.0.1-spm.3 installiert und TS-Compile grün:
- `src/lib/nativeSpeech.ts` ist bereits geschrieben (Phase B1.1 Schritt 2) und wird automatisch valide
- GO für Schritt 3 (`useSpeech.ts` Selector-Hook)
