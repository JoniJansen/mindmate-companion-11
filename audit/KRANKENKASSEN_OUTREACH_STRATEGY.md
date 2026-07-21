# Krankenkassen-Outreach — Master-Strategie

**Stand**: 2026-07-16. Solo-Founder, Soulvay live im App Store, Einstieg in den deutschen Kassenmarkt.

Diese Doku fasst die 3-Track-Strategie zusammen und legt die Reihenfolge der Aktivitäten fest. Die konkreten Deliverables liegen in den verlinkten Detail-Docs.

---

## Warum nicht "alle 90 Kassen kalt anschreiben"

Kurz-Diagnose, damit die Entscheidung dokumentiert ist:

- Response-Rate für Cold-Mass-B2B im Kassenmarkt: 0,5-2 %. Bei 90 Adressen sind das 1-2 lauwarme Antworten.
- Positionierung als "noch eine Wellness-App die reindrückt" **schwächt** Soulvay bei genau den progressiven Kassen (TK, HKK), die am meisten Wert liefern könnten.
- Innovation-Manager erkennen Templates in <5 Sekunden. Mass-Mail = automatischer Papierkorb.
- Zeitinvest identisch: 90 Mass-Mails kosten dieselben ~15 Std wie 15 personalisierte + 1 ZPP-Antrag vorbereiten.

**Konsequenz**: Konzentrierte Qualität schlägt breite Quantität. Drei Tracks parallel, nicht Cold-Blast.

---

## Die drei Tracks

### Track 1 — ZPP-Zertifizierung (langfristig, echter Hebel)

**Was**: Zertifizierung als Präventionskurs nach § 20 SGB V bei der Zentralen Prüfstelle Prävention (ZPP).

**Impact**: Öffnet **alle gesetzlichen Kassen automatisch**. Mitglieder können Soulvay als Präventionskurs buchen, Kasse erstattet 80-100 %.

**Aufwand**: 3-6 Monate, ~3-5k € (Zertifizierungs-Gebühren + kursleitfaden-Erstellung).

**Detail-Doc**: `audit/KRANKENKASSEN_ZPP_ROADMAP.md`

### Track 2 — Gezielter Outreach an 15 digital-aktive Kassen (mittelfristig)

**Was**: Personalisierter, warmer Outreach an Innovation-Manager namentlich, nicht `info@`.

**Impact**: 1-3 Pilot-Kooperationen realistisch. Referenzen für Track 1 aufbauen. Marktverständnis.

**Aufwand**: 2-3 Std Recherche + Personalisierung pro Kasse. 15 Kassen = ~30 Std verteilt über 4-6 Wochen inkl. Follow-ups.

**Detail-Doc**: `audit/KRANKENKASSEN_TARGET_LIST.md`

### Track 3 — Krankenkassen-Handout als professionelles Asset

**Was**: Ein-PDF-Handout, adaptierbar für alle drei Tracks. Landing-Page-URL auf soulvay.de/krankenkassen.

**Impact**: Reduziert Rückfrage-Loops. Wirkt professionell. Kann in E-Mails verlinkt, auf Messen ausgeteilt, an ZPP-Antrag angehängt werden.

**Aufwand**: Content fertig (siehe `KRANKENKASSEN_HANDOUT.md`). PDF-Setzung + Hosting: 1-2 Std.

**Detail-Doc**: `audit/KRANKENKASSEN_HANDOUT.md`

---

## Reihenfolge — was wann

**Woche 1-2 (jetzt)**:
- ✅ Handout finalisieren (Content-Draft steht, siehe Detail-Doc)
- ✅ IONOS-Setup: `partner@soulvay.de` einrichten mit Impressum-Signatur
- ✅ E-Mail-Templates in IONOS-Drafts speichern
- ✅ Tracking-Sheet in Google Sheets erstellen
- ✅ ZPP-Anforderungen studieren, Entscheidung ob Track 1 weitergeht

**Woche 3-4**:
- Top-5 Kassen (TK, HKK, Barmer, IKK classic, AOK Bayern) personalisiert kontaktieren
- Innovation-Manager auf LinkedIn identifizieren (nicht `info@` sondern namentlich)
- ZPP-Antrag vorbereiten falls Entscheidung positiv

**Woche 5-8**:
- Follow-ups bei Track 2 Woche 3-4
- Nächste 10 Kassen (Rang 6-15) kontaktieren
- ZPP-Antrag einreichen

**Woche 9-24**:
- ZPP-Prüfung läuft (autonom, Wartezeit)
- Track-2-Deals konkretisieren (Meetings, Pilot-Angebote)
- Bei ZPP-Erfolg: Broadcast an alle ~90 Kassen mit "Wir sind jetzt ZPP-zertifiziert"

**Erst dann (ab Monat 6-9)** wird ein Mass-Outreach an alle Kassen strategisch sinnvoll — mit der Info "ZPP-zertifiziert" ist die Response-Rate 10-50x höher als bei kaltem "Hallo, wir sind eine App".

---

## Tool-Setup

### E-Mail-Infrastruktur

**Empfehlung**: IONOS + manueller Send (kein Marketing-Tool für 15 Adressen).

**Setup**:
1. In IONOS Kontrollzentrum: Postfach `partner@soulvay.de` einrichten (nicht `info@`, das ist zu generisch)
2. Alternativ oder zusätzlich: `kontakt@soulvay.de` für allgemeinen Support
3. E-Mail-Client-Setup:
   - **Mac Mail** oder **Apple Mail** mit IMAP/SMTP
   - **Alternative**: Missive (missiveapp.com) — 15€/Monat, unified inbox, Templates, Follow-up-Reminder, aber overkill für Start
4. Signatur (Pflicht nach § 5 TMG / § 5a UWG):

```
Soulvay
Jonathan Jansen
partner@soulvay.de · www.soulvay.de

Impressum: www.soulvay.de/impressum
Datenschutz: www.soulvay.de/datenschutz
```

Vollständige Adresse muss im Impressum stehen — die Signatur muss dorthin **verlinken**, nicht die Adresse enthalten (Solo-Founder-Home-Adresse geht meist über Postfach-Adresse oder Impressumsservice).

### Cold-Outreach-Tools (später, falls relevant)

Für den späteren Broadcast an alle 90 Kassen — wenn ZPP-zertifiziert:

- **Instantly** (~30€/Monat) — Warmup + Sequences, gut für DE
- **Lemlist** (~40€/Monat) — Personalisierung via Variables
- **Woodpecker** (~40€/Monat) — DACH-freundlich, Support-Team spricht Deutsch

**Wichtig**: Diese Tools brauchen 2-4 Wochen Warmup vor dem ersten Send, sonst landen alle Mails im Spam. Kein Instant-Deployment.

### Tracking

**Empfehlung**: Google Sheets, ready-to-import CSV: `audit/KRANKENKASSEN_OUTREACH_TRACKING.csv`.

Spalten:
- Kasse
- Priorität (1-3)
- Kontakt-Name
- Kontakt-E-Mail
- LinkedIn-URL
- Erstkontakt-Datum
- Follow-up-1-Datum
- Follow-up-2-Datum
- Status (offen / geantwortet / Meeting / abgelehnt / verhandelt)
- Notiz

---

## Compliance-Rahmen

### § 7 UWG (Unfair Competition Law) — B2B-Outreach

**Grün** (erlaubt ohne Extra-Consent):
- E-Mail an Firmen-Adressen (`info@`, `kontakt@`, `partner@`) im relevanten Geschäftsfeld
- Namentliche Ansprache eines Mitarbeiters an dessen berufliche E-Mail wenn Nachricht branchenrelevant ist
- Einmalige Kontaktaufnahme mit klarem Opt-out-Hinweis

**Rot** (nicht erlaubt):
- Wiederholte Kontaktaufnahme nach Widerspruch
- Verwendung privater E-Mail-Adressen (`vorname.name@gmail.com`)
- Misleading Subject-Lines ("RE:" bei nie stattgefundenem Vorlauf)

**Für Soulvay konkret**: Alle 15 Ziel-Kassen sind juristische Personen mit klaren Geschäftsbereich "Gesundheit / Prävention / Digital-Health". Kontakt zum Innovation-Team ist branchenrelevant. Grün.

### DSGVO

- Firmen-E-Mails (kontakt@, info@) sind keine personenbezogenen Daten der Kasse als juristische Person
- Namentliche berufliche E-Mails (mustermann@tk.de) sind personenbezogen, aber § 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) deckt einmalige Kontaktaufnahme im geschäftlichen Kontext
- Speicherung der Kontaktdaten im Tracking-Sheet ist zulässig, Löschung bei Widerspruch garantieren

### Signatur-Pflichten

- Vollständige Firmierung
- Vertretungsberechtigte Person (bei Einzelunternehmer: Name)
- Adresse (Impressum-Link reicht bei erstem Kontakt, aber im Signature besser explizit)
- Kontakt (E-Mail, Telefon nice-to-have)

---

## Erfolgsmessung

**Track 1 (ZPP)**:
- Ziel Monat 6: ZPP-Zertifikat erhalten
- Metrik: Antrag eingereicht ja/nein, Prüfstatus

**Track 2 (Gezielter Outreach)**:
- Ziel Monat 2: 3 Meetings mit Innovation-Teams
- Ziel Monat 4: 1 Pilot-Kooperation signed
- Metriken: Response-Rate (Ziel: 25 %+), Meeting-Rate (Ziel: 5-10 %), Deal-Rate (Ziel: 1-2 %)

**Track 3 (Handout)**:
- Ziel Woche 2: PDF fertig, gehostet, verlinkt aus E-Mails
- Metrik: PDF-Downloads von der Landing-Page (mit einfachem Analytics-Pixel oder Server-Log)

---

## Nächste Schritte konkret

1. **Handout durchlesen** (`KRANKENKASSEN_HANDOUT.md`) — 10 Min. Anpassungen an Soulvay-Feature-Set falls nötig
2. **IONOS-Postfach** `partner@soulvay.de` einrichten — 15 Min in IONOS-Kontrollzentrum
3. **ZPP-Roadmap durchlesen** (`KRANKENKASSEN_ZPP_ROADMAP.md`) — 15 Min. Entscheidung ob Track 1 losgeht
4. **Target-Liste durchgehen** (`KRANKENKASSEN_TARGET_LIST.md`) — Top 5 auf LinkedIn identifizieren (Innovation-Manager), Namen in Tracking-Sheet
5. **E-Mail-Templates** (`KRANKENKASSEN_EMAIL_TEMPLATES.md`) an Soulvay-Ton anpassen, in IONOS-Drafts speichern
6. **Erste 5 personalisierte E-Mails** senden (nicht alle 15 auf einmal — Timing)

Verwendete Dokumente:
- `KRANKENKASSEN_ZPP_ROADMAP.md`
- `KRANKENKASSEN_TARGET_LIST.md`
- `KRANKENKASSEN_HANDOUT.md`
- `KRANKENKASSEN_EMAIL_TEMPLATES.md`
- `KRANKENKASSEN_OUTREACH_TRACKING.csv`
