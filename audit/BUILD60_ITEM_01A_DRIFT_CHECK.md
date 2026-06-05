# Item #1A — Drift-Check

**Datum:** 2026-06-05  
**Modus:** Read-only Code-Vergleich gegen `BUILD60_ITEM_01A_VERIFICATION.md` (2026-06-02).  
**Frage:** Entspricht der aktuelle Code noch dem dokumentierten Implementations-Stand?

---

## Ergebnis: **KEIN DRIFT.** Code-Stand ist stabil.

---

## Verifizierte Stellen

| File | Erwartung laut Verifikations-Doc | Aktueller Stand | Status |
|------|----------------------------------|-----------------|--------|
| `src/hooks/useAnalytics.ts` | +7 Mic-Events (`mic_free_attempt`, `mic_permission_granted/denied`, `mic_transcription_success/failure`, `mic_to_tts_paywall_triggered`, `mic_to_f2f_paywall_triggered`) | Alle 7 Events im `AnalyticsEvent`-Union vorhanden | ✅ |
| `src/components/chat/ChatInputBar.tsx` Mic-Button | Lock-Badge entfernt, `canUseVoice`-Gating nur für Volume-Button | Mic-Button (Zeile 56–75) hat **kein** Lock, kein `canUseVoice`-Check; Volume-Button (Zeile 41–45) behält Lock unter `!canUseVoice` | ✅ |
| `src/components/chat/ChatInputBar.tsx` Placeholder | Nur an `isListening` gekoppelt | Zeile 81: `isListening ? t("voice.listening") : t("chat.inputPlaceholder")` | ✅ |
| `src/pages/Chat.tsx` `handleToggleRecording` | `canUseVoice`-Gate entfernt, trackt `mic_free_attempt` für Free | Zeile 373–384: kein Block, Telemetrie für Free aktiv | ✅ |
| `src/pages/Chat.tsx` TTS/F2F-Paywall-Telemetrie | `mic_to_tts_paywall_triggered`, `mic_to_f2f_paywall_triggered` an Toggle-Handlern | Zeilen 360, 386, 394 mit `canUseVoice`-Gate + Tracking | ✅ |
| `src/pages/Chat.tsx` TTS-Auto-Play-Effect | Bleibt `canUseVoice`-gated (Zeile 265) | Bestätigt: `if (canUseVoice && voice.voiceSettings.autoPlayReplies …)` | ✅ |
| `src/hooks/useChatVoice.ts` `onFinalTranscript` | `canUseVoice`-Bedingung entfernt + `mic_transcription_success`-Tracking | Code unverändert seit Implementation | ✅ |
| `ios/App/App/Info.plist` | `NSMicrophoneUsageDescription` + `NSSpeechRecognitionUsageDescription` vorhanden | Beide Keys + DE/EN-Strings vorhanden | ✅ |
| `android/app/src/main/AndroidManifest.xml` | `RECORD_AUDIO` **nicht** gesetzt (bewusst, #1B) | Nur `INTERNET` deklariert | ✅ (erwartet) |
| `capacitor.config.ts` | Keine `SpeechRecognition`-Plugin-Konfig (bewusst, #1B) | Nur SplashScreen/StatusBar/Keyboard | ✅ (erwartet) |
| `package.json` | Kein `@capacitor-community/speech-recognition` (bewusst, #1B) | Nicht installiert | ✅ (erwartet) |

---

## Keine Fremd-Edits seit 2026-06-02

Stichproben in chat-/voice-relevanten Dateien zeigen keine Spuren von "Zwischen-Polishs":
- Kein neuer Import in `ChatInputBar.tsx`, `Chat.tsx`, `useChatVoice.ts` außerhalb des Build-60-Patches.
- `usePremium.ts` unangefasst (`canUseVoice` bleibt Single Source of Truth).
- `useSpeechRecognition.ts` unverändert.

---

## Implikation für #1A-Verifikation

User kann die manuellen Tests 2.A–2.E aus `BUILD60_ITEM_01A_VERIFICATION.md` **ohne Re-Review des Codes** durchführen. Doc und Implementation sind synchron.

**Hinweis zu Build-59-Live-Daten:** Aus Agent-Sicht weiterhin nicht einsehbar (App Store Connect / RevenueCat / Sentry liegen außerhalb). Wenn der User in Schiene B (Crash-Reporting) GO gibt, wird das in Build 60 geschlossen.
