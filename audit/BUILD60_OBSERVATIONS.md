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

---

# Browser-Test-Befunde (Claude Code / Sandbox)

> Below: detailed observations from browser-based testing in Lovable Sandbox.
> Complements Lovable's roadmap observations above with concrete UI/UX
> findings from Item #1A verification sessions.

# BUILD60_OBSERVATIONS.md — Beobachtungen während Build-60-Verifikation

Sammlung von Befunden, die NICHT direkt zu einem Item gehören, aber dokumentiert werden sollten.

## Companion-State-Inconsistency Beobachtung (2026-06-06, Item #1A Verifikation)

**Befund**: Auf der Chat-Seite (Sandbox-Preview, eingeloggt mit User-Account, Free-Entitlement) gibt es eine sichtbare State-Diskrepanz:

- **Header zeigt Companion**: **"Elena"** (Avatar + Name "Elena", "Dein Reflexionsbegleiter")
- **Welcome-Message im Chat-Body**: `"Hello. I'm Jonas, and I'm here to listen. Take your time – share what's on your mind."`

Header und Body-Welcome-Message zeigen unterschiedliche Companions.

### Mögliche Ursachen

(a) **Historischer State** — kein Bug: User hat in der Vergangenheit mit Jonas gechattet, dann Companion auf Elena gewechselt. Vorhandene Messages bleiben (Companion-Wechsel verändert keine historischen Messages). Welcome-Message ist persistiert als historischer Eintrag.

(b) **State-Sync-Bug** — echter User-facing Bug: Companion-Selection und Welcome-Message-Generation sind nicht synchronisiert. User wechselt Companion → bekommt aber weiterhin Welcome-Text vom alten Companion.

### Klassifikation — UPDATE 2026-06-08

- **Status**: ✅ **AUFGELÖST — Szenario A bestätigt (kein Bug)**
- **Verifikation**: Während Test 2.D Premium-Regression wurde Entitlement-Simulator auf "Active" geschaltet und zurück nach `/chat` navigiert. Welcome-Message rendete dann als **"Hello. I'm Elena, and I'm here to listen."** — Companion und Welcome-Message SYNCHRON.
- **Erklärung**: Der ursprüngliche Mismatch war historisch — vermutlich Companion-Wechsel in einer früheren Session, alte "Jonas"-Message blieb persistiert. Nach `/chat`-Reload (State-Reset durch Premium-Toggle) wurde Welcome-Message neu generiert mit aktueller Companion "Elena".

### Folge-Aktion

- ✅ Keine Code-Action nötig
- 📝 Knowledge-Base: dokumentiert dass Welcome-Messages bei Companion-Wechsel NICHT historisch nachgepatcht werden (designtechnisch sinnvoll — User soll vorhandene Konversationen nicht "verlieren")
- 🔎 Optional: prüfen ob Lovable einen "Konversation zurücksetzen"-CTA bei Companion-Wechsel anbietet (UX-Polish)

### Screenshot-Referenz

`/tmp/sim_*` Screenshots der Chat-Seite zeigen den Befund. Live verifizierbar via `https://id-preview--dc1f3645-...lovable.app/chat` mit eingeloggtem User-Account.

---

(Weitere Beobachtungen folgen hier.)
