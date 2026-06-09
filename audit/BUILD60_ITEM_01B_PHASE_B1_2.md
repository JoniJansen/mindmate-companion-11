# Build 60 — Item #1B Phase B1.2: Native-Manifest + capacitor.config

**Status:** ✅ Code-seitig komplett. Ready for Phase B1.3 (User-Mac-Operationen).

## Bereich 1 — iOS Permissions

### Info.plist (EN, main)
**Status:** Existierte (alte, generische Strings) → **aktualisiert** auf CEO-approved warmer Wording.

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Soulvay uses the microphone for voice input in chats and journal entries. Audio is processed on your device and via Apple's speech recognition.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>Soulvay uses speech recognition to transcribe your voice into text for chats and journaling. Recognition happens via Apple's on-device speech engine.</string>
```

### de.lproj/InfoPlist.strings (DE)
**Status:** Verzeichnis existierte nicht → **neu angelegt**.

```
"NSMicrophoneUsageDescription" = "Soulvay nutzt das Mikrofon für Spracheingaben in Chats und Tagebucheinträgen. Die Audio-Verarbeitung erfolgt auf deinem Gerät und über Apples Spracherkennung.";
"NSSpeechRecognitionUsageDescription" = "Soulvay nutzt Spracherkennung, um deine Stimme für Chats und Tagebucheinträge in Text umzuwandeln. Die Erkennung läuft über Apples geräteinternen Sprachdienst.";
```

**Verifikation:** `xml.etree.ElementTree.parse('Info.plist')` → OK.

**Hinweis für Phase B1.3:** Das neue `de.lproj/InfoPlist.strings` muss in Xcode ins App-Target als Resource aufgenommen werden (drag&drop in Project Navigator, "Copy items if needed" ✅, Target Membership: App ✅). Sonst wird die DE-Lokalisierung im Bundle nicht ausgeliefert.

## Bereich 2 — Android Manifest

**Datei:** `android/app/src/main/AndroidManifest.xml`

**Status:**
- `RECORD_AUDIO` permission → **neu hinzugefügt**
- `<queries>` block für `android.speech.RecognitionService` → **neu hinzugefügt** (Android 11+ Package-Visibility-Pflicht)
- Kein bestehender `<queries>`-Block → kein Merge-Konflikt

**Diff:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<queries>
    <intent>
        <action android:name="android.speech.RecognitionService" />
    </intent>
</queries>
```

**Verifikation:** XML valid.

## Bereich 3 — capacitor.config.ts

**Status:** `plugins`-Block existierte mit SplashScreen/StatusBar/Keyboard. **SpeechRecognition-Sektion ergänzt**, bestehende Configs unangetastet.

```ts
SpeechRecognition: {
  // No specific configuration needed — plugin uses platform defaults
}
```

**Verifikation:** TypeScript-Compile wird durch Harness verifiziert.

## Bereich 4 — Build-Number-Konvention

**KEIN Touch von Build-Numbers.** Aktueller State dokumentiert:

| Platform | Field | Current | Target Build 60 |
|---|---|---|---|
| iOS | `CFBundleVersion` | `51` | `60` (User in Xcode) |
| iOS | `CFBundleShortVersionString` | `1.0` | unverändert |
| Android | `versionCode` | `43` | `44` oder analog `60` (User in build.gradle) |
| Android | `versionName` | `1.0` | unverändert |

Siehe auch: `audit/BUILD60_VERSIONING.md` (bestehende Referenz, gültig).

## Phase B1.3 — Next Steps (User-Mac)

1. `git pull` aktuellen Stand
2. `bun install` (Fork v7.0.1-spm.4 + Lock konsistent halten)
3. `bun run build`
4. `npx cap sync ios && npx cap sync android`
5. **Xcode:** `de.lproj/InfoPlist.strings` ins App-Target ziehen falls noch nicht Resource
6. **Xcode:** Build Number 51 → 60 setzen (Build-Settings, nicht direkt Info.plist)
7. **build.gradle:** `versionCode 43` → `44` (oder `60`)
8. iOS-Simulator-Test: Mic-Permission-Dialog erscheint mit DE-Text (Gerät auf DE)
9. Android-Emulator-Test: Mic-Permission + SpeechRecognizer-Service verfügbar
10. TestFlight-Archive

## Verifikations-Matrix

| # | Bereich | Status |
|---|---|---|
| A | iOS Info.plist Permissions aktualisiert | ✅ |
| B | iOS de.lproj/InfoPlist.strings angelegt | ✅ |
| C | iOS Plist XML valid | ✅ |
| D | Android RECORD_AUDIO permission | ✅ |
| E | Android `<queries>` Block | ✅ |
| F | Android Manifest XML valid | ✅ |
| G | capacitor.config.ts SpeechRecognition Block | ✅ |
| H | Keine Build-Number-Änderung in Source-Files | ✅ |
| I | Keine Touch von useSpeech/nativeSpeech/Konsumenten | ✅ |

**Closure:** Item #1B ist code-seitig 100% komplett. Restlich nur noch Mac-Operationen (Phase B1.3).
