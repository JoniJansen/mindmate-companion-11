# Build 60 — Observations

Laufendes Logbuch über Befunde, Lücken und Folge-Items, die während Build-60-Implementation auftauchen.

---

## 2026-06-02 — Item #1A Web-Mic Free Implementation

### O1: Native-Mic-Lücke (→ wird Item #1B)
- iOS-Native (Capacitor/WKWebView): `window.webkitSpeechRecognition` nicht zuverlässig verfügbar → `isSpeechSupported=false` → Mic-Button rendert nicht für Free-User auf iOS-App.
- Android-Native: Selbe Lücke + zusätzlich fehlende `RECORD_AUDIO`-Permission im `AndroidManifest.xml`.
- Item #1A liefert daher Free-Mic **nur** auf Web + iOS-Safari-Browser. App-Store-Käufer sehen heute keinen Unterschied.
- **Folge:** Item #1B = `@capacitor-community/speech-recognition`-Plugin-Install + iOS-Pod + Android-Permission + Web-Fallback-Routing. Eigene Diagnose-Phase. Thenable-Trap-Risiko explizit prüfen (Build-59-Lesson).

### O2: Veraltete Memory `mem://technical/audio/native-speech-recognition-plugin`
- Referenziert "Capacitor speech-recognition with Web API fallback" — Plugin ist im aktuellen `package.json` **nicht** installiert.
- **Aktion:** Nach #1B-Abschluss aktualisieren. Bis dahin als veraltet markieren.

### O3: Marketing-Claim "Spracheingabe frei"
- Solange #1B nicht ausgeliefert: kein App-Store-Listing-Update, kein In-App-Promo, kein Push, keine Onboarding-Bubble, die "Voice für alle" verspricht.
- Guideline-2.1-Risiko: Native-User auf App-Store sehen Mic nicht → Mismatch-Reject möglich.
- **Aktion:** Marketing-Text-Update gehört in Build 60-Submit-Bundle **nach** #1B.

### O4: Cookie-Consent-Blocker für Telemetrie
- `useAnalytics` blockt alle Events außer `page_view`, wenn `cookie_consent.analytics !== true`.
- Konsequenz: Build-60-Conversion-Funnel (`mic_free_attempt → mic_transcription_success → upgrade_clicked`) sieht keine User ohne Analytics-Consent.
- **Risiko:** Niedrig — Consent-Rate in App ist üblicherweise hoch. Aber bei Reporting kommunizieren dass Zahlen "consented users only" sind.

---

## Hinzufügen weiterer Beobachtungen
Pro Item ein Block mit Datum + Item-Referenz. Jede Beobachtung mit eindeutiger ID (`O{n}`) für Querverweise.
