# Item #1B — Mic-Input Free (Native): Diagnose

**Datum:** 2026-06-05  
**Status:** Diagnose (read-only). Kein Plugin-Install, keine Manifest-Änderung.  
**Scope:** iOS-Native + Android-Native Speech-to-Text für Free + Premium.

---

## 1. Aktueller Zustand (bestätigt durch Drift-Check 2026-06-05)

- `package.json`: **kein** `@capacitor-community/speech-recognition` installiert.
- `capacitor.config.ts`: keine `SpeechRecognition`-Plugin-Konfig.
- `ios/App/App/Info.plist`: `NSMicrophoneUsageDescription` + `NSSpeechRecognitionUsageDescription` **deklariert**, aber im Native-Build effektiv ungenutzt (Web-API wird auf Native nicht erkannt).
- `android/app/src/main/AndroidManifest.xml`: nur `INTERNET`. Kein `RECORD_AUDIO`, kein `POST_NOTIFICATIONS`, keine Network-Security-Config.
- `src/hooks/useSpeechRecognition.ts`: nutzt `window.SpeechRecognition` / `webkitSpeechRecognition` → `isSpeechSupported=false` auf WKWebView (iOS-Native) und meistens auch Android-WebView.
- Konsequenz: Mic-Button rendert auf Native-App **nicht** (`{isSpeechSupported && (...)}` in `ChatInputBar.tsx` Zeile 56). App-Store-User sehen #1A-Free-Feature heute nicht.

---

## 2. Plugin-Auswahl

| Plugin | Cap-Version | iOS | Android | Maintenance | Lizenz | Empfehlung |
|--------|-------------|-----|---------|-------------|--------|------------|
| **`@capacitor-community/speech-recognition`** | Cap 6/7/8 (Repo-Branches) | SFSpeechRecognizer | `android.speech.SpeechRecognizer` | aktiv (Issues binnen Wochen) | MIT | **Primär** |
| `@capgo/speech-recognition` | Cap 6+ | SFSpeechRecognizer | Android SpeechRecognizer | Single-Maintainer, kommerziell | MIT | Backup |
| Eigen-Plugin via Capacitor-Custom | manuell | volle Kontrolle | volle Kontrolle | hoher Wartungsaufwand | — | NEIN |

**Empfehlung:** `@capacitor-community/speech-recognition` (offiziell der Capacitor-Community-Org).

**Caveats vor Install zu prüfen:**
- Cap-8-Kompatibilität (wir nutzen `@capacitor/core ^8.0.1`). Aktueller Release explizit Cap-8-tagged? Falls nur Cap-7 → entweder `@capgo`-Fork oder auf Plugin-Cap-8-Release warten.
- iOS-min-Target: Plugin fordert i.d.R. iOS 13+. Soulvay-Target prüfen in `ios/App/Podfile` (Annahme: ≥ 14).
- Android `minSdkVersion`: Plugin nutzt offline-Recognition ab API 33; ältere fallen auf Online-Google-Service zurück (Network-Permission ohnehin vorhanden).

---

## 3. Init-Pattern + Thenable-Trap-Analyse (kritisch)

**Plugin-API (Auszug):**
```ts
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

await SpeechRecognition.checkPermissions();      // Promise<{ speechRecognition: PermissionState }>
await SpeechRecognition.requestPermissions();    // dito
await SpeechRecognition.available();             // Promise<{ available: boolean }>
await SpeechRecognition.start({ language, partialResults: true, popup: false, prompt: "" });
SpeechRecognition.addListener("partialResults", cb);
await SpeechRecognition.stop();
```

**Thenable-Trap-Risiko:**
- Die Plugin-Methoden sind echte `Promise`-Returns (nicht Plugin-Proxy direkt). Kein Bug-Trigger analog `useRevenueCat.ts`-Build-59-Fall.
- ABER: `addListener` gibt synchron einen `PluginListenerHandle` zurück — **NICHT awaiten**. Wenn ein Wrapper das fälschlich tut, erzeugt das den gleichen Bug-Typus.
- Mitigation: Wrapper-Pattern mit expliziter Typisierung:

```ts
// src/lib/nativeSpeech.ts (Skizze, nicht implementieren)
import { Capacitor } from "@capacitor/core";

export const isNativeSpeech = () => Capacitor.isNativePlatform();

export async function nativeStart(...): Promise<void> { ... }
export function nativeOnPartial(cb): PluginListenerHandle { /* sync return */ }
```

→ Explizite Return-Types verhindern, dass TS einen Thenable-Cast einschleicht.

---

## 4. Permission-Flow End-to-End

### iOS (SFSpeechRecognizer + AVAudioSession)

1. Erste `SpeechRecognition.requestPermissions()`-Aufruf triggert **zwei** System-Dialoge nacheinander:
   - Mikrofon → Text aus `NSMicrophoneUsageDescription`:  
     *"Soulvay uses your microphone for voice-based conversations with your AI companion."*
   - Speech-Recognition → Text aus `NSSpeechRecognitionUsageDescription`:  
     *"Soulvay uses speech recognition to transcribe your voice messages to your companion."*
2. **DE-Übersetzung fehlt** in `Info.plist`. Apple liefert die englischen Strings auch DE-Usern aus. **Empfehlung:** `InfoPlist.strings` (de.lproj) ergänzen, sonst Inkonsistenz mit Strict-German-Policy.
3. Denial-Pfad: Plugin wirft `{ speechRecognition: "denied" }` → unser Code triggert `mic_permission_denied` + Toast "Mikrofon-Zugriff verweigert" + Hinweis-Sheet "In Einstellungen aktivieren" (Deep-Link `App.openSettings()`).
4. Background-Modes: **NICHT** aktivieren. Audio-Background wäre Reject-Risiko (Guideline 2.5.4). STT läuft nur foreground.

### Android (android.speech.SpeechRecognizer)

1. Manifest erweitern:
   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <queries>
     <intent>
       <action android:name="android.speech.RecognitionService" />
     </intent>
   </queries>
   ```
   `<queries>` ist auf Android 11+ Pflicht, sonst sieht das App-Package den Recognition-Service nicht.
2. Runtime-Request: `SpeechRecognition.requestPermissions()` triggert System-Dialog mit OS-Standardtext (kein App-Custom-Text möglich).
3. Denial-Pfad analog iOS.
4. `POST_NOTIFICATIONS` (Android 13+) und Network-Security-Config **opportunistisch** mit aufnehmen (siehe §10).

---

## 5. Web-Fallback-Architektur

```
useSpeechRecognition (current)        → Web (window.SpeechRecognition)
useNativeSpeechRecognition (NEU)      → Native (Plugin-Wrapper)
useSpeech() (NEU, dünner Selector)    → wählt per Capacitor.isNativePlatform()
```

**Migrationsregel:** `useChatVoice.ts` ruft nur `useSpeech()` auf. Beide Sub-Hooks exponieren identische Surface:
```ts
{ isSupported, isListening, transcript, start(), stop(), error }
```

`isSpeechSupported` in `ChatInputBar.tsx` Zeile 56 bleibt unverändert — der neue Hook liefert `true` auch auf Native (sobald Plugin geladen + `available()` truthy).

---

## 6. Apple-Re-Review-Bewertung

| Punkt | Bewertung |
|-------|-----------|
| Neue SDK (Plugin nutzt Apple-Framework, kein externes SDK) | Geringes Risiko |
| `NSSpeechRecognitionUsageDescription` jetzt **effektiv** genutzt | Review-Notes anpassen: "Build 60 introduces on-device speech-to-text for free users" |
| Guideline 5.1.1 (Account-Required für Kernfunktion) | **Eingehende Prüfung:** Mic-Feature ist im Free-Tier verfügbar. Da Account zur Nutzung des Chats sowieso nötig ist (RLS), kein neuer Konflikt. Aber: Falls Apple-Reviewer das Mic in Demo-Mode ohne Account testet (Landing-Demo), muss das funktionieren oder klar gegated sein. |
| Guideline 2.5.4 (Background Audio Missbrauch) | Nicht relevant — keine `audio` Background-Mode. |
| Privacy Manifest (`PrivacyInfo.xcprivacy`) | Erweitern um `NSPrivacyCollectedDataTypes: AudioData` falls Audio-Buffer an Server geht. **Hier:** Plugin verarbeitet on-device, keine Audio-Übertragung → vermutlich keine Eintragung. Im Diagnose-Schritt vor Submit final klären. |
| App-Store-Listing | Marketing-Text "Spracheingabe kostenlos" erst **nach** erfolgreicher Native-Verifikation aktualisieren. |

**Re-Review-Risiko gesamt: niedrig-mittel.** Vorbereitung: Review-Notes-Snippet entwerfen, Demo-Account-Hinweis ergänzen.

---

## 7. Test-Matrix (für spätere Implementation)

| Plattform | Free | Premium | Permission-Granted | Permission-Denied | Offline |
|-----------|------|---------|--------------------|--------------------|---------|
| Web Chrome | ✓ | ✓ | ✓ | ✓ | n/a |
| Web Safari macOS | ✓ | ✓ | ✓ | ✓ | n/a |
| iOS Safari (Browser) | ✓ | ✓ | ✓ | ✓ | n/a |
| iOS-Native Sim | ✓ | ✓ | ✓ | ✓ | ✓ (on-device) |
| iOS-Native TestFlight | ✓ | ✓ | ✓ | ✓ | ✓ |
| Android Emulator | ✓ | ✓ | ✓ | ✓ | Online-Pfad |
| Android Physical | ✓ | ✓ | ✓ | ✓ | Online-Pfad |

Pro Zelle: Happy-Path (Sprechen → Transkript → Senden) + TTS-Gate bleibt für Free intakt + Telemetrie-Events feuern.

---

## 8. Android-Manifest-Vorbereitung (opportunistisch)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<queries>
  <intent>
    <action android:name="android.speech.RecognitionService" />
  </intent>
</queries>
```

`capacitor.config.ts` erweitert um:
```ts
plugins: {
  SpeechRecognition: {
    // keine speziellen Optionen aktuell nötig
  },
}
```

Permission-Strings DE+EN: iOS via `InfoPlist.strings`. Android via OS-System-Texte (nicht customizable).

---

## 9. Implementations-Reihenfolge nach GO

| Schritt | Verifikation | Stop-Bedingung |
|---------|--------------|----------------|
| 9.1 `bun add @capacitor-community/speech-recognition` | Build grün | TS-Konflikte mit Cap 8 |
| 9.2 `src/lib/nativeSpeech.ts` Wrapper + Web/Native-Selector `useSpeech()` | Unit-Test (Mock) | Thenable-Trap-Verdacht |
| 9.3 `useChatVoice.ts` auf `useSpeech()` umstellen | Web-Regression-Test | `isListening`-State-Drift |
| 9.4 `capacitor.config.ts` + `AndroidManifest.xml` + `InfoPlist.strings` | `npx cap sync` ohne Fehler | Pod-Install-Fail |
| 9.5 iOS Simulator Test (Permission Grant + Deny) | Test-Matrix §7 iOS-Sim grün | Crash / Permission-Loop |
| 9.6 Android Emulator Test | Test-Matrix §7 Android-Emu grün | Service nicht erkannt |
| 9.7 TestFlight-Build → echtes iPhone | Test-Matrix §7 TestFlight grün | Production-only-Bug |
| 9.8 Internal Track Play Console → echtes Android | Test-Matrix §7 Android-Physical grün | Hersteller-spezifischer Bug |
| 9.9 `mem://technical/audio/native-speech-recognition-plugin` aktualisieren | Memory-Diff | — |
| 9.10 App-Store-Listing + Marketing-Text Update | Apple-Submit-Bundle | — |

---

## 10. Risiken & Mitigation

| Risiko | Schwere | Mitigation |
|--------|---------|-----------|
| Plugin Cap-8-Inkompatibel | hoch | Vor Install Release-Tag prüfen; ggf. auf `@capgo`-Fork wechseln |
| Thenable-Trap via `addListener` | mittel | Wrapper mit expliziter Return-Typisierung |
| Android-Hersteller-Bugs (Samsung-Bixby, MIUI) | mittel | Erste Internal-Track-Phase eng monitoren via Sentry (Item #0) |
| iOS Permission-Doppel-Dialog überrascht User | niedrig | Onboarding-Tooltip "Wir brauchen 2 Berechtigungen — beide erlauben" |
| `InfoPlist.strings` DE fehlt → englischer Permission-Text | niedrig | Mit #1B liefern |
| Audio-Buffer-Übertragung an Server (Re-Review-Risiko) | n/a | Plugin ist on-device; kein Eintrag in Privacy-Manifest nötig |
| Free-Tier-Missbrauch (Spam-Transkriptionen) | niedrig | Existierendes Rate-Limit `canSendMessage()` greift weiterhin |

---

## 11. Aufwand (geschätzt nach GO)

| Block | Aufwand |
|-------|---------|
| Wrapper + Hook + Selector | 2 h |
| Manifest/Config/InfoPlist | 1 h |
| iOS-Sim + Android-Emu Tests | 2 h |
| TestFlight + Internal-Track Tests | 2 h (+ Submit-Wartezeit) |
| Apple Review Notes + Marketing-Update | 1 h |
| Verifikations-Doc | 1 h |
| **Summe** | **~9 h** (ohne Submit-Wartezeiten) |

---

## 12. Stop-Bedingungen (während Diagnose-Vorlauf)

- **STOPP**, falls Plugin keine Cap-8-Unterstützung hat → User briefen, Alternative wählen.
- **STOPP**, falls iOS-`minimumDeploymentTarget` < Plugin-Anforderung → Soulvay-Target hochsetzen wäre eigener Sub-Schritt.
- **STOPP**, falls #0 (Crash-Reporting) **nicht** vor #1B implementiert wird — Native-Bugs ohne Sentry sind blind.

---

## 13. Empfehlung

**GO für #1B-Implementation NACH**:
1. #1A-Verifikation-Closure (User-Tests grün).
2. #0 Crash-Reporting live (Sentry capt. Native-Errors).

Nur in dieser Reihenfolge ist Native-Mic-Rollout verantwortbar.
