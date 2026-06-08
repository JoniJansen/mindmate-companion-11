# Build 60 — Item #1A Closure Verification

**Status**: ✅ Closure-Patch implementiert. Item #1A bereit für finale User-Verifikation.
**Datum**: 2026-06-08
**Scope**: 3 Fixes nach Browser-Verifikations-Drift-Findings.

---

## Fix 1 — AutoPlay-Toggle Free-Gate (Option B + Modal)

**Datei**: `src/components/settings/SettingsVoiceSection.tsx`

### Vorher
- Free-User togglet AutoPlay-Replies in `/settings` → Setting wird gespeichert ("Einstellungen gespeichert"-Toast) → TTS-Engine blockt zur Laufzeit → Verwirrung.
- Kein visuelles Premium-Signal am Toggle.
- Kein Analytics-Event.

### Nachher
- Premium-Check via `usePremium()` → `canUseVoice = isPremium`.
- **Visuelle Markierung (Option B)**: Bei `!canUseVoice` erscheint ein kleines Lock-Badge (2.5×2.5) am Volume2-Icon (gleiches Pattern wie `ChatInputBar.tsx`).
- **Subtitle-Hinweis**: Beschreibung wechselt zu `t("chat.voiceOutputPlus")` ("Sprachausgabe – Plus") für Free-User.
- **Switch-State**: Für Free-User immer `false` (kein lokales Speichern bei Klick).
- **Klick-Handler**:
  - `analytics.track("mic_to_tts_paywall_triggered", { source: "autoplay_settings" })`
  - `setShowUpgradePrompt(true)` → Modal öffnet sich
- **Modal**: Lokaler `useState` in `SettingsVoiceSection`, rendert `UpgradePrompt` mit `reason="voice"`, `variant="modal"`. `role="dialog"` + `aria-modal="true"` für Accessibility. Klick außerhalb oder X schließt; "Upgrade" → `navigate("/upgrade")`.
- Keine Architektur-Änderung (Modal-State lokal gekapselt, kein neuer Context, keine Props-Kette).

### Diff-Summary
- Imports erweitert: `useState`, `AnimatePresence`, `Lock`, `usePremium`, `UpgradePrompt`, `useNavigate`, `analytics`.
- `<CalmCard variant="elevated">` für AutoPlay komplett umgebaut (Lock-Badge, gated Switch).
- Component-Body in Fragment `<>…</>` gewrappt, Modal als zweiter Top-Level-Node.

---

## Fix 2 — aria-label am Mic-Button + AutoPlay-Button

**Datei**: `src/components/chat/ChatInputBar.tsx`

### Vorher
- Mic-Button und AutoPlay-Toggle-Button hatten Radix-Tooltips, aber **kein** `aria-label` direkt am `<Button>`-Element.
- Screen-Reader lasen nur "button".

### Nachher
- **Mic-Button (Zeile ~62-70)**: `aria-label={isListening ? t("chat.stopRecording") : t("chat.voiceInput")}`.
- **AutoPlay-Toggle-Button (Zeile ~39-50)**: `aria-label={canUseVoice ? (autoPlayReplies ? t("chat.aiSpeaksAuto") : t("chat.textOnly")) : t("chat.voiceOutputPlus")}`.
- Keine neuen Translation-Keys nötig — bestehende Keys aus `src/translations/chat.ts` (Zeile 48-53) wiederverwendet.

---

## Fix 3 — Analytics-Events-Verifikation (kein Code-Change)

### Befund
Alle 7 Mic-Analytics-Events sind im Code verdrahtet:

| Event | Call-Site |
|---|---|
| `mic_free_attempt` | `src/pages/Chat.tsx:380` |
| `mic_permission_granted` | `src/hooks/useChatVoice.ts:85` |
| `mic_permission_denied` | `src/hooks/useChatVoice.ts:63` |
| `mic_transcription_success` | `src/hooks/useChatVoice.ts:48` |
| `mic_transcription_failure` | `src/hooks/useChatVoice.ts:70` |
| `mic_to_tts_paywall_triggered` (source: `autoplay_toggle`) | `src/pages/Chat.tsx:387` |
| `mic_to_tts_paywall_triggered` (source: `play_message`) | `src/pages/Chat.tsx:395` |
| `mic_to_tts_paywall_triggered` (source: `autoplay_settings`) | **NEU** `src/components/settings/SettingsVoiceSection.tsx` |
| `mic_to_f2f_paywall_triggered` | `src/pages/Chat.tsx:361` |

### Warum Browser-Verifikation keine Console-Logs sah
`useAnalytics.ts:159` loggt `console.log("[Analytics]", event, properties)` **nur wenn `import.meta.env.DEV === true`**. Die Sandbox-Preview ist ein Production-Build (`DEV=false`) — das ist korrektes Verhalten (keine Telemetrie-Logs in Production), kein Bug.

### Verifikations-Anleitung via Network-Tab

```
1. DevTools öffnen → Network-Tab
2. Filter: track-event
3. In der App eine Voice-Action ausführen (z.B. als Free-User Mic-Button klicken)
4. POST-Request an /functions/v1/track-event sichtbar
5. Request-Body prüfen: { events: [{ event_name: "mic_free_attempt", session_id, payload: {...} }] }
6. Buffer-Hinweis: Events werden gepuffert (15s / 25 Events) — bei einzelnem Event ggf. bis zu 15s warten oder Tab unsichtbar machen (visibilitychange → sendBeacon-Flush)
```

---

## Files Changed

| File | Type | Lines |
|---|---|---|
| `src/components/chat/ChatInputBar.tsx` | edit | +2 aria-labels |
| `src/components/settings/SettingsVoiceSection.tsx` | edit | +Lock-Gate, +Modal, +Premium-Check, +Analytics |
| `audit/BUILD60_ITEM_01A_CLOSURE_VERIFICATION.md` | new | this doc |

---

## User-Verifikations-Anleitung (5 Min)

### Test A — AutoPlay-Gate (Free-User)
1. Als Free-User in Sandbox einloggen (Entitlement-Simulator: `/diagnostics` → "Free").
2. `/settings` öffnen → Section "Stimme" → "Auto-Wiedergabe Antworten".
3. **Erwartet**: Volume2-Icon zeigt kleines Lock-Badge unten rechts. Subtitle: "Sprachausgabe – Plus".
4. Switch klicken.
5. **Erwartet**: Modal öffnet sich mit Upgrade-Prompt (reason=voice). Switch bleibt OFF. Toast "Einstellungen gespeichert" erscheint NICHT.
6. Modal schließen (X oder Outside-Click) → zurück zu Settings, Switch immer noch OFF.

### Test B — AutoPlay-Funktion (Premium-User)
1. Auf Premium togglen (`/diagnostics`).
2. Settings → AutoPlay-Toggle: **kein** Lock-Badge sichtbar. Subtitle: normale Beschreibung.
3. Switch togglen funktioniert wie vorher (Toast "Einstellungen gespeichert").

### Test C — aria-label (Chat-Input)
1. `/chat` öffnen.
2. DevTools → Elements → Mic-Button inspizieren → `aria-label="Spracheingabe"` (DE) bzw. `"Voice input"` (EN).
3. AutoPlay-Toggle-Button inspizieren → aria-label je nach State korrekt.

### Test D — Analytics (Network)
1. Network-Tab, Filter `track-event`.
2. Als Free-User in Settings AutoPlay-Switch klicken.
3. Innerhalb 15s POST an `/functions/v1/track-event` mit `event_name: "mic_to_tts_paywall_triggered"`, `payload.source: "autoplay_settings"`.

---

## Stop-Bedingungen — alle clean
- ✅ Keine Architektur-Änderung nötig (Modal lokal gekapselt).
- ✅ Alle Translation-Keys vorhanden, keine neuen Einträge nötig.
- ✅ Keine bestehenden Voice-Gates angefasst (Chat-Inline-Gates unverändert).

---

## GO/NO-GO für Item #0 Sentry

**Empfehlung: GO** für Item #0 Sentry-Implementation — sobald User-Verifikation (Tests A-D, ~5 Min) grün ist.

Item #1A ist mit diesem Closure-Patch funktional und visuell konsistent. Drei verbleibende Low-Prio-Findings aus der Browser-Verifikation (Upgrade-Modal `role="dialog"` außerhalb Settings, AI-Stream-Pacing, kein DEV-Logging in Production) sind explizit verschoben (Build 60.5 / Build 61), keine #1A-Blocker.
