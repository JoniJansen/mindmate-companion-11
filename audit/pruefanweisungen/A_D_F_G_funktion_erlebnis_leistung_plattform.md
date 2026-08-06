# Prüfanweisungen — Gruppen A (Funktionale Korrektheit), D (Erlebnisqualität), F (Performance), G (Plattform & Geräte)

*Entstanden am 28.07.2026 in vier getrennten Läufen, je einer pro Gruppe. Ein erster Versuch, alle 21 Punkte in einem Stück zu schreiben, scheiterte an der Ausgabegrenze — die Aufteilung ist die Antwort darauf. D und G wurden anschließend maschinell gegengeprüft und dabei in 16 Punkten korrigiert (falsche Zeilennummern, unvollständige Zählungen, ein nicht einhaltbarer Zeitbedarf). A und F sind am 06.08.2026 nachgeprüft: alle zehn Blocker-Kriterien stimmen wörtlich mit dem Gerüst überein, alle genannten Pfade existieren bis auf drei, die von den Anweisungen erst angelegt werden.*

---

## Gruppe A — Funktionale Korrektheit

### A1 — Kern-Flüsse end-to-end

**Ebene:** 2 (Release-Karte) — Ziel Ebene 1, sobald ein E2E-Lauf gegen den Build-Artefakt in der CI hängt
**Zeitbedarf:** 40 Minuten je Plattform (iOS und Android getrennt), 80 Minuten gesamt

**Durchführung:**

Der Gerüstpunkt nennt „automatisiert + manuell, Playwright, Gerät". **Der automatische Anteil deckt keinen einzigen Kernfluss ab.** `e2e/master-validation.spec.ts` hat 49 Zeilen und prüft ausschließlich, dass zehn öffentliche Seiten mit HTTP < 400 antworten und dass auf `/auth` zwei OAuth-Knöpfe sichtbar sind. Onboarding, Chat, Tagebuch, Stimmung und Übung kommen darin nicht vor. Dazu zwei Befunde, die den Lauf ohnehin wertlos machen: `playwright.config.ts` zeigt mit `baseURL` auf eine Lovable-Vorschau-URL statt auf den zu prüfenden Build, und in `.github/workflows/ci.yml` gibt es keinen Job, der Playwright startet. **Der gesamte Punkt wird heute von Hand gemessen.**

1. **Ausgangszustand herstellen.** App vollständig deinstallieren und neu installieren (iOS: App-Store- oder TestFlight-Build; Android: APK auf dem Samsung Galaxy A50). Damit sind `soulvay_onboarding_completed`, `soulvay-preferences`, `soulvay-moods`, `soulvay-completed-exercises` und `soulvay-chat-mode` sicher leer. Für den Webdurchlauf stattdessen ein privates Browserfenster verwenden.
2. **Fluss 1 — Onboarding.** `src/pages/Onboarding.tsx` führt vier Schritte: `name` → `need` → `companion` → `start` (Zeile 28). Je Schritt prüfen, ob der Weiter-Knopf gesperrt bleibt, solange die Bedingung aus Zeile 218–220 nicht erfüllt ist: Name nicht leer, Bedarf gewählt, Nicht-Therapie-Häkchen gesetzt. Auf Schritt 4 einmal ohne Häkchen tippen — der Knopf muss gesperrt bleiben. Danach registrieren und auf `/home` landen.
3. **Fluss 2 — Chat.** `/chat` öffnen, eine Nachricht senden, Streaming-Antwort abwarten. Drei Werte notieren: Zeit bis zum ersten sichtbaren Zeichen, Zeit bis zum Ende des Streams, ob die Antwort in der gewählten Sprache kommt. **Schwelle: erstes Zeichen ≤ 5 s, Ende ≤ 30 s auf dem A50** (der A50 ist das schwächste unterstützte Gerät; jenseits von 5 s ohne jede Rückmeldung brechen Nutzer den Versuch ab — darunter reicht der Tippindikator). Danach App schließen, neu öffnen, `/chat-history` aufrufen: das Gespräch muss dort stehen.
4. **Fluss 3 — Tagebuch.** `/journal` → neuer Eintrag, Titel und mindestens 60 Zeichen Text, speichern. Die Bestätigung `journal.saved` muss erscheinen und der Eintrag in der Liste stehen. **Danach die App vollständig beenden und neu starten** — erst dann ist bewiesen, dass der Eintrag den Server erreicht hat und nicht nur im Zustand des Bildschirms lag (siehe A2, Schritt 3: der Erfolgshinweis erscheint auch, wenn der Schreibvorgang gescheitert ist).
5. **Fluss 4 — Stimmung.** `/mood` → Stimmungswert **2** wählen (`LOW_MOOD_THRESHOLD` in `src/lib/moodExerciseMap.ts` ist 2), ein Gefühl „anxious" markieren, eine Notiz eintippen, speichern. Erwartung laut `getRecommendedExerciseId()`: die Übungsbrücke wird angeboten und schlägt `grounding-54321` vor. Zusätzlich prüfen, ob die Notiz als Tagebucheintrag mit `source: "mood-checkin"` auftaucht (`src/pages/Mood.tsx` Zeile 153–160).
6. **Fluss 5 — Übung.** Aus der Brücke heraus die Übung starten, vollständig bis zum Ende durchlaufen, den Abschluss bestätigen. Die Bestätigung `toolbox.exerciseCompleted` muss erscheinen; danach `/toolbox` öffnen und prüfen, ob die Übung als erledigt markiert ist (`soulvay-completed-exercises` in `localStorage`).
7. **Serverspur gegenprüfen.** Im Supabase-SQL-Editor ausführen:
   `select activity_date, activity_type from user_activity_log where user_id = '<testkonto>' order by activity_date desc;`
   Nach den Schritten 3–6 müssen **vier** Zeilen für den heutigen Tag stehen: `chat_session`, `journal_entry`, `mood_checkin`, `exercise_completed`. Fehlt eine, ist der zugehörige Fluss nur oberflächlich durchgelaufen.
8. **Zweiter Durchlauf mit Gratis-Grenze.** Denselben Chatfluss mit einem Konto ohne Abo wiederholen, bis die Tagesgrenze greift (`DAILY_MESSAGE_LIMIT = 15` in `src/hooks/usePremium.ts` Zeile 23). Prüfen, ob die Grenzmeldung erscheint und die App danach bedienbar bleibt.

**Belegt durch:** Protokollzeile je Fluss (Fluss · Plattform · Buildnummer · Dauer · bestanden/gescheitert), Screenshot je Fluss, SQL-Ergebnis aus Schritt 7, Datum.

**Bewertung:**
- **100** — Alle fünf Flüsse bestehen auf iOS und Android, **und** ein Playwright-Lauf fährt alle fünf Flüsse gegen den auszuliefernden Build (nicht gegen eine Vorschau-URL) in einem blockierenden CI-Job, der bei einem gebrochenen Fluss rot wird.
- **70** — Alle fünf Flüsse bestehen von Hand auf beiden Plattformen; automatisch geprüft sind weiterhin nur die zehn öffentlichen Seiten aus `e2e/master-validation.spec.ts`, und dieser Lauf hängt in keinem CI-Job. Die Lücke ist dokumentiert.
- **0** — Ein Kernfluss bricht: einer der fünf Flüsse lässt sich auf mindestens einer Plattform nicht bis zum Ende durchführen, oder die zugehörige Zeile in `user_activity_log` fehlt nach einem scheinbar erfolgreichen Durchlauf.

---

### A2 — Datenpersistenz & Synchronisation

**Ebene:** 2 (Release-Karte) — Ziel Ebene 1, sobald ein Integrationstest existiert
**Zeitbedarf:** 90 Minuten, zwei Geräte nötig

**Durchführung:**

**Warum dieser Punkt am 28.07.2026 auf „ungeprüft" zurückgestuft wurde:** Das Tor meldete A2, maß aber `bun run test` — also K10. Der Beleg lautete „Testsuite grün". Ein Blick in die Suite zeigt, warum das nichts über Persistenz aussagt: `src/test/phase2-hardening.test.ts` definiert die zu prüfenden Konstanten und Abläufe **innerhalb des Tests neu** (Zeile 78 `const DAILY_MESSAGE_LIMIT = 15`, Zeile 190 `const MAX_SINGLE_MSG_CHARS = 2500`, danach eine Kopie der Kürzungslogik) und importiert nichts aus dem Produktivcode. Solche Tests können nie rot werden, egal was die App tut. Ein Schreibvorgang wird in der gesamten Suite an keiner Stelle gegen eine echte Datenbank gefahren.

1. **Den ungeprüften Fehlerpfad zuerst ansehen.** In `src/pages/Journal.tsx` stehen die Schreibvorgänge als `await supabase.from("journal_entries").update(payload)...` (Zeile 213) und `await supabase.from("journal_entries").insert({...})` (Zeile 215) — **ohne dass das zurückgegebene `error`-Feld ausgewertet wird.** `supabase-js` wirft bei einem gescheiterten Schreibvorgang keine Ausnahme, sondern liefert `{ data: null, error }`. Der `catch`-Block darunter greift also nicht, und der Code läuft weiter in die Erfolgsmeldung `journal.saved`, leert den Entwurf (`setDraftContent("")`, `clearPart("journalDraft")`) und schließt den Editor. Dasselbe Muster in `src/hooks/useChatPersistence.ts` Zeile 47 (`chat_messages`) und Zeile 53 sowie in `src/pages/Journal.tsx` Zeile 338 (`weekly_recaps`).
2. **Offline-Schreibtest Tagebuch.** Flugmodus einschalten. `/journal` öffnen, einen Eintrag mit einem eindeutigen Erkennungswort schreiben, speichern. Notieren: Welche Meldung erscheint? Ist der Editor leer? Flugmodus aus, App neu starten, Liste durchsuchen. **Erwartung nach Schritt 1: Erfolgsmeldung, leerer Editor, Eintrag nirgends — der Text ist weg.** Dieses Ergebnis wörtlich festhalten; es ist der Blocker.
3. **Offline-Schreibtest Stimmung.** Flugmodus, `/mood`, Stimmung mit Notiz speichern. `src/pages/Mood.tsx` prüft hier anders: Zeile 145 `if (error) throw error;` — es erscheint eine Fehlermeldung. Der Haken liegt danach: die lokale Sicherung `localStorage.setItem("soulvay-moods", ...)` steht in Zeile 171, also **hinter** dem Wurf. Offline wird damit weder auf dem Server noch lokal etwas gespeichert. Prüfen und notieren.
4. **Offline-Schreibtest Chat.** Flugmodus, Nachricht im Chat abschicken. Notieren, ob die Nachricht sichtbar bleibt, ob eine Fehlermeldung kommt und ob sie nach Neustart in `/chat-history` steht.
5. **Mehrgeräte-Abgleich.** Auf Gerät A (iPhone) und Gerät B (Galaxy A50) mit demselben Konto anmelden. Auf A einen Tagebucheintrag, eine Stimmung und eine Chatnachricht anlegen. Auf B die App vollständig beenden und neu starten. Je Datenart notieren, ob und nach wie vielen Sekunden sie auf B erscheint. Danach die Richtung umkehren.
6. **Nur-lokale Daten benennen.** Diese Schlüssel liegen ausschließlich im Gerät und überleben weder Neuinstallation noch Gerätewechsel: `soulvay-completed-exercises` (`src/pages/Toolbox.tsx` Zeile 59), `soulvay-moods` als Notreserve (`Mood.tsx` Zeile 171), `soulvay-topic-progress`, `soulvay-topic-notes`, `soulvay-weekly-recap` (`Journal.tsx` Zeile 335), `soulvay-preferences`. Auf Gerät B prüfen, was davon fehlt, und je Schlüssel entscheiden: Ist der Verlust hinnehmbar oder ein Mangel? Themen-Notizen (`soulvay-topic-notes`) sind Nutzerinhalt und gehören auf die Serverseite.
7. **Konfliktfall gleicher Tag.** Auf Gerät A eine Stimmung erfassen, auf Gerät B am selben Tag eine andere. `Mood.tsx` Zeile 137–139 **löscht** den vorhandenen Tageseintrag und legt einen neuen an. Prüfen, welcher der beiden Werte überlebt und ob die Notiz des überschriebenen Eintrags verloren geht. Der über die Notiz erzeugte Tagebucheintrag wird nicht mitgelöscht — prüfen, ob ein verwaister Eintrag zurückbleibt.
8. **Neuinstallation.** App auf Gerät A löschen, neu installieren, anmelden. Je Datenart notieren, was zurückkommt.

**Belegt durch:** Tabelle mit acht Zeilen (Prüfung · Gerät · Erwartung · Ergebnis · Screenshot), SQL-Ausgabe aus `journal_entries`, `mood_checkins` und `chat_messages` für das Testkonto, Datum und Buildnummer.

**Bewertung:**
- **100** — Kein Schreibvorgang meldet Erfolg ohne Auswertung von `error`, offline geschriebene Inhalte werden zwischengespeichert und nachgereicht, alle serverseitigen Datenarten erscheinen auf dem zweiten Gerät binnen 60 Sekunden — **und** ein Integrationstest gegen ein lokales `supabase start` bricht den Build, sobald ein Schreibvorgang seinen Fehler verschluckt.
- **70** — Alle Datenarten gleichen sich zwischen zwei Geräten korrekt ab und kein Schreibvorgang verliert Daten; offline gibt es keine Warteschlange, sondern nur eine ehrliche Fehlermeldung mit erhaltenem Entwurf — als dokumentierte Einschränkung festgehalten.
- **0** — Datenverlust: ein Nutzerinhalt verschwindet, ohne dass die App es sagt. **Stand 28.07.2026 ist das der zu erwartende Befund** — `Journal.tsx` Zeile 213/215 meldet Erfolg und verwirft den Entwurf, auch wenn der Schreibvorgang gescheitert ist.

---

### A3 — Zustandsübergänge: leer, ladend, Fehler, offline, sehr viele Daten

**Ebene:** 2 (Release-Karte) — Ziel Ebene 1
**Zeitbedarf:** 60 Minuten, davon 20 Minuten Datenbefüllung (einmalig)

**Durchführung:**

Teilweise vorhanden ist nur eines: `src/test/routes-smoke.test.tsx` rendert die echten Seiten für die öffentlichen Routen mit einem nicht angemeldeten Nutzer und fängt damit Absturz beim ersten Rendern ab. Die vier angemeldeten Kernbildschirme (`/chat`, `/journal`, `/mood`, `/toolbox`) und alle Zustände außer „leer" sind darin nicht enthalten.

1. **Prüfmatrix anlegen:** fünf Flächen (`/home`, `/chat`, `/journal`, `/mood`, `/toolbox`) × fünf Zustände (leer · ladend · Fehler · offline · sehr viele Daten) = 25 Felder. Je Feld eine Zeile im Protokoll.
2. **Zustand „leer".** Frisches Konto ohne jede Aktivität. Je Fläche prüfen: erscheint der Text aus `src/components/shared/EmptyState.tsx` mit einem Schlüssel aus `src/translations/emptyStates.ts`, oder eine nackte weiße Fläche? Konkret zu sehen sein müssen `emptyState.journal.noEntries` samt Handlungsknopf `emptyState.journal.cta` und `emptyState.chatHistory.description`. Für `/mood` und `/toolbox` gibt es **keine** Schlüssel in `emptyStates.ts` — prüfen, was dort stattdessen steht.
3. **Zustand „ladend".** Netzwerk auf „Slow 3G" drosseln (Chrome DevTools → Network → Slow 3G; auf dem Gerät über den Simulator aus `src/hooks/useNetworkSimulator.ts`, Modus `slow`, erreichbar auf `/diagnostics`, wenn `isDiagnosticsAllowed()` greift). Je Fläche prüfen: erscheint ein Skelett oder Spinner **binnen 300 ms** (unterhalb von 300 ms nimmt niemand eine Verzögerung wahr, darüber wirkt eine leere Fläche wie ein Fehler), oder springt der Bildschirm von leer auf voll?
4. **Zustand „Fehler".** Zwei Wege, beide fahren:
   a) In den DevTools unter Network → Request blocking `*/rest/v1/*` sperren, dann jede Fläche neu laden.
   b) Absturz im Rendern erzwingen: in den React-DevTools den Zustand einer Seite auf `undefined` setzen oder vorübergehend ein `throw new Error("A3")` in die Seitenkomponente einbauen. Erwartung: `SectionErrorBoundary` (`src/App.tsx` Zeile 222–227) fängt den Fehler und zeigt eine Karte mit Wiederholen-Knopf, ohne die Navigationsleiste zu verlieren. Prüfen, ob der Rest der App bedienbar bleibt.
   c) Root-Boundary getrennt prüfen: einen Fehler außerhalb der `SectionErrorBoundary` erzwingen und sehen, ob `src/components/ErrorBoundary.tsx` greift und die Sprache richtig wählt (er liest `soulvay-preferences` ohne Hooks, Zeile 46–56).
5. **Zustand „offline".** Flugmodus. Je Fläche prüfen: erscheint `OfflineBanner` (in `AppLayout.tsx` Zeile 47 eingehängt), sind zwischengespeicherte Inhalte lesbar, und führt eine Aktion zu einer verständlichen Meldung statt zu einer stummen Nichtreaktion?
6. **Zustand „sehr viele Daten" — Datenbestand herstellen.** Im Supabase-SQL-Editor für das Testkonto einspielen:
   - 500 Tagebucheinträge (`generate_series`, Inhalte je 800 Zeichen) — entspricht zwei Jahren täglichem Schreiben
   - 365 Stimmungserfassungen — ein volles Jahr, weil `MoodHeatmap` und `MoodChart` über ein Jahr zeichnen
   - eine Unterhaltung mit 300 Nachrichten — sechsfach über `MAX_RECENT_TURNS = 50` (`supabase/functions/chat/index.ts` Zeile 29), damit der Kürzungspfad mitgeprüft wird

   Danach je Fläche messen: Zeit bis der Inhalt steht (**Schwelle 3 s auf dem Galaxy A50** — darüber wirkt die App auf dem schwächsten unterstützten Gerät defekt), ob die Liste flüssig scrollt, ob die Diagramme in `/mood` rendern und ob `/chat-history` die lange Unterhaltung öffnet, ohne einzufrieren.
7. **Jeden weißen Bildschirm sofort mit Datum, Fläche, Zustand und Buildnummer festhalten** — das ist das Blocker-Kriterium und nicht verhandelbar.

**Belegt durch:** ausgefüllte 25-Felder-Matrix, Screenshot je nicht bestandenem Feld, das SQL-Skript zur Datenbefüllung abgelegt unter `audit/` (damit die Messung wiederholbar bleibt), Datum und Buildnummer.

**Bewertung:**
- **100** — Alle 25 Felder zeigen einen benannten, übersetzten Zustand mit Ausweg, **und** für jede Fläche existiert ein Rendertest über alle fünf Zustände, der rot wird, sobald ein Zustand zur leeren Fläche entartet.
- **70** — Alle 25 Felder bestanden, aber automatisch abgesichert ist weiterhin nur das Rendern der öffentlichen Routen im leeren Zustand (`routes-smoke.test.tsx`); die Lücke ist dokumentiert.
- **0** — Weißer Bildschirm: mindestens eines der 25 Felder zeigt eine leere Fläche ohne Text, ohne Ausweg und ohne Fehlerkarte.

---

### A4 — Eingabegrenzen: leer, 1 Zeichen, 10.000 Zeichen, Emoji, RTL, Steuerzeichen

**Ebene:** 2 (Release-Karte) — Ziel Ebene 1
**Zeitbedarf:** 75 Minuten

**Durchführung:**

**Warum dieser Punkt zurückgestuft wurde:** Auch A4 wurde vom Tor über „Testsuite grün" gemeldet. Der einzige Test, der Eingabelängen erwähnt, ist `src/test/phase2-hardening.test.ts` Zeile 188–197 — und der baut sich seine Konstante und seine Kürzungslogik selbst nach, statt sie zu importieren. Er misst nicht die App, sondern sich selbst.

1. **Eingabefelder auflisten.** Sieben Flächen nehmen freien Text an:
   | Feld | Datei | heutige Begrenzung |
   |---|---|---|
   | Chat-Eingabe | `src/hooks/useChatComposer.ts` Zeile 199 | keine, nur `trim()` |
   | Tagebuch-Titel und -Inhalt | `src/pages/Journal.tsx` Zeile 196 ff. | keine |
   | Stimmungs-Notiz | `src/pages/Mood.tsx` Zeile 118 ff. | keine |
   | Begleiter-Name | `src/components/companion/CompanionSelector.tsx` Zeile 147 | `maxLength={20}` |
   | Onboarding-Name | `src/pages/Onboarding.tsx` Zeile 218 | keine |
   | Bestätigungscode Konto | `src/components/settings/AccountSettings.tsx` Zeile 913 | `maxLength={6}` |
   | Kontaktformular | `src/pages/Contact.tsx` | prüfen |
   Nur zwei der sieben Felder haben überhaupt eine Obergrenze im Markup. Das ist der Ausgangsbefund.
2. **Sechs Testeingaben vorbereiten**, als Datei `audit/eingabegrenzen-a4.txt`, damit sie über Kopieren und Einfügen identisch auf allen Feldern landen:
   - leer (nur Leerzeichen: `"   "`)
   - ein Zeichen: `a`
   - 10.000 Zeichen: `python3 -c "print('Lorem ipsum dolor sit amet. ' * 358)"`
   - Emoji, drei Bauformen: einfach `😀`, mit Hautton `👍🏽`, Familie mit Zero-Width-Joiner `👨‍👩‍👧‍👦` (die ZWJ-Folge ist der Fall, an dem naive Längen- und Kürzungslogik zerbricht)
   - RTL: `مرحبا كيف حالك اليوم` und `שלום מה שלומך`
   - Steuerzeichen: `U+0000` (Nullbyte), `U+202E` (Right-to-Left-Override), `U+200B` (Zero-Width-Space), `U+FEFF` (Byte-Order-Mark), sowie `<script>alert(1)</script>` und `'; drop table journal_entries; --`
3. **Jede der sechs Eingaben in jedes der sieben Felder** eingeben, speichern beziehungsweise absenden, und je Feld notieren: (a) nimmt das Feld die Eingabe an, (b) stürzt etwas ab, (c) kommt der Inhalt nach App-Neustart vollständig zurück, (d) sieht die Darstellung in der Liste beziehungsweise im Verlauf richtig aus. **42 Felder im Protokoll.**
4. **Den 10.000-Zeichen-Fall gesondert nachverfolgen.** `supabase/functions/chat/index.ts` Zeile 50–51 kappt jede einzelne Nachricht bei `MAX_SINGLE_MSG_CHARS = 2500` und hängt `\n[…truncated]` an. Prüfen und getrennt notieren: In `chat_messages` steht der **vollständige** Text (kein Datenverlust), aber das Modell sieht nur die ersten 2500 Zeichen. Prüffrage: Erfährt der Nutzer davon? Antwortet das Modell so, als kenne es den ganzen Text? Dasselbe für `MAX_TOTAL_CONVERSATION_CHARS = 40000`. Für das Tagebuch prüfen, ob der 10.000-Zeichen-Eintrag vollständig gespeichert **und** vollständig wieder angezeigt wird.
5. **RTL gesondert bewerten.** `grep -rniE "\bdir=|direction:\s*rtl|unicode-bidi" src/ index.html` liefert null Treffer. Es gibt keine RTL-Unterstützung: arabischer Text wird in einem LTR-Layout dargestellt. Prüfen, ob das lediglich unschön aussieht (hinnehmbar, da DE/EN die einzigen Produktsprachen sind) oder ob es die Zeile zerstört, den Zeilenumbruch bricht oder benachbarte Bedienelemente verschiebt. Der `U+202E`-Fall gehört hierher: ein Tagebuchtitel mit RLO kann die gesamte Listenzeile spiegeln — Screenshot machen.
6. **Steuerzeichen im Rückweg prüfen.** Nach dem Speichern eines Eintrags mit Nullbyte und BOM: erscheint der Eintrag in der Liste, lässt er sich öffnen, lässt er sich löschen, und lädt die Seite danach noch? Ein Eintrag, der die Liste beim Rendern zerlegt, ist eine Fläche, aus der der Nutzer nicht mehr herauskommt.
7. **Diktat gegenprüfen.** Dieselben Grenzfälle entstehen auch über die Spracheingabe (`src/hooks/useSpeechRecognition.ts`). Einen sehr langen Diktatlauf (≥ 3 Minuten ununterbrochen) fahren und prüfen, ob das Transkript im Feld ankommt, ohne die Eingabe einzufrieren.

**Belegt durch:** `audit/eingabegrenzen-a4.txt` mit den sechs Eingaben, Protokolltabelle mit 42 Feldern (Feld · Eingabe · angenommen · Absturz · vollständig zurück · Darstellung), Screenshots der RTL- und RLO-Fälle, Notiz zum 2500-Zeichen-Verhalten.

**Bewertung:**
- **100** — Kein Feld stürzt ab, kein Zeichen geht verloren, jede Obergrenze ist im Feld sichtbar angezeigt statt stillschweigend serverseitig gekappt — **und** ein Vitest-Lauf schickt die sechs Eingaben durch die **importierten** Funktionen (nicht durch nachgebaute Kopien) und wird rot, sobald eine Grenze fällt oder eine Kürzung Text verliert.
- **70** — Kein Absturz, kein Datenverlust; RTL wird ohne `dir`-Behandlung im LTR-Layout dargestellt und die stille Kürzung bei 2500 Zeichen bleibt für den Nutzer unsichtbar — beides als dokumentierte Einschränkung festgehalten.
- **0** — Absturz oder Datenverlust: eine der sechs Eingaben lässt eine Fläche abstürzen, oder ein gespeicherter Inhalt kommt nach dem Neustart unvollständig oder gar nicht zurück.

---

### A5 — Zeit & Zeitzonen: Tagesgrenzen, Streaks, Erinnerungen, Sommerzeit, Reise

**Ebene:** 2 (Release-Karte) — Ziel Ebene 1
**Zeitbedarf:** 90 Minuten

**Durchführung:**

**Warum dieser Punkt zurückgestuft wurde:** Das Tor meldete A5 über „Testsuite grün". Tatsächlich prüft genau eine Testdatei Zeitlogik, und sie prüft die falsche Hälfte: `src/test/notification-schedule.test.ts` importiert die echten Funktionen aus `src/lib/notificationSchedule.ts` und ist gut — sie deckt **Erinnerungen** ab. Für **Streaks**, **Tagesgrenzen** und **Sommerzeit** gibt es keinen einzigen Test: `grep -rln "useStreak" src/test/` liefert nichts.

1. **Die Tagesgrenze im Streak nachrechnen — ohne Gerät, in 10 Sekunden.** `src/hooks/useActivityLog.ts` schreibt `activity_date` als **lokales** Datum (Funktion `getLocalDate()`, Zeile 14–21). `src/hooks/useStreak.ts` liest es zweimal unterschiedlich: Zeile 68 bildet `today` aus lokalen Gettern, Zeile 81 bildet den Vergleichswert der Rückwärtsschleife aus `checkDate.toISOString().split("T")[0]` — also **UTC**. Ausführen:
   ```
   TZ=America/New_York node -e 'const n=new Date(2026,6,25,20,0);const l=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;console.log("lokal:",l,"| UTC:",n.toISOString().split("T")[0]);'
   TZ=Europe/Berlin   node -e 'const n=new Date(2026,6,26,1,0);const l=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;console.log("lokal:",l,"| UTC:",n.toISOString().split("T")[0]);'
   ```
   Ergebnis: `lokal: 2026-07-25 | UTC: 2026-07-26` und `lokal: 2026-07-26 | UTC: 2026-07-25`. Beide Male weichen die Werte ab. Für New York bedeutet das: ab 20:00 Ortszeit sucht die Schleife nach dem Datum von morgen, findet es nie, bricht sofort ab — **der Streak steht auf 0, während direkt daneben „heute aktiv" angezeigt wird.** Für Berlin bricht es zwischen 00:00 und 02:00 Ortszeit (Sommerzeit) beziehungsweise 00:00 und 01:00 (Winterzeit). Genau deshalb ist es in Deutschland nie aufgefallen.
2. **Am Gerät bestätigen.** Testkonto mit mindestens fünf aufeinanderfolgenden aktiven Tagen (per SQL in `user_activity_log` einspielen, `activity_date` als lokale Datumsstrings). Gerätezeitzone auf `America/New_York` stellen, Gerätezeit auf 20:30, App neu starten, `/home` öffnen. Streak-Zahl fotografieren. Dann Zeitzone auf `Europe/Berlin`, Zeit auf 01:30, App neu starten, Streak-Zahl fotografieren. Beide Zahlen mit der erwarteten Zahl (5) vergleichen.
3. **Dieselbe Verwechslung an drei weiteren Stellen prüfen.** Alle vier nutzen `toISOString()` auf einer lokalen Uhrzeit:
   - `useStreak.ts` Zeile 55 (Abfragegrenze der letzten 120 Tage), Zeile 117 (Wochenstatistik), Zeile 133 (Vorwoche)
   - `src/hooks/usePremium.ts` Zeile 37: `const getToday = () => new Date().toISOString().split("T")[0];` — **die Tagesgrenze der 15 Gratis-Nachrichten liegt damit auf UTC-Mitternacht.** In Berlin setzt das Kontingent um 02:00 Ortszeit zurück, in New York um 20:00 Ortszeit — dort bekommt jeder Nutzer abends ein zweites Tageskontingent. Am Gerät nachstellen: Zeitzone New York, 14 Nachrichten senden, Gerätezeit auf 20:05 stellen, App neu starten, prüfen, ob der Zähler bei 0 steht.
   - `src/components/mood/MoodHeatmap.tsx` Zeile 28 und 47 sowie `MoodChart.tsx` Zeile 28 bilden ihre Tagesschlüssel ebenfalls über `toISOString()`. Prüfen, ob eine um 22:00 Ortszeit erfasste Stimmung in Berlin im Kalender auf dem richtigen Tag landet.
4. **Sommerzeit-Umstellung für Erinnerungen.** `src/lib/notificationSchedule.ts` rechnet bewusst mit lokaler Wanduhrzeit; die Kopfzeile hält das als Zusicherung fest. Diese Zusicherung an den beiden Umstellungstagen prüfen — für Europa 2026: **Sonntag, 29.03.2026** (Vorstellen, 02:00 → 03:00) und **Sonntag, 25.10.2026** (Zurückstellen, 03:00 → 02:00). Zwei Wege:
   a) Testlauf mit fixierter Uhr: `TZ=Europe/Berlin bunx vitest run src/test/notification-schedule.test.ts` und zusätzlich Fälle ergänzen, die `nextDailyOccurrence` mit einer Erinnerungszeit von **02:30** über den 29.03. hinweg aufrufen — diese Ortszeit existiert an diesem Tag nicht, `next.setHours(2, 30, 0, 0)` liefert dann eine verschobene Zeit. Was die Funktion zurückgibt, ist zu messen und festzuhalten, nicht zu vermuten.
   b) Am Gerät: Datum auf 28.03.2026 stellen, Erinnerung auf 20:00 setzen, Gerät über die Umstellung laufen lassen (oder Datum auf 29.03. weiterstellen) und prüfen, ob die Benachrichtigung am 29.03. um 20:00 Ortszeit kommt — nicht um 19:00 und nicht um 21:00.
5. **Reise nachstellen.** Am Gerät nacheinander vier Zeitzonen einstellen, jeweils App neu starten und je Zone Streak, Tageskontingent, Erinnerungszeitpunkt und Stimmungskalender notieren: `Pacific/Pago_Pago` (UTC−11), `America/New_York` (UTC−4), `Europe/Berlin` (UTC+2), `Pacific/Kiritimati` (UTC+14). Die beiden Extremzonen sind bewusst gewählt: sie liegen 25 Stunden auseinander und decken damit jeden möglichen Datumsversatz gegenüber UTC ab.
6. **Testsuite unter fremder Zeitzone laufen lassen.** `TZ=Pacific/Kiritimati bunx vitest run` und `TZ=Pacific/Pago_Pago bunx vitest run`. Bleibt die Suite grün, obwohl die App unter diesen Zeitzonen nachweislich falsch rechnet, ist das die Bestätigung, dass „Testsuite grün" als Beleg für A5 wertlos war (siehe K8 und K9).

**Belegt durch:** Ausgabe der beiden `node`-Befehle aus Schritt 1, vier Screenshots der Streak-Anzeige aus Schritt 5 (eine je Zeitzone), Protokoll der Erinnerungszustellung über den 29.03.2026, Ausgabe der beiden `TZ=…`-Testläufe, Datum und Buildnummer.

**Bewertung:**
- **100** — Streak, Tageskontingent, Stimmungskalender und Erinnerungen rechnen durchgehend mit lokalem Datum; die Datumslogik liegt in einem reinen Modul, und ein Vitest-Lauf mit fixierter Uhr prüft sie unter mindestens vier Zeitzonen sowie an beiden Sommerzeit-Umstellungstagen und bricht bei Abweichung den Build.
- **70** — Alle vier Bereiche rechnen korrekt und sind am Gerät in vier Zeitzonen belegt; der automatische Rückfallschutz deckt weiterhin nur die Erinnerungen ab (`notification-schedule.test.ts`), für Streak und Tageskontingent existiert kein Test — als dokumentierte Lücke festgehalten.
- **0** — Streak/Erinnerung falsch: der Streak zeigt in einer der vier geprüften Zeitzonen einen anderen Wert als die tatsächliche Zahl aufeinanderfolgender aktiver Tage, oder eine Erinnerung geht zur falschen Ortszeit zu. **Stand 28.07.2026 ist das der zu erwartende Befund** — `useStreak.ts` Zeile 68 (lokal) und Zeile 81 (UTC) vergleichen zwei verschiedene Kalender.

---

### A6 — Mehrsprachigkeit: jeder sichtbare Text in DE und EN, keine Geister-Schlüssel

**Ebene:** 1 (Tor) — Rest von Hand, jeder Release
**Zeitbedarf:** 60 Minuten (Handanteil)

**Durchführung:**

Das Tor führt `bunx vitest run src/test/i18n-no-ghost-keys.test.ts` aus. Der Ratchet durchsucht alle `.ts`/`.tsx`-Dateien unter `src/` (ohne `src/translations/` und ohne Testdateien) nach **String-Literalen** in `t("…")` und meldet jeden Schlüssel, der nicht in `allTranslations` steht — heute 2 Zusicherungen über mehr als 500 gefundene Aufrufe. `src/test/i18n-consistency.test.ts` ergänzt 16 Zusicherungen: je Namensraum vollständige DE- und EN-Werte, keine Doppelschlüssel zwischen Namensräumen, und die strukturierten `exerciseTranslations`/`topicTranslations`. **Was die Maschine nicht abdeckt:**

1. **Dynamisch gebaute Schlüssel.** Der Ratchet klammert Backticks bewusst aus. `grep -rnoE 't\(`[^`]+`\)' src/` liefert außerhalb der Tests genau zwei Treffer:
   - `src/components/mood/CommunityInsights.tsx` Zeile 36: `` t(`mood.community.dayName.${d}`) `` — alle sieben Zielschlüssel `mood.community.dayName.sun` bis `.sat` existieren (`src/translations/mood.ts` Zeile 82–88). Bei jedem Release erneut prüfen, weil kein Test das tut.
   - `src/pages/Diagnostics.tsx` Zeile 82: `` t(`❌ Error: ${err.message}`) `` — hier wird eine **Fehlermeldung** als Übersetzungsschlüssel übergeben. `t()` gibt bei unbekanntem Schlüssel den Schlüssel zurück (`src/hooks/useTranslation.ts` Zeile 517–522), deshalb erscheint zufällig der richtige Text. Es ist trotzdem ein roher Schlüssel im Sinne des Blockers und gehört korrigiert.
2. **Die zweite Übersetzungstabelle.** `src/lib/i18nPlain.ts` hält eine eigene, vom Ratchet unberührte Tabelle für Kontexte ohne React (Benachrichtigungstexte). Aufrufe über `tp()` in `src/hooks/useBackupReminder.ts` Zeile 75–104. Ausführen: `grep -rn "tp(\"" src/ --include=*.ts --include=*.tsx` und für jeden Schlüssel im Kopf von `i18nPlain.ts` nachsehen, ob er dort definiert ist. Zusätzlich am Gerät: Sprache auf Englisch stellen, eine Backup-Erinnerung auslösen und prüfen, ob die Benachrichtigung englisch ankommt.
3. **Text, der nie durch `t()` gelaufen ist.** Der Ratchet kann nur finden, was als Schlüssel formuliert wurde — fest eingebauter deutscher oder englischer Text bleibt unsichtbar. Sprache in den Einstellungen auf **Englisch** stellen und die fünf Kernflüsse aus A1 sowie `/safety`, `/upgrade`, `/settings`, `/contact` und alle Fehlerzustände aus A3 durchlaufen. Jede deutsche Zeichenkette fotografieren. Danach dasselbe umgekehrt: Sprache auf Deutsch, jede englische Zeichenkette fotografieren. Erfahrungsgemäß sitzen Reste in Fehlermeldungen, Bestätigungsdialogen und Ladehinweisen.
4. **Inhaltliche Richtigkeit statt bloßer Anwesenheit.** Der Test prüft, **dass** ein DE- und ein EN-Wert existiert, nicht **ob** sie dasselbe bedeuten. Zwei Messungen:
   a) **Identische Paare auflisten.** Von 1090 geparsten Schlüsseln sind derzeit 24 in DE und EN wortgleich. Je Eintrag entscheiden und die Entscheidung schriftlich festhalten: legitim (Eigennamen wie `crisis.de.telefonseelsorge.name` = „TelefonSeelsorge", `crisis.nummerGegenKummer`, `crisis.ch.dargeboteneHand.name`; Fremdwörter wie `nav.chat`, `voice.neutral`, `mood.optional`) oder vergessene Übersetzung (`auth.reviewLogin` = „Review / Demo Login", `journal.tagsOptional` = „Tags (optional)", `voiceSettings.warmNeutral.label` = „Warm neutral", `aiSummary.moodStart` = „Start"). Die Liste als Ausnahmeliste unter `audit/` ablegen, damit beim nächsten Lauf nur neue Paare zu bewerten sind.
   b) **Stichprobe lesen.** 30 Schlüssel aus den sicherheits- und geldrelevanten Namensräumen (`content.ts` Krisenbereich, `payments.ts`, `auth.ts`) nebeneinanderlegen und von einer Person mit sicherem Englisch prüfen: Sagt die englische Fassung dasselbe wie die deutsche? Ein Übersetzungsfehler in einer Notfallnummern-Beschreibung oder in einer Abo-Bedingung ist kein Sprachmangel, sondern ein Sicherheits- beziehungsweise Rechtsmangel (Querverweis B4, I1, J3).
5. **Vom Server erzeugter Text.** Die Edge-Functions schreiben Prosa, die der Nutzer liest, und sie tun das nach einem Parameter `language`, der als **`"en"` vorbelegt** ist: `extract-memories/index.ts` Zeile 18, `detect-patterns/index.ts` Zeile 17, `journal-reflect/index.ts` Zeile 23, `generate-summary/index.ts` Zeile 27. Nur `chat/index.ts` fällt bewusst auf Deutsch zurück (Zeile 729–737, mit Begründung im Kommentar). Für jede dieser Functions prüfen, ob der aufrufende Client `language` **immer** mitsendet — `grep -rn "journal-reflect\|generate-summary\|detect-patterns\|extract-memories" src/` und je Aufrufstelle den Rumpf ansehen. Am Gerät gegenprüfen: Sprache auf Deutsch, Wochenrückblick und Tagebuch-Reflexion auslösen, prüfen, ob die Antwort deutsch kommt.
6. **Übungs- und Themen-Texte.** `exerciseTranslations` und `topicTranslations` in `src/hooks/useTranslation.ts` liegen außerhalb von `allTranslations` und werden nur von `i18n-consistency.test.ts` auf Vollständigkeit geprüft, nicht auf Geister-Schlüssel. Eine Übung mit **Schritten** (z. B. `breathing-478`) in beiden Sprachen vollständig durchlaufen und prüfen, ob jeder Anleitungsschritt in der gewählten Sprache erscheint — die Schritte werden auch vorgelesen, ein Sprachbruch fällt dort besonders auf.
7. **Sprachwechsel im laufenden Betrieb.** Sprache umstellen, während `/chat` geöffnet ist. `useTranslation` hört auf `soulvay-preferences-changed` und `storage` (Zeile 505–514). Prüfen, ob die Oberfläche sofort umschaltet und ob bereits gesendete Nachrichten unangetastet bleiben.

**Belegt durch:** Ausgabe von `bunx vitest run src/test/i18n-no-ghost-keys.test.ts src/test/i18n-consistency.test.ts` mit Datum, Ausnahmeliste der identischen DE/EN-Paare unter `audit/`, Screenshots jeder gefundenen Sprachmischung aus Schritt 3, Notiz zur Stichprobe aus Schritt 4b mit Namen der prüfenden Person.

**Bewertung:**
- **100** — Ratchet grün, kein fest eingebauter Text in einer der beiden Sprachen, `tp()`-Tabelle und dynamische Schlüssel abgedeckt, alle 24 identischen Paare bewertet und die Ausnahmeliste maschinell gegengeprüft — **und** der Ratchet ist so erweitert, dass er auch Backtick-Schlüssel gegen bekannte Präfixe sowie die `i18nPlain`-Tabelle prüft und bei einem neuen unbewerteten identischen Paar rot wird.
- **70** — Ratchet grün und beide Sprachdurchläufe ohne Fund; dynamische Schlüssel, die `tp()`-Tabelle und die inhaltliche Richtigkeit werden weiterhin nur von Hand geprüft — als dokumentierte Lücke festgehalten.
- **0** — Roher Schlüssel sichtbar: an einer Oberfläche steht ein Übersetzungsschlüssel statt eines Textes, oder eine sichtbare Zeichenkette existiert nur in einer der beiden Sprachen.

---

## Gruppe D — Erlebnisqualität

### D1 — Visuelle Konsistenz: Design-Token statt Einzelwerte, kein Stilbruch

**Ebene:** 1 (Tor), sobald die Ratchet-Prüfung gebaut ist — bis dahin 3 (Quartals-Audit)
*Das Ausführungsmodell führt D1 unter „Einmalig automatisieren, danach kostenlos: D1 und E5 als Lint-Regel" (`audit/TEST_FRAMEWORK.md` Zeile 325). Der maschinelle Teil existiert heute nicht: `scripts/gate.mjs` meldet (Stand 28.07.2026) genau dreizehn Prüfungen — B1, B2/B3/B5, B3, B7, B21, N1, K10, A6, N3, C3, C1, I4, K6/K7 (nachzuzählen mit `grep -n 'pruefe(' scripts/gate.mjs`). Kein D-Punkt ist darunter.*

**Zeitbedarf:** 40 Minuten Messung + 60 Minuten Sichtprüfung; einmalig ca. 2 Stunden für die Ratchet-Prüfung

**Durchführung:**

1. **Drei Zähler messen.** Im Wurzelverzeichnis `/Users/jonathanjansen/soulvay` nacheinander ausführen und die drei Zahlen notieren:

   ```
   # (a) Farbliterale
   grep -rnoE '#[0-9a-fA-F]{3,8}\b' src --include='*.tsx' --include='*.ts' | grep -v '^src/test/' | wc -l

   # (b) rohe Tailwind-Palettenklassen statt Token
   grep -rnoE '\b(bg|text|border|ring|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b' src --include='*.tsx' | wc -l

   # (c) Einzelwerte in eckigen Klammern außerhalb der shadcn-Primitive
   grep -rnoE '\b[a-z-]+-\[[^]]+\]' src --include='*.tsx' | grep -v 'src/components/ui/' | wc -l
   ```

   **Gemessener Stand 28.07.2026: (a) 24 · (b) 134 · (c) 205.** Jede höhere Zahl ist ein Rückschritt.

   `src/components/ui/` ist bei (c) ausgenommen, weil dort die unveränderten shadcn-Primitive liegen; sie werden nicht von Hand gepflegt und ihre Einzelwerte sind Teil des Fremdcodes. Bei (a) und (b) ist die Ausnahme **nicht** gesetzt — dort schlägt `src/components/ui/chart.tsx` mit 5 Treffern durch; das ist zu vermerken, aber nicht zu beheben.

2. **Die Verursacher benennen.** Dieselben Befehle mit `| cut -d: -f1 | sort | uniq -c | sort -rn` laufen lassen. **Stand 28.07.2026 für (b), die 16 betroffenen Dateien in der Reihenfolge ihrer Treffer** (volle Pfade, weil zwei fast gleichnamige Dateien in zwei verschieden geschriebenen Ordnern liegen — `components/companions/` mit s und `components/companion/` ohne):
   `src/components/companions/CompanionAvatar.tsx` 30 · `src/components/mood/MoodHeatmap.tsx` 20 · `src/pages/ReviewStatus.tsx` 18 · `src/pages/Upgrade.tsx` 10 · `src/pages/ReviewInstructions.tsx` 10 · `src/pages/Impressum.tsx` 9 · `src/components/settings/AccountSettings.tsx` 8 · `src/components/home/RitualCard.tsx` 6 · `src/pages/Diagnostics.tsx` 5 · `src/components/companion/CompanionAvatarAnimated.tsx` 5 · `src/pages/Auth.tsx` 4 · `src/pages/About.tsx` 2 · `src/components/topics/TopicCard.tsx` 2 · `src/components/premium/MessageLimitIndicator.tsx` 2 · `src/components/chat/VoiceAvatar.tsx` 2 · `src/components/home/GrowthDashboard.tsx` 1.
   Je Datei entscheiden und schriftlich festhalten: **Token-Verstoß** (muss auf eine CSS-Variable aus `src/index.css` umgestellt werden) oder **begründete Ausnahme**. Als Ausnahme zugelassen ist nur die Datenvisualisierung — die fünfstufige Stimmungsskala in `src/components/mood/MoodHeatmap.tsx` Zeilen 10–14 braucht eine eigene Rot-Grün-Rampe, für die es im Token-Satz (`--primary`, `--accent`, `--calm`, `--gentle`, `--destructive`) keine Entsprechung gibt. Die Begründung gehört als Kommentar in die Datei, nicht in ein Audit-Dokument.

3. **Dunkelmodus prüfen.** Ausführen:
   ```
   grep -rn 'bg-\(emerald\|amber\|orange\|red\|blue\|purple\|pink\|rose\|slate\|gray\)-[0-9]' src --include='*.tsx' | grep -v 'dark:'
   ```
   **Stand 28.07.2026: 19 Treffer.** Eine rohe Palettenklasse ohne `dark:`-Variante wechselt im Dunkelmodus nicht mit — Token tun das automatisch, weil der Block `.dark` in `src/index.css` Zeile 94 ff. dieselben Variablen neu belegt (die dunklen Schattenstufen ab Zeile 143). Jeden der 19 Treffer im Dunkelmodus am Gerät ansehen und notieren, ob der Kontrast hält (der Zahlenwert gehört zu E3, die Feststellung „bricht/bricht nicht" hierher).

4. **Sichtprüfung an einer festen Bildschirmliste.** `bun run dev` starten (Vite läuft auf Port 8080, siehe `vite.config.ts`), im Browser auf 390 × 844 (logische Größe iPhone 14/15 — das ausgelieferte Hauptgerät) je zwei Aufnahmen pro Bildschirm anfertigen, hell und dunkel, in dieser festen Reihenfolge:
   `/landing` · `/onboarding` (alle vier Schritte aus `src/pages/Onboarding.tsx` Zeile 28: `name`, `need`, `companion`, `start`) · `/home` · `/chat` · `/journal` · `/mood` · `/toolbox` · `/topics` · `/timeline` · `/settings` · `/upgrade` · `/safety`.
   Ablage: `audit/screenshots/D1/<JJJJ-MM-TT>/<route>-<hell|dunkel>.png`.

5. **Vier Stilbruch-Fragen je Aufnahme**, jede mit Ja oder Nein zu beantworten:
   - Weicht der Eckenradius von `--radius` (0.875 rem) beziehungsweise den definierten Stufen `rounded-3xl`/`rounded-4xl` ab?
   - Wird eine andere Schrift als „Plus Jakarta Sans" gerendert (Fallback `system-ui` sichtbar)?
   - Steht ein Schatten außerhalb der drei definierten Stufen `--shadow-soft`, `--shadow-card`, `--shadow-elevated`?
   - Erscheint eine Fläche in einem Grundton, der nicht Grün, Neutral oder das Warnrot `--destructive` ist?
   Ein Ja ist ein Befund und wird mit Route, Modus und Bildausschnitt festgehalten.

6. **Die Rückfallsicherung bauen** (einmalig, danach ohne Menschenzeit). Ein Block `D1` in `scripts/gate.mjs`, gebaut wie der vorhandene Block `N1`: er führt die drei Befehle aus Schritt 1 aus, vergleicht gegen drei in der Datei hinterlegte Höchstwerte und bricht ab, sobald ein Zähler steigt. Ein absoluter Zielwert von 0 ist hier falsch — bei 205 Treffern in (c) wäre das Tor ab dem ersten Tag rot und würde umgangen. Der Ratchet ist das Verfahren, das das Projekt für Lint (N3) und i18n (A6) bereits verwendet.

**Belegt durch:** Notiz in `audit/` mit den drei Zählern und dem Datum, die Datei-Liste aus Schritt 2 mit der Entscheidung „Verstoß/Ausnahme" je Datei, 24 Aufnahmen aus Schritt 4, die Ja/Nein-Tabelle aus Schritt 5, und — nach dem Bau — der Diff von `scripts/gate.mjs`.

**Bewertung:**
- **100** — Alle drei Zähler außerhalb der begründeten Ausnahmen auf 0, jede Ausnahme im Quelltext kommentiert, keine der 24 Aufnahmen mit einem Ja in Schritt 5, und der Block `D1` in `scripts/gate.mjs` bricht den Build, sobald ein Zähler steigt.
- **70** — Die Zähler sind gemessen, gefallen und als Höchstwerte im Tor hinterlegt; einzelne Dateien tragen weiterhin rohe Werte und sind namentlich als bekannte Lücke dokumentiert.
- **0** — Das Gerüst nennt für D1 kein Blocker-Kriterium (Spalte Blocker: „—"). Es gilt daher der Anker „Nicht vorhanden" aus dem Bewertungsmaßstab: kein Gegenstück im Code oder Prozess auffindbar — weder eine Messung der drei Zähler noch eine Sichtprüfung nach fester Bildschirmliste. **Das ist der Stand vom 28.07.2026.**

---

### D2 — Flussreibung: Schritte, Klicks, Wartepunkte je Kernfluss gezählt

**Ebene:** 3 (Quartals-Audit)
*Das Gerüst nennt als Rhythmus „jeder Release"; das Ausführungsmodell führt D2 auf keiner der drei Listen. Flussreibung ändert sich nicht von Release zu Release, sondern wenn jemand einen Fluss umbaut — der Quartalsrhythmus ist die ehrlichere Zuordnung als ein Release-Punkt, der nach dem zweiten Mal übersprungen wird.*

**Zeitbedarf:** 2 Stunden

**Durchführung:**

1. **Zählregeln festlegen, bevor gezählt wird.** Ohne feste Definition zählt jede Person anders:
   - **Schritt** = ein Bildschirmwechsel oder ein Zustand, der eine neue Entscheidung des Nutzers verlangt (ein Modal ist ein Schritt, ein aufklappender Abschnitt nicht).
   - **Klick** = jede Berührung auf dem **kürzesten** Weg zum Ziel, einschließlich Tastatur-Öffnen, ohne Tippen des Inhalts selbst.
   - **Wartepunkt** = jede Stelle, an der ein Ladeanzeiger, ein Skelett oder ein Platzhalter **länger als 400 ms** sichtbar ist. (400 ms, weil unterhalb davon keine Verzögerung als Warten wahrgenommen wird; die klassische Grenze für „ununterbrochener Fluss" liegt bei 1 s, 400 ms ist der konservative Messwert, der auch das erfasst, was gerade noch auffällt.)

2. **Auf dem Gerät messen, nicht im Kopf.** Auf dem Samsung Galaxy A50 unter Entwickleroptionen „Zeigen, wo getippt wird" aktivieren und den Bildschirm aufzeichnen. Die Klicks werden anschließend **aus der Aufzeichnung** gezählt, nicht aus der Erinnerung. Die Wartepunkte werden zusätzlich im Browser gemessen: `bun run dev`, Chrome-DevTools → Netzwerk → Drosselung „Fast 4G", Zeitleiste aufzeichnen.

3. **Fünf Kernflüsse mit festem Start und festem Ende**, in dieser Reihenfolge:

   | Fluss | Start | Ende | Budget |
   |---|---|---|---|
   | Onboarding | Frische Installation, erster Start | Erste Chat-Nachricht ist abgeschickt | ≤ 5 Schritte · ≤ 14 Klicks · ≤ 2 Wartepunkte |
   | Chat | `/home`, angemeldet | Erstes Wort der Antwort sichtbar | ≤ 2 Schritte · ≤ 3 Klicks · ≤ 1 Wartepunkt |
   | Tagebuch | `/home` | Eintrag gespeichert, Bestätigung sichtbar | ≤ 3 Schritte · ≤ 5 Klicks · ≤ 1 Wartepunkt |
   | Stimmung | `/home` | Check-in gespeichert | ≤ 2 Schritte · ≤ 4 Klicks · ≤ 1 Wartepunkt |
   | Übung | `/home` | Erster Schritt der Übung läuft | ≤ 3 Schritte · ≤ 5 Klicks · ≤ 1 Wartepunkt |

   **Begründung der Budgets:** Das Budget ist die Zahl der Entscheidungen, die die Aufgabe **selbst** erfordert, plus eins für den Weg dorthin. Onboarding hat vier definierte Schritte (`src/pages/Onboarding.tsx` Zeile 28), plus die Registrierung — daher 5. Stimmung erfordert zwei Entscheidungen (Wert wählen, speichern) plus den Weg — daher 4 Klicks. Alles darüber ist Reibung, die aus der Umsetzung stammt, nicht aus der Aufgabe.

4. **Den Übungs-Fluss gesondert prüfen.** `/toolbox` steht **nicht** in der unteren Navigationsleiste — `src/components/layout/BottomNav.tsx` Zeilen 17–21 führt nur `/home`, `/chat`, `/journal`, `/topics`, `/mood`. Die vollständige Liste der Einstiege liefert `grep -rn '"/toolbox"' src --include='*.tsx'`; **Stand 28.07.2026 sind es sechs, davon fünf erreichbar:**
   `src/pages/Topics.tsx` Zeile 282 · `src/pages/Topics.tsx` Zeile 463 · `src/components/topics/TopicDetail.tsx` Zeile 79 · die Stimmungs-Brücke `src/components/mood/MoodExerciseBridge.tsx` Zeile 51 · `src/pages/Chat.tsx` Zeile 612 · `src/pages/Summary.tsx` Zeile 375. Der sechste Einstieg, `src/components/home/ContinueModule.tsx` Zeile 42, ist **nicht erreichbar** — die Komponente wird nirgends eingebunden (siehe D5 Schritt 6). Für den Fluss „Übung" ist deshalb zusätzlich zu notieren: **Wie viele Klicks braucht jemand, der nicht weiß, wo die Übungen liegen?** Diesen Wert getrennt ausweisen; er ist der eigentliche Befund.

5. **Sackgassen protokollieren.** Für jeden Fluss zusätzlich festhalten: Gibt es einen Punkt, an dem der Zurück-Weg fehlt oder auf einen anderen Bildschirm führt als erwartet? Auf Android mit der Zurück-Geste, auf iOS mit der Wischgeste von links prüfen.

6. **Gegen die vorige Messung stellen.** Die Werte des Vorquartals danebenlegen. Ein Fluss, der ohne Funktionszuwachs gewachsen ist, ist ein Befund, auch wenn er noch im Budget liegt.

**Belegt durch:** Fünf Bildschirmaufzeichnungen vom A50, eine Tabelle mit fünf Zeilen (Fluss · Schritte · Klicks · Wartepunkte · Budget · über/unter), die gesonderte Zahl aus Schritt 4, Datum, Buildnummer.

**Bewertung:**
- **100** — Alle fünf Flüsse innerhalb des Budgets, keine Sackgasse, jeder Kernfluss über die untere Navigationsleiste in höchstens zwei Klicks erreichbar — und ein Playwright-Lauf in `e2e/` zählt die Klicks je Fluss automatisch und bricht bei Überschreitung.
- **70** — Alle fünf Flüsse innerhalb des Budgets gemessen, aber der Übungs-Fluss hat weiterhin keinen eigenen Navigationseinstieg; die Abweichung ist mit der Klickzahl aus Schritt 4 dokumentiert.
- **0** — Das Gerüst nennt für D2 kein Blocker-Kriterium (Spalte Blocker: „—"). Es gilt der Anker „Nicht vorhanden": es existiert kein Protokoll, in dem Schritte, Klicks und Wartepunkte je Kernfluss gezählt sind. **Das ist der Stand vom 28.07.2026.**

---

### D3 — Sprache & Ton: warm, auf Augenhöhe, nie belehrend oder alarmierend

**Ebene:** 2 (Release-Karte, Teil A) — Teil B im Quartals-Audit
*Das Ausführungsmodell legt D3 und D4 zur „Textdurchsicht" zusammen (`audit/TEST_FRAMEWORK.md` Zeile 317). Die Release-Karte hat insgesamt 90 Minuten; die Textdurchsicht bekommt davon 25. Deshalb ist die Prüfung zweigeteilt: Teil A ist die feste Kurzliste bei jedem Release, Teil B der vollständige Durchgang je Quartal.*

**Zeitbedarf:** Teil A 15 Minuten · Teil B 2 Stunden

**Durchführung:**

**Teil A — feste Stichprobe, jeder Release (15 Minuten)**

1. **Maschineller Vorlauf.** Ausführen und die Trefferliste ausdrucken:
   ```
   grep -rniE '"[^"]*(du solltest|du müsstest|du hast nicht|du hast vergessen|verpasst|versäumt|schon wieder|endlich|leider|nur noch|immer noch nicht)[^"]*"' src/translations/*.ts src/hooks/*.ts src/components --include='*.ts' --include='*.tsx'
   ```
   **Stand 28.07.2026: 4 Treffer.** Jeder Treffer geht in Schritt 3, unabhängig davon, wie harmlos er beim Lesen wirkt.

2. **Die feste Textmenge.** Nicht „Texte lesen", sondern genau diese fünf Gruppen, vollständig, in dieser Reihenfolge. Sie ist deterministisch: zwei Personen ziehen dieselben Texte. Die Stückzahl steht dabei, weil sie das Zeitfenster begrenzt — **48 Texte in 15 Minuten sind rund 19 Sekunden je Text**, und das ist die Obergrenze dessen, was in einer Release-Karte trägt.
   - **G1 — Leerzustände:** alle Schlüssel in `src/translations/emptyStates.ts` (**9**, nachzuzählen mit `grep -cE '^\s+"[a-zA-Z0-9_.]+":' src/translations/emptyStates.ts`). Das sind die Sätze, die ein Mensch ohne Daten über sich selbst liest.
   - **G2 — Leistungs- und Streak-Texte:** alle `streak.*` in `src/translations/home.ts` Zeilen 58–72 (**15**). Höchstes Beschämungsrisiko, weil hier Nutzung gezählt wird.
   - **G3 — Rückkehrtexte:** die **5** Sätze in `src/hooks/useReturnState.ts` Zeilen 17–39. **Sie stehen nicht in `src/translations/`** — wer nur den Übersetzungsordner liest, sieht sie nie. Deshalb stehen sie hier ausdrücklich.
   - **G4 — Bindungsstufen:** die **6** Meilensteintexte in `src/components/companion/BondIndicator.tsx` Zeilen 11–16 (Konstante `MILESTONES` ab Zeile 10). Ebenfalls nicht in `src/translations/`.
   - **G5 — Fehlertexte:** alle `error.*` in `src/translations/common.ts` Zeilen 46–58 (**13**). Diese Gruppe ist zugleich Teil A von D4 — sie wird einmal gelesen und für beide Punkte gewertet.

   **Zwei Gruppen stehen bewusst nicht in Teil A**, weil sie das Zeitfenster sprengen und in Teil B vollständig vorkommen: die Krisentexte (`crisis.*` in `src/translations/content.ts`, **66** Schlüssel — deren Tonfall prüft zusätzlich B8 nach der VERA-MH-Rubrik) und die Bezahltexte (`upgrade.*` und `premium.*` in `src/translations/payments.ts`, **78** Schlüssel). Zusammen sind das 144 weitere Texte; mit ihnen wären es 192 in 15 Minuten, also 4,7 Sekunden je Text — eine Zahl, die man aufschreiben, aber nicht einhalten kann.
   **Ergänzung bei jedem Release:** zusätzlich zu den 48 festen Texten alle Zeichenketten, die seit dem letzten Release-Tag hinzugekommen sind — `git diff <letzter-tag>..HEAD -- src/translations src/hooks src/components | grep -E '^\+.*"(de|en)?"?: *"'`. Diese Menge ist normalerweise klein und fängt genau die Texte ab, die noch niemand gelesen hat.

3. **Acht Ja/Nein-Fragen je Text.** Jede ist ohne Fachwissen beantwortbar. Die Antwort wird als Ja oder Nein eingetragen, nicht als Eindruck.

   | # | Frage | Ja bedeutet |
   |---|---|---|
   | 1 | Unterstellt der Text ein Versäumnis („du hast nicht", „verpasst", „schon wieder")? | Befund, Schweregrad hoch |
   | 2 | Bewertet er die Person statt die Sache? | Befund, Schweregrad hoch |
   | 3 | Benennt er ein Ausbleiben von Nutzung („du warst lange weg", „X Tage ohne")? | Befund, Schweregrad hoch |
   | 4 | Erteilt er eine Anweisung ohne Ausweg („du musst", „bitte melde dich")? | Befund, Schweregrad mittel |
   | 5 | Trägt er ein Ausrufezeichen an einer Stelle, an der keine Freude gemeint ist? | Befund, Schweregrad niedrig |
   | 6 | Enthält er Systembegriffe oder Anglizismen, die im Alltag nicht vorkommen (Token, Session, Sync, Streak, DELETE)? | Befund, Schweregrad mittel |
   | 7 | Ist er länger als zwei Sätze? | Befund, Schweregrad niedrig |
   | 8 | Wäre der Satz auch dann noch tragbar, wenn die lesende Person gerade weint? **Nein hier ist der Befund.** | Befund, Schweregrad hoch |

   **Ein Ja bei Frage 1, 2 oder 3 — oder ein Nein bei Frage 8 — ist eine beschämende Formulierung** und damit das Blocker-Kriterium.

4. **Bekannte Kandidaten, die in jedem Durchgang neu zu bewerten sind** (nicht abhaken, sondern prüfen):
   - `"streak.connected"` in `src/translations/home.ts` Zeile 70: „Seit {days} Tagen mit dir verbunden" — behauptet eine Beziehung zur App. Frage 2 und zugleich ein B16-Befund.
   - `"streak.validatingMessage"` Zeile 69: „Du warst diese Woche {days} Tage für dich da. Das zählt." — prüfen, was bei `{days}` = 0 oder 1 dort steht.
   - Das Bestätigungswort für die Kontolöschung ist `DELETE` (`src/components/settings/AccountSettings.tsx`, `placeholder="DELETE"` und `disabled={deleteConfirmText !== "DELETE"}`). Ein englisches Großbuchstabenwort in der deutschen Oberfläche — Frage 6.
   - Die sechs Bindungsstufen aus G4 („Eine echte Verbindung", „Tiefes Verständnis") — Frage 2.

**Teil B — vollständiger Durchgang, quartalsweise (2 Stunden)**

5. **Alle Schlüssel prüfen.** `src/translations/` enthält 1100 Schlüssel (`grep -rhoE '^\s+"[a-zA-Z0-9_.]+":' src/translations/*.ts | wc -l`). Sie werden vollständig durch die acht Fragen geführt — nicht stichprobenartig. Zwei Stunden für 1100 kurze Zeilen sind realistisch, wenn der maschinelle Vorlauf aus Schritt 1 die Kandidaten vorsortiert.

6. **Die Texte außerhalb von `src/translations/` einsammeln.** Sie sind die eigentliche Lücke dieser Prüfung:
   ```
   grep -rnE '\bde: "' src/hooks src/components src/lib src/pages --include='*.ts' --include='*.tsx' | grep -v src/translations
   ```
   Jeder Treffer ist ein Text, der weder vom i18n-Ratchet (A6) noch von einer Durchsicht des Übersetzungsordners erfasst wird. Die Liste vollständig durch die acht Fragen führen.

7. **Am Gerät gegenlesen.** Zwölf Bildschirme in der App aufrufen und die Texte **laut** lesen — Beschämung hört man, bevor man sie sieht: `/onboarding` (vier Schritte) · `/home` mit Streak 0 · `/home` mit Streak 14 · `/chat` erste Nachricht · `/journal` leer · `/mood` nach dem Speichern · `/toolbox` · `/upgrade` · `/settings` · Kontolöschung-Dialog · `/safety` · Hilfekarte nach einer Krisennachricht.

**Belegt durch:** Tabelle mit einer Zeile je geprüftem Text (Schlüssel oder Datei:Zeile · acht Ja/Nein-Spalten · Schweregrad), Ausgabe der beiden `grep`-Läufe mit Datum, Buildnummer, Sprache der Prüfung.

**Bewertung:**
- **100** — Kein Ja bei Frage 1–3, kein Nein bei Frage 8 in der gesamten Textmenge einschließlich der Texte außerhalb von `src/translations/`, und ein Test im Tor bricht den Build, sobald ein Text aus der Sperrwortliste (Schritt 1) neu hinzukommt.
- **70** — Kein Ja bei Frage 1–3 in den Gruppen G1–G5; die Texte außerhalb von `src/translations/` (Rückkehrtexte, Bindungsstufen) sind geprüft, aber nicht gegen Rückfall gesichert und als bekannte Lücke dokumentiert; Krisen- und Bezahltexte sind nur im Quartalsdurchgang (Teil B) erfasst und als bekannte Lücke dokumentiert.
- **0** — **Beschämende Formulierung:** mindestens ein Text mit Ja bei Frage 1, 2 oder 3 oder mit Nein bei Frage 8 ist in der ausgelieferten App sichtbar.

---

### D4 — Fehlerkommunikation: menschlich, mit Ausweg, in der richtigen Sprache

**Ebene:** 2 (Release-Karte, gemeinsam mit D3 als „Textdurchsicht") — maschineller Teil gehört ins Tor
**Zeitbedarf:** Teil A 10 Minuten · Teil B 90 Minuten

**Durchführung:**

**Teil A — maschinell, jeder Release (10 Minuten, danach 0)**

1. **Rohe Anbietertexte zählen.** Ausführen:
   ```
   grep -rnE 'description: *(err|error)\.message' src --include='*.tsx' --include='*.ts'
   ```
   **Stand 28.07.2026: 13 Stellen in fünf Dateien** — `src/components/settings/AccountSettings.tsx` Zeilen 380, 409, 427, 482, 640, 665, 700, 721, 746 · `src/components/settings/SettingsAccountSection.tsx` Zeile 40 · `src/components/landing/DemoChat.tsx` Zeile 410 · `src/pages/Auth.tsx` Zeile 112 · `src/pages/ResetPassword.tsx` Zeile 86.
   An diesen Stellen wird der Fehlertext von Supabase unverändert in den Hinweis geschrieben. Supabase antwortet **immer auf Englisch** und **immer in Systemsprache** („Invalid login credentials", „New password should be different from the old password"). Das ist gleichzeitig ein technischer Fehlertext und ein Sprachbruch. Zeile 482 ist der einzige Fall mit Rückfall (`error.message || tt("accountSettings.tryAgain")`) — und auch dort gewinnt der englische Text, sobald es ihn gibt.

2. **Die Zahl im Tor festnageln.** Ein Block `D4` in `scripts/gate.mjs`, gebaut wie `N1`: derselbe Ausdruck, Höchstwert 0, Build bricht ab. Solange nicht alle 13 Stellen umgestellt sind, gilt der aktuelle Zählerstand als Höchstwert und muss monoton fallen.

**Teil B — zwölf Fehlerlagen von Hand, quartalsweise (90 Minuten)**

3. **Jede Lage gezielt herbeiführen** und den erscheinenden Text wörtlich abschreiben:

   | # | Lage | So wird sie ausgelöst |
   |---|---|---|
   | 1 | Falsches Passwort | `/auth`, gültige Adresse, falsches Passwort |
   | 2 | Adresse bereits registriert | `/auth`, Registrierung mit einer vorhandenen Adresse |
   | 3 | Passwort-Zurücksetzen für unbekannte Adresse | `/reset-password` mit einer nicht vergebenen Adresse |
   | 4 | Neues Passwort zu kurz | Einstellungen → Passwort ändern, vier Zeichen eingeben |
   | 5 | Profilbild mit falschem Dateityp | Einstellungen → Profilbild, eine `.txt`-Datei wählen |
   | 6 | Datenexport schlägt fehl | Einstellungen → Export, währenddessen Flugmodus einschalten |
   | 7 | Kontolöschung schlägt fehl | Löschdialog, „DELETE" tippen, vor dem Bestätigen Flugmodus einschalten |
   | 8 | Abmelden schlägt fehl | Einstellungen → Abmelden im Flugmodus |
   | 9 | Chat ohne Verbindung | Flugmodus, im Chat eine Nachricht senden |
   | 10 | Chat mit Serverfehler | `/dev-qa` öffnen; wenn dort kein Netzschalter liegt, den Simulator aus `src/hooks/useNetworkSimulator.ts` über `localStorage.setItem("soulvay-dev-network-sim","offline")` setzen, sonst in den DevTools die Function-URL blockieren |
   | 11 | Demo-Chat mit Serverfehler | Abgemeldet auf `/landing`, Demo-Chat, Function-URL blockieren |
   | 12 | Absturz eines Bereichs | In `src/pages/Journal.tsx` vorübergehend `throw new Error("x")` in den Rumpf setzen, `bun run dev`, `/journal` öffnen — greift `SectionErrorBoundary` |

   Zusätzlich Lage 13: denselben Wurf in `src/App.tsx` setzen, damit `src/components/ErrorBoundary.tsx` greift.

4. **Sechs Ja/Nein-Fragen je Fehlertext.** Dieselbe Form wie in D3, damit beide in einem Durchgang laufen:

   | # | Frage |
   |---|---|
   | 1 | Steht der Text in der Sprache, die in den Einstellungen gewählt ist? |
   | 2 | Ist er frei von Statuscodes, englischem Anbietertext, Feldnamen und Stapelspuren? |
   | 3 | Sagt er, **was** nicht geklappt hat — nicht nur, **dass** etwas nicht geklappt hat? |
   | 4 | Nennt er einen konkreten nächsten Schritt (Knopf oder Satz)? |
   | 5 | Ist erkennbar, ob die Eingabe verloren ist oder erhalten bleibt? |
   | 6 | Führt der genannte Ausweg tatsächlich irgendwohin — Knopf antippen und nachsehen? |

   **Ein Nein bei Frage 1 oder 2 ist ein technischer Fehlertext** und damit das Blocker-Kriterium.

5. **Sichtdauer messen.** `src/hooks/use-toast.ts` Zeile 6 setzt `TOAST_REMOVE_DELAY = 1000000` (rund 16 Minuten). Ob der Hinweis wirklich so lange steht, entscheidet die Komponente, nicht diese Konstante — deshalb mit der Stoppuhr messen, wie lange jeder der 13 Texte sichtbar ist. Unter 4 Sekunden ist zu kurz, um zwei Sätze zu lesen; über 30 Sekunden ohne Schließen-Knopf ist im Weg.

6. **Fehler ohne Text suchen.** Für jede der 13 Lagen zusätzlich notieren, ob **überhaupt** eine Rückmeldung erscheint. Ein Knopf, der ohne sichtbares Ergebnis nichts tut, ist der schwerere Fall als ein schlechter Fehlertext.

**Belegt durch:** Tabelle mit 13 Zeilen (Lage · wörtlicher Text · sechs Ja/Nein-Spalten · Sichtdauer in Sekunden), Ausgabe des `grep`-Laufs aus Schritt 1 mit Datum, Screenshots aller 13 Fehlertexte, Buildnummer, eingestellte App-Sprache.

**Bewertung:**
- **100** — Alle 13 Lagen zeigen einen Text in der eingestellten Sprache, ohne Anbietertext, mit benanntem Ausweg, der geprüft funktioniert — und der Block `D4` im Tor mit Höchstwert 0 bricht den Build, sobald irgendwo wieder `error.message` in einen Hinweis geschrieben wird.
- **70** — Alle 13 Lagen zeigen einen menschlichen Text mit Ausweg; einzelne Randfälle in den Einstellungen geben weiterhin den Anbietertext durch und sind namentlich mit Datei und Zeile dokumentiert; der Zähler im Tor fällt monoton.
- **0** — **Technischer Fehlertext:** mindestens eine der 13 Lagen zeigt einen Statuscode, eine englische Anbietermeldung oder eine Stapelspur. **Stand 28.07.2026 ist das der zu erwartende Befund** — 13 Stellen schreiben `error.message` unverändert in den Hinweis, und Supabase antwortet dort immer auf Englisch.

---

### D5 — Rückkehr nach 3 Tagen / 3 Wochen: sinnvoller Einstieg statt leerer Fläche

**Ebene:** 3 (Quartals-Audit)
*Das Gerüst nennt „jeder Release"; das Ausführungsmodell führt D5 auf keiner Liste. Die Prüfung braucht ein Konto mit Altdaten und eine Uhrmanipulation — das ist keine 90-Minuten-Karte.*

**Zeitbedarf:** 75 Minuten

**Durchführung:**

1. **Die Schwellen kennen, bevor gemessen wird.** `src/hooks/useReturnState.ts` Zeilen 66–69 teilt ein: `< 1 Tag` → `same_day` · `< 4 Tage` → `short_absence` · `< 8 Tage` → `medium_absence` · sonst `long_absence`. Die Karte erscheint **nur** ab `short_absence` und **nur** auf `/home` (`WelcomeBackCard`, importiert in `src/pages/Home.tsx` Zeile 25, gerendert in Zeile 200). „3 Tage" aus dem Gerüst trifft damit `short_absence`, „3 Wochen" trifft `long_absence`.

2. **Zustand herstellen, ohne drei Wochen zu warten.** Im Browser (`bun run dev`, angemeldetes Testkonto), Konsole:
   ```
   // 3 Tage
   localStorage.setItem("soulvay-last-visit", String(Date.now() - 3*24*60*60*1000));
   sessionStorage.removeItem("soulvay-return-dismissed");
   // 3 Wochen
   localStorage.setItem("soulvay-last-visit", String(Date.now() - 21*24*60*60*1000));
   sessionStorage.removeItem("soulvay-return-dismissed");
   ```
   Danach neu laden. Für den Gerätelauf auf dem A50 stattdessen Datum & Uhrzeit im System um 3 beziehungsweise 21 Tage vorstellen, App neu starten — **und die Uhr danach zurückstellen**, weil sonst Streaks (`src/hooks/useStreak.ts`) und geplante Erinnerungen (`src/lib/notificationSchedule.ts`) verfälscht bleiben.

3. **Das Testkonto mit Altdaten füllen**, bevor die Uhr springt: mindestens 5 Tagebucheinträge, 5 Stimmungs-Check-ins, 2 gespeicherte Gespräche, eine begonnene Übung, ein begonnenes Thema. Sonst misst man nur den Leerzustand und nicht die Rückkehr.

4. **Sechs Flächen nacheinander öffnen**, je einmal für 3 Tage und einmal für 3 Wochen, und für jede notieren, was zuerst im Blick steht: `/home` · `/chat` · `/journal` · `/mood` · `/timeline` · `/toolbox`.

5. **Fünf Ja/Nein-Fragen je Fläche:**
   - Steht dort ein Bezug zur eigenen Vorgeschichte (letzter Eintrag, letzte Stimmung, begonnene Übung) — oder eine leere Fläche?
   - Ist ein nächster Schritt benannt, der zur Situation passt (nicht „Schreib deinen ersten Eintrag", wenn 5 Einträge vorliegen)?
   - Wird das Ausbleiben bewertet oder gezählt? (Ein Ja ist zugleich ein D3-Befund nach Frage 3 und ein B16-Befund.)
   - Ist ein angefangener Vorgang wieder aufnehmbar?
   - Erscheint die Rückkehrkarte mehr als einmal pro Sitzung oder mehr als einmal insgesamt?

6. **Drei Befunde gezielt nachprüfen**, weil sie im Quelltext bereits angelegt sind:
   - **`ContinueModule` ist unerreichbar.** `grep -rn 'ContinueModule' src` liefert **nur die eigene Definition** (`src/components/home/ContinueModule.tsx`) — die Komponente wird nirgends eingebunden. Die Fläche „Mach weiter, wo du warst" existiert als Code und erscheint nie. Das ist zugleich ein N2-Befund (toter Code).
   - **Der Tagebuch-Entwurf verfällt nach 7 Tagen** (`ContinueModule.tsx`: `DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000`). Nach 3 Wochen wäre also auch bei eingebundener Komponente nichts mehr da. Prüfen, ob der Entwurf selbst noch in `localStorage` unter `soulvay_last_state_v1` liegt und nur nicht angezeigt wird — dann ist es ein Anzeige-, kein Datenproblem.
   - **Die Rückkehrtexte stehen nicht im Übersetzungsordner** (`useReturnState.ts` Zeilen 17–39, DE/EN direkt im Hook). Prüfen, ob die Karte in der eingestellten Sprache erscheint, wenn diese nicht `de` und nicht `en` ist — die Rückfallkette endet bei `msgs[category]?.en`.

7. **Streak-Verhalten nach der Rückkehr.** Nach 21 Tagen ist die Serie gebrochen. Auf `/home` nachsehen, was `StreakCounter` und `streak.*` in `src/translations/home.ts` dann anzeigen, und den Text durch die acht Fragen aus D3 führen. Eine Rückkehr nach drei Wochen ist der Moment mit dem höchsten Beschämungsrisiko der gesamten App.

**Belegt durch:** Zwölf Screenshots (sechs Flächen × zwei Abwesenheitsdauern), die Ja/Nein-Tabelle aus Schritt 5, die Ausgabe von `grep -rn 'ContinueModule' src`, ein Screenshot des Streak-Bereichs nach 21 Tagen, Datum und Buildnummer.

**Bewertung:**
- **100** — Nach 3 Tagen und nach 3 Wochen zeigt jede der sechs Flächen einen Einstieg, der die vorhandenen Daten aufgreift; begonnene Übungen und Themen sind wieder aufnehmbar; kein Text bewertet die Abwesenheit — und ein Test mit fixierter Uhr (wie in `src/test/notification-schedule.test.ts`) sichert die Einstufung und die Karte gegen Rückfall.
- **70** — `/home` zeigt nach beiden Abwesenheiten einen passenden Einstieg; die übrigen Flächen zeigen ihren gewöhnlichen Zustand, und die Wiederaufnahme angefangener Vorgänge fehlt (`ContinueModule` nicht eingebunden) — beides als bekannte Lücke dokumentiert.
- **0** — Das Gerüst nennt für D5 kein Blocker-Kriterium (Spalte Blocker: „—"). Es gilt der Anker „Nicht vorhanden": nach der Rückkehr steht auf allen Flächen dasselbe wie beim Erstbesuch, oder es existiert keine Messung mit einem Konto mit Altdaten. **Stand 28.07.2026 ist Letzteres der Fall.**

---

### D6 — Umkehrbarkeit: Löschen, Abbrechen, Rückgängig an den richtigen Stellen

**Ebene:** 2 (Release-Karte) für die zwei Blocker-Kandidaten aus Schritt 3 — 3 (Quartals-Audit) für die vollständige Inventur
*Das Ausführungsmodell führt D6 auf keiner Liste. Das Blocker-Kriterium ist unwiderruflicher Datenverlust; ein solcher Punkt gehört an die Stelle, die vor der Auslieferung läuft, nicht ins Quartal.*

**Zeitbedarf:** Kurzliste 10 Minuten · vollständige Inventur 90 Minuten

**Durchführung:**

1. **Alle Löschvorgänge auflisten.** Ausführen:
   ```
   grep -rn '\.delete()' src --include='*.tsx' --include='*.ts'
   grep -rln 'AlertDialog' src --include='*.tsx'
   ```
   **Stand 28.07.2026 liefert der erste Lauf drei Stellen** (`src/hooks/useChatPersistence.ts` Zeile 101, `src/pages/Mood.tsx` Zeile 140, `src/pages/Journal.tsx` Zeile 856). **Der zweite Lauf liefert zehn Dateien.** Davon ist eine die unveränderte shadcn-Primitive `src/components/ui/alert-dialog.tsx` — sie zählt nicht als Vorgang. Bleiben neun Dateien mit echten Bestätigungsdialogen; eine davon, `src/pages/DevQA.tsx` Zeile 330 (Test-Absturz auslösen), ist ein Entwicklerwerkzeug ohne Nutzerdatenbezug und wird nur vermerkt, nicht bewertet.

2. **Die Inventartabelle führen** — elf Vorgänge, je eine Zeile:

   | Vorgang | Ort | Warnung heute |
   |---|---|---|
   | Tagebucheintrag löschen | `src/pages/Journal.tsx` 855–857 über `src/components/journal/JournalEditor.tsx` 187–203 | Dialog vorhanden |
   | Gespräch löschen | `src/pages/ChatHistory.tsx` 156–169, `src/hooks/useChatPersistence.ts` 101 | Dialog vorhanden |
   | Stimmungs-Check-in desselben Tages überschreiben | `src/pages/Mood.tsx` 139–140 | **keine** |
   | Tagebuch-Editor schließen | `src/components/journal/JournalEditor.tsx` 106 (`onClose`) | **keine** |
   | Konto löschen | `src/components/settings/AccountSettings.tsx`, Dialog mit Tippbestätigung `DELETE` | Dialog + Tippbestätigung |
   | Zwei-Faktor abschalten | `src/components/settings/AccountSettings.tsx` 876–897 | Dialog vorhanden |
   | Begleiter wechseln | `src/components/companion/CompanionSelector.tsx` 171–190 | Dialog vorhanden |
   | KI-Einwilligung widerrufen | `src/components/settings/SettingsAIConsentSection.tsx` | Dialog vorhanden |
   | Absturzberichte widerrufen | `src/components/settings/SettingsCrashReportingSection.tsx` | Dialog vorhanden |
   | Abmelden | `src/components/settings/SettingsAccountSection.tsx` 66–78 | Dialog vorhanden |
   | Abo kündigen | `src/components/premium/SubscriptionSection.tsx` 198–225 | Dialog vorhanden |

   Die letzten beiden Zeilen fehlten in der ersten Fassung dieser Anweisung, obwohl der `grep` aus Schritt 1 sie liefert. Abmelden ist umkehrbar, aber es entscheidet, ob ungespeicherte Eingaben verloren gehen; Abo kündigen ist der einzige Vorgang in dieser Tabelle mit Geldfolge und gehört deshalb ausdrücklich hierher.

3. **Die zwei Blocker-Kandidaten am Gerät nachstellen** — das ist die Kurzliste für die Release-Karte:

   **(a) Stimmungs-Check-in überschreiben.** Heute einen Check-in mit Notiztext „Erster Text des Tages" speichern. `/mood` verlassen, neu öffnen — die alten Werte stehen im Formular. Notiz auf „Zweiter Text" ändern, speichern. Danach prüfen: Erscheint vor dem Speichern irgendein Hinweis, dass der bisherige Eintrag ersetzt wird? Steht der erste Text noch irgendwo? `src/pages/Mood.tsx` Zeile 140 löscht die Zeile und legt in Zeile 143 eine neue an — nicht `update`, sondern `delete` + `insert`. Zusätzlich im Tagebuch nachsehen: Zeilen 153–160 schreiben jede Notiz **zusätzlich** als Tagebucheintrag mit `source: "mood-checkin"`. Prüfen, ob nach zwei Check-ins am selben Tag zwei Tagebucheinträge stehen — dann verschwindet der Text nicht, wird aber verdoppelt, und beides ist zu notieren.

   **(b) Tagebuch-Editor mit ungespeicherten Änderungen schließen.** Neuen Eintrag beginnen, drei Sätze tippen, **nicht** speichern, oben links auf Schließen tippen (`JournalEditor.tsx` Zeile 106 ruft `onClose` ohne jede Abfrage). Prüfen: Kommt eine Rückfrage? Ist der Text nach dem Wiederöffnen noch da? Dasselbe mit der Zurück-Geste auf Android und der Wischgeste auf iOS wiederholen — beide Wege getrennt protokollieren, weil sie andere Handler auslösen.

4. **Vier Ja/Nein-Fragen je Zeile der Inventartabelle:**
   - Warnt die App **vor** der Ausführung und benennt dabei den Umfang (was genau verschwindet, wie viele Einträge)?
   - Ist „Abbrechen" erreichbar **und** wirksam? Nach dem Abbruch in der Supabase-Tabelle nachsehen, ob der Datensatz noch da ist.
   - Gibt es ein Rückgängig innerhalb der Sichtdauer des Hinweises? **Stand 28.07.2026 nirgends** — `grep -rniE 'undo|rückgängig' src` liefert genau zwei Treffer, beide in `src/components/settings/AccountSettings.tsx` (Zeile 130 und 206) und beide nur der Warnsatz „kann nicht rückgängig gemacht werden" / „cannot be undone". Kein einziger der 134 Hinweisaufrufe (`grep -rnoE '\btoast\(' src --include='*.tsx' --include='*.ts' | wc -l`) trägt eine Aktion.
   - Ist nach dem Löschen wirklich gelöscht? Im Supabase-SQL-Editor gegen die betroffene Tabelle prüfen (`journal_entries`, `conversations`, `mood_checkins`) — nicht nur, ob die Liste in der App leer aussieht.

5. **Die Gegenrichtung prüfen: Daten, die man nicht loswird.** Gespeicherte Erinnerungen liegen in `user_memories` und werden im Systemprompt mitgeschickt. In der Oberfläche gibt es dafür **keinen Löschweg**: `grep -rn 'user_memories' src` liefert vier Treffer, und keiner davon ist ein Schreib- oder Löschzugriff — die Typdefinition in `src/integrations/supabase/types.ts` Zeile 532, zwei Lesezugriffe in `src/hooks/useCompanionCheckins.ts` Zeile 43 und `src/hooks/useMemoryMoments.ts` Zeile 32 sowie der Export in `AccountSettings.tsx` Zeile 507. Einzelne Erinnerungen sind nur durch Löschen des gesamten Kontos zu entfernen. Das ist ein D6-Befund und zugleich B16 Schritt 4.

6. **Kontolöschung vollständig durchspielen** — an einem Wegwerf-Konto, nicht am eigenen. Prüfen: Warnt der Dialog vor dem, was verschwindet? Ist das Tippwort verständlich? (`DELETE` ist englisch, siehe D3 Frage 6.) Wird nach dem Löschen ein Nachweis angezeigt? Der Wiederherstellungstest gehört zu C14 und wird hier nur verwiesen, nicht wiederholt.

**Belegt durch:** Inventartabelle mit elf Zeilen und vier Ja/Nein-Spalten, Screenshots der beiden Nachstellungen aus Schritt 3 (je einer vor und nach dem Vorgang), SQL-Ergebnisse aus Schritt 4, Ausgabe der vier `grep`-Läufe (`.delete()`, `AlertDialog`, `undo|rückgängig`, `user_memories`) mit Datum, Buildnummer, Plattform.

**Bewertung:**
- **100** — Jeder der elf Vorgänge warnt mit benanntem Umfang, „Abbrechen" ist nachweislich wirksam, die drei Löschvorgänge auf Nutzerdaten bieten ein Rückgängig innerhalb der Hinweisdauer, gespeicherte Erinnerungen sind einzeln löschbar — und ein Test bricht den Build, sobald ein `.delete()` auf eine Nutzerdaten-Tabelle ohne vorgeschalteten Bestätigungsdialog hinzukommt.
- **70** — Jeder Vorgang, der Daten dauerhaft entfernt, warnt vorher mit benanntem Umfang; ein Rückgängig existiert nirgends und ist als bewusste, datierte Entscheidung dokumentiert; die fehlende Einzellöschung von Erinnerungen ist als Lücke festgehalten.
- **0** — **Unwiderruflicher Datenverlust ohne Warnung:** mindestens ein Vorgang entfernt Nutzerinhalt endgültig, ohne dass vorher ein Hinweis erscheint. **Stand 28.07.2026 sind zwei Kandidaten offen** — das Überschreiben des Stimmungs-Check-ins (`src/pages/Mood.tsx` Zeile 140) und das Schließen des Tagebuch-Editors mit ungespeichertem Text (`src/components/journal/JournalEditor.tsx` Zeile 106). Beide sind nach Schritt 3 am Gerät zu entscheiden, bevor eine Zahl vergeben wird.

---

## Gruppe F — Performance & Ressourcen

### F1 — Startzeit bis Interaktion, Bundle-Größe, größter Chunk

**Ebene:** 1 (Tor) als Bundle-Budget im Build — **heute nicht eingerichtet**, deshalb derzeit Ebene 3 (F-Reste im Quartals-Audit). Der Geräteanteil (Kaltstart) bleibt dauerhaft Ebene 2 (Release-Karte).
**Zeitbedarf:** 90 Minuten einmalige Einrichtung des Budgets · danach 25 Minuten Gerätemessung je Release
**Durchführung:**

**Teil A — Ist-Stand messen (jederzeit wiederholbar, 10 Minuten)**

1. **Frisch bauen und die Zahlen ziehen.** Im Repo-Wurzelverzeichnis:
   `rm -rf dist && bun run build`
   Vite gibt am Ende jede Ausgabedatei mit roher und gzip-Größe aus. Diese Ausgabe vollständig in die Prüfnotiz kopieren.
2. **Kritischen Pfad bestimmen.** Nur die Dateien zählen, die `dist/index.html` selbst anfordert — alles andere lädt erst beim Routenwechsel:
   `grep -o 'href="/assets/[^"]*"\|src="/assets/[^"]*"' dist/index.html`
   Stand 28.07.2026 sind das fünf Dateien: der Einstiegs-Chunk `index-*.js`, die drei `modulepreload`-Chunks `vendor-*.js`, `ui-*.js`, `supabase-*.js` und `index-*.css`.
3. **Kritischen Pfad in gzip summieren.** Für jede Datei aus Schritt 2:
   `for f in dist/assets/index-*.js dist/assets/vendor-*.js dist/assets/ui-*.js dist/assets/supabase-*.js dist/assets/index-*.css; do printf "%-40s roh %8d gzip %8d\n" "$f" "$(stat -f%z "$f")" "$(gzip -c "$f" | wc -c)"; done`
   **Stand 28.07.2026: 503,8 KiB gzip** (index 341,4 · vendor 52,4 · ui 37,9 · supabase 43,1 · CSS 29,1) bei **1,60 MiB roh**.
4. **Größten Einzel-Chunk bestimmen.** `ls -S dist/assets/*.js | head -3`
   **Stand 28.07.2026: `index-*.js` mit 1.181.610 Bytes roh / 341,4 KiB gzip.** Ursache belegen: `grep -n '^import .* from "@/pages' src/App.tsx` zeigt vier Seiten, die **nicht** über `lazy()` geladen werden und deshalb im Einstiegs-Chunk landen — `Chat`, `Home`, `Auth`, `Onboarding` (Zeilen 28–31). Alle übrigen 29 Seiten sind ab Zeile 34 korrekt lazy.

**Teil B — Bundle-Budget im Build einrichten (einmalig, 90 Minuten)**

5. **Budgetdatei anlegen** unter `audit/bundle-budget.json` mit vier Werten:

   | Schlüssel | Wert | Begründung |
   |---|---|---|
   | `kritischerPfadGzipKiB` | **500** | Bei der Lighthouse-Mobilvoreinstellung („Slow 4G", ca. 1,4 Mbit/s netto) sind 500 KiB rund 2,9 s reine Übertragung. Das Blocker-Kriterium lautet „Start > 3 s". Mehr als 500 KiB kann den Blocker rechnerisch nicht mehr einhalten, egal wie schnell der Code danach ist. |
   | `groessterChunkRohKiB` | **1024** | Faustwert für ARM-Mittelklassekerne (Exynos 9610 im Galaxy A50): rund 1 MB entpacktes JavaScript je Sekunde für Parsen und Kompilieren. Ein Chunk über 1 MiB verbraucht allein dafür eine der drei verfügbaren Sekunden. |
   | `groessterChunkGzipKiB` | **350** | Rohgröße misst Rechenzeit, gzip-Größe misst Ladezeit. Beide Grenzen sind nötig, sonst rutscht ein gut komprimierbarer 3-MB-Chunk durch. |
   | `precacheMiB` | **5** | siehe F3 |

6. **Prüfskript schreiben** als `scripts/bundle-budget.mjs`. Es muss vier Dinge tun: (a) die von `dist/index.html` angeforderten Assets ermitteln und ihre gzip-Summe bilden, (b) die größte `.js`-Datei in `dist/assets/` roh und gzip messen, (c) das Precache-Manifest aus `dist/sw.js` per `/\{url:"([^"]+)",revision:/g` auslesen und die Dateigrößen summieren, (d) jeden Wert gegen `audit/bundle-budget.json` prüfen und bei Überschreitung mit `process.exit(1)` und einer Zeile je gerissenem Budget abbrechen. Vorbild für Aufbau und Ausgabeformat: `scripts/gate.mjs` (Funktion `pruefe`, Ausgabeblock am Dateiende).
7. **In den Build hängen.** In `package.json` die Skripte ändern:
   `"build": "vite build && node scripts/bundle-budget.mjs"`
   Damit greift das Budget automatisch auch in `build:ios` (`rm -rf dist && vite build && npx cap sync ios`) — dort muss `node scripts/bundle-budget.mjs` **vor** `cap sync` eingefügt werden, sonst wandert ein zu großes Bundle trotz rotem Budget in `ios/App/App/public`.
8. **In die CI hängen.** In `.github/workflows/ci.yml` einen Job `budget` nach dem Muster des Jobs `gate` ergänzen: Checkout · `oven-sh/setup-bun@v2` · `bun install --frozen-lockfile` · `bun run build`. Kein `continue-on-error` — der Lint-Job in derselben Datei ist der abschreckende Gegenbeweis.
9. **Nicht in `scripts/gate.mjs` einbauen.** `scripts/check-framework.py` liest ab Zeile 115 die Ebene-1-Liste aus `audit/TEST_FRAMEWORK.md` und vergleicht sie ab Zeile 122 mit allen `pruefe("…")`-Kennungen in `gate.mjs`. Ein neues `pruefe("F1", …)` ohne gleichzeitige Ergänzung von F1 und F3 in der Ebene-1-Liste bricht die CI über Punkt K7. Entweder beides zugleich ändern oder — empfohlen — das Budget als eigenen Build-Schritt führen, wie in Schritt 7 und 8 beschrieben.
10. **Als fallende Sperrklinke betreiben.** Solange der Ist-Wert über dem Zielwert liegt (Stand 28.07.2026: 503,8 KiB gegen Budget 500 KiB, größter Chunk 1153,9 KiB roh gegen Budget 1024 KiB), den Ist-Wert als Startwert in die Budgetdatei schreiben, in derselben Datei den Zielwert als Feld `ziel` festhalten und die Regel „darf nur fallen" anwenden — dasselbe Verfahren wie beim Lint-Zähler (N3) und bei A6. Jede Senkung wird als Commit auf die Budgetdatei sichtbar.

**Teil C — Kaltstart auf Geräten messen (25 Minuten je Release)**

11. **Referenzgeräte festlegen.** „Mittelklasse" im Sinne des Blocker-Kriteriums ist für dieses Projekt das **Samsung Galaxy A50** (Exynos 9610, 4 GB RAM, Baujahr 2019) — das Gerät, auf dem der Android-Build ohnehin getestet wird. Für iOS gilt das **älteste noch unterstützte Modell** aus der Deployment-Target-Einstellung in `ios/App/App.xcodeproj`.
12. **Kalt starten und filmen.** App vollständig beenden (Android: Übersichtstaste → wegwischen; iOS: App-Umschalter → hochwischen), Gerät 30 Sekunden liegen lassen. Dann Bildschirmaufnahme starten und die App über das Startsymbol öffnen.
    Android zusätzlich mit Zeitstempeln: `adb shell screenrecord --bugreport /sdcard/start.mp4`
13. **Ausmessen.** Video mit 60 fps Einzelbildvorschub durchgehen. Startpunkt: das Bild, in dem das App-Symbol den Druck quittiert. Endpunkt: das erste Bild, in dem das Eingabefeld des Chats sichtbar **und** bedienbar ist — nicht der Splash-Screen und nicht der `PageLoader`-Platzhalter aus `src/App.tsx` Zeile 178. Bildabstand ÷ 60 = Startzeit in Sekunden. **3 s entsprechen 180 Bildern.**
    Die Werte `launchShowDuration: 2000` aus `capacitor.config.ts` zählen mit — der Splash ist Teil der Startzeit, die der Nutzer erlebt.
14. **Drei Läufe je Gerät**, Median nehmen. Einzelmessungen streuen auf Mobilgeräten um mehrere hundert Millisekunden.
15. **Web/PWA gegenprüfen.** `bun run build && bun run preview` starten, in Chrome `http://localhost:4173` öffnen, DevTools → Lighthouse → Gerät „Mobil", Kategorie „Leistung", Modus „Navigation", Standarddrosselung. Notieren: Leistungswert, **Largest Contentful Paint** und **Total Blocking Time**. Zielwerte: LCP ≤ 2,5 s und TBT ≤ 200 ms (die „gut"-Schwellen der Core Web Vitals), Leistungswert ≥ 80.

**Belegt durch:** Build-Ausgabe von `bun run build` als Textdatei mit Datum · die vier Zahlen aus Teil A · bei eingerichtetem Budget der grüne CI-Lauf des Jobs `budget` und die versionierte `audit/bundle-budget.json` · drei Bildschirmaufnahmen je Gerät mit ausgezählten Bildnummern · Lighthouse-Bericht als HTML-Datei.

**Bewertung:**
- **100** — Kaltstart-Median ≤ 3 s auf dem Galaxy A50 **und** dem ältesten unterstützten iPhone, kritischer Pfad ≤ 500 KiB gzip, größter Chunk ≤ 1024 KiB roh, und `scripts/bundle-budget.mjs` läuft im Build und in der CI und bricht bei Überschreitung ab.
- **70** — Kaltstart-Median ≤ 3 s auf beiden Geräten und die Budgetdatei existiert als fallende Sperrklinke, die Zielwerte sind aber noch nicht erreicht (dokumentierte Lücke) — oder das Budget läuft nur lokal und nicht in der CI.
- **0** — **Start > 3 s auf Mittelklasse**: Der Kaltstart-Median bis zum bedienbaren Chat-Eingabefeld überschreitet auf dem Galaxy A50 drei Sekunden.

---

### F2 — Laufzeit: Scrollen, Tippen, Streaming ohne Ruckeln

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 40 Minuten (20 Minuten je Plattform)
**Durchführung:**

Diese Prüfung misst den WebView, nicht die native Hülle. Bei einer Capacitor-App ist der WebView die Anwendung — die richtigen Werkzeuge sind deshalb Safari Web Inspector und Chrome DevTools, nicht Instruments.

1. **Testdaten anlegen.** Ohne Datenmenge misst man nichts. Auf dem Testkonto herstellen: **60 Tagebucheinträge** mit je mindestens 500 Zeichen, **90 Stimmungseinträge** über 90 Tage, **eine Chat-Unterhaltung mit ≥ 200 Nachrichten**. Begründung für 60 Einträge: `src/pages/Journal.tsx` Zeile 181 lädt mit `.limit(200)` und rendert ohne Virtualisierung — die Liste muss also im Bereich getestet werden, in dem sie wirklich lang wird.
2. **iOS anschließen.** iPhone per Kabel, Safari am Mac → Entwickeln → Gerät → Soulvay. Im Web Inspector den Reiter **Timelines** öffnen, „JavaScript & Ereignisse" und „Layout & Rendering" aktivieren.
3. **Android anschließen.** Galaxy A50 per Kabel, USB-Debugging an, in Chrome `chrome://inspect` öffnen, unter `com.jonathanjansen.mindmate` auf „inspect". Reiter **Performance**, Aufzeichnung mit „Screenshots" und „Web Vitals".
4. **Vier Szenen aufzeichnen**, je 10 Sekunden, je Gerät:
   - **Tagebuchliste scrollen.** `/journal` öffnen, mit dem Daumen zügig von unten nach oben durchziehen.
   - **Tippen im Chat.** `/chat` öffnen, einen Satz von 80 Zeichen zügig eintippen. Gemessen wird die Verzögerung zwischen Tastenanschlag und erscheinendem Zeichen.
   - **Streaming.** Eine Nachricht senden und die einlaufende Antwort aufzeichnen. Der Streaming-Pfad liegt in `src/hooks/useChatComposer.ts` Zeilen 151–152 (`getReader()` / `TextDecoder`); jedes Teilstück löst ein Rendern der Nachrichtenliste aus.
   - **Routenwechsel.** Fünfmal zwischen `/home`, `/chat`, `/journal` und `/mood` wechseln. Der Übergang wird in `src/components/layout/AppLayout.tsx` von framer-motion animiert; 100 Dateien in `src/` verwenden framer-motion.
5. **Auswerten nach zwei Schwellen.** In der Aufzeichnung die Bildzeiten ablesen:
   - **Ruckeln:** mehr als **drei aufeinanderfolgende Bilder über 16,7 ms** (Begründung: bei 60 Hz ist 16,7 ms das Bildbudget; ein einzelnes verpasstes Bild ist unsichtbar, drei in Folge sind als Stocken sichtbar).
   - **Trägheit:** ein einzelnes Bild oder eine einzelne Aufgabe über **100 ms** (Begründung: ab 100 ms wird eine Reaktion nicht mehr als unmittelbar erlebt — die klassische Grenze für „direkte Manipulation").
   Beide Werte je Szene und Gerät in die Tabelle eintragen.
6. **Reizreduktion gegenprüfen.** Systemeinstellung „Bewegung reduzieren" (iOS) bzw. „Animationen entfernen" (Android) einschalten, Szene 4 wiederholen. Der Routenwechsel muss ohne Animation erfolgen (`useReducedMotion` in `src/components/layout/AppLayout.tsx` Zeile 23). Ruckelt es hier weiterhin, liegt die Ursache nicht in der Animation.
7. **Gegenprobe ohne Profiler.** Beide Geräte ohne angeschlossenen Debugger bedienen und in einem Satz notieren, ob das Stocken **spürbar** ist. Das Blocker-Kriterium lautet „spürbares Stocken", nicht „Messwert überschritten" — die Zahlen aus Schritt 5 begründen das Urteil, sie ersetzen es nicht.

**Belegt durch:** Tabelle mit 8 Zeilen (4 Szenen × 2 Plattformen), je Zeile längstes Bild in ms · Anzahl Bilder über 16,7 ms · spürbar ja/nein · Datum · Buildnummer · Datenmenge des Testkontos. Dazu die exportierten Aufzeichnungen (Safari: `.json`, Chrome: Performance-Profil `.json`).

**Bewertung:**
- **100** — Alle acht Szenen ohne Bild über 100 ms und ohne drei aufeinanderfolgende Bilder über 16,7 ms, und ein automatischer Rückfallschutz existiert: ein Playwright-Lauf in `e2e/` misst über die `PerformanceObserver`-API die längste Aufgabe beim Scrollen der Tagebuchliste mit 60 Einträgen und bricht ab 100 ms ab.
- **70** — Alle acht Szenen ohne spürbares Stocken, einzelne Messwerte über 16,7 ms in der Tagebuchliste bleiben als dokumentierte Lücke stehen (Liste ohne Virtualisierung, `src/pages/Journal.tsx` Zeile 181), kein automatischer Rückfallschutz.
- **0** — **Spürbares Stocken**: In mindestens einer der acht Szenen ist das Ruckeln ohne Messwerkzeug wahrnehmbar, oder ein Bild überschreitet 100 ms.

---

### F3 — Datenverbrauch: Precache-Größe, Bildgrößen, Nachladeverhalten

**Ebene:** 1 (Tor) als Bundle-Budget im Build — **heute nicht eingerichtet**, derzeit Ebene 3 (F-Reste im Quartals-Audit)
**Zeitbedarf:** 45 Minuten (Einrichtung gemeinsam mit F1, Schritte 5–10)
**Durchführung:**

1. **Precache-Summe messen.** Der Service Worker lädt alles aus dem Precache-Manifest herunter, bevor die App offline nutzbar ist — und lädt jede Datei erneut, sobald sich ihre Revision ändert. Nach `rm -rf dist && bun run build`:
   ```
   node -e 'const fs=require("fs");const sw=fs.readFileSync("dist/sw.js","utf8");
   const u=[...sw.matchAll(/\{url:"([^"]+)",revision:/g)].map(m=>m[1]);
   let t=0;const r=[];for(const x of u){const s=fs.statSync("dist/"+decodeURIComponent(x));t+=s.size;r.push([s.size,x]);}
   r.sort((a,b)=>b[0]-a[0]);
   console.log(u.length,"Einträge |",(t/1048576).toFixed(2),"MiB");
   r.slice(0,12).forEach(x=>console.log((x[0]/1024).toFixed(0).padStart(7)+" KiB  "+x[1]));'
   ```
   **Stand 28.07.2026: 169 Einträge, 20,39 MiB.**
2. **Die Einträge nach Zweck sortieren.** Aus derselben Ausgabe die Summen je Verzeichnis bilden. **Stand 28.07.2026: `store/` = 13,50 MiB, `companions/` = 2,78 MiB.**
3. **Toten Ballast nachweisen.** Prüfen, ob eine precachte Datei überhaupt von der App angefordert wird:
   `grep -rn "store/" src index.html public/manifest.json`
   `grep -rn "hires" src index.html public/manifest.json`
   **Stand 28.07.2026 liefern beide Befehle null Treffer.** `public/store/` sind App-Store-Screenshots (34 Dateien, ~850 KiB je Bild), `public/companions/hires/` sind Rohvorlagen (2,0 MB). Beides wird von keiner Codestelle geladen, landet aber über `globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]` in `vite.config.ts` im Precache **und** über `cap sync` in beiden App-Binärdateien: `du -sh ios/App/App/public android/app/src/main/assets/public` zeigt je 21 MB, davon je 14 MB `store/`.
4. **Doppelte Bilder nachweisen.** `cd public/companions && md5 -q mira.jpg mira.png` — Stand 28.07.2026 identischer Hash. Jedes der elf Companion-Bilder liegt zweimal im Repository, einmal als `.jpg` und einmal als bytegleiche `.png`. Referenziert wird nur `.png` (`src/data/companions.ts` ab Zeile 33). Die `.jpg`-Kopien entgehen dem Precache-Glob, werden aber ausgeliefert.
5. **Budget setzen.** In `audit/bundle-budget.json` (siehe F1 Schritt 5) den Wert `precacheMiB: 5` eintragen. **Begründung:** Der Precache muss die App-Hülle, die Schriften und die elf Companion-Avatare in Anzeigegröße enthalten — das sind rund 1,7 MiB Code plus 1,0 MiB Bilder. 5 MiB lassen Raum für Wachstum und entsprechen bei „Slow 4G" rund 30 Sekunden Erstinstallation. Bilder ohne Funktion in der App gehören nicht dazu.
6. **Aufräumen, bevor der Wert gemessen wird.** `public/store/` und `public/companions/hires/` nach `assets/` außerhalb von `public/` verschieben (`assets/` wird nicht von Vite ausgeliefert), die `.jpg`-Dubletten löschen, `og-image.png` (813 KiB) auf ≤ 200 KiB verkleinern — es wird nur als Vorschaubild für geteilte Links gebraucht (`index.html` Zeilen 33 und 45) und nie in der App angezeigt. Danach Schritt 1 wiederholen.
7. **Erstladung im Netz messen.** `bun run preview` starten, Chrome DevTools → Netzwerk → „Cache deaktivieren" an, Drosselung „Slow 4G", `http://localhost:4173` laden und einmal durch Onboarding, Chat, Tagebuch, Stimmung und Übungen klicken. Unten in der Statusleiste die **übertragene Gesamtmenge** ablesen. Das ist die Zahl, gegen die das Blocker-Kriterium „> 25 MB Erstladung" gilt.
8. **Nachladeverhalten prüfen.** Im selben Netzwerkmitschnitt filtern nach `.js`: Beim Wechsel auf `/journal`, `/topics` und `/settings` muss je genau ein neuer Chunk nachgeladen werden (die `lazy()`-Routen aus `src/App.tsx` ab Zeile 34). Wird beim ersten Laden bereits alles geholt, ist die Codeaufteilung wirkungslos.
9. **Bildgrößen prüfen.** Im Netzwerkmitschnitt nach `Img` filtern. Für jedes geladene Bild die ausgelieferte Pixelgröße mit der Anzeigegröße vergleichen (DevTools zeigt beides im Tooltip). Ein Bild, das mehr als das Doppelte der Anzeigekantenlänge liefert, wird notiert. Referenzgrenze: **kein Bild über 150 KiB** — bei einem Avatar von maximal 96 px Kantenlänge auf einem 3x-Display sind das 288 px, was als PNG unter 60 KiB liegt.
10. **Native Auslieferungsgröße festhalten.** `ls -la android/app/build/outputs/bundle/release/app-release.aab` (Stand 28.07.2026: 28,8 MB) und die Download-Größe aus App Store Connect → App-Größe notieren. Diese Zahl steht nicht im Blocker-Kriterium, gehört aber ins Protokoll, weil sie die Aufräumwirkung aus Schritt 6 sichtbar macht.

**Belegt durch:** Ausgabe des Precache-Skripts aus Schritt 1 vor und nach dem Aufräumen · Netzwerkmitschnitt als HAR-Datei mit der übertragenen Gesamtmenge · Liste der Bilder über 150 KiB · `audit/bundle-budget.json` im Repository · AAB-Größe und App-Store-Download-Größe mit Datum.

**Bewertung:**
- **100** — Precache ≤ 5 MiB, Erstladung über alle fünf Kernflüsse ≤ 8 MB, kein Bild über 150 KiB, jede lazy geladene Route lädt genau einen Chunk nach, und `scripts/bundle-budget.mjs` bricht den Build bei Überschreitung der Precache-Grenze ab.
- **70** — Erstladung deutlich unter 25 MB und Precache ≤ 8 MiB, aber einzelne Bilder über der Grenze oder das Budget läuft noch nicht im Build (dokumentierte Lücke).
- **0** — **> 25 MB Erstladung**: Der Netzwerkmitschnitt aus Schritt 7 weist über alle Kernflüsse mehr als 25 MB übertragene Daten aus.

---

### F4 — Akku & Speicher: Hintergrundaktivität, Intervalle, Speicherlecks

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 3 Stunden (davon 2 × 30 Minuten reine Messzeit, dazu 8 Stunden unbeaufsichtigte Hintergrundmessung)
**Durchführung:**

**Teil A — Timer und Abonnements inventarisieren (20 Minuten)**

1. **Alle laufenden Intervalle auflisten.** `grep -rn "setInterval" src --include="*.ts" --include="*.tsx"`
   Stand 28.07.2026 sind es acht. Für jedes in eine Tabelle eintragen: Datei · Zeile · Intervalldauer · wird es beim Verlassen der Komponente aufgeräumt (`clearInterval` im `return` des `useEffect`)?
   Besonders zu prüfen, weil sie über die ganze Sitzung laufen:
   - `src/hooks/usePushNotifications.ts` Zeile 176 — Erinnerungsprüfung im **60-Sekunden-Takt**
   - `src/hooks/useAnalytics.ts` Zeile 197 — Sammelversand über `FLUSH_INTERVAL_MS`
   - `src/hooks/usePremium.ts` Zeile 240 — Abo-Status
   - `src/lib/micDiagnostics.ts` Zeile 151 — **500-Millisekunden-Takt**; prüfen, ob dieser Takt nur im Diagnosemodus startet und nicht im normalen Chat
2. **Server-Abonnements auflisten.** `grep -rn "\.channel(" src --include="*.ts" --include="*.tsx"` — Stand 28.07.2026 ein Kanal in `src/hooks/useInsightsAndPatterns.ts` Zeile 62. Prüfen, ob er beim Verlassen der Startseite abgemeldet wird; ein offener Realtime-Kanal hält die Netzwerkverbindung wach.
3. **Verhalten im Hintergrund prüfen.** Für jeden Eintrag aus Schritt 1 und 2 feststellen, ob er beim Wechsel in den Hintergrund pausiert. In Capacitor ist der Anker dafür das `appStateChange`-Ereignis; findet `grep -rn "appStateChange" src` keinen Treffer, laufen alle Timer im Hintergrund weiter, solange das System den WebView nicht anhält — das ist der wahrscheinlichste Befund und gehört als solcher notiert.

**Teil B — Speicher über 30 Minuten (60 Minuten je Plattform)**

4. **Messschleife festlegen.** Ein Durchlauf besteht aus: `/home` → `/chat` (eine Nachricht senden, Antwort abwarten) → `/journal` (Eintrag anlegen und speichern) → `/mood` (Stimmung erfassen) → `/toolbox` (eine Übung starten und abbrechen) → zurück zu `/home`. Ein Durchlauf dauert etwa 90 Sekunden; **20 Durchläufe** ergeben die geforderte halbe Stunde.
5. **iOS messen.** Gerät per Kabel, Safari → Entwickeln → Gerät → Soulvay → Web Inspector → **Timelines → JavaScript-Allokationen**. Vor dem ersten Durchlauf, nach dem fünften und nach dem zwanzigsten je einen Schnappschuss nehmen, jeweils **nach** erzwungener Speicherbereinigung (Mülltonnen-Symbol im Inspector). Zusätzlich nativ: Xcode → Product → Profile → Instruments-Vorlage **Leaks**, gegen dieselbe Schleife laufen lassen und die Spalte „Leaked Bytes" ablesen.
6. **Android messen.** Galaxy A50 per Kabel, Android Studio → View → Tool Windows → **Profiler** → Prozess `com.jonathanjansen.mindmate` → Memory. Dieselben drei Zeitpunkte, jeweils nach Antippen von „Force garbage collection". Für den WebView-Speicher zusätzlich `chrome://inspect` → Memory → Heap-Schnappschuss.
7. **Schwelle anwenden.** Der JS-Heap nach dem 20. Durchlauf darf höchstens **25 % über** dem Wert nach dem 5. Durchlauf liegen. **Begründung:** Die ersten Durchläufe füllen Zwischenspeicher (React-Query-Cache, Bilder, Schriften) — das ist normales Einschwingen. Ab dem fünften Durchlauf sollte sich ein Plateau einstellen. Monotones Wachstum über 15 Durchläufe hinweg ist ein Leck, unabhängig vom Absolutwert.
8. **Absturz durch Speichermangel provozieren.** Nach den 20 Durchläufen die App 5 Minuten im Sprachmodus laufen lassen (`useConversationalVoice`), dann die Tagebuchliste mit 60 Einträgen scrollen. Ein Neuladen des WebViews (die App springt sichtbar auf den Startbildschirm zurück, ohne dass jemand navigiert hat) ist ein Speichermangel-Neustart und zählt als Fehlschlag.

**Teil C — Akku (30 Minuten aktiv, 8 Stunden Hintergrund)**

9. **Vergleichswert erzeugen.** Auf dem Galaxy A50 bei 50 % Helligkeit, Flugmodus aus, WLAN an, 30 Minuten ein Video in voller Bildschirmgröße abspielen. Ladestand vorher und nachher notieren. **Begründung für dieses Verfahren:** Ein absoluter Prozentwert sagt nichts, weil er von Akkualter und Helligkeit abhängt. Der Vergleichswert kalibriert die Messung auf das Gerät. Eine Text-App darf nicht mehr verbrauchen als eine Videowiedergabe.
10. **Aktivverbrauch messen.** Gerät voll laden, auf 100 % starten, dieselben Bedingungen wie in Schritt 9, 30 Minuten die Schleife aus Schritt 4 durchlaufen. Ladestand vorher/nachher. **Schwelle: Verbrauch ≤ Vergleichswert aus Schritt 9.**
11. **Hintergrundverbrauch messen.** App in den Hintergrund schicken, Gerät 8 Stunden über Nacht liegen lassen (Bildschirm aus, WLAN an, keine weitere Nutzung). Danach: Einstellungen → Akku → Akkunutzung → Soulvay. **Schwelle: ≤ 1 % Akku und ≤ 1 Minute „Hintergrundaktivität".** Begründung: Die App hat keine Funktion, die im Hintergrund arbeiten muss — lokale Erinnerungen werden vom Betriebssystem geplant (`@capacitor/local-notifications`), nicht von einem laufenden Timer.
12. **Android im Detail.** Vor der Nachtmessung `adb shell dumpsys batterystats --reset`, danach `adb shell dumpsys batterystats > batterystats.txt`. In der Datei nach `com.jonathanjansen.mindmate` suchen und die Zeilen `Wake lock` und `Alarm` auswerten. **Ein Wakelock über 60 Sekunden Gesamtdauer in 8 Stunden ist ein Fehlschlag.** Zur Lesbarkeit die Datei durch Battery Historian schicken.
13. **iOS im Detail.** Nach der Nachtmessung: Einstellungen → Batterie → letzte 24 Stunden → Soulvay antippen; die Aufteilung „Bildschirm an / Bildschirm aus" ablesen. Zusätzlich Xcode → Window → Organizer → Reiter **Energie** für den ausgelieferten Build; dort erscheinen die aggregierten MetricKit-Werte echter Nutzer, sofern genug Installationen vorhanden sind.
14. **Speicherplatz auf dem Gerät festhalten.** Einstellungen → Apps → Soulvay → Speicher (Android) bzw. Einstellungen → Allgemein → iPhone-Speicher → Soulvay (iOS). „App" und „Daten" getrennt notieren. Nach der Messschleife erneut ablesen: Wächst „Daten" um mehr als 20 MB in 30 Minuten Nutzung, wachsen WebView-Caches unbegrenzt.

**Belegt durch:** Timer-Tabelle aus Teil A (Datei · Zeile · Takt · aufgeräumt ja/nein · pausiert im Hintergrund ja/nein) · drei Heap-Schnappschüsse je Plattform mit Zahlenwerten und Zeitpunkten · `batterystats.txt` und der Battery-Historian-Bericht · Fotos der Akkuanzeige vor/nach Vergleichsmessung, Aktivmessung und Nachtmessung · Speicherplatzwerte vor/nach.

**Bewertung:**
- **100** — Alle Timer werden aufgeräumt und im Hintergrund pausiert, Heap-Wachstum ≤ 25 % zwischen dem 5. und 20. Durchlauf, kein Speichermangel-Neustart, Aktivverbrauch ≤ Vergleichswert, Hintergrundverbrauch ≤ 1 % in 8 Stunden, kein Wakelock über 60 Sekunden — **und** ein automatischer Rückfallschutz: ein Test in `src/test/` prüft für jeden `setInterval`-Aufruf in `src/hooks/`, dass der zugehörige `useEffect` ein `clearInterval` zurückgibt, und bricht bei einem neuen ungeräumten Timer ab.
- **70** — Alle Messwerte innerhalb der Schwellen, aber mindestens ein Timer läuft im Hintergrund weiter (z. B. die 60-Sekunden-Erinnerungsprüfung in `src/hooks/usePushNotifications.ts` Zeile 176) und ist als bewusst hingenommene Lücke schriftlich begründet; kein automatischer Rückfallschutz.
- **0** — **Spürbarer Akkuverbrauch**: Der Aktivverbrauch über 30 Minuten übersteigt den Vergleichswert aus Schritt 9, oder die App verbraucht in 8 Stunden Hintergrund mehr als 1 % Akku, oder das Betriebssystem weist sie in der Akkuübersicht als auffällige App aus.

---

## Gruppe G — Plattform & Geräte

### G1 — iOS: sichere Bereiche, Tastatur, Swipe-Back, Dynamic Island, Dark Mode

**Ebene:** 2 (Release-Karte, Teil des Geräte-Smokes)
**Zeitbedarf:** 4 Minuten von 15 — der plattformeigene Anteil des iOS-Durchgangs. G2 belegt denselben Platz im Android-Durchgang; jeder der beiden Durchgänge dauert 15 Minuten, zusammen 30 der 90 Minuten der Release-Karte.

**Gerät:** das vorhandene iPhone. Modellbezeichnung und iOS-Version im Protokoll festhalten. **Hat das Gerät keine Dynamic Island (also älter als iPhone 14 Pro), ist Schritt 4 auf dem Gerät nicht prüfbar** — dann ersatzweise im Simulator: `bun run build:ios`, danach `ios/App/App.xcodeproj` in Xcode öffnen und auf dem Simulator „iPhone 15 Pro" starten. Der Ersatz ist als Einschränkung zu notieren, weil der Simulator die Tastatur anders behandelt als das Gerät.

**Durchführung:**
1. **Sichere Bereiche, 45 Sekunden.** App starten und nacheinander `/home`, `/chat`, `/settings`, `/safety` öffnen. Je Bildschirm zwei Prüffragen: Steht die Überschrift der `PageHeader` vollständig unterhalb der Statusleiste (die Datei setzt `paddingTop: calc(env(safe-area-inset-top, 0px) + 8px)`, `src/components/layout/PageHeader.tsx` Zeile 36)? Liegt die untere Navigationsleiste vollständig oberhalb des Home-Indikators (`src/components/layout/BottomNav.tsx` Zeile 27 setzt `paddingBottom: env(safe-area-inset-bottom, 0px)` auf 56 px Inhaltshöhe, `BOTTOM_NAV_HEIGHT` in `src/lib/safeArea.ts`)? Beachten: `/settings` und `/safety` blenden die Navigationsleiste aus (`hideNavRoutes` in `src/components/layout/AppLayout.tsx`), dort gilt nur die erste Frage.
2. **Messwerte statt Augenmaß, wenn eine Frage aus Schritt 1 unklar ist.** Die Seite `/dev-qa` liest `safe-area-inset-top` und `-bottom` aus und meldet Viewport, Schriftskalierung und Trefferflächen unter 44 px (`src/pages/DevQA.tsx`). Sie ist im Auslieferungs-Build vorhanden, aber **nur über die Adresse erreichbar** (`src/App.tsx` Zeile 255, kein Menüeintrag) — in der nativen App gibt es keine Adresszeile. Weg dorthin: iPhone per Kabel an den Mac, Safari → Entwickler → *Gerätename* → Soulvay, in der Konsole `location.assign('/dev-qa')` ausführen. Erwartung: `safe-area-inset-top` > 0 px, `safe-area-inset-bottom` > 0 px, „Headers with safe-area padding" = 1.
3. **Tastatur, 60 Sekunden.** `/chat` öffnen, Eingabefeld antippen. Prüffragen: Bleibt das Eingabefeld vollständig über der Tastatur? Bleibt die zuletzt empfangene Nachricht sichtbar? Springt der Inhalt nach dem Schließen der Tastatur an dieselbe Stelle zurück? Dasselbe im Tagebuch-Editor (`src/components/journal/JournalEditor.tsx`) und im Notizfeld unter `/mood`. **Hintergrund, der ins Protokoll gehört:** `capacitor.config.ts` enthält einen Konfigurationsblock `Keyboard: { resize: "body", resizeOnFullScreen: true }`, aber `@capacitor/keyboard` ist **nicht installiert** — weder in `package.json` noch in `ios/App/CapApp-SPM/Package.swift`. Der Block ist wirkungslos; das Tastaturverhalten stammt ausschließlich aus `contentInset: "automatic"` und `scrollEnabled: true` des WKWebView. Jede Beobachtung hier ist deshalb Standardverhalten, keine Einstellung.
4. **Dynamic Island / Notch im Querformat, 45 Sekunden.** `/chat` öffnen, iPhone nach links und nach rechts drehen. Prüffrage: Wird der Inhalt von der Insel beziehungsweise vom Notch verdeckt, oder schiebt `paddingLeft/paddingRight: env(safe-area-inset-left/right, 0px)` aus `AppLayout.tsx` ihn frei? Die `Info.plist` erlaubt auf dem iPhone ausdrücklich `UIInterfaceOrientationLandscapeLeft` und `-Right`, obwohl beide Web-Manifeste `portrait` fordern — das Querformat ist auf iOS also erreichbar und muss halten.
5. **Dark Mode, 60 Sekunden.** Einstellungen → Darstellung → „System" wählen (`ThemeMode` in `src/hooks/useTheme.ts`). iOS-Kontrollzentrum → Dunkelmodus einschalten, ohne die App zu verlassen. Prüffragen: Wechselt die Oberfläche sofort? Kippen die Symbole der Statusleiste mit (`syncStatusBarWithTheme` in `src/lib/nativeStatusBar.ts`)? Danach die App vollständig beenden und im Dunkelmodus kalt starten: Erscheint zwischen Startbildschirm und erster Seite ein heller Blitz? **Der Startbildschirm ist auf `#1a1a1a` festgenagelt** (`capacitor.config.ts`, `SplashScreen.backgroundColor` und `StatusBar.backgroundColor`), der helle Hintergrund der App ist `#FAFAFA` (`nativeStatusBar.ts`) — der Übergang hell/dunkel ist damit in einer der beiden Richtungen sichtbar. Welche, ist zu notieren.

**Belegt durch:** Fünf Screenshots (`/home` hoch, `/chat` mit offener Tastatur, `/chat` quer, `/dev-qa` mit den Messwerten, Kaltstart im Dunkelmodus), dazu eine Zeile im Protokoll mit iPhone-Modell, iOS-Version und Buildnummer aus `ios/App/App/Info.plist` (`CFBundleVersion`, derzeit 64).

**Bewertung:**
- **100** — Alle fünf Schritte ohne Beanstandung auf einem iPhone mit Dynamic Island, **und** ein automatischer Rückfallschutz: ein Test, der bricht, sobald ein Layout-Container aus `src/lib/safeArea.ts` seinen `env(safe-area-inset-*)`-Anteil verliert oder `PageHeader`/`BottomNav` ihre Safe-Area-Polsterung einbüßen (der Block „Safe Area: Constants are valid" in `src/test/regression.test.ts`, Zeilen 108–123, prüft heute nur die Konstanten `BOTTOM_NAV_HEIGHT`, `BOTTOM_NAV_TOTAL`, `SAFE_AREA_BOTTOM` und `SAFE_AREA_TOP`, nicht ihre Verwendung in den Komponenten), plus ein Screenshot-Vergleich gegen ein hinterlegtes Referenzbild im iOS-Simulator.
- **70** — Alle fünf Schritte ohne Beanstandung, aber ohne automatischen Rückfallschutz; **oder** Schritt 4 nur im Simulator geprüft, weil kein iPhone mit Dynamic Island vorliegt, und diese Lücke ist schriftlich festgehalten.
- **0** — **Layoutbruch:** auf einem der geprüften Bildschirme liegt Text oder ein Bedienelement unter der Statusleiste, unter dem Home-Indikator, unter der Dynamic Island oder unter der geöffneten Tastatur und ist dadurch nicht lesbar oder nicht antippbar.

---

### G2 — Android: Zurück-Geste, Statusleiste, Akku-Optimierung, Berechtigungen

**Ebene:** 2 (Release-Karte, Teil des Geräte-Smokes)
**Zeitbedarf:** 4 Minuten von 15 — der plattformeigene Anteil des Android-Durchgangs.

**Gerät:** Samsung Galaxy A50, das einzige vorhandene Android-Testgerät. Es hat als letzte Version Android 11 (One UI 3.1) erhalten. `android/variables.gradle` setzt `targetSdkVersion = 36`, `minSdkVersion = 24`. **Damit ist auf diesem Gerät nicht prüfbar, was erst ab Android 13 gilt** — allen voran die Laufzeitabfrage für `POST_NOTIFICATIONS`. Diese Lücke ist bei jedem Durchgang erneut zu notieren; sie schließt sich nur mit einem zweiten Gerät ab Android 13 oder einem Emulator-Abbild (Android Studio → Device Manager → Pixel 6, API 34).

**Durchführung:**
1. **Zurück-Geste, 90 Sekunden.** Vorbedingung: In den Systemeinstellungen des A50 zunächst die Gestennavigation aktivieren. `grep -rn "backButton\|@capacitor/app" src/ package.json` liefert **keinen Treffer**; `@capacitor/app` ist auch in `android/capacitor.settings.gradle` nicht aufgeführt. Es gibt also keinen eigenen Zurück-Handler, das Verhalten stammt vollständig aus der Capacitor-Brücke. Drei Fälle nacheinander prüfen:
   - Von `/chat` nach hinten wischen → Erwartung: die App landet auf `/home`, sie schließt sich nicht.
   - Auf `/home` nach hinten wischen → Erwartung: die App geht in den Hintergrund. Danach wieder in den Vordergrund holen und prüfen, ob ein angefangener, nicht gesendeter Chattext noch im Eingabefeld steht.
   - Im Chat den Dialog „In Tagebuch speichern" öffnen (`src/components/chat/SaveToJournalDialog.tsx`) und nach hinten wischen → Erwartung: der Dialog schließt sich. Radix-Dialoge hören nicht auf die Hardware-Zurücktaste; schließt sich stattdessen die Seite oder die App, ist das der Befund.
2. **Statusleiste, 45 Sekunden.** In den App-Einstellungen zwischen hellem und dunklem Erscheinungsbild wechseln. `syncStatusBarWithTheme` setzt auf Android zusätzlich die Hintergrundfarbe (`#FAFAFA` hell, `#101413` dunkel, `src/lib/nativeStatusBar.ts`). Prüffragen: Sind die Symbole der Statusleiste in beiden Zuständen lesbar? Bleibt beim Kaltstart im hellen Erscheinungsbild eine dunkle Leiste stehen, weil `capacitor.config.ts` den Startzustand fest auf `style: "dark"` und `#1a1a1a` legt?
3. **Navigationsleiste, 30 Sekunden.** Auf dem A50 von der Gestennavigation auf die Drei-Tasten-Navigation umstellen und `/home` öffnen. Prüffrage: Bleiben alle fünf Einträge der unteren Navigationsleiste vollständig antippbar? **Risiko, das hier gemessen wird:** `BottomNav` verlässt sich auf `env(safe-area-inset-bottom)`; der Android-WebView meldet dafür in der Regel 0 px, unabhängig davon, ob eine Tastenleiste vorhanden ist. Die 56 px Inhaltshöhe müssen also ohne Safe-Area-Zuschlag ausreichen.
4. **Akku-Optimierung, 45 Sekunden Einrichtung, Auswertung nach dem Durchgang.** Einstellungen → Apps → Soulvay → Akku → „Uneingeschränkt" wählen. In der App unter Einstellungen → Benachrichtigungen die tägliche Erinnerung auf die kommende volle Minute plus drei stellen (`src/hooks/usePushNotifications.ts`, geplant über `src/lib/localReminders.ts`). Gerät sperren, weglegen, am Ende des Durchgangs nachsehen, ob die Benachrichtigung kam. Danach dieselbe Messung mit der Samsung-Voreinstellung „Optimiert" wiederholen — die Abweichung ist der eigentliche Befund. Eine ausbleibende Erinnerung ist hier kein G2-Blocker, sondern ein Befund für H2 und D5; sie ist mit Uhrzeit zu protokollieren.
5. **Berechtigungen im Manifest belegen, 30 Sekunden, einmal je Build.** `android/app/src/main/AndroidManifest.xml` deklariert genau zwei Berechtigungen: `INTERNET` und `RECORD_AUDIO`. `POST_NOTIFICATIONS` steht dort nicht — es kann nur über die Manifest-Zusammenführung aus dem Plugin `@capacitor/local-notifications` kommen. Nachweisen statt annehmen:
   Beide Befehle vom Projektstamm aus, hintereinander in derselben Sitzung — die Klammer im ersten hält das Arbeitsverzeichnis fest, sonst greift der zweite Befehl mit seinem Präfix `android/` ins Leere:
   `(cd android && ./gradlew :app:processDebugMainManifest)`
   `find android/app/build/intermediates -name AndroidManifest.xml -path "*merged*" -exec grep -l POST_NOTIFICATIONS {} \;`
   Bleibt die Suche leer, fordert die App auf Android 13 und neuer nie eine Benachrichtigungsberechtigung an und alle Erinnerungen bleiben dort dauerhaft aus.

**Belegt durch:** Vier Screenshots beziehungsweise Fotos (Drei-Tasten-Navigation mit unterer Leiste, Statusleiste hell und dunkel, eingegangene oder ausgebliebene Erinnerung mit Uhrzeit), Ausgabe der beiden Befehle aus Schritt 5, Protokollzeile mit `versionCode` aus `android/app/build.gradle` (derzeit 44) und Android-Version des A50.

**Bewertung:**
- **100** — Alle fünf Schritte ohne Beanstandung, `POST_NOTIFICATIONS` im zusammengeführten Manifest nachgewiesen, Verhalten zusätzlich auf einem Gerät ab Android 13 bestätigt, **und** ein automatischer Rückfallschutz: eine Prüfung im Tor, die das zusammengeführte Manifest auf die erwartete Berechtigungsliste festlegt und bricht, sobald eine Berechtigung hinzukommt oder wegfällt.
- **70** — Alle fünf Schritte auf dem Galaxy A50 ohne Beanstandung; das Verhalten ab Android 13 (Benachrichtigungsberechtigung, vorhersagende Zurück-Geste) bleibt ungeprüft und ist als dokumentierte Lücke festgehalten.
- **0** — **Layoutbruch:** ein Eintrag der unteren Navigationsleiste ist hinter der Systemnavigation nicht antippbar, Inhalt liegt unter der Statusleiste, oder die Zurück-Geste führt aus einem geöffneten Dialog heraus direkt zum Beenden der App und verwirft dabei eine ungesicherte Eingabe.

---

### G3 — PWA/Web: Installation, Offline, Service-Worker-Aktualisierung

**Ebene:** 2 (Release-Karte, Teil des Geräte-Smokes)
**Zeitbedarf:** 3 Minuten von 15, einmalig im Android-Durchgang — die Installation als Web-App wird auf dem Galaxy A50 in Chrome geprüft, nicht zweimal. Die Schritte 1, 4 und 5 laufen vorab am Rechner und kosten dort weitere 6 Minuten, die nicht zum Geräte-Smoke zählen.

**Durchführung:**
1. **Zwei Manifeste feststellen, am Rechner.** `bun run build`, dann `grep -c 'rel="manifest"' dist/index.html`. **Erwarteter Befund: 2.** `index.html` verlinkt fest `/manifest.json`, und `vite-plugin-pwa` fügt beim Bauen zusätzlich `/manifest.webmanifest` ein (`vite.config.ts`, Block `VitePWA.manifest`). Die beiden Dateien widersprechen sich: `background_color` `#eef4f7` gegen `#faf9f6`, `orientation` `portrait-primary` gegen `portrait`, das 192-px-Symbol `favicon.png` gegen `logo.png`. Welche Datei der Browser nimmt, entscheidet über Startbildschirmfarbe und Symbol. Beide Werte notieren.
2. **Installation auf dem Galaxy A50, 90 Sekunden.** Chrome öffnen, die Release-Adresse aufrufen, Menü → „App installieren". Danach vom Startbildschirm starten. Prüffragen: Fehlt die Adresszeile (Standalone)? Welche Farbe hat der Startbildschirm — passt sie zu einem der beiden Manifeste aus Schritt 1? Ist das Symbol das erwartete?
3. **Offline, 60 Sekunden.** Auf dem A50 den Flugmodus einschalten, die installierte Web-App starten und nacheinander `/home`, `/chat`, `/journal` und **`/safety`** öffnen. `/safety` muss ohne Netz vollständig laden, einschließlich der Telefonnummern — das ist zugleich Schritt 5 von B2. Der Offline-Banner aus `src/components/system/OfflineBanner.tsx` muss erscheinen. Ein weißer Bildschirm auf einer dieser vier Routen ist zusätzlich ein H1-Befund.
4. **Aktualisierung des Service Workers, am Rechner, 3 Minuten.** In `src/translations/settings.ts` einen sichtbaren Text um ein erkennbares Zeichen ergänzen, `bun run build`, `bunx vite preview --port 4173`. In Chrome `http://localhost:4173` als App installieren, dann die Änderung zurücknehmen, erneut bauen, erneut `vite preview`, und in der installierten App neu laden. **Zählen, nach dem wievielten Neuladen der geänderte Text erscheint.** Schwellenwert: **höchstens zwei Neuladevorgänge** (Begründung: `registerType: "autoUpdate"` in `vite.config.ts` erzeugt einen Service Worker mit `skipWaiting` und `clientsClaim`; er soll beim nächsten Seitenwechsel übernehmen — ein dritter nötiger Durchgang bedeutet, dass Nutzer nach jedem Release unbestimmt lange eine alte Oberfläche sehen). Parallel unter Entwicklertools → Anwendung → Service Workers beobachten, ob der neue Worker den Zustand „activated" erreicht oder in „waiting" hängen bleibt.
5. **Kein Aktualisierungshinweis, feststellen und notieren.** `grep -rn "registerSW\|needRefresh\|updateSW" src/` liefert keinen Treffer. Es gibt also keine Oberfläche, die auf eine neue Fassung hinweist; die Aktualisierung geschieht ausschließlich still. Das ist zulässig, muss aber als Zustand im Protokoll stehen, weil Schritt 4 sonst nicht einzuordnen ist.
6. **Nativer Gegenprobe-Schritt, 30 Sekunden.** In der iOS-App und in der Android-App prüfen, dass `/install` nicht erreichbar ist: `src/pages/Install.tsx` leitet im nativen Build sofort auf `/home` um (Apple-Richtlinie 2.3.10). Zusätzlich in `src/main.tsx` (Zeilen 69–76, Block `if (isCapacitorNative())`) belegt: unter Capacitor wird jeder vorhandene Service Worker über `getRegistrations().forEach(r => r.unregister())` aktiv abgemeldet. Auf dem Gerät bedeutet das: die native App kann keinen veralteten Web-Cache tragen; der Befund aus Schritt 4 betrifft ausschließlich die Web-Fassung.

**Belegt durch:** Ausgabe von `grep -c 'rel="manifest"' dist/index.html`, Screenshot des Startbildschirms der installierten Web-App, vier Screenshots aus dem Flugmodus, Zählprotokoll aus Schritt 4 mit der Anzahl der Neuladevorgänge, Screenshot des Service-Worker-Zustands.

**Bewertung:**
- **100** — Genau ein Manifest wird ausgeliefert, Installation und Startbildschirm entsprechen ihm, alle vier Routen laden offline, die neue Fassung übernimmt nach höchstens zwei Neuladevorgängen — **und** zwei automatische Prüfungen sichern das ab: eine im Tor, die bricht, sobald `dist/index.html` mehr als einen `rel="manifest"` trägt, und ein Playwright-Lauf, der die Übernahme des neuen Service Workers misst.
- **70** — Installation, Offline-Betrieb und Aktualisierung funktionieren, aber die beiden widersprüchlichen Manifeste bestehen fort und die Abweichung in `background_color`, `orientation` und Symbol ist als dokumentierte Lücke festgehalten.
- **0** — **Veralteter Cache bleibt:** nach einem Release zeigt die installierte Web-App auch nach dem dritten Neuladen noch die alte Fassung, oder der neue Service Worker verharrt dauerhaft im Zustand „waiting".

---

### G4 — Bildschirmgrößen: 320 px bis Tablet, Querformat, geteilter Bildschirm

**Ebene:** 2 (Release-Karte, Teil des Geräte-Smokes) — der maschinelle Teil läuft als Ebene 1 mit, sobald Schritt 1 gebaut ist.
**Zeitbedarf:** 4 Minuten von 15 je Durchgang. Davon 0 Minuten Menschenzeit für Schritt 1 (läuft im Hintergrund), 2 Minuten für Schritt 2, 2 Minuten für die Schritte 3 bis 5.

**Durchführung:**
1. **Der maschinelle Teil existiert heute nicht und muss zuerst gebaut werden.** Playwright ist vorhanden (`playwright.config.ts`, `e2e/master-validation.spec.ts`), enthält aber genau **einen** Viewport-Test — `/auth` bei 375 × 550 px. Es fehlt eine Datei `e2e/viewports.spec.ts`, die die Kreuzung aus fünf Breiten (320 × 568 als kleinste real ausgelieferte Größe, 375 × 667 iPhone SE, 412 × 892 Galaxy A50, 768 × 1024 Tablet hoch, 1280 × 800 Tablet quer) und den zehn Routen `/landing`, `/auth`, `/home`, `/chat`, `/journal`, `/mood`, `/toolbox`, `/settings`, `/safety`, `/upgrade` durchgeht. Je Kombination zwei Zusicherungen:
   - `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1` — die Seite scrollt nicht waagerecht.
   - für jedes Element mit der Klasse `scroll-container`: `el.scrollWidth <= el.clientWidth + 1`. **Diese zweite Zusicherung ist die wichtigere:** `src/index.css` Zeile 314 setzt auf `.scroll-container` ein `overflow-x: hidden`. Damit verschwindet überstehender Inhalt lautlos, statt einen Scrollbalken zu erzeugen — die erste Zusicherung allein würde abgeschnittenen Inhalt also nicht finden.
   Zusätzlich ist `playwright.config.ts` anzupassen: die `baseURL` zeigt derzeit auf eine Lovable-Vorschau, nicht auf den zu prüfenden Build. Lauf: `bunx playwright test e2e/viewports.spec.ts`.
2. **320 px von Hand, 2 Minuten, am Rechner.** Chrome → Entwicklertools → Geräteleiste → benutzerdefiniert 320 × 568. Nacheinander `/chat`, `/mood`, `/upgrade` und `/settings` öffnen. Prüffragen je Seite: Lässt sich die Seite waagerecht schieben? Steht ein Preis, ein Knopftext oder eine Überschrift über den Rand hinaus? Ist der Absendeknopf im Chat vollständig sichtbar (`src/components/chat/ChatInputBar.tsx`, Eingabefeld mit `pr-12` für das eingelegte Symbol)?
3. **Schriftskalierung auf dem Gerät, 45 Sekunden.** iPhone: Einstellungen → Bedienungshilfen → Anzeige & Textgröße → Größerer Text, Regler ans Ende (entspricht rund 235 % und deckt die von E3 geforderten 200 % mit ab). Galaxy A50: Einstellungen → Anzeige → Schriftgröße und -stil, Regler ans Ende, zusätzlich Bildschirmzoom auf die größte Stufe. Danach `/home` und `/settings` öffnen. Prüffrage: Bleibt jede Beschriftung lesbar und jeder Knopf antippbar, oder überlagern sich Elemente? `/dev-qa` weist unter „Font Scale" den gemessenen Faktor aus.
4. **Querformat, 45 Sekunden.** Beide Geräte in `/chat` und in einer laufenden Übung (`src/components/toolbox/ExercisePlayer.tsx`, ganzflächig) drehen. Erwartungswiderspruch, der zu prüfen ist: `ios/App/App/Info.plist` erlaubt auf dem iPhone Querformat, beide Web-Manifeste fordern `portrait`. Prüffrage: Bleibt im Querformat der Absendeknopf des Chats erreichbar, ohne dass die Nachrichtenliste auf null Höhe zusammenfällt?
5. **Geteilter Bildschirm, 30 Sekunden, nur Galaxy A50.** Übersicht der laufenden Apps öffnen, Soulvay im geteilten Bildschirm in die obere Hälfte legen, unten eine beliebige zweite App. `/chat` und `/home` prüfen. Der geteilte Bildschirm ist zulässig, weil `AndroidManifest.xml` kein `android:resizeableActivity="false"` setzt und `targetSdkVersion = 36` gilt — die App muss ihn also tragen. Auf dem iPhone entfällt dieser Schritt; geteilter Bildschirm gibt es dort nur auf dem iPad, das nicht als Testgerät vorliegt.

**Belegt durch:** Ausgabe von `bunx playwright test e2e/viewports.spec.ts` mit der Zahl der geprüften Kombinationen, vier Screenshots aus Schritt 2 bei 320 px, je zwei Screenshots aus Schritt 3 (iOS, Android) bei maximaler Schrift, zwei Querformat-Screenshots, ein Screenshot des geteilten Bildschirms.

**Bewertung:**
- **100** — Alle 50 Kombinationen aus Schritt 1 laufen grün, einschließlich der Prüfung auf `.scroll-container`, der Lauf hängt an einem Tor, das den Build bei einer Überschreitung bricht, und die Schritte 2 bis 5 sind ohne Beanstandung.
- **70** — Die Schritte 2 bis 5 sind von Hand ohne Beanstandung geprüft, der maschinelle Lauf aus Schritt 1 fehlt weiterhin oder läuft in keinem Tor; die Lücke ist festgehalten. **Das ist der Stand vom 28.07.2026** — es existiert genau ein Viewport-Test, für eine Route, bei einer Breite.
- **0** — **Inhalt abgeschnitten:** auf einer der geprüften Kombinationen ist Text, Preis oder Bedienelement nicht vollständig sichtbar oder nicht erreichbar — einschließlich der Fälle, die `overflow-x: hidden` verbirgt statt scrollbar zu machen.

---

### G5 — Berechtigungen: Ablehnung sauber behandelt, Weg in die Systemeinstellungen

**Ebene:** 2 (Release-Karte, Teil des Geräte-Smokes)
**Zeitbedarf:** 4 Minuten von 15 je Durchgang. Voraussetzung ist eine **frische Installation**, weil eine einmal erteilte Berechtigung auf iOS nicht erneut abgefragt wird; die App vor dem Durchgang löschen und neu aufspielen.

**Geprüfte Berechtigungen** — es sind genau drei: Mikrofon (`NSMicrophoneUsageDescription` in `ios/App/App/Info.plist`, `RECORD_AUDIO` in `android/app/src/main/AndroidManifest.xml`), Spracherkennung (`NSSpeechRecognitionUsageDescription`, nur iOS) und lokale Benachrichtigungen (`requestNativeNotificationPermission` in `src/lib/localReminders.ts`).

**Durchführung:**
1. **Mikrofon im Chat ablehnen, 60 Sekunden.** `/chat` öffnen, das Mikrofonsymbol antippen, beim Systemdialog **Ablehnen** wählen. `src/hooks/useSpeech.ts` Zeilen 136–143 setzt daraufhin `error = "not-allowed"`. Drei Prüffragen: Stürzt die App ab? Erscheint ein Hinweis, der erklärt, was zu tun ist? Bleibt der Chat per Tastatur uneingeschränkt bedienbar? Danach das Mikrofonsymbol ein zweites Mal antippen: Kommt derselbe Hinweis wieder, oder passiert sichtbar nichts (Sackgasse)?
2. **Mikrofon im Sprachmodus ablehnen, 45 Sekunden.** Den Sprachmodus starten (`src/components/chat/RealtimeVoicePanel.tsx`), Ablehnen wählen. Erwarteter Text laut Zeilen 386–388: „Mikrofonzugriff verweigert. Bitte aktiviere den Zugriff unter Einstellungen → Soulvay → Mikrofon." Zwei Prüffragen: Lässt sich das Panel wieder schließen, ohne die App zu beenden? **Und, nur im Android-Durchgang:** Stimmt der genannte Weg? Auf Android lautet er Einstellungen → Apps → Soulvay → Berechtigungen → Mikrofon. Der Text ist an zwei Stellen fest verdrahtet — `src/translations/chat.ts` Zeile 128 und wörtlich noch einmal in `RealtimeVoicePanel.tsx` — und beide Fassungen nennen ausschließlich den iOS-Weg. Ein Android-Nutzer bekommt damit eine Anleitung, die ins Leere führt.
3. **Benachrichtigungen ablehnen, 45 Sekunden.** Einstellungen → Benachrichtigungen, den Schalter umlegen, beim Systemdialog Ablehnen wählen. `src/components/settings/NotificationSettings.tsx` Zeile 123 deaktiviert daraufhin den Schalter dauerhaft (`disabled={isRequesting || permissionStatus === "denied"}`), Zeile 275 blendet den Sperrhinweis ein und Zeile 278 gibt `notificationSettings.blockedMessage` aus. Dieser Text lautet laut `src/translations/settings.ts` Zeile 174: „Benachrichtigungen wurden blockiert. Bitte aktiviere sie in deinen **Browser-Einstellungen**." Prüffrage: In der nativen App gibt es keine Browser-Einstellungen — führt der Text den Nutzer in die Irre, und gibt es außer diesem Text irgendeinen Weg zurück?
4. **Weg in die Systemeinstellungen suchen, 30 Sekunden.** Zwei Läufe vom Projektstamm aus, der zweite ist der entscheidende:
   `grep -rniE "openSettings|NativeSettings|openAppSettings|App-Einstellungen" src/`
   **Erwarteter Rohbefund am 28.07.2026: genau drei Treffer, alle in `src/components/gdpr/CookieConsent.tsx` (Zeilen 133, 136, 137).** Sie betreffen `handleOpenSettings` und `COOKIE_SETTINGS_EVENT`, also den hauseigenen Cookie-Dialog — nicht die Systemeinstellungen des Geräts. Wer nur den ersten Lauf ausführt und die Trefferzahl notiert, protokolliert das Gegenteil des tatsächlichen Zustands. Deshalb gegengeprüft:
   `grep -rniE "openSettings|NativeSettings|openAppSettings|App-Einstellungen" src/ | grep -viE "CookieConsent|COOKIE_SETTINGS"`
   **Erwarteter Befund: kein Treffer.** Es gibt in der gesamten App keinen Knopf, der die Systemeinstellungen öffnet; alle drei Ablehnungspfade enden bei einem Text, der einen Weg *beschreibt*. Das ist keine Nachlässigkeit im Aufruf, sondern fehlt eine Ebene tiefer: `package.json` führt weder `@capacitor/app` noch ein Settings-Plugin (etwa `capacitor-native-settings`) — die Fähigkeit ist gar nicht installiert. Ob das eine Sackgasse im Sinne des Blockers ist, entscheidet Schritt 5.
5. **Rückweg prüfen, 60 Sekunden.** Die Berechtigung in den Systemeinstellungen nachträglich erteilen und in die App zurückkehren. Zwei Fälle getrennt notieren, weil iOS die App bei einer Änderung der Mikrofonberechtigung beendet: (a) Nach dem erzwungenen Neustart — erkennt die App den neuen Zustand? (b) Bei den Benachrichtigungen, wo kein Neustart erzwungen wird — bleibt der Schalter deaktiviert, weil `permissionStatus` nur beim Einhängen der Komponente gelesen wird (`src/hooks/usePushNotifications.ts`, `checkNativeNotificationPermission` im `useEffect` ohne Rückkehr-Auslöser)? Ein Schalter, der nach erteilter Berechtigung deaktiviert bleibt und sich auch nach Verlassen und erneutem Öffnen der Einstellungsseite nicht löst, ist eine Sackgasse.
6. **Die übrigen Diktatflächen mitprüfen, 30 Sekunden.** Dieselbe abgelehnte Berechtigung wirkt auch im Tagebuch (`/journal`, Neueintrag mit Diktat) und im Notizfeld unter `/mood`. Beide kurz antippen: gleicher Hinweis, kein Absturz, Tastatureingabe weiterhin möglich.
7. **Absturz belegen statt vermuten.** Nach dem Durchgang die Absturzberichte prüfen: iOS über Xcode → Window → Devices and Simulators → View Device Logs, Android über `adb logcat -d | grep -i "FATAL EXCEPTION"`. Zusätzlich im Sentry-Projekt nach dem Prüfzeitraum filtern.

**Belegt durch:** Sechs Screenshots je Plattform (Ablehnung im Chat, Ablehnung im Sprachmodus, Benachrichtigungs-Sperrhinweis, Zustand nach nachträglicher Erteilung, Tagebuch, Stimmung), Ausgabe des `grep`-Laufs aus Schritt 4, Ausgabe von `adb logcat` beziehungsweise die leere Absturzliste aus Xcode, Protokollzeile mit Buildnummer.

**Bewertung:**
- **100** — Jede der drei Berechtigungen ist ablehnbar, ohne dass eine Fläche unbedienbar wird; jeder Ablehnungshinweis trägt einen Knopf, der die Systemeinstellungen der jeweiligen Plattform direkt öffnet; die App erkennt eine nachträglich erteilte Berechtigung ohne Neustart — **und** ein Test bricht den Build, sobald ein Ablehnungspfad seinen Hinweis oder seinen Knopf verliert.
- **70** — Keine Fläche wird unbedienbar und kein Absturz tritt auf, aber die Hinweistexte beschreiben den Weg nur, statt ihn zu öffnen, und die Wegbeschreibung ist plattformgleich formuliert; beides ist als dokumentierte Lücke festgehalten. **Höher als 70 ist dieser Punkt am 28.07.2026 nicht erreichbar**, weil der gegengeprüfte Lauf aus Schritt 4 keinen Treffer liefert — die drei Rohtreffer stammen sämtlich aus dem Cookie-Dialog — und `package.json` kein Plugin führt, mit dem sich die Systemeinstellungen überhaupt öffnen ließen.
- **0** — **Absturz oder Sackgasse:** die App beendet sich nach einer Ablehnung, oder eine Fläche bleibt nach der Ablehnung ohne Ausweg — kein Hinweis, kein zweiter Versuch, und auch nach nachträglicher Erteilung in den Systemeinstellungen kein nutzbarer Zustand. Die auf Android falsche Wegbeschreibung („Einstellungen → Soulvay → Mikrofon", einen Pfad, den es dort nicht gibt) zählt als Sackgasse, sobald sie der einzige angebotene Ausweg ist.
