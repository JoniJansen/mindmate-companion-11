# Ally — Wettbewerbsanalyse & Learnings für Soulvay

_Stand: 2. Juni 2026 · Basis: 10 Screenshots Ally App (iOS, Build vom ~29. Mai 2026)_
_Marktdaten: 322 Bewertungen, 4,9 ⭐, Team aus Psychologen (Stanford, McGill, FU Berlin, Charité)_

---

## 1. Was Ally konkret macht (aus den Screenshots)

### Onboarding & Chat (IMG_1883, 1888, 1889)
- **Personalisierter Einstieg ab Sekunde 1**: "Hi Jonathan, ich bin Ally. Du hast schon angedeutet, dass es dir schwerfällt…" → Ally referenziert *bestehendes Wissen* über den User direkt im ersten Satz. Kein generisches "Wie geht's dir?"
- **Mikro-Feedback an jeder AI-Message**: 👍 👎 📋 🔊 (Daumen hoch/runter, Copy, Vorlesen) — sehr sauber, unaufdringlich
- **Avatar oben rechts** mit Progress-Ring (grünes Segment) → visueller Fortschritts-Anker, *immer sichtbar*
- **Timeline-Marker im Chat**: "TODAY, 21:30" mit Kalender-Icon trennt Sessions visuell — fühlt sich wie Tagebuch an, nicht wie WhatsApp

### Tool-Cards inline im Chat (IMG_1888, 1889) ⭐ Kernidee
- **Tools werden mid-conversation eingeschoben**: "TOOL · Den Lichtblick finden", "TOOL · Innerer Leitsatz" — als saubere Cards mit Gradient-Thumbnail
- Klick → führt in den geführten Flow → führt zurück in den Chat
- **Alles läuft durch den Chat**, auch Übungen. Der Chat ist die *einzige Bühne*.

### Bibliothek / Lernen (IMG_1890, 1891, 1892)
- Kategorien: **Achtsamkeit, Optimismus, Werte, Selbstwirksamkeit, Stressprävention**
- Pro Kategorie 2-4 **Lektionen** als Karten mit Gradient-Cover + Serif-Headline + Beschreibung
- Lektionen heißen z.B. "Achtsamkeit verstehen", "Atempause", "Realistischer Optimismus", "Zukunftsvision", "Deine Stärken erinnern"
- **Horizontal scrollbar** pro Kategorie (Card-Carousel, Peek auf nächste Card)
- Bei Klick: alles führt wieder in den **Chat** als geführter Dialog

### Tool-Hub (IMG_1885)
- Fullscreen-Card mit Gradient-Hero, Label "TOOL", Serif-Headline "Dein Start mit Ally", Beschreibung, **schwarzer Pill-CTA "Weiter"**
- Pagination Dots unten, swipeable
- Status-Badge "IN BEARBEITUNG" (dezent, oben rechts) — zeigt Fortschritt ohne Druck

### Voice (IMG_1884) ⭐ wichtiger Kontrast
- Voice-Modus = **Vollbild-Chat-Erlebnis**, Input wird zu "Ally hört zu"
- **Lila Pulse-Button** statt grauer Send-Button → visueller Mode-Switch ist sofort klar
- Sehr aufgeräumt, fast meditativ
- **ABER**: Voice ist anscheinend Premium/gated — laut deinem Feedback negativ

### Settings (IMG_1886, 1887)
- **Sehr reduziert**: nur 4 Sektionen (Notfall, Persönlich, Hilfezentrum, Konto)
- **"Notfall · Finde eine Hotline" ganz oben** → Crisis-Compliance prominent, nicht versteckt
- **"Hast du Fragen?" Card mit Support-CTA** → menschlicher Touch, kein FAQ-Wall
- Maximal 8 Menüpunkte total

---

## 2. Was Ally besser macht als wir (ehrlich)

| Punkt | Ally | Soulvay heute | Lücke |
|---|---|---|---|
| **Tool-Integration in Chat** | Tools sind Cards *im* Chat-Stream | Toolbox ist separate Seite | 🔴 Groß |
| **Inhalts-Bibliothek** | 5+ Kategorien, 15+ Lektionen mit Cover-Art | Topics + Audio-Library getrennt, weniger kuratiert | 🟡 Mittel |
| **First-Message-Personalisierung** | Referenziert User-Kontext sofort | Generischere Greetings | 🟡 Mittel |
| **Settings-Klarheit** | 4 Sektionen, Notfall #1 | Mehr Sektionen, Notfall weniger prominent | 🟢 Klein |
| **Visual System** | Serif-Headlines + Gradient-Cards = "Buch-Gefühl" | Mehr Sans-Serif, weniger Cover-Art | 🟡 Mittel |
| **Feedback an AI-Messages** | 👍👎📋🔊 unter jeder Message | Aktuell nicht überall | 🟡 Mittel |
| **Wissenschafts-Credibility** | Stanford/McGill/Charité im Marketing | Nicht kommuniziert | 🟡 Mittel |

## 3. Wo Soulvay weiterhin gewinnt

- **Voice-First**: Bei Ally gated/Premium, bei uns Kern-Erlebnis (Face-to-Face, ElevenLabs)
- **Begleiter-Persona mit Namen + Charakter**: Ally hat *einen* Bot, wir haben *wählbare Companions* mit eigenen Stimmen
- **Companion-Memory**: Erinnerung an konkrete Momente (kannst du als "Sie erinnert sich an…" sichtbar machen)
- **Mood-Tracking + Heatmap**: Bei Ally so nicht sichtbar
- **Tonalität "Präsenz statt Therapie"**: Ally ist eher Coach/Tool ("entdecken was du lernst"), wir sind Begleiter ("ich bin da")

---

## 4. Top-10 konkrete Ideen für Soulvay (priorisiert nach Impact/Aufwand)

### 🚀 Quick Wins (1-3 Tage, hoher Impact)

**1. Voice-First ENTSPERREN — direkt im Chat-Input**
Ally sperrt Voice → User-Frust. **Wir machen Voice ab Sekunde 1 verfügbar** (Text-Eingabe = Mikrofon → Transkript). Nur **Face-to-Face/Conversational-Voice** bleibt Premium. → Klares Differenzierungs-Statement im Onboarding: _"Sprich frei mit deiner Begleitung — keine Hürde."_

**2. Feedback-Row unter AI-Messages**
👍 👎 📋 🔊 als 4 dezente Icons. 🔊 nutzt unseren existierenden ElevenLabs-TTS → Soulvay kann jede Message vorlesen lassen. Daten aus 👍/👎 fließen in unsere Memory-Engine (welche Antworten resonieren?).

**3. Companion-Avatar oben rechts mit Status-Ring**
Statt nur Avatar: kleiner Progress-Ring drumherum, der die **heutige Session-Tiefe** anzeigt (Stille/Atmend/Aktiv). Macht Companion *präsent*, nicht nur dekorativ.

### 🎯 Mittlere Hebel (1-2 Wochen)

**4. Tool-Cards INLINE im Chat** ⭐ Ally-Kernidee adaptieren
Wenn Companion eine Übung vorschlägt, erscheint im Chat-Stream eine **Card "TOOL · [Name]"** mit Gradient-Cover. Klick startet den Exercise-Player als Modal/Bottom-Sheet, danach zurück in den Chat mit kurzer Reflexion. → Toolbox-Seite kann bleiben, aber der **Pull** kommt aus der Conversation.

**5. Timeline-Marker im Chat**
"HEUTE · 21:30" mit Kalender-Icon als Trenner zwischen Sessions. Macht aus Chat ein **Tagebuch-Gefühl**. Existierender ChatHistory-Code liefert die Daten schon.

**6. Bibliothek-Redesign: Kategorisierte Lern-Karten**
Aktuelle Topics + Audio-Library zu einer **"Bibliothek"** mergen. Kategorien wie: _Achtsamkeit · Selbstmitgefühl · Werte · Stressregulation · Beziehungen · Schlaf._ Pro Kategorie 3-5 Karten mit Gradient-Cover. Klick = geführter Dialog im Chat (nicht statischer Text). Serif-Headlines wie Ally.

**7. First-Message-Personalisierung verschärfen**
System-Prompt erweitern: Companion **referenziert immer ein Element aus letzter Session ODER Profil-Setup ODER letzter Mood-Entry** im ersten Satz. Nie generisch. Wir haben die Memory-Engine, wir nutzen sie zu wenig in Greetings.

### 🏔 Strategische Hebel (3-6 Wochen)

**8. Wissenschafts-Beirat sichtbar machen**
Auch wenn (noch) keiner aktiv ist: Privacy/About-Seite mit Sektion **"Wissenschaftlich fundiert"** — Quellen für unsere Übungen (ACT, MBSR, Selbstmitgefühl-Forschung Kristin Neff, etc.). Kein Fake, aber **die Forschungs-Basis kommunizieren**. Ally tut nichts magisches, sie *erzählen* es nur besser.

**9. "Lektion 1/2/3"-Progression in Kategorien**
Bei Ally: jede Kategorie hat nummerierte Lektionen → User sieht Fortschritt. Wir können bestehende Toolbox-Übungen in **Pfade gruppieren** (3-7 Übungen pro Pfad, sequenziell). Erfüllt das "Pull"-Bedürfnis ohne Gamification-Druck.

**10. Settings radikal vereinfachen**
Heute viele Sektionen → Ally hat 4. Vorschlag: **Notfall · Persönlich · Soulvay (Companion+Voice+Preferences) · Konto**. Crisis-Hotline-Link nach ganz oben (Apple-Compliance + ethisches Signal).

---

## 5. Was wir NICHT von Ally kopieren

- **Voice gated machen** — kontraproduktiv, das ist *unsere* Stärke
- **Nur einen Bot anbieten** — Companion-Auswahl bleibt unser USP
- **Reine Coach-Tonalität** — wir bleiben präsent/begleitend, nicht analytisch
- **Gradient-Overload** — Ally-Cards sind schön, aber wir riskieren visuelle Müdigkeit. Sparsam einsetzen.

---

## 6. Vorschlag: Sprint-Reihenfolge

**Sprint 1 (diese Woche, ~3 Tage)** — Quick Wins
- Voice im Text-Input verfügbar machen (Mic-Button → Transkript)
- Feedback-Row (👍👎📋🔊) unter AI-Messages
- Status-Ring um Companion-Avatar
- Timeline-Marker im Chat-Stream

**Sprint 2 (1-2 Wochen)** — Inline-Tool-Cards
- Chat kann Tool-Cards rendern (neuer Message-Typ)
- Companion-Prompt erweitern: schlägt Tools per Card vor
- Exercise-Player als Bottom-Sheet aus Chat öffnen

**Sprint 3 (2-3 Wochen)** — Bibliothek-Redesign
- Topics + Audio-Library mergen
- Kategorien-Layout mit horizontalen Carousels
- Lektion-Progression (1/2/3)
- Serif-Headlines + Gradient-Cover für Karten

**Sprint 4 (parallel)** — Strategisch
- Wissenschafts-Sektion auf About-Page
- Settings-Reduktion auf 4 Sektionen
- First-Message-Personalisierung im chat Edge Function

---

## 7. Offene Fragen an dich

1. **Voice-Strategie bestätigen**: Voice (Push-to-Talk, Transkript) FREE überall, nur Face-to-Face Conversational-Voice Premium — passt das?
2. **Bibliothek**: Bestehende Topics behalten und nur visuell upgraden, oder komplette Inhalts-Kuratierung (neue Kategorien-Struktur)?
3. **Wissenschafts-Beirat**: Sollen wir reale Quellen/Methoden (ACT, MBSR, etc.) sichtbar machen, oder warten bis echte Psycholog:innen an Bord sind?
4. **Welcher Sprint zuerst?** Mein Vorschlag: **Sprint 1 (Quick Wins)** sofort starten — sichtbarer Hebel innerhalb 2-3 Tagen.
