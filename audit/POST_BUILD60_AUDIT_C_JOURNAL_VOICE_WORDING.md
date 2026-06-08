# Audit C — Journal Voice-Input, KI-Reflexion & Premium-Wording

_Stand: 8. Juni 2026 · Build 60+ · Strang C · KEIN Code geändert_

---

## 1. Zweck

User-Beobachtung (wörtlich):

> "Bei den Notizen, das ist an sich gut so, aber da muss noch 'ne Sprachfunktion geben, dass man das da auch per Sprache einfach eingeben kann zum Mitfragen. Und ja, KI fragen ist auch gut, dann kann man da bestimmt eine KI noch mal fragen, was gut ist. Aber das Text Wording muss auch noch mal auf 'n höchstes Niveau gebracht werden, wie alles geschrieben wird, grade auch von der KI, wie das lädt und hier und da."

Drei Sub-Themen:
1. **Voice-Input ins Journal** — gibt es schon, aber sichtbar/auffindbar?
2. **KI-Reflexion ("KI fragen")** — heute teilweise, soll tiefer
3. **Wording auf Premium-Niveau** — KI-Antworten, Loading-States, Mikro-Copy

---

## 2. Bestandsaufnahme — Voice-Input im Journal

### 2.1 Befund: ist bereits implementiert ✅

`src/pages/Journal.tsx`:
```ts
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
...
const { isListening, fullTranscript, isSupported, startListening, stopListening, resetTranscript }
  = useSpeechRecognition(speechLang, { continuous: true });

useEffect(() => {
  if (fullTranscript && viewMode === "write") {
    setDraftContent((prev) => prev + (prev ? " " : "") + fullTranscript);
  }
}, [fullTranscript]);
```

**Funktion:** beim Diktieren wird Text live an `draftContent` angehängt. Native und Web werden unterstützt (`mem://technical/audio/native-speech-recognition-plugin`).

### 2.2 Befund: User sagt trotzdem "muss noch geben" ⚠️

→ Funktion ist da, aber **nicht entdeckt**. Mögliche Ursachen:
- **UI-Sichtbarkeit:** Wo ist der Mikrofon-Button im Journal-Editor? Visuell prominent oder versteckt?
- **Affordance:** Sieht er aus wie ein wichtiger Button oder wie ein Icon-Detail?
- **Onboarding-Hinweis fehlt:** Erste Journal-Session sagt nicht "Du kannst auch sprechen".

**Lovable: bitte prüfen** in `src/pages/Journal.tsx` und `src/components/journal/`:
- Wo wird `startListening`/`stopListening` gerendert?
- Größe, Position, Aktiv-/Inaktiv-Zustand?
- Mobile vs. Desktop?

### 2.3 Empfehlung

1. **Mikrofon-Button im Editor prominent** (mind. 44×44px, neben Send/Save, mit klarem Label "Sprich es ein" bei langem Press oder als kleiner Hint beim ersten Mal)
2. **Animation während Aufnahme** (Pulse / Wellenform) — wirkt "premium", signalisiert Aktivität
3. **Stop-Button visuell unmissverständlich** beim Aufnehmen
4. **Erstmaliger Tooltip** "Du kannst auch sprechen — tippe das Mikro 🎤"
5. **Mikrofon-Permission**-Fehler menschlich abfangen (z.B. iOS Settings-Verweis), nicht silent fail

---

## 3. Bestandsaufnahme — KI-Reflexion im Journal

### 3.1 Was es heute gibt

`Journal.tsx` ruft `journal-reflect` Edge Function:
- Liefert Sentiment + Brief-Reflexion
- Wird als **Toast** angezeigt (siehe Zeilen 117–129)

### 3.2 Probleme

1. **Toast ist die falsche UI** — verschwindet nach 5 Sek, kein Re-Read, kein Verlauf.
2. **Sentiment-JSON-Parsing** ist fragil (silent fail bei Parser-Fehler → User sieht nichts).
3. **Kein "KI fragen"-Button** im Sinne von "stell mir eine vertiefende Frage zu meinem Eintrag" — heute auto-getriggert, nicht User-initiiert.
4. **Kein Bridge zu Chat:** Wenn die Reflexion interessant ist, kann User nicht "weiterreden" — manueller Weg über `/chat`.

### 3.3 Empfehlung — Reflexion v2

**Statt Toast → Inline-Card am Ende des gespeicherten Eintrags:**
```
┌─ Eintrag gespeichert ───────────────┐
│ "Heute war ..."                     │
│                                     │
│ ✨ Eine Reflexion deiner Companion  │
│ ─────────────────────────────────── │
│ "Mir fällt auf, dass du oft 'müde'  │
│  schreibst. Was würde dir helfen,   │
│  diese Müdigkeit ernster zu nehmen?"│
│                                     │
│ [💬 Darüber reden] [📝 Weiter       │
│                     schreiben]      │
└─────────────────────────────────────┘
```

Funktionen:
- **Persistente Reflexion** — gespeichert in `journal_entries.reflection_text`
- **"Darüber reden"-Button** → öffnet Chat mit Kontext-Prompt der Reflexion (Bridge-Pattern, vgl. `mem://features/retention/habit-loops-and-bridges`)
- **Skeleton-Shimmer während Generation** (siehe Wording-Sektion)
- **Re-Generate-Button** falls User andere Perspektive will

---

## 4. Wording-Pass — Loading, KI-Antworten, Mikro-Copy

### 4.1 Loading-States — Audit

User-Wahrnehmung: "wie das lädt".

**Vermutlich heutige Loading-Copy (anhand i18n-Modulen `src/translations/`):**
- Chat: "Tippt..." / "Antwortet..."
- Journal-Reflect: vermutlich "Lade..." oder Spinner
- Voice: "Verbinde..." / "Spreche..."

**Goldstandard für Premium-Mental-Health-Apps (Calm, Headspace, Wysa):**
- Loading-Texte **wechseln**, nicht statisch
- Verwenden **warme, menschliche Verben** ("Hört zu...", "Denkt nach...", "Sucht passende Worte...")
- Begrenzte Animation, kein nervöses Spinning

**Empfehlung:** zentrale `src/lib/loadingCopy.ts` mit Sets pro Kontext (Chat/Journal/Voice/Insight), die rotieren.

### 4.2 KI-Antworten-Wording

User sagt: "muss noch mal auf 'n höchstes Niveau gebracht werden, wie alles geschrieben wird, grade auch von der KI".

**Was prüfen:**
- System-Prompts (`src/data/companionAgentPrompts.ts`) — DE-Sprachqualität?
- Anredeform-Konsistenz (`du` / `Sie`) — wird strikt eingehalten?
- Vermeidung von Anglizismen ("Insight", "Mindset" → "Erkenntnis", "Haltung"?)
- Begrenzung auf 3–5 Sätze (siehe `mem://ai/chat-system-structural-rules`) — wird das immer gehalten?
- Warme Verben (`mem://core` "Reflektiere statt Analysiere")

**Audit-Aufgabe (separater Sprint):** Stichprobe von 20 Chat-Antworten + 20 Reflexionen sammeln, sprachlich bewerten, System-Prompts anpassen.

### 4.3 Mikro-Copy — typische Schwachstellen

Typische Stellen, an denen Apps "App" statt "Premium" wirken:

| Stelle | Schwach | Stark |
|---|---|---|
| Empty State Journal | "Keine Einträge" | "Hier wartet dein erster Gedanke." |
| Fehler beim Speichern | "Fehler aufgetreten" | "Das hat nicht geklappt. Versuch es gleich noch mal." |
| Voice-Stop | "Aufnahme beendet" | "Ich hab dich gehört." |
| Subscription canceled | "Abo gekündigt" | "Schade, dass du gehst. Du bleibst bis [Datum] dabei." |
| Onboarding-Schritt-Übergang | "Weiter" | "Lass uns weitergehen." |

**Lovable: Stichprobe** — durchsuche `src/translations/de.ts` bzw. die DE-Module nach generischen Texten und liste die 10 schwächsten Strings.

---

## 5. Native-App-Politur — was den App-Store-Eindruck hebt

User-Wunsch: "alles auf native App gebracht werden... übliche Vorgehensweisen, bestimmte Mechanismen, um Apps extrem aufzuwerten".

### 5.1 Mechanismen, die Premium-Apps unterscheiden

| Mechanismus | Heute? | Wert |
|---|---|---|
| **Haptics** (light/medium/success) auf Buttons, Toggles, Save | unklar — prüfen | sehr hoch |
| **Native Sheets** statt Web-Dialoge (iOS BottomSheet) | teilweise | hoch |
| **Pull-to-refresh** auf Listen (Journal, Mood, Topics) | unklar | mittel |
| **Swipe-to-delete** auf Journal-Einträge | unklar | mittel |
| **Share-Sheet** für Journal-Eintrag-Export | nein | mittel |
| **Native Date-Picker** in Mood-Filtern | unklar | mittel |
| **Spring-Animationen** statt Linear (Framer Motion) | wahrscheinlich | hoch |
| **Skeleton-Shimmer** statt Spinner | unklar | hoch |
| **Active-States** (`active:scale-95`) auf jedem Touch-Target | unklar | hoch |
| **Safe-Area-Behandlung** vollständig | ja (`mem://core`) | erfüllt |
| **App-Icon-Badges** für ungelesene Insights | nein | niedrig |
| **Widget** (iOS) für Daily-Prompt | nein | hoch (sehr) — eigener Sprint |
| **Live-Activity** während Voice-Session | nein | niedrig |
| **Siri Shortcut** "Hey Siri, neuer Journal-Eintrag" | nein | mittel |
| **Spotlight-Suche** über Einträge | nein | niedrig |
| **Background-Audio** für Übungen (Lock-Screen-Controls) | unklar | hoch |

### 5.2 Empfehlung

**Quick-Hit-Liste (1 Sprint):**
1. **Haptics auditieren und überall ergänzen** (`@capacitor/haptics`) — Toggle/Save/Send/Error
2. **Spring-Animationen verifizieren** (Framer Motion `type: "spring"`) auf allen Karten/Transitions
3. **Skeleton-Shimmer überall einführen** statt Spinner
4. **Active-Scale auf Buttons** (`active:scale-[0.97] transition-transform`)
5. **Pull-to-refresh** auf Journal-Liste + Mood-History

**Größere Pakete (eigene Sprints):**
- iOS-Widget für Daily-Prompt
- Background-Audio für Audio-Library + Voice (Lock-Screen)
- Share-Sheet für Journal-Export

---

## 6. Reihenfolge der Code-Phasen (Vorschlag)

**Wenn Strang C kommt:**

1. **Voice-Input sichtbarer machen** (1–2h)
2. **Reflexion v2** (Inline statt Toast, persistent, mit Chat-Bridge) — 1 Sprint
3. **Haptics + Active-States + Skeleton-Pass** — 1 Sprint
4. **Loading-Copy zentralisiert + rotierend** — 0.5 Sprint
5. **KI-Prompt-Pass DE-Sprachqualität** — 1 Sprint (mit Stichproben-Validierung)
6. **Größere Native-Pakete** (Widget, Background-Audio, Share) — eigener Roadmap-Block

---

## 7. Offene Fragen

1. **Voice-Input:** Reicht "sichtbarer machen" oder ist auch eine **Voice-Mode-Variante** des Editors gewünscht (alles per Sprache, kein Text-Editor)?
2. **Reflexion v2:** Soll die Reflexion **immer auto-generiert** werden oder **on-demand** ("Lass mich nachdenken"-Button)?
3. **KI-Bridge zu Chat:** Soll der Chat-Kontext den Journal-Eintrag **als Quote zeigen** oder nur thematisch aufgreifen?
4. **Native-Pakete:** Welches Paket zuerst? Empfehlung von hier: **Haptics + Skeleton + Loading-Copy** (Sichtbarkeits-Boost), dann **Background-Audio**, dann **Widget**.

---

**Ende Audit C.**
