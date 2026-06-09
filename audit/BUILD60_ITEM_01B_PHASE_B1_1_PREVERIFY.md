# Phase B1.1 — Pre-Verify

**Status:** Discovery completed, no code changes. Awaiting GO for migration strategy.

---

## 1. `src/hooks/useSpeechRecognition.ts` — existiert bereits

**Datei vorhanden:** Ja, 184 Zeilen. Reiner Web-Speech-API-Wrapper (`window.SpeechRecognition` / `window.webkitSpeechRecognition`). **Kein Capacitor-Import, kein Native-Pfad.**

Kern-API der Datei:
- Parameter: `language: string`, `options: { continuous?, onFinalTranscript? }`
- Returns: `{ isListening, transcript, interimTranscript, fullTranscript, isSupported, error, startListening, stopListening, toggleListening, resetTranscript }`
- Verhalten: Auto-restart bei `continuous=true`, ignoriert `no-speech`/`aborted` errors, hält `shouldRestartRef` für Re-Entry, setzt `error` state für `not-allowed` etc.

**Komplexität:** Mittel. Kein Thenable-Trap-Pattern, keine Native-Reste, keine alten Plugin-Imports — sauberer Web-only Hook. Build #1A grünes Verhalten basiert hierauf.

## 2. Konsumenten (grep)

Drei Call-Sites:

| Datei | Zeile | Aufruf |
|---|---|---|
| `src/hooks/useChatVoice.ts` | 3, 42 | `useSpeechRecognition(speechLang, { continuous: true, onFinalTranscript: ... })` |
| `src/pages/Journal.tsx` | 19, 137 | `useSpeechRecognition(speechLang, { continuous: true })` |
| `src/pages/Home.tsx` | 7, 60 | `useSpeechRecognition(speechLang, { continuous: true })` |

Alle drei verwenden identisches Interface. Migration auf einen kompatiblen `useSpeech`-Hook ist trivial, wenn wir das Return-Shape erhalten.

## 3. `@capacitor-community/speech-recognition` — NICHT installiert

`rg`-Suche im Repo (außer `node_modules`/`*.md`): **null Treffer.** Kein Import irgendwo. Kein Eintrag in `package.json`. Sauberer Start für den Fork — kein Cleanup nötig, kein vorheriges Plugin zu deinstallieren.

## 4. `package.json` — Capacitor-Plugin-Status

Aktuell installierte Capacitor-bezogene Pakete (Dependencies):

```json
"@capacitor/android": "^8.0.1",
"@capacitor/cli": "^8.0.1",
"@capacitor/core": "^8.0.1",
"@capacitor/ios": "^8.0.1",
"@revenuecat/purchases-capacitor": "^13.0.1",
"@sentry/capacitor": "^4.0.0"
```

Keine weiteren Capacitor-Plugins. Capacitor-Major **8** — passt zur Fork-Annahme (`capacitor-swift-pm` exact 8.0.1 in `ios/App/CapApp-SPM/Package.swift`).

## 5. Migrations-Empfehlung

**Empfehlung: NEUER Selector-Hook `useSpeech` (Pfad-Switch), bestehender `useSpeechRecognition` bleibt zunächst unverändert und wird intern vom Web-Pfad wiederverwendet.**

Gründe:
- `useSpeechRecognition` ist Item-#1A-grün und sauber Web-only — kein Risiko durch Touch.
- `useSpeech` ist ein Plattform-Selector: bei `Capacitor.isNativePlatform()` → `nativeSpeech.ts`-Wrapper; sonst → `useSpeechRecognition` weiterleiten.
- Konsumenten (`useChatVoice`, `Journal`, `Home`) migrieren in einem zweiten Schritt auf `useSpeech` mit identischem Return-Shape (Adapter unnötig, wenn wir das Shape 1:1 nachbilden).
- Vorteil: Web-Pfad bleibt bit-identisch (kein #1A-Regress möglich, weil derselbe Hook), Native-Pfad ist isoliert testbar.

**Alternative (NICHT empfohlen):** `useSpeechRecognition` selbst um Native-Branch erweitern. Spart eine Datei, riskiert aber #1A — bei jedem Native-Bugfix berühren wir Web-Code.

## 6. Offene Punkte vor GO

1. **`addListener`-Signatur in Capacitor 8:** Plugin-typings in der Fork checken — `Promise<PluginListenerHandle>` (async) oder `PluginListenerHandle` (sync wrapped). Auflösung erst nach `bun add`, dann Wrapper-Typing final.
2. **`isSupported` auf Native:** Soll true sein, wenn `SpeechRecognition.available().available === true` UND `requestPermissions` durchläuft? Vorschlag: lazy probe beim ersten `start()`, `isSupported` initial via `available()` cachen.
3. **Journal/Home spezifische Nutzung:** Beide rufen mit `{ continuous: true }` ohne `onFinalTranscript`. Verwenden sie nur `fullTranscript`-Polling? Falls ja → Native-Pfad muss internen Transcript-Buffer pflegen, der über `partialResults`-Listener aktualisiert wird.

## 7. Vorgeschlagener nächster Schritt

GO erbitten für:
- Schritt 1: `bun add github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.2`
- Schritt 2: `src/lib/nativeSpeech.ts` mit explizitem Promise-Typing
- Schritt 3: `src/hooks/useSpeech.ts` Selector mit Web-Delegation an bestehenden `useSpeechRecognition`
- Schritt 4: Migrate 3 Konsumenten
- Schritt 5: Web-Regress-Smoke in `/diagnostics`

**STOPP-Punkt nach Schritt 1:** Wenn `addListener`-Signatur unklar, briefen vor Schritt 2.
