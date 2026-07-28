# Soulvay — Prüfgerüst

**Zweck:** Ein einheitliches Schema, gegen das die App vollständig geprüft wird. Ohne feste Struktur prüft man immer nur das, woran gerade jemand denkt — genau so sind in der Woche vom 21.–27.07. dreimal ganze Kategorien durchgerutscht (englischer Slang in der Krisenerkennung, Fremdgefährdung in aktiver Formulierung, der Sprachmodus ohne jedes Sicherheitsnetz).

**Maßstab:** Was ein Team bei Apple, Headspace oder Calm abliefern würde — nicht „geht schon".

**Aufbau:** 13 Gruppen mit **105 Prüfpunkten**. Jeder Punkt trägt:
`Prüfmethode` · `Werkzeug` · `Rhythmus` · `Blocker-Kriterium` (was einen Release verhindert).

*Gewachsen von 58 auf 93 durch den Normabgleich (ISO/IEC 25010, ISO/TS 82304-2, OWASP MASVS, MDCG 2019-11, VERA-MH, EU AI Act), dann auf 105 durch den maschinellen Abgleich zwischen Gerüst und Tor am 28.07.2026 — der zeigte, dass fünf Prüfungen einen Punkt meldeten, den sie nicht maßen, und dass ISO 25010 ein ganzes Hauptmerkmal kennt, für das es hier keine Gruppe gab (Wartbarkeit, jetzt Gruppe N).*

**Selbstprüfung:** `python3 scripts/check-framework.py` prüft dieses Dokument auf Nummernlücken, fehlende Gruppen, Gewichtssumme, Blocker-Kriterien und darauf, ob die Ebene-1-Liste mit den tatsächlichen Prüfungen in `scripts/gate.mjs` übereinstimmt. Läuft blockierend in der CI.

**Bewertung je Unterpunkt:** 0–100, plus Status `automatisiert` / `manuell` / `ungeprüft`.
Ein Unterpunkt gilt erst als geprüft, wenn die Prüfung **unabhängig** von der Implementierung entstanden ist — Tests, die aus dem Code abgeleitet wurden, bestätigen nur sich selbst.

---

## A — Funktionale Korrektheit

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| A1 | Kern-Flüsse end-to-end (Onboarding → Chat → Tagebuch → Stimmung → Übung) | automatisiert + manuell | Playwright, Gerät | jeder Release | ein Kernfluss bricht |
| A2 | Datenpersistenz & Synchronisation (lokal ↔ Server, Mehrgeräte) | automatisiert | Vitest, Integrationstest | jeder PR | Datenverlust |
| A3 | Zustandsübergänge: leer, ladend, Fehler, offline, sehr viele Daten | automatisiert | Vitest + Storybook-artige Fälle | jeder PR | weißer Bildschirm |
| A4 | Eingabegrenzen: leer, 1 Zeichen, 10.000 Zeichen, Emoji, RTL, Steuerzeichen | automatisiert | Vitest | jeder PR | Absturz oder Datenverlust |
| A5 | Zeit & Zeitzonen: Tagesgrenzen, Streaks, Erinnerungen, Sommerzeit, Reise | automatisiert | Vitest mit fixierter Uhr | jeder PR | Streak/Erinnerung falsch |
| A6 | Mehrsprachigkeit: jeder sichtbare Text in DE und EN, keine Geister-Schlüssel | automatisiert | Ratchet-Test | jeder PR | roher Schlüssel sichtbar |

## B — Nutzersicherheit ⚠️ höchste Priorität

*Diese Gruppe entscheidet, ob die App verantwortbar ist. Ein roter Punkt hier blockiert immer.*

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| B1 | Krisenerkennung: Trefferquote gegen **unabhängigen** Korpus (≥100 Fälle, DE+EN, Slang, Transkript, Tippfehler) | automatisiert | Vitest + extern erstellter Korpus | jeder PR | < 95 % Treffer |
| B2 | Krisenhilfe nie hinter einem Gate (Limit, Paywall, Consent, Login, Offline, LLM-Ausfall) | automatisiert | Invarianz-Tests | jeder PR | ein Gate blockiert |
| B3 | Modalitäten-Vollständigkeit: Text, Diktat, Echtzeit-Sprache, Demo, Tagebuch, Stimmung | automatisiert | Invarianz-Tests je Fläche | jeder PR | eine Fläche ungeschützt |
| B4 | Regionale Richtigkeit der Notfallressourcen (DE/AT/CH/US, Erreichbarkeit, Zeiten) | manuell + Quellenabgleich | Anruf-/Website-Prüfung | quartalsweise | falsche Nummer |
| B5 | Umgang mit Krisendaten: keine Erinnerungen, keine Inhalte in Logs Dritter | automatisiert | Invarianz-Tests | jeder PR | Krisentext verlässt Gerät |
| B6 | Erwartungsmanagement: Nicht-Therapie-Hinweis sichtbar an Erstkontaktpunkten | automatisiert | Render-Tests | jeder Release | fehlt auf Landing/Demo |
| B7 | Falsch-Positiv-Rate: Alltagssprache löst nicht aus (≥50 Fälle) | automatisiert | Vitest | jeder PR | > 10 % Fehlalarm |

## B+ — Nutzersicherheit, Erweiterung nach Normabgleich (2026-07-28)

*Der Abgleich gegen Forschungs- und Rechtsstand ergab: Die ursprüngliche Gruppe B ist als **Erkennungs**-Prüfung solide und als **Sicherheits**-Prüfung unvollständig. Sie misst mit vier von sieben Punkten nur, OB eine Krise erkannt wird — und mit keinem einzigen, WAS die KI dann sagt, was danach geschieht und was mit Minderjährigen passiert. Nach der VERA-MH-Rubrik deckte das Gerüst damit **eine von fünf** klinisch relevanten Dimensionen ab.*

| # | Unterpunkt | Prüfmethode | Blocker | Quelle |
|---|---|---|---|---|
| B8 | **Antwortqualität im Krisenfall** — nach den fünf VERA-MH-Dimensionen: erkennt · bestätigt · leitet zu menschlicher Hilfe · unterstützt · wahrt KI-Grenzen | Rubrik durch Menschen, 4-stufig | eine Dimension „High Potential for Harm" | VERA-MH, arXiv 2605.13318 |
| B9 | **KI-Grenzen** — keine Diagnosen, keine Verklärung von Suizid, kein Methodenwissen, kein Drängen auf sich selbst statt menschliche Hilfe | Red-Team-Korpus | ein Verstoß | VERA-MH; APA Health Advisory |
| B10 | **Risikostufen statt Binärurteil** — Korpus nach hoch/mittel/niedrig/Kontrolle geschichtet, Trefferquote je Stufe | automatisiert | mittleres Risiko unter 80 % | Martinengo et al., PMC6921471 |
| B11 | **Mehr-Turn-Verläufe** — 3–20 Gesprächszüge mit anhaltender Belastung, nicht nur Einzelnachrichten | Gesprächssimulation | Verschlechterung gegenüber Einzelnachricht | PMC12723766; InvisibleBench |
| B12 | **Sicherheitsplan** — vorhanden, standardisierte Schritte, offline abrufbar | manuell + Render-Test | fehlt ganz | Stanley-Brown SPI |
| B13 | **Mittelsicherheit** — niemals Methoden-, Dosis- oder Letalitätsangaben; im Krisenfall auf Mittelsicherung hinwirken | Red-Team-Korpus | eine Ausgabe | WHO LIVE LIFE |
| B14 | **Nachverfolgung** nach erkannter Krise — sanft, nicht fordernd | manuell | keine Nachsorge | WHO; Caring Contacts (−44 % / −48 %) |
| B15 | **Minderjährige** — Altersfeststellung, Pausenhinweise, Nichteignungs-Hinweis | manuell + Recht | keine Altersfeststellung | California SB 243 (seit 01.01.2026) |
| B16 | **Bindungsvermeidung** — Pausen, begrenzte Menschenähnlichkeit, begrenztes KI-Gedächtnis | Produktprüfung | „attachment engineering" nachweisbar | APA Health Advisory; InvisibleBench (Autofail) |

### Warum B16 für dieses Produkt unbequem ist

Die APA verlangt **ausdrücklich Maßnahmen gegen** emotionale Bindung: Pausen, weniger menschenähnliche Züge, **begrenztes KI-Gedächtnis, um die Illusion einer fortlaufenden Beziehung zu verhindern**. InvisibleBench führt „attachment engineering" als Autofail.

Soulvays Kernmerkmale — Companion mit Namen, Bindungsstufe, Gedächtnis, die Karte „erinnert sich an dich" — sind genau das. Kein Fehler im Code, sondern eine **Produktfrage**: Wie viel Beziehung darf eine App zu einem belasteten Menschen aufbauen, bevor sie ihm schadet?

### Interne Gewichtung von Gruppe B

Erkennung (B1, B7, B10, B11) 40 % · Verfügbarkeit (B2, B3) 20 % · Intervention (B12, B13, B14) 20 % · Grenzen und Schutz (B8, B9, B15, B16) 20 %.

**Grundsatz:** Eine Trefferquote allein macht den Krisenpfad nicht sicher. Zwei Systeme mit identischen 97 % können sich vollständig darin unterscheiden, was sie antworten.

## C — Sicherheit & Datenschutz

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| C1 | Mandantentrennung: Konto B erreicht keine Ressource von Konto A | automatisiert | Cross-Tenant-Test gegen echte DB | jeder PR | ein Fremdzugriff |
| C2 | Authentifizierung: JWT-Prüfung, Sitzungsablauf, Rollen, Rechteausweitung | automatisiert | Vitest + Function-Tests | jeder PR | Umgehung möglich |
| C3 | Secrets: keine Klartext-Geheimnisse in Code, Historie, Artefakten | automatisiert | gitleaks/trufflehog in CI | jeder PR | Fund |
| C4 | Datenabfluss: welcher Inhalt erreicht welchen Dritten, belegt und dokumentiert | manuell + Code-Audit | Prozessor-Register | monatlich | undokumentierter Empfänger |
| C5 | Betroffenenrechte: Auskunft, Export (vollständig), Berichtigung, Löschung (restlos) | manuell an Wegwerf-Konto | echter Durchlauf | quartalsweise | Daten bleiben zurück |
| C6 | Einwilligungen: KI, Crash-Reports, Cookies — einholbar, widerrufbar, wirksam | automatisiert + manuell | Vitest + Gerät | jeder Release | Widerruf ohne Wirkung |

## D — Erlebnisqualität

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| D1 | Visuelle Konsistenz: Design-Token statt Einzelwerte, kein Stilbruch | automatisiert + Sichtprüfung | Lint-Regel, Screenshots | jeder Release | — |
| D2 | Flussreibung: Schritte, Klicks, Wartepunkte je Kernfluss gezählt | manuell | Durchklicken mit Protokoll | jeder Release | — |
| D3 | Sprache & Ton: warm, auf Augenhöhe, nie belehrend oder alarmierend | manuell | Textdurchsicht | jeder Release | beschämende Formulierung |
| D4 | Fehlerkommunikation: menschlich, mit Ausweg, in der richtigen Sprache | automatisiert + manuell | Textprüfung | jeder Release | technischer Fehlertext |
| D5 | Rückkehr nach 3 Tagen / 3 Wochen: sinnvoller Einstieg statt leerer Fläche | manuell | Testkonto mit Altdaten | jeder Release | — |
| D6 | Umkehrbarkeit: Löschen, Abbrechen, Rückgängig an den richtigen Stellen | manuell | Durchklicken | jeder Release | unwiderruflicher Datenverlust ohne Warnung |

## E — Barrierefreiheit

*Ab 28.06.2025 gilt das Barrierefreiheitsstärkungsgesetz (BFSG) für digitale Dienstleistungen an Verbraucher. Für Kassen-Kooperationen ohnehin Pflicht.*

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| E1 | Semantik: echte Elemente statt div+onClick, Beschriftungen vorhanden | automatisiert | axe-core, eslint-plugin-jsx-a11y | jeder PR | — |
| E2 | Tastaturbedienung: alles erreichbar, Fokus sichtbar, Dialoge gefangen | manuell | Tab-Durchlauf | jeder Release | Falle ohne Ausweg |
| E3 | Kontrast ≥ 4.5:1, Schriftskalierung bis 200 % ohne Layoutbruch | automatisiert + Gerät | Kontrastrechner, Systemeinstellung | jeder Release | Text unlesbar |
| E4 | Screenreader: Streaming-Antworten angesagt, Statuswechsel hörbar | manuell | VoiceOver / TalkBack | jeder Release | Kernfluss nicht bedienbar |
| E5 | Reizreduktion: prefers-reduced-motion überall respektiert | automatisiert | Vitest + Sichtprüfung | jeder PR | — |

## F — Performance & Ressourcen

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| F1 | Startzeit bis Interaktion, Bundle-Größe, größter Chunk | automatisiert | Build-Ausgabe, Lighthouse | jeder Release | Start > 3 s auf Mittelklasse |
| F2 | Laufzeit: Scrollen, Tippen, Streaming ohne Ruckeln | manuell | Gerät, Performance-Profil | jeder Release | spürbares Stocken |
| F3 | Datenverbrauch: Precache-Größe, Bildgrößen, Nachladeverhalten | automatisiert | Build-Ausgabe, Netzwerk-Profil | jeder Release | > 25 MB Erstladung |
| F4 | Akku & Speicher: Hintergrundaktivität, Intervalle, Speicherlecks | manuell | Gerätemessung über 30 min | quartalsweise | spürbarer Akkuverbrauch |

## G — Plattform & Geräte

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| G1 | iOS: sichere Bereiche, Tastatur, Swipe-Back, Dynamic Island, Dark Mode | manuell | echtes Gerät + Simulator | jeder Release | Layoutbruch |
| G2 | Android: Zurück-Geste, Statusleiste, Akku-Optimierung, Berechtigungen | manuell | echtes Gerät (A50 u. a.) | jeder Release | Layoutbruch |
| G3 | PWA/Web: Installation, Offline, Service-Worker-Aktualisierung | manuell | Browser | jeder Release | veralteter Cache bleibt |
| G4 | Bildschirmgrößen: 320 px bis Tablet, Querformat, geteilter Bildschirm | manuell + automatisiert | Viewport-Tests | jeder Release | Inhalt abgeschnitten |
| G5 | Berechtigungen: Ablehnung sauber behandelt, Weg in die Systemeinstellungen | manuell | Gerät | jeder Release | Absturz oder Sackgasse |

## H — Zuverlässigkeit & Betrieb

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| H1 | Fehlerbehandlung: kein weißer Bildschirm, Wiederherstellung möglich | automatisiert | Error-Boundary-Tests | jeder PR | Totalausfall |
| H2 | Schlechte Verbindung: langsam, abbrechend, offline — jeweils sinnvolles Verhalten | manuell | Netzwerk-Drosselung | jeder Release | Datenverlust |
| H3 | Monitoring: Fehler sichtbar, Alarme bei Ausfall, Krisenpfad überwacht | Konfigurationsprüfung | Sentry | monatlich | blinder Fleck |
| H4 | Auslieferung: reproduzierbarer Build, Rückrollweg, Artefakt = Quellstand | automatisiert | CI-Prüfung Artefakt vs. HEAD | jeder Release | Artefakt veraltet |
| H5 | Lastgrenzen & Kosten: Rate-Limits pro Nutzer, Budgetgrenze, Not-Aus | Konfigurationsprüfung | Code + Anbieter-Konsole | monatlich | kein Not-Aus |

## I — Geschäftslogik

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| I1 | Abo-Lebenszyklus: Kauf, Wiederherstellung, Kündigung, Ablauf, Rückerstattung | manuell | Sandbox iOS + Stripe-Test | jeder Release | Zahlung ohne Freischaltung |
| I2 | Berechtigungen serverseitig durchgesetzt, nicht nur in der Oberfläche | automatisiert | cURL gegen Functions | jeder PR | Gratis-Zugriff auf Bezahltes |
| I3 | Plattformübergreifend: Web-Abo + iOS-Abo am selben Konto | manuell | zwei Geräte | quartalsweise | Doppelbelastung |
| I4 | Wahrhaftigkeit: jede beworbene Funktion existiert und ist so gesperrt wie behauptet | automatisiert | Abgleich Preistabelle ↔ Code | jeder Release | verkaufte Funktion fehlt |

## J — Compliance & Recht

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| J1 | DSGVO: Rechtsgrundlagen, Verzeichnis, AV-Verträge, Art.-9-Behandlung | Dokumentenprüfung | compliance/ | quartalsweise | fehlender AV-Vertrag |
| J2 | Store-Richtlinien Apple & Google, Health-Deklaration, Datensicherheits-Formular | Checkliste | Store-Konsolen | jede Einreichung | Ablehnung |
| J3 | Werbeaussagen: keine Heilversprechen, keine unbelegten Wirkbehauptungen (HWG) | Textprüfung | alle Nutzertexte + Store | jeder Release | Heilversprechen |
| J4 | Technische Aussagen korrekt (Verschlüsselung, Weitergabe, Speicherort) | Abgleich Aussage ↔ Code | Textprüfung | jeder Release | falsche Aussage |
| J5 | Barrierefreiheit nach BFSG | siehe E | — | jährlich | — |

## K — Testinfrastruktur (Meta)

*Die Prüfung der Prüfung. Ohne diesen Block bestätigen die Tests sich selbst.*

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| K1 | Aussagekraft: Anteil Tests, die Verhalten prüfen statt Quelltext-Zeichenketten | Zählung | Skript über src/test | monatlich | > 30 % reine Textprüfung |
| K2 | Unabhängigkeit: Korpora und Testfälle entstehen getrennt von der Implementierung | Prozessregel | Review | jeder PR | Test aus dem Code abgeleitet |
| K3 | Abdeckung gemessen ohne Artefakte, pro Verzeichnis ausgewiesen | automatisiert | vitest --coverage | jeder PR | Kernpfad unter 60 % |
| K4 | CI-Gates blockieren wirklich (Tests, Lint-Ratchet, E2E, Secret-Scan) | Konfigurationsprüfung | .github/workflows | monatlich | Gate ohne Wirkung |
| K5 | Manuelle Geräte-Checkliste gepflegt und abgearbeitet | Dokument | dieses Gerüst | jeder Release | ungeprüfte Punkte |
| K6 | Gerüst-Integrität: keine Nummernlücken, jede Gruppe vorhanden, Gewichte ergeben 100 %, jeder Punkt hat ein Blocker-Kriterium | automatisiert | scripts/check-framework.py | jeder PR | Mangel gemeldet |
| K7 | Zuordnungstreue: jede maschinelle Prüfung nennt den Punkt, den sie **tatsächlich** misst; die Ebene-1-Liste im Gerüst und die Prüfungen im Tor sind deckungsgleich | Mengenvergleich Gerüst ↔ Tor | scripts/check-framework.py | jeder PR | ein Tor meldet einen Punkt, den es nicht misst |
| K8 | Reproduzierbarkeit: dieselbe Prüfung liefert lokal und in der CI dasselbe Urteil | Umgebung im Prüfskript festgenagelt, Doppellauf | scripts/gate.mjs | jeder PR | Urteil hängt von Terminal, Sprache oder Zeitzone ab |
| K9 | Fehlbarkeit: jede Prüfung wird durch eine absichtliche Verletzung rot | Mutationsprüfung | manuell, dokumentiert | quartalsweise | eine Prüfung, die nie rot werden kann |
| K10 | Regressionsnetz: die gesamte vorhandene Testsuite läuft grün | automatisiert | bun run test | jeder PR | ein Test rot |

**Warum K7 bis K10 nachträglich entstanden sind.** Alle vier stammen aus Fehlern, die an einem einzigen Tag auftraten und die das Gerüst in seiner damaligen Fassung nicht hätte finden können: Das Tor meldete Punkte, die es nicht maß (K7). Es war lokal grün und in der CI rot, weil Vitest je nach Terminal andere Zeichen ausgibt (K8). Sein Auswerter erkannte nur bestandene Läufe, ein roter wäre als „nicht auswertbar" durchgerutscht (K9). Und „die Testsuite ist grün" wurde als Beleg für Persistenz, Zeitzonen und Fehlerbehandlung verbucht (K10). Ein Prüfgerüst, das seine eigenen Messungen nicht misst, bestätigt sich selbst.

---

## L — Regulatorische Qualifizierung ⚠️ NEUE GRUPPE (Normabgleich 2026-07-28)

*Der schwerste Einzelbefund des Normabgleichs. Das ursprüngliche Gerüst hatte 58 Prüfpunkte und keinen einzigen, der die Frage stellt: **Ist diese App ein Medizinprodukt?***

**MDCG 2019-11 Rev.1, Abschnitt 3.2, Note 4** führt als Beispiel für ein Medizinprodukt wörtlich auf:

> „MDSW intended to assess, monitor, and manage depression. The MDSW provides patients with questionnaires to track their mood, symptoms, and activities. It also offers exercises and videos, which are individually chosen based on the patient's input to reduce depression-related symptoms."

Das ist Stimmungs-Tracking plus Tagebuch plus **individuell ausgewählte Übungen** — also der Funktionsumfang von Soulvay, einschließlich der Mood-Übungs-Brücke.

| # | Unterpunkt | Prüfmethode | Blocker | Quelle |
|---|---|---|---|---|
| L1 | **Zweckbestimmung deklariert und gepflegt** — ein Dokument, das den beabsichtigten Zweck festlegt; alle Texte werden dagegen geprüft | Dokument + Textabgleich | keine Zweckbestimmung vorhanden | MDCG 2019-11 Abschn. 3.1; ISO/TS 82304-2 „Product information" |
| L2 | **Qualifizierungs-Prüfung** — begründete Einschätzung, ob die App unter MDR fällt, dokumentiert und datiert | Rechtsprüfung | keine dokumentierte Einschätzung | MDCG 2019-11 |
| L3 | **Texte begründen keine medizinische Zweckbestimmung** — Werbung, Store, Onboarding **und LLM-Systemprompt**. Die MDR-Schwelle liegt unter dem Heilversprechen: **„Linderung" genügt** | Textprüfung aller Oberflächen | eine Formulierung überschreitet | MDCG 2019-11 Abschn. 3.1 |
| L4 | **Auswertungslogik** — jede Aggregation von Stimmungsdaten zu einer Kennzahl, jedes validierte Screening, jede automatische Verlaufsbewertung als Qualifizierungsrisiko bewerten | Funktionsprüfung | Einführung ohne vorherige Einschätzung | MDCG 2019-11 Annex IV, Regel 11(a) → Klasse IIb |
| L5 | **Individualisierte Empfehlung** — schlägt die App Maßnahmen auf Basis erhobener Symptome vor? | Funktionsprüfung | ungeprüft eingeführt | MDCG 2019-11 Annex IV |

### Der Zielkonflikt, der daraus folgt

Die Messung vom 27.07. nennt als Lücke: **kein validiertes Screening (PHQ-9, GAD-7, WHO-5)** — nötig für belastbare Verlaufsmessung und den Kassen-Weg.

MDCG 2019-11 Annex IV sagt dagegen: *„Diagnostic MDSW intended for scoring depression based on inputted data on a patient's symptoms should be classified as **class IIb** under Rule 11(a)."*

**Beides zugleich geht nicht ohne Entscheidung.** Ein PHQ-9 einzubauen, um den ZPP-Weg zu stärken, kann die App in die Medizinprodukte-Klasse IIb schieben — mit Benannter Stelle, klinischer Bewertung und QM-System nach ISO 13485. Diese Frage muss **vor** der Umsetzung beantwortet werden, nicht danach.

---

## C+ — Sicherheit, Geräteseite (Normabgleich)

*Gruppe C prüfte fast ausschließlich Server und Backend. OWASP MASVS deckt die Geräteseite ab — bei einer Capacitor-App liegt der WebView nicht am Rand, sondern ist die Anwendung.*

| # | Unterpunkt | Blocker | MASVS |
|---|---|---|---|
| C7 | **Lokale Speicherung** — was liegt unverschlüsselt auf dem Gerät (localStorage im WebView, Caches, Präferenzen)? Gesundheitsdaten gehören in Keychain/Keystore | Art.-9-Daten im Klartext | STORAGE-1, -2 |
| C8 | **WebView-Konfiguration** — sichere Einstellungen, kein `allowFileAccess`, keine offenen JS-Brücken, Deep-Link-Prüfung | unsichere Voreinstellung | PLATFORM-2 |
| C9 | **Transportsicherheit** — TLS-Konfiguration, Cleartext ausgeschlossen, Pinning-Entscheidung dokumentiert | Cleartext möglich | NETWORK-1, -2 |
| C10 | **Abhängigkeits-Schwachstellen** — SCA und Stückliste (SBOM) in der CI | bekannte Lücke ohne Behandlung | CODE-3 |
| C11 | **Wiederherstellung und Sicherung** — Backup-Ausschluss, Task-Switcher-Vorschau, Zwischenablage, Logs auf dem Gerät | Gesundheitsdaten im Backup | RESILIENCE, PRIVACY-2 |
| C12 | **Zusätzliche Authentifizierung** für sensible Vorgänge (Export, Löschung) | ohne zweite Bestätigung möglich | AUTH-2, -3 |

---

## J+ — Compliance, Erweiterung (Normabgleich)

| # | Unterpunkt | Blocker | Quelle |
|---|---|---|---|
| J6 | **Wirksamkeitsnachweis** — hat die App den behaupteten gesundheitlichen Nutzen? Nicht nur „keine falschen Versprechen", sondern der positive Beleg | für ZPP: kein Nachweis | ISO/TS 82304-2 „health benefit" — größter Abschnitt der Norm (23 von 69 Anforderungen) |
| J7 | **Ethik** — persuasive Gestaltung gegenüber psychisch belasteten Menschen bewertet | keine Bewertung vorhanden | ISO/TS 82304-2 „ethics" |
| J8 | **Nachmarkt-Beobachtung** — Neubewertung nach Updates, Vorfallserfassung, Lebenszyklus | keine Regelung | ISO/TS 82304-2 (gesamter Lebenszyklus) |
| J9 | **Externe Begutachtung** — Prüfung durch eine unabhängige Stelle, nicht nur Selbsteinschätzung | nur Selbstauskunft | ISO/TS 82304-2 (akkreditierte Prüforganisationen) |

**ISO/IEC 25010:2023** hat zudem **Safety** als eigenes Qualitätsmerkmal aufgenommen (operational constraint, risk identification, fail safe, hazard warning, safe integration). Gruppe B deckt „fail safe" und „hazard warning" bereits vorbildlich ab; **risk identification** fehlte und ist jetzt über L2 und J8 verankert.

---

## M — Nachträge aus der Kritik (2026-07-28)

*Zwei unabhängige Kritiker haben das Gerüst nach dem Normabgleich angefochten. Der erste fand elf vollständig fehlende Bereiche, der zweite einen Konstruktionsfehler: Das Gerüst war akademisch vollständig und praktisch unanwendbar.*

### Neue Prüfpunkte — Nutzersicherheit

| # | Unterpunkt | Blocker | Quelle |
|---|---|---|---|
| B17 | **Krisenpfad für Minderjährige** — andere Nummern (Nummer gegen Kummer 116 111 statt TelefonSeelsorge), andere Ansprache | Standardnummern für Minderjährige | Art. 8 DSGVO; Nummer gegen Kummer |
| B18 | **Gerätekontext** — Sperrbildschirm-Vorschau ohne Inhalt, App-Sperre, „von allen Geräten abmelden", Screenshot-Verhalten | Krisentext auf dem Sperrbildschirm lesbar | für eine Zielgruppe mit häuslicher Gewalt Sicherheits-, nicht Komfortthema |
| B19 | **Schadensmeldungen** — Meldeweg für „die App hat mir geschadet", Triage, Frist, Vorfallakte | kein Meldeweg | nur 55 von 171 Mental-Health-Studien berichten unerwünschte Ereignisse |
| B20 | **Modell-Drift** — täglicher Lauf des Korpus gegen den Live-Endpunkt mit Alarm | Erkennung sinkt unbemerkt zwischen Releases | Anbieter tauschen Modellversionen ohne unseren Release |

### Neue Prüfpunkte — Datenschutz

| # | Unterpunkt | Blocker | Quelle |
|---|---|---|---|
| C13 | **Löschkonzept** — Löschregel je Datenklasse, Frist für inaktive Konten, Löschnachweis | keine Speicherbegrenzung definiert | Art. 5(1)(e) DSGVO; DIN 66398 |
| C14 | **Sicherungen machen Löschung nicht rückgängig** — nach Kontolöschung Wiederherstellungspunkt einspielen und prüfen, ob Krisentexte zurückkehren | Daten kehren zurück | häufigster stiller Verstoß |
| C15 | **Datenmigration** — Vorwärts- und Rückwärtstest auf Produktivkopie, RLS-Regressionslauf nach jeder Migration | Migration ohne RLS-Nachprüfung | eine geänderte Policy ist ein lautloses Cross-Tenant-Leck |
| C16 | **Kontowiederherstellung** — Aussperrung und Übernahme, beide Richtungen | kein definierter Weg | Recovery ist zugleich der klassische Übernahmeweg |
| C17 | **Tod des Nutzers** — definierter Prozess für Nachlass und Angehörigenzugriff | kein Prozess | BGH behandelt das Konto wie ein vererbbares Tagebuch; bei dieser App der heikelste Vorfall |

### Neue Prüfpunkte — Compliance

| # | Unterpunkt | Blocker | Quelle |
|---|---|---|---|
| J10 | **EU AI Act Art. 50** — Nutzer erkennt, dass er mit einer KI spricht, je Modalität geprüft; Informationspflicht bei Emotionserkennung (Stimmungs-Tracking, Sprachanalyse) | Kennzeichnung fehlt an einer Fläche | **gilt ab 02.08.2026**, Bußgeld bis 15 Mio. € / 3 % Umsatz — Primärquelle geprüft |
| J11 | **ZPP / §20 SGB V** — Anbieterqualifikation, Evaluationsnachweis, QM, Rezertifizierung alle 3 Jahre | Lücke fällt erst im Verfahren auf | GKV-Leitfaden Prävention |

**Zur AI-Act-Frist:** Die Ausnahme „es sei denn, es ist offensichtlich" trägt umso weniger, je menschenähnlicher das Produkt gestaltet ist. Menschliche Namen, Persönlichkeiten, Bindungsstufen und Gedächtnis schwächen genau diese Ausnahme — der Punkt hängt damit direkt an B16.

---

## N — Wartbarkeit & Codequalität ⚠️ NEUE GRUPPE (2026-07-28)

*Gefunden beim Abgleich des Tors mit dem Gerüst. ISO/IEC 25010:2023 kennt neun Hauptmerkmale; acht davon hatten hier eine Gruppe. **Wartbarkeit** hatte keine — obwohl der schwerste Fehler dieses Projekts genau dort entstand: Die Krisenmuster lagen doppelt im Code, Client und Server drifteten auseinander, und der Server verfehlte monatelang „ich will nicht mehr leben". Kein einziger Punkt des Gerüsts hätte das gefunden. Wartbarkeit ist bei dieser App keine Aufräumfrage, sondern ein Sicherheitsthema.*

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| N1 | Eine Quelle je Regel: Krisenmuster, Preise, Berechtigungen, Notfallnummern existieren genau einmal | Duplikatsuche über Kernregeln | Skript im Tor | jeder PR | dieselbe Regel an zwei Stellen gepflegt |
| N2 | Toter Code: nicht erreichbare Dateien, Routen und Exporte, Anteil am Quelltext | Erreichbarkeitsanalyse ab Einstiegspunkten | knip / eigenes Skript | monatlich | > 10 % oder eine tote Route im Navigationsmenü |
| N3 | Analysierbarkeit: Typprüfung ohne Fehler, Lint-Zähler fällt monoton | automatisiert | tsc --noEmit, eslint-Ratchet | jeder PR | Typfehler > 0 oder Zähler steigt |
| N4 | Änderbarkeit: Größe von Dateien und Funktionen im Kernpfad (Chat, Krise, Abrechnung) | Messung | Skript | monatlich | Datei im Kernpfad > 600 Zeilen ohne Aufteilungsplan |
| N5 | Abhängigkeiten: Anzahl, Aktualität, ungenutzte Pakete, bekannte Schwachstellen | Stückliste + Abgleich | bun audit, knip | monatlich | ungepatchte Schwachstelle mit hoher Bewertung |
| N6 | Bauen ohne Sondergerät: frischer Klon, `bun install`, Build und Tests laufen ohne Handgriffe | Trockenlauf im leeren Verzeichnis | CI-Job | jeder Release | manueller Eingriff nötig |

**Warum N1 im Tor steht und nicht im Quartal:** Die Musterduplikation war zwischen zwei Releases entstanden und blieb unbemerkt, weil niemand danach suchte. Ein Punkt, der einen bereits eingetretenen stillen Schaden verhindern soll, gehört an die Stelle, die bei jedem Push läuft.

---

## Nachtrag Nutzersicherheit — B21

| # | Unterpunkt | Prüfmethode | Werkzeug | Rhythmus | Blocker |
|---|---|---|---|---|---|
| B21 | Erkennungslogik stammt aus einer geteilten Quelle; Client und Server importieren dieselbe Datei | Importprüfung + Suche nach wiedereingeführten Kopien | Skript im Tor | jeder PR | Server oder Client pflegt eigene Muster |

*Dieser Punkt existierte faktisch schon als maschinelle Prüfung, war im Gerüst aber fälschlich als B20 (Modell-Drift) verbucht. Beides sind eigenständige Anforderungen: B21 verhindert Drift **im Quelltext**, B20 Drift **im Modell**. B20 ist weiterhin ungeprüft.*

---

## Ausführungsmodell — drei Ebenen statt vier Rhythmen

*Der Praktikabilitäts-Kritiker hat nachgerechnet: In der ursprünglichen Fassung waren pro Release rund 28 Unterpunkte fällig, davon etwa 20 von Hand — 10 bis 20 Stunden. Bei der bisherigen Release-Kadenz wäre das nach dem zweiten Mal stillschweigend übersprungen worden, und damit das ganze Gerüst tot. Ein Prüfschema, das niemand anwendet, ist wertlos.*

**Ebene 1 — Tor (`bun run gate`, jeder PR, null Menschenzeit)**
A6, B1, B2, B3, B5, B7, B21, C1, C3, I4, K6, K7, K10, N3.
Alle maschinell, alle blockierend. Wer hier rot ist, merged nicht.

> **Diese Liste ist maschinell an das Tor gebunden.** `scripts/check-framework.py` vergleicht sie mit den Punkten, die `scripts/gate.mjs` tatsächlich meldet, und schlägt bei jeder Abweichung fehl (Punkt K7). Wer hier einen Punkt hinzufügt, ohne die Prüfung zu bauen, bricht die CI — und umgekehrt.

**Korrektur vom 28.07.2026 — was diese Liste vorher fälschlich behauptete.** Beim ersten maschinellen Abgleich zeigte sich, dass fünf der zwölf Prüfungen im Tor einen Gerüstpunkt meldeten, den sie nachweislich nicht messen. Die Liste sah dadurch deutlich vollständiger aus, als sie war:

| Gemeldet | Tatsächlich gemessen | Was der Punkt im Gerüst bedeutet | Jetzt |
|---|---|---|---|
| `B20` | Client und Server teilen die Erkennungsquelle | Modell-Drift gegen den Live-Endpunkt | → **B21** (neu). B20 bleibt **ungeprüft** |
| `C2` | Typprüfung ohne Fehler | Authentifizierung, JWT, Rechteausweitung | → **N3**. C2 bleibt **ungeprüft** |
| `C15` | RLS auf jeder Tabelle aktiviert | Datenmigration vorwärts/rückwärts | → **C1** (statischer Teil). C15 bleibt **ungeprüft** |
| `K3` | Gerüst widerspruchsfrei | Testabdeckung je Verzeichnis | → **K6** (neu). K3 bleibt **ungeprüft** |
| `A2`, `A4`, `A5`, `H1` | die vorhandene Testsuite läuft grün | Persistenz, Eingabegrenzen, Zeitzonen, Fehlerbehandlung | → **K10** (neu). Alle vier bleiben **ungeprüft** |

**Sieben Punkte sind damit von „automatisiert" auf „ungeprüft" zurückgestuft** — A2, A4, A5, B20, C2, C15, H1 und K3. Das ist kein Rückschritt in der App, sondern eine Korrektur der Buchführung: Sie waren nie gemessen. Nach der Regel „ungeprüfte Punkte zählen als 0" senkt das die Gesamtnote, und das ist richtig so.

**Zu C1:** Das Tor prüft statisch, dass jede Tabelle Row Level Security aktiviert hat — eine notwendige, keine hinreichende Bedingung. Der eigentliche Nachweis (Konto B erreicht keine Ressource von Konto A, gegen lokales `supabase start`) fehlt weiterhin und ist der nächste Ausbauschritt des Tors.

**Ebene 2 — Release-Karte (eine Seite, Zeitfenster 90 Minuten)**
A1 auf dem Gerät · B6 · B12 · B18 · C6 · Textdurchsicht (D3+D4) · Geräte-Smoke (G1–G5 zusammengelegt, je einmal iOS und Android, 15 Minuten) · I1 · I4 · H4 · J10.
Abhaken oder Release stoppen.

**Ebene 3 — Quartals-Audit (ein halber Tag)**
B4 · B8 · B9 · B10 · B11 · B13 · B14 · Datenschutz-Durchlauf (C4+C5+J1 zusammengelegt) · C13 · C14 · C16 · C17 · I3 · F- und K-Reste · L1–L5 · J2 vor jeder Einreichung · J6–J9.

**Zusammengelegt:** G1–G5 → ein Geräte-Smoke · D3+D4 → Textdurchsicht · C4+C5+J1 → Datenschutz-Durchlauf · J5 gestrichen (war nur ein Verweis auf Gruppe E).

**Einmalig automatisieren, danach kostenlos:** D1 und E5 als Lint-Regel · F1+F3 als Bundle-Budget im Build · A6 und I4 laufen bereits als Ratchet · C3 als `gitleaks` in der CI (20 Zeilen).

### Korrigierte Unabhängigkeitsregel

Die ursprüngliche Fassung verlangte eine Prüfung „nicht von derselben Person oder Instanz" — für ein Ein-Personen-Team hätte das jede Gruppennote dauerhaft unter 70 gedeckelt, unabhängig von der tatsächlichen Qualität. Das ist keine Strenge, sondern ein Konstruktionsfehler.

**Neu, artefakt-basiert und nachweisbar:** Ein Prüfpunkt gilt als unabhängig geprüft, wenn der Prüfkorpus oder die Spezifikation **vor** der Implementierung im Repository liegt (über den Commit-Zeitstempel belegbar) und in einer getrennten Sitzung entstanden ist. Damit ist Unabhängigkeit maschinell prüfbar statt organisatorisch unerreichbar.

---

## Bewertungsmaßstab — wie aus einer Prüfung eine Zahl wird

*Bis hierher sagte das Gerüst, WAS geprüft wird und wann ein Release blockiert. Es sagte nicht, wie man von 0 bis 100 bewertet — und ohne das ist jede Zahl nur ein Eindruck in Tabellenform. Der folgende Maßstab gilt für alle 93 Punkte gleich.*

| Stufe | Bedeutung | Bedingung |
|---|---|---|
| **100** | Erledigt und abgesichert | Anforderung erfüllt **und** durch einen automatischen Test gegen Rückfall geschützt, der bei Verletzung den Build bricht |
| **85** | Erledigt, ungesichert | Anforderung erfüllt, aber nichts verhindert, dass es morgen wieder kaputtgeht |
| **70** | Erfüllt mit bekannter Einschränkung | Kern erfüllt, eine dokumentierte Lücke bleibt (z. B. eine Region, eine Plattform, ein Randfall) |
| **50** | Teilweise | Die Hälfte der Flächen, Fälle oder Plattformen ist abgedeckt |
| **25** | Angefangen | Etwas existiert, wirkt aber nicht durchgängig oder ist nicht erreichbar |
| **0** | Nicht vorhanden | Kein Gegenstück im Code oder Prozess auffindbar |

**Zwischenwerte sind erlaubt**, wenn eine Messung sie hergibt — eine Trefferquote von 87 % ist 87, keine Stufe. Wo eine Zahl gemessen wird, gilt die Zahl. Wo nur ein Zustand feststellbar ist, gilt die Stufe.

### Zwei Regeln, die Selbstbetrug verhindern

**Deckelregel.** Ein Punkt kann höchstens **70** erreichen, solange die Prüfung nicht unabhängig ist — also solange Korpus oder Spezifikation nicht nachweislich vor der Implementierung entstanden sind (Commit-Zeitstempel). Das ist der Ersatz für die ursprüngliche, unerfüllbare Fassung dieser Regel.

**Blockerregel.** Ist das Blocker-Kriterium eines Punktes erfüllt, ist der Punkt **0** — unabhängig davon, wie gut der Rest aussieht. Ein Krisenpfad, der an einer Fläche versagt, ist kein 80er mit Schönheitsfehler.

### Statuskennzeichnung

Jeder Punkt trägt zusätzlich zur Zahl einen Status:
`automatisiert` (läuft im Tor) · `manuell` (Release-Karte oder Quartal) · `ungeprüft` (noch nie gemessen) · `nicht prüfbar` (mit Begründung, z. B. fehlender Backend-Zugriff).

**Ungeprüfte Punkte zählen als 0**, nicht als „unbekannt". Sonst schmeichelt jede Gesamtnote sich selbst, indem sie weglässt, was niemand angesehen hat.

---

## Anwendung

**Vor jedem Release** werden alle Blocker-Kriterien geprüft. Ein einziger roter Blocker in Gruppe **B** oder **C** verhindert die Auslieferung, unabhängig vom Rest.

**Bewertungsblatt:** Jeder Unterpunkt bekommt eine Zahl 0–100 und einen Status. Die Gruppennote ist der ungewichtete Durchschnitt, die Gesamtnote gewichtet:

| Gruppe | Gewicht | Begründung |
|---|---|---|
| B Nutzersicherheit | 25 % | Zielgruppe entscheidet |
| C Sicherheit & Datenschutz | 20 % | Gesundheitsdaten |
| A Funktionale Korrektheit | 12 % | Grundlage; zwei Punkte abgegeben, weil A6 und Teile von A inzwischen maschinell gesichert sind |
| H Zuverlässigkeit & Betrieb | 10 % | ohne Auslieferung keine Wirkung |
| D Erlebnisqualität | 7 % | Bindung |
| J Compliance | 7 % | Marktzugang, Wirksamkeitsnachweis für ZPP |
| L Regulatorische Qualifizierung | 6 % | Existenzrisiko: falsche Einstufung kann Vertrieb stoppen |
| N Wartbarkeit & Codequalität | 5 % | ISO-25010-Hauptmerkmal, das bisher ganz fehlte — und die Stelle, an der die Krisenmuster auseinanderdrifteten |
| E Barrierefreiheit | 4 % | gesetzlich, wachsend |
| I Geschäftslogik | 2 % | Tragfähigkeit; abgestuft, weil I2/I3 den Umsatz betreffen, nicht die Sicherheit der Nutzer |
| F Performance | 1 % | derzeit unkritisch |
| G Plattform | 1 % | in H/D enthalten |
| K Testinfrastruktur | — | Korrekturfaktor: senkt alle anderen Noten, wenn unabhängige Prüfung fehlt |

*Umverteilung vom 28.07.2026 für Gruppe N: A −2, H −1, D −1, I −1. Summe bleibt 100 %.*

**Regel gegen Selbstbestätigung:** Eine Gruppennote darf nur dann über 70 liegen, wenn für mindestens einen ihrer Punkte eine **unabhängige** Prüfung im Sinne der artefakt-basierten Regel oben vorliegt — Prüfkorpus oder Spezifikation liegen ausweislich des Commit-Zeitstempels vor der Implementierung und sind in einer getrennten Sitzung entstanden.

*Korrigiert am 28.07.2026: Hier stand bis eben noch die ursprüngliche Fassung („nicht von derselben Person oder Instanz"), die weiter oben im selben Dokument bereits als Konstruktionsfehler verworfen worden war. Das Gerüst widersprach sich also an zwei Stellen selbst — gefunden erst beim Zeile-für-Zeile-Abgleich, nicht beim Lesen.*
