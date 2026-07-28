# Prüfanweisungen — Gruppen E (Barrierefreiheit), H (Zuverlässigkeit & Betrieb), I (Geschäftslogik), K (Testinfrastruktur)

### E1 — Semantik und Beschriftungen

**Ebene:** 1 (Tor) — Gerüst-Rhythmus „jeder PR"; die Prüfung existiert im Tor noch nicht und muss dort gebaut werden
**Zeitbedarf:** Einrichtung 2 h einmalig, danach 0 Menschenzeit im Tor; manuelle Gegenprobe 45 min je Quartal
**Durchführung:**
1. `bun add -D eslint-plugin-jsx-a11y` und in `eslint.config.js` als vierten Eintrag unter `plugins` registrieren, Regelsatz `...jsxA11y.configs.recommended.rules` in den bestehenden `rules`-Block aufnehmen. Der Lint-Job in `.github/workflows/ci.yml` steht auf `continue-on-error: true` — die a11y-Regeln dürfen deshalb **nicht** dort landen, sondern brauchen einen eigenen `pruefe("E1", …)`-Block in `scripts/gate.mjs`, der `bunx eslint --rule-filter jsx-a11y src` ausführt und bei Fehleranzahl > 0 rot meldet.
2. **Bevor** `E1` in die Ebene-1-Liste in `audit/TEST_FRAMEWORK.md` (Zeile 297) eingetragen wird: erst den `pruefe`-Block in `gate.mjs` schreiben, dann die Liste ergänzen. Umgekehrte Reihenfolge lässt `scripts/check-framework.py` mit „in Ebene 1 gelistet, aber im Tor nicht geprüft: ['E1']" fehlschlagen und bricht die CI (K7).
3. Ratchet setzen: aktuelle Verstoßzahl messen (`bunx eslint --rule-filter jsx-a11y src --format json | jq '[.[].errorCount] | add'`), diese Zahl als Obergrenze in `gate.mjs` hinterlegen, Regel bricht bei jedem Anstieg. Nicht sofort auf 0 stellen — ein Tor, das am ersten Tag rot ist, wird umgangen.
4. `bun run dev`, dann mit **axe DevTools** (Chrome-Erweiterung, „Scan ALL of my page") je einmal scannen: `/onboarding`, `/home`, `/chat`, `/journal`, `/mood`, `/safety`, `/upgrade`, `/settings`. Jeden Befund der Kategorien *Critical* und *Serious* notieren.
5. Gegenprobe für die zwei bekannten Stellen mit `<div onClick>` (`grep -rn '<div[^>]*onClick' src --include='*.tsx'`): prüfen, ob sie per Tab erreichbar sind und Enter/Leertaste auslösen. Wenn nein, auf `<button>` umstellen.
6. Beschriftungsdichte gegenprüfen: `grep -rn 'aria-label' src --include='*.tsx' | wc -l` liefert derzeit 45. Jedes Icon-only-Element in `src/components/chat/ChatInputBar.tsx`, `MessagePlayButton.tsx`, `ChatActionButtons.tsx` und der Bottom-Navigation in `src/components/layout/AppLayout.tsx` einzeln nachsehen — Icon ohne zugänglichen Namen ist WCAG 4.1.2.

**WCAG 2.2:** 1.3.1 Info und Beziehungen (A) · 4.1.2 Name, Rolle, Wert (A) · 2.5.3 Beschriftung im Namen (A)

**Belegt durch:** grüner `pruefe("E1", …)`-Block in `scripts/gate.mjs` mit hinterlegter Ratchet-Zahl; axe-DevTools-Exporte (JSON) der acht Bildschirme unter `audit/a11y/axe_<datum>/`.

**Bewertung:**
- **100** — jsx-a11y läuft blockierend im Tor, Ratchet fällt monoton, axe meldet auf allen acht Bildschirmen null Critical/Serious.
- **70** — Regel läuft, aber nicht blockierend (nur im `lint`-Job mit `continue-on-error`), oder Critical/Serious auf höchstens einem Nebenbildschirm mit dokumentierter Ausnahme.
- **0** — Das Gerüst nennt für E1 kein Blocker-Kriterium (Spalte „—"). 0 gilt hier, wenn weder eine Lint-Regel noch ein axe-Lauf existiert, also kein Gegenstück im Code oder Prozess auffindbar ist.

---

### E2 — Tastaturbedienung und Fokusführung

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 40 min je Release
**Durchführung:**
1. `bun run dev`, Browser auf 1280 × 800, Maus wegräumen. Ab `/home` ausschließlich mit Tab, Shift+Tab, Enter, Leertaste, Escape und Pfeiltasten arbeiten.
2. **Kernfluss Chat:** `/chat` → Tab bis Texteingabe (`ChatInputBar.tsx`) → Text eingeben → Enter → Antwort abwarten → weiter Tab zu „Vorlesen" (`MessagePlayButton.tsx`) und den Aktions-Buttons (`ChatActionButtons.tsx`). Bei jedem Halt notieren: ist der Fokusring sichtbar (Definition in `src/index.css:279` und `src/components/ui/button.tsx:8`, `focus-visible:ring-2 ring-primary/20`) und liegt die Reihenfolge in Leserichtung?
3. **Dialogfallen:** Jeden Overlay einzeln öffnen und mit Escape verlassen: `AIConsentModal`, `SaveToJournalDialog`, `VoiceTranscriptConfirm`, `RealtimeVoicePanel` (`src/components/chat/`), Cookie-/Consent-Banner, `NativeCrashConsentModal`. Für jeden prüfen: (a) Fokus springt beim Öffnen in den Dialog, (b) Tab läuft im Kreis und verlässt den Dialog nicht, (c) Escape schließt, (d) Fokus kehrt auf das auslösende Element zurück. Radix-basierte Dialoge (`@radix-ui/react-dialog`, `-alert-dialog`) erfüllen a–d von Haus aus; jeder handgebaute Overlay ist der Verdachtsfall und muss einzeln belegt werden.
4. **Krisenpfad:** `/safety` vollständig per Tastatur durchlaufen — jede Notfallnummer muss per Tab erreichbar und per Enter auslösbar sein. Diese Fläche wird gesondert protokolliert; sie fällt unter die Blockerregel von Gruppe B, nicht nur unter E2.
5. **Fokus nicht verdeckt (neu in 2.2):** Im Chat nach unten scrollen, bis der Eingabebalken am unteren Rand klebt, dann rückwärts tabben. Kein fokussiertes Element darf ganz unter der Bottom-Navigation (`AppLayout.tsx`) oder dem Eingabebalken verschwinden.
6. **Nativ gegenprüfen:** iPhone mit angeschlossener Bluetooth-Tastatur, dieselben vier Schritte im TestFlight-Build. Der Capacitor-WebView verhält sich beim Fokus-Scrolling anders als Safari auf dem Desktop.

**WCAG 2.2:** 2.1.1 Tastatur (A) · 2.1.2 Keine Tastaturfalle (A) · 2.4.3 Fokus-Reihenfolge (A) · 2.4.7 Fokus sichtbar (AA) · 2.4.11 Fokus nicht verdeckt, Minimum (AA, neu in 2.2)

**Belegt durch:** ausgefülltes Protokoll `audit/a11y/E2_tastatur_<version>.md` mit einer Zeile je Bildschirm und je Dialog (erreichbar / Ring sichtbar / Escape / Rückgabe des Fokus), plus Bildschirmaufnahme des Chat-Durchlaufs.

**Bewertung:**
- **100** — Alle Bildschirme und Dialoge bestanden **und** ein Vitest-Rendertest je Overlay sichert Fokusfang und Escape gegen Rückfall ab, blockierend im Tor.
- **70** — Alle Kernflüsse bedienbar, eine dokumentierte Einschränkung auf einer Nebenfläche (z. B. `/admin`, `/dev-qa`).
- **0** — **Falle ohne Ausweg**: ein Dialog oder Bereich, den die Tastatur betritt und nicht wieder verlassen kann.

---

### E3 — Kontrast und Schriftskalierung

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 35 min je Release
**Durchführung:**
1. **Kontrast automatisiert:** axe DevTools auf `/home`, `/chat`, `/journal`, `/mood`, `/safety`, `/upgrade` — je einmal im hellen und einmal im dunklen Modus (Umschalter über `next-themes`, oder Chrome DevTools → Rendering → *Emulate CSS prefers-color-scheme*). Regel „color-contrast" muss null Treffer liefern.
2. **Kontrast an den Token statt an der Seite:** Die Farbwerte stehen als HSL-Variablen in `src/index.css`. Für jedes Paar Vordergrund/Hintergrund (`--foreground`/`--background`, `--muted-foreground`/`--background`, `--primary-foreground`/`--primary`, `--destructive-foreground`/`--destructive`) den Wert im Kontrastrechner prüfen: ≥ 4.5:1 für Fließtext, ≥ 3:1 für Text ab 18,66 px fett bzw. 24 px. `--muted-foreground` auf `--background` ist der übliche Durchfaller.
3. **Nicht-Text-Kontrast:** Fokusring (`ring-primary/20` — 20 % Deckkraft ist der Verdachtsfall), Eingabefeldrahmen, Umschalter und Slider in `src/components/ui/` gegen ihren Hintergrund messen: ≥ 3:1.
4. **Schriftskalierung Web:** Browser auf 200 % (Cmd +, fünfmal) bei Viewport 1280 px, dann alle sechs Bildschirme durchsehen. Kein abgeschnittener Text, keine überlappenden Elemente, keine horizontale Scrollleiste.
5. **Reflow:** Viewport auf 320 × 256 px stellen (Chrome DevTools, Responsive). Inhalt muss ohne horizontales Scrollen lesbar bleiben.
6. **Schriftskalierung iOS:** Einstellungen → Bedienungshilfen → Anzeige & Textgröße → Größerer Text auf Maximum, dazu „Fetter Text" an. App aus TestFlight starten, `/chat`, `/mood`, `/safety` und den Eingabebalken prüfen. Achtung: Ein WebView skaliert `rem` nicht automatisch mit Dynamic Type — wenn sich am Layout **gar nichts** ändert, ist das kein bestandener Test, sondern der Befund, dass die Systemeinstellung wirkungslos ist.
7. **Schriftskalierung Android:** Einstellungen → Anzeige → Schriftgröße auf Maximum **und** Anzeigegröße auf Maximum (zwei getrennte Regler, beide einzeln prüfen), dann dieselben Bildschirme.

**WCAG 2.2:** 1.4.3 Kontrast Minimum (AA) · 1.4.11 Nicht-Text-Kontrast (AA) · 1.4.4 Textgröße ändern, 200 % (AA) · 1.4.10 Reflow, 320 px (AA)

**Belegt durch:** Tabelle der gemessenen Kontrastwerte je Token-Paar in `audit/a11y/E3_kontrast_<version>.md`; Screenshots bei 200 % Web, iOS-Maximum und Android-Maximum je Bildschirm.

**Bewertung:**
- **100** — Alle Token-Paare ≥ Schwelle, alle drei Skalierungswege ohne Layoutbruch, **und** ein Vitest- oder Skripttest rechnet die Kontrastwerte direkt aus `src/index.css` nach und bricht den Build bei Unterschreitung.
- **70** — Web und eine der beiden nativen Plattformen bestanden, die zweite mit dokumentierter Einschränkung.
- **0** — **Text unlesbar**: ein Kontrastwert unter 4.5:1 im Fließtext eines Kernbildschirms, oder Text bei 200 % abgeschnitten bzw. überlappt.

---

### E4 — Screenreader: Streaming-Antworten und Statuswechsel

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 50 min je Release (25 min VoiceOver, 25 min TalkBack)
**Durchführung:**
1. **iPhone, VoiceOver an** (Dreifachklick Seitentaste). App aus TestFlight starten. Bedienung ausschließlich mit VoiceOver-Gesten: nach rechts wischen (nächstes Element), Doppeltippen (aktivieren), Zwei-Finger-Wisch nach oben (ab Anfang vorlesen), Rotor drehen (Überschriften / Formularelemente).
2. **Kernfluss:** `/home` → „Chat" ansteuern und aktivieren → Texteingabe finden → Nachricht diktieren oder tippen → senden → Antwort abwarten. Protokollieren, was VoiceOver an jeder Station ansagt.
3. **Der entscheidende Messpunkt — Streaming.** `src/components/chat/ChatMessages.tsx:72` setzt `aria-live="polite"` auf die laufende Assistenz-Nachricht, während `src/hooks/useStreamingDisplay.ts` den Text **wortweise alle ~28 ms** anhängt. Zu prüfen ist genau das Zusammenspiel: Sagt VoiceOver den Text **einmal zusammenhängend nach Abschluss** an, oder wird der wachsende Absatz bei jedem Wort neu von vorn vorgelesen? Letzteres macht den Chat für blinde Nutzer unbenutzbar und ist der wahrscheinlichste Befund. Antwortdauer ab Absendezeitpunkt bis zur ersten verständlichen Ansage mit der Stoppuhr messen.
4. **Statuswechsel:** Die beiden `role="status" aria-live="polite"`-Bereiche (`ChatMessages.tsx:190` Ladezustand, `:220` Tippanzeige) müssen genau einmal angesagt werden, nicht wiederholt in Schleife. Ebenso das Umschalten in den Sprachmodus (`RealtimeVoicePanel.tsx`): Wechsel „hört zu" → „denkt nach" → „spricht" muss hörbar sein, ohne den Bildschirm zu sehen.
5. **Krisenpfad:** Nachricht „ich will nicht mehr leben" senden. Die eingeblendete Krisenkarte und die Notfallnummern müssen ohne Sichtkontakt auffindbar und auslösbar sein. Wenn die Karte nur visuell erscheint und im Fokusbaum nicht auftaucht, ist das ein Blocker aus Gruppe B, nicht nur E4.
6. **Android, TalkBack an** (Lautstärketasten 3 s halten): Schritte 2–5 wiederholen. Gesten: nach rechts wischen, Doppeltippen, „Von oben lesen" über das TalkBack-Menü (Dreifingertipp). Der Streaming-Punkt aus Schritt 3 verhält sich unter TalkBack regelmäßig anders als unter VoiceOver — beide getrennt protokollieren.
7. **Formularbeschriftungen:** In `/mood` und `/journal` mit dem Rotor auf „Formularelemente" umstellen und durchgehen. Jedes Element muss einen eigenen Namen haben („Stimmung 3 von 5", nicht „Schaltfläche").

**WCAG 2.2:** 4.1.3 Statusmeldungen (AA) · 1.3.1 Info und Beziehungen (A) · 2.4.6 Überschriften und Beschriftungen (AA) · 3.3.2 Beschriftungen oder Anweisungen (A)

**Belegt durch:** Zwei Bildschirmaufnahmen mit Ton (iOS VoiceOver, Android TalkBack) über den vollen Kernfluss inklusive Krisennachricht, abgelegt unter `audit/a11y/E4_<version>/`; dazu ein Protokoll mit der gemessenen Zeit bis zur ersten verständlichen Ansage der Streaming-Antwort.

**Bewertung:**
- **100** — Kernfluss auf beiden Plattformen ohne Sichtkontakt vollständig bedienbar, Streaming-Antwort wird einmal zusammenhängend angesagt, **und** ein Rendertest sichert `aria-live`, `role="status"` sowie die zugänglichen Namen der Krisenkarte gegen Rückfall ab.
- **70** — Kernfluss auf beiden Plattformen bedienbar, aber die Streaming-Ansage wiederholt sich; dokumentierter Behelf (z. B. Ansage erst nach Abschluss) ist geplant und terminiert.
- **0** — **Kernfluss nicht bedienbar**: Nachricht senden, Antwort erfassen oder Krisennummer auslösen ist mit Screenreader nicht möglich.

---

### E5 — Reizreduktion: prefers-reduced-motion

**Ebene:** 1 (Tor) — Gerüst: „einmalig automatisieren, danach kostenlos"
**Zeitbedarf:** Einrichtung 90 min einmalig, danach 0; Sichtprüfung 10 min je Release
**Durchführung:**
1. Bestand aufnehmen: Der CSS-Kill-Switch steht in `src/index.css:12` (`@media (prefers-reduced-motion: reduce)`), der framer-motion-Schalter in `src/App.tsx:188` (`MotionConfig`), drei Komponenten fragen die Medienabfrage selbst ab (`src/components/home/ContinueModule.tsx:12`, `src/components/streak/StreakCounter.tsx:17`, `src/components/streak/StreakMilestone.tsx:41`). `src/App.css:30` benutzt die **Umkehrung** (`no-preference`) — diese Stelle gesondert prüfen, sie greift den Kill-Switch nicht ab.
2. **Die Falle im Testaufbau zuerst beheben.** `src/test/setup.ts` ersetzt `window.matchMedia` durch einen Stub, der **immer** `matches: false` liefert. Jeder Vitest-Test zu Reizreduktion prüft damit heute ausschließlich den Aus-Zweig und kann nie rot werden. Neuer Test `src/test/reduced-motion.test.tsx` muss `window.matchMedia` je Testfall selbst überschreiben und für die Abfrage `(prefers-reduced-motion: reduce)` `matches: true` zurückgeben.
3. Testinhalt: Die drei Komponenten aus Schritt 1 mit `matches: true` rendern und belegen, dass die statische Variante gerendert wird (kein `animate-`-Klassenname, keine `motion.`-Übergangsprops). Zusätzlich `src/App.tsx` rendern und prüfen, dass `MotionConfig` mit `reducedMotion="user"` gesetzt ist.
4. Statischer Ratchet im Tor: `pruefe("E5", …)` in `scripts/gate.mjs`, der (a) belegt, dass der `@media (prefers-reduced-motion: reduce)`-Block in `src/index.css` noch vorhanden ist, und (b) über alle `src/**/*.css` nach `animation` oder `transition` mit `!important` sucht — solche Deklarationen hebeln den Kill-Switch aus und müssen null Treffer haben. Erst nach dem Bau der Prüfung `E5` in die Ebene-1-Liste eintragen, sonst bricht K7 die CI.
5. Sichtprüfung: macOS Systemeinstellungen → Bedienungshilfen → Anzeige → „Bewegung reduzieren" an, `bun run dev`, dann alle Bildschirmwechsel (`/home` → `/chat` → `/journal` → `/mood` → `/toolbox`), den Streak-Zähler, die Meilenstein-Animation und das Companion-Bild ansehen. Es darf keine parallaxe, keine skalierende und keine über den Bildschirm fahrende Bewegung mehr geben; Ein- und Ausblenden ist zulässig.
6. Auf iOS gegenprüfen: Einstellungen → Bedienungshilfen → Bewegung → „Bewegung reduzieren" an, TestFlight-Build starten, dieselben Flächen. Der Kommentar in `src/components/layout/AppLayout.tsx:21` behauptet, dass Route-Übergänge dann vollständig entfallen — genau das ist zu verifizieren, nicht zu glauben.

**WCAG 2.2:** 2.3.3 Animation aus Interaktionen (AAA) · 2.2.2 Pausieren, Beenden, Ausblenden (A) · 2.3.1 Grenzwert von dreimaligem Blitzen (A)

**Belegt durch:** grüner `pruefe("E5", …)`-Block; `src/test/reduced-motion.test.tsx` mit eigenem matchMedia-Stub; zwei Bildschirmaufnahmen (macOS, iOS) mit aktivierter Systemeinstellung.

**Bewertung:**
- **100** — Test und Ratchet laufen blockierend im Tor, der matchMedia-Stub aus `setup.ts` ist je Testfall überschrieben, Sichtprüfung auf Web und iOS ohne Restbewegung.
- **70** — Kill-Switch wirkt nachweislich, aber die Absicherung besteht nur aus der Sichtprüfung; kein Test verhindert, dass eine neue Animation ihn umgeht.
- **0** — Das Gerüst nennt für E5 kein Blocker-Kriterium (Spalte „—"). 0 gilt hier, wenn die Systemeinstellung nachweislich ohne Wirkung bleibt — insbesondere, wenn Tests nur gegen den `matches: false`-Stub laufen und damit nie den geprüften Zustand herstellen.

---

### H1 — Fehlerbehandlung ohne weißen Bildschirm

**Ebene:** 1 (Tor) — Gerüst-Rhythmus „jeder PR"; laut Korrekturtabelle vom 28.07. derzeit **ungeprüft**, weil „Testsuite grün" fälschlich als Beleg verbucht war
**Zeitbedarf:** Einrichtung 3 h einmalig, danach 0; manuelle Gegenprobe 20 min je Release
**Durchführung:**
1. Abdeckung feststellen: `SectionErrorBoundary` umschließt in `src/App.tsx` genau sechs Routen — `/home`, `/chat`, `/journal`, `/topics`, `/mood`, `/toolbox` (Zeilen 222–227). Alle übrigen Routen hängen nur an der globalen `ErrorBoundary`. Liste der ungeschützten Routen erstellen; `/safety`, `/upgrade`, `/settings`, `/summary`, `/timeline`, `/chat-history`, `/companion` gehören dazu.
2. Neuen Test `src/test/error-boundary.test.tsx` schreiben — heute existiert **kein einziger** (`grep -rln "ErrorBoundary" src/test/` liefert nichts). Je Route eine Kindkomponente rendern, die beim Rendern wirft, und drei Zusicherungen prüfen: (a) das Dokument ist nicht leer, (b) ein sichtbarer, deutschsprachiger Auffangtext ist vorhanden, (c) mindestens ein bedienbares Element führt zurück (Neuladen, „Zur Startseite").
3. Die vierte Zusicherung ist die Soulvay-spezifische: Vom Auffangbildschirm aus muss ein Weg zu `/safety` bestehen. Ein Absturz darf den Krisenpfad nicht mitreißen. Wenn `src/components/ErrorBoundary.tsx` diesen Ausgang nicht anbietet, ist das der erste Befund und nicht verhandelbar.
4. Laufzeitfehler ergänzen, nicht nur Renderfehler: Ein `Promise`-Reject in einem `useEffect` wird von keiner Error Boundary gefangen. Prüfen, ob `window.onunhandledrejection` irgendwo behandelt wird, und wenn nicht, in `src/main.tsx` einen Handler ergänzen, der an Sentry meldet und einen Toast zeigt.
5. `pruefe("H1", …)` in `scripts/gate.mjs` ergänzen, der `bunx vitest run src/test/error-boundary.test.ts` auswertet; erst danach `H1` in die Ebene-1-Liste eintragen (sonst K7-Bruch).
6. Manuelle Gegenprobe je Release: In der laufenden App über `/dev-qa` oder die DevTools-Konsole einen Fehler in der Chat-Ansicht auslösen und den Auffangbildschirm auf dem Gerät ansehen — der Text muss deutsch, menschlich und mit Ausweg formuliert sein (Überschneidung mit D4).

**Belegt durch:** `src/test/error-boundary.test.tsx` mit einer Zusicherungsgruppe je Route; grüner `pruefe("H1", …)`-Block im Tor; Screenshot des Auffangbildschirms vom Gerät.

**Bewertung:**
- **100** — Jede Route ist von einer Boundary gedeckt, jede hat einen Test, der Auffangbildschirm bietet einen Weg zurück **und** zu `/safety`, und unbehandelte Promise-Rejects werden abgefangen — alles blockierend im Tor.
- **70** — Die sechs Hauptrouten sind gedeckt und getestet, die übrigen hängen dokumentiert an der globalen Boundary.
- **0** — **Totalausfall**: ein Fehler führt zu weißem Bildschirm ohne Wiederherstellungsmöglichkeit, oder — gleichwertig — es existiert kein Test, der das ausschließt (ungeprüfte Punkte zählen als 0).

---

### H2 — Verhalten bei schlechter Verbindung

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 30 min je Release
**Durchführung:**
1. Vorbereitung: Testkonto mit Bestandsdaten, `bun run dev`, Chrome DevTools → Network → Throttling. Vier Profile nacheinander: *Fast 4G*, *Slow 4G*, *Offline*, sowie ein selbst angelegtes Profil mit 50 kbit/s und 2000 ms Latenz („abbrechend").
2. **Chat, Abbruch mitten im Stream:** Nachricht senden, warten bis die ersten Wörter erscheinen, dann auf *Offline* schalten. Erwartung: sichtbare, deutschsprachige Fehlermeldung; der bereits empfangene Teil bleibt stehen oder wird sauber verworfen; die eigene Nachricht bleibt im Verlauf und geht nicht verloren; ein Wiederholungsweg existiert.
3. **Tagebuch, längster Verlustfall:** In `/journal` einen Eintrag mit ≥ 800 Zeichen tippen, auf *Offline* schalten, speichern. Erwartung: Der Text bleibt im Feld oder als Entwurf erhalten. Anschließend wieder online schalten und prüfen, ob der Eintrag nachträglich ankommt oder ob der Nutzer ihn erneut auslösen muss — beides ist zulässig, stiller Verlust nicht.
4. **Stimmung offline:** In `/mood` einen Eintrag mit Notiz offline speichern, App neu laden, prüfen ob der Eintrag da ist.
5. **Sprachmodus:** Sprachgespräch starten (`RealtimeVoicePanel`), währenddessen auf *Offline* schalten. Erwartung: der Modus endet sichtbar und hörbar, kein stummes Hängenbleiben, das Mikrofon wird freigegeben.
6. **Krisennachricht offline:** „ich will nicht mehr leben" im Offline-Zustand senden. Die Krisenkarte muss erscheinen — die Erkennung ist eine reine Funktion ohne Netz (`src/lib/crisisDetection.ts`). Schlägt das fehl, ist es ein B2-Blocker.
7. **Nativ gegenprüfen:** iPhone über Xcode → Devices → *Network Link Conditioner* mit dem Profil „Very Bad Network" und „100 % Loss", Schritte 2 und 3 im TestFlight-Build wiederholen. Der Offline-Zustand wird im WebView über `navigator.onLine` gelesen (`src/hooks/useNetworkStatus.ts`), das auf iOS träger reagiert als im Desktop-Browser.
8. Für Regressionszwecke kann der eingebaute Simulator (`src/hooks/useNetworkSimulator.ts`, Ereignis `dev-network-sim`, Bedienoberfläche unter `/dev-qa`) genutzt werden — er ersetzt aber nicht die echte Drosselung, weil er nur den Statuswert setzt und keine Anfrage tatsächlich abbricht.

**Belegt durch:** Protokoll `audit/H2_netz_<version>.md` mit einer Zeile je Szenario (Profil · Fläche · beobachtetes Verhalten · Datenverlust ja/nein) und Bildschirmaufnahme der Szenarien 2 und 3.

**Bewertung:**
- **100** — Alle sieben Szenarien ohne Datenverlust und mit verständlicher Meldung, **und** mindestens die Entwurfssicherung in Tagebuch und Stimmung ist durch einen Vitest-Test gegen Rückfall gesichert.
- **70** — Kein Datenverlust, aber in einem Szenario fehlt die Rückmeldung an den Nutzer (stiller Fehlschlag mit erhaltenen Daten).
- **0** — **Datenverlust**: ein getippter Tagebuch- oder Stimmungseintrag verschwindet bei Verbindungsabbruch ersatzlos.

---

### H3 — Monitoring und Alarmierung

**Ebene:** 3 (Quartals-Audit) — Gerüst-Rhythmus monatlich, im Quartalslauf mitgeführt
**Zeitbedarf:** 60 min
**Durchführung:**
1. Konfiguration gegen den Quelltext prüfen: `src/lib/sentry.ts` — `beforeSend` liefert `null`, wenn `isCrashReportingAllowed()` falsch ist (Zeile 131). Einwilligung ist auf Web **und** nativ standardmäßig **aus**. Daraus folgt der strukturelle blinde Fleck, der zuerst zu quantifizieren ist: **Sentry sieht nur den Anteil der Abstürze, der der Einwilligungsquote entspricht.**
2. Einwilligungsquote messen: In der Datenbank bzw. über `track-event` den Anteil der Nutzer bestimmen, die Crash-Reporting aktiv zugestimmt haben. Diese Zahl ins Protokoll. Liegt sie unter 20 %, ist jede Sentry-Fehlerzahl mit dem Kehrwert hochzurechnen, bevor sie beurteilt wird.
3. `release`-Feld prüfen: `sentry.ts:127` setzt `soulvay@${VITE_APP_VERSION || "dev"}`. `VITE_APP_VERSION` ist an keiner Stelle im Repository gesetzt (weder in `vite.config.ts`, noch in `.github/workflows/ci.yml`, noch in `package.json`) — alle Ereignisse laufen damit unter der Release-Kennung `soulvay@dev` und lassen sich keinem Build zuordnen. Das ist der erste zu behebende Befund; ohne Release-Zuordnung ist eine Regression nach einem Update nicht erkennbar.
4. **Serverseite:** Die 23 Deno-Edge-Functions melden ausschließlich über `console.error` in die Supabase-Function-Logs. Prüfen, ob es dafür eine Aufbewahrungsfrist, eine Suchmöglichkeit und **irgendeine Alarmierung** gibt. Wenn nicht: blinder Fleck für die gesamte Serverseite, einschließlich `supabase/functions/chat/index.ts`, also des Krisenpfads.
5. **Krisenpfad überwachen — und zwar ohne Inhalt.** Das Gerüst fordert unter H3 Überwachung des Krisenpfads, unter B5 zugleich, dass kein Krisentext das Gerät verlässt. Beides zugleich erfüllt nur ein **inhaltsfreier Zähler**: Anzahl erkannter Krisen je Tag, Anzahl ausgelieferter Krisenkarten, Anzahl Fehlschläge beim Rendern der Notfallressourcen — ohne Text, ohne Nutzerkennung. Prüfen, ob ein solcher Zähler existiert. Heute existiert er nicht.
6. **Alarme:** In der Sentry-Konsole nachsehen, welche Alert Rules angelegt sind, an welchen Kanal sie melden und wann sie zuletzt ausgelöst haben. Eine Regel, die seit Monaten nie feuerte, ist zu testen, nicht zu vertrauen.
7. **Alarmtest (Pflicht, kein Konfigurationsblick):** Über `/dev-qa` einen Testfehler auslösen (die Seite zeigt in Zeile 46/248 an, ob die Einwilligung gerade greift), mit erteilter Einwilligung. Stoppuhr: Wie lange, bis die Meldung im Kanal ankommt? Ohne diesen Durchstich ist H3 nicht geprüft, sondern nur gelesen.

**Belegt durch:** `audit/H3_monitoring_<quartal>.md` mit: gemessener Einwilligungsquote, Liste der aktiven Alert Rules mit letztem Auslösezeitpunkt, Screenshot der zugestellten Testmeldung mit Zeitstempel, Aussage zur Function-Log-Alarmierung.

**Bewertung:**
- **100** — Fehler aus Client **und** Edge-Functions laufen in ein Werkzeug, Release-Kennung ist gesetzt, ein inhaltsfreier Krisenzähler mit Alarm bei Einbruch existiert, und der Alarmtest ist im laufenden Quartal durchgestochen.
- **70** — Client-Fehler sind sichtbar und alarmiert, die Edge-Functions sind es dokumentiert nicht.
- **0** — **blinder Fleck**: ein Ausfall des Krisenpfads oder ein Totalausfall einer Edge-Function bliebe unbemerkt, weil keine Alarmierung existiert oder der Alarmtest nie zugestellt wurde.

---

### H4 — Auslieferung: Artefakt gleich Quellstand

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 25 min je Release
**Durchführung:**
1. Ausgangsstand festhalten: `git status` muss sauber sein, `git rev-parse HEAD` notieren. Das ist der Stand, gegen den alles Folgende verglichen wird (`RELEASE.md`, Phase 1).
2. Frisch bauen: `rm -rf dist node_modules/.vite && bun run build`. Kein inkrementeller Build — der Build-60-Vorfall entstand genau daran.
3. Bundle-Marker prüfen (`RELEASE.md`, Phase 3): `bun run verify:ios` muss „✅ Item #1A im Bundle" melden; zusätzlich `grep -l 'Sentry.init\|@sentry' dist/assets/*.js` und `grep -l 'configurePurchases\|purchases-capacitor' dist/assets/*.js` mit je mindestens einem Treffer.
4. **Der eigentliche Nachweis „Artefakt = Quellstand":** Nach `npx cap sync ios` die kopierten Dateien gegen `dist` hashen:
   `diff <(cd dist && find . -type f -exec shasum {} \; | sort) <(cd ios/App/App/public && find . -type f -exec shasum {} \; | sort)`
   Erwartung: keine Ausgabe. Jede Abweichung bedeutet ein veraltetes WebView-Bundle — der Build-60-Fehler in Reinform.
5. **Commit im Artefakt verankern.** Heute enthält das Bundle keine Commit-Kennung; `VITE_APP_VERSION` wird nirgends gesetzt (siehe H3, Schritt 3). Vor der nächsten Auslieferung im Build-Schritt `VITE_APP_VERSION=$(git rev-parse --short HEAD)` setzen, damit der Vergleich Artefakt ↔ Quellstand maschinell und nachträglich möglich ist statt nur zum Bauzeitpunkt.
6. Versionsstand: `/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/App/App/Info.plist` gegen den vorherigen TestFlight-Build vergleichen — muss echt größer sein. `ios/App/App.xcodeproj/project.pbxproj` führt derzeit `CURRENT_PROJECT_VERSION = 60` und `MARKETING_VERSION = 1.1`; beide Quellen müssen zueinander passen, sonst zeigt Xcode etwas anderes an als das Plist. `plutil -lint ios/App/App/Info.plist` muss „OK" melden.
7. **Rückrollweg belegen, nicht behaupten:** Den vorherigen Build in App Store Connect benennen (Buildnummer), und für die PWA prüfen, wie ein Rückzug erfolgt — `vite-plugin-pwa` läuft mit `registerType: "autoUpdate"`, ein fehlerhafter Service Worker verteilt sich damit selbsttätig. Konkret protokollieren: Welcher Handgriff bringt Nutzer zurück auf den vorherigen Stand, und wie lange dauert er?
8. Für Android (vor Launch) denselben Ablauf mit `npx cap sync android` und dem Hash-Vergleich gegen `android/app/src/main/assets/public` durchführen; Signaturkette nach `audit/KEYSTORE_SETUP.md` prüfen.

**Belegt durch:** `audit/H4_auslieferung_<build>.md` mit: HEAD-Hash, Ausgabe des Hash-Vergleichs (leer), Marker-Trefferliste, CFBundleVersion vorher/nachher, benanntem Rückrollziel.

**Bewertung:**
- **100** — Hash-Vergleich leer, alle Marker treffen, Commit-Kennung steckt im Bundle, Rückrollweg ist benannt **und** ein CI-Schritt vergleicht Artefakt gegen HEAD automatisch.
- **70** — Alle Prüfungen bestanden, aber von Hand; kein CI-Schritt verhindert, dass jemand die Checkliste überspringt.
- **0** — **Artefakt veraltet**: der Hash-Vergleich zeigt Abweichungen, oder ein Bundle-Marker fehlt und es wurde trotzdem archiviert.

---

### H5 — Lastgrenzen, Kosten und Not-Aus

**Ebene:** 3 (Quartals-Audit) — Gerüst-Rhythmus monatlich, im Quartalslauf mitgeführt
**Zeitbedarf:** 45 min Prüfung; **vorgelagert 1–2 Tage Bauarbeit**, siehe Schritt 1
**Durchführung:**

> **Was zuerst gebaut werden muss.** Diese Prüfung ist heute nicht bestehbar, und zwar nicht wegen fehlender Messung, sondern wegen fehlender Bauteile:
> **(a) Kein Rate-Limit pro Nutzer für die Sprachausgabe.** `supabase/functions/text-to-speech/index.ts` begrenzt nur die Textlänge je Aufruf (`maxLength = 2000`) und reicht ein Upstream-429 von ElevenLabs durch (Zeile 103). Einen Zähler je Nutzer gibt es nicht.
> **(b) Der einzige Schutz davor ist abgeschaltet.** `requirePremium` ruft `enforcePremium` (`supabase/functions/_shared/auth.ts:140`), und `PREMIUM_GATE_MODE` steht per Voreinstellung auf `"off"` — die Funktion kehrt sofort zurück, ohne zu prüfen. Jeder angemeldete Nutzer kann heute unbegrenzt Sprachausgabe gegen den ElevenLabs-Schlüssel erzeugen.
> **(c) Kein Not-Aus.** Eine Suche nach `kill.switch|feature_flag|maintenance` über `supabase/` und `src/` findet nichts außer dem CSS-Kommentar zur Bewegungsreduktion. Es gibt keinen Weg, einen teuren Anbieter abzuschalten, ohne neu zu deployen.
>
> **Bauliste vor der ersten Durchführung:** (1) Tabelle `daily_tts_usage` analog zu `daily_chat_usage` mit Zähler je Nutzer und Tag, geprüft in `text-to-speech/index.ts` vor dem Aufruf an ElevenLabs; (2) Tabelle `feature_flags` (oder Supabase-Secret) mit je einem Schalter für `tts_enabled`, `voice_realtime_enabled`, `llm_enabled`, gelesen in `_shared/`, mit definiertem Verhalten bei „aus" — Sprachfunktionen liefern eine verständliche Meldung, **der Krisenpfad bleibt unberührt**; (3) Budgetgrenzen und Alarme in den Konsolen von ElevenLabs, Gemini/Lovable-Gateway und Supabase.

1. Bestehende Grenzen inventarisieren und je Grenze Wert, Ort und Ausnahme notieren: Chat-Tageslimit für Nichtzahler (`supabase/functions/chat/index.ts:676–700`, `DAILY_LIMIT`, Krisennachrichten ausdrücklich ausgenommen über `!isCrisis`) · Textlängengrenze TTS (2000 Zeichen) · E-Mail-Warteschlange mit 429-Abkühlung (`process-email-queue/index.ts:62–70`). Alles Übrige gilt bis zum Gegenbeweis als unbegrenzt.
2. Deployten Wert von `PREMIUM_GATE_MODE` in der Supabase-Konsole ablesen (nicht den Vorgabewert im Code). Steht er auf `"off"` oder `"log"`, ist Punkt (b) offen.
3. **Lasttest mit einem Konto:** Mit einem Test-JWT 100 Aufrufe gegen `text-to-speech` fahren, je 2000 Zeichen, seriell mit 1 s Abstand. Erwartung nach dem Umbau: Ab der konfigurierten Grenze antwortet die Funktion mit 429 und einer verständlichen Meldung, **ohne** ElevenLabs zu erreichen. Vor dem Umbau ist das Ergebnis der Nachweis der Lücke — Kosten in der ElevenLabs-Konsole vorher/nachher ablesen und den Betrag je 100 Aufrufe protokollieren. Diesen Betrag mit 1000 multiplizieren: das ist die Tagesrechnung bei einem einzigen missbrauchten Konto.
4. **Not-Aus-Durchstich:** Schalter `tts_enabled` auf `false` setzen. Innerhalb von 60 s muss die App die Sprachausgabe verweigern, ohne Absturz und mit deutschsprachiger Meldung. Danach zurückschalten und die Wiederherstellungszeit messen.
5. **Der Not-Aus darf den Krisenpfad nicht mitreißen.** Bei gesetzten Schaltern `llm_enabled=false` **und** `tts_enabled=false` die Nachricht „ich will nicht mehr leben" senden: Krisenkarte und Notfallnummern müssen unverändert erscheinen. Das ist die Invariante aus B2 und hat Vorrang vor jeder Kostenerwägung.
6. **Budgetgrenzen:** In jeder Anbieterkonsole (ElevenLabs, LLM-Gateway, Supabase) nachsehen: Ist eine harte Obergrenze gesetzt, oder nur eine E-Mail-Benachrichtigung? Nur eine harte Grenze ist eine Grenze. Betrag, Zeitraum und Verhalten bei Erreichen protokollieren.

**Belegt durch:** `audit/H5_lastgrenzen_<quartal>.md` mit: Tabelle aller Grenzen (Wert · Ort im Code · Ausnahme), Kostenmessung aus Schritt 3, Screenshot der Anbieter-Budgetgrenzen, Protokoll des Not-Aus-Durchstichs mit gemessener Wirkzeit, Nachweis der unberührten Krisenkarte aus Schritt 5.

**Bewertung:**
- **100** — Rate-Limit je Nutzer für jede kostenverursachende Funktion, harte Budgetgrenzen bei allen Anbietern, Not-Aus im laufenden Quartal durchgestochen, Krisenpfad nachweislich ausgenommen — und ein Test sichert die Ausnahme des Krisenpfads gegen Rückfall.
- **70** — Rate-Limits und Not-Aus existieren, aber eine Fläche (z. B. Echtzeit-Sprache über `elevenlabs-conversation-token`) ist dokumentiert noch ungedeckelt.
- **0** — **kein Not-Aus**: es gibt keinen Weg, einen kostenverursachenden Anbieter ohne neues Deployment abzuschalten. Das ist der heutige Stand.

---

### I1 — Abo-Lebenszyklus

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 70 min je Release (iOS-Sandbox 40 min, Stripe-Test 30 min)
**Durchführung:**
1. Zwei frische Wegwerf-Konten anlegen: eines für iOS-Sandbox (Sandbox-Apple-ID in Einstellungen → App Store → Sandbox-Account), eines für den Web-/Stripe-Weg. Vorher in der Datenbank prüfen: Für beide Nutzer darf in `subscriptions` keine Zeile existieren.
2. **Kauf iOS:** In der App auf `/upgrade` das Abo kaufen. Danach drei Stellen gegeneinander halten: (a) RevenueCat-Konsole zeigt den Kauf, (b) `supabase/functions/revenuecat-webhook/index.ts` hat ein `INITIAL_PURCHASE` verarbeitet (Function-Log), (c) `subscriptions.status` steht auf `active`. Anschließend in der App: Ist die Premium-Oberfläche freigeschaltet, ohne dass der Nutzer neu starten muss?
3. **Wiederherstellung:** Auf einem zweiten Gerät mit derselben Apple-ID anmelden und „Käufe wiederherstellen" auslösen (`src/hooks/useRevenueCat.ts:417`, `src/hooks/useAppleIAP.ts:266`). Zusätzlich den stillen Weg prüfen: App neu installieren und ohne Zutun starten — `useAppleIAP.ts:171` führt eine automatische Wiederherstellung beim Start aus, gedeckelt über `AUTO_RESTORE_KEY`. Beide Wege müssen zum freigeschalteten Zustand führen.
4. **Kündigung:** In den Sandbox-Abo-Einstellungen kündigen. Erwartung: `CANCELLATION` im Webhook, Zugang bleibt bis zum Periodenende bestehen. Prüfen, dass die App das auch so anzeigt („läuft bis …", nicht „gekündigt, kein Zugang").
5. **Ablauf:** Sandbox-Abos verkürzen die Laufzeit stark (Monatsabo ≈ 5 min). Ablauf abwarten. Erwartung: `EXPIRATION`, Status wechselt, die Premium-Oberfläche sperrt sich beim nächsten Start.
6. **Rückerstattung und die weniger geübten Ereignisse:** Der Typ in `revenuecat-webhook/index.ts:14–24` deckt `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNCANCELLATION`, `NON_RENEWING_PURCHASE`, `SUBSCRIPTION_PAUSED`, `EXPIRATION`, `BILLING_ISSUE`, `PRODUCT_CHANGE`, `TRANSFER` ab — der `switch` ab Zeile 106 behandelt jedoch nur einen Teil davon. Für jedes im Typ genannte, aber im `switch` nicht behandelte Ereignis eine Zeile ins Protokoll: Was passiert heute (Fall-through, Status unverändert)? Insbesondere `BILLING_ISSUE` (Zahlung fehlgeschlagen, Kulanzfrist) und `TRANSFER` (Abo wandert zu einem anderen Konto) sind zu benennen.
7. **Stripe-Weg:** Mit Testkarte `4242 4242 4242 4242` über `create-checkout` kaufen. Ereignisse in `supabase/functions/stripe-webhook/index.ts` durchspielen: `checkout.session.completed` (Zeile 95), `customer.subscription.updated` (145), `customer.subscription.deleted` (167), `invoice.payment_succeeded` (179), `invoice.payment_failed` (192). Letzteres über eine Testkarte mit erzwungenem Fehlschlag auslösen. Nach jedem Ereignis `subscriptions.status` ablesen.
8. **Die Kernfrage bei jedem der sieben Schritte:** Gibt es einen Zustand, in dem Geld geflossen ist und die App gesperrt bleibt? Jeder solche Zustand wird namentlich protokolliert, auch wenn er sich nach 30 s von selbst auflöst.

**Belegt durch:** `audit/I1_abo_<version>.md` mit einer Zeile je Ereignis (Auslöser · Webhook-Log-ID · `subscriptions.status` vorher/nachher · Zustand in der App · Verzögerung in Sekunden); Screenshots der RevenueCat- und Stripe-Ereignislisten.

**Bewertung:**
- **100** — Alle sieben Schritte auf beiden Wegen bestanden, jedes im Typ deklarierte RevenueCat-Ereignis hat ein definiertes Verhalten, **und** die Zustandsabbildung Ereignis → Status ist durch einen Vitest-Test gegen `revenuecat-webhook` und `stripe-webhook` abgesichert.
- **70** — Kauf, Wiederherstellung, Kündigung und Ablauf bestanden; Rückerstattung und die selteneren Ereignisse dokumentiert ungeprüft.
- **0** — **Zahlung ohne Freischaltung**: ein bezahlter Kauf führt in irgendeinem der Schritte nicht zum freigeschalteten Zustand.

---

### I2 — Berechtigungen serverseitig durchgesetzt

**Ebene:** 1 (Tor) — Gerüst-Rhythmus „jeder PR", automatisiert; derzeit nicht im Tor
**Zeitbedarf:** Erstdurchlauf 90 min, danach 20 min je Release (bzw. 0 nach Automatisierung)
**Durchführung:**
1. Ausgangsbefund festhalten — der bestimmt, ob überhaupt etwas zu messen ist: In `supabase/config.toml` steht bei jeder Funktion `verify_jwt = false`. Die Plattform prüft also nichts; der gesamte Schutz liegt in der Funktion selbst. Eine Funktion, die `requireUser` vergisst, ist offen.
2. Schutzstufe je Funktion aus dem Quelltext auslesen und tabellieren:
   `grep -rn "requireUser\|requireAIConsent\|requireAIConsentAndPremium\|requirePremium" supabase/functions/*/index.ts`
   Ergebnis heute: `journal-reflect`, `weekly-recap`, `session-insight`, `generate-summary` nutzen `requireAIConsentAndPremium`; `detect-patterns` und `extract-memories` nur `requireAIConsent`; `elevenlabs-conversation-token` nur `requireUser`; `text-to-speech` `requirePremium`.
3. Diese Tabelle gegen `src/components/premium/FeatureMatrix.tsx` halten. Der erste Befund fällt dabei sofort auf: „Voice conversations" ist dort `free: false`, aber `elevenlabs-conversation-token/index.ts:17` verlangt nur einen angemeldeten Nutzer, keinen Zahlungsstatus.
4. **Den entscheidenden Schalter ablesen:** `enforcePremium` (`supabase/functions/_shared/auth.ts:140`) liest `PREMIUM_GATE_MODE` und kehrt bei `"off"` sofort zurück — Vorgabe ist `"off"`. Den **deployten** Wert in der Supabase-Konsole ablesen. Steht er nicht auf `"enforce"`, ist jede `requirePremium`-Zeile im Code wirkungslos, und I2 ist unabhängig vom Rest des Durchlaufs gescheitert.
5. **cURL-Matrix fahren.** JWT eines Kontos ohne aktives Abo besorgen (Supabase-Auth, Testkonto aus I1 vor dem Kauf). Dann je Funktion:
   ```
   curl -i -X POST "$SUPABASE_URL/functions/v1/<name>" \
     -H "Authorization: Bearer $FREE_JWT" \
     -H "Content-Type: application/json" \
     -d '<minimale gültige Nutzlast>'
   ```
   Durchzufahren: `text-to-speech`, `elevenlabs-conversation-token`, `journal-reflect`, `weekly-recap`, `session-insight`, `generate-summary`, `detect-patterns`, `extract-memories`, `generate-companion`. Erwartung je Premium-Funktion: **402** (oder 403). Jede **200** ist ein Treffer.
6. Denselben Durchlauf ohne `Authorization`-Kopfzeile wiederholen. Erwartung durchgehend **401**. Eine 200 ohne Token ist der schwerere Befund und gehört zusätzlich unter C2.
7. Chat-Tageslimit gegenprüfen: Mit dem Gratis-JWT die Funktion `chat` über `DAILY_LIMIT` hinaus aufrufen. Erwartung: 429. Danach **eine Krisennachricht** senden — sie muss durchkommen, weil `!isCrisis` sie von der Zählung ausnimmt (`chat/index.ts:679`). Ein 429 auf eine Krisennachricht ist ein B2-Blocker, nicht nur I2.
8. Automatisieren: Die Matrix aus Schritt 5 und 6 als Skript `scripts/entitlement-probe.mjs` ablegen, das gegen eine lokale `supabase start`-Instanz mit zwei angelegten Testnutzern läuft, und als `pruefe("I2", …)` ins Tor hängen. Erst danach `I2` in die Ebene-1-Liste eintragen (sonst K7-Bruch).

**Belegt durch:** `audit/I2_entitlement_<version>.md` mit der vollständigen cURL-Matrix (Funktion · mit Gratis-JWT · ohne JWT · erwarteter Code · tatsächlicher Code), dem abgelesenen `PREMIUM_GATE_MODE`-Wert aus der Konsole und den rohen Antwort-Kopfzeilen.

**Bewertung:**
- **100** — Jede in der Preistabelle als Premium ausgewiesene Funktion antwortet einem Gratis-Konto mit 402/403 und einem Aufruf ohne Token mit 401, `PREMIUM_GATE_MODE` steht auf `"enforce"`, **und** `scripts/entitlement-probe.mjs` läuft blockierend im Tor.
- **70** — Alle Premium-Funktionen serverseitig gesperrt, aber der Nachweis erfolgt von Hand; kein Tor verhindert, dass eine neue Funktion ungeschützt hinzukommt.
- **0** — **Gratis-Zugriff auf Bezahltes**: mindestens eine Premium-Funktion liefert einem Konto ohne aktives Abo eine 200. Beim heutigen Stand (`PREMIUM_GATE_MODE` = `"off"`, `elevenlabs-conversation-token` nur mit `requireUser`) ist das der zu erwartende Befund.

---

### I3 — Plattformübergreifende Abos

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 60 min
**Durchführung:**
1. Ein Testkonto mit **einer** E-Mail-Adresse anlegen, das auf beiden Wegen benutzt wird. Vor Beginn in `subscriptions` prüfen: keine Zeile für diesen `user_id`.
2. Datenmodell vorab ansehen: `enforcePremium` liest die Abo-Zeile mit `.maybeSingle()` (`supabase/functions/_shared/auth.ts`). Das setzt **höchstens eine** Zeile je Nutzer voraus. Vor dem Test klären, was passiert, wenn zwei Anbieter je eine Zeile schreiben: Eindeutigkeitsbedingung auf `user_id` (dann überschreibt der zweite Kauf den ersten und die Herkunft geht verloren) oder keine (dann liefert `.maybeSingle()` einen Fehler und der Nutzer verliert den Zugang trotz zweier bezahlter Abos). Beide Ausgänge sind Befunde.
3. **Reihenfolge A — Web zuerst:** Auf `/upgrade` im Browser über Stripe (Testmodus) kaufen. `subscriptions.status` prüfen. Dann mit demselben Konto in der iOS-App anmelden und `/upgrade` öffnen. **Erwartung: Die App erkennt das bestehende Abo und bietet keinen Kauf an.** Wenn die Kaufschaltfläche erscheint, ist die Doppelbelastung nur einen Fingertipp entfernt — dann tatsächlich in der Sandbox kaufen und protokollieren, was mit der Datenbankzeile geschieht.
4. **Reihenfolge B — iOS zuerst:** Zweites Testkonto, in der Sandbox kaufen, dann im Browser `/upgrade` öffnen. Gleiche Erwartung, gleiche Protokollierung.
5. **Kündigung bei zwei Quellen:** Falls Schritt 3 oder 4 zu zwei aktiven Abos geführt hat: eines kündigen und beobachten, ob der Zugang fälschlich sofort verschwindet, obwohl das zweite noch läuft. Das ist der stille Folgefehler der Doppelbelastung.
6. **Der Kündigungsweg muss zur Quelle passen:** Ein über Apple abgeschlossenes Abo ist nur über Apple kündbar. Prüfen, ob `/cancellation` und `src/components/premium/SubscriptionSection.tsx` den richtigen Weg je Herkunft anzeigen. Ein Web-Kündigungsdialog für ein Apple-Abo ist eine Sackgasse und zugleich ein Store-Richtlinienproblem (J2).
7. Ergebnis in Euro ausdrücken: Wenn Doppelbelastung möglich ist, den Betrag je Monat und die Zahl der Nutzer benennen, die den Zustand theoretisch erreichen können.

**Belegt durch:** `audit/I3_plattformen_<quartal>.md` mit Datenbankauszug (`select * from subscriptions where user_id = …`) nach jedem Schritt, Screenshots beider `/upgrade`-Ansichten nach dem jeweils ersten Kauf und der Aussage zur Eindeutigkeitsbedingung.

**Bewertung:**
- **100** — Ein bestehendes Abo blockiert den Kauf auf der jeweils anderen Plattform sichtbar, das Datenmodell hält die Herkunft fest, der Kündigungsweg passt zur Herkunft, **und** ein Test sichert die Sperre gegen Rückfall.
- **70** — Doppelkauf ist nicht möglich, aber der Kündigungsweg wird nur einheitlich statt herkunftsabhängig angezeigt.
- **0** — **Doppelbelastung**: derselbe Nutzer kann auf beiden Plattformen zugleich zahlen.

---

### I4 — Wahrhaftigkeit der beworbenen Funktionen

**Ebene:** 2 (Release-Karte) — der maschinelle Teil läuft bereits als `pruefe("I4", …)` im Tor
**Zeitbedarf:** 30 min je Release
**Durchführung:**

> **Was die Maschine schon leistet:** `scripts/gate.mjs:197–210` liest alle `en: "…"`-Einträge aus `src/components/premium/FeatureMatrix.tsx`, nimmt das **erste Wort** jedes Namens, verwirft es bei weniger als 5 Zeichen und sucht den Rest als Teilzeichenkette in allen `src/**/*.ts(x)`. Damit ist abgedeckt: Ein völlig frei erfundener Funktionsname fällt auf.
>
> **Was sie nicht leistet — und was diese Prüfung deshalb von Hand tut:**
> - **Sechs der vierzehn Zeilen werden gar nicht geprüft**, weil ihr erstes Wort kürzer als 5 Zeichen ist: „Chat (Talk & Calm)", „Mood check-ins", „Free journaling", „Core exercises", „AI reflections", „Mood trends & insights".
> - Der Nachweis ist eine **Teilzeichenkette irgendwo im Quelltext** — ein Vorkommen in einem Kommentar, einem Übersetzungsschlüssel oder einer toten Datei zählt als Beleg.
> - Die zweite Hälfte des Gerüstpunkts — „**und ist so gesperrt wie behauptet**" — wird von der Maschine überhaupt nicht berührt. Die Spalten `free` und `premium` in `FeatureMatrix.tsx` werden nie gegen das tatsächliche Verhalten gehalten.

1. Mit einem Konto **ohne** aktives Abo anmelden (Testkonto aus I1 vor dem Kauf). Alle vierzehn Zeilen aus `FeatureMatrix.tsx` einzeln durchgehen.
2. Für jede Zeile mit `free: true` in der App belegen, dass die Funktion ohne Zahlung tatsächlich nutzbar ist — nicht nur sichtbar. Besonders: „Crisis resources" (`/safety` und die Krisenkarte im Chat) und „Core exercises" (`/toolbox`).
3. Für jede Zeile mit `free: false` belegen, dass die Sperre in der Oberfläche greift **und** dass sie serverseitig hält — Letzteres über die cURL-Matrix aus I2. Eine Sperre, die nur `PremiumGate.tsx` ist, erfüllt die Aussage der Preistabelle nicht.
4. Die sechs von der Maschine übersprungenen Zeilen bekommen je einen eigenen Protokolleintrag mit dem konkreten Bildschirm, auf dem die Funktion vorgeführt wurde.
5. Über die Preistabelle hinaus: Landing-Seite (`src/pages/Landing.tsx`), Store-Beschreibung in App Store Connect und `/faq` durchsehen. Jede dort beworbene Funktion, die in `FeatureMatrix.tsx` nicht auftaucht, ist unbelegt und gehört auf die Liste — die maschinelle Prüfung kennt nur die Preistabelle.
6. Verbesserung der maschinellen Prüfung vormerken (nicht im laufenden Release umsetzen): Mindestlänge 5 Zeichen durch einen gepflegten Abgleich Name → Codesymbol ersetzen, damit auch „Chat", „Mood" und „AI" geprüft werden.

**Belegt durch:** `audit/I4_wahrhaftigkeit_<version>.md` — Tabelle mit vierzehn Zeilen (Funktionsname · behauptet frei/premium · in der App vorgeführt auf Bildschirm X · serverseitige Sperre über cURL bestätigt ja/nein), plus Liste der außerhalb der Preistabelle beworbenen Funktionen.

**Bewertung:**
- **100** — Alle vierzehn Zeilen vorgeführt, jede Premium-Sperre serverseitig bestätigt, Landing- und Store-Text deckungsgleich, **und** die maschinelle Prüfung deckt alle vierzehn Zeilen ab statt nur acht.
- **70** — Alle Zeilen vorgeführt und richtig gesperrt, aber der maschinelle Teil prüft weiterhin nur acht von vierzehn; die Lücke ist dokumentiert.
- **0** — **verkaufte Funktion fehlt**: eine beworbene Funktion existiert nicht, oder eine als Premium ausgewiesene ist gratis nutzbar.

---

### K1 — Aussagekraft der Tests

**Ebene:** 3 (Quartals-Audit) — Gerüst-Rhythmus monatlich
**Zeitbedarf:** 90 min Erstdurchlauf (davon 60 min Skript), danach 15 min
**Durchführung:**
1. Grundgesamtheit bestimmen: `grep -rhoE '\b(it|test)\(' src/test | wc -l` — derzeit 236 Blöcke über 19 Dateien.
2. Klassifizierungsskript `scripts/test-aussagekraft.mjs` schreiben, das jede Datei in `src/test/` liest, die `it(`/`test(`-Blöcke aufteilt und jeden Block in eine von drei Klassen einordnet:
   - **Verhalten** — der Block ruft eine Funktion auf oder rendert eine Komponente und prüft das Ergebnis.
   - **Quelltextprüfung** — der Block liest eine Datei (`?raw`, `readFileSync`) und prüft mit `toContain`/`toMatch` auf eine Zeichenkette. Kandidaten sind heute `src/test/i18n-no-ghost-keys.test.ts`, `release-gate.test.ts`, `crisis-invariants.test.ts`, `crisis-detection.test.ts`.
   - **Strukturprüfung** — der Block prüft Konfiguration oder Datenformen (z. B. `exercises-data.test.ts`).
3. Anteil ausrechnen: Quelltextprüfungen ÷ Gesamtzahl. Blocker bei über 30 %.
4. Die Zahl allein genügt nicht. Für jeden als Quelltextprüfung eingestuften Block einzeln entscheiden, ob er **berechtigt** ist. `release-gate.test.ts` mit 36 `toContain`-Aufrufen ist der größte Posten und zuerst zu bewerten. Berechtigt sind Quelltextprüfungen dort, wo Verhalten nicht ausführbar ist — die Deno-Edge-Functions laufen in dieser Suite nie, `crisis-invariants.test.ts` prüft die **Reihenfolge** von Codeblöcken in `supabase/functions/chat/index.ts` und hat dafür keine Alternative. Diese Fälle werden in einer Ausnahmeliste geführt und aus dem Anteil herausgerechnet, mit Begründung je Eintrag.
5. Gegenprobe zur Selbsttäuschung: Für die drei umfangreichsten Quelltextprüfungen je eine Verhaltensvariante skizzieren. Wo eine existiert, ist die Quelltextprüfung nicht berechtigt, sondern bequem.
6. Ergebniszahl mit dem Vorquartal vergleichen. Der Anteil muss fallen oder gleich bleiben.

**Belegt durch:** `scripts/test-aussagekraft.mjs` samt Ausgabe in `audit/K1_aussagekraft_<quartal>.md`: Gesamtzahl, Aufteilung nach Klassen, Anteil in Prozent, kommentierte Ausnahmeliste, Vergleich zum Vorquartal.

**Bewertung:**
- **100** — Anteil unter 30 % **und** das Skript läuft im Tor als Ratchet, der bei jedem Anstieg bricht.
- **70** — Anteil unter 30 %, aber nur von Hand ermittelt; keine Ausnahmeliste mit Begründungen.
- **0** — **> 30 % reine Textprüfung** nach Abzug der begründeten Ausnahmen.

---

### K2 — Unabhängigkeit von Korpus und Spezifikation

**Ebene:** 1 (Tor) — als maschinelle Zeitstempelprüfung, Gerüst-Rhythmus „jeder PR"
**Zeitbedarf:** Einrichtung 2 h einmalig, danach 0; Bewertung 20 min je Quartal
**Durchführung:**
1. Die Regel steht im Gerüst („Korrigierte Unabhängigkeitsregel", Zeile 331) und ist artefaktbasiert: Prüfkorpus oder Spezifikation müssen ausweislich des Commit-Zeitstempels **vor** der Implementierung im Repository liegen und in einer getrennten Sitzung entstanden sein.
2. Paarliste anlegen — je Prüfpunkt das Paar (Prüfartefakt, Implementierung). Anfangsbestand:
   - B1/B7 → `src/test/crisis-detection.test.ts` ↔ `supabase/functions/_shared/crisisPatterns.ts`
   - B2/B3/B5 → `src/test/crisis-invariants.test.ts` ↔ `supabase/functions/chat/index.ts`
   - A6 → `src/test/i18n-no-ghost-keys.test.ts` ↔ `src/translations/`
   - I-Gruppe → `src/test/resolvePremium.test.ts` ↔ `src/lib/resolvePremium.ts`
3. Je Paar den Anlagezeitpunkt lesen:
   `git log --diff-filter=A --format=%aI -1 -- <pfad>`
   Ist der Zeitstempel des Prüfartefakts **später** als der der Implementierung, greift die Deckelregel: der Punkt kann höchstens 70 erreichen, unabhängig von der Messung.
4. Skript `scripts/unabhaengigkeit.mjs` schreiben, das die Paarliste aus einer Datei `audit/unabhaengigkeit.json` liest, beide Zeitstempel ermittelt und je Punkt „unabhängig / gedeckelt" ausgibt. Als `pruefe("K2", …)` ins Tor hängen — der Block darf nicht bei „gedeckelt" rot werden (das wäre eine Bewertung, kein Mangel), sondern nur, wenn ein Paar in der Liste fehlt oder auf eine nicht existierende Datei zeigt.
5. Für neue Prüfpunkte die Reihenfolge organisatorisch erzwingen: Korpus in eigenem Commit anlegen, mit Nachricht „Korpus vor Implementierung — K2", und erst danach implementieren. Das Zeitfenster ist der Nachweis; es lässt sich nachträglich nicht herstellen.
6. Beim Review jedes PRs, der einen Test ändert, eine Frage beantworten und im PR vermerken: Wurde dieser Test geschrieben, **nachdem** man in den Code gesehen hat? Ein Test, der einen Regulärausdruck aus dem Quelltext wiederholt, bestätigt nur sich selbst.

**Belegt durch:** `audit/unabhaengigkeit.json` mit der Paarliste; Ausgabe von `scripts/unabhaengigkeit.mjs` mit beiden Zeitstempeln je Paar; die Deckelmarkierung im Bewertungsblatt.

**Bewertung:**
- **100** — Für jeden bewerteten Punkt liegt ein Paar vor, das Skript läuft im Tor, und mindestens die Gruppen B, C und K haben je einen nachweislich unabhängigen Punkt (Voraussetzung für Gruppennoten über 70).
- **70** — Paarliste existiert und ist gepflegt, wird aber von Hand ausgewertet.
- **0** — **Test aus dem Code abgeleitet**: ein Prüfartefakt, dessen Zusicherungen aus der Implementierung übernommen wurden, wird trotzdem als Beleg geführt.

---

### K3 — Abdeckung ohne Artefakte

**Ebene:** 3 (Quartals-Audit) — Gerüst-Rhythmus „jeder PR"; laut Korrekturtabelle vom 28.07. derzeit **ungeprüft**
**Zeitbedarf:** 45 min
**Durchführung:**
1. `bunx vitest run --coverage` ausführen. Die Ausschlussliste in `vitest.config.ts` ist bereits gesetzt und ausdrücklich begründet (`node_modules`, `.claude/worktrees`, `dist`, `coverage`, `public/assets`, `android`, `ios`, `src/test`, `e2e`, `supabase`) — sie ist Teil der Prüfung und darf nicht stillschweigend erweitert werden.
2. **Die Ausschlusszeile, die die Zahl verändert:** `supabase/**` ist ausgeschlossen, weil Tests die Edge-Functions über `?raw` als Zeichenkette laden und v8 sie sonst als „100 % abgedeckt" meldet, obwohl keine Zeile ausgeführt wird. Das ist richtig — bedeutet aber, dass der **serverseitige Krisenpfad in `supabase/functions/chat/index.ts` überhaupt keine Abdeckungszahl hat**. Das ist als eigener Befund zu führen und nicht durch die Client-Zahl zu ersetzen.
3. Kernpfad definieren und je Datei ausweisen — nicht als Gesamtzahl:
   `src/lib/crisisDetection.ts` · `src/lib/crisisResources.ts` · `src/lib/region.ts` · `supabase/functions/_shared/crisisPatterns.ts` · `src/lib/resolvePremium.ts` · `src/lib/premium.ts` · `src/hooks/useChatComposer.ts` · `src/hooks/useCrisisWatch.ts` · `src/hooks/useChatPersistence.ts`.
4. Für jede dieser Dateien Zeilen- und Zweigabdeckung notieren. Blocker unter 60 % auf einer einzelnen Kernpfaddatei — nicht im Mittelwert. Ein Mittelwert über den Kernpfad verdeckt genau die eine ungetestete Datei, um die es geht.
5. `supabase/functions/_shared/crisisPatterns.ts` bekommt eine Sonderbehandlung: Sie liegt außerhalb von `src`, wird aber vom Client über `src/lib/crisisDetection.ts` importiert und dadurch tatsächlich ausgeführt. Prüfen, ob sie im Bericht auftaucht; wenn nicht, die Ausschlussliste so anpassen, dass genau diese Datei enthalten ist — sie ist die wichtigste Datei der App.
6. Zahl je Verzeichnis (`src/lib`, `src/hooks`, `src/components`, `src/pages`) tabellieren und mit dem Vorquartal vergleichen.

**Belegt durch:** `coverage/`-Bericht des Laufs, plus `audit/K3_abdeckung_<quartal>.md` mit der Kernpfad-Tabelle je Datei, der Verzeichnistabelle und der ausdrücklichen Feststellung, dass die Edge-Functions keine Zahl haben.

**Bewertung:**
- **100** — Jede Kernpfaddatei ≥ 60 % Zweigabdeckung, `crisisPatterns.ts` ist im Bericht enthalten, die Edge-Functions haben einen eigenen Messweg, **und** ein Schwellenwert in `vitest.config.ts` lässt den Build bei Unterschreitung brechen.
- **70** — Alle Kernpfaddateien im Client ≥ 60 %, die Edge-Functions bleiben dokumentiert ohne Zahl.
- **0** — **Kernpfad unter 60 %**: mindestens eine der in Schritt 3 genannten Dateien liegt darunter, oder es liegt kein Abdeckungsbericht vor (ungeprüft zählt als 0).

---

### K4 — CI-Gates blockieren wirklich

**Ebene:** 3 (Quartals-Audit) — Gerüst-Rhythmus monatlich
**Zeitbedarf:** 40 min
**Durchführung:**
1. `.github/workflows/ci.yml` lesen und die drei Jobs einzeln beurteilen: `test` (blockierend), `gate` (blockierend, ohne `continue-on-error`, mit vorgelagertem `python3 scripts/check-framework.py`), `lint` (**`continue-on-error: true`**, Zeile 61). Der Lint-Job ist der dokumentierte Gegenbeweis im Kommentar darüber und zählt bei dieser Prüfung als „nicht blockierend", auch wenn er rot leuchtet.
2. **Der eigentliche Punkt: Ein blockierender Job blockiert keinen Merge, solange er kein Required Check ist.** Abfragen:
   ```
   gh api repos/JoniJansen/mindmate-companion-11/branches/main/protection
   ```
   Erwartung: `required_status_checks.contexts` enthält „Tests" und „Tor (Prüfgerüst)". Fehlt der Branch-Schutz ganz (404), ist K4 unabhängig vom Rest gescheitert — dann kann jeder Merge an jedem roten Job vorbei.
3. **Wirksamkeitsdurchstich statt Konfigurationsblick:** Zweig `probe/k4-<datum>` anlegen, darin eine offensichtliche Verletzung einbauen (z. B. `expect(1).toBe(2)` in `src/test/zz-probe.test.ts`), PR gegen `main` öffnen. Belegen: (a) der Job `Tor (Prüfgerüst)` wird rot, (b) die Merge-Schaltfläche in der GitHub-Oberfläche ist **gesperrt**, nicht nur mit Warnhinweis versehen. Screenshot beider Zustände. Danach PR schließen und Zweig löschen.
4. Weiteren Umgehungsweg prüfen: Darf jemand mit Adminrechten „Merge without waiting for requirements" nutzen? (`enforce_admins` in der Schutzantwort aus Schritt 2.) Bei einem Ein-Personen-Team ist das der wahrscheinlichste stille Ausweg.
5. **E2E fehlt im Tor:** `playwright.config.ts` und `e2e/master-validation.spec.ts` existieren, aber kein CI-Job führt sie aus, und `baseURL` zeigt auf eine Lovable-Vorschau-URL statt auf einen im Lauf gestarteten Server. Das ist als Befund zu führen: Das Gerüst nennt E2E unter K4 ausdrücklich als eines der Gates.
6. **Secret-Scan fehlt im Tor:** Das Gerüst nennt unter C3 `gitleaks`/`trufflehog` in der CI. Vorhanden ist stattdessen die Musterprüfung in `gate.mjs:169–183`, die nur `src/**/*.ts(x)` und `android/app/build.gradle` liest — nicht `supabase/`, nicht `.env`, nicht `ios/`, nicht die Git-Historie. Als Lücke protokollieren.

**Belegt durch:** `audit/K4_gates_<quartal>.md` mit: JSON-Antwort der Branch-Schutz-Abfrage, Screenshots des roten Jobs und der gesperrten Merge-Schaltfläche aus Schritt 3, Liste der im Gerüst genannten, aber in der CI fehlenden Gates (E2E, Secret-Scan, blockierendes Lint).

**Bewertung:**
- **100** — Branch-Schutz aktiv mit `Tests` und `Tor (Prüfgerüst)` als Required Checks, `enforce_admins` an, Durchstich aus Schritt 3 im laufenden Quartal belegt, E2E und Secret-Scan als eigene blockierende Jobs vorhanden.
- **70** — Branch-Schutz aktiv und Durchstich belegt, aber E2E und Secret-Scan fehlen dokumentiert und Lint bleibt `continue-on-error`.
- **0** — **Gate ohne Wirkung**: ein Job ist rot und der Merge ist trotzdem möglich — sei es mangels Branch-Schutz, mangels Required Check oder über `continue-on-error`.

---

### K5 — Manuelle Geräte-Checkliste gepflegt und abgearbeitet

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 15 min je Release zusätzlich zur eigentlichen Abarbeitung
**Durchführung:**
1. Die Release-Karte steht heute nur als Fließtext im Gerüst (`audit/TEST_FRAMEWORK.md`, Abschnitt „Ebene 2", Zeile 316–318): A1 auf dem Gerät · B6 · B12 · B18 · C6 · Textdurchsicht (D3+D4) · Geräte-Smoke (G1–G5, je einmal iOS und Android, 15 min) · I1 · I4 · H4 · J10. Ein Fließtext lässt sich nicht abhaken.
2. Vorlage `audit/RELEASE_KARTE_VORLAGE.md` anlegen: eine Zeile je Punkt mit den Spalten *Punkt · Prüfhandlung in einem Satz · Gerät · Ergebnis (grün/gelb/rot) · Beleg (Screenshot/Protokolldatei) · Zeitpunkt*. Aus dieser Liste ergänzen: E2, E3, E4 (diese Prüfanweisung), H2 und H4.
3. Vor jedem Release die Vorlage nach `audit/RELEASE_KARTE_<version>.md` kopieren und tatsächlich ausfüllen. Ein Punkt ohne Beleg gilt als **ungeprüft**, nicht als bestanden — nach dem Bewertungsmaßstab also 0.
4. Am Ende die Zeitmessung eintragen: Gerüst veranschlagt 90 Minuten. Weicht die tatsächliche Zeit dauerhaft nach oben ab, ist die Karte zu kürzen, nicht die Prüfung zu überspringen — der Praktikabilitäts-Befund im Gerüst (Zeile 294) beschreibt genau diesen Verfall.
5. Vor dem Archivieren gegenzeichnen: Enthält die Karte einen roten Punkt, wird der Release gestoppt. Diese Entscheidung wird in derselben Datei festgehalten, mit Datum und Begründung, auch wenn trotzdem ausgeliefert wurde.
6. Verweisintegrität: `scripts/check-framework.py` prüft die Ebene-**1**-Liste maschinell gegen das Tor. Für Ebene 2 gibt es keine solche Bindung. Beim Quartalsaudit die Ebene-2-Liste im Gerüst gegen die zuletzt verwendete Karte abgleichen — driften sie auseinander, ist die Karte veraltet.

**Belegt durch:** `audit/RELEASE_KARTE_<version>.md` je ausgeliefertem Build, vollständig ausgefüllt, mit den referenzierten Belegdateien im selben Verzeichnis.

**Bewertung:**
- **100** — Für jeden Build der letzten zwei Quartale existiert eine vollständig ausgefüllte Karte mit Belegen, **und** ein Skript prüft beim Release, dass für die aktuelle Versionsnummer eine Karte ohne offene Zeilen vorliegt.
- **70** — Karte existiert und wird ausgefüllt, einzelne Punkte tragen aber keinen Beleg, sondern nur ein Häkchen.
- **0** — **ungeprüfte Punkte**: es wurde ausgeliefert, ohne dass für jeden Punkt der Karte ein Ergebnis vorliegt — der heutige Zustand, solange die Karte nur als Fließtext existiert.

---

### K6 — Gerüst-Integrität

**Ebene:** 1 (Tor) — läuft bereits maschinell als `pruefe("K6/K7", …)` und als eigener CI-Schritt „Prüfgerüst-Integrität"
**Zeitbedarf:** 20 min je Quartal (nur der nicht-maschinelle Teil)
**Durchführung:**

> **Was die Maschine schon leistet:** `scripts/check-framework.py` prüft Nummernlücken je Gruppe, Vorhandensein jeder Gruppenüberschrift (`## X —` oder `## X+ —`), doppelte Kennungen, Gewichtssumme = 100 %, fehlende Gewichte und ob jede Punktzeile mindestens drei gefüllte Spalten hat (Ersatzmaß für „Blocker-Kriterium vorhanden"). Ausgabe bei Mangel: Exit 1, das Tor wird rot.

1. Den blinden Fleck der Spaltenzählung prüfen: `check-framework.py` zählt nur, dass drei Spalten **gefüllt** sind. Ein Blocker-Kriterium, das inhaltlich leer ist („—", „siehe oben", „tbd"), besteht die maschinelle Prüfung. Alle Punktzeilen im Gerüst nach solchen Platzhaltern durchsehen: `grep -nE '^\|\s*[A-N][0-9]+\s*\|.*\|\s*(—|-|tbd|TBD|siehe)\s*\|?\s*$' audit/TEST_FRAMEWORK.md`. Heute betrifft das E1, E5, D1, D2, D5, J5 — je Zeile entscheiden, ob „kein Blocker" die bewusste Aussage ist oder eine Auslassung.
2. Zweiter blinder Fleck: Die Gruppenliste `GRUPPEN` in `check-framework.py:22–36` ist handgepflegt. Eine neue Gruppe im Dokument, die dort nicht eingetragen wird, führt zum Abbruch mit „unbekannte Gruppe" — das ist gewollt. Umgekehrt aber: Eine Gruppe, die im Dokument **gelöscht** wird, meldet „KEINE PUNKTE" und ist damit gedeckt. Beides einmal je Quartal gegenlesen.
3. Dritter blinder Fleck: Das Skript prüft die Nummerierung **je Gruppe von 1 bis max**, nicht die im Kopf behauptete Gesamtzahl. Das Dokument nennt in Zeile 7 „105 Prüfpunkte" und in Zeile 337 „alle 93 Punkte" — zwei Zahlen für dieselbe Menge, beide von der Maschine ungeprüft. Die tatsächliche Summe aus der Skriptausgabe („Gesamt: N Prüfpunkte") gegen beide Stellen halten und die Widersprüche im Dokument bereinigen.
4. Vierter Punkt, den keine Maschine sieht: **inhaltliche Widerspruchsfreiheit**. Das Gerüst dokumentiert selbst (Zeile 391), dass die Unabhängigkeitsregel an zwei Stellen in zwei Fassungen stand und der Widerspruch erst beim Zeile-für-Zeile-Abgleich auffiel. Einmal je Quartal das Dokument vollständig lesen und jede Regel, die zweimal vorkommt, auf Gleichlaut prüfen.
5. `python3 scripts/check-framework.py` ausführen und die Ausgabe unverändert ins Quartalsprotokoll übernehmen — sie ist zugleich der Beleg für K7.

**Belegt durch:** Ausgabe von `scripts/check-framework.py` im Quartalsprotokoll; Liste der Punkte mit Platzhalter-Blockern samt Entscheidung je Zeile; Abgleich der drei Gesamtzahlen.

**Bewertung:**
- **100** — Skript grün im Tor, keine Platzhalter-Blocker ohne dokumentierte Entscheidung, Gesamtzahl im Dokument stimmt an allen Nennstellen überein, und das Skript prüft die genannte Gesamtzahl mit.
- **70** — Skript grün, aber Platzhalter-Blocker oder widersprüchliche Gesamtzahlen bestehen dokumentiert fort.
- **0** — **Mangel gemeldet**: `check-framework.py` läuft mit Exit 1.

---

### K7 — Zuordnungstreue Gerüst ↔ Tor

**Ebene:** 1 (Tor) — läuft bereits maschinell in `scripts/check-framework.py:110–140`
**Zeitbedarf:** 25 min je Quartal (nur der nicht-maschinelle Teil)
**Durchführung:**

> **Was die Maschine schon leistet:** Sie liest die Ebene-1-Liste hinter `**Ebene 1 — Tor …**` aus dem Gerüst, sammelt alle Kennungen aus den `pruefe("…")`-Beschriftungen in `gate.mjs` (auch zusammengesetzte wie `B2/B3/B5`) und meldet drei Abweichungen: Punkte, die das Tor nennt, die es im Gerüst nicht gibt; Punkte, die in Ebene 1 stehen, aber im Tor fehlen; Punkte, die das Tor prüft, ohne in Ebene 1 zu stehen.

1. Den entscheidenden blinden Fleck benennen: Die Maschine vergleicht **Beschriftungen**, nicht Bedeutungen. Sie kann nicht erkennen, dass `pruefe("C1", "Jede Tabelle hat RLS")` nur die statische Hälfte von C1 misst — das Gerüst selbst hält das in Zeile 314 fest. Genau diese Klasse von Fehlern (fünf Prüfungen meldeten Punkte, die sie nicht maßen) war der Anlass für K7 und bleibt nur von Hand feststellbar.
2. Deshalb quartalsweise **zwölf Zeilen schreiben** — eine je `pruefe`-Block in `scripts/gate.mjs` — mit jeweils drei Angaben: (a) was der Block technisch misst, in einem Satz, (b) was der gemeldete Gerüstpunkt laut Tabellenzeile fordert, (c) ob (a) den Punkt **vollständig**, **teilweise** oder **gar nicht** abdeckt.
3. Für jedes „teilweise" den fehlenden Anteil ausdrücklich benennen und im Gerüst an der betreffenden Stelle vermerken. Anfangsbestand aus dieser Prüfrunde:
   - `C1` — statisch, RLS aktiviert ≠ Konto B erreicht Konto A nicht (bereits im Gerüst vermerkt).
   - `B7` — zählt ausgeführte Testnamen mit „ignores:", nicht die Richtigkeit der Erkennung: 50 triviale Negativfälle erfüllen die Schwelle.
   - `I4` — prüft 8 von 14 Zeilen der Preistabelle und nur per Teilzeichenkette (siehe I4).
   - `B3` — sucht `detectCrisis|crisisWatch.check` als Text in fünf Dateien; ein vorhandener, aber nie erreichter Aufruf besteht.
   - `C3` — prüft nur `src/**` und `android/app/build.gradle`, nicht `supabase/`, `.env`, `ios/` oder die Historie.
4. Für jedes „gar nicht" den Punkt im Bewertungsblatt auf `ungeprüft` zurückstufen und die Beschriftung im Tor korrigieren — dieselbe Korrektur, die am 28.07. sieben Punkte zurückgestuft hat.
5. Gegenrichtung prüfen: Jeder neue `pruefe`-Block braucht **vor** dem Eintrag in die Ebene-1-Liste eine Zeile in diesem Protokoll. Wer die Liste zuerst ergänzt, bekommt sofort einen roten Lauf — das ist die gewollte Wirkung, aber kein Ersatz für die Bedeutungsprüfung.

**Belegt durch:** `audit/K7_zuordnung_<quartal>.md` mit zwölf Zeilen (Blockbeschriftung · gemessen · gefordert · vollständig/teilweise/gar nicht · fehlender Anteil); dazu die unveränderte Ausgabe des Abschnitts „Zuordnung Gerüst ↔ Tor (K7)" aus `check-framework.py`.

**Bewertung:**
- **100** — Skript meldet „deckungsgleich", **und** alle zwölf Blöcke sind in der Handprüfung als „vollständig" belegt.
- **70** — Skript meldet „deckungsgleich", aber mindestens ein Block deckt seinen Punkt nur teilweise; die Lücke ist im Gerüst benannt und der Punkt entsprechend abgewertet.
- **0** — **ein Tor meldet einen Punkt, den es nicht misst**: eine Beschriftung nennt einen Gerüstpunkt, den der Block nachweislich nicht abdeckt, und der Punkt wird trotzdem als geprüft geführt.

---

### K8 — Reproduzierbarkeit lokal ↔ CI

**Ebene:** 1 (Tor) — Gerüst-Rhythmus „jeder PR"
**Zeitbedarf:** 75 min Erstdurchlauf, danach 15 min je Quartal
**Durchführung:**
1. **Ausgangslage lesen.** `gate.mjs:35–45` nagelt in `sh()` bereits drei Umgebungsvariablen fest: `CI=true`, `NO_COLOR=1`, `FORCE_COLOR=0`, und `OHNE_FARBE` (Zeile 33) entfernt ANSI-Sequenzen aus der Vitest-Zusammenfassung. Das war die Antwort auf den ersten CI-Lauf (lokal grün, in der CI vier rote Punkte). **Nicht** festgenagelt sind: Zeitzone, Sprachumgebung, Node-/Bun-Version und das Arbeitsverzeichnis.
2. **Basislauf lokal.** Sauberer Arbeitsbaum (`git status` leer), dann:
   `bun run gate > /tmp/k8_lokal.txt 2>&1; echo "exit=$?" >> /tmp/k8_lokal.txt`
   Zusätzlich Umgebung festhalten: `node -v`, `bun -v`, `python3 -V`, `date +%Z`, `echo $LANG`.
3. **Basislauf CI.** Denselben Commit pushen, im Job `Tor (Prüfgerüst)` das Protokoll des Schritts „Tor durchlaufen" herunterladen (`gh run view <id> --log > /tmp/k8_ci.txt`).
4. **Vergleich.** Beide Dateien auf die Ergebniszeilen reduzieren und diffen:
   `diff <(grep -E '^\s+[✓✗]' /tmp/k8_lokal.txt) <(grep -E '^\s+[✓✗]' /tmp/k8_ci.txt)`
   Erwartung: keine Ausgabe. Verglichen wird das Urteil **und** der Zahlenwert je Block (z. B. „98.4 %", „12/14") — beide sind deterministisch und dürfen sich nicht unterscheiden. Exit-Code beider Läufe muss übereinstimmen.
5. **Störmatrix — sechs Läufe, je einer pro Zeile.** Jeder muss dasselbe Urteil liefern wie der Basislauf:
   - `TZ=UTC bun run gate`
   - `TZ=Pacific/Kiritimati bun run gate` (UTC+14, verschiebt Tagesgrenzen)
   - `TZ=Pacific/Niue bun run gate` (UTC−11, Gegenrichtung)
   - `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bun run gate`
   - `LC_ALL=tr_TR.UTF-8 bun run gate` — **der wichtigste Lauf.** `gate.mjs` benutzt `.toLowerCase()` an zwei Stellen: bei der Tabellenerfassung für C1 (Zeile 190/191) und beim Funktionsnamensabgleich für I4 (Zeile 206/207). Im türkischen Gebietsschema wird „I" zu „ı" statt zu „i" — genau die Klasse Fehler, die ein Urteil vom Gebietsschema abhängig macht.
   - `FORCE_COLOR=3 bun run gate` (erzwungene Farbe von außen; `sh()` überschreibt sie, das ist zu belegen und nicht zu unterstellen).
6. **Doppellauf.** `bun run gate` zweimal unmittelbar nacheinander, beide Ausgaben diffen. Unterschiede deuten auf Zustand zwischen den Läufen hin (Vitest-Cache, `node_modules/.vite`).
7. **Frischer Klon.** `git clone <repo> /tmp/k8_clone && cd /tmp/k8_clone && bun install --frozen-lockfile && bun run gate`. Dasselbe Urteil erwartet. Deckt zugleich N6 ab. Achtung: `gate.mjs:17` leitet `ROOT` aus `import.meta.url` ab — der Lauf aus einem fremden Arbeitsverzeichnis (`node /tmp/k8_clone/scripts/gate.mjs` von `~` aus) ist ein eigener siebter Fall und ebenfalls zu fahren.
8. **Laufzeitumgebung.** Lokal ruft `bun run gate` intern `node scripts/gate.mjs` auf, das seinerseits `bunx vitest` startet; die CI benutzt `oven-sh/setup-bun@v2` mit `bun-version: latest`. „latest" ist kein festgenagelter Stand — die CI kann morgen eine andere Bun-Version haben als heute. Entweder eine feste Version eintragen oder die verwendete Version in jedem Lauf protokollieren, damit ein späterer Unterschied zuordenbar bleibt.
9. **Ergebnis in `gate.mjs` verankern.** Jede in Schritt 5 gefundene Abhängigkeit wird in `sh()` neutralisiert, indem die Variable dort mitgesetzt wird — mindestens `TZ: "UTC"` und `LC_ALL: "C"` zusätzlich zu den bestehenden drei. Anschließend Schritt 5 wiederholen; erst dann gilt K8 als belegt.

**Belegt durch:** `audit/K8_reproduzierbarkeit_<datum>.md` mit: beiden Basisprotokollen (lokal und CI) im Volltext, dem leeren Diff aus Schritt 4, einer Tabelle mit sieben Störläufen (Variable · Wert · Urteil identisch ja/nein), den notierten Werkzeugversionen und dem Diff von `gate.mjs` mit den ergänzten Festlegungen.

**Bewertung:**
- **100** — Lokal, in der CI, im frischen Klon und in allen sieben Störläufen identisches Urteil und identische Zahlenwerte, `TZ` und `LC_ALL` sind in `sh()` festgenagelt, die Bun-Version ist in `ci.yml` gepinnt.
- **70** — Lokal und CI stimmen überein, aber mindestens ein Störlauf ist ungeprüft oder die Bun-Version steht weiterhin auf `latest`.
- **0** — **Urteil hängt von Terminal, Sprache oder Zeitzone ab**: ein Störlauf liefert ein anderes Ergebnis als der Basislauf.

---

### K9 — Fehlbarkeit: die Mutationsprüfung

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 3,5 h beim ersten Durchlauf, danach ca. 2 h je Quartal
**Durchführung:**

**Vorbereitung (15 min)**
1. Arbeitszweig anlegen: `git switch -c probe/k9-<datum>`. **Keine Mutation wird jemals committet.** Rückweg nach jeder Mutation ist `git restore <datei>` bzw. `rm <neue-datei>`; anschließend `git status` — muss leer sein, bevor die nächste Mutation beginnt.
2. Basislauf: `bun run gate > /tmp/k9_basis.txt 2>&1; echo "exit=$?"`. Alle zwölf Blöcke müssen ✓ zeigen und der Exit-Code 0 sein. Ist der Basislauf nicht grün, wird K9 abgebrochen — eine Mutationsprüfung gegen einen bereits roten Ausgangszustand belegt nichts.
3. Protokolltabelle anlegen mit den Spalten: *Nr · Prüfblock · Mutation (Datei:Zeile) · erwartet rot · tatsächlich rot · Exit-Code · Meldungstext · Rückweg bestätigt*.
4. **Zwei Abnahmekriterien je Mutation, beide zwingend:**
   (a) Der Zielblock zeigt ✗ **und** der Prozess endet mit Exit-Code 1.
   (b) Der Meldungstext benennt den Grund. Ein Block, der zwar ✗ zeigt, aber „Zusammenfassung nicht auswertbar" oder „Prüfung selbst fehlgeschlagen" meldet, hat die Verletzung **nicht erkannt**, sondern ist an sich selbst gescheitert — historisch genau der Fehler, der K9 nötig machte („sein Auswerter erkannte nur bestandene Läufe"). Das ist zu protokollieren und zu beheben.
5. Zusätzlich je Mutation die **Kollateralspalte** führen: welche anderen Blöcke rot werden. Weicht sie von der Erwartung ab, ist das ein Kopplungsbefund (eine Prüfung misst etwas anderes mit).

---

**Mutation 1 — B1 „Krisenerkennung trifft" (Schwelle ≥ 95 %)**
- Datei: `supabase/functions/_shared/crisisPatterns.ts`, Funktion `detectCrisisIn`. Als erste Anweisung im Funktionskörper einfügen: `return { detected: false, severity: "none" };`
- Erwartet rot: **B1** (Quote fällt auf den Anteil der Negativfälle) · Kollateral erwartet: **B2/B3/B5** und **K10**, weil `crisis-invariants.test.ts` und die Gesamtsuite dieselbe Funktion benutzen.
- Zweite, feinere Mutation im selben Schritt (getrennt fahren): stattdessen genau **einen** Eintrag aus `HIGH_SEVERITY_PATTERNS` auskommentieren, der „ich will nicht mehr leben" abdeckt. Den resultierenden Prozentwert protokollieren. Dieser Wert beantwortet die eigentliche Frage: **Wie viele Fehltreffer verträgt die Prüfung, bevor sie rot wird?** Bleibt sie bei ≥ 95 %, ist die Schwelle für den wichtigsten Punkt der App zu locker — Befund, kein Fehlschlag der Mutationsprüfung.
- Rückweg: `git restore supabase/functions/_shared/crisisPatterns.ts`

**Mutation 2 — B2/B3/B5 „Krisenhilfe steht vor jedem Gate"**
- Datei: `supabase/functions/chat/index.ts`. Den Block ab `// ── Rate limit enforcement ──` (Zeile 676) ausschneiden und **oberhalb** der Krisenerkennung wieder einsetzen — also die Reihenfolge herstellen, die der Test laut Kommentarkopf (`crisis-invariants.test.ts`) verhindern soll.
- Erwartet rot: **B2/B3/B5** mit einer Zusicherungszahl kleiner als die Gesamtzahl · Kollateral erwartet: **K10**.
- Zweite Mutation getrennt fahren: `if (!isPremium && !isCrisis) {` (Zeile 681) zu `if (!isPremium) {` ändern — damit werden Krisennachrichten mitgezählt und limitiert. Ob die Prüfung **auch das** rot meldet, ist die schärfere Frage; eine Prüfung, die nur die Blockreihenfolge liest, übersieht diese Variante. Ergebnis protokollieren.
- Rückweg: `git restore supabase/functions/chat/index.ts`

**Mutation 3 — B3 „Alle Eingabeflächen überwacht" (5 Flächen)**
- Datei: `src/components/landing/DemoChat.tsx`. Den Aufruf `detectCrisis(` in `detectCrisisXX(` umbenennen (nur den Aufruf, damit die Datei weiterhin geparst wird — der Typfehler fällt dann N3 zu und ist eingeplant).
- Erwartet rot: **B3** mit Wert `4/5` und Meldung „ohne Prüfung: Demo-Chat" · Kollateral erwartet: **N3**, **K10**.
- Die Mutation für jede der fünf Flächen einzeln wiederholen (`src/hooks/useChatComposer.ts`, `src/pages/Journal.tsx`, `src/pages/Mood.tsx`, `src/hooks/useConversationalVoice.ts`), damit belegt ist, dass **jede** Fläche einzeln überwacht wird und nicht nur eine stellvertretend. Fünf Läufe, fünf Protokollzeilen.
- Rückweg: `git restore <jeweilige Datei>`

**Mutation 4 — B7 „Alltagssprache löst nicht aus" (≥ 50 Negativfälle)**
- Datei: `src/test/crisis-detection.test.ts`. Die beiden größten Negativfall-Arrays (die Schleifen bei Zeile 147 und 276) auf je zwei Einträge kürzen, sodass die Zahl ausgeführter `ignores:`-Tests unter 50 fällt.
- Erwartet rot: **B7** mit einer Zahl < 50 und dem Text „gefordert ≥ 50".
- Der Zusatzbefund, der hier zu notieren ist: Die Prüfung zählt **Testnamen**, nicht Erkennungsgüte. Die Gegenprobe belegt das — 50 Negativfälle mit identischem Text („aaa") würden bestehen. Diese Gegenprobe wird **nicht** ausgeführt, sondern als Grenze der Prüfung ins Protokoll geschrieben (Zuarbeit für K7).
- Rückweg: `git restore src/test/crisis-detection.test.ts`

**Mutation 5 — B21 „Erkennung aus einer Quelle" (zwei Bedingungen, zwei Mutationen)**
- **5a — geteilte Quelle entfernt:** In `supabase/functions/chat/index.ts` Zeile 3 (`import { detectCrisisIn, … } from "../_shared/crisisPatterns.ts";`) auskommentieren und eine lokale Minimalfassung von `detectCrisisIn` einsetzen. Erwartet: **B21** rot mit „Server nutzt eigene Muster".
- **5b — Duplikat wieder eingeführt:** Import stehen lassen und zusätzlich `const HIGH_SEVERITY_PATTERNS = [/dummy/];` in die Datei schreiben. Erwartet: **B21** rot mit „Duplikat wieder eingeführt".
- Beide Zweige sind zwingend. Der Block prüft `geteilt && !dupliziert`; eine Mutation belegt nur eine Hälfte der Bedingung.
- Rückweg je Variante: `git restore supabase/functions/chat/index.ts`

**Mutation 6 — K10 „Testsuite grün"**
- Neue Datei `src/test/zz-mutation.test.ts` mit einem Testfall `it("mutation", () => { expect(1).toBe(2); });`
- Erwartet rot: **K10** mit Wert `n-1/n`. **Besonders zu prüfen:** Meldet der Block die Zahlen oder „Zusammenfassung nicht auswertbar"? Der zweite Auswertungszweig in `testZahlen` (`gate.mjs:53`, Reihenfolge „x failed | y passed") existiert genau für diesen Fall und wird hier zum ersten Mal tatsächlich ausgeführt. Kollateral erwartet: kein anderer Block.
- Rückweg: `rm src/test/zz-mutation.test.ts`

**Mutation 7 — A6 „Keine Geister-Schlüssel"**
- Datei: `src/pages/Settings.tsx`. In einem gerenderten Textknoten `{t("mutation.geisterschluessel")}` einfügen — ein Schlüssel, den `src/translations/` nicht kennt.
- Erwartet rot: **A6** mit `gescheitert > 0` · Kollateral erwartet: **K10**.
- Zweite Variante getrennt fahren: einen Schlüssel als Template-String einfügen (`{t(\`mutation.${x}\`)}`). Erwartet: **A6 bleibt grün** — der Test prüft laut eigenem Kommentarkopf ausdrücklich keine dynamischen Schlüssel. Dieses „grün" ist der zu protokollierende Befund über die Reichweite der Prüfung, nicht ein Fehlschlag von K9.
- Rückweg: `git restore src/pages/Settings.tsx`

**Mutation 8 — N3 „Typprüfung fehlerfrei"**
- Datei: `src/lib/utils.ts`. Am Dateiende einfügen: `export const k9Mutation: number = "keine Zahl";`
- Erwartet rot: **N3** mit „1 Typfehler". Zu prüfen ist zusätzlich, dass die Fehlerzahl aus `e.stdout`/`e.stderr` überhaupt gelesen wird (`gate.mjs:163`) und nicht 0 lautet — eine Fehlerzahl 0 bei rotem Block wäre ein Auswerterfehler.
- Rückweg: `git restore src/lib/utils.ts`

**Mutation 9 — C3 „Keine Klartext-Geheimnisse" (vier Muster, vier Mutationen)**
- Für jedes der vier Muster in `gate.mjs:170–175` eine eigene Mutation, jeweils in `src/lib/utils.ts`:
  `const a = "sk_live_ABCDEFGHIJKLMNOP";` · `const b = "whsec_ABCDEFGHIJKLMNOP";` · in `android/app/build.gradle` `storePassword "geheim"` · `const d = '{"role": "service_role"}';`
- Erwartet rot: **C3** mit dem jeweils passenden Fundnamen und Datei.
- **Sicherheitsregel für diesen Schritt:** Die Werte sind erkennbare Attrappen, niemals echte Schlüssel. Nach jeder Variante sofort `git restore`, und vor Verlassen des Zweigs `git log -p` gegenlesen, dass keine dieser Zeilen in die Historie gelangt ist.
- Zusatzbefund ins Protokoll: Dieselbe Attrappe in `supabase/functions/chat/index.ts`, in `.env` oder in `ios/` einsetzen — der Block bleibt **grün**, weil er nur `src/**/*.ts(x)` und `android/app/build.gradle` liest. Das ist die dokumentierte Reichweitengrenze und die Begründung für einen echten `gitleaks`-Lauf (K4, Schritt 6).
- Rückweg: `git restore src/lib/utils.ts android/app/build.gradle`

**Mutation 10 — C1 „Jede Tabelle hat RLS"**
- Neue Datei `supabase/migrations/99999999999999_k9_mutation.sql` mit genau einer Zeile: `CREATE TABLE public.k9_probe (id uuid primary key);` — ohne `ALTER TABLE … ENABLE ROW LEVEL SECURITY`.
- Erwartet rot: **C1** mit Wert `32/33` (Zählerstand entsprechend der tatsächlichen Tabellenzahl) und „ohne RLS: k9_probe". Die Datei wird **nicht** angewandt (`supabase db push` unterbleibt) — der Block liest reinen Text.
- Zusatzbefund: Eine Zweitvariante mit `ALTER TABLE public.k9_probe ENABLE ROW LEVEL SECURITY;` **aber ohne jede Policy** lässt den Block grün werden. RLS ohne Policy sperrt zwar alles, belegt aber keine Mandantentrennung — dies als Reichweitengrenze protokollieren.
- Rückweg: `rm supabase/migrations/99999999999999_k9_mutation.sql`

**Mutation 11 — I4 „Keine verkauften Geisterfunktionen"**
- Datei: `src/components/premium/FeatureMatrix.tsx`. Eine Zeile in `featureRows` ergänzen: `{ name: { en: "Telepathy coaching", de: "Telepathie-Coaching" }, free: false, premium: true },`
- Erwartet rot: **I4** mit „ohne Entsprechung: Telepathy coaching" (erstes Wort „telepathy", 9 Zeichen, kommt im Quelltext nicht vor).
- Zweite Variante getrennt fahren: `{ name: { en: "Mind reading", de: "Gedankenlesen" }, … }` — erstes Wort „mind", 4 Zeichen, wird von der Längenregel übersprungen. Erwartet: **I4 bleibt grün.** Dieses „grün" ist der Beleg für die in I4 beschriebene Lücke und gehört als eigene Protokollzeile ins Ergebnis.
- Rückweg: `git restore src/components/premium/FeatureMatrix.tsx`

**Mutation 12 — K6/K7 „Prüfgerüst widerspruchsfrei" (sechs Mutationen, ein Block)**
Der Block ruft `scripts/check-framework.py` auf und meldet nur „vollständig" oder „meldet Mängel". Für jeden Prüfzweig des Skripts ist eine eigene Mutation nötig, sonst bleibt unbelegt, ob der Zweig überhaupt greift. Alle in `audit/TEST_FRAMEWORK.md` bzw. `scripts/gate.mjs`:
- **12a Nummernlücke:** Die Tabellenzeile `| E3 | Kontrast …` löschen. Erwartet: „⚠️ fehlt: [3]" für Gruppe E.
- **12b Fehlende Überschrift:** `## E — Barrierefreiheit` zu `## E - Barrierefreiheit` ändern (Geviertstrich → Bindestrich). Erwartet: „Überschrift für Gruppe E fehlt".
- **12c Gewichtssumme:** In der Gewichtungstabelle „E Barrierefreiheit | 4 %" auf „5 %" ändern. Erwartet: „Gewichte summieren sich auf 101 %".
- **12d Blocker fehlt:** In der Zeile E2 die letzte Spalte leeren. Erwartet: „Punkte ohne erkennbares Blocker-Kriterium: ['E2']".
- **12e K7, Richtung Gerüst → Tor:** In der Ebene-1-Liste (Zeile 297) `E1` ergänzen, ohne einen `pruefe`-Block zu bauen. Erwartet: „in Ebene 1 gelistet, aber im Tor nicht geprüft: ['E1']".
- **12f K7, Richtung Tor → Gerüst:** In `gate.mjs` die Beschriftung `pruefe("C1", …)` zu `pruefe("C99", …)` ändern. Erwartet: „Tor meldet Punkte, die im Gerüst nicht existieren: ['C99']" **und** „in Ebene 1 gelistet, aber im Tor nicht geprüft: ['C1']".
- Rückweg je Variante: `git restore audit/TEST_FRAMEWORK.md` bzw. `git restore scripts/gate.mjs`

---

**Abschluss (20 min)**
1. Nach der letzten Mutation: `git status` muss leer sein, `git diff` leer, `git log --oneline -1` unverändert gegenüber dem Startpunkt. Zweig löschen: `git switch - && git branch -D probe/k9-<datum>`.
2. Abschlusslauf `bun run gate` — alle zwölf Blöcke ✓, Exit 0. Ein K9-Durchlauf, der den Ausgangszustand nicht wiederherstellt, hat den Prüfstand beschädigt statt ihn belegt.
3. Auswertung: **Jede Prüfung**, die in keiner ihrer Mutationen rot wurde, ist der Blockerfall. Jede Prüfung, die zwar rot wurde, aber mit „nicht auswertbar" oder „Prüfung selbst fehlgeschlagen", wird als **bedingt fehlbar** geführt und vor dem nächsten Quartal repariert.
4. Die gesammelten Reichweitengrenzen aus den Mutationen 4, 7, 9, 10 und 11 in das K7-Protokoll übernehmen — sie sind die Antwort auf „was misst dieser Block tatsächlich".

**Belegt durch:** `audit/K9_mutationspruefung_<quartal>.md` mit der vollständigen Protokolltabelle (mindestens 24 Zeilen für die zwölf Blöcke inklusive Varianten), je Zeile der wörtlich kopierten Meldung aus der Tor-Ausgabe und dem Exit-Code; dazu die Ausgabe des Abschlusslaufs und der Nachweis des sauberen Arbeitsbaums.

**Bewertung:**
- **100** — Alle zwölf Blöcke wurden durch mindestens eine Mutation rot, jeder mit begründender Meldung statt „nicht auswertbar", der Ausgangszustand ist nachweislich wiederhergestellt, **und** die Mutationen sind als wiederholbares Skript (`scripts/k9-mutation.mjs`, das Mutation setzt, Tor läuft, zurücksetzt) hinterlegt, sodass der nächste Durchlauf keine Handarbeit ist.
- **70** — Alle zwölf Blöcke wurden rot, aber die Mutationen wurden von Hand gesetzt und sind nicht wiederholbar hinterlegt; oder bis zu zwei Blöcke meldeten rot mit „nicht auswertbar" statt mit Grund.
- **0** — **eine Prüfung, die nie rot werden kann**: mindestens ein Block bleibt trotz gezielter Verletzung grün, oder K9 wurde nie durchgeführt (ungeprüft zählt als 0 — der Stand vor diesem Durchlauf).

---

### K10 — Regressionsnetz

**Ebene:** 1 (Tor) — läuft bereits maschinell als `pruefe("K10", …)` über `bun run test`
**Zeitbedarf:** 20 min je Quartal (nur der nicht-maschinelle Teil)
**Durchführung:**

> **Was die Maschine schon leistet:** `gate.mjs:142–147` führt `bun run test` (= `vitest run`) aus und verlangt `bestanden === gesamt`. Zusätzlich läuft derselbe Befehl im eigenständigen CI-Job `Tests`.

1. **Die Grenze zuerst festhalten, weil sie historisch missbraucht wurde.** Die Korrekturtabelle vom 28.07. (Gerüst, Zeile 310) hält fest: „die vorhandene Testsuite läuft grün" wurde als Beleg für A2 (Persistenz), A4 (Eingabegrenzen), A5 (Zeitzonen) und H1 (Fehlerbehandlung) verbucht. K10 belegt **ausschließlich, dass kein vorhandener Test rot ist** — nicht, dass ein Bereich abgedeckt wäre. Diese Feststellung wird in jedem Quartalsprotokoll wiederholt.
2. Übersprungene Tests aufspüren: `bunx vitest run --reporter=verbose 2>&1 | grep -iE '↓|skip|todo|\.only'`. `it.skip`, `describe.skip` und `it.todo` werden von der Zusammenfassung **nicht** als „failed" gezählt — eine Suite, in der die Hälfte übersprungen wird, ist für den Block grün. Jeden Fund einzeln begründen oder entfernen.
3. `.only` ist der gefährlichere Fall: Ein vergessenes `it.only` reduziert die Suite stillschweigend auf einen Test, und `bestanden === gesamt` bleibt wahr. Prüfen: `grep -rn '\.only(' src/test/` muss null Treffer liefern; sonst als Ratchet in `gate.mjs` ergänzen.
4. Umfang gegen das Vorquartal halten: Gesamtzahl der Tests notieren (derzeit 236 `it`/`test`-Blöcke über 19 Dateien in `src/test/`). Fällt die Zahl, ohne dass Dateien bewusst entfernt wurden, ist ein Testverlust eingetreten — für den Block unsichtbar, weil weniger Tests genauso grün sind.
5. Laufzeit notieren. Eine Suite, die im Tor spürbar länger braucht als der Rest, wird irgendwann übersprungen; das ist der Vorbote desselben Verfalls, den das Gerüst für die Release-Karte beschreibt.
6. `e2e/master-validation.spec.ts` ausdrücklich aus dem Geltungsbereich nehmen: Playwright läuft in keinem CI-Job und `playwright.config.ts` zeigt mit `baseURL` auf eine Lovable-Vorschau-URL. K10 deckt die E2E-Ebene nicht ab; der Befund gehört zu K4.

**Belegt durch:** Ausgabe von `bun run test` mit Gesamtzahl und Laufzeit im Quartalsprotokoll; Liste aller `skip`/`todo`-Fundstellen mit Begründung; Trefferzahl von `.only` (muss 0 sein); Vergleich der Testanzahl zum Vorquartal.

**Bewertung:**
- **100** — Suite grün im Tor, keine `.only`-Treffer (als Ratchet abgesichert), jedes `skip`/`todo` begründet, Testanzahl gegenüber dem Vorquartal gleich oder gestiegen.
- **70** — Suite grün, aber übersprungene Tests bestehen unbegründet fort oder die Testanzahl ist ohne Erklärung gefallen.
- **0** — **ein Test rot**.
