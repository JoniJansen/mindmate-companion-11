# Soulvay — Roadmap

**Stand:** 06.08.2026 · Arbeitsfassung zum Abhaken
Grafische Übersicht: siehe den Artifact-Link in der Sitzung vom 06.08.
Grundlage: [`audit/TEST_FRAMEWORK.md`](audit/TEST_FRAMEWORK.md) · [`audit/pruefanweisungen/`](audit/pruefanweisungen/README.md) · [`audit/RELEASE_KARTE.md`](audit/RELEASE_KARTE.md)

| | |
|---|---|
| Im App Store | Build 64, eingereicht 11.06.2026 — **Status unbekannt** |
| Unveröffentlicht | 60 Commits, 220 Dateien, 8 Wochen |
| Prüfgerüst | 105 Punkte · 15 maschinell · 90 von Hand |
| Tor | 13 / 13 grün, blockierend in der CI |

**Die Reihenfolge ist nicht beliebig.** Jede Phase liefert etwas, ohne das die nächste auf Sand steht. Wo das nicht offensichtlich ist, steht die Begründung dabei.

---

## Phase 0 — Der Cut auf v1.2 · diese Woche

**Warum zuerst:** Die Version, die deine Nutzer gerade im Store haben, verfehlt auf dem Server die häufigste deutsche Formulierung für Suizidalität, hat im Sprachmodus überhaupt kein Sicherheitsnetz und zeigt Nutzerinnen in Österreich Nummern, die dort nicht durchstellen. Jeder Tag Verzögerung ist ein Tag mit dieser Version bei echten Menschen.

- [ ] **KI-Kennzeichnung nach EU AI Act Art. 50** — *in Bearbeitung*. Frist lief am 02.08. ab. Drei Flächengruppen nacheinander, danach drei Angreifer. `J10`
- [ ] **Tagebuch verliert Einträge lautlos** — nach `insert`/`update` wird `error` nicht geprüft; der Supabase-Client wirft nicht. `A2`, Blocker „Datenverlust"
- [ ] **ASC-Schlüssel erneuern** *(du)* — der alte wird mit 403 abgelehnt
- [ ] **Store-Status klären** *(du)* — live, in Prüfung oder abgelehnt? Davon hängt ab, ob wir obendrauf legen oder ersetzen
- [ ] **Version 1.2 setzen, Build hochzählen**
- [ ] **Release-Karte durchgehen** *(du, 90 Minuten am Gerät)*
- [ ] **Einreichen** — „Was ist neu" in beiden Sprachen, Rückrollweg benannt

---

## Phase 1 — Den Krisenpfad zu Ende bauen · 2–3 Wochen

**Warum als Nächstes:** Gruppe B trägt 25 % der Gesamtnote. Die Erkennung ist nach dieser Woche belastbar — 352 Testfälle, ein unabhängiger Korpus, 58 adversarisch gefundene Löcher geschlossen. Aber sie misst nur, **ob** eine Krise erkannt wird. Was danach passiert, ist weitgehend ungebaut.

- [ ] **Sicherheitsplan nach Stanley-Brown** — sechs Schritte, offline und ohne Login abrufbar. Existiert nicht. `B12`
- [ ] **Mittelsicherung im Krisenprompt** — „ich habe Tabletten gesammelt" löst aus und wird dann nicht adressiert. `B13`
- [ ] **Risikostufen statt Binärurteil** — Graubereich dokumentiert, Logik fehlt. `B10`
- [ ] **Nachsorge nach erkannter Krise** — nach 72 Stunden geschieht nichts. `B14`
- [ ] **Meldeweg „die App hat mir geschadet"** — keine Kategorie, keine Triage, keine Vorfallakte. `B19`
- [ ] **Modell-Drift täglich überwachen** — der Anbieter tauscht Modellversionen ohne unseren Release. `B20`

---

## Phase 2 — Minderjährige und Bindung · Entscheidungen, kein Code

**Warum getrennt:** Das sind keine Fehler, sondern Produktfragen. Sie hängen an dir, nicht an Arbeitszeit.

- [ ] **Altersfeststellung** — die App fragt nie nach dem Alter, die AGB behaupten „mindestens 16". `B15`
- [x] **Krisenpfad für Minderjährige, Teil 1** — Hilfekarte zeigt jetzt eine Erwachsenen- und eine Jugendleitung. `B17`
- [ ] **Krisenpfad für Minderjährige, Teil 2** — Ansprache und Reihenfolge; hängt an `B15`
- [ ] **Bindungsvermeidung** — Bindungsstufe mit sechs Meilensteinen und unbegrenztes Gedächtnis gegen die ausdrückliche APA-Empfehlung. Der unbequemste Punkt im Gerüst. `B16`

---

## Phase 3 — Die rechtliche Grundlage · parallel zu 1 möglich

**Warum L2 ganz vorn:** An der Medizinprodukte-Frage hängen die Werbeaussagen, die ZPP-Zertifizierung, die Kassen-Strategie und drei weitere Gerüstpunkte. Solange sie offen ist, kann jede Antwort auf die anderen falsch sein.

- [ ] **Zweckbestimmung schreiben** — existiert nicht; entscheidet die MDR-Schwelle bewusst statt versehentlich. `L1`
- [ ] **MDR-Qualifizierung nach MDCG 2019-11** — sechs Fragen, abarbeitbar vorbereitet. `L2`
- [ ] **Auftragsverarbeitungsverträge** — Verzeichnis leer, Register behauptet fünf. `J1`
- [ ] **Technische Aussagen richtigstellen** — Lovable-Gateway und Sentry in keinem Rechtstext. `J4`
- [ ] **Werbeaussagen nach HWG · ZPP-Weg** — beides hängt an `L2`. `J3` `J11`

**Braucht eine Fachperson.** Fachanwalt für IT- und Medizinprodukterecht. Alles Vorbereitbare ist in den Prüfanweisungen vorbereitet.

---

## Phase 4 — Betrieb, Kosten, Mandantentrennung · bevor die Nutzerzahl steigt

**Warum hier:** Bei zwölf Testern tut das nicht weh. Bei zweihundert Nutzern trifft ein Ausfall alle gleichzeitig — und dann ist keine Zeit zu bauen.

- [ ] **Rate-Limit, Budgetgrenze, Not-Aus** — für die Sprachausgabe gibt es nichts davon. `H5`
- [ ] **Krisenpfad überwachen** — fällt die Erkennung aus, merkt es niemand. `H3`
- [ ] **Cross-Tenant-Test gegen echte Datenbank** — das Tor prüft nur statisch. `C1`
- [ ] **Export vervollständigen** — `user_activity_log` fehlt, die Tabelle mit den Krisenmarkierungen. `C5`
- [ ] **Inhaltslog abstellen** — `generate-summary` schreibt KI-Inhalte ins Log eines Dritten. `C4`

---

## Phase 5 — Messen statt schätzen · wenn 1 bis 4 stehen

**Warum zuletzt:** Alles ist vorbereitet. Jetzt zu messen hieße, Zahlen zu erzeugen, die nach Phase 1 wertlos sind.

- [ ] **Die 90 Handpunkte durchmessen** nach den Prüfanweisungen, mit Beleg je Punkt
- [ ] **Bewertungsblatt mit Belegen** — Zahl plus Status je Punkt, gewichtete Gesamtnote. Ungeprüfte Punkte zählen als 0

---

## Nebenher — nie als eigener Block

Jeweils dann erledigen, wenn man ohnehin an der Stelle ist.

- [ ] Drei Lockdateien, Build-Nummer aus zwei Quellen `N6`
- [ ] Lint-Ratchet ins Tor, Deno-Seite prüfen — 275 Probleme, nicht 1087 `N3`
- [ ] Toter Code und tote Routen — `/timeline` ohne Einstieg, `/toolbox` nicht im Menü `N2`
- [ ] E2E läuft in keinem CI-Job `K4`
- [ ] Mutationsprüfung: kann jede der 13 Torprüfungen überhaupt rot werden? `K9`
- [ ] 74 Dokumente in `audit/` — archivieren was zu Build 56–64 gehört, Index anlegen

---

## Was von dir kommen muss

1. **ASC-Schlüssel erneuern** und Key ID plus Issuer ID nennen
2. **Entscheidung zu B16** — Bindungsstufe und Gedächtnis: bleiben, begrenzen oder fallen
3. **Eine Fachperson für Phase 3**
4. **90 Minuten am Gerät**, sobald der Cut steht
