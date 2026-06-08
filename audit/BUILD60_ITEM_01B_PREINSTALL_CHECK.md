# Item #1B Pre-Install-Check

**Datum:** 2026-06-08
**Modus:** Read-only. Keine Installation, kein Code-Change, kein `cap sync`.
**Quellen:** npm Registry (live), GitHub Repo, lokale Repo-Configs.

---

## Primary: `@capacitor-community/speech-recognition`

| Feld | Wert |
|------|------|
| Aktueller Release (`latest`) | **7.0.1** |
| Release-Datum | **2026-01-29** (~4 Monate alt → gesund) |
| Peer Dependency | `@capacitor/core: >=7.0.0` |
| Cap-8-Kompatibilität (semver) | **✅ Ja** — `>=7.0.0` akzeptiert `^8.0.1` |
| Cap-8-Kompatibilität (real-world) | **Wahrscheinlich**, aber **nicht explizit getestet** in Plugin-Release-Notes. Plugin wurde 2026-01-29 released → Cap 8 war damals bereits live, also vermutlich darauf entwickelt. |
| Maintenance | **Aktiv** — capacitor-community org, viele Maintainer (45+), kontinuierliche Versions-Releases v5 (2023) → v6 (2024) → v7 (2026) |
| Repository | https://github.com/capacitor-community/speech-recognition (127 ⭐, 67 forks) |
| Lizenz | **MIT** ✅ |
| `dist-tags` | `latest: 7.0.1`, `dev: 5.0.0-dev...`, `next: 5.0.0-0` |
| Open Issues Cap-8-spezifisch | Keine kritischen Cap-8-Blocker auf Repo-Frontpage erkennbar. Vor Install: gezielter Issue-Such-Pass auf "capacitor 8" / "cap 8" empfohlen. |

**Bewertung: GRÜN für Primary-Wahl.**

---

## Backup: `@capgo/speech-recognition`

| Feld | Wert |
|------|------|
| npm Registry | **404 Not Found** — Paket existiert nicht unter diesem Namen |

**Konsequenz:** Backup-Annahme aus `BUILD60_ITEM_01B_DIAGNOSIS.md` war ungenau. `@capgo` publiziert viele Capacitor-Plugins, aber **keines** für Speech-Recognition. Kein echtes Backup verfügbar.

Echte Alternativen falls Primary fällt:
1. **Fork von `@capacitor-community/speech-recognition`** — selbst patchen für Cap 8 (Worst Case).
2. **Eigenes Custom-Capacitor-Plugin** — Swift `SFSpeechRecognizer` + Kotlin `SpeechRecognizer` Bridge (Aufwand ~3-5 Tage).
3. **Verschiebung auf Build 60.5** — Free-Tier startet ohne Native-Mic.

---

## Target-Konflikte

| Achse | Soulvay aktuell | Plugin-Anforderung | Konflikt |
|-------|----------------|--------------------|----------|
| iOS Deployment Target | **15.0** (`project.pbxproj` + `Package.swift` `.iOS(.v15)`) | iOS 13+ (typisch für SFSpeechRecognizer) | **✅ Keiner** (15 > 13) |
| Android `minSdkVersion` | **24** (`android/variables.gradle`) | API 22+ (SpeechRecognizer), Offline-STT ab API 33 | **✅ Keiner** (24 > 22). Offline-Modus erst ab Android 13. |
| Capacitor Core | `^8.0.1` | `>=7.0.0` | **✅ Keiner** |
| Capacitor iOS Bridge | `^8.0.1` | implizit (folgt core) | **✅ Keiner** |
| Capacitor Android Bridge | `^8.0.1` | implizit | **✅ Keiner** |

**Bewertung: Alle Targets konfliktfrei.**

---

## iOS-Distribution-Modell-Hinweis (NEU, nicht in Original-Diagnose)

Soulvay nutzt **Swift Package Manager** (SPM), nicht CocoaPods:
- `ios/App/CapApp-SPM/Package.swift` deklariert Capacitor via SPM
- Kein `Podfile` im Projekt
- Capacitor 8 unterstützt offiziell SPM via `capacitor-swift-pm`

**Implikation für Plugin-Install:**
- `@capacitor-community/speech-recognition@7.0.1` muss SPM-kompatibel sein (nicht nur Pod). Capacitor 7+ Plugins haben SPM-Support eingeführt — sehr wahrscheinlich vorhanden, aber **vor Install verifizieren**: `Package.swift` im Plugin-Repo prüfen.
- Falls Plugin nur Pod-basiert: Migration auf `xcode-add-spm-dep` oder Switch des Projekts auf hybriden Pod-Mode wäre nötig (mittlerer Aufwand).

**Verifikations-Schritt vor Install (10 Min):**
```bash
curl -s https://raw.githubusercontent.com/capacitor-community/speech-recognition/master/Package.swift
# → existiert → SPM-Support gegeben
# → 404 → nur Pod, Action nötig
```

---

## Bundle-Size-Impact (geschätzt)

| Komponente | Größe (Schätzung) |
|------------|-------------------|
| JS-Bundle (gezipped) | ~3-5 KB (dünne Wrapper-Layer) |
| iOS native code | ~20 KB (Swift), nutzt OS-eigenes `SFSpeechRecognizer` (kein eigenes SDK) |
| Android native code | ~30 KB (Kotlin/Java), nutzt OS-eigenes `android.speech.SpeechRecognizer` |
| **Gesamterhöhung App-Binary** | **< 100 KB** |
| Web-Bundle Impact | < 5 KB gzipped (nur Type-Definitions + Web-Stub) |

**Bewertung: Vernachlässigbar.** Kein externes SDK, nur Bridge zu OS-APIs.

---

## Alternative-Optionen (falls Primary doch fällt)

| Option | Aufwand | Risiko |
|--------|---------|--------|
| **A. Fork & Patch** Primary-Plugin für Cap 8 | 1-2 Tage | Maintenance-Burden für uns |
| **B. Custom Capacitor Plugin** (Swift + Kotlin Bridge) | 3-5 Tage | Voll-Eigenverantwortung, aber maximale Kontrolle |
| **C. Verschiebung auf Build 60.5** | 0 Tage | Free-Tier-Wert-Lücke bleibt |
| **D. Web-API auch im WKWebView versuchen** | 1 Tag Recherche | iOS 14.5+ WKWebView blockt `SpeechRecognition`-API → Sackgasse bestätigt |

Empfehlung Fallback-Reihenfolge: A → B → C. D ist verifiziert tot.

---

## Empfehlung

**✅ GO für Implementation mit `@capacitor-community/speech-recognition@7.0.1`.**

Begründung:
- Cap-8-kompatibel via semver-Range
- Aktiv gewartet (letzter Release < 6 Monate)
- Keine Target-Konflikte (iOS 15, Android API 24)
- MIT-Lizenz
- Bundle-Impact < 100 KB
- Maintainer-Community ist die offizielle Capacitor-Community-Org

**Voraussetzungen vor `bun add`:**
1. **10-Min-SPM-Verifikation** (siehe oben) — bestätigen, dass Plugin `Package.swift` mitbringt.
2. **GitHub-Issues-Quick-Scan** auf "capacitor 8" / "cap 8" — falls offene Showstopper-Issues, briefen.
3. **Item #0 (Sentry) live** — bestätigt ✅. Native-Bugs nach Install werden in Sentry sichtbar.

---

## Stop-Bedingungen — Status

| Stop-Bedingung aus Original-Diagnose | Status |
|--------------------------------------|--------|
| Beide Plugins nicht Cap-8-kompatibel | **❌ Nicht eingetreten** — Primary kompatibel |
| iOS Deployment Target Konflikt > +2 Versionen | **❌ Nicht eingetreten** — iOS 15 > 13 |
| Android `minSdkVersion` Konflikt | **❌ Nicht eingetreten** — API 24 > 22 |
| Plugin-Maintenance stagniert > 12 Monate | **❌ Nicht eingetreten** — letzter Release 2026-01-29 |
| Item #0 nicht vor #1B live | **❌ Nicht eingetreten** — Sentry verifiziert |

**Alle Stop-Bedingungen clear.**

---

## Nächster Schritt

User-GO einholen → dann §9 aus `BUILD60_ITEM_01B_DIAGNOSIS.md` schrittweise abarbeiten, beginnend mit der 10-Min-SPM-Verifikation als Schritt 9.0 (vor 9.1 `bun add`).

## Was NICHT gemacht wurde (Compliance mit Read-only)

- Kein `bun add` / `npm install`
- Keine Code-Änderungen
- Kein `npx cap sync`
- Keine Manifest-Edits
- Keine Hook-Erstellung
