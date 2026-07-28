# Prüfanweisungen — Gruppen J (Compliance & Recht) und L (Regulatorische Qualifizierung)

### J1 — DSGVO: Rechtsgrundlagen, Verzeichnis, AV-Verträge, Art.-9-Behandlung

**Ebene:** 3 (Quartals-Audit, zusammengelegt als Datenschutz-Durchlauf C4+C5+J1)
**Zeitbedarf:** 3–4 Stunden im ersten Durchlauf, danach 90 Minuten je Quartal
**Durchführung:**
1. Empfängerliste aus dem Code erzeugen, nicht aus dem Gedächtnis: `grep -rniE "https://[a-z0-9.-]+" supabase/functions/ src/ --include="*.ts" --include="*.tsx" | grep -v supabase.co` und zusätzlich alle `Deno.env.get(...)`-Schlüssel auflisten. Jede so gefundene fremde Domain ist ein Empfänger, bis das Gegenteil belegt ist. Ergebnis als Spalte „tatsächlich" in eine Tabelle schreiben.
2. Diese Spalte gegen `docs/gdpr-processor-register.md` (7 Einträge) und gegen `src/pages/Privacy.tsx` (Abschnitte ab Zeile 139 englisch / 332 deutsch) stellen. Zwei Abweichungen sind zum Stand 28.07.2026 bereits belegbar und im Durchlauf zu bestätigen: (a) Der KI-Verkehr läuft über `https://ai.gateway.lovable.dev/v1/chat/completions` (u. a. `supabase/functions/session-insight/index.ts:98`, `supabase/functions/journal-reflect/index.ts:216`) — Register und Datenschutzerklärung nennen ausschließlich die Google Gemini API im Paid Tier mit automatisch geltendem Google-DPA. Lovable als zwischengeschaltete Stelle taucht in keinem der beiden Dokumente auf. (b) **Sentry** kommt in `src/pages/Privacy.tsx`, `docs/gdpr-processor-register.md` und `docs/gdpr-record-of-processing-activities.md` nicht vor, obwohl `audit/SENTRY_SETUP_LOG.md`, `src/components/settings/SettingsCrashReportingSection.tsx` und `src/components/gdpr/NativeCrashConsentModal.tsx` existieren.
3. `ls -la compliance/processor-agreements/` ausführen. Das Verzeichnis ist leer. Für jeden Auftragsverarbeiter aus `compliance/README.md` (Google, Supabase, ElevenLabs, RevenueCat, Resend) sowie für die in Schritt 2 neu gefundenen Empfänger den AVV im Anbieterkonto abrufen, als PDF ablegen und mit SHA-256-Summe, Abrufdatum und Kontoname protokollieren. Solange eine Datei fehlt, ist der Registereintrag „✅ Accepted" eine unbelegte Behauptung.
4. Rechtsgrundlagen prüfen: `docs/gdpr-record-of-processing-activities.md` führt für Chat und Konto Art. 6(1)(b) DSGVO. Dem gegenüber steht, dass `docs/gdpr-data-protection-impact-assessment.md` in Abschnitt 1 ausdrücklich die Position vertritt, Stimmungswerte und reflektierende Inhalte seien **keine** Gesundheitsdaten nach Art. 9. Diesen Widerspruch als offenen Punkt festhalten — er entscheidet, ob Art. 9(2)(a) (ausdrückliche Einwilligung) als zusätzliche Grundlage nötig ist, und er entscheidet mittelbar auch über die DSFA-Pflicht.
5. Einwilligungsmechanik gegenprüfen: `src/components/AIConsentModal.tsx` und `src/components/settings/SettingsAIConsentSection.tsx` daraufhin ansehen, ob die eingeholte Einwilligung textlich das abdeckt, was Schritt 1 als tatsächlichen Datenfluss ergeben hat (insbesondere den Gateway-Zwischenschritt).
6. **Juristische Bewertung erforderlich.** Der Fachperson vorzulegen: die Tabelle aus Schritt 2, die AVV-Sammlung aus Schritt 3, ROPA, DSFA, Datenschutzerklärung im aktuellen Wortlaut sowie die konkrete Frage: „Sind die in dieser App verarbeiteten Daten Gesundheitsdaten nach Art. 9 DSGVO, und trägt Art. 6(1)(b) allein?" Ohne diese Antwort bleibt J1 unbewertbar; sie ist keine Formalie, sondern die Grundlage für L1 bis L3.

**Belegt durch:** `compliance/gdpr-documents/AVV-Nachweis_<JJJJ-MM-TT>.md` mit einer Zeile je Auftragsverarbeiter (Anbieter, Dokumenttitel, Abrufdatum, Dateiname, SHA-256) plus die zugehörigen PDFs in `compliance/processor-agreements/`; dazu die datierte Stellungnahme der Fachperson zur Art.-9-Frage.

**Bewertung:**
- **100** — Für jeden im Code nachgewiesenen Empfänger liegt ein AVV als Datei vor, Register und Datenschutzerklärung stimmen mit dem Code überein, die Art.-9-Frage ist datiert beantwortet und die Rechtsgrundlagen sind entsprechend gesetzt; zusätzlich bricht eine CI-Prüfung den Build, wenn eine im Code auftauchende neue Fremd-Domain keinen Registereintrag hat. (Ohne diese Automatisierung höchstens 85; die Deckelregel begrenzt zusätzlich auf 70, solange die Prüfliste nicht nachweislich vor der Implementierung entstanden ist.)
- **70** — Alle AVV liegen vor und die Dokumente stimmen mit dem Code überein, aber eine dokumentierte Lücke bleibt (z. B. Art.-9-Einordnung anwaltlich noch offen, ein Empfänger nur mit Anbieter-Standardklauseln statt gegengezeichnetem Vertrag).
- **0** — **Fehlender AV-Vertrag** für mindestens einen Auftragsverarbeiter. Das ist zum Stand 28.07.2026 der Fall: `compliance/processor-agreements/` ist leer, während `docs/gdpr-processor-register.md` fünf Verträge als „✅ Accepted" führt. J1 steht damit bis zum Gegenbeweis auf 0, unabhängig von der Qualität der übrigen Dokumente.

---

### J2 — Store-Richtlinien Apple & Google, Health-Deklaration, Datensicherheits-Formular

**Ebene:** 3 (Quartals-Audit) — zusätzlich verpflichtend vor **jeder** Store-Einreichung, iOS wie Android
**Zeitbedarf:** 60–90 Minuten je Einreichung
**Durchführung:**
1. In App Store Connect die App-Datenschutzangaben („App Privacy") Feld für Feld gegen das Ergebnis von J1 Schritt 1 abgleichen. Für jede Datenkategorie prüfen: erhoben ja/nein, mit Identität verknüpft ja/nein, für Tracking ja/nein. „Sensitive Info" und „Health & Fitness" bewusst entscheiden und die Entscheidung schriftlich begründen — sie hängt an derselben Art.-9-Frage wie J1 Schritt 4.
2. In der Google Play Console das Formular „Datensicherheit" identisch durchgehen. Zusätzlich die Deklarationen „Health Apps" und „Sensitive App Permissions" öffnen. Play verlangt für Gesundheits- und Medizin-Apps eine gesonderte Erklärung; die Antwort muss zur Antwort in Schritt 1 passen. Zwei Stores mit widersprüchlichen Angaben sind ein eigenständiger Befund.
3. Apple Review Guideline 1.4.1 (Physical Harm / medical apps) und 5.1.1(iii) sowie die Play-Richtlinie „Health Content and Services" öffnen und je Absatz notieren, ob Soulvay betroffen ist. Belege aus der App beilegen (Krisenpfad, Nicht-Therapie-Hinweis `src/components/chat/ChatDisclaimer.tsx` mit dem Schlüssel `chat.disclaimer`).
4. Beide Store-Listings im Wortlaut ziehen (`docs/google-play-store-listing.md`, `docs/ios-app-store-setup.md`) und gegen die Fundliste aus J3 halten. Store-Text und App-Text müssen dieselbe Aussage treffen; abweichende Marketingtexte im Store sind der häufigste Ablehnungsgrund.
5. Altersfreigabe prüfen: IARC-Fragebogen (Play) und Age Rating (ASC) daraufhin ansehen, ob die dort gemachten Angaben zu einer App ohne Altersfeststellung passen — in `src/pages/Onboarding.tsx` und `src/pages/Auth.tsx` ist zum Stand 28.07.2026 keine Altersabfrage auffindbar.
6. Ablehnungshistorie einbeziehen: `audit/REJECT27_CLASSIFICATION.md`, `audit/BUILD64_APPLE_REVIEW_FIXES.md` und `docs/apple-rejection-fixes-*.md` durchgehen und für jeden früheren Ablehnungsgrund prüfen, ob er im aktuellen Build erneut greifen könnte.

**Belegt durch:** `audit/STORE_DEKLARATION_<JJJJ-MM-TT>_build<N>.md` mit Screenshots beider Formulare, der Begründung zur Health-Deklaration und einer Zeile je geprüfter Richtlinie.

**Bewertung:**
- **100** — Beide Formulare vollständig, untereinander widerspruchsfrei und mit dem tatsächlichen Datenfluss deckungsgleich; Store-Texte gegen die J3-Liste geprüft; frühere Ablehnungsgründe einzeln abgehakt; ein Skript vergleicht die deklarierten Kategorien mit der Empfängerliste und bricht bei Abweichung.
- **70** — Formulare vollständig und geprüft, eine dokumentierte Lücke bleibt (z. B. Health-Deklaration bewusst konservativ gesetzt, anwaltliche Bestätigung steht aus).
- **0** — **Ablehnung** durch Apple oder Google, oder eine Angabe im Store-Formular, die dem in J1 Schritt 1 belegten Datenfluss widerspricht — eine falsche Datensicherheitsangabe ist eine Ablehnung, die nur noch nicht zugestellt wurde.

---

### J3 — Werbeaussagen: keine Heilversprechen, keine unbelegten Wirkbehauptungen (HWG)

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 2–3 Stunden für den erstmaligen Aufbau der Fundliste, danach 20 Minuten je Release (nur Differenz)
**Durchführung:**
1. **Vollständig einsammeln statt erinnern.** Alle nutzersichtbaren Texte in eine einzige Datei ziehen, in dieser Reihenfolge und jeweils mit Fundstelle:
   - `src/translations/*.ts` — 13 Dateien, DE und EN je Schlüssel;
   - JSX-Literale außerhalb der Übersetzungsdateien: `grep -rnoE '>[^<>{}]{25,}<' src/pages src/components | grep -vE "className|import"`;
   - `index.html` (Zeilen 20–22 und alle `og:`-Felder) und `public/manifest.json`;
   - Store-Texte: `docs/google-play-store-listing.md`, `docs/ios-app-store-setup.md`;
   - Außenkommunikation: `audit/krankenkassen-handout.html`, `audit/KRANKENKASSEN_HANDOUT.md`, `audit/KRANKENKASSEN_EMAIL_TEMPLATES.md`;
   - E-Mail-Vorlagen aus `supabase/functions/send-transactional-email/` und `supabase/functions/process-email-queue/`;
   - die Systemprompts (siehe L3) — was das Modell über sich selbst behauptet, ist ebenfalls eine Aussage des Anbieters.
2. Fundliste als Tabelle in `audit/WERBEAUSSAGEN_<JJJJ-MM-TT>.md` anlegen: Fundstelle · Sprache · Wortlaut · Fläche (App / Store / Website / E-Mail / Prompt) · Einstufung. Diese Datei ist ab jetzt der Prüfgegenstand; bei jedem Release wird nur noch die Differenz gegen die Vorversion geprüft (`git diff` über die Übersetzungsdateien und die Store-Dokumente).
3. Über die Fundliste einen Trefferfilter laufen lassen, getrennt nach Sprache. Wortliste DE: heilt, Heilung, therapeutisch, Therapie, Behandlung, behandelt, lindert, Linderung, Symptom, reduziert, senkt, Angst, Depression, Burnout, Trauma, Diagnose, klinisch, psychologisch, Psychologe, evidenzbasiert, nachweislich, wissenschaftlich belegt, Studie, wirksam, Wirkung, geprüft, zertifiziert, medizinisch, Prävention, vorbeugen. EN: heal, cure, treat, therapy, therapeutic, clinical, psychological, diagnose, evidence-based, proven, scientifically. Jeder Treffer kommt einzeln in die Tabelle — auch die, die harmlos aussehen.
4. Drei zum Stand 28.07.2026 bereits belegbare Treffer sind in jedem Fall zu behandeln: `index.html:20` und `:21` sowie `public/manifest.json` führen den Titel **„Soulvay – Dein psychologischer Begleiter" / „Your Psychological Companion"** (Berufsbezeichnungsnähe und Wirkbehauptung in einem Wort); `src/pages/FAQ.tsx:36`/`:153` behauptet „Enterprise-Cloud-Infrastruktur … branchenübliche Sicherheitsstandards" (gehört zu J4); die Play-Beschreibung in `docs/google-play-store-listing.md` stellt „Keine Therapie, kein Coaching" der Rubrik „🧠 WAS IST SOULVAY?" gegenüber — die Entlastungsformel steht dort im selben Text wie die Wirkversprechen und muss auf Sichtbarkeitsgleichheit geprüft werden.
5. Je Treffer die drei Fragen beantworten und in der Tabelle festhalten: (a) Wird eine gesundheitsbezogene Wirkung behauptet? (b) Wird sie auf eine Krankheit oder ein Leiden bezogen? (c) Existiert für die Behauptung ein Beleg, der über eine Meinung hinausgeht — falls nein, ist sie unbelegt, unabhängig davon, ob sie stimmt.
6. **Juristische Bewertung erforderlich.** Ob und in welchem Umfang das HWG auf dieses Produkt anwendbar ist, hängt an derselben Frage wie L2 (Medizinprodukt ja/nein) und ist keine Selbsteinschätzung. Der Fachperson vorzulegen: die vollständige Tabelle aus Schritt 2 mit den Einstufungen aus Schritt 5, die Store-Listings im Wortlaut, das Kassen-Handout und die Systemprompts. Konkrete Fragestellung: „Welche dieser Formulierungen sind Werbung für ein Medizinprodukt oder krankheitsbezogene Werbung im Sinne des HWG, und welche sind zusätzlich als irreführend angreifbar?"

**Belegt durch:** `audit/WERBEAUSSAGEN_<JJJJ-MM-TT>.md` mit vollständiger Fundliste, Einstufung je Zeile und dem Datum der letzten Differenzprüfung; dazu die datierte anwaltliche Rückmeldung zu den markierten Zeilen.

**Bewertung:**
- **100** — Fundliste vollständig über alle sechs Quellen, jede markierte Formulierung anwaltlich bewertet und bereinigt; eine Lint-Regel oder ein Testfall prüft die Wortliste aus Schritt 3 gegen `src/translations/*.ts`, `index.html` und `public/manifest.json` und bricht den Build bei einem neuen Treffer ohne Freigabevermerk.
- **70** — Fundliste vollständig und bereinigt, aber eine Fläche bleibt dokumentiert offen (z. B. Store-Texte geprüft, Kassen-Handout noch nicht) oder die anwaltliche Bewertung steht für Randfälle aus.
- **0** — Ein **Heilversprechen** in einer nutzersichtbaren Fläche. Ebenfalls 0, wenn die Prüfung ohne Fundliste aus dem Gedächtnis erfolgt ist: eine Prüfung, die ihren eigenen Gegenstand nicht kennt, hat keinen Aussagewert.

---

### J4 — Technische Aussagen korrekt (Verschlüsselung, Weitergabe, Speicherort)

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 60 Minuten je Release
**Durchführung:**
1. Alle technischen Zusicherungen aus den Rechtstexten extrahieren: `src/pages/Privacy.tsx`, `src/pages/Terms.tsx`, `src/pages/FAQ.tsx`, `src/pages/Safety.tsx`, `src/pages/About.tsx` sowie die Store-Beschreibungen. Je Aussage eine Zeile: Behauptung · Fundstelle · Beleg im Code · Urteil.
2. Verschlüsselungsaussagen prüfen. `src/pages/Privacy.tsx:84`/`:277` behauptet „TLS 1.2+ … Verschlüsselung im Ruhezustand", `:63`/`:256` „TLS 1.3", `src/pages/FAQ.tsx:36`/`:153` „branchenübliche Sicherheitsstandards". Gegenbeleg: TLS-Version tatsächlich messen (`openssl s_client -connect <projekt>.supabase.co:443 -tls1_2`), Verschlüsselung at rest in der Supabase-Konsole nachweisen (Screenshot mit Datum). Prüfen, ob irgendwo „Ende-zu-Ende" behauptet wird — das wäre bei serverseitiger KI-Verarbeitung falsch; zum Stand 28.07.2026 findet sich diese Formulierung nicht, der Befund ist bei jedem Release neu zu erheben.
3. Weitergabeaussagen prüfen. `src/pages/Privacy.tsx:332` benennt Google als Empfänger und stützt sich auf das automatisch geltende Google-DPA bei kostenpflichtiger Gemini-Nutzung. Der Code ruft jedoch `https://ai.gateway.lovable.dev/v1/chat/completions` auf (`supabase/functions/journal-reflect/index.ts:216`, `supabase/functions/session-insight/index.ts:98`). Diese Aussage ist damit mindestens unvollständig. Ebenso: **Sentry** ist in keinem der Rechtstexte genannt. Beides in die Tabelle als „Aussage abweichend vom Code" aufnehmen.
4. Aussagen über Nicht-Speicherung prüfen: `src/pages/Privacy.tsx:334` behauptet, ElevenLabs speichere Audiodaten nach der Sitzung nicht. Beleg für diese Behauptung anfordern (Anbieterdokument mit Datum) und in `compliance/gdpr-documents/` ablegen; ohne Beleg ist es eine ungedeckte Zusicherung über einen Dritten.
5. Speicherortaussagen prüfen: behaupteter Serverstandort gegen die tatsächliche Region des Supabase-Projekts halten (Projekteinstellungen, Screenshot mit Datum).
6. Trainingsaussage prüfen: „nicht zum Training verwendet" (`src/pages/Privacy.tsx:260`, `:332`) gegen die tatsächlich genutzte Vertragsstrecke halten. Läuft der Verkehr über den Lovable-Gateway, ist die Aussage nicht mehr allein aus Googles Paid-Tier-Bedingungen ableitbar; es braucht die entsprechende Zusage der zwischengeschalteten Stelle.

**Belegt durch:** `audit/TECHNISCHE_AUSSAGEN_<JJJJ-MM-TT>.md` — Tabelle mit je einer Zeile pro Zusicherung, dazu Messprotokoll (TLS-Handshake), Konsolen-Screenshots mit Datum und die Anbieterbelege.

**Bewertung:**
- **100** — Jede technische Zusicherung in den Rechtstexten ist durch einen Code- oder Konsolenbeleg gedeckt; ein Test bricht den Build, wenn eine im Code auftauchende Ziel-Domain in `src/pages/Privacy.tsx` nicht vorkommt.
- **70** — Alle Aussagen belegt, eine dokumentierte Einschränkung bleibt (z. B. Anbieterzusage zur Nichtspeicherung liegt nur als Webseiten-Snapshot vor, nicht vertraglich).
- **0** — Eine **falsche Aussage** in einem nutzersichtbaren Rechtstext. Nach dem Stand vom 28.07.2026 trifft das auf die Empfängerdarstellung zu (Gateway und Sentry ungenannt); J4 steht damit bis zur Korrektur auf 0.

---

### J5 — Barrierefreiheit nach BFSG

**Ebene:** 3 (Quartals-Audit; im Ausführungsmodell als eigener Ausführungsschritt gestrichen, weil er auf Gruppe E verweist — die hier ergänzten Dokumentationspflichten deckt Gruppe E jedoch nicht ab)
**Zeitbedarf:** 45 Minuten zusätzlich zum Durchlauf von Gruppe E
**Durchführung:**
1. Nachweisen, dass Gruppe E im laufenden Zyklus tatsächlich durchgeführt wurde: E1 (axe-core / eslint-plugin-jsx-a11y ohne Fehler), E2 (Tab-Durchlauf), E3 (Kontrast, 200 % Skalierung), E4 (VoiceOver und TalkBack durch den Kernfluss), E5 (`prefers-reduced-motion`). Ohne diese Belege ist J5 nicht bewertbar.
2. Anwendungsbereich klären, statt ihn anzunehmen. Das BFSG unterscheidet Produkte und Dienstleistungen und kennt für Dienstleistungen eine Ausnahme für Kleinstunternehmen (Schwellenwerte Beschäftigtenzahl und Jahresumsatz/Bilanzsumme). Ob Soulvay als Einzelanbieter darunter fällt, ist eine Rechtsfrage und **hier ausdrücklich nicht selbst zu beantworten**. Vorzubereiten: schriftlicher Nachweis der Schwellenwerte (Beschäftigte, Umsatz des letzten Geschäftsjahres) und eine Beschreibung des Angebots (App-Store-Vertrieb, Abo über Apple/Stripe, PWA).
3. Unabhängig vom Ausgang von Schritt 2 prüfen, ob eine Erklärung zur Barrierefreiheit existiert und über die App und die Website erreichbar ist. In `src/pages/` findet sich zum Stand 28.07.2026 keine entsprechende Seite (vorhanden sind About, Impressum, Privacy, Terms, Cancellation, FAQ, Safety, Contact). Falls die Pflicht besteht, fehlt der Nachweis vollständig.
4. Prüfen, ob es einen benannten Kontaktweg für Barrierefreiheitsmängel gibt und ob dieser von `src/pages/Contact.tsx` aus erreichbar ist.
5. **Juristische Bewertung erforderlich.** Der Fachperson vorzulegen: die Unterlagen aus Schritt 2, die Testergebnisse aus Schritt 1 und die Feststellung aus Schritt 3. Fragestellung: „Unterliegt dieses Angebot dem BFSG, greift die Kleinstunternehmer-Ausnahme, und welche Erklärungs- und Informationspflichten bleiben trotz Ausnahme bestehen?"

**Belegt durch:** `audit/BFSG_<JJJJ-MM-TT>.md` mit den E1–E5-Ergebnissen, den Schwellenwertangaben und der datierten anwaltlichen Einordnung des Anwendungsbereichs.

**Bewertung:**
- **100** — Anwendungsbereich anwaltlich geklärt und datiert; E1–E5 im laufenden Zyklus grün; falls einschlägig, ist die Erklärung zur Barrierefreiheit veröffentlicht und der Mängel-Kontaktweg erreichbar; E1 und E5 laufen als blockierende Lint-Regeln.
- **70** — E1–E5 durchgeführt und im Wesentlichen erfüllt, Anwendungsbereich aber noch nicht anwaltlich bestätigt, oder eine Plattform (z. B. Android) im laufenden Zyklus nicht mit TalkBack geprüft.
- **0** — Das Gerüst führt für J5 **kein eigenes Blocker-Kriterium** (Spalte „—"), weil J5 auf Gruppe E verweist. Ersatzweise gelten deren Blocker: eine Tastaturfalle ohne Ausweg (E2), unlesbarer Text bei 200 % Skalierung (E3) oder ein mit Screenreader nicht bedienbarer Kernfluss (E4). Ebenfalls 0, solange Gruppe E im laufenden Zyklus gar nicht durchgeführt wurde — ungeprüfte Punkte zählen als 0.

---

### J6 — Wirksamkeitsnachweis (health benefit)

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 3 Stunden im ersten Durchlauf, danach 60 Minuten je Quartal
**Durchführung:**
1. Alle Nutzenbehauptungen aus der J3-Fundliste herausziehen — jede Zeile, die einen Effekt auf das Befinden behauptet. Das ist die Liste der Aussagen, für die ein Beleg existieren muss.
2. Je Behauptung eintragen, worauf sie sich stützt: eigene Messung, fremde Studie zur zugrundeliegenden Technik (z. B. 4-7-8-Atmung, 5-4-3-2-1-Erdung, Body-Scan aus `src/lib/moodExerciseMap.ts`), oder nichts. Eine Studie zu einer Übung ist kein Beleg für die Wirkung **dieser App** — diese Unterscheidung ausdrücklich in der Tabelle führen.
3. Vorhandene Messdaten sichten: `audit/MESSWERTE_2026-07-27.md` und die Ereignisdaten aus `supabase/functions/track-event/` und `supabase/functions/analytics-dashboard/`. Feststellen, welche Größen überhaupt erhoben werden (Nutzung, Retention) und welche nicht (Veränderung des Befindens über die Zeit).
4. Bewerten, ob aus den vorhandenen Stimmungsdaten überhaupt ein Wirksamkeitssignal ableitbar wäre: `src/pages/Mood.tsx:199` (Durchschnitt), `src/pages/Timeline.tsx:165` (Tagesmittel). **Achtung Zielkonflikt:** Jede Verdichtung dieser Daten zu einer Verlaufskennzahl ist zugleich ein Qualifizierungsrisiko nach L4. Schritt 5 darf daher nicht vor L2 umgesetzt werden.
5. Entscheidung dokumentieren, welcher Nachweisweg verfolgt wird — Nutzungsdaten, Vorher-Nachher-Erhebung, oder kontrollierte Studie — einschließlich der Konsequenz, dass jeder dieser Wege die Medizinprodukte-Frage berührt.
6. Für den ZPP-Weg gilt der Maßstab des GKV-Leitfadens Prävention, nicht die eigene Einschätzung: `audit/KRANKENKASSEN_ZPP_ROADMAP.md` Abschnitt „Kursmanual + wissenschaftliche Fundierung" gegen das halten, was tatsächlich vorliegt.

**Belegt durch:** `audit/WIRKSAMKEIT_<JJJJ-MM-TT>.md` — Tabelle Behauptung · Beleg · Belegart · Lücke, plus die Entscheidung aus Schritt 5 mit Datum.

**Bewertung:**
- **100** — Für jede Nutzenbehauptung existiert ein zuordenbarer Beleg; die Belegart ist benannt; ein Testfall verhindert, dass eine neue Nutzenbehauptung in `src/translations/*.ts` ohne Eintrag in der Belegtabelle ausgeliefert wird.
- **70** — Behauptungen und Belege vollständig gegenübergestellt, tragfähige Belege liegen nur für die eingesetzten Einzeltechniken vor, nicht für die App als Ganzes — die Lücke ist dokumentiert und die Werbetexte sind entsprechend zurückgenommen.
- **0** — **Für den ZPP-Weg: kein Nachweis.** Sobald Soulvay gegenüber Krankenkassen als Präventionsangebot auftritt (`audit/KRANKENKASSEN_EMAIL_TEMPLATES.md`, `audit/krankenkassen-handout.html`), ohne dass ein Evaluationsnachweis vorliegt, ist der Punkt 0.

---

### J7 — Ethik: persuasive Gestaltung gegenüber psychisch belasteten Menschen

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 2 Stunden
**Durchführung:**
1. Alle bindungs- und nutzungsverstärkenden Mechaniken auflisten, die im Produkt tatsächlich vorhanden sind. Startpunkte im Code: `src/hooks/useStreak.ts`, `src/hooks/usePersonalization.ts`, `src/hooks/useActivityLog.ts`, `src/components/companion/CompanionSelector.tsx`, `src/data/companionAgentPrompts.ts`, die Benachrichtigungslogik in `src/components/settings/NotificationSettings.tsx` sowie die Gedächtnisfunktionen `supabase/functions/extract-memories/` und `supabase/functions/detect-patterns/`.
2. Je Mechanik notieren: Was löst sie aus? Was passiert, wenn ein Mensch in schlechter Verfassung ihr folgt? Was passiert, wenn er sie ignoriert (Streak-Verlust als Zusatzbelastung)?
3. Den Bezahlpfad gesondert ansehen: `src/pages/Upgrade.tsx`, `src/components/premium/SubscriptionSection.tsx`. Prüfen, an welcher Stelle im Nutzungsverlauf ein Kaufhinweis erscheint. Ein Kaufhinweis unmittelbar nach einem Tief-Check-in oder im Anschluss an eine belastende Chat-Passage ist als eigener Befund festzuhalten.
4. Prüfen, dass kein Bezahlhinweis auf dem Krisenpfad liegt — Gegenbeleg über die vorhandenen Invarianz-Tests (`src/test/crisis-invariants.test.ts`, Gerüstpunkt B2), Ergebnis hier verlinken statt nachzubauen.
5. Den Konflikt aus B16 hier ausdrücklich mitentscheiden: Companion mit Namen, Bindungsstufe und Gedächtnis stehen der Empfehlung entgegen, die Illusion einer fortlaufenden Beziehung zu begrenzen. Ergebnis ist eine datierte Produktentscheidung mit Begründung, nicht eine Bewertung „unbedenklich".
6. Kündigung und Abbruch gegenprüfen: `src/pages/Cancellation.tsx` und `src/pages/DeleteAccount.tsx` daraufhin ansehen, ob der Ausstieg genauso wenige Schritte braucht wie der Einstieg.

**Belegt durch:** `audit/ETHIK_BEWERTUNG_<JJJJ-MM-TT>.md` — Tabelle Mechanik · Wirkung · Risiko für belastete Nutzer · Entscheidung · Datum.

**Bewertung:**
- **100** — Jede Mechanik einzeln bewertet und entschieden; kein Kaufhinweis im Anschluss an eine Belastungssituation; Ausstiegswege gleich kurz wie Einstiegswege; ein Test sichert, dass auf dem Krisenpfad kein Bezahl- oder Bindungselement erscheint.
- **70** — Bewertung vollständig, eine Mechanik bleibt bewusst bestehen und ist mit Begründung dokumentiert (z. B. Streak).
- **0** — **Keine Bewertung vorhanden.** Zum Stand 28.07.2026 existiert unter `audit/` kein Dokument dieser Art; der Punkt steht auf 0.

---

### J8 — Nachmarkt-Beobachtung: Neubewertung nach Updates, Vorfallserfassung, Lebenszyklus

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 2 Stunden erstmalig, danach 30 Minuten je Quartal
**Durchführung:**
1. Feststellen, ob eine schriftliche Regelung existiert, die festlegt, welche Änderung eine erneute Prüfung auslöst. Kandidaten für Auslöser: Modellwechsel beim Anbieter, Änderung der Krisenmuster, neue Auswertungsfunktion (siehe L4), neuer Empfänger, Änderung der Zweckbestimmung (L1).
2. Vorfallserfassung prüfen: Gibt es eine Akte, in der Meldungen „die App hat mir geschadet" landen (Gerüstpunkt B19)? Eingangskanäle sind `src/pages/Contact.tsx`, die Store-Rezensionen beider Plattformen und die Support-Adresse. Prüfen, ob diese Kanäle regelmäßig gesichtet werden und wo das protokolliert ist.
3. Fristen festlegen und dokumentieren: Sichtungsfrist, Triage-Kriterien, Eskalationsweg. `docs/gdpr-incident-response-plan.md` deckt Datenschutzvorfälle ab — prüfen, ob **Sicherheits**vorfälle im Sinne von Nutzerschaden dort überhaupt vorkommen; nach dem Titel des Dokuments ist das nicht zu erwarten und muss belegt werden.
4. Modellseite abdecken: Prüfen, ob es einen wiederkehrenden Lauf des Krisenkorpus gegen den Live-Endpunkt gibt (Gerüstpunkt B20, dort als ungeprüft ausgewiesen). Ohne diesen Lauf kann ein Anbieterwechsel der Modellversion die Erkennungsleistung zwischen zwei Releases unbemerkt senken — genau der Fall, den Nachmarkt-Beobachtung abdecken soll.
5. Sentry-Konfiguration daraufhin ansehen, ob der Krisenpfad überwacht ist (Gerüstpunkt H3), und das Ergebnis hier verlinken.
6. Wenn L2 ergibt, dass die App **kein** Medizinprodukt ist, diesen Punkt trotzdem als Lebenszyklus-Regelung nach ISO/TS 82304-2 führen; die Regelung ist von der MDR-Frage unabhängig.

**Belegt durch:** `audit/NACHMARKT_REGELUNG_<JJJJ-MM-TT>.md` mit Auslöserliste, Fristen, Meldewegen und dem Protokoll der letzten Kanalsichtung (mit Datum).

**Bewertung:**
- **100** — Auslöser, Fristen und Meldeweg schriftlich geregelt und mindestens einmal angewandt; Vorfallakte existiert; der tägliche Korpuslauf gegen den Live-Endpunkt läuft und alarmiert.
- **70** — Regelung vorhanden und angewandt, aber der Live-Endpunkt-Lauf fehlt oder läuft nur manuell — Lücke dokumentiert.
- **0** — **Keine Regelung.** Auch dann 0, wenn Meldungen zwar eingehen, aber kein Weg, keine Frist und keine Akte definiert sind.

---

### J9 — Externe Begutachtung

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 60 Minuten für die Vorbereitung; die Begutachtung selbst liegt außerhalb
**Durchführung:**
1. Für jede bisher erstellte Bewertung feststellen, wer sie erstellt hat. Alle Dokumente unter `audit/` und `docs/` stammen zum Stand 28.07.2026 vom Anbieter selbst; `docs/gdpr-data-protection-impact-assessment.md` weist als Assessor ausdrücklich den Verantwortlichen aus.
2. Die Punkte auflisten, bei denen Selbstauskunft strukturell nicht genügt: J1 (Art.-9-Einordnung), J3 (HWG), J5 (BFSG-Anwendungsbereich), J6 (Wirksamkeit), L2 (Qualifizierung), J11 (ZPP-Prüfung durch die Zentrale Prüfstelle Prävention).
3. Je Punkt die zuständige externe Stelle benennen und den Vorlagestand vorbereiten: Fachanwalt für IT-/Medizinprodukterecht (J1, J3, L2), ZPP (J11), unabhängiger Barrierefreiheits-Prüfdienst (J5), akkreditierte Prüforganisation nach ISO/TS 82304-2 (J6, J7).
4. Prüfen, ob bereits ein externer Kontakt stattgefunden hat und ob er dokumentiert ist — `audit/ZPP_ERSTBERATUNG_LEITFADEN.md` enthält einen Gesprächsleitfaden mit einem „Verifizierungs-Log 2026-07-21"; feststellen, ob daraus ein tatsächliches Gespräch mit Ergebnis wurde oder ob nur die Vorbereitung existiert.
5. Für jeden geführten Außenkontakt eine Akte anlegen: Stelle, Ansprechpartner, Datum, gestellte Frage, erhaltene Antwort im Wortlaut. Eine Aussage, die nur in einer Zusammenfassung existiert, ist kein Nachweis.

**Belegt durch:** `audit/EXTERNE_BEGUTACHTUNG_<JJJJ-MM-TT>.md` — je Zeile: Punkt · zuständige Stelle · Status · Datum · Fundstelle der Antwort im Original.

**Bewertung:**
- **100** — Für jeden Punkt aus Schritt 2 liegt eine externe schriftliche Stellungnahme mit Datum vor.
- **70** — Für die schwersten Punkte (L2 und J1) liegen externe Stellungnahmen vor, für die übrigen ist der Vorlagestand vorbereitet und terminiert.
- **0** — **Nur Selbstauskunft.** Das ist der Stand vom 28.07.2026: keine Datei in `audit/` oder `compliance/` trägt eine externe Absenderschaft.

---

### J10 — EU AI Act Art. 50: Kennzeichnung je Modalität und Informationspflicht bei Emotionserkennung

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 45 Minuten je Release, auf echtem Gerät
**Durchführung:**
1. **Text-Chat.** Mit einem frischen Konto den Chat öffnen. Prüfen, ob **vor** der ersten Antwort erkennbar ist, dass die Gegenstelle eine KI ist. Der vorhandene Hinweis `src/components/chat/ChatDisclaimer.tsx` nutzt den Schlüssel `chat.disclaimer` („Soulvay ist ein Begleiter für Selbstreflexion und ersetzt keine professionelle Therapie oder Beratung.") — dieser Satz benennt die **Nicht-Therapie**, aber nicht die **KI-Eigenschaft**. Zusätzlich ist der Hinweis über `localStorage`-Schlüssel `soulvay_chat_disclaimer_shown` einmalig und wegklickbar. Beides festhalten. Danach den Chat mit einem zweiten Konto erneut öffnen und prüfen, ob nach dem Wegklicken irgendeine dauerhaft sichtbare Kennzeichnung verbleibt (Kopfzeile, Nachrichtenlabel, Avatarbeschriftung). Der Companion trägt einen menschlichen Namen und eine Persönlichkeit (`src/data/companionAgentPrompts.ts`) — die Ausnahme „offensichtlich" trägt hier besonders schwach.
2. **Sprachmodus.** `src/components/chat/RealtimeVoicePanel.tsx` und `src/components/chat/VoiceConversationPanel.tsx` auf dem Gerät öffnen. Prüfen, ob die KI-Eigenschaft **hörbar oder im Panel sichtbar** gekennzeichnet ist, bevor die erste Stimme spricht. Eine synthetische Stimme, die sich mit einem menschlichen Namen meldet, ist der Kernfall von Art. 50. Zusätzlich prüfen, ob die Ausgabe als künstlich erzeugter Ton erkennbar gemacht ist. Vorhandene Bezeichnungen wie `voice.autoPlayDesc` („KI-Antworten automatisch vorlesen", `src/translations/settings.ts:107`) liegen in den Einstellungen, nicht in der Modalität selbst — das zählt nicht als Kennzeichnung an der Fläche.
3. **Demo auf der Landingpage.** `src/components/landing/DemoChat.tsx` im Browser ohne Anmeldung öffnen. Die Begrüßung ist ein festgelegter Text (`DEMO_GREETING`, Zeile 30 ff.), der die KI-Eigenschaft nicht nennt; eine Zeichenkette „KI" oder „AI" ist in der Datei nicht auffindbar. Prüfen, ob im gerenderten Zustand eine Kennzeichnung sichtbar ist — dies ist die erste Fläche, auf der ein Mensch dem System begegnet, und zugleich die einzige ohne Kontoanlage.
4. **Stimmungserfassung.** `src/pages/Mood.tsx` öffnen und den Check-in ausführen. Hier greift Art. 50 Abs. 3 (Informationspflicht bei Systemen zur Emotionserkennung): Prüfen, ob dem Nutzer beim Check-in gesagt wird, dass seine Angaben maschinell ausgewertet werden, und wofür. Dasselbe für die abgeleiteten Auswertungen: `src/pages/Timeline.tsx:165`, `src/components/journal/WeeklyRecap.tsx`, `supabase/functions/detect-patterns/`, `supabase/functions/session-insight/`. Auch die Sentiment-Vorschlagsfunktion im Tagebuch gehört hierher (`journal.sentimentSuggestion`: „KI schlägt vor zu taggen als", `src/translations/journal.ts:87`) — hier ist die Kennzeichnung vorhanden und dient als Positivbeispiel für die übrigen Flächen.
5. Ergebnis als Vier-Zeilen-Tabelle festhalten (Modalität · Kennzeichnung vorhanden ja/nein · Fundstelle · Screenshot). Jede Zeile braucht einen Screenshot vom Gerät, nicht aus dem Quelltext.
6. **Juristische Bewertung erforderlich** für die Frage, ob und wie weit die Ausnahme „offensichtlich für eine angemessen informierte Person" hier trägt. Der Fachperson vorzulegen: die Tabelle aus Schritt 5 mit Screenshots, die Companion-Systemprompts, die Store-Beschreibung und die Feststellung, dass der Companion mit menschlichem Namen, Persönlichkeit, Bindungsstufe und Gedächtnis auftritt. Frist beachten: **02.08.2026**.

**Belegt durch:** `audit/AI_ACT_ART50_<JJJJ-MM-TT>_build<N>.md` mit vier Screenshots (Text, Sprache, Demo, Stimmung), je einer Zeile Befund und dem Datum des Gerätelaufs.

**Bewertung:**
- **100** — Alle vier Modalitäten tragen eine Kennzeichnung, die vor der ersten Ausgabe sichtbar bzw. hörbar ist und nicht dauerhaft weggeklickt werden kann; die Stimmungserfassung informiert über die maschinelle Auswertung; ein Render-Test prüft die Kennzeichnung je Fläche und bricht den Build bei Wegfall.
- **70** — Alle vier Flächen gekennzeichnet, aber eine Einschränkung bleibt dokumentiert (z. B. Kennzeichnung im Sprachmodus nur visuell, nicht akustisch) und die anwaltliche Bestätigung zur Ausnahmefrage steht aus.
- **0** — **Kennzeichnung fehlt an einer Fläche.** Nach dem Stand vom 28.07.2026 sind Demo und Sprachmodus ohne auffindbare KI-Kennzeichnung, und der Chat-Hinweis benennt die KI-Eigenschaft nicht — J10 steht auf 0.

---

### J11 — ZPP / §20 SGB V: Anbieterqualifikation, Evaluationsnachweis, QM, Rezertifizierung

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 3 Stunden im ersten Durchlauf, danach 45 Minuten je Quartal
**Durchführung:**
1. `audit/KRANKENKASSEN_ZPP_ROADMAP.md` und `audit/ZPP_ERSTBERATUNG_LEITFADEN.md` als Ausgangsstand nehmen und die dort genannten vier Bausteine gegen den tatsächlichen Stand halten: strukturierter Kurs, Kursmanual mit wissenschaftlicher Fundierung, Qualifikationsnachweis der Kursleitung, eingereichter Antrag.
2. **Anbieterqualifikation** zuerst prüfen, weil sie die härteste Hürde ist: Der GKV-Leitfaden Prävention verlangt für Kursleitungen einen einschlägigen berufsqualifizierenden Abschluss plus Zusatzqualifikation. Feststellen und schriftlich festhalten, wer diese Qualifikation für Soulvay einbringt und ob ein Nachweis vorliegt. Liegt keiner vor, ist der ZPP-Weg unabhängig von allem anderen versperrt — dieser Befund gehört an den Anfang, nicht ans Ende.
3. **Format prüfen:** Feststellen, ob der GKV-Leitfaden das angebotene Format überhaupt trägt. Soulvay ist ein fortlaufender Companion, kein abgeschlossener Kurs mit definierten Einheiten. Diese Differenz konkret benennen — was fehlt, um ein zertifizierungsfähiges Kursformat zu sein.
4. **Evaluationsnachweis:** Aus J6 übernehmen. Ohne dortigen Beleg gibt es hier keinen.
5. **Qualitätsmanagement:** Prüfen, ob ein QM-Nachweis existiert. Unter `docs/` und `compliance/` findet sich zum Stand 28.07.2026 kein QM-Handbuch; die vorhandenen Dokumente sind Datenschutz- und Release-Dokumentation.
6. **Rezertifizierung:** Falls eine Zertifizierung vorliegt oder beantragt wird, das Ablaufdatum und die Drei-Jahres-Frist als Termin mit Vorlauf festhalten.
7. **Zielkonflikt mit L2 auflösen, bevor gebaut wird.** Der ZPP-Weg drängt zu validierten Screenings (PHQ-9, GAD-7, WHO-5) für die Verlaufsmessung; MDCG 2019-11 Annex IV ordnet Software, die Depression anhand eingegebener Symptome bewertet, Regel 11(a) und damit Klasse IIb zu. Diese Entscheidung ist vor jeder Umsetzung zu treffen und in L2 zu dokumentieren, nicht hier.
8. **Externe Klärung erforderlich.** Der ZPP die konkreten Fragen aus `audit/ZPP_ERSTBERATUNG_LEITFADEN.md` (Fragen 1–4) stellen und die Antworten im Wortlaut protokollieren. Eine Selbsteinschätzung zur Zertifizierungsfähigkeit hat keinen Wert; die Prüfstelle entscheidet.

**Belegt durch:** `audit/ZPP_STATUS_<JJJJ-MM-TT>.md` — je Anforderung eine Zeile mit Status, Nachweisdatei und Datum; dazu das Wortlautprotokoll des ZPP-Kontakts mit Datum und Ansprechpartner.

**Bewertung:**
- **100** — Zertifizierung erteilt, alle vier Anforderungen belegt, Rezertifizierungstermin mit Vorlauf gesetzt.
- **70** — Anforderungen einzeln geprüft und dokumentiert, Antrag vorbereitet, eine benannte Lücke bleibt offen (typischerweise Evaluationsnachweis oder Kursformat).
- **0** — **Eine Lücke, die erst im Verfahren auffällt** — also jeder Zustand, in dem gegenüber Krankenkassen kommuniziert wird (`audit/KRANKENKASSEN_EMAIL_TEMPLATES.md`, `audit/krankenkassen-handout.html`), ohne dass Anbieterqualifikation, Evaluationsnachweis, QM und Formatfrage vorab je einzeln geprüft und schriftlich festgehalten sind.

---

### L1 — Zweckbestimmung deklariert und gepflegt

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 3 Stunden im ersten Durchlauf, danach 45 Minuten je Quartal
**Durchführung:**
1. Prüfen, ob ein Zweckbestimmungsdokument existiert. Unter `compliance/`, `docs/` und `audit/` ist zum Stand 28.07.2026 keines auffindbar — `grep -rliE "zweckbestimmung|intended purpose" compliance/ docs/ audit/ src/` liefert nur Treffer in `audit/TEST_FRAMEWORK.md` selbst.
2. Falls keines existiert, `compliance/ZWECKBESTIMMUNG_<JJJJ-MM-TT>.md` anlegen mit genau diesen Feldern, jedes einzeln ausgefüllt: beabsichtigter Zweck in einem Satz · Zielgruppe (Alter, Zustand, Ausschlüsse) · beabsichtigte Nutzungsumgebung · was das Produkt ausdrücklich **nicht** tut · Nutzerprofil des Betreibenden · Version und Datum.
3. Bei der Formulierung des Zwecksatzes die MDR-Schwelle beachten: Die Begriffe Diagnose, Verhütung, Überwachung, Vorhersage, Prognose, Behandlung und **Linderung** einer Krankheit sind qualifizierungsrelevant. Ein Zwecksatz, der eines dieser Wörter enthält, entscheidet L2 faktisch vor — das ist bewusst zu tun oder bewusst zu unterlassen, aber nicht versehentlich.
4. Ausschlussliste konkret machen, nicht abstrakt: „nicht zur Diagnose", „nicht zur Behandlung", „kein Ersatz für Therapie", „nicht für akute Krisen als alleinige Anlaufstelle", „nicht für Personen unter X Jahren". Die Altersangabe muss zu dem passen, was die App tatsächlich durchsetzt — eine Altersfeststellung ist in `src/pages/Onboarding.tsx` und `src/pages/Auth.tsx` derzeit nicht auffindbar (Gerüstpunkt B15).
5. Rückwärtsabgleich: Die Fundliste aus J3 gegen den Zwecksatz halten. Jede Aussage, die mehr verspricht als die Zweckbestimmung hergibt, ist ein Befund — entweder die Aussage wird zurückgenommen oder die Zweckbestimmung ändert sich, und dann ist L2 neu zu bewerten. Beide Richtungen sind zulässig, aber sie müssen zusammenpassen.
6. Pflegeregel festlegen: Bei welcher Produktänderung wird die Zweckbestimmung angefasst? Verknüpfung mit J8 (Nachmarkt) und L4 (neue Auswertungslogik) herstellen und dort verweisen.
7. **Vorlage an die Fachperson:** Die Zweckbestimmung ist das Dokument, auf dem die gesamte L2-Prüfung aufsetzt. Sie ist der Fachperson als Erstes vorzulegen, zusammen mit der J3-Fundliste und den Systemprompts.

**Belegt durch:** `compliance/ZWECKBESTIMMUNG_<JJJJ-MM-TT>.md` mit Versionsnummer und Datum, dazu die Abgleichtabelle aus Schritt 5.

**Bewertung:**
- **100** — Zweckbestimmung vorhanden, versioniert, datiert; alle Nutzertexte dagegen abgeglichen; ein automatischer Test prüft, dass die Ausschlussformulierungen an den definierten Erstkontaktpunkten tatsächlich gerendert werden, und bricht bei Wegfall.
- **70** — Zweckbestimmung vorhanden und intern konsistent, der Textabgleich ist aber noch nicht über alle Flächen geführt (typischerweise Systemprompts und Kassen-Handout offen).
- **0** — **Keine Zweckbestimmung vorhanden.** Das ist der Stand vom 28.07.2026.

---

### L2 — Qualifizierungs-Prüfung nach MDR (MDCG 2019-11)

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 4 Stunden für die eigene Vorbereitung; die Entscheidung selbst liegt bei der Fachperson
**Durchführung:**

Die folgenden Fragen sind die Entscheidungsschritte aus MDCG 2019-11 in abarbeitbarer Reihenfolge. Jede wird schriftlich beantwortet, mit Begründung und Fundstelle im Code. Die genannte Folge sagt, wohin die Antwort führt — die verbindliche Einordnung trifft die Fachperson.

1. **Frage 1 — Ist es Software im Sinne der Leitlinie?** Ein Satz Anweisungen, der Daten verarbeitet. Antwort für Soulvay: ja. *Folge: weiter zu Frage 2.* Eine Nein-Antwort wäre hier nicht vertretbar.
2. **Frage 2 — Ist es ein Zubehör zu einem Medizinprodukt oder steuert es ein Medizinprodukt?** Prüfen, ob Schnittstellen zu Geräten oder Gesundheitsplattformen bestehen (`capacitor.config.ts` und die Plugin-Liste in `package.json` durchsehen, insbesondere HealthKit/Google Fit). *Folge: Ja → eigener Qualifizierungspfad als Zubehör, direkt zur Fachperson. Nein → weiter zu Frage 3.*
3. **Frage 3 — Führt die Software eine Handlung an Daten aus, die über Speichern, Archivieren, Kommunikation, einfache Suche und verlustfreie Kompression hinausgeht?** Konkret zu prüfende Fundstellen: `src/lib/moodExerciseMap.ts` (Auswahllogik), `src/pages/Mood.tsx:199` (Mittelwertbildung), `src/pages/Timeline.tsx:165` (Tagesmittel), `supabase/functions/detect-patterns/`, `supabase/functions/session-insight/`, `supabase/functions/weekly-recap/`, `supabase/functions/extract-memories/`. *Folge: Nein → kein Medizinprodukt, Prüfung endet hier mit Begründung. Ja → weiter zu Frage 4.* Für Soulvay ist die Antwort nach Aktenlage ja; das ist der entscheidende Schritt und darf nicht abgekürzt werden.
4. **Frage 4 — Geschieht diese Handlung zum Nutzen einzelner Patienten?** Nicht: dient sie der Allgemeinheit oder der Statistik. *Folge: Nein → in der Regel kein Medizinprodukt. Ja → weiter zu Frage 5.* Für ein Produkt, dessen Ausgaben individuell auf die Eingaben eines Menschen zugeschnitten sind, ist die Antwort ja.
5. **Frage 5 — Erfüllt der beabsichtigte Zweck die Definition nach MDR Art. 2(1)?** Also: Diagnose, Verhütung, Überwachung, Vorhersage, Prognose, Behandlung oder **Linderung** von Krankheit, Verletzung oder Behinderung. Grundlage der Antwort ist ausschließlich die Zweckbestimmung aus L1 plus die tatsächlichen Aussagen aus L3 — nicht die Absicht des Betreibers. *Folge: Nein → kein Medizinprodukt; Ergebnis mit Begründung und Datum festhalten und bei jeder Zweckänderung neu prüfen. Ja → Medizinprodukt, weiter zu Frage 6.*
6. **Frage 6 — Klassifizierung nach Regel 11.** Software, die Informationen für Entscheidungen zu diagnostischen oder therapeutischen Zwecken liefert, ist mindestens Klasse IIa; führt sie zu einer schwerwiegenden Verschlechterung oder chirurgischem Eingriff, Klasse IIb. MDCG 2019-11 Annex IV nennt ausdrücklich: Software zur Bewertung von Depression anhand eingegebener Symptomdaten ist **Klasse IIb** nach Regel 11(a). *Folge: Klasse IIa oder höher → Benannte Stelle, klinische Bewertung, QM-System nach ISO 13485, technische Dokumentation. Das ist eine Vertriebsfrage, keine Dokumentationsfrage.*
7. **Gegenprobe am Referenzbeispiel.** MDCG 2019-11 Abschnitt 3.2, Note 4 führt als Medizinprodukt-Beispiel wörtlich Software auf, die Depression bewertet, überwacht und behandelt, dem Patienten Fragebögen zu Stimmung, Symptomen und Aktivitäten gibt und **individuell ausgewählte Übungen** anbietet. Diesen Wortlaut Merkmal für Merkmal gegen Soulvay halten: Stimmungsfragen (`src/pages/Mood.tsx`), Tagebuch (`src/pages/Journal.tsx`), individuell ausgewählte Übungen (`src/lib/moodExerciseMap.ts`). Übereinstimmungen und Unterschiede tabellarisch festhalten — insbesondere, dass Soulvay derzeit **kein** validiertes Screening enthält. Dieser Unterschied ist der wesentliche Abstand zum Beispiel und darf nicht ohne L2-Neubewertung aufgegeben werden.
8. **Vorlage an die Fachperson.** Zu übergeben: die Antworten auf Fragen 1–7 mit Begründung und Codefundstellen, die Zweckbestimmung aus L1, die vollständige Textliste aus L3 einschließlich Systemprompts, die J3-Fundliste sowie die ZPP-Absicht aus J11 mit dem dort beschriebenen Zielkonflikt. Zusätzlich zwei ausdrückliche Fragen: „Fällt das Produkt in seiner heutigen Ausgestaltung unter die MDR?" und „Welche der geplanten Erweiterungen — validiertes Screening, Verlaufskennzahl, strukturierter Kurs — würde diese Antwort ändern?"

**Belegt durch:** `compliance/MDR_QUALIFIZIERUNG_<JJJJ-MM-TT>.md` mit den acht Schritten, je Antwort eine Begründung und eine Codefundstelle; abschließend die datierte und unterschriebene Einschätzung der Fachperson.

**Bewertung:**
- **100** — Alle Schritte beantwortet, die Einschätzung liegt datiert und extern bestätigt vor, die Auslöser für eine Neubewertung sind in J8 verankert.
- **70** — Alle Schritte selbst beantwortet und dokumentiert, die externe Bestätigung steht aus; die Entscheidung ist damit vorbereitet, aber nicht getragen.
- **0** — **Keine dokumentierte Einschätzung.** Das ist der Stand vom 28.07.2026: keine Datei in `compliance/`, `docs/` oder `audit/` enthält eine Qualifizierungsprüfung. Nach der Regel „ungeprüfte Punkte zählen als 0" ist L2 der schwerste offene Punkt der Gruppe, weil an ihm L1, L3, L4, L5, J3 und J11 hängen.

---

### L3 — Texte begründen keine medizinische Zweckbestimmung

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 2 Stunden, aufbauend auf der J3-Fundliste
**Durchführung:**
1. Die Fundliste aus J3 als Ausgangsmenge nehmen und um die Flächen erweitern, die J3 nicht als Werbung führt: Onboarding-Texte (`src/pages/Onboarding.tsx`), Leertexte (`src/translations/emptyStates.ts`), Push- und E-Mail-Texte, sowie die Rechtstexte selbst (`src/pages/Terms.tsx`, `src/pages/About.tsx`).
2. **Systemprompts gesondert und vollständig erfassen** — sie sind der Teil, den man am leichtesten vergisst und der am meisten aussagt: `src/data/companionAgentPrompts.ts` sowie die serverseitigen Prompts in `supabase/functions/chat/index.ts`, `journal-reflect/index.ts`, `session-insight/index.ts`, `weekly-recap/index.ts`, `generate-summary/index.ts`, `detect-patterns/index.ts`, `extract-memories/index.ts`. Für jeden Prompt notieren: Wie beschreibt er die Rolle des Modells? Enthält er Anweisungen, die auf Symptomlinderung, Zustandsbewertung oder Verlaufsdeutung zielen?
3. Gegen die **MDR-Schwelle** filtern, nicht gegen die HWG-Schwelle. Diese liegt niedriger: Bereits „lindert", „hilft gegen", „reduziert Symptome", „überwacht deinen Zustand", „erkennt Muster in deinem Befinden" sind qualifizierungsrelevant, auch ohne jedes Heilversprechen. Suchbegriffe DE: lindert, hilft bei, hilft gegen, reduziert, mindert, verbessert dein Befinden, überwacht, erkennt, beurteilt, wertet aus, Verlauf, Symptom, Zustand, Krankheit, Störung, Angst, Depression, Burnout. EN entsprechend.
4. Je Treffer eintragen: Fundstelle · Wortlaut · Fläche · Bezug auf Krankheit ja/nein · MDR-relevant nach Frage 5 aus L2 ja/unklar/nein.
5. Zum Stand 28.07.2026 vorab zu behandeln: der Produkttitel „Dein psychologischer Begleiter" / „Your Psychological Companion" (`index.html:20`/`:21`, `public/manifest.json`) sowie die Play-Rubrik „STIMMUNGS-TRACKING — Erkenne Zusammenhänge in deinem Wohlbefinden" und „Visualisiere deine emotionalen Muster" (`docs/google-play-store-listing.md`). „Erkennen" und „Muster" sind Überwachungsvokabular.
6. Kollisionen zwischen Flächen suchen: Ein Text kann in der App zurückhaltend und im Store weitgehend sein. Beide Fassungen nebeneinanderstellen; im Zweifel gilt die weitergehende.
7. **Juristische Bewertung erforderlich.** Die Tabelle geht zusammen mit L2 an dieselbe Fachperson. Die Frage lautet nicht „ist das Werbung?", sondern „begründet eine dieser Formulierungen eine medizinische Zweckbestimmung im Sinne von MDR Art. 2(1)?".

**Belegt durch:** `compliance/TEXTABGLEICH_MDR_<JJJJ-MM-TT>.md` mit der vollständigen Trefferliste einschließlich aller Systemprompts, je Zeile eine Einstufung und das Datum.

**Bewertung:**
- **100** — Alle vier Flächengruppen (Werbung, Store, Onboarding, Systemprompt) erfasst und bereinigt; ein Testfall prüft die Sperrwortliste aus Schritt 3 gegen `src/translations/*.ts` **und** gegen die Prompt-Dateien und bricht den Build bei einem neuen Treffer.
- **70** — Alle Flächen geprüft und bereinigt, aber die Systemprompts nur in der aktuellen Fassung, ohne Absicherung gegen künftige Änderungen — Lücke dokumentiert.
- **0** — **Eine Formulierung überschreitet** die Schwelle. Ebenfalls 0, wenn die Systemprompts nicht in die Prüfung einbezogen wurden: Was das Modell im Auftrag des Anbieters über sich selbst und seine Wirkung sagt, ist eine Aussage des Anbieters.

---

### L4 — Auswertungslogik als Qualifizierungsrisiko

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 90 Minuten
**Durchführung:**
1. Vollständige Liste aller Stellen erstellen, an denen Stimmungs- oder Textdaten zu einer Aussage über den Nutzer verdichtet werden. Belegter Ausgangsstand zum 28.07.2026: `src/pages/Mood.tsx:199` (`averageMood`, Anzeige mit einer Nachkommastelle in Zeile 344), `src/pages/Timeline.tsx:165` (`moodAverage` je Tag), `src/pages/Summary.tsx`, `src/components/journal/WeeklyRecap.tsx`, `supabase/functions/detect-patterns/`, `supabase/functions/session-insight/`, `supabase/functions/weekly-recap/`, `supabase/functions/generate-summary/`, `src/translations/journal.ts:87` (Sentiment-Vorschlag).
2. Je Stelle drei Angaben festhalten: Welche Eingaben gehen ein? Welche Ausgabe entsteht (Zahl, Text, Kategorie)? Wird die Ausgabe dem Nutzer als Aussage über seinen Zustand präsentiert? Die dritte Frage ist die entscheidende — ein intern berechneter Mittelwert ist etwas anderes als ein angezeigter.
3. Prüfen, ob irgendwo ein **validiertes Screening** vorkommt: `grep -rniE "PHQ|GAD-7|WHO-5|BDI|Fragebogen|questionnaire|screening" src/ supabase/`. Zum Stand 28.07.2026 ist keines zu erwarten; jeder Treffer wäre sofort L2-relevant und nach Regel 11(a) potenziell Klasse IIb.
4. Prüfen, ob eine **automatische Verlaufsbewertung** existiert — also eine Aussage der Form „dir geht es besser/schlechter als letzte Woche". Die Wochenrückblick-Funktion und `src/lib/recapGuidelines.ts` sind die wahrscheinlichsten Fundorte. Wortlaut der erzeugten Aussagen aus einem echten Lauf mitschneiden, nicht aus dem Prompt ableiten.
5. Eine Vorabregel schriftlich festlegen und in `audit/TEST_FRAMEWORK.md`-Nachbarschaft ablegen: Jede neue Aggregation, jede neue Kennzahl und jedes neue Screening durchläuft **vor** der Implementierung die Fragen 3 bis 6 aus L2. Die Regel gehört in die Auslöserliste von J8.
6. Den Zielkonflikt für die Entscheidungsvorlage aufbereiten: `audit/MESSWERTE_2026-07-27.md` nennt das fehlende validierte Screening als Lücke für die Verlaufsmessung und den Kassenweg; MDCG 2019-11 Annex IV ordnet genau diese Funktion Klasse IIb zu. Beide Sätze nebeneinander an die Fachperson geben, mit der Frage, welche Ausbaustufe die Qualifizierung kippt.

**Belegt durch:** `compliance/AUSWERTUNGSLOGIK_<JJJJ-MM-TT>.md` mit einer Zeile je Auswertungsstelle, den mitgeschnittenen Ausgabewortlauten und der Vorabregel aus Schritt 5.

**Bewertung:**
- **100** — Alle Auswertungsstellen erfasst und einzeln bewertet; Vorabregel schriftlich und in J8 verankert; ein Test schlägt an, wenn eine neue aggregierende Funktion oder ein Screening-Begriff im Kernpfad auftaucht, ohne dass ein Eintrag in der Bewertungsdatei existiert.
- **70** — Alle Stellen erfasst und bewertet, Vorabregel vorhanden, aber ohne maschinelle Absicherung gegen die nächste Erweiterung.
- **0** — **Einführung ohne vorherige Einschätzung**: eine Aggregation, Kennzahl oder Screening-Funktion ist im Produkt, ohne dass vor ihrer Umsetzung eine dokumentierte Qualifizierungsbewertung vorlag. Da L2 zum Stand 28.07.2026 gar nicht existiert, trifft das derzeit auf sämtliche bereits vorhandenen Auswertungsstellen zu.

---

### L5 — Individualisierte Empfehlung auf Basis erhobener Symptome

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 60 Minuten
**Durchführung:**
1. Die Empfehlungslogik im Wortlaut lesen, nicht zusammenfassen: `src/lib/moodExerciseMap.ts`. Der belegte Stand zum 28.07.2026: `shouldOfferExercise(moodValue)` löst bei einem Stimmungswert ≤ 2 auf einer Skala von 1–5 aus; `getRecommendedExerciseId(moodValue, feelings)` wählt danach anhand der Gefühlsangaben aus — `anxious` → `grounding-54321`, `stressed`/`overwhelmed` → `breathing-478`, `tired` → `body-scan`, sonst `breathing-60`.
2. Diese Kette in einem Satz aufschreiben und der Formulierung aus MDCG 2019-11 Abschnitt 3.2 Note 4 gegenüberstellen: erhobene Zustandsangaben → Schwellenwert → individuell ausgewählte Übung. Die strukturelle Übereinstimmung mit dem dort genannten Medizinprodukt-Beispiel ist zu benennen, auch wenn die Übungen selbst unspezifisch sind.
3. Auslieferungsweg prüfen: Wie wird die Empfehlung dem Nutzer präsentiert? Der Auto-Start über `location.state.startExercise` und die Darstellung in `src/pages/Toolbox.tsx` / `src/components/toolbox/ExercisePlayer.tsx` ansehen. Feststellen, ob die Übung als Vorschlag erscheint oder ob sie automatisch startet — Automatik verschiebt die Wahrnehmung von Angebot zu Anordnung.
4. Weitere Empfehlungspfade suchen, die nicht in `moodExerciseMap.ts` liegen: `src/hooks/usePersonalization.ts`, `src/lib/topicExerciseTranslations.ts`, `src/pages/Topics.tsx` sowie alle Stellen, an denen das Modell im Chat eine Übung nennt (Systemprompts aus L3 Schritt 2 daraufhin durchsehen). Eine vom Modell frei gesprochene Empfehlung ist ebenfalls eine individualisierte Empfehlung, nur ohne Codepfad.
5. Den Begleittext prüfen: Welche Formulierung steht bei der Empfehlung? Enthält sie eine Wirkbehauptung („beruhigt das Nervensystem" steht so als Kommentar im Quelltext von `moodExerciseMap.ts`) und erscheint diese Begründung auch in der Oberfläche? Falls ja, ist sie zusätzlich ein J3- und L3-Befund.
6. Vorabregel aus L4 Schritt 5 auf Empfehlungen ausdehnen: Jede neue Zuordnung Zustand → Maßnahme wird vor der Umsetzung gegen L2 geprüft.
7. **Vorlage an die Fachperson:** der Satz aus Schritt 2, der Quelltext von `moodExerciseMap.ts`, ein Screenshot des tatsächlichen Ablaufs auf dem Gerät und die Liste der Modell-Empfehlungen aus Schritt 4.

**Belegt durch:** `compliance/EMPFEHLUNGSLOGIK_<JJJJ-MM-TT>.md` mit der Regelkette im Wortlaut, dem Gerätescreenshot des Ablaufs und der Gegenüberstellung zum MDCG-Beispiel.

**Bewertung:**
- **100** — Alle Empfehlungspfade — codebasiert wie modellgeneriert — erfasst und bewertet; die Bewertung ist in L2 eingegangen; ein Test schlägt an, wenn eine neue Zustand-zu-Maßnahme-Zuordnung ohne Eintrag in der Bewertungsdatei ausgeliefert wird.
- **70** — Der codebasierte Pfad (`moodExerciseMap.ts`) ist vollständig erfasst und bewertet, die modellgenerierten Empfehlungen im Chat sind als bekannte Lücke dokumentiert, aber nicht systematisch erhoben.
- **0** — **Ungeprüft eingeführt.** Die Mood-Übungs-Brücke ist im Produkt aktiv, ohne dass vor ihrer Einführung eine Qualifizierungsbewertung vorlag; solange L2 fehlt, steht L5 auf 0.
