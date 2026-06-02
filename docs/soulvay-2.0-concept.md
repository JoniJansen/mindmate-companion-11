# Soulvay 2.0 — Strategie-Konzept

_Stand: 2. Juni 2026 · Build 51 live im App Store_

---

## 1. Wo Soulvay heute steht

**Stärken (was wir schon richtig gut machen):**
- Emotional-präsente AI-Persona statt "Therapie-Bot" — klare Differenzierung zu Wysa/Woebot
- Voice-First-Companion (ElevenLabs, Face-to-Face) — selten in der Kategorie
- Sauberes GDPR/Apple-Compliance-Setup (AI-Consent, DPA, Crisis-System)
- Premium-Strategie mit echtem Free-Wert (15 Msgs/Tag, blurred Insights als Trigger)

**Schwächen (was uns hochwertig-er macht):**
- Visueller Eindruck noch eher "App", nicht "Produkt" (Mikro-Polish, Motion, Tiefe)
- Onboarding endet zu früh — erstes Wow-Moment kommt erst nach 2-3 Sessions
- Habit-Loop hängt an Push/Daily-Prompt, kein "Pull"-Trigger
- Voice-Mode wirkt wie Feature, nicht wie Hauptbühne

---

## 2. Ally — was sie machen & wo wir besser werden

**Ally-Stärken (Annahmen, bitte korrigieren wenn nötig):**
- Sehr stark im Self-Discovery-Framing ("Wer bin ich?")
- Gamification / Progress-Visualisierung
- Stärkere Community-/Social-Komponente
- Klares Onboarding mit "Persönlichkeits-Setup"

**Unsere Konter-Positionierung:**
| Achse | Ally | Soulvay 2.0 |
|---|---|---|
| Ton | Analytisch, "kenn dich selbst" | Präsent, "ich bin bei dir" |
| Modus | Text, Tests, Insights | Voice-First, Conversation-First |
| Beziehung | Tool | Begleiter (mit Namen, Charakter, Erinnerung) |
| Tiefe | Selbstreflexion | Selbstreflexion **+ emotionale Co-Regulation** |

**Kernsatz:** _Ally hilft dir, dich zu verstehen. Soulvay ist da, wenn du dich nicht verstehst._

---

## 3. Top-12 konkrete Upgrades (priorisiert)

### A — Polish & Hochwertigkeit (Quick Wins, 1-3 Tage)

1. **Mikro-Motion-Pass** — alle Touch-Targets mit haptic-feel (`active:scale-95`, spring transitions), Companion-Avatar mit subtilem Breathing-Loop auf *jeder* Seite
2. **Skeleton → Shimmer** — statt Spinner überall Shimmer-Placeholder mit Brand-Gradient
3. **Sound-Design** — sanftes "tink" beim Nachricht-senden, weicher Chime beim AI-Reply (optional, default off, Premium-Wow)
4. **Typografie-Hierarchie schärfen** — Display-Größen für Greetings (32-40px), mehr Atemraum

### B — Habit & Retention (1-2 Wochen)

5. **"Moment of the Day"** — 1× pro Tag ein 30-Sek-Audio von der Companion zum Reinhören (statt nur Text-Prompt). Pull-Trigger.
6. **Streak-Reframe** — weg von Tagen, hin zu "Reflexions-Momenten" — kein Schuldgefühl bei Pause
7. **Weekly Letter** — Sonntag-Email/Push: "Was deine Woche dir gezeigt hat" als kurzer Brief der Companion (nicht Stats)

### C — Differenzierung gegen Ally (2-4 Wochen)

8. **Companion-Memory sichtbar machen** — kleine "Sie erinnert sich an…"-Cards, die zeigen *welche* Momente gemerkt wurden → emotionaler Moat
9. **Voice-First-Onboarding** — neue User hören die Companion in den ersten 30 Sek (Premium-Trigger sofort spürbar)
10. **Mood → Conversation → Insight Loop** schließen — heute getrennt, sollte als 1 zusammenhängender Flow gestaltet sein

### D — Premium-Wert vertiefen (laufend)

11. **3D-Companion-Avatar** (React-Three-Fiber roadmap existiert) — *der* visuelle Differenzierer, premium-only
12. **"Tiefen-Session"** — 20-Min-geführter Voice-Dialog zu einem Thema, einmal pro Woche, premium-exklusiv

---

## 4. Vorschlag: Was als nächstes gebaut wird

**Sprint 1 (diese Woche)** — Polish-Pass:
- Mikro-Motion + Active-States überall
- Skeleton-Shimmer statt Spinner
- Typografie-Hierarchie
- Bottom-Sheet-Komponente vereinheitlichen (z.T. inkonsistent)

**Sprint 2** — "Moment of the Day" (Audio-Pull-Trigger)

**Sprint 3** — Voice-First-Onboarding + Memory-Cards sichtbar

---

## 5. Offene QA-Punkte (vor Sprint 1 abarbeiten)

Damit ich Mobile/iPad/Desktop sauber durchklicken kann, brauche ich **einen eingeloggten Test-Account** (oder Demo-Mode auf Web freischalten). Sobald das steht, gehe ich systematisch durch:

- [ ] Landing — 390 / 820 / 1440 px
- [ ] Auth + Onboarding
- [ ] Home (Dashboard-Karten)
- [ ] Chat (Input-Bar, Send-Button, **Lock-Badge ✅ gefixt**)
- [ ] Voice / Face-to-Face
- [ ] Journal + Editor
- [ ] Mood (Heatmap, Insights)
- [ ] Toolbox / Exercise-Player
- [ ] Topics, Audio-Library
- [ ] Settings (alle Sub-Sections)
- [ ] Upgrade / Paywall
- [ ] Privacy, Terms, Safety

Findings dokumentiere ich pro Seite mit Screenshot + Fix-Vorschlag.
