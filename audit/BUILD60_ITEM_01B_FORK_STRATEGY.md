# Build 60 — Item #1B — Fork-Strategie (Phase B0.5)

**Status:** Diagnose-Doku — **NICHT implementiert.** Wartet auf User-GO für Phase B1.0.
**Datum:** 2026-06-08
**Entscheidung CEO:** Pfad B — Fork von `@capacitor-community/speech-recognition` + `Package.swift`-Ergänzung + Upstream-PR-Strategie.
**Begründung:** SPM-Architektur sauber halten · Build 60 enthält Native-Mic · Höchste Korrektheit · Fork-Maintenance akzeptabel.

---

## 0. Vorab — Honest-Check zuerst (Sektion 6 vorgezogen)

Bevor Fork-Aufwand startet, prüfen wir ehrlich: Gibt es einen SPM-nativen Plugin, den Phase B0 übersehen hat?

| Kandidat | npm-Status | SPM? | Eignung |
|---|---|---|---|
| `@capacitor-community/speech-recognition@7.0.1` | ✅ verfügbar, Cap-8-kompatibel | ❌ nur Podspec | Basis für Fork |
| `@capgo/speech-recognition` | ❌ 404 (Phase B0 verifiziert) | — | nicht existent |
| `@capacitor/speech-recognition` (offiziell) | ❌ existiert nicht | — | Ionic-Team hat es nie veröffentlicht |
| `cordova-plugin-speechrecognition` | ✅ Cordova-only | ❌ Cordova-Bridge nötig | Cap-Cordova-Bridge ist deprecated in Cap-8, hoher Integrations-Aufwand, kein SPM-Vorteil |
| `react-native-voice` | ✅ React-Native | ❌ nicht Capacitor | nicht adaptierbar ohne Custom-Plugin |
| `@evehrmann/capacitor-speech-recognition` (Phase B0) | — | unbestätigt | wurde in B0 nicht gefunden, vermutlich Phantom |

**Schlussfolgerung Honest-Check:** Kein echter SPM-nativer Capacitor-Plugin existiert. **Fork bleibt der richtige Weg.** Pfad B nicht zu revidieren.

---

## 1. Fork-Plan

### 1.1 Hosting
- **Empfehlung:** GitHub-Account des Users (`JoniJansen` bzw. der GitHub-Account, mit dem Soulvay-Repo gemanaged wird).
- **Alternativ:** Wenn eine `soulvay` GitHub-Organisation existiert oder angelegt werden soll → Fork dort. Vorteil: bei späterem Team-Wachstum klare Ownership.
- **Sicherheits-Best-Practice:**
  - Fork-Repo **public** (MIT-Lizenz erlaubt es, Community kann profitieren, upstream-PR-Vorbereitung)
  - Branch-Protection auf `main`: Force-Push verbieten, lineare Historie
  - Dependabot aktivieren für `@capacitor/*`-Peer-Deps
  - 2FA auf dem Hosting-Account zwingend
  - **Kein Secret im Repo** (Plugin enthält keine, Standard-Hygiene)

### 1.2 Repository-Name
- **Empfehlung:** `capacitor-speech-recognition-spm`
- Begründung: technisch-deskriptiv, klar als SPM-Variante erkennbar, leichter als Upstream-PR-Kandidat einzureichen als ein soulvay-gebrandeter Name.
- Alternative: `soulvay-speech-recognition` — nur wenn Upstream-PR explizit nicht geplant.
- README muss als **erster Satz** klarstellen: *"This is a fork of [@capacitor-community/speech-recognition](https://github.com/capacitor-community/speech-recognition) with added Swift Package Manager (SPM) support. Upstream PR pending."*

### 1.3 Branch-Strategie
- `main` — Default, enthält Fork mit `Package.swift`. Das ist die Branch, die Soulvay via `bun add github:...` konsumiert.
- `upstream-tracking` — Mirror des Upstream-`master`. Wird via `git fetch upstream && git merge upstream/master` periodisch aktualisiert.
- `feature/spm-support` — Saubere Branch nur mit dem `Package.swift`-Commit, für Upstream-PR (kein Soulvay-spezifischer Code drin).
- `release/*` — Tags pinnen wir nach Soulvays Build-Nummern, z. B. `v7.0.1-spm.1` (semver-Suffix), damit Soulvay deterministisch pinnt statt `#main`.

---

## 2. Package.swift — konkreter Entwurf

**Basis-Fakten (aus Recherche):**
- Sources liegen unter `ios/Plugin/*.{swift,h,m}` (4 Dateien: `Plugin.h`, `Plugin.m`, `Plugin.swift`, `Info.plist`)
- iOS Deployment Target Upstream: `14.0` — Soulvay nutzt `15.0`, wir setzen `.v14` für Kompatibilität
- Swift-Version Upstream: `5.1` — `Package.swift` nutzt `swift-tools-version:5.9` analog zu CapApp-SPM
- Einzige Capacitor-Dependency: `Capacitor` (kein Cordova nötig — Plugin nutzt nur `CAPPlugin`/`CAPPluginCall`)
- Native iOS-Frameworks: `Speech`, `AVFoundation` — sind System-Frameworks, kein `linkedFrameworks`-Eintrag nötig, Swift importiert sie direkt

**Entwurf `Package.swift`** (~35 Zeilen):

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

**Wichtige Hinweise zum Entwurf:**
- `from: "7.0.0"` für `capacitor-swift-pm` — Soulvay nutzt `exact: "8.0.1"`. SPM resolved auf das engere Constraint des Konsumenten, also wird `8.0.1` gewählt. Test in Phase B1.0 verifiziert das.
- `path: "ios/Plugin"` zeigt auf die bestehende Source-Struktur — **kein Verschieben** von Dateien, Upstream bleibt mergebar.
- `exclude: ["Info.plist"]` weil SPM `.plist` sonst als Resource bundlen will und das Plugin keine Resource-Bundle-Identität braucht.
- `publicHeadersPath: "."` macht `Plugin.h` als ObjC-Header sichtbar (für `@objc(CAPSpeechRecognitionPlugin)`-Brücke).
- Kein expliziter Import von `Speech`/`AVFoundation` nötig — Swift-Datei macht das im Source.

**Risiko:** ObjC-Header-Setup mit gemischtem Swift+ObjC im selben Target ist die heikelste Stelle. Falls SPM-Build in Phase B1.0 fehlschlägt mit "header not found", Fallback: `Plugin.h`/`Plugin.m` in einen separaten ObjC-Target splitten. Dokumentation dazu erst, wenn nötig (YAGNI).

---

## 3. Upstream-PR-Strategie

### 3.1 Wahrscheinlichkeit der Annahme
**Hoch — geschätzt 70 %.** Begründung:
- Capacitor-Community-Org migriert Plugins seit Cap-6 systematisch zu SPM (siehe `@capacitor-community/admob`, `@capacitor-community/barcode-scanner` haben SPM-Support).
- Cap-8-Releases (`ionic-team/capacitor-swift-pm`) machen SPM zum empfohlenen Pfad.
- `Package.swift` zusätzlich zur Podspec ist **additive**, bricht Cocoapods-Nutzer nicht.

### 3.2 PR-Qualitäts-Anforderungen
- Kein Build-Skript-Breakage (`npm run verify:ios` muss weiter mit Podspec laufen).
- README-Sektion "Swift Package Manager Installation" ergänzen mit Beispiel-Snippet.
- CI: Falls Upstream GitHub Actions hat, einen Job `verify:ios-spm` ergänzen, der `swift build` ausführt.
- Commit-Message konventional: `feat(ios): add Swift Package Manager support`.
- Branch `feature/spm-support` sauber, kein Soulvay-spezifischer Code.

### 3.3 Timing
1. **Jetzt (Phase B1.0):** Fork bauen, lokal verifizieren, in Soulvay Build 60 integrieren.
2. **Nach Build-60-Submit:** Upstream-PR einreichen mit Link auf reale Production-Nutzung (Soulvay) als Evidenz.
3. **Wenn PR merged:** Soulvay-`package.json` von `github:user/fork#tag` zurück auf `@capacitor-community/speech-recognition@x.y.z` (mit SPM-Release). Fork wird archiviert, Maintenance = 0.
4. **Wenn PR abgelehnt/stagnierend:** Fork bleibt als Long-Term-Maintenance-Branch, siehe §4.

---

## 4. Maintenance-Plan

### 4.1 Sync-Trigger
| Auslöser | Reaktion | SLA |
|---|---|---|
| Upstream-Release auf npm (neuer Tag) | Manueller Check via `npm view @capacitor-community/speech-recognition version` | Quartalsweise |
| Security-Advisory (GitHub Dependabot/Snyk) | Sofort-Sync | < 48 h |
| Capacitor-Major-Bump (Cap 9, Cap 10) | Geplanter Sync inkl. Peer-Dep-Update | Innerhalb 2 Wochen nach Cap-Release |
| Soulvay meldet Plugin-Bug | Upstream-Issue zuerst, dann Fix-Forward im Fork | nach Bedarf |

### 4.2 Sync-Prozess
1. `git remote add upstream https://github.com/capacitor-community/speech-recognition.git`
2. `git fetch upstream && git checkout upstream-tracking && git merge upstream/master`
3. `git checkout main && git merge upstream-tracking` (Konflikte erwartet **nur** in `Package.swift`-Nachbarschaft, sonst clean)
4. SPM-Build verifizieren (`swift build` im Fork-Root)
5. Tag `v<upstream>-spm.<n>` setzen
6. In Soulvay `package.json` Tag bumpen → CI/Build verifizieren

### 4.3 Verantwortung
- **Operativ:** Lovable führt Sync auf Anfrage des Users durch (~1-2 h pro Sync).
- **Reminder:** Quartals-Check-Punkt in `audit/BUILD60_PRE_SUBMIT_CHECKLIST.md` ergänzen (siehe §7).
- **Konflikt-Handling:** Bei nicht-trivialem Merge-Konflikt → STOPP, Diagnose-Doku, User-GO einholen vor Force-Merge.

---

## 5. Implementations-Plan Phase B1

> Schritte werden erst nach **User-GO auf diese Strategie-Doku** ausgeführt.

### B1.0 — Fork-Erstellung & Package.swift
1. User forkt `capacitor-community/speech-recognition` → `<user>/capacitor-speech-recognition-spm` via GitHub-UI (Lovable kann kein GitHub-Repo erstellen — **User-Aktion erforderlich**).
2. User gibt Lovable Fork-URL durch.
3. Lovable bereitet `Package.swift` + README-Patch als Diff-Vorschlag (Text in Audit-Doku, da Lovable nicht ins Fork-Repo schreibt).
4. User committed `Package.swift` + README-Patch auf `main` des Forks (oder gibt Lovable temporär Push-Rechte — sicherheitstechnisch **nicht empfohlen**, besser User pusht).
5. User taggt `v7.0.1-spm.1`.
6. **Verifikation:** `swift build` im Fork-Root muss grün sein. Falls Mac fehlt: Soulvays `npx cap sync ios` in Phase B1.1 ist erster echter Build-Test.

### B1.1 — Soulvay konsumiert Fork
- `bun add github:<user>/capacitor-speech-recognition-spm#v7.0.1-spm.1`
- Vite-/TypeScript-Build muss grün sein.
- `npx cap sync ios` muss Plugin erkennen + `Package.resolved` updaten.
- **STOPP-Punkt:** Wenn SPM-Resolution fehlschlägt → §8 Stop-Bedingung 2 greift.

### B1.2 — Wrapper-Hook
- Neuer File `src/hooks/useNativeSpeechRecognition.ts` als dünner Adapter.
- Thenable-Trap-Mitigation aus Diagnose §3: alle `SpeechRecognition.start()`-Aufrufe in `try/await` kapseln, kein direktes `.then()`-Chaining auf den Plugin-Proxy.
- Integration in `useSpeechRecognition.ts` via Platform-Switch: `isNativeApp() ? useNativeSpeechRecognition() : webSpeechAPI`.

### B1.3 — Native-Config + Manifest
- iOS `Info.plist`: `NSSpeechRecognitionUsageDescription` + `NSMicrophoneUsageDescription` sind bereits gesetzt (verifiziert in B0). Keine Änderung.
- Android `AndroidManifest.xml`: `RECORD_AUDIO` + `<queries><intent>...android.speech.RecognitionService</intent>` ergänzen.
- `capacitor.config.ts`: keine Plugin-Konfiguration nötig.

### B1.4 — Verifikations-Doku
- `audit/BUILD60_ITEM_01B_VERIFICATION.md` analog zu Item #1A: Tests A (Web-Regression unverändert), B (iOS Native-Mic), C (Android Native-Mic), D (Permission-Denial-UX), E (Thenable-Trap-Negativtest).

---

## 6. Alternativen-Bewertung
→ Siehe §0 (vorgezogen). Ergebnis: Fork bleibt richtig.

---

## 7. Konstrukt-Regeln (für diese und folgende Phasen)
- **Diagnose-First:** Diese Doku zuerst, GO einholen, dann Implementation. Gilt für jeden Sub-Schritt B1.0-B1.4.
- **Thenable-Trap-Mitigation:** Pflicht in B1.2, ungetestet kein GO auf B1.3.
- **Build-Stabilität pro Sub-Schritt:** Nach B1.0, B1.1, B1.2, B1.3 jeweils Web-Vite-Build + (sofern Schritt es erlaubt) `cap sync` grün.
- **Pre-Submit-Checkliste erweitern:** Neue Sektion "Native Plugin Fork Tracking" in `audit/BUILD60_PRE_SUBMIT_CHECKLIST.md`:
  - [ ] Fork-Tag in `package.json` gepinnt (kein `#main`)
  - [ ] Upstream-Diff geprüft (`git log upstream-tracking..main`)
  - [ ] Quartals-Sync-Datum dokumentiert
  - [ ] Upstream-PR-Status notiert (open/merged/closed)

---

## 8. Stop-Bedingungen
| # | Bedingung | Aktion |
|---|---|---|
| 1 | User kann/will keinen GitHub-Fork erstellen | STOPP, Pfad C (Verschiebung auf Build 60.5) reaktivieren |
| 2 | `swift build` oder `cap sync ios` erkennt SPM-Plugin nicht | STOPP, ObjC/Swift-Mixed-Target-Fallback dokumentieren, GO einholen |
| 3 | Vite-/TypeScript-Build bricht mit Fork-Konsum (Type-Inkompatibilität) | STOPP, Type-Diff vs. Upstream `dist/esm/index.d.ts` prüfen |
| 4 | `npx cap sync android` erkennt Plugin nicht | STOPP, AndroidManifest-Queries-Block-Diagnose |
| 5 | Thenable-Trap zeigt sich in Smoke-Test (Promise-Resolution-Hang) | STOPP, Mitigation verstärken vor Release |
| 6 | Upstream-Repo wird archiviert/deprecated während Item #1B läuft | STOPP, Fork wird de-facto Hard-Fork — Reputational-Kosten neu bewerten |

---

## Status
- [x] §0 Honest-Check abgeschlossen → Fork bleibt richtig
- [x] §1-§8 Strategie-Doku komplett
- [ ] **User-GO auf diese Doku** ← nächster Schritt
- [ ] Phase B1.0 (Fork-Erstellung) — benötigt User-Aktion (GitHub-Fork-Klick)
- [ ] Phasen B1.1-B1.4
