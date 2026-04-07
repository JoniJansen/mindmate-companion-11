# SOULVAY – Master-Dokumentation

> Erstellt am: 2026-03-10 | Basierend auf vollständiger Code-Analyse

---

## A. APP-ÜBERBLICK

### Was ist SOULVAY?
SOULVAY ist eine KI-gestützte Mental-Wellness-App, die als psychologischer Begleiter für Selbstreflexion, emotionale Regulierung und persönliches Wachstum dient. Die App kombiniert KI-gesteuerte Gespräche mit Tagebuch-Funktionen, Stimmungs-Tracking, geführten Übungen und strukturierten Themen-Pfaden.

### Kernversprechen
"Ein ruhiger Raum für deinen Geist" — SOULVAY bietet einen sicheren, nicht-wertenden digitalen Begleiter, der zuhört, reflektiert und evidenzbasierte Techniken anbietet, ohne professionelle Therapie zu ersetzen.

### Zielgruppe
- Menschen, die emotionale Unterstützung suchen (Stress, Angst, Beziehungsthemen)
- Selbstreflektierende Personen, die ihre Muster verstehen wollen
- Menschen, die Zugang zu geführten Wellness-Übungen wünschen
- Deutsch- und englischsprachige Nutzer

### Hauptprobleme, die gelöst werden
1. Fehlender niedrigschwelliger Zugang zu emotionaler Unterstützung
2. Mangel an Struktur bei Selbstreflexion
3. Schwierigkeit, emotionale Muster zu erkennen
4. Bedarf an sofortiger Beruhigung bei Stress/Angst

### Kernfunktionen
1. **KI-Chat** mit 4 Modi (Freireden, Klären, Beruhigen, Muster)
2. **Tagebuch** mit freiem Schreiben, geführten Prompts, KI-Reflexion, Wochenrückblick
3. **Stimmungs-Tracking** mit Gefühls-Tags, Trends, Heatmap, Community-Insights
4. **Themen-Pfade** (Stress, Beziehungen, Familie, Selbstwert, Burnout, Entscheidungen, Trauer, Einsamkeit)
5. **Übungs-Toolbox** (Atemübungen, Grounding, kognitive Übungen, Werte-Klärung, Boundary-Setting)
6. **Sprach-Ein-/Ausgabe** (ElevenLabs TTS, Web Speech API STT)
7. **Premium-Abo** (RevenueCat für iOS, Stripe für Web)

---

## B. SITEMAP / SCREEN-ARCHITEKTUR

### Hauptnavigation (Bottom Tabs)
| Screen | Route | Zweck |
|--------|-------|-------|
| Chat | `/chat` | KI-Gespräche mit 4 Modi, Sprache, Nachrichten speichern |
| Journal | `/journal` | Tagebuch: freie Einträge, geführte Prompts, KI-Zusammenfassungen, Wochenrückblick |
| Topics | `/topics` | 8 strukturierte Themen-Pfade mit Lerninhalten, Reflexionsfragen, Notizen, KI-Chat |
| Mood | `/mood` | Stimmungs-Check-in, Gefühls-Tags, Trend-Diagramme, 90-Tage-Heatmap |
| Toolbox | `/toolbox` | 6 evidenzbasierte Übungen mit geführtem Player und Sprachführung |

### Standalone-Seiten
| Screen | Route | Zweck |
|--------|-------|-------|
| Landing | `/landing` | Marketing-Seite für neue Nutzer |
| Auth | `/auth` | Login/Signup/Passwort-Reset |
| Onboarding | `/welcome`, `/onboarding` | 6-Schritt-Einführung (Willkommen, Disclaimer, Präferenzen, Fokus, Frequenz, Ziel) |
| Settings | `/settings` | Profil, Sprache, Ton, Theme, Voice, Abo, Account, Admin |
| Upgrade | `/upgrade` | Premium-Seite mit Feature-Matrix und Abo-Checkout |
| Summary | `/summary` | Chat-Sitzungs-Zusammenfassung |
| Safety | `/safety` | Krisenressourcen und Notfallkontakte |
| Home | `/home` | "Space" — zentraler Einstiegspunkt (Head Dumps, Streak, Quick Actions) — **ACHTUNG: Nicht in aktueller Navigation eingebunden** |
| Timeline | `/timeline` | Chronologische Übersicht aller Einträge |
| Audio Library | `/audio` | Audio-Bibliothek |
| Install | `/install` | PWA-Installation |
| Privacy | `/privacy` | Datenschutzerklärung |
| Terms | `/terms` | Nutzungsbedingungen |
| Impressum | `/impressum` | Impressum |
| FAQ | `/faq` | Häufige Fragen |
| Cancellation | `/cancellation` | Widerrufsbelehrung |
| Contact | `/contact` | Kontakt |
| About | `/about` | Über SOULVAY |
| Delete Account | `/delete-account` | Account-Löschung |
| Admin | `/admin` | Admin-Panel (rollenbasiert) |
| Reset Password | `/reset-password` | Passwort-Neuvergabe nach E-Mail-Link |
| Review Instructions | `/review-instructions` | Anleitung für App-Store-Reviewer |
| Review Status | `/review-status` | Status der App für Reviewer |
| DevQA | `/dev-qa` | QA-Tools (nur DEV) |
| Diagnostics | `/diagnostics` | Diagnose-Tools (nur DEV) |
| NotFound | `*` | 404-Seite |

### Modals / Overlays
- **JournalEditor**: Vollbild-Modal zum Bearbeiten/Erstellen von Einträgen
- **SaveToJournalDialog**: Dialog zum Speichern von Chat-Nachrichten ins Tagebuch mit Titel
- **AISummaryDetail**: Detail-Ansicht für KI-Zusammenfassungen
- **ExercisePlayer**: Vollbild-Übungs-Player mit Timer und Sprachführung
- **UpgradePrompt**: Premium-Upgrade-Prompt (Modal und Banner)
- **CookieConsent**: DSGVO-Cookie-Banner
- **AppTour**: Geführte App-Tour für Erstnutzer
- **VoiceTranscriptConfirm**: Transkript-Bestätigung im Sprachmodus
- **StreakMilestone**: Streak-Meilenstein-Feier

---

## C. NAVIGATION

### Bottom Navigation (5 Tabs)
```
Chat → Journal → Topics → Mood → Toolbox
```
- Implementiert in `src/components/layout/BottomNav.tsx`
- Fixed am unteren Rand mit Safe-Area-Padding
- Labels lokalisiert (DE/EN)
- Aktiver Tab mit Primary-Farbe hervorgehoben
- Wird auf `/settings`, `/safety`, `/summary` ausgeblendet

### Navigation Guards
- **OnboardingGuard**: Prüft Auth-Status und Onboarding-Abschluss
  - Nicht authentifiziert + kein Onboarding → `/welcome`
  - Nicht authentifiziert + Onboarding abgeschlossen → `/auth`
  - Authentifiziert → Inhalt anzeigen
- **RootRedirect** (`/`): 
  - Authentifiziert → `/chat`
  - Onboarding abgeschlossen → `/auth`
  - Neuer Nutzer → `/landing`

### Header / Back Buttons
- `PageHeader`-Komponente mit optionalem Back-Button, Logo, rechtem Element
- Einstellungen-Icon (⚙️) oben rechts auf Hauptseiten → `/settings`
- Back-Button auf Standalone-Seiten

### Bedingte Navigation
- Home-Seite existiert (`/home`), ist aber **nicht in die Bottom Nav eingebunden** — erreichbar nur direkt via URL
- Admin-Panel nur sichtbar mit Admin-Rolle (geprüft via `useAdmin` Hook)
- DevQA und Diagnostics nur im DEV-Modus
- Review-Seiten öffentlich zugänglich (für App Store Reviewer)

### Potenzielle UX-Risiken
- **Home-Seite verwaist**: Die Home-Seite mit Streak, Quick Actions, Continue-Modul etc. ist umfangreich implementiert, aber nicht über die Navigation erreichbar
- **Settings nicht als Tab**: Zugang nur über das Zahnrad-Icon, das leicht übersehen werden kann
- **Safety-Seite**: Nur über Chat-Header erreichbar — könnte prominenter sein

---

## D. FEATURE-INVENTAR

### 1. KI-Chat-System
- **Zweck**: Emotionale Gespräche mit KI
- **Ort**: `/chat`
- **Modi**: Talk (frei), Clarify (geführte Reflexion, Premium), Calm (Beruhigung), Patterns (Muster-Erkennung, Premium)
- **Eingaben**: Text, Sprache (STT via Web Speech API)
- **Ausgaben**: Streaming-Text, Sprache (TTS via ElevenLabs)
- **Daten**: Nachrichten nicht persistent in DB (nur in Session-State)
- **Status**: ✅ Fertig

### 2. Tagebuch
- **Zweck**: Gedanken festhalten und reflektieren
- **Ort**: `/journal`
- **Funktionen**: Freier Eintrag, geführte Prompts, Tags, Kalender-Filter, Sortierung, Suche, KI-Reflexion, Wochenrückblick
- **Daten**: `journal_entries` Tabelle (content, mood, tags, source, title)
- **Status**: ✅ Fertig

### 3. Chat-zu-Journal Integration
- **Zweck**: Chat-Nachrichten, Gespräche und KI-Zusammenfassungen im Tagebuch speichern
- **Ort**: Chat-Seite → SaveToJournalDialog
- **Varianten**: Einzelne Nachricht, ganzes Gespräch, KI-generierte Zusammenfassung
- **Status**: ✅ Fertig

### 4. Wochenrückblick
- **Zweck**: KI-generierte Wochenanalyse aus Tagebucheinträgen und Mood-Checkins
- **Ort**: Journal-Seite
- **Edge Function**: `weekly-recap`
- **Ausgabe**: Muster, potenzielle Bedürfnisse, Vorschlag, Zusammenfassung
- **Daten**: `weekly_recaps` Tabelle
- **Status**: ✅ Fertig

### 5. KI-Zusammenfassung (Chat Summary)
- **Zweck**: Strukturierte Zusammenfassung eines Chat-Gesprächs
- **Ort**: Chat-Seite (Action Buttons)
- **Edge Function**: `generate-summary`
- **Ausgabe**: Summary, emotionale Themen, Stimmungsverlauf, nächster Schritt
- **Status**: ✅ Fertig

### 6. Stimmungs-Tracking
- **Zweck**: Emotionale Selbsteinschätzung
- **Ort**: `/mood`
- **Funktionen**: 5-Stufen-Mood-Selector, Gefühls-Tags (12 Optionen), Notiz, Trend-Chart (7/30/90 Tage), 90-Tage-Heatmap, Muster-Insights, Community-Insights
- **Daten**: `mood_checkins` Tabelle
- **Status**: ✅ Fertig

### 7. Themen-Pfade
- **Zweck**: Strukturierte psychoedukative Inhalte
- **Ort**: `/topics`
- **8 Themen**: Stress, Beziehungen, Familie, Selbstwert, Burnout, Entscheidungen, Trauer, Einsamkeit
- **Pro Thema**: Lerninhalte (mit Reflexionsfragen), Reflexionspfad (4-6 Schritte), Notizen, KI-Chat
- **Fortschritt**: In localStorage gespeichert
- **Status**: ✅ Fertig

### 8. Übungs-Toolbox
- **Zweck**: Evidenzbasierte Wellness-Übungen
- **Ort**: `/toolbox`
- **6 Übungen**: 60-Sekunden-Atmung, Gedanken-Reframing, Geführtes Journaling, Werte-Klärung, Boundary-Setting, 5-4-3-2-1 Grounding
- **Player**: Timer, Schritt-für-Schritt-Anleitung, Sprachführung (TTS), Pause/Resume
- **Sprachführung**: Vollständig lokalisierte Speech-Overrides für DE/EN
- **Status**: ✅ Fertig

### 9. Sprach-Features
- **Eingabe**: Web Speech API (STT), kontinuierlich, mit Transkript-Bestätigung
- **Ausgabe**: ElevenLabs TTS, verschiedene Stimmen, Geschwindigkeitsregelung
- **Einstellungen**: Stimmentyp, Geschwindigkeit, Auto-Play, Avatar-Stil
- **Status**: ✅ Fertig (Premium-Feature)

### 10. Streak & Gamification
- **Zweck**: Nutzer-Engagement durch Streaks
- **Ort**: Home-Seite (verwaist), allgemein über `useStreak` Hook
- **Funktionen**: Tages-Streak, Wochen-Fortschritt, Meilensteine
- **Daten**: `user_activity_log` Tabelle
- **Status**: ✅ Fertig, aber **Home-Seite nicht in Navigation**

### 11. Personalisierung
- **Onboarding**: Sprache, Ton, Anrede, Fokusbereiche, Reflexionshäufigkeit, persönliches Ziel
- **Adaptive Vorschläge**: Stimmungsbasierte Übungs-Empfehlungen
- **Continue-Modul**: Fortsetzen von Übungen, Themen, Entwürfen
- **Status**: ✅ Fertig

### 12. Premium/Abo-System
- **Zweck**: Monetarisierung
- **Ort**: `/upgrade`, Settings
- **Plattformen**: RevenueCat (iOS), Stripe (Web), Apple IAP
- **Premium-Features**: Voice, Clarify-Modus, Patterns-Modus, Wochenrückblick, Session-Summary, Geführte Prompts, Volle Übungsbibliothek
- **Free-Features**: Talk-Modus, Calm-Modus, Freies Tagebuch, Mood-Checkins, Kern-Übungen, Krisenressourcen
- **Tägliches Limit (Free)**: 15 Nachrichten/Tag
- **Status**: ✅ Fertig

### 13. Authentifizierung
- **Methoden**: E-Mail/Passwort (Signup, Login, Passwort-Reset)
- **Review-Login**: Spezieller Login für App Store Reviewer
- **Profil**: display_name, avatar_url, language
- **Status**: ✅ Fertig

### 14. DSGVO/Datenschutz
- **Cookie-Consent**: Verzögertes Anzeigen nach Onboarding
- **Account-Löschung**: Dedizierte Seite + Edge Function
- **Datenschutz/Impressum/AGB**: Vollständige Rechtsseiten
- **Status**: ✅ Fertig

### 15. App Tour
- **Zweck**: Erstnutzer-Einführung
- **Implementierung**: `TourProvider` + `AppTour` + `TabHint`
- **Status**: ✅ Fertig

### 16. Offline-Banner
- **Zweck**: Netzwerkstatus-Anzeige
- **Implementierung**: `OfflineBanner` + `useNetworkStatus`
- **Status**: ✅ Fertig

### 17. Dark Mode
- **Implementierung**: CSS-Variablen mit `.dark`-Klasse, Theme-Hook
- **Optionen**: Light, Dark, System
- **Status**: ✅ Fertig

---

## E. USER-FLOWS

### Signup / Login
1. Nutzer öffnet App → Landing-Seite (`/landing`)
2. Klick auf "Start Your Journey" → Onboarding (`/welcome`)
3. 6 Schritte: Willkommen → Disclaimer → Präferenzen → Fokus → Frequenz → Ziel
4. Weiterleitung zu Auth (`/auth?from=onboarding`) mit Signup-Vorauswahl
5. E-Mail + Passwort eingeben → E-Mail-Bestätigung erforderlich
6. Nach Bestätigung: Login → Weiterleitung zu `/chat`
- **Edge Case**: Review-Login umgeht E-Mail-Bestätigung

### Chat starten
1. Nutzer navigiert zu Chat-Tab
2. Personalisierte Begrüßung basierend auf Onboarding-Daten
3. Chat-Modus wählen (Talk/Clarify/Calm/Patterns)
4. Text eingeben oder Spracheingabe nutzen
5. Streaming-Antwort empfangen
6. Optional: Nachricht ins Tagebuch speichern, Zusammenfassung erstellen
- **Edge Case**: Offline → Toast-Fehlermeldung
- **Edge Case**: Rate-Limit → spezifische Fehlermeldung
- **Edge Case**: Free-Limit erreicht → Upgrade-Prompt

### Journal-Eintrag erstellen
1. Journal-Tab → "Freier Eintrag"
2. Text schreiben (optional: Spracheingabe)
3. Tags hinzufügen (optional)
4. "Weiter" → JournalEditor-Modal
5. Titel und Stimmung ergänzen → Speichern
6. Non-Blocking Sentiment-Analyse im Hintergrund

### Mood tracken
1. Mood-Tab → Slider (1-5)
2. Gefühls-Tags wählen (optional)
3. Notiz hinzufügen (optional)
4. Speichern → Toast-Bestätigung
5. Trend-Chart und Heatmap werden aktualisiert

### Übungen nutzen
1. Toolbox-Tab → Kategorie wählen
2. Übung auswählen → Info-Ansicht
3. "Jetzt starten" → ExercisePlayer öffnet sich
4. Automatischer Timer mit Schritt-für-Schritt-Anleitung
5. Optionale Sprachführung (TTS)
6. Abschluss → Toast + Activity-Log

### Premium abschließen
1. Upgrade-Prompt oder Settings → Upgrade
2. Plan wählen (Monthly/Yearly)
3. AGB + Widerrufsrecht akzeptieren
4. iOS: RevenueCat In-App Purchase
5. Web: Stripe Checkout
6. Status wird alle 5 Min geprüft

### Passwort zurücksetzen
1. Auth-Seite → "Passwort vergessen"
2. E-Mail eingeben → Reset-Link per E-Mail
3. Link führt zu `/reset-password`
4. Neues Passwort eingeben → `updateUser({ password })`

### Account löschen
1. Settings → Account → Löschen
2. `/delete-account` Seite
3. Edge Function `delete-account` wird aufgerufen
4. Alle Daten werden gelöscht

---

## F. CHAT- / KI-SYSTEM

### Chat-Modi
| Modus | Zweck | Tier |
|-------|-------|------|
| Talk | Freies emotionales Gespräch, Zuhören | Free |
| Clarify | Geführte Reflexion, sokratisches Fragen | Premium |
| Calm | Emotionale Regulierung, Grounding | Free |
| Patterns | Muster-Erkennung, Psychoedukation | Premium |

### System-Prompt-Aufbau
1. **Basis-System-Prompt** (in `chat/index.ts`):
   - Rollendefiniton als "Soulvay"
   - Spracheinstellung (DE/EN)
   - Ton (gentle/neutral/structured)
   - Anrede (du/Sie)
   - Strikte Regeln: keine Diagnosen, keine medizinischen Ratschläge
   - Krisen-Erkennung mit dedizierten Sicherheitsantworten
   - Innerer-Dialog-Feature (optional)
2. **Modus-Prompt** (in `ChatModeSelector.tsx`): Rollenspezifische Anweisungen
3. **Personalisierungs-Kontext**: Fokusbereiche und persönliches Ziel aus Onboarding
4. **Themen-Kontext** (bei Topic-Chat): Themenspezifischer Prompt

### Krisen-Erkennung
- 30+ Schlüsselwörter für Selbstverletzung, Suizid, Gewalt
- Prüfung der letzten 3 Nutzernachrichten
- Bei Erkennung: dedizierte Sicherheitsantwort mit Notfallnummern (DE: 0800 111 0 111, EN: 988)

### Chat-Historie
- **Nicht persistent in Datenbank** — nur Session-State (`useState`)
- Chat-Nachrichten gehen beim Seitenwechsel verloren
- Optional: Gespräch kann ins Tagebuch gespeichert werden

### Streaming
- SSE-basiertes Streaming via Edge Function
- Chunk-Buffering mit `requestAnimationFrame` für Performance
- Abort-Controller für Abbruch bei neuem Senden

### AI-Modell
- **Gemini 3 Flash Preview** (`google/gemini-3-flash-preview`) für Chat
- **Gemini 2.5 Flash** für Weekly Recap und Summary
- Zugang via Lovable AI Gateway (`ai.gateway.lovable.dev`)

### AI-bezogene Edge Functions
| Function | Zweck |
|----------|-------|
| `chat` | Haupt-Chat-Funktion mit Streaming |
| `journal-reflect` | Reflexion, Sentiment-Analyse, Muster |
| `weekly-recap` | Wöchentliche Analyse |
| `generate-summary` | Chat-Zusammenfassung |
| `text-to-speech` | ElevenLabs TTS-Proxy |

### Zusammenhänge
```
Chat ──[speichern]──→ Journal (Nachricht/Gespräch/Summary)
Chat ──[calm mode]──→ Toolbox (Atemübung/Grounding)
Chat ──[summary]───→ Summary-Seite
Journal ──[reflect]──→ journal-reflect Edge Function
Journal ──[recap]────→ weekly-recap Edge Function
Mood ──[talk]────────→ Chat (mit Stimmungskontext)
Topics ──[AI chat]───→ chat Edge Function (mit Themenkontext)
Topics ──[steps]─────→ Chat/Journal/Toolbox (je nach Schritt-Typ)
```

---

## G. DATENMODELL / BACKEND

### Datenbanktabellen

#### `profiles`
| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| display_name | text | Yes | — |
| avatar_url | text | Yes | — |
| language | text | Yes | 'de' |
| created_at | timestamptz | No | now() |
| updated_at | timestamptz | No | now() |
- **RLS**: Nutzer können nur eigenes Profil lesen/schreiben
- **Trigger**: Auto-Erstellung bei Signup via `handle_new_user()`

#### `journal_entries`
| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | Yes | — |
| user_session_id | text | No | — |
| title | text | Yes | — |
| content | text | No | — |
| mood | text | Yes | — |
| source | text | Yes | 'manual' |
| tags | text[] | Yes | '{}' |
| prompt_id | text | Yes | — |
| created_at | timestamptz | No | now() |
| updated_at | timestamptz | No | now() |
- **Sources**: 'manual', 'free', 'chat', 'chat-summary', 'guided', 'voice-dump', 'topic-notes'
- **RLS**: Nutzer können nur eigene Einträge CRUD

#### `mood_checkins`
| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | Yes | — |
| user_session_id | text | No | — |
| mood_value | integer | No | — |
| feelings | text[] | Yes | '{}' |
| note | text | Yes | — |
| created_at | timestamptz | No | now() |
- **RLS**: Nutzer können nur eigene Check-ins CRUD

#### `weekly_recaps`
| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | Yes | — |
| user_session_id | text | No | — |
| time_range | text | No | '7d' |
| patterns | text[] | Yes | '{}' |
| potential_needs | text[] | Yes | '{}' |
| suggested_next_step | text | Yes | — |
| summary_bullets | text[] | Yes | '{}' |
| created_at | timestamptz | No | now() |
- **RLS**: Nutzer können nur eigene Recaps CRUD

#### `subscriptions`
| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | Yes | — |
| user_session_id | text | No | — |
| status | text | No | 'inactive' |
| plan_type | text | Yes | — |
| stripe_customer_id | text | Yes | — |
| stripe_subscription_id | text | Yes | — |
| current_period_start | timestamptz | Yes | — |
| current_period_end | timestamptz | Yes | — |
| cancel_at_period_end | boolean | Yes | false |
- **RLS**: Nutzer SELECT eigene; Service-Role INSERT/UPDATE/SELECT

#### `user_activity_log`
| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| activity_type | text | No | — |
| activity_date | date | No | CURRENT_DATE |
| created_at | timestamptz | No | now() |
- **Activity Types**: 'chat_session', 'journal_entry', 'exercise_completed', 'mood_checkin'
- **RLS**: Nutzer können nur eigene Activities lesen/erstellen (kein UPDATE/DELETE)

#### `user_roles`
| Spalte | Typ | Nullable | Default |
|--------|-----|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| role | app_role (enum) | No | — |
| created_at | timestamptz | No | now() |
- **Enum**: admin, moderator, user
- **RLS**: Nutzer sehen eigene Rolle; Admins sehen/verwalten alle
- **Security Definer Function**: `has_role(_user_id, _role)`

### Storage Buckets
- **avatars**: Öffentlich, für Profilbilder

### Edge Functions
| Function | Auth | Zweck |
|----------|------|-------|
| `chat` | JWT (requireUser) | KI-Chat mit Streaming |
| `journal-reflect` | JWT | Tagebuch-Reflexion, Sentiment, Muster |
| `weekly-recap` | JWT | Wochenrückblick-Generierung |
| `generate-summary` | JWT | Chat-Zusammenfassung |
| `text-to-speech` | JWT | ElevenLabs TTS-Proxy |
| `create-checkout` | JWT | Stripe Checkout-Session |
| `stripe-webhook` | Stripe Signature | Webhook für Abo-Events |
| `manage-subscription` | JWT | Abo-Status, Kündigung, Portal |
| `revenuecat-webhook` | RC Secret | RevenueCat Webhook |
| `verify-apple-receipt` | JWT | Apple IAP Verifizierung |
| `delete-account` | JWT | Account-Löschung |
| `admin` | JWT + Admin-Rolle | Admin-Operationen |
| `setup-review-account` | — | Review-Account erstellen |

### Risiken im Datenmodell
- **Chat-Nachrichten nicht persistent**: Gespräche gehen beim Refresh verloren
- **user_session_id**: Redundant mit user_id, historisches Artefakt
- **Kein Foreign Key zu auth.users**: Bewusste Design-Entscheidung (Supabase-Best-Practice)

---

## H. AUTH / USER / PREMIUM

### Authentifizierung
- **Provider**: Supabase Auth (E-Mail/Passwort)
- **E-Mail-Bestätigung**: Erforderlich (nicht auto-confirm)
- **Session**: `onAuthStateChange` Listener + `getSession()`
- **Context**: `AuthProvider` in `AuthContext.tsx`

### Protected Routes
- Alle Haupt-App-Routen über `OnboardingGuard`
- Prüfung: Auth → Onboarding → Weiterleitung
- Öffentliche Routen: Landing, Auth, Onboarding, Safety, Privacy, Terms, Impressum, FAQ, etc.

### Password Reset
1. `resetPasswordForEmail()` mit `redirectTo: /reset-password`
2. Dedizierte `/reset-password` Seite
3. `updateUser({ password })` zum Aktualisieren

### Nutzerprofil
- Tabelle: `profiles` (display_name, avatar_url, language)
- Auto-Erstellung via DB-Trigger `handle_new_user()`
- Profilbild-Upload in `avatars` Storage Bucket (auf Native deaktiviert wegen iPad-Crashes)

### Premium-Status (Entscheidungslogik)
```
Entitlement Simulator (DEV) > RevenueCat (iOS) > Supabase Subscription > localStorage
```

### Subscription-Logik
- **iOS**: RevenueCat SDK (`@revenuecat/purchases-capacitor`)
  - Produkte: `mindmate_plus_monthly`, `mindmate_plus_yearly`
  - Entitlement: `premium`
- **Web**: Stripe Checkout
  - Edge Functions: `create-checkout`, `stripe-webhook`, `manage-subscription`
  - Zahlungsmethoden: Card, PayPal (kein Klarna)
- **Review-Modus**: Auto-Premium für Review-Accounts

### Feature Flags (Premium)
| Feature | Free | Premium |
|---------|------|---------|
| Talk-Modus | ✅ | ✅ |
| Calm-Modus | ✅ | ✅ |
| Clarify-Modus | ❌ | ✅ |
| Patterns-Modus | ❌ | ✅ |
| Voice (TTS/STT) | ❌ | ✅ |
| Geführte Prompts | ❌ | ✅ |
| KI-Reflexion | ❌ | ✅ |
| Wochenrückblick | ❌ | ✅ |
| Session-Summary | ❌ | ✅ |
| Tägliche Nachrichten | 15/Tag | ∞ |

### Sicherheitsrisiken
- Premium-State wird primär in **localStorage** gespeichert → theoretisch manipulierbar
- Backend-Prüfung via `manage-subscription` alle 5 Min als Absicherung
- Review-Modus-Aktivierung über `isReviewModeActive()` (localStorage-Flag) → könnte manipuliert werden

---

## I. UI / UX / DESIGN-SYSTEM

### Visueller Stil
- **Philosophie**: Clean, premium, beruhigend für Mental Health
- **Ästhetik**: Minimalistisch mit Waldgrün-Akzenten, warme Neutraltöne
- **Font**: Plus Jakarta Sans (300-700)
- **Ecken**: 0.875rem (14px) Standard-Radius

### Farbsystem (CSS Custom Properties)
- **Light Mode**: Weiße/neutrale Hintergründe, Forest Green Akzente
- **Dark Mode**: Tiefes Dunkelgrün, gedämpfte Emerald-Akzente
- **Semantische Tokens**: `--primary`, `--calm`, `--gentle`, `--accent`, `--destructive`
- **Soft-Varianten**: `--primary-soft`, `--calm-soft`, `--gentle-soft`, `--accent-soft`

### Komponentensystem
- **Basis**: shadcn/ui (Radix UI + Tailwind)
- **Custom**: `CalmCard` (3 Varianten: calm, gentle, elevated), `TabHint`
- **Shadows**: 3 Stufen (`--shadow-soft`, `--shadow-card`, `--shadow-elevated`)

### Layout-Muster
- Fixed Viewport (kein body-scroll, `position: fixed`)
- `scroll-container` Klasse für inneres Scrolling
- Safe-Area-Handling via `safeArea.ts` (BOTTOM_NAV_HEIGHT, fullScreenWithNav)
- Max-Width Container: `max-w-lg` (mobile), `md:max-w-2xl`, `lg:max-w-4xl`
- Responsive Grid in Journal: 1-col (mobile), 2-col (md), 3-col (lg)

### Tap-Targets
- Globales Minimum: 44×44px für alle interaktiven Elemente
- Ausnahme: Inline-Links

### Animationen
- framer-motion für Seitenübergänge, Cards, Tabs
- Skeleton-Loading mit CSS-Animation
- Subtile Active-States (brightness filter)

### Stärken
- Konsistentes, beruhigendes Farbsystem
- Durchdachte Safe-Area-Behandlung für iOS
- Gute Touch-Target-Größen
- Elegante Card-Komponenten

### Schwächen
- **Home-Seite nicht zugänglich** — viel ungenutztes UI
- Einige Seiten (Settings) sind sehr lang und könnten von Tabs profitieren
- Kalender-Popover im Journal könnte auf kleinen Screens problematisch sein

---

## J. CONTENT / TEXTE / TONALITÄT

### Tonalität
- Warm, empathisch, nicht-klinisch
- "Begleiter"-Sprache statt "Therapeuten"-Sprache
- Validierend ohne zu diagnostizieren
- Druckfrei: "Vielleicht..." statt "Du solltest..."

### i18n-System
- **Hook**: `useTranslation()` mit ~500+ Übersetzungsschlüsseln
- **Plain-Text**: `i18nPlain.ts` für Nicht-React-Kontexte
- **Themen**: `getTopicDisplay()` mit vollständigen DE/EN-Übersetzungen
- **Übungen**: `getExerciseDisplay()` mit lokalisierten Titeln und Beschreibungen
- **Speech-Overrides**: Vollständig lokalisierte Sprachführung im ExercisePlayer

### Konsistenz
- **Gut**: Alle UI-Texte über i18n-System
- **Risiko**: Einige Texte in Edge Functions sind hardcoded
- **Themen-Daten**: Englisch als Basis in `topics.ts`, Übersetzungen via Hook

### Verbesserungspotenzial
- Onboarding-Texte könnten emotionaler sein
- Einige Error-Messages sind generisch
- "mindmate" Prefix in localStorage-Keys (Legacy-Name, nicht SOULVAY)

---

## K. TECHNISCHE ARCHITEKTUR

### Frontend-Stack
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + shadcn/ui
- **Animation**: framer-motion
- **State**: React Context (Auth) + useState/useEffect (lokal) + localStorage (Persistenz)
- **Queries**: TanStack React Query (konfiguriert, aber wenig genutzt)
- **Charts**: Recharts (Mood-Trends)

### Wichtige Hooks
| Hook | Zweck |
|------|-------|
| `useAuth` | Auth-State und -Actions |
| `useTranslation` | i18n mit ~500 Schlüsseln |
| `usePremium` | Premium-State, Feature Flags, Abo-Actions |
| `useStreak` | Streak-Berechnung und Wochen-Stats |
| `useActivityLog` | Activity-Tracking |
| `useLastState` | Continue-Modul State |
| `usePersonalization` | Adaptive Vorschläge |
| `useSpeechRecognition` | Web Speech API STT |
| `useElevenLabsTTS` | ElevenLabs TTS |
| `useVoiceSettings` | Voice-Konfiguration |
| `useTheme` | Dark/Light/System + Akzentfarben |
| `useOnboardingStatus` | Onboarding-Completion |
| `useRevenueCat` | RevenueCat SDK |
| `useAppleIAP` | Apple In-App Purchase |
| `useSwipeBack` | Swipe-Back-Geste |
| `useNetworkStatus` | Online/Offline-Status |
| `useBackupReminder` | Backup-Erinnerung |
| `useAdmin` | Admin-Rollen-Check |
| `useAnalytics` | Analytics-Tracking |
| `useSessionId` | Session-ID-Generierung |
| `useNetworkSimulator` | Netzwerk-Simulation (DEV) |
| `useEntitlementSimulator` | Premium-Simulation (DEV) |

### Code-Splitting
- Eagerly loaded: Chat, Auth, Onboarding
- Lazy loaded: Alle anderen Seiten via `React.lazy()`

### Native / PWA / Capacitor
- **Capacitor**: iOS + Android Support (`@capacitor/ios`, `@capacitor/android`)
- **Bundle ID**: `com.jonathanjansen.mindmate`
- **PWA**: `vite-plugin-pwa` konfiguriert, `manifest.json` vorhanden
- **Native-Erkennung**: `window.Capacitor` Check für plattformspezifisches Verhalten
- **Native-spezifisch**: Avatar-Upload deaktiviert, Store-Badges versteckt, Stripe-Links ausgeblendet

### Externe Services
| Service | Zweck |
|---------|-------|
| Lovable AI Gateway | KI-Chat, Zusammenfassungen |
| ElevenLabs | Text-to-Speech |
| Stripe | Web-Zahlungen |
| RevenueCat | iOS In-App-Purchases |
| Supabase | Auth, DB, Storage, Edge Functions |

---

## L. RISIKEN / SCHWÄCHEN / OFFENE BAUSTELLEN

### Bugs
1. **Home-Seite verwaist**: Umfangreiche Seite mit Streak, Continue-Modul, Quick Actions, die nirgends in der Navigation eingebunden ist
2. **localStorage-Prefix "mindmate"**: Legacy-Name statt "soulvay" — funktional kein Problem, aber inkonsistent
3. **Chat-Nachrichten nicht persistent**: Gespräche gehen bei Page-Refresh verloren

### Technische Schulden
1. **React Router v6 Deprecation Warnings**: `v7_startTransition` und `v7_relativeSplatPath` Flags nicht gesetzt
2. **`user_session_id`** in allen Tabellen: Redundant mit `user_id`, historisches Artefakt
3. **`as any` Casts** bei Supabase-Inserts: Type-Safety umgangen
4. **TanStack Query kaum genutzt**: Konfiguriert, aber die meisten Daten werden manuell mit `useEffect` + `useState` geladen

### UX-Probleme
1. **Kein Zugang zur Home-Seite**: Streaks, Weekly Progress, Continue-Modul sind nicht sichtbar
2. **Settings-Seite sehr lang**: Könnte von Kategorien/Tabs profitieren
3. **Premium-Gate unklar**: Nutzer merken möglicherweise nicht, welche Features gesperrt sind

### Sicherheitsrisiken
1. **Premium-State in localStorage**: Kann im Browser manipuliert werden (Backend-Check als Mitigation vorhanden)
2. **Review-Mode in localStorage**: `isReviewModeActive()` prüft localStorage-Flag
3. **`verify_jwt = false`** auf Webhook-Funktionen: Korrekt für Webhooks, aber muss Signature-Verifizierung gewährleisten

### App-Store-Risiken
1. **Avatar-Upload auf iPad deaktiviert**: Workaround für Crashes — Ursache nicht gelöst
2. **Stripe-Links auf Native versteckt**: Korrekt, aber fragile Erkennung über `window.Capacitor`
3. **"mindmate" im Bundle ID**: Legacy-Name, könnte bei Review auffallen

### Datenschutz
1. **Chat-Nachrichten nicht verschlüsselt**: Werden über HTTPS übertragen, aber nicht E2E-verschlüsselt (Landing-Seite sagt "End-to-end encrypted" — **irreführend**)
2. **Mood-Daten und Journal-Einträge** in Klartext in Supabase gespeichert

---

## M. VERBESSERUNGSPOTENZIAL

### 1. Quick Wins (P0-P1)
1. ✅ **Home-Seite in Navigation einbinden** oder Streak/Continue in bestehende Tabs integrieren
2. ✅ **"End-to-end encrypted" Claim entfernen** von Landing-Seite (irreführend)
3. ✅ **React Router v7 Future Flags** setzen (Warnings entfernen)
4. ✅ **localStorage-Prefix** von "mindmate" zu "soulvay" migrieren (mit Fallback)

### 2. Produktqualität
5. **Chat-Verlauf persistent speichern** (letzte N Gespräche in DB oder localStorage)
6. **Settings-Seite** in Kategorien aufteilen (Profil, Darstellung, Voice, Abo, Account)
7. **Onboarding-Flow polieren**: Animationen, emotionalere Texte

### 3. UX
8. **Premium-Features klarer kennzeichnen**: Lock-Icons + Tooltips
9. **Empty States** konsistenter gestalten
10. **Swipe-Navigation** zwischen Topics-Tabs

### 4. Conversion / Premium
11. **Trial-Periode** anbieten (7 Tage kostenlos)
12. **In-App-Prompts** nach Nutzung von Premium-Features
13. **Upgrade-Seite**: Testimonials oder Social Proof hinzufügen

### 5. Technische Stabilität
14. **TanStack Query** für alle Datenabrufe nutzen (statt manuellem fetching)
15. **Error Boundary** pro Seite statt global
16. **`as any` Casts** eliminieren durch korrekte Typen

### 6. Datenschutz / Compliance
17. **Verschlüsselungs-Claim** korrigieren
18. **Data-Export-Funktion** für DSGVO Art. 20
19. **Cookie-Consent** Kategorien detaillierter

### 7. App-Store-Readiness
20. **Avatar-Upload-Crash auf iPad** debuggen und fixen
21. **Bundle-ID Konsistenz** prüfen

### 8. Skalierbarkeit
22. **Chat-Nachrichten-DB**: Für spätere Konversations-Kontexte
23. **Push Notifications** (Capacitor + OneSignal/FCM)
24. **Multi-Language**: Weitere Sprachen vorbereiten (FR, ES)

---

## N. MASTER-ZUSAMMENFASSUNG

### Executive Summary
SOULVAY ist eine ausgereift konzipierte Mental-Wellness-App mit einem durchdachten Feature-Set, das KI-Gespräche, Tagebuch, Stimmungs-Tracking, Themen-Pfade und Übungen vereint. Die technische Architektur ist solide (React + Supabase + Capacitor), die i18n-Abdeckung ist umfassend (DE/EN), und das Premium-Modell ist sauber in Free/Plus segmentiert. Die App ist App-Store-ready und hat bereits mehrere Review-Zyklen durchlaufen. Hauptverbesserungspotenziale liegen in der Navigation (Home-Seite), Chat-Persistenz und technischer Debt-Reduktion.

### 10 Wichtigste Erkenntnisse
1. Das KI-Chat-System mit 4 Modi und Krisen-Erkennung ist professionell implementiert
2. 8 Themen-Pfade mit umfangreichen psychoedukativen Inhalten bieten echten Mehrwert
3. Das i18n-System ist mit ~500+ Schlüsseln sehr umfassend
4. Premium-Segmentierung ist durchdacht (emotionale Grundversorgung frei, tiefere Analyse kostenpflichtig)
5. Die Übungs-Toolbox mit Sprachführung ist ein Differenzierungsmerkmal
6. Safe-Area-Handling und native Integration (Capacitor) sind sorgfältig implementiert
7. Das Onboarding sammelt wertvolle Personalisierungsdaten
8. Wochenrückblick und KI-Zusammenfassungen bieten Langzeit-Mehrwert
9. Das Design-System ist konsistent und beruhigend
10. DSGVO-Compliance-Grundlagen (Cookie-Consent, Account-Löschung, Rechtsseiten) sind vorhanden

### 10 Wichtigste Schwächen
1. **Home-Seite mit Streak/Continue nicht erreichbar** — verlorener Feature-Wert
2. **Chat-Nachrichten nicht persistent** — Gespräche gehen verloren
3. **"End-to-end encrypted" Claim ist irreführend** — kein E2E-E vorhanden
4. **Premium-State primär in localStorage** — manipulierbar
5. **React Router v6 Deprecation Warnings** — unbehandelt
6. **`as any` Casts** bei DB-Operationen — Type-Safety-Lücken
7. **Settings-Seite unübersichtlich** — eine sehr lange Scroll-Seite
8. **Legacy "mindmate" Naming** in localStorage und Bundle-ID
9. **TanStack Query kaum genutzt** — manuelles State-Management überall
10. **Avatar-Upload auf iPad deaktiviert** — Workaround statt Fix

### 10 Wichtigste Chancen / Nächste Schritte
1. **Home-Seite integrieren**: Streak und Continue als "Space"-Tab oder in bestehende Tabs
2. **Chat-Persistenz**: Letzte 5 Gespräche speichern für Kontext-Rückblick
3. **Trial-Periode**: 7-Tage-Free-Trial für Premium
4. **Push Notifications**: Streak-Schutz, Mood-Reminder
5. **Data Export**: DSGVO-konformer Datenexport
6. **Verbesserte Patterns**: Langzeit-Muster über Mood + Journal + Chat
7. **Audio-Bibliothek ausbauen**: Geführte Meditationen, Schlafgeschichten
8. **Community-Features**: Anonyme Insights, gemeinsame Challenges
9. **Therapeuten-Integration**: Gespräche mit Therapeuten teilen
10. **Multi-Plattform**: Android App Store Launch

---

# Zusatzdokumente

## 1. Produktdokumentation für Gründer

SOULVAY ist eine KI-gestützte Mental-Wellness-App, verfügbar als Web-App (soulvay.com) und iOS-App. Die App bietet kostenlose emotionale Grundversorgung (Chat, Journaling, Mood-Tracking, Atemübungen) und ein Premium-Abo ("Soulvay Plus") mit vertieften Features (Muster-Erkennung, KI-Reflexion, Voice-Mode, Wochenrückblick). Das Onboarding ist personalisiert (Fokusbereiche, Ziele), und die App unterstützt Deutsch und Englisch. Monetarisierung erfolgt über RevenueCat (iOS) und Stripe (Web).

**Kerndifferenzierung**: Strukturierte Themen-Pfade mit psychoedukativen Inhalten + 4 spezialisierte Chat-Modi + gesprochene Übungs-Anleitungen.

## 2. Technische Dokumentation für Weiterentwicklung

**Stack**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Supabase + Capacitor
**State**: React Context (Auth), useState (lokal), localStorage (Persistenz), TanStack Query (konfiguriert)
**Backend**: 13 Edge Functions (Deno), 7 DB-Tabellen, RLS auf allen Tabellen
**KI**: Lovable AI Gateway (Gemini-Modelle), ElevenLabs TTS
**Native**: Capacitor 8 (iOS/Android), RevenueCat für In-App-Purchases
**i18n**: Custom Hook mit ~500 Schlüsseln, kein Framework (kein i18next)
**Einstiegspunkte**: `src/App.tsx` (Routing), `src/pages/Chat.tsx` (Haupt-Feature), `src/hooks/usePremium.ts` (Paywall-Logik)

## 3. UX-Audit-Zusammenfassung

**Stärken**: Beruhigendes Design, gute Touch-Targets, durchdachtes Onboarding, klare Chat-Modi, professionelle Krisen-Erkennung
**Schwächen**: Home-Seite nicht erreichbar, Settings unübersichtlich, Premium-Gates unklar, Chat-Verlust bei Refresh
**Prioritäten**: 1) Home-Seite zugänglich machen 2) Chat-Persistenz 3) Settings aufteilen 4) Premium-Kennzeichnung verbessern

## 4. Alle Screens mit Kurzbeschreibung

| Screen | Beschreibung |
|--------|-------------|
| Landing | Marketing-Seite mit Features, Testimonials, Store-Badges |
| Auth | Login/Signup/Passwort-Reset mit Review-Login |
| Onboarding | 6-Schritt-Personalisierung |
| Chat | KI-Gespräche in 4 Modi mit Voice |
| Journal | Tagebuch mit Filtern, Kalender, Wochenrückblick |
| Topics | 8 Themen-Pfade mit Lernen, Reflexion, Notizen, KI |
| Mood | Stimmungs-Check-in mit Trends und Heatmap |
| Toolbox | 6 Übungen mit geführtem Player |
| Home | Space mit Streak, Quick Actions (nicht verlinkt) |
| Settings | Profil, Präferenzen, Theme, Voice, Abo |
| Upgrade | Premium-Abo mit Feature-Matrix |
| Summary | Chat-Zusammenfassung |
| Safety | Krisenressourcen |
| Timeline | Chronologische Übersicht |
| Audio | Audio-Bibliothek |
| Admin | Admin-Panel |
| + 10 Rechtsseiten | Privacy, Terms, Impressum, FAQ, etc. |

## 5. Feature-Status-Liste

| Feature | Status |
|---------|--------|
| KI-Chat (4 Modi) | ✅ Fertig |
| Chat-Streaming | ✅ Fertig |
| Krisen-Erkennung | ✅ Fertig |
| Tagebuch (CRUD) | ✅ Fertig |
| Geführte Prompts | ✅ Fertig |
| KI-Reflexion | ✅ Fertig |
| Wochenrückblick | ✅ Fertig |
| KI-Zusammenfassung | ✅ Fertig |
| Chat-zu-Journal | ✅ Fertig |
| Kalender-Filter | ✅ Fertig |
| Mood-Tracking | ✅ Fertig |
| Mood-Trends | ✅ Fertig |
| 90-Tage-Heatmap | ✅ Fertig |
| Community-Insights | ✅ Fertig |
| 8 Themen-Pfade | ✅ Fertig |
| Themen-KI-Chat | ✅ Fertig |
| Themen-Notizen | ✅ Fertig |
| 6 Übungen + Player | ✅ Fertig |
| Sprachführung (TTS) | ✅ Fertig |
| Spracheingabe (STT) | ✅ Fertig |
| Dark Mode | ✅ Fertig |
| i18n (DE/EN) | ✅ Fertig |
| Onboarding | ✅ Fertig |
| Auth (E-Mail/PW) | ✅ Fertig |
| Password Reset | ✅ Fertig |
| Premium/Abo | ✅ Fertig |
| Stripe Integration | ✅ Fertig |
| RevenueCat (iOS) | ✅ Fertig |
| Account-Löschung | ✅ Fertig |
| DSGVO-Basics | ✅ Fertig |
| App Tour | ✅ Fertig |
| Streak-System | ✅ Fertig |
| Home-Seite | ⚠️ Fertig, aber nicht verlinkt |
| Chat-Persistenz | ❌ Nicht vorhanden |
| Push Notifications | ⚠️ Hook vorhanden, nicht implementiert |
| Data Export | ❌ Nicht vorhanden |
| E2E-Verschlüsselung | ❌ Nicht vorhanden (fälschlich behauptet) |
| Audio-Bibliothek | ⚠️ Seite existiert, Inhalt unklar |

## 6. Offene Probleme nach Priorität

### P0 (Kritisch)
1. **"End-to-end encrypted" Claim auf Landing-Seite ist falsch** — Compliance-/Vertrauensrisiko
2. **Premium-State in localStorage manipulierbar** — Backend-Check als Mitigation

### P1 (Hoch)
3. **Home-Seite nicht in Navigation** — bedeutender Feature-Verlust
4. **Chat-Nachrichten nicht persistent** — schlechte UX bei Seitenwechsel
5. **React Router v6 Deprecation Warnings** — v7 Migration vorbereiten
6. **Avatar-Upload auf iPad deaktiviert** — Feature-Einschränkung

### P2 (Mittel)
7. **`as any` Casts bei DB-Operationen** — Type-Safety
8. **Legacy "mindmate" Naming** — Inkonsistenz
9. **TanStack Query nicht genutzt** — manuelle Data-Fetching-Logik
10. **Settings-Seite zu lang** — UX-Problem

### P3 (Niedrig)
11. **Review-Mode via localStorage** — geringes Risiko
12. **user_session_id Redundanz** — technische Schuld
13. **Einige Error-Messages generisch** — Copy-Verbesserung

## 7. Die 20 besten nächsten Verbesserungen für SOULVAY

1. **"End-to-end encrypted" Claim korrigieren** (P0, 5 Min)
2. **Home-Seite als "Space"-Tab in Bottom Nav** einbinden (P1, 30 Min)
3. **React Router v7 Future Flags** setzen (P1, 10 Min)
4. **Chat-Verlauf in localStorage speichern** (letzte 3-5 Gespräche) (P1, 2h)
5. **Settings in Abschnitte/Tabs aufteilen** (P2, 1h)
6. **Trial-Periode für Premium** (7 Tage free) (P1, 3h)
7. **Push Notifications** für Streak-Schutz und Mood-Reminder (P2, 4h)
8. **Data Export** (DSGVO Art. 20) — JSON/PDF Export aller Daten (P2, 3h)
9. **`as any` Casts eliminieren** — korrekte Insert-Typen (P2, 1h)
10. **localStorage-Migration** von "mindmate" zu "soulvay" mit Fallback (P3, 1h)
11. **Premium-Features klarer kennzeichnen** — Lock-Badges konsistent (P2, 1h)
12. **Mood-to-Chat Deep Link** — von niedrigem Mood direkt zum Chat (P2, 30 Min)
13. **Onboarding-Texte emotionaler** gestalten (P3, 1h)
14. **Streak-Anzeige in Bottom Nav oder Header** (nach Home-Integration) (P2, 30 Min)
15. **Audio-Bibliothek** mit geführten Meditationen ausbauen (P2, 4h)
16. **Verbesserte Error States** — spezifischere Meldungen (P3, 2h)
17. **Chat-Kontext über Sessions** — letzte Themen als Kontext für neuen Chat (P2, 3h)
18. **Mood-Insights KI-generiert** — automatische Muster-Erkennung bei genug Daten (P2, 3h)
19. **Toolbox-Favoriten** — häufig genutzte Übungen oben anzeigen (P3, 1h)
20. **Therapie-Journal-Export** — strukturierter Export für Therapeuten (P3, 4h)
