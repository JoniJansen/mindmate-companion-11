# Item #1A — Mic-Input Free (Web): Verifikation

**Status:** Implementation abgeschlossen. Bereit zum Verifikations-Test.
**Datum:** 2026-06-02
**Scope:** Web + iOS-Safari-Browser. iOS-Native + Android-Native = #1B (separat).

---

## 1. Tatsächlich geänderte Files (Diff-Zusammenfassung)

| File | Änderung |
|------|----------|
| `src/hooks/useAnalytics.ts` | +7 neue Event-Typen (`mic_free_attempt`, `mic_permission_granted/denied`, `mic_transcription_success/failure`, `mic_to_tts_paywall_triggered`, `mic_to_f2f_paywall_triggered`). |
| `src/components/chat/ChatInputBar.tsx` | Mic-Button: Lock-Badge entfernt, `canUseVoice`-Bedingungen für Style/Tooltip entfernt. Placeholder im Input: nur an `isListening` gekoppelt. Volume-Button unverändert. |
| `src/pages/Chat.tsx` | `handleToggleRecording`: `canUseVoice`-Gate entfernt; trackt `mic_free_attempt` für Free. `handleToggleVoiceMode/AutoPlay/PlayMessage`: Paywall-Telemetrie ergänzt. Zeile 636: `&& canUseVoice` aus Transcript-Confirm-Bedingung entfernt. |
| `src/hooks/useChatVoice.ts` | `onFinalTranscript`: `canUseVoice`-Bedingung entfernt + `mic_transcription_success`-Tracking. Neuer Effect für `mic_permission_granted`. Erweiterte sttError-Behandlung mit `mic_permission_denied` + `mic_transcription_failure`. |

**Nicht angefasst (bewusst):** `usePremium.ts` (`canUseVoice` bleibt Single Source of Truth), `speakResponse`, `playMessage`, Voice-Mode-Auto-Restart-Effect, F2F-Button, TTS-Auto-Play-Effect (Zeile 265), `useSpeechRecognition.ts`, `Info.plist`, `AndroidManifest.xml`.

---

## 2. Manuelle Verifikations-Tests

### 2.A Free-Mic-Flow (Happy Path) — Web/Chrome
- [ ] Entitlement-Simulator: `setEntitlement(false)`.
- [ ] `/chat` öffnen → Mic-Button sichtbar, **kein Schloss**.
- [ ] Klick → Browser-Permission-Prompt → "Erlauben".
- [ ] Sprechen → Live-Transkript im Input-Feld.
- [ ] Stop → Transcript-Confirm-Dialog erscheint → "Senden".
- [ ] Message wird gesendet → AI-Antwort als **Text only** (kein TTS).

### 2.B TTS bleibt gated
- [ ] Lautsprecher-Button: Schloss sichtbar. Klick → Upgrade-Modal (`reason=voice`).
  Event: `mic_to_tts_paywall_triggered` mit `source=autoplay_toggle`.
- [ ] Play-Icon an AI-Message: Klick → Upgrade-Modal.
  Event: `mic_to_tts_paywall_triggered` mit `source=play_message`.
- [ ] AI-Antwort spielt **nicht** automatisch ab (Zeile 265 Effect bleibt `canUseVoice`-gated).

### 2.C Face-to-Face bleibt gated
- [ ] User-Icon im Header (Voice-Mode): Klick → Upgrade-Modal.
  Event: `mic_to_f2f_paywall_triggered`.

### 2.D Premium-Regression
- [ ] Toggle Premium = true → kompletter Voice-Flow (Mic + TTS + F2F) funktioniert unverändert.

### 2.E Edge-Cases
- [ ] Permission verweigern → Toast "Mikrofon-Zugriff verweigert".
  Event: `mic_permission_denied` mit `tier=free`.
- [ ] iOS-Native (TestFlight): Mic-Button rendert **nicht** (`isSpeechSupported=false`) — kein Crash. **Erwartet**, wird mit #1B behoben.
- [ ] Browser-Tabs: Free → Premium-Toggle live ohne Reload sauber.

---

## 3. Telemetrie-Verifikation

In DevTools Console (Dev-Build) sollten erscheinen:
- `[Analytics] mic_free_attempt {...}` beim ersten Free-Mic-Klick.
- `[Analytics] mic_permission_granted {...}` sobald `isListening=true`.
- `[Analytics] mic_transcription_success {...}` pro Final-Transkript.
- `[Analytics] mic_to_tts_paywall_triggered {...}` beim Volume-Button-Klick als Free.
- `[Analytics] mic_to_f2f_paywall_triggered {...}` beim F2F-Klick als Free.

Im Backend (`track-event` Edge Function) tauchen Events im Batch nach max. 15 s auf.

**Hinweis:** `useAnalytics` blockt Events ohne Cookie-Consent (`analytics:true`) bis auf `page_view`. Für Verifikation Cookie-Banner akzeptieren.

---

## 4. Bekannte offene Punkte

| Punkt | Status | Folge-Item |
|-------|--------|-----------|
| iOS-Native: `isSpeechSupported=false` → Mic-Button hidden für Free | Bewusst belassen | **#1B** (Capacitor-Plugin, eigene Diagnose nötig) |
| Android-Native: `RECORD_AUDIO`-Permission fehlt im Manifest | Bewusst belassen | **#1B** |
| Memory `mem://technical/audio/native-speech-recognition-plugin` veraltet | Wird nach #1B aktualisiert | nach #1B |
| Marketing-Claim "Spracheingabe frei" im App-Store-Listing | **Nicht ändern** bis #1B live | nach #1B |

---

## 5. GO/NO-GO-Empfehlung

**Empfehlung: GO für Verifikation durch User.**

Code-Änderungen sind punktuell, TTS/F2F-Gates bleiben strikt aktiv, keine Architektur-Umschreibung. Web-Pfad ist vollständig funktional für Free + Premium.

**Vor #1B-Start abklären:**
1. Bestätigung dass 2.A–2.E manuell durchgespielt wurden und grün sind.
2. Dashboard-Sichtcheck dass die 7 neuen Events im Backend ankommen (24-h-Fenster).
3. **GO**-Signal für #1B-Diagnose (`audit/BUILD60_ITEM_01B_DIAGNOSIS.md`).

---

## 6. Was als nächstes ansteht

- **Sofort:** User verifiziert 2.A–2.E im Preview/Web-Build.
- **Wenn GO:** `audit/BUILD60_OBSERVATIONS.md` initialisieren + `BUILD60_ITEM_01B_DIAGNOSIS.md` starten.
- **Nicht starten:** #2/#5/#6/#8 — bleibt sequenziell.
