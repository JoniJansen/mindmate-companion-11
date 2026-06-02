# Item #1 — Mic-Input Free: Diagnose

**Status:** Read-Only. Keine Code-Änderungen.
**Datum:** 2026-06-02
**Scope:** Spracheingabe (STT) für Free-User freischalten. TTS und Face-to-Face bleiben Premium.

---

## 1. Aktueller Zustand — alle Gating-Stellen

| # | File | Stelle | Gate | Free-User-Erfahrung heute |
|---|------|--------|------|---------------------------|
| 1 | `src/components/chat/ChatInputBar.tsx` | Zeile 41–47 (Volume-Button) | `canUseVoice && autoPlayReplies` für aktiven Style; `Lock`-Badge bei `!canUseVoice` | Lautsprecher-Button zeigt Schloss, kein aktiver State. **Korrekt** — TTS bleibt Premium. |
| 2 | `src/components/chat/ChatInputBar.tsx` | Zeile 60–69 (Mic-Button) | Lock-Badge bei `!canUseVoice`; `isListening && canUseVoice` für aktiven State; Placeholder `voice.listening` nur bei `canUseVoice` | Mic-Button sichtbar mit Schloss-Badge. Klick → Upgrade-Prompt. **Soll geändert werden.** |
| 3 | `src/pages/Chat.tsx` | Zeile 375 (`handleToggleRecording`) | `if (!canUseVoice) { setUpgradeReason("voice"); setShowUpgradePrompt(true); return; }` | Mic-Klick zeigt Upgrade-Modal statt zu starten. **Soll geändert werden.** |
| 4 | `src/pages/Chat.tsx` | Zeile 360 (`handleToggleVoiceMode` — Face-to-Face) | `if (!canUseVoice) ...` | Face-to-Face-Button → Upgrade. **Bleibt.** |
| 5 | `src/pages/Chat.tsx` | Zeile 380 (`handleToggleAutoPlay` — TTS) | `if (!canUseVoice) ...` | Lautsprecher → Upgrade. **Bleibt.** |
| 6 | `src/pages/Chat.tsx` | Zeile 385 (`handlePlayMessage` — TTS einer Message) | `if (!canUseVoice) ...` | Play-Icon an Message → Upgrade. **Bleibt.** |
| 7 | `src/pages/Chat.tsx` | Zeile 624 (`showTranscriptConfirm && canUseVoice`) | Confirm-Dialog erscheint nur für Premium | Nach STT-Stop sieht Free-User aktuell keinen Confirm. **Muss aufgehoben werden** (Transcript-Confirm gehört zur Mic-Input-Flow). |
| 8 | `src/pages/Chat.tsx` | Zeile 265 (auto-play assistant reply) | `canUseVoice && autoPlayReplies` | TTS-Auto-Play nur Premium. **Bleibt.** |
| 9 | `src/hooks/useChatVoice.ts` | Zeile 44 (`onFinalTranscript` setzt `pendingTranscript` nur bei `canUseVoice`) | Free-User-Transkripte werden verworfen | **Muss aufgehoben werden.** |
| 10 | `src/hooks/useChatVoice.ts` | Zeile 85 (Auto-Restart STT in Voice-Mode) | An `canUseVoice` gekoppelt | Hängt an Voice-Mode (= Face-to-Face), bleibt damit Premium-gated über `voiceModeEnabled`. **Kann bleiben**, weil Voice-Mode selbst Premium ist. |
| 11 | `src/hooks/useChatVoice.ts` | Zeile 193 (`speakResponse` TTS) | `canUseVoice` | **Bleibt.** |
| 12 | `src/hooks/usePremium.ts` | Zeile 412 (`const canUseVoice = finalIsPremium`) | Single Source of Truth | **Wird NICHT geändert.** Stattdessen neuer separater Selector `canUseMicInput = true` (immer) oder Gate-Entfernung an den o.g. Call-Sites. |

**Zusammenfassung:** 6 echte Gates für reines Mic-Input. `canUseVoice` deckt drei Konzepte ab: (a) Mic-Input/STT, (b) TTS, (c) Face-to-Face. Wir spalten (a) ab.

---

## 2. Plattform-Status

### Web (Browser)
- `useSpeechRecognition.ts` nutzt `window.SpeechRecognition || window.webkitSpeechRecognition`.
- `getUserMedia` wird **nicht direkt** angefordert — Web Speech API kapselt das. Permission-Prompt erscheint browser-nativ.
- Fehlerbehandlung vorhanden: `no-speech`, `aborted` → silent; `not-allowed` → Toast `voice.micPermissionDenied`.
- **Status: funktioniert** auf Chrome/Edge/Safari Desktop, Safari iOS Web.

### iOS (Capacitor / WKWebView)
- `Info.plist`:
  - `NSMicrophoneUsageDescription` ✅ vorhanden: *"Soulvay uses your microphone for voice-based conversations with your AI companion."*
  - `NSSpeechRecognitionUsageDescription` ✅ vorhanden: *"Soulvay uses speech recognition to transcribe your voice messages to your companion."*
- **Kritischer Befund:** `package.json` enthält **kein** `@capacitor-community/speech-recognition` Plugin. Der Code in `useSpeechRecognition.ts` nutzt ausschließlich `window.SpeechRecognition`. In WKWebView ist `webkitSpeechRecognition` **nicht zuverlässig verfügbar** (auf iOS Safari Browser ja, in WKWebView-App-Context nein).
- Memory `mem://technical/audio/native-speech-recognition-plugin` referenziert einen "Capacitor speech-recognition with Web API fallback" — aber dieser Plugin ist im aktuellen Code-Stand **nicht installiert/verwendet**. Memory ist veraltet oder Plugin wurde entfernt.
- **Konsequenz:** Auf iOS-Native nutzen Premium-User aktuell höchstwahrscheinlich Face-to-Face (ElevenLabs Realtime via `useConversationalVoice`). STT über `useSpeechRecognition` funktioniert auf iOS-Native vermutlich **gar nicht** (`isSpeechSupported = false`).
- `isSupported`-Flag verhindert, dass Mic-Button überhaupt erscheint, wenn die API fehlt — d.h. iOS-Native-User sehen den Mic-Button heute wahrscheinlich nicht. Das ist eine **erhebliche Diskrepanz** zur Build-60-Annahme "Mic Free auf allen Plattformen".

### Android (Capacitor)
- `AndroidManifest.xml`: **kein** `android.permission.RECORD_AUDIO`. Nur `INTERNET`.
- Ohne RECORD_AUDIO funktioniert weder Web Speech API noch ein nativer Plugin.
- **Status: vermutlich nicht funktional** für Mic-Input auf Android-Native heute.

### Capacitor-Plugin-Init-Pattern
- Kein nativer Speech-Plugin → kein Thenable-Trap-Risiko aktuell.
- Sobald wir auf iOS/Android wirklich nativ STT wollen, muss `@capacitor-community/speech-recognition` installiert werden — **dann** Thenable-Trap-Risiko prüfen.

---

## 3. Geplante Code-Änderung (high-level)

### A. Premium-Gate-Removal (Web + iOS-Safari sofort wirksam)

**Files:**
1. `src/pages/Chat.tsx` — `handleToggleRecording` (Zeile 375): `canUseVoice`-Check entfernen.
2. `src/pages/Chat.tsx` — Zeile 624 (`showTranscriptConfirm && canUseVoice`): Bedingung auf nur `showTranscriptConfirm && pendingTranscript`.
3. `src/hooks/useChatVoice.ts` — Zeile 44 (`onFinalTranscript`): `canUseVoice`-Bedingung entfernen, damit Free-Transkripte einfließen.
4. `src/components/chat/ChatInputBar.tsx` — Zeile 60–69 (Mic-Button): Lock-Badge entfernen, Placeholder/Tooltip auch für Free zeigen ("Spracheingabe", nicht "voiceInputPlus").
5. **NICHT** anfassen: Volume-Button (TTS), Face-to-Face-Button, `handlePlayMessage`, `handleToggleAutoPlay`, `speakResponse`, `playMessage`, `useChatVoice.ts` Zeile 85 + 193.

**Begründung:** Statt `canUseVoice` global zu ändern, Gates punktuell entfernen → keine Auswirkung auf TTS/Face-to-Face. `canUseVoice` bleibt Premium-Flag und steuert die anderen zwei Pfade.

### B. Plattform-Parität (iOS-Native, Android-Native)

**Heute nicht im Build-60-Scope, weil:**
- `@capacitor-community/speech-recognition` zu installieren ist ein **zusätzlicher** nicht-trivialer Schritt (Plugin-Init, iOS Pod-Install, Android Permission-Request, Thenable-Trap-Pattern-Prüfung).
- Apple Re-Review würde getriggert, sobald NSSpeechRecognitionUsageDescription effektiv genutzt wird.
- Build 60 hatte als bestätigtes Ziel: "Spracheingabe Free machen". Das ist auf Web/Safari-Browser sofort lieferbar; iOS-Native + Android-Native wäre ein eigenes Sub-Item.

**Empfehlung:** Ich liefere in der GO-Phase nur (A) und benenne (B) als **separates Build-60.5 oder Build-61-Item** mit eigener Diagnose. **Bitte deine GO-Entscheidung dazu** (siehe §10 Stop-Bedingungen).

### C. UI-Sichtbarkeit
- Mic-Button bleibt an aktueller Position (links neben Eingabefeld).
- Lock-Badge entfernt.
- Tooltip: `t("chat.voiceInput")` ("Spracheingabe") statt `t("chat.voiceInputPlus")`.
- **Kein** zusätzlicher Onboarding-Hinweis nötig — Mic-Icon ohne Schloss ist selbsterklärend. Falls gewünscht: Mini-Tour-Hint in Build 61.

---

## 4. Verifikations-Plan

### Free-User-Mic-Flow (Happy Path)
1. Free-Account einloggen (oder Entitlement-Simulator: `setEntitlement(false)`).
2. `/chat` öffnen.
3. Mic-Button: kein Schloss sichtbar.
4. Klick → Browser-Permission-Prompt → "Allow".
5. Sprechen → Live-Transkript erscheint im Input-Feld.
6. Stop → Transcript-Confirm-Dialog erscheint → "Senden".
7. Message wird abgeschickt → AI-Antwort kommt als **Text** (kein TTS).

### TTS bleibt gated
8. Lautsprecher-Button neben Input: Schloss sichtbar, Klick → Upgrade-Modal `reason=voice`.
9. Play-Icon an AI-Message: Klick → Upgrade-Modal.
10. Settings → AutoPlayReplies-Toggle: für Free wirkungslos / Upgrade-Modal.

### Face-to-Face bleibt gated
11. User-Icon im Header (Voice-Mode): Schloss sichtbar, Klick → Upgrade-Modal.

### Edge-Cases
- Permission-Reject → Toast "Mikrofon-Zugriff verweigert".
- `isSpeechSupported = false` (iOS-Native, Android-Native) → Mic-Button rendert nicht (bestehendes Verhalten). **Keine Regression**, aber sichtbar gemacht: Free-iOS-User bekommt aktuell keinen Mic-Vorteil. Honest gate.
- Offline → Web Speech API failed → vorhandene Fehlerbehandlung.

### TTS/F2F-Gate-Regression-Test
- Mit Entitlement-Simulator zwischen Free/Premium toggeln, sicherstellen dass **nur** Mic-Klick verhalten ändert.

---

## 5. Telemetrie-Plan

Neue Events in `useAnalytics`:

| Event | Wann | Properties |
|-------|------|------------|
| `mic_free_attempt` | Free-User klickt Mic-Button | `{ platform, isSpeechSupported }` |
| `mic_permission_granted` | `onstart` feuert | `{ platform, tier }` |
| `mic_permission_denied` | `sttError === "not-allowed"` | `{ platform, tier }` |
| `mic_transcription_success` | Final-Transcript len > 0 | `{ tier, durationMs, charCount }` |
| `mic_transcription_failure` | Andere `sttError` (außer no-speech/aborted) | `{ tier, errorCode }` |
| `mic_to_tts_paywall_triggered` | Free-User klickt Volume-Button | `{}` |
| `mic_to_f2f_paywall_triggered` | Free-User klickt Face-to-Face | `{}` |

**Dashboard nach Build 60:**
- Conversion-Funnel: `mic_free_attempt` → `mic_transcription_success` → `mic_to_tts_paywall_triggered` → Premium-Upgrade.
- Erfolgs-KPI: Anteil Free-User mit ≥1 erfolgreicher Mic-Transkription/Woche.
- Frühwarnung: `mic_transcription_failure`-Rate > 5 % → Plattform-Bug.

---

## 6. Bug-Risiken (ehrlich)

| Risiko | Bewertung | Begründung |
|--------|-----------|------------|
| Premium-User-Mic-Regression | **Niedrig** | Premium nutzt denselben Flow; Gates werden nur entfernt, nicht umgebaut. |
| TTS wird versehentlich freigeschaltet | **Niedrig–Mittel** | `speakResponse` (Zeile 193) und `handlePlayMessage` (Zeile 385) bleiben strikt an `canUseVoice` gekoppelt. **Aber:** `useChatVoice.ts` Zeile 85 (auto-restart) und Zeile 44 (transcript-aufnahme) sind beide ans `canUseVoice` gekoppelt; wenn ich Zeile 44 löse, Zeile 85 aber an `voiceModeEnabled` hängt → kein TTS-Leak, weil Voice-Mode selbst gated bleibt. **Manuell verifizieren.** |
| Face-to-Face Leak | **Niedrig** | `handleToggleVoiceMode` bleibt unverändert. |
| Race-Condition Permission-Check | **Niedrig** | Existierender Code nutzt async-safe Pattern. |
| `showTranscriptConfirm`-UI bricht | **Mittel** | Bedingung an Zeile 624 wird gelockert; muss prüfen ob Modal sauber für Free rendert. |
| Free-User auf iOS-Native sieht weiter kein Mic | **Hoch — aber kein Regression** | Bestehendes Verhalten (`isSpeechSupported = false` → Button hidden). **Erwartungs-Klärung mit dir nötig.** |
| Android-Native Free-User: kein RECORD_AUDIO → Crash bei Permission-Request | **Mittel** | Aktuell vermutlich nicht im Native-Use; wenn doch jemand triggert → silent fail. **Kein** Crash-Risiko via Web Speech API (existiert dort nicht). |
| Analytics-Event-Flut | **Niedrig** | `useAnalytics` hat Buffer (15s/25 events). |

---

## 7. Apple-Reject-Risiko

| Punkt | Risiko | Begründung |
|-------|--------|------------|
| Mic-Permission-Text aktuell | ✅ unverändert | NSMicrophoneUsageDescription bleibt wie in Build 51 (genehmigt). |
| NSSpeechRecognitionUsageDescription | ✅ unverändert | Bleibt wie in Build 51. |
| Subscription Re-Review | ⚠️ **Nicht nötig**, weil: kein Subscription-Tier-Change, keine neuen IAPs, keine Preis-Änderung. Subscription-Metadata identisch. **Begründung:** Free bekommt mehr → keine Wert-Reduktion, kein Auto-Renewable-Subscription-Schema-Change. |
| Privacy Manifest (`PrivacyInfo.xcprivacy`) | ✅ unverändert | Mic-Nutzung war bereits deklariert. |
| Health-Claims-Risiko durch UI-Text | ✅ keine | Neue Texte: nur "Spracheingabe" / "Voice input". Neutral, kein Therapie-Claim. |
| Guideline 5.1.1(i) — AI-Consent | ✅ unverändert | Build 51 Server-Gate bleibt aktiv. STT findet client-seitig statt; gesendete Texte gehen weiter durch `/functions/v1/chat` mit Consent-Check. |
| Guideline 2.1 — Funktionalität | ⚠️ **Mittel** | Wenn Free-User auf iOS-Native den Mic-Button **nicht** sieht (weil `isSpeechSupported=false`), aber Marketing/Store-Listing "Spracheingabe frei" verspricht → potenzieller Mismatch. **Empfehlung:** Marketing-Text nicht ändern, bis (B) iOS-Native-STT geliefert. |

**Gesamteinschätzung:** Apple-Risiko niedrig, wenn wir Marketing-Claims zurückhaltend halten und (B) als Folge-Build planen.

---

## 8. Pre-Submit-Checkliste-Ergänzung für Item #1

- [ ] Free-Account: Mic-Klick → Permission-Prompt → Transcript → Send → Text-Antwort.
- [ ] Free-Account: TTS-Volume-Button → Upgrade-Modal mit `reason=voice`.
- [ ] Free-Account: Face-to-Face-Button → Upgrade-Modal.
- [ ] Free-Account: Play-Icon an AI-Message → Upgrade-Modal.
- [ ] Premium-Account: voller Voice-Flow funktioniert unverändert.
- [ ] iOS-Native Free-Account (TestFlight Build): Mic-Button rendert **nicht** (erwartet — `isSpeechSupported=false`). Verifizieren dass es nicht crashed.
- [ ] iOS-Native Premium-Account: Face-to-Face funktioniert (ElevenLabs Realtime).
- [ ] Web/Safari Desktop: Mic-Flow funktioniert für beide Tiers.
- [ ] Analytics-Events erscheinen in Dashboard.
- [ ] Permission-Denied-Toast erscheint deutsch + englisch.
- [ ] Offline-Modus: Mic startet nicht oder failed sauber.
- [ ] Re-Test nach Sign-Out / Sign-In: State sauber.

---

## 9. Realistische Zeitschätzung

- **Pure Dev-Zeit:** 1.5 h (6 punktuelle Gate-Entfernungen + Tooltip-Text + 7 Analytics-Events).
- **Manuelles Testing:** 1 h (Free/Premium-Toggle, 5 Browser-Kombis, Edge-Cases).
- **iOS-Simulator-Test (optional, nur Regression):** 0.5 h.
- **Risiko-Buffer:** 1 h (TTS-Leak-Verifikation, Transcript-Confirm-UI-Polish).
- **Gesamt: 3.5 – 4.5 h.**
- **Wenn (B) iOS-Native-STT-Plugin im selben Item:** + 4–6 h (Plugin-Install, native Permission-Flow, Thenable-Trap-Prüfung, iOS+Android Simulator-Test). **Empfehlung: separat.**

---

## 10. Stop-Bedingungen — was ich gefunden habe

### 🟡 Findings, die GO-Entscheidung brauchen (kein hartes STOP, aber dein Call):

1. **iOS-Native + Android-Native haben heute keinen funktionalen Mic-Input** (kein nativer Speech-Plugin, kein RECORD_AUDIO, WKWebView ohne `webkitSpeechRecognition`).
   - Build-60-Item #1 würde damit **nur** auf Web + iOS-Safari-Browser wirken.
   - Native-User (App-Store-Käufer) sehen **keinen** Unterschied.
   - **Frage an dich:** Reicht Web-only-Scope für Build 60? Oder Plugin-Install jetzt mit reinziehen (+4–6 h, eigene Diagnose nötig)?

2. **Android-Manifest fehlt `android.permission.RECORD_AUDIO`** unabhängig vom Plugin.
   - Falls Android-Build aktuell relevant: separater Fix.

3. **Memory `mem://technical/audio/native-speech-recognition-plugin` ist veraltet** — referenziert einen nicht installierten Plugin. **Wird nach Item-Abschluss aktualisiert.**

### 🟢 Keine harten STOP-Bedingungen erfüllt:

- Mic-Input funktioniert technisch für Premium auf Web/Safari ✅
- Info.plist NSMicrophoneUsageDescription gesetzt und sinnvoll ✅
- Kein Capacitor-Plugin = kein Thenable-Trap-Risiko ✅
- Premium-Gate-Logik ist sauber separierbar (punktuelle Gates, keine globale Umschreibung von `canUseVoice` nötig) ✅

---

## Bitte deine Entscheidung

**Frage 1:** Web-only-Scope für Item #1 (1.5 h Dev + 1 h Test) — und (B) iOS/Android-Native als eigenes Sub-Item nach Item #8 oder in Build 61?
**Frage 2:** Soll Telemetrie-Plan (§5) so umgesetzt werden, oder erstmal nur 3 Kern-Events (`mic_free_attempt`, `mic_transcription_success`, `mic_to_tts_paywall_triggered`)?
**Frage 3:** Soll ich `audit/BUILD60_OBSERVATIONS.md` initialisieren und die Native-Mic-Lücke + Android-Permission-Lücke als erste Beobachtungen festhalten?

**Warte auf GO.**
