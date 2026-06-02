# Build 60 — Update-Konzept

_Stand: 2. Juni 2026 · Soulvay live im App Store (Build 51) · Ziel-Submit Build 60: ca. 16. Juni 2026_

> **Vorbemerkung an dich:** Dieses Dokument ist ein Vorschlag, kein Plan. Ich treffe keine Entscheidungen, ich strukturiere sie. Am Ende wählst du 5-8 Änderungen aus — alles andere geht in den Build-61-Backlog. Ich bin bei mehreren Punkten bewusst zurückhaltender als deine bisherigen Wünsche, weil ich glaube, dass Build 60 sonst kippt.

---

## 1. Voice-Pricing-Empfehlung

### Aktueller Stand
- **Spracheingabe (STT, Mic → Text):** Premium-Lock (`canUseVoice`-Gate im `ChatInputBar`)
- **Sprachausgabe (TTS, ElevenLabs Vorlesen):** Premium-Lock
- **Face-to-Face (Conversational Voice):** Premium-Lock

### Konkurrenz
| App | Mic-Input | TTS | Voice-Conversation |
|---|---|---|---|
| Ally | Free (aber begrenzt) | Free (Standard-Stimme) | Premium |
| Wysa | Limited Free | nicht prominent | Premium |
| Replika | Free | Free | Premium |
| **Soulvay heute** | Premium | Premium | Premium |

### Empfehlung
**Mic-Input → Free, TTS → bleibt Premium, Face-to-Face → bleibt Premium.**

Begründung:
- **Mic Free löst echten Pain:** Mobile-Tipperei ist Reibung. User, die nicht reinsprechen können, schreiben kürzere Nachrichten → Companion bekommt weniger Substanz → Sessions wirken flacher. Das schadet dem Free-Erlebnis und damit der Conversion-Rate.
- **TTS Premium ist ehrlich begründbar:** ElevenLabs kostet pro Synthese. Stimm-Auswahl + Companion-Persönlichkeits-Voice ist ein klarer, kommunizierbarer Premium-Wert.
- **Face-to-Face Premium ist die Burg:** Das ist unser teuerstes Feature (WebRTC, Minuten-Limits) und gleichzeitig unser stärkstes Differenzierungs-Argument gegenüber Ally.

### Risiko
- **Apple Sub-Re-Review:** Eine Free-Funktion *hinzuzufügen* ist kein Sub-Re-Review-Trigger. Wir entfernen einen Lock, ändern keine Subscription. ✅ Safe.
- **Conversions:** Niedriges Risiko, dass TTS-Conversions sinken. Mic Free macht den Free-Tier deutlich attraktiver — könnte sogar die Schwelle senken, *überhaupt* Premium auszuprobieren.

---

## 2. Performance-Bestandsaufnahme

### Ehrlicher Status

| Flow | Wie es sich anfühlt | Vermutete Ursache |
|---|---|---|
| Companion-Wechsel | Spürbarer Pause-Moment (~300-500ms) | Avatar-Signed-URL-Refetch + Animation-Init |
| Chat-Scroll bei langer History | Ruckelt ab ~50 Messages | Keine Virtualisierung, alle Messages gerendert |
| Tab-Switch (Bottom-Nav) | OK, aber ohne Übergang → wirkt "hart" | Route-Wechsel ohne Page-Transition |
| Voice-Mode-Entry | Lädt sichtbar (Token-Request + Mic-Permission) | Sequenziell statt parallel |
| Home-Dashboard Initial-Render | OK, aber viele gleichzeitige Skeletons | Mehrere parallele Hooks ohne Priorisierung |
| Mood-Heatmap | Initial-Paint langsam (~400ms) | Berechnung im Render statt useMemo |

### Was *merkliche* Verbesserung bringt (in Build 60 machbar)
1. **Chat-Virtualisierung** mit `react-virtuoso` oder ähnlich → größter Hebel, 1-2 Tage Arbeit
2. **Page-Transition** zwischen Tabs (subtile Fade/Slide via Framer Motion `AnimatePresence`) → fühlt sich sofort moderner an, 0.5 Tage
3. **Companion-Avatar-URL-Cache** verlängern → Wechsel-Pause halbieren, 0.5 Tage
4. **Mood-Heatmap memoization** → 0.5 Tage

### Was *nicht* merkliche Verbesserung bringt (oder zu teuer ist)
- 60-FPS-Garantie auf älteren iPhones → Capacitor-Web-View-Limit, nicht lösbar
- Native-Gesture-Performance wie iOS Mail → bräuchte Capacitor-Plugin oder React-Native-Migration
- GPU-Composite-Layer-Tuning → Wochen-Arbeit, marginale visuelle Wirkung
- ElevenLabs-Streaming-Optimierung → Backend-seitig, eigene Iteration

---

## 3. Visual-Bestandsaufnahme — Tiefe & Schatten

### Wo Soulvay heute flach wirkt
- **Home-Cards** (CompanionCard, RitualCard, ContinueModule): alle haben `shadow-soft`, kaum Differenzierung
- **Bottom-Nav:** flach auf Background, kein Layer-Eindruck
- **Chat-Input-Bar:** wirkt "geklebt", kein Float-Eindruck
- **Topic-Cards:** uniform, keine Hierarchie
- **Mood-Selector:** flache Emoji-Buttons ohne Press-Tiefe
- **Companion-Selector-Cards:** zu eng, keine Elevation bei Hover/Active

### Wo es bereits modern wirkt
- Auth-Page Hero
- Voice-Mode-Vollbild
- Settings-Sektion-Cards

### 6 konkrete Component-Vorschläge für subtile 3D-Wirkung

1. **Card-Elevation-System einführen** — 3 Stufen statt einer einzigen `shadow-soft`:
   - `shadow-resting` (flach, Default)
   - `shadow-floating` (Hero-Cards, Companion-Avatar)
   - `shadow-lifted` (active/pressed, mit Translate-Y)
2. **Chat-Input-Bar als floating element** — Schatten nach oben (`shadow-[0_-8px_24px_-12px_hsl(0_0%_0%/0.08)]`), abgerundeter, leicht abgehoben vom Bottom-Edge
3. **Companion-Avatar mit weichem radialen Glow** statt harter Border — wirkt "lebendiger", presence-stärker
4. **Active-State mit `scale-[0.97]` + Shadow-Reduktion** auf allen primären Cards — physikalisches Feedback
5. **Bottom-Nav mit subtilem Blur-Hintergrund + Top-Border-Shadow** statt flacher Border
6. **Mood-Selector-Buttons mit Inner-Shadow bei Selected-State** — Druck-Knopf-Gefühl

### Was bewusst NICHT machen
- Skeuomorphe Texturen (Leder, Papier) — wirkt 2012
- Neon-Glows oder bunte Drop-Shadows — passt nicht zur Tonalität
- Parallax-Scrolling auf Mobile — Performance-Risiko, Motion-Sickness
- Übertriebene Spring-Animationen — Companion soll *ruhig* wirken
- Glassmorphism überall — wird schnell visuell überladen

---

## 4. Inhaltliche Qualitäts-Audit

### Übungs-Niveau heute (subjektive Einschätzung): **6/10**

Solide Basis, aber merkbar selbst geschrieben, nicht aus etablierter Methodik abgeleitet. Kein einziger Verweis auf Quellen.

### Gefundene methodische Lücken
- **Atemübungen ohne Kontraindikations-Hinweis** (Hyperventilation, Panik-Trigger bei Trauma)
- **"Body-Scan"-ähnliche Übungen** ohne Trigger-Warnung für dissoziative User
- **Inneres-Kind-/Visualisierungs-Übungen** ohne Hinweis "Bei akuter Belastung kein Trigger erzwingen"
- **Keine Crisis-Off-Ramp** am Ende intensiver Übungen ("Wenn das gerade zu viel war, hier ist Hilfe")
- **Keine klare Methodik-Verortung** ("Dies ist eine Übung aus der Akzeptanz- und Commitment-Therapie nach Hayes")

### Solide existierende Übungen
- Kurze Atem-Pausen (4-7-8, Box Breathing) — methodisch sauber
- Dankbarkeits-Reflexion — etabliert in Positiver Psychologie
- Werte-Klärung — ACT-nah, gut gemacht

### 4 Übungen, die mit minimalen Anpassungen deutlich gewinnen
1. **Body-Scan** → Trigger-Hinweis + sanfter Einstieg + explizite Erlaubnis abzubrechen
2. **Inneres-Kind-Dialog** → Quellen-Verweis (Schema-Therapie), Sicherheitsrahmen, Crisis-Link am Ende
3. **Werte-Klärung** → Quellen-Verweis (ACT, Hayes), strukturiertere Karten-Form
4. **Dankbarkeits-Reflexion** → Quellen-Verweis (Emmons-Forschung), saubere 3-Punkte-Form

### Ehrlich referenzierbare Methodik-Quellen (ohne Heilversprechen)
- **ACT** (Acceptance and Commitment Therapy, Steven Hayes) — Werte, Akzeptanz, Defusion
- **MBSR** (Mindfulness-Based Stress Reduction, Jon Kabat-Zinn) — Body-Scan, Atem
- **Selbstmitgefühl-Forschung** (Kristin Neff, UT Austin) — Self-Compassion-Übungen
- **Positive Psychologie** (Seligman, Emmons) — Dankbarkeit, Stärken
- **Schema-Therapie** (Jeffrey Young) — Inneres-Kind-Arbeit

Formulierung muss sein: *"Inspiriert von …"* / *"Basiert auf Übungen aus …"* — NIE *"klinisch wirksam"* oder *"therapeutisch geprüft"*.

### Was Build 60 NICHT leisten kann
- Inhaltliche Komplett-Überarbeitung mit Psycholog:in → eigenes Projekt
- Wirksamkeits-Studien oder -Aussagen → braucht Forschung
- Ally-Niveau bei kuratierter Lern-Bibliothek → Sprint 3+, nicht jetzt

---

## 5. Tagebuch-Bestandsaufnahme

### Was heute gut funktioniert
- Schreib-Flow ist niederschwellig, kein Zwang zu Tags/Mood
- AI-Summary nach Eintrag = klarer Wow-Moment
- Verbindung zu Weekly-Review existiert
- Filter-Chips (Mobile) funktionieren

### Was niederschwellig zu verbessern wäre
- **Editor wirkt nüchtern** — keine Atmosphäre, könnte mehr "Notizbuch-Gefühl" haben (Papier-Hintergrund, sanftere Typografie für den Schreibbereich)
- **Voice-Diktat im Tagebuch** — Mic-Button auch hier (passt zu Voice-Free-Strategie)
- **Eintrag-Karten in der Übersicht** wirken sehr listig → könnten als Tagebuch-Seiten (mit Datum-Margin) gestaltet werden
- **AI-Summary könnte als „Companion liest und antwortet kurz"** statt nur als Box erscheinen → Brücke zum Chat

### Wie prominenter machen
- **Home-Dashboard:** "Heute schon geschrieben?"-Card statt nur in Bottom-Nav versteckt
- **Nach Chat-Session:** sanfter Prompt "Magst du das festhalten?" → 1 Klick → Eintrag mit Chat-Kontext vorbefüllt

---

## 6. Themen-Bereich (Topics)

### Realistisch in Build 60 (ohne Komplett-Redesign)
- **Gradient-Cover** auf Topic-Cards (statt aktueller Optik)
- **Serif-Headline** für Topic-Titel (Buch-Gefühl)
- **Kategorie-Gruppierung** (visuell — kein neues Datenmodell): Achtsamkeit · Selbstmitgefühl · Werte · Stress · Beziehungen
- **Horizontal-Scroll-Carousel** pro Kategorie auf Mobile

### NICHT in Build 60
- Lektion-Progression (1/2/3) — braucht Daten-Modell-Änderung
- Topics + AudioLibrary mergen — Sprint 3
- Inhaltliche Neu-Kuratierung — siehe §4

---

## 7. Vorgeschlagener Build-60-Scope

8 Änderungen vorgeschlagen. **Du wählst 5-8 aus.** Sortiert nach Hebel/Aufwand-Verhältnis.

| # | Änderung | User-sichtbarer Effekt | Files (grob) | Aufwand | Bug-Risiko | Apple-Risiko | Hebel |
|---|---|---|---|---|---|---|---|
| 1 | **Mic-Input Free** | "Endlich kann ich sprechen statt tippen" | `ChatInputBar`, `useChatVoice`, Premium-Gate-Logik | 3-4h | Niedrig | **Sehr niedrig** (kein Sub-Change) | **Hoch** |
| 2 | **Card-Elevation-System (3 Stufen)** | App fühlt sich "teurer" an | `tailwind.config.ts`, `CalmCard`, 4-5 Home-Components | 6-8h | Niedrig | Keiner | **Hoch** |
| 3 | **Page-Transitions zwischen Tabs** | Übergänge wirken modern statt hart | `AppLayout`, `BottomNav`, neue `PageTransition` | 4-5h | Niedrig | Keiner | Mittel-Hoch |
| 4 | **Chat-Virtualisierung** | Chat ruckelt nicht mehr bei langen Sessions | `Chat.tsx`, neue `VirtualMessageList` | 8-12h | **Mittel** (TTS-Anchor, Scroll-Position) | Keiner | **Hoch** (Performance) |
| 5 | **Übungs-Sicherheits-Pass** | Übungen wirken professioneller, weniger Reject-Risiko | `data/exercises.ts`, 4-6 Übungs-Texte, Methodik-Footer | 5-6h | Keiner | **Positiv** (mehr Compliance) | Mittel |
| 6 | **Tagebuch-Voice-Diktat + Editor-Polish** | Tagebuch wird niederschwelliger | `journal/`-Components | 4-6h | Niedrig | Keiner | Mittel |
| 7 | **Topics: Gradient-Cards + Serif + Kategorien** | Themen-Bereich wirkt wertiger | `TopicCard`, `Topics.tsx` | 6-8h | Niedrig | Keiner | Mittel |
| 8 | **Companion-Avatar weicher Glow + Wechsel-Cache** | Companion wirkt lebendiger, Wechsel schneller | `CompanionAvatarAnimated`, `useAvatarUrl` | 3-4h | Niedrig | Keiner | Mittel |

**Gesamt-Aufwand bei voller Auswahl:** ~40-55h reine Dev-Zeit. Bei 2 Wochen Build-Fenster mit Solo-Dev ist 5-6 Punkte realistisch, 7-8 wäre eng.

### Meine Top-5-Empfehlung (wenn du mich fragst)
**1, 2, 4, 5, 8** — höchster sichtbarer + struktureller Hebel, niedrigstes Risiko-Profil, deckt deine Hauptwünsche (Voice Free, Tiefe, Performance, Qualität).

Wenn Zeit reicht: **+3** (Page-Transitions) als visueller Multiplikator zu #2.

---

## 8. Was explizit NICHT in Build 60

| Wunsch | Warum nicht | Wann dann |
|---|---|---|
| Tool-Cards inline im Chat | Neuer Message-Typ + Prompt-Engineering + UI = 1-2 Wochen allein | Build 61 |
| Komplette Bibliothek-Restrukturierung | Daten-Modell-Änderung, Migration, neue Kategorisierung | Build 62 |
| Echte Ally-Animations-Smoothness | Capacitor-Web-View hat strukturelle Limits | Nie vollständig; ggf. RN-Migration in 2027 |
| Inhalts-Überarbeitung mit Psycholog:in | Externer Input nötig | Deine Entscheidung, eigenes Projekt |
| Lektion-Progression (1/2/3) | Daten-Modell + Fortschritts-Tracking | Build 62 |
| 3D-Companion-Avatar (R3F) | Performance-Risiko, eigenes Sprint-Thema | Build 63+ |
| Komplette Settings-Reduktion auf 4 Sektionen | Touches viel Code, viele Edge-Cases | Build 61 |

---

## 9. Apple-Review-Risiko-Bewertung

| Änderung | Sub-Re-Review nötig? | 5.1.x-Risiko | Anmerkung |
|---|---|---|---|
| #1 Mic Free | Nein | Keiner | Mic-Permission-Text in `Info.plist` bereits gesetzt — prüfen, ob aktuell |
| #2 Elevation-System | Nein | Keiner | Pure CSS |
| #3 Page-Transitions | Nein | Keiner | Pure Animation |
| #4 Chat-Virtualisierung | Nein | Keiner | Interne Optimierung |
| #5 Übungs-Sicherheits-Pass | Nein | **Positiv** | Reduziert 1.4.1-Health-Claims-Risiko |
| #6 Tagebuch-Polish + Voice | Nein | Keiner | Mic schon erlaubt |
| #7 Topics-Redesign | Nein | Keiner | Visuell |
| #8 Avatar-Glow | Nein | Keiner | Visuell |

**Gesamt-Apple-Risiko Build 60: niedrig.** Hauptaufmerksamkeit auf §5 — saubere Sprache, keine Heilversprechen, Crisis-Off-Ramp prüfen.

---

## 10. Pre-Submit-Checkliste-Erweiterung (zur Build-59-Liste)

Neu hinzufügen:
- [ ] Mic-Permission-Dialog erscheint korrekt beim ersten Free-Mic-Tap (iOS + Android)
- [ ] Mic-Permission-Reject-Pfad zeigt sinnvolle deutsche Fehlermeldung
- [ ] Chat mit 200+ Messages getestet (Scroll, Memory, TTS-Anchor)
- [ ] Übungen mit Trigger-Warnungen sichtbar geprüft auf allen 3 Viewports
- [ ] Methodik-Quellen-Verweise korrekt formuliert (keine Heilversprechen)
- [ ] Page-Transitions degradieren sauber bei `prefers-reduced-motion`
- [ ] Card-Elevation in Dark-Mode geprüft (Schatten sind heller-Mode-optimiert)
- [ ] Voice-Free dokumentiert in App-Store-Connect "What's New"

---

## 11. Sprint-Zeitplan (2 Wochen + 2 Wochen Apple)

```
Tag 1     Voice Free (#1) + Mic-Permission-QA
Tag 2-3   Elevation-System (#2) + Companion-Glow (#8)
Tag 4-5   Chat-Virtualisierung (#4) — riskantester Punkt zuerst
Tag 6     Page-Transitions (#3) — wenn Top-5+1
Tag 7-8   Übungs-Sicherheits-Pass (#5) + Methodik-Footer
Tag 9     Tagebuch (#6) ODER Topics (#7) — je nach gewählter Liste
Tag 10    Pre-Submit-Audit (Checkliste #10 abarbeiten)
Tag 11    Bug-Fix-Tag + Cross-Viewport-QA
Tag 12    iOS-Build, TestFlight, Selbst-Test
Tag 13    Submit
Tag 14-21 Apple-Review-Buffer
```

Realistisch ist es **eher 12-14 Tage Build** als 7-10. Plane 2 Wochen + 2 Wochen Review.

---

## 12. Build-61-Backlog

In Reihenfolge meiner Empfehlung:
1. **Tool-Cards inline im Chat** (Ally-Kernidee) — größter strategischer Hebel
2. **Bibliothek-Redesign** (Topics + AudioLibrary mergen, Kategorien, Lektion-Progression)
3. **Settings-Reduktion auf 4 Sektionen** (Notfall #1)
4. **First-Message-Personalisierung** im Chat (Memory-Engine besser nutzen)
5. **Feedback-Row (👍👎📋🔊)** unter AI-Messages
6. **"Moment of the Day"** Audio-Pull-Trigger
7. **Performance-Tuning Phase 2** (Image-Optimization, Bundle-Splitting, Lazy-Routes)
8. **Inhaltliche Tiefen-Überarbeitung** — braucht externen psychologischen Input, eigene Projekt-Spur

---

## 13. Ein letzter ehrlicher Satz

Build 60 macht Soulvay **spürbar wertiger, niederschwelliger und ein Stück schneller**. Build 60 schließt **nicht** das Trust-Defizit gegenüber Ally — das wäre nur mit echtem Psycholog:innen-Team möglich, und das ist eine Geschäfts-Entscheidung, keine Code-Entscheidung.

Wenn du diese Erwartungshaltung trägst, ist Build 60 ein starkes Update. Wenn nicht, wirst du nach Submission denken "es fühlt sich besser an, aber Ally bleibt voraus". Beides ist OK — wichtig ist, dass du es vor Build-Start weißt.

Sag mir, welche 5-8 der Punkte aus §7 reinkommen, und ich starte mit #1.
