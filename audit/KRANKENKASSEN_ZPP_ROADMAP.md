# ZPP-Zertifizierung — Roadmap für Soulvay

**Track 1 des Krankenkassen-Outreach**. Der eigentliche Hebel: Ein einziges Zertifikat öffnet ALLE gesetzlichen Kassen. Diese Doku fasst zusammen was ZPP-Zertifizierung bedeutet, ob Soulvay dafür in Frage kommt, was es kostet und wie lange es dauert.

---

## Was ist ZPP?

**Zentrale Prüfstelle Prävention** — von den GKV-Spitzenverbänden getragene Prüfstelle für Präventionskurse nach § 20 Abs. 4 SGB V. Zertifizierte Kurse werden von allen gesetzlichen Kassen zu 80-100 % erstattet.

**Website**: https://www.zentrale-pruefstelle-praevention.de

**Rechtsgrundlage**: § 20 SGB V (Primäre Prävention und Gesundheitsförderung durch die Krankenkassen). Der GKV-Leitfaden Prävention (aktuelle Fassung) definiert die Anforderungen.

---

## Vier Handlungsfelder — welches passt zu Soulvay

Der Leitfaden Prävention unterscheidet vier Handlungsfelder. Für Soulvay relevant:

1. **Bewegungsgewohnheiten** — irrelevant
2. **Ernährung** — irrelevant
3. **Stressmanagement** ← **Soulvay-Fit** (Umgang mit Stress, Entspannungstechniken)
4. **Suchtmittelkonsum** — irrelevant

Handlungsfeld **Stressmanagement** hat zwei Präventionsprinzipien:
- **Förderung von Stressbewältigungskompetenzen (multimodales Stressmanagement)** ← Soulvay
- **Förderung von Entspannung** ← teilweise Soulvay (Übungen wie 5-4-3-2-1 Grounding, Breathing)

---

## Passt Soulvay inhaltlich?

**Vorteile**:
- CBT-basierte Übungen (kognitive Umstrukturierung, Achtsamkeit) sind wissenschaftlich anerkannt
- Journaling ist wissenschaftlich fundiert (Pennebaker-Studien)
- Multiplattform (iOS, Android, Web) — Zugang für Mitglieder überall
- Deutschsprachig, DACH-Zielgruppe

**Herausforderungen**:
- ZPP fordert **strukturierten Kursablauf** mit klar definierten Sessions (z.B. 8 Wochen × 60 Min). Soulvay ist aktuell offen-explorativ, nicht kursförmig
- **Kursleiter-Qualifikation**: Der Kurs muss von qualifizierten Personen erstellt sein (Psychologe/Therapeut). Bei rein digitalen Kursen: Nachweis, dass Inhalte von qualifiziertem Fachpersonal verantwortet sind
- **Evaluationsnachweis**: Nachweis der Wirksamkeit (nicht zwingend eigene RCT, aber Bezug auf evidenzbasierte Methoden)
- **Manual + Kursleitfaden**: Detaillierte Beschreibung der Sessions, Übungen, Materialien
- **Digitale Kurse haben eigene Anforderungen**: Der Präventionsleitfaden hat einen Anhang zu **Online-Präventionskursen** (Kap. 5.2, Anlage 8) mit erhöhten Nachweispflichten

---

## Was Soulvay konkret bauen müsste

### 1. Ein strukturierter 8-Wochen-Kurs "Stress-Kompass" (Arbeitstitel)

**Struktur** (Beispielskizze):
- **Woche 1**: Was ist Stress? Selbst-Assessment via geführtes Journaling
- **Woche 2**: Trigger identifizieren via Chat-Reflexion
- **Woche 3**: 5-4-3-2-1 Grounding + Atemübung
- **Woche 4**: Kognitive Umstrukturierung (Gedanken hinterfragen)
- **Woche 5**: Werte-Klärung
- **Woche 6**: Grenzen setzen
- **Woche 7**: Mikro-Rituale für den Alltag
- **Woche 8**: Rückblick, Transferplan, Abschluss

**Innerhalb der App**: Ein neuer "Kurs-Modus", der Nutzer wochenweise durchführt, mit definierten Übungen pro Session und automatischen Erinnerungen.

**Aufwand technisch**: 2-3 Wochen Entwicklung (Session-Progression, Erinnerungen, Zertifikat-Ausstellung am Ende).

### 2. Kursmanual + wissenschaftliche Fundierung

**Kursmanual**: Detaillierte Beschreibung aller 8 Sessions, Übungen, Lernziele, Methoden. ~40-60 Seiten.

**Wissenschaftliche Fundierung**: Zitate/Verweise auf CBT-Literatur, Achtsamkeits-Forschung (Kabat-Zinn, Segal), Stress-Forschung (Lazarus). Kein eigenes RCT nötig, aber saubere evidenzbasierte Referenzen.

**Aufwand**: 4-6 Wochen. Am besten mit externer Psychologin/Psychotherapeutin.

### 3. Qualifikationsnachweis

**Option A**: Externe qualifizierte Person, die den Kurs inhaltlich verantwortet und namentlich in den Unterlagen erscheint. Das ist der übliche Weg für App-Anbieter ohne eigenes Fachpersonal.

**Option B**: Kooperation mit einer psychotherapeutischen Praxis / Klinik als "wissenschaftliche Partnerin". Die verifiziert die Inhalte, wird als Partner geführt.

**Für Soulvay**: Option B ist stärker positioniert. Bereits vorhanden im Kopf: **Jutta Jansen** (in Safety.tsx als real benannte Psychologin mit juttajansen.com verlinkt). Falls sie eine formelle wissenschaftliche Partnerin sein möchte, wäre das ein natürlicher Schritt.

### 4. Antrag bei ZPP einreichen

**Antragsunterlagen** (Auszug):
- Kursleitfaden (mit den 8 Sessions)
- Kursmanual (didaktische Aufbereitung)
- Trainer-/Anbieter-Qualifikationsnachweise
- Evaluationsnachweis oder wissenschaftliche Fundierung
- Nachweis der digitalen Umsetzung (Screenshots, Konzept, technische Beschreibung)
- Datenschutz-Nachweis (DSGVO-Konformität, TOM-Beschreibung)
- Barrierefreiheits-Erklärung (WCAG-Level oder Gleichwertigkeit)

**Antragsgebühr**: 800-1.500 € (Erst-Zertifizierung, gestaffelt nach Umfang).

**Prüfdauer**: 8-16 Wochen ab vollständigem Antrag.

**Gültigkeit**: 3 Jahre, danach Re-Zertifizierung.

---

## Kosten-Schätzung (Solo-Founder-Realistic)

| Position | Kosten |
|---|---|
| Kurs-Manual erstellen (extern, Psychologin) | 3.000 - 5.000 € |
| Technische Umsetzung Kurs-Modus in App | 0 € (Solo-Founder mit Claude Code) |
| Wissenschaftliche Partnerin einbinden (Formalisierung) | 0 - 1.500 € |
| ZPP-Antragsgebühr | 800 - 1.500 € |
| Beratung durch spezialisiertes Büro (optional) | 2.000 - 5.000 € |
| Wiedervorlage / Nachbesserungen | 500 - 1.500 € |
| **Total (unteres Ende)** | **~4.300 €** |
| **Total (Empfehlung mit Beratung)** | **~10.000 €** |

**Zeit-Investition**: 3-6 Monate parallel zum operativen Geschäft.

---

## Alternative: DiGA-Weg (langfristig)

DiGA = Digitale Gesundheitsanwendung, BfArM-gelistet, auf Rezept verschreibbar.

**Vergleich**:

| Aspekt | ZPP | DiGA |
|---|---|---|
| Marktzugang | GKV-Präventionskurs-Katalog | BfArM-DiGA-Verzeichnis |
| Erstattung | 80-100 % Präventionsleistung | Vollständig auf Rezept |
| Nachweispflicht | Wissenschaftliche Fundierung | Klinische Studie (RCT) |
| Kosten | 4-10k € | 150-300k € |
| Dauer | 3-6 Monate | 12-24 Monate |
| MDR-Compliance | Nicht zwingend | Zwingend (Medizinprodukt Klasse IIa) |
| Umsatzpotenzial pro User | 100-200 €/Kurs | 300-600 € pro 3 Monate |

**Empfehlung**: ZPP zuerst. DiGA als Track-4-Option in 2027 wenn ZPP läuft und Umsatz da ist.

---

## Entscheidungs-Fragen für den Solo-Founder

Konkret zu klären bevor Track 1 startet:

1. **Ist Jutta Jansen bereit, formelle wissenschaftliche Partnerin für den Präventionskurs zu werden?** Das würde die Qualifikationsfrage lösen und Soulvay glaubwürdiger machen.

2. **Ist Budget von ~4-10k € über 3-6 Monate darstellbar?**

3. **Ist die Bereitschaft da, den 8-Wochen-Kurs technisch in die App zu bauen?** (2-3 Wochen Entwicklung — ist mit Claude Code + du selbst überschaubar)

4. **Beratung ja/nein?** Es gibt spezialisierte Büros für ZPP-Zertifizierung. Kostet 2-5k € extra, spart 1-2 Monate Zeit und die Chance auf Erst-Zulassung ohne Nachbesserung ist deutlich höher.

Vorgeschlagene Beratungen (nur Recherche, keine Empfehlung):
- SCHUBS Präventionskurse (schubs-praevention.de) — spezialisiert auf digitale Kurse
- prevaid (prevaid.de) — Zertifizierungs-Support
- ZPP direkt anrufen: Erste Beratung durch die ZPP selbst ist kostenlos, sehr sinnvoll

---

## Erste 3 konkrete Schritte

1. **ZPP direkt kontaktieren** (kostenlos): https://www.zentrale-pruefstelle-praevention.de → Kontakt. Anfrage: "Wir planen einen digitalen 8-Wochen-Präventionskurs 'Stressmanagement' — welche Anforderungen sind für den Antrag zu erfüllen? Können wir eine Erstberatung vereinbaren?" Antwort dauert 1-3 Wochen.

2. **Mit Jutta Jansen sprechen** über Rolle als wissenschaftliche Partnerin. Formaler Kooperationsvertrag denkbar (kann ich formulieren wenn du willst).

3. **GKV-Leitfaden Prävention** (aktuelle Fassung) laden und Kapitel Stressmanagement + Anhang Online-Kurse durcharbeiten: https://www.gkv-spitzenverband.de/gkv_spitzenverband/presse/publikationen_broschueren/publikationen.jsp

Ist die Entscheidung für Track 1 gefallen, folgt ein detaillierter Projektplan als eigenes Doc.

---

## Warum das der große Wurf ist

Ein ZPP-zertifizierter Kurs erlaubt Soulvay eine völlig andere Ansprache:

**Vor ZPP** (jetzt):
> "Hallo Innovation-Team, wir sind eine Mental-Health-App und würden gerne kooperieren."
> → 0,5-2 % Response.

**Mit ZPP-Zertifikat**:
> "Hallo, unser 8-Wochen-Stressmanagement-Kurs ist ZPP-zertifiziert und wird von allen GKV erstattet. Wir würden gerne besprechen, wie Ihre Mitglieder Zugang erhalten."
> → 15-30 % Response, weil die Kasse dann nur noch die Umsetzung klärt, nicht die Zulassung.

Das ist der Unterschied zwischen "Verkäufer klopft an" und "Anbieter für den die Kasse bereits einen Erstattungsanspruch hat".

Deshalb: **ZPP zuerst, alles andere zweitrangig.**
