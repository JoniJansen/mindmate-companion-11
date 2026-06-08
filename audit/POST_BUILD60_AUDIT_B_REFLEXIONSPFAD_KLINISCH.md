# Audit B — Reflexionspfad / Topics: Klinische Tiefe & B2B-Tauglichkeit

_Stand: 8. Juni 2026 · Build 60+ · Strang B · KEIN Code geändert_

---

## 1. Zweck

User-Beobachtung (wörtlich):

> "Bei den Themen an sich, wenn man da auf den Reflexionspfad geht, bewertet dein Burnout-Level. Wenn man dann darauf klickt, wird das direkt durchgestrichen. Da passiert dann nix. Das ist schlecht gemacht. Woran soll 'ne normale Person das erkennen? Das muss ja dann entweder mit 'nem Test verbunden sein oder einer Umfrage irgendwie, die man machen kann. (...) Sucht mal bitte da professionelle Sachen raus, die man da hintun kann, sodass das alles hochwertig wirkt und dass man das auch an Arbeitgeber und Versicherungen vermitteln kann, damit die das weitervermitteln (...). Das muss alles sitzen."

**Anspruch:** B2B-Tauglichkeit (BGM, Krankenkassen, Bundesministerien). Das ändert den Maßstab von "App-Feature" zu "evidenzbasiertes Tool mit klinischem Hintergrund".

---

## 2. Bestandsaufnahme — was heute existiert

### 2.1 Datenstruktur (`src/data/topics.ts`)

Jedes Topic hat:
- `learn`: Lehrinhalte mit `reflectionQuestion`
- `steps`: 4–5 Schritte vom Typ `reflection | exercise | journal | chat`
- `exercises`: Verweise auf Übungen

**Beispiel: "Stress & Overwhelm" — Step 2:**
```ts
{ id: 2, title: 'Explore your stress signals', description: 'Recognize how stress shows up in your body and mind', type: 'reflection' }
```

### 2.2 Verhalten beim Klick (`TopicDetail.tsx` Zeilen 47–59)

```ts
const handleStartStep = (step, index) => {
  if (step.type === 'chat')    → navigate('/chat') mit Prompt
  if (step.type === 'journal') → navigate('/journal') mit Prompt
  // reflection und exercise:
  else → onStepComplete(step.id);  // ← markiert nur als done, sonst NICHTS
};
```

**→ Genau das, was der User beschreibt:** Bei Step-Type `reflection` oder `exercise` wird der Schritt einfach durchgestrichen (in Progress markiert) ohne dass etwas passiert. Das ist tatsächlich ein Mock-Verhalten.

### 2.3 "Burnout-Level bewerten"

Code-Suche (`rg -i "burnout"`) zeigt: kein dediziertes Topic "Burnout" im aktuellen `topics.ts`. User könnte einen Reflexions-Step missverstanden haben ODER es gibt eine ältere/parallele Version. **Vor Implementation prüfen.**

---

## 3. Das Kernproblem (sauber benannt)

Die "Topics / Reflexionspfade" sind heute **inhaltlich auf Coaching/Self-Help-Niveau**, nicht auf **klinisch-validiertem Niveau**. Das reicht für:

- ✅ Verbraucher-App-Store (B2C)
- ❌ B2B-Versprechen (BGM, Krankenkasse, Ministerium, Versicherung)

B2B braucht:
1. **Validierte Screening-Instrumente** (psychometrisch geprüft, in der Forschung etabliert)
2. **Klare Disclaimer** (App ersetzt keine Diagnose/Therapie)
3. **Auswertung mit Schwellenwerten** (z.B. PHQ-9 ≥ 10 → Hinweis auf professionelle Hilfe)
4. **Empfehlungs-Pfad** in Folge-Übungen ODER externe Hilfe-Verweise
5. **Datenschutz-Garantien** (Score wird gespeichert → DSGVO Art. 9, besonders geschützte Daten)
6. **Lizenz-Klärung** für jedes Instrument

---

## 4. Validierte Instrumente — Markt-Recherche

Die folgenden Instrumente sind in DACH-Region klinisch etabliert und werden von Krankenkassen / BGM-Anbietern anerkannt.

### 4.1 Depression-Screening

| Instrument | Items | Dauer | Lizenz | DE-Validierung | B2B-Relevanz |
|---|---|---|---|---|---|
| **PHQ-2** | 2 | <1 min | Pfizer, **frei nutzbar** | ja (Löwe et al. 2005) | Standard-Vorscreening |
| **PHQ-9** | 9 | 2–3 min | Pfizer, **frei nutzbar** | ja (Gräfe et al. 2004) | Goldstandard, BÄK-empfohlen |
| **WHO-5 Wellbeing** | 5 | 1 min | WHO, **frei nutzbar (mit Attribution)** | ja (Brähler et al. 2007) | BGM-Standard, sehr beliebt |

**Empfehlung:** **WHO-5** als Einstieg (positiv formuliert, kurz, BGM-bewährt), **PHQ-2 → PHQ-9 Treppe** wenn tiefer.

### 4.2 Angst-Screening

| Instrument | Items | Lizenz | DE | B2B |
|---|---|---|---|---|
| **GAD-2** | 2 | frei | ja | Vorscreening |
| **GAD-7** | 7 | frei | ja (Löwe et al. 2008) | Standard |

### 4.3 Burnout / Belastung — **das ist heikel**

| Instrument | Items | Lizenz | Wichtig zu wissen |
|---|---|---|---|
| **MBI (Maslach Burnout Inventory)** | 22 | **kostenpflichtig** (Mind Garden, ~2–4 USD/Lizenz/Erhebung) | Goldstandard, aber **nicht frei nutzbar** |
| **OLBI (Oldenburg Burnout Inventory)** | 16 | frei (Demerouti) | Gute MBI-Alternative |
| **CBI (Copenhagen Burnout Inventory)** | 19 | **Creative Commons** | Frei, in DACH zunehmend genutzt |
| **BBI-10 (Burnout-Screening-Skalen)** | 10 | frei (Geuens et al.) | Sehr kurz, gut für Apps |
| **PSS-10 (Perceived Stress Scale)** | 10 | frei (Cohen) | Stress-spezifisch, nicht Burnout im engeren Sinne |

**Empfehlung:** **CBI (Personal Burnout Subscale, 6 Items)** oder **PSS-10** als App-taugliches Burnout/Stress-Screening. MBI vermeiden wegen Lizenzkosten.

### 4.4 Schlaf

- **PSQI (Pittsburgh Sleep Quality Index)** — 19 Items, frei, Goldstandard
- **ISI (Insomnia Severity Index)** — 7 Items, frei (für Forschung), Insomnie-Fokus

### 4.5 Beziehungs-/Selbst-Themen (heute eigene Topics)

- **RSE (Rosenberg Self-Esteem Scale)** — 10 Items, frei
- **ECR-R (Attachment)** — 36 Items, frei, aber zu lang für App; Kurzform ECR-9 existiert

---

## 5. Übersetzung — wie das auf Soulvay-Topics mappt

| Heutiges Topic | Vorgeschlagenes validiertes Instrument | Frequenz |
|---|---|---|
| Stress & Overwhelm | **PSS-10** (Stress) oder CBI Personal Burnout | Monatlich |
| Anxiety (falls vorhanden) | **GAD-7** | Bei Bedarf |
| Sleep | **ISI** | Wöchentlich (Premium) |
| Self-Worth / Confidence | **RSE** | Monatlich |
| (Neu) "Wie geht's dir gerade?" | **WHO-5** als Onboarding + monatlicher Re-Check | Monatlich |
| Burnout (falls Topic erstellt wird) | **CBI Personal Burnout** + Disclaimer | Quartalsweise |

---

## 6. Architektur — wie ein "richtiger" Reflexions-Step aussehen muss

Statt heute:
```
Klick auf Reflection-Step → markiert als done → nichts
```

Vorschlag:
```
Klick auf Reflection-Step
  → öffnet Modal/Sheet "Kurzer Check (3 Min, wissenschaftlich validiert)"
  → User beantwortet z.B. WHO-5 (5 Likert-Fragen)
  → Score wird berechnet
  → Auswertung wird gezeigt:
       - Score + Kategorie (z.B. "gutes Wohlbefinden" / "Hinweis prüfen")
       - Verlauf wenn mehrfach durchgeführt (Mini-Chart)
       - Empfohlene nächste Schritte (Companion-Übung / Journal-Prompt / Safety-Verweis)
  → Score wird in Supabase gespeichert (verschlüsselt, RLS)
  → Schritt als done markiert
```

### 6.1 Neue DB-Tabelle (Vorschlag)

```
assessment_responses
  id, user_id, instrument (enum: WHO5|PHQ2|PHQ9|GAD2|GAD7|PSS10|CBI|RSE|ISI),
  responses (jsonb), score (int), severity (enum: minimal|mild|moderate|severe),
  recommended_action (text), completed_at, created_at
```

RLS: `auth.uid() = user_id`. GRANTs an authenticated. **Besondere Schutzkategorie** → bei DSGVO-Doku ergänzen.

### 6.2 Disclaimer (zwingend, jurastisch geprüft)

Vor jedem Test:
> "Dieser Selbst-Check ist ein wissenschaftlich validiertes Screening-Instrument ([Quelle]). Er ersetzt keine ärztliche oder therapeutische Diagnose. Wenn Sie sich in einer Krise befinden, finden Sie [hier] sofortige Unterstützung."

Nach Test bei hohen Werten (z.B. PHQ-9 ≥ 15):
> "Ihre Antworten deuten auf eine relevante Belastung hin. Bitte sprechen Sie mit einer Hausärztin/einem Hausarzt oder Psychotherapeutin/Psychotherapeuten. Sofortige Hilfe finden Sie [unter Safety]."

→ verlinkt auf bestehende `/safety` Seite (siehe `mem://features/safety/crisis-and-compliance-system`).

---

## 7. B2B-Vermarktbarkeit — Checkliste

Was Krankenkassen/BGM/Ministerien sehen wollen:

- [ ] **Validierte Instrumente** (PHQ-9, GAD-7, WHO-5, PSS-10, CBI) — siehe oben
- [ ] **Quellenangabe** je Instrument (Autor, Jahr, Validierungsstudie DACH)
- [ ] **Disclaimer** rechtssicher (kein Heilversprechen, keine Diagnose)
- [ ] **DSGVO Art. 9** — besondere Schutzkategorie korrekt behandelt
- [ ] **Daten-Export** für User (haben wir teilweise — siehe `mem://features/data-export-backups`)
- [ ] **Aggregierte, anonymisierte Reports** für BGM (Premium-B2B-Tier) — _Phase 3_
- [ ] **TÜV/CE-Klasse** prüfen: Sobald App "diagnostiziert", wird sie zum Medizinprodukt (MDR/MDR-IVDR). Reines **Screening + Verweis auf Profis** ≠ Diagnose, also bleibt App **kein Medizinprodukt**. Diese Grenze MUSS scharf bleiben.
- [ ] **ISO 27001 / TISAX** für DACH-B2B-Verträge — langfristig
- [ ] **DiGA-Listung** als Endziel (BfArM-Zulassung) — eigener mehrmonatiger Prozess

---

## 8. Inhaltliche Qualität — was bei den Topics noch verbessert werden muss

Über das Test-Thema hinaus:

### 8.1 Heutige Lehrinhalte (`learn`-Sektionen)

**Gut:** Inhalte sind solide auf Self-Help-Niveau, Quellen werden genannt (Nagoski, Bowlby).

**Verbesserungspotential:**
- Quellenangaben **als Fußnote** sichtbar machen (heute im Fließtext) → wirkt akademischer
- "Weiterlesen"-Verweise auf öffentliche Quellen (z.B. AWMF-Leitlinien)
- DE-Validierung der Inhalte: aktuell teils US-zentriert (Nagoski etc.)

### 8.2 Heutige Übungen (`exercises.ts`)

**Beispiel "60-Second Breathing":** Strukturell korrekt (Atemrhythmus), aber:
- Keine Quellenangabe (woher kommt diese spezifische Variante?)
- Sollte sich auf etablierte Techniken berufen: **Box Breathing (Navy SEALs)**, **4-7-8 (Andrew Weil)**, **Coherent Breathing (Stephen Elliott)**
- Begleitung durch Companion-Voice → bereits roadmap (siehe `mem://features/toolbox/meditative-exercise-guidance`)

**Empfehlung:** Jede Übung bekommt:
- Quelle / Methodik-Name
- Wissenschaftlicher Hintergrund in 2 Sätzen
- Empfohlene Frequenz / Wirkungserwartung
- Optional: Verweis auf längere Premium-Version

---

## 9. Implementations-Roadmap (KEIN Code in dieser Phase)

**Phase B-1 — Sofort-Fix (1 Sprint):**
- Reflection-Steps die heute "nichts tun" → entweder durch Mini-Übung ersetzen ODER aus dem Pfad nehmen.
- "Burnout-Level"-Step (falls gefunden) entfernen oder durch CBI-Mini ersetzen.

**Phase B-2 — Erstes validiertes Instrument (2 Sprints):**
- WHO-5 implementieren als Onboarding + monatlicher Re-Check.
- Eigene Komponente `<AssessmentRunner instrument="WHO5" />`, DB-Tabelle, Auswertung, Verlaufs-Chart.
- Disclaimer-System bauen (zentrale Komponente).
- Quellen-Footer auf jedem Test.

**Phase B-3 — Topic-Integration (2 Sprints):**
- Pro Topic 1 passendes validiertes Instrument einbauen.
- Stress → PSS-10, Anxiety → GAD-7, Sleep → ISI, Self-Worth → RSE.

**Phase B-4 — B2B-Hülle (langfristig, 1–2 Quartale):**
- Aggregierte anonymisierte Auswertung für BGM-Tier.
- DSGVO-DPIA-Update für Assessments.
- Vorbereitung DiGA-Listung (separater Prozess).

---

## 10. Risiken & offene Fragen

| Risiko | Handling |
|---|---|
| Lizenz-Verletzung (z.B. wenn doch MBI verwendet wird) | Vorab pro Instrument formal prüfen, Lizenz-Dokumentation in `compliance/` ablegen |
| App rutscht in Medizinprodukt-Kategorie | Striktes "Screening, keine Diagnose"-Framing. Anwalt prüfen lassen. |
| User bekommt hohen PHQ-9 Score → was tun? | Verweis auf Safety-Page + Hausärzte-Empfehlung. Niemals Companion alleine "behandeln" lassen. |
| Speicherung von Test-Scores = besondere Schutzkategorie | Verschlüsselung at rest aktivieren, DPIA aktualisieren, User-Opt-Out anbieten |
| Übersetzung der validierten Instrumente | NUR offiziell validierte DE-Versionen verwenden (alle oben aufgelisteten haben DE-Validierung) |

### Offene Fragen vor Implementation:

1. **Jurist hinzuziehen** für Disclaimer und MDR-Abgrenzung? (Empfehlung: ja, vor B-2)
2. **DPIA** auf Assessment-Daten erweitern? (Empfehlung: ja, vor B-2)
3. **WHO-5 als ersten Schritt** OK, oder lieber sofort Stress-fokus (PSS-10)?
4. **B2B-Pipeline** parallel angehen (Sales/Krankenkassen-Kontakte) oder erst nach Phase B-3?

---

**Ende Audit B.**
