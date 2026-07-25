# Feature-Upgrade-Plan — Soulvay

_Stand: 25. Juli 2026 · Analyse-only, nichts implementiert, nichts committet_

---

## 0. Ist-Stand (Kurz-Scan, damit nichts doppelt gebaut wird)

Die App ist deutlich feature-reicher als die übliche Ideenliste vermutet. **Bereits vorhanden:**

| Idee aus der Denkrichtung | Status im Code |
|---|---|
| Streak/Habit-Mechanik | ✅ Vorhanden: `useStreak` (Milestones 3/7/14/30/60/100), `StreakCounter`, `StreakMilestone`, `WeeklyProgress` — auf Home eingebunden |
| Atem-/Grounding-Übungen | ⚠️ Teilweise: Toolbox mit `ExercisePlayer` (animierter Atemkreis + TTS), aber nur **6 Übungen gesamt, davon 1 Atem- (`breathing-60`) und 1 Grounding-Übung (5-4-3-2-1)** |
| Mood-Trends-Visualisierung | ✅ Vorhanden: `MoodChart`, `MoodHeatmap`, `MoodInsights`, `EmotionalTimeline` (recharts) |
| Voice-Journal | ✅ Vorhanden: `Journal.tsx` nutzt `useSpeech` mit Sticky-Mic-Button (siehe auch Audit C zur Auffindbarkeit) |
| Tages-Impuls | ✅ In-App vorhanden: `useDailyPrompt` auf Home (Tabelle `daily_prompts`); als **Notification nur Web-API**, kein natives iOS |
| Companion-Gedächtnis sichtbar | ❌ **Lücke: `useMemoryMoments` existiert fertig (liest `user_memories`, Confidence-Filter, Session-Dedupe) — wird aber in KEINER Komponente verwendet** |
| Haptik | ❌ Lücke: kein `@capacitor/haptics` installiert, keine Haptik-Nutzung im Code |
| Onboarding | ✅ Vorhanden (452 Zeilen) + Tour-Komponenten; Personalisierungs-Hook `usePersonalization` existiert |

**Konsequenz:** Die größten Hebel sind nicht "neue Features", sondern (a) fertige, unsichtbare Substanz sichtbar machen und (b) vorhandene Player/Patterns mit mehr Inhalt füllen.

---

## 1. Top-Features-Shortlist

Aufwand: **S** = heute machbar · **M** = 1–3 Tage · **L** = größer

### F1 · Companion-Gedächtnis sichtbar machen — „Mira erinnert sich an…" · **S**
- **Nutzen:** Der emotionale Kern-USP eines KI-Begleiters — das Gefühl, wirklich gekannt zu werden. Backend (Function `extract-memories`, Tabelle `user_memories`) läuft bereits, der User sieht davon nur nichts.
- **Differenzierung:** Hoch. Kaum eine deutsche Mental-Health-App zeigt echtes Langzeit-Gedächtnis; das hebt Soulvay von "Chatbot" auf "Begleiterin".
- **Technik:** `useMemoryMoments` (fertig, ungenutzt) in `src/pages/Home.tsx` als Karte einbinden ("💭 Mira erinnert sich: …") und/oder als sanfter Einstiegs-Moment im Chat (`ChatMessages.tsx`). Optional: Abschnitt "Was Mira über dich weiß" in `CompanionSettings.tsx` (Liste + Löschen-Option = DSGVO-Plus).
- **Risiko:** Niedrig. Einziger Punkt: Formulierung sensibel halten (kein "Überwachungs"-Gefühl); Löschen-Option mitdenken.

### F2 · Übungs-Bibliothek ausbauen (4-7-8, Box-Breathing, PMR, Body-Scan) · **S**
- **Nutzen:** Toolbox wirkt mit 6 Übungen dünn; 4–5 neue evidenzbasierte Übungen verdoppeln den gefühlten Wert der App ohne eine Zeile Backend.
- **Differenzierung:** Mittel als Feature, hoch in Kombination mit dem animierten `ExercisePlayer` (Atemkreis + TTS-Stimme des Companions gibt es sonst nirgends).
- **Technik:** Nur `src/data/exercises.ts` erweitern (Datenstruktur mit Steps + Dauern ist etabliert, Player rendert automatisch). Kandidaten: 4-7-8-Atmung, Box-Breathing, Progressive Muskelentspannung (Kurzform), Body-Scan, Kohärenzatmung. Deutsche Texte via `getExerciseDisplay`/Translations-Pattern.
- **Risiko:** Sehr niedrig. Nur inhaltliche Sorgfalt (Anleitungen fachlich sauber formulieren).

### F3 · Mood→Übung-Brücke (kontextuelle Empfehlung nach Check-in) · **S**
- **Nutzen:** Schließt den Loop "Ich fühle mich schlecht → App bietet sofort etwas Wirksames an". Aktuell endet der Mood-Check-in ohne Handlungsangebot Richtung Toolbox (nur `MoodChatBridge` Richtung Chat existiert).
- **Differenzierung:** Mittel-hoch — adaptives Verhalten fühlt sich intelligent an.
- **Technik:** Kleine Komponente nach dem Check-in in `src/pages/Mood.tsx` (Pattern von `MoodChatBridge` kopieren): bei belastetem Mood z. B. "2 Minuten Atemübung?" → `navigate("/toolbox", { state: { startExercise: "breathing-60" } })` — **Auto-Start via `location.state.startExercise` wird von `Toolbox.tsx` bereits unterstützt.** Mapping Mood→Übung als simples Frontend-Objekt.
- **Risiko:** Niedrig. Nicht bevormundend formulieren ("Wenn du magst…").

### F4 · Haptik + native Micro-Interaktionen · **M**
- **Nutzen:** Der Unterschied zwischen "Web-App in Hülle" und "echter iOS-App": sanftes haptisches Feedback bei Check-in, Streak-Milestone, Übungs-Abschluss, Atemrhythmus.
- **Differenzierung:** Mittel — aber stark fürs Premium-Gefühl und App-Store-Bewertungen.
- **Technik:** `@capacitor/haptics` installieren, dünner Wrapper-Hook `useHaptics` (no-op im Web), Einbau an ~6 Stellen: `MoodSelector`, `StreakMilestone`, `ExercisePlayer` (Impuls pro Atemphase), Journal-Speichern, Chat-Senden.
- **Risiko:** Mittel — **neue native Dependency ⇒ iOS-Rebuild + TestFlight-Zyklus nötig** (Release-Prozess laut RELEASE.md). Nichts für "heute", gut als nächster Build-Baustein.

### F5 · Tages-Impuls als native Notification · **M–L**
- **Nutzen:** Retention-Hebel Nr. 1; der Impuls existiert in-app (`useDailyPrompt`), erreicht aber niemanden, der die App nicht öffnet.
- **Differenzierung:** Niedrig als Feature, hoch als Retention-Wirkung.
- **Technik:** `@capacitor/local-notifications` (Client-seitig planbar, kein Backend!), Scheduling in `usePushNotifications` erweitern (dort ist bislang nur Web-Notification-API), Settings-Toggle in `NotificationSettings.tsx` existiert konzeptionell schon.
- **Risiko:** Mittel-hoch: neue native Dependency, iOS-Permission-Flow, Timing-Logik über Zeitzonen — plus Apple-Review-Sensibilität. Bewusst nach dem Android-Launch einplanen.

### F6 · Voice-Journal auffindbar machen + Polieren · **S**
- **Nutzen:** Feature existiert (Sticky-Mic in `Journal.tsx`), wird laut Audit C aber nicht gefunden. Ein Einmal-Hinweis ("Tipp: Sprich deinen Eintrag einfach ein") + Live-Feedback (pulsierender Ring/Waveform beim Diktieren, `AudioWaveform.tsx` aus dem Chat wiederverwenden) macht es real nutzbar.
- **Differenzierung:** Mittel — Sprache ist für die Zielgruppe (abends, müde, Hemmschwelle Schreiben) der niedrigschwelligste Kanal.
- **Technik:** `src/pages/Journal.tsx` (Hint via localStorage-Flag, Waveform-Einbindung), keine neuen Hooks nötig.
- **Risiko:** Sehr niedrig.

### F7 · Onboarding: personalisierter erster Moment · **M**
- **Nutzen:** Vom Onboarding direkt in eine zur Antwort passende Erst-Erfahrung leiten (z. B. "viel Stress" → direkt in die 60-Sekunden-Atmung statt aufs leere Home). Erster "Aha-Moment" in Minute 1 = beste Conversion-Stelle vorm Paywall-Kontakt.
- **Differenzierung:** Mittel-hoch.
- **Technik:** `src/pages/Onboarding.tsx` (Routing am Ende verzweigen), `usePersonalization`/`useOnboardingStatus` als Datenquelle, Toolbox-Auto-Start wiederverwenden. Kein Backend.
- **Risiko:** Mittel: Onboarding ist konversionskritisch — Änderungen sauber testen (QA-Agent), nicht "mal eben".

### F8 · Sanfte Streak-Rückkehr statt härterer Gamification · **S–M**
- **Kritische Einordnung:** Die Streak-Mechanik existiert bereits vollständig. **Mehr** Streak-Druck (Freezes, Ranglisten) passt nicht zu einer Mental-Health-App und würde dem §20-Präventionsanspruch sogar schaden.
- **Nutzen stattdessen:** Ein "Willkommen zurück"-Moment nach Pausen ohne Schuldgefühl ("Schön, dass du wieder da bist — dein längster Streak wartet auf dich"), statt stillschweigend auf 0 zu fallen. `WelcomeBackCard.tsx` + `useReturnState` existieren als Andockpunkte.
- **Technik:** `src/components/home/WelcomeBackCard.tsx`, `useStreak` (longestStreak vorhanden). **Risiko:** Niedrig.

**Bewusst NICHT auf der Liste:** Mood-Trends-Visualisierung (bereits stark ausgebaut: Chart, Heatmap, Insights, Emotional Timeline — hier gibt es keinen echten Hebel mehr).

---

## 2. Empfehlung „Heute-Paket" (F1 + F2 + F3)

**Alle drei sind S, reines Frontend, null neue Backend-Functions, null neue Dependencies, kein Native-Rebuild:**

1. **F1 Memory-Moments sichtbar machen** — der größte Wow-Effekt pro Zeile Code im ganzen Backlog: der Hook ist fertig geschrieben und wartet nur auf eine Karte auf Home. Ein bereits bezahltes Backend-Feature wird endlich erlebbar.
2. **F2 Übungs-Bibliothek +4 Übungen** — reine Datei-Erweiterung (`src/data/exercises.ts`), der animierte Player rendert alles automatisch; verdoppelt den sichtbaren Inhalt der Toolbox an einem Nachmittag.
3. **F3 Mood→Übung-Brücke** — kleine Komponente, Auto-Start-Mechanik existiert schon; verbindet zwei bestehende Features zu einem spürbar "intelligenten" Verhalten.

**Warum genau diese Kombination:** Sie verstärken sich gegenseitig — F3 leitet in die durch F2 gewachsene Bibliothek, F1 gibt der App emotionale Tiefe. Zusammen verändern sie das Produktgefühl (persönlich + reichhaltig + adaptiv), ohne Lovable-Credits, Apple-Review oder neue Fehlerquellen im Backend zu berühren. Alle Änderungen liegen in 4–5 Frontend-Dateien und sind einzeln revertierbar.

*(F6 Voice-Journal-Hint ist der Reserve-Kandidat, falls Zeit übrig bleibt — ebenfalls S.)*

---

## 3. Stress-Kompass-Synergie (§20 SGB V)

**F2 ist der direkte Kurs-Baustein:** Atementspannung, Progressive Muskelentspannung und Body-Scan sind exakt die Entspannungsverfahren, die der ZPP-Leitfaden für §20-Präventionskurse (Handlungsfeld Stressmanagement/Entspannung) erwartet. Jede heute gebaute Übung im `ExercisePlayer` ist später 1:1 ein Modul-Baustein des "Stress-Kompass" — inklusive geführter Audio-Anleitung via TTS. Sekundär zahlt **F3** ein: die Kette *Belastung erkennen (Check-in) → Bewältigungsstrategie anwenden (Übung)* ist genau die Wirklogik, die im ZPP-Konzept beschrieben werden muss, und lässt sich dann mit echten App-Screens belegen. F8 (druckfreie Motivationsmechanik) stützt zusätzlich die präventionsethische Argumentation gegenüber der ZPP.
