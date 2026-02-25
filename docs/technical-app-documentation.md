# Soulvay – Vollständige Technische Dokumentation

> **Stand:** 25. Februar 2026  
> **Version:** Production  
> **Zielgruppe:** IT-Experten, QA-Tester, Entwickler  

---

## 1. App-Übersicht

**Soulvay** ist ein digitaler psychologischer Begleiter (Mental-Wellness-App) für Selbstreflexion und emotionale Unterstützung. Die App ist **kein Therapie-Ersatz**, sondern bietet evidenzbasierte Übungen, KI-gestützten Chat, Journaling und Stimmungstracking.

| Eigenschaft | Wert |
|---|---|
| App-Name | Soulvay |
| Premium-Name | Soulvay Plus |
| Plattformen | Web (PWA), iOS (Capacitor), Android (Capacitor) |
| Sprachen | Deutsch (Standard), Englisch |
| Tech-Stack | React 18, Vite, TypeScript, Tailwind CSS, Capacitor 8 |
| Backend | Supabase (Lovable Cloud) |
| KI-Modell | Google Gemini 2.5 Flash (via Lovable AI Gateway) |
| TTS | ElevenLabs (Multilingual v2) |
| Zahlungen | RevenueCat (iOS/Android), Stripe (Web) |
| Bundle ID | `app.lovable.dc1f364579304a628f999c8b700fe75a` |

---

## 2. Architektur-Überblick

```
┌──────────────────────────────────────────────────────────────┐
│                       FRONTEND (React/Vite)                  │
│  ┌──────┐ ┌───────┐ ┌──────┐ ┌──────┐ ┌───────┐            │
│  │ Chat │ │Journal│ │Topics│ │ Mood │ │Toolbox│            │
│  └──┬───┘ └───┬───┘ └──┬───┘ └──┬───┘ └───┬───┘            │
│     │         │        │        │          │                 │
│  ┌──┴─────────┴────────┴────────┴──────────┴──────────────┐  │
│  │              Supabase Client (supabase-js)              │  │
│  └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    BACKEND (Supabase)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Edge Functions                        │ │
│  │  chat · generate-summary · journal-reflect              │ │
│  │  text-to-speech · weekly-recap · create-checkout         │ │
│  │  stripe-webhook · manage-subscription                   │ │
│  │  delete-account · admin · setup-review-account           │ │
│  │  verify-apple-receipt · revenuecat-webhook              │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Database (PostgreSQL)                  │ │
│  │  profiles · subscriptions · mood_checkins                │ │
│  │  journal_entries · weekly_recaps · user_roles            │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Storage: avatars (public bucket)                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Auth: Email + Password (E-Mail-Bestätigung aktiv)       │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. User Journey (Schritt für Schritt)

### 3.1 Erster App-Start (Neuer Nutzer)

1. **`/` (Root)** → `RootRedirect` prüft:
   - Authentifiziert? → `/chat`
   - Onboarding abgeschlossen? → `/auth`
   - Sonst → `/welcome`

2. **`/welcome` (Onboarding)** – 3 Schritte:
   - **Welcome**: Begrüßung, App-Vorstellung
   - **Disclaimer**: Hinweis, dass Soulvay kein Therapie-Ersatz ist
   - **Preferences**: Sprache, Gesprächston (sanft/ausgewogen/strukturiert), Anredeform (Du/Sie)
   - Nach Abschluss → `localStorage: soulvay_onboarding_completed = true`

3. **`/auth` (Registrierung/Login)**:
   - E-Mail + Passwort
   - E-Mail-Bestätigung erforderlich
   - Optional: `?redirect=` Parameter für Rückleitung
   - Nach Login → Weiterleitung zum gewünschten Ziel (Standard: `/chat`)

4. **Erster Chat-Besuch** → App Tour (7 Schritte):
   - Automatischer Guide durch Chat, Journal, Topics, Mood, Toolbox
   - Status in `localStorage: appTourCompleted`

### 3.2 Wiederkehrender Nutzer

1. **`/`** → `RootRedirect` erkennt Auth → direkt `/chat`
2. Alle geschützten Routen nutzen `OnboardingGuard`:
   - Prüft `isAuthenticated` via `useAuth()` Hook
   - Zeigt Ladeindikator während Auth-Check
   - Leitet zu `/auth` oder `/welcome` um wenn nicht authentifiziert

---

## 4. Navigation & Routing

### 4.1 Bottom Navigation (5 Tabs)

| Tab | Route | Icon | Label (DE) | Label (EN) |
|---|---|---|---|---|
| Chat | `/chat` | MessageCircle | Chat | Chat |
| Tagebuch | `/journal` | BookOpen | Tagebuch | Journal |
| Themen | `/topics` | Compass | Themen | Topics |
| Stimmung | `/mood` | BarChart3 | Stimmung | Mood |
| Übungen | `/toolbox` | Sparkles | Übungen | Toolbox |

- **Höhe:** 56px + safe-area-inset-bottom
- **Versteckt auf:** `/settings`, `/safety`, `/summary`
- **AppLayout:** Fixed-Position Container, Chat verwaltet eigenes Layout

### 4.2 Vollständige Routenliste

| Route | Schutz | Beschreibung |
|---|---|---|
| `/` | — | Intelligente Weiterleitung (RootRedirect) |
| `/welcome` | — | Onboarding (3 Schritte) |
| `/auth` | — | Login/Registrierung |
| `/chat` | OnboardingGuard + AppLayout | KI-Chat |
| `/journal` | OnboardingGuard + AppLayout | Tagebuch |
| `/topics` | OnboardingGuard + AppLayout | Themen-Pfade |
| `/mood` | OnboardingGuard + AppLayout | Stimmungstracking |
| `/toolbox` | OnboardingGuard + AppLayout | Übungen |
| `/settings` | OnboardingGuard | Einstellungen |
| `/summary` | OnboardingGuard | Sitzungszusammenfassung |
| `/upgrade` | OnboardingGuard | Premium-Upgrade (Soulvay Plus) |
| `/admin` | OnboardingGuard | Admin-Panel |
| `/safety` | — | Krisenressourcen (immer zugänglich) |
| `/install` | — | PWA-Installationsanleitung |
| `/privacy` | — | Datenschutzerklärung |
| `/terms` | — | Nutzungsbedingungen |
| `/impressum` | — | Impressum |
| `/faq` | — | FAQ |
| `/cancellation` | — | Widerrufsbelehrung |
| `/contact` | — | Kontakt |
| `/about` | — | Über uns |
| `/delete-account` | — | Konto löschen |
| `/landing` | — | Marketing-Landingpage |
| `/review-instructions` | — | Apple Review Anweisungen |
| `/review-status` | — | Apple Review Status |
| `/dev-qa` | OnboardingGuard (nur DEV) | Device QA Screen |
| `*` | — | 404 Not Found |

---

## 5. Features im Detail

### 5.1 Chat (`/chat`)

**Funktion:** KI-gestützter emotionaler Begleiter mit Echtzeit-Streaming.

**Chat-Modi (4 Stück):**

| Modus | Tier | Beschreibung |
|---|---|---|
| Talk it out (Darüber reden) | Free | Freies emotionales Gespräch |
| Calm me down (Beruhige mich) | Free | Sofortige Erdung & Beruhigung |
| Clarify my thoughts (Gedanken klären) | Premium | Geführte Reflexion mit Rückfragen |
| Understand my patterns (Muster verstehen) | Premium | Psychoedukation & Selbstverständnis |

**Technischer Ablauf:**
1. User tippt Nachricht oder nutzt Spracheingabe (Web Speech API)
2. Frontend sendet an Edge Function `chat` mit:
   - `messages[]` (Chat-Verlauf)
   - `preferences` (Sprache, Ton, Anrede, Modus-Prompt, innerDialogue)
3. Edge Function:
   - Prüft auf Krisenworte (CRISIS_KEYWORDS: ~30 Begriffe für Selbstschädigung, Suizid, Gewalt)
   - Baut System-Prompt basierend auf Modus + Präferenzen
   - Sendet an Lovable AI Gateway (Gemini 2.5 Flash)
   - Streamt Antwort via SSE zurück
4. Frontend rendert Streaming-Antwort Wort für Wort

**Krisenerkennung:**
- Automatisch bei Worten wie "suicide", "kill myself", "self-harm" etc.
- Aktiviert spezielles Crisis Response Protocol
- Liefert Krisenressourcen: Telefonseelsorge (0800 111 0 111), 112, 988 (US)

**Zusatzfunktionen im Chat:**
- **Quick Replies:** 4 vordefinierte Schnellantworten pro Modus
- **Spracheingabe:** Web Speech Recognition API
- **Sprachausgabe (TTS):** ElevenLabs via Edge Function `text-to-speech`
  - Stimme: Sarah (EXAVITQu4vr4xnSDxMaL), Multilingual v2
  - Max. 2000 Zeichen pro Request
  - Markdown wird vor TTS bereinigt
- **Zusammenfassen:** Navigiert zu `/summary`
- **Im Tagebuch speichern:** Erstellt Journal-Eintrag aus Chat
- **Krisenbutton:** Link zu `/safety`
- **Swipe-Back:** Gesture-basierte Navigation
- **Chat-Disclaimer:** Footer-Hinweis, dass Soulvay kein Therapie-Ersatz ist

**System-Prompt Eigenschaften:**
- Rollenbasiert: "Soulvay, digitaler psychologischer Begleiter"
- CBT, Emotion-focused, Mindfulness-basiert
- Meta-Regel: Therapeutische Präsenz vor Lösungen
- Professionelle Grenzen: Keine Diagnosen, keine Medikamente
- Optionale "Innerer Dialog"-Funktion (aktivierbar in Settings)

### 5.2 Tagebuch / Journal (`/journal`)

**Funktion:** Privater Raum zum Schreiben, mit KI-gestützter Reflexion.

**Bestandteile:**
- **Freier Eintrag:** Titel (optional), Inhalt, Stimmungs-Emoji, Tags
- **Reflexionsfragen (Prompts):** 5 rotierende Fragen als Schreibimpulse
- **KI-Reflexion (Premium):** Analyse mehrerer Einträge auf Muster
- **Emotionale Timeline (Premium):** Verlauf über Zeit
- **Wochenrückblick (Premium):** Automatische Wochenanalyse

**Tags verfügbar:**
Ängstlich, Traurig, Wütend, Gestresst, Ruhig, Dankbar, Hoffnungsvoll, Überfordert, Arbeit, Beziehungen, Familie, Gesundheit, Selbstwert, Zukunft

**Datenbank-Tabelle: `journal_entries`**

| Feld | Typ | Beschreibung |
|---|---|---|
| id | UUID | Primary Key |
| user_id | UUID | Supabase Auth User ID |
| user_session_id | TEXT | Legacy-Feld |
| title | TEXT | Optional |
| content | TEXT | Pflichtfeld |
| mood | TEXT | Stimmungs-Emoji |
| tags | TEXT[] | Array von Tags |
| source | TEXT | 'manual' oder 'chat' |
| prompt_id | TEXT | Referenz auf verwendete Frage |
| created_at | TIMESTAMPTZ | Erstellungszeitpunkt |
| updated_at | TIMESTAMPTZ | Letztes Update |

**RLS:** Nur eigene Einträge (auth.uid() = user_id) für SELECT, INSERT, UPDATE, DELETE.

**Edge Function `journal-reflect`:**
- Typen: `patterns`, `themes`, `reflection`, `emotional-timeline`
- Nutzt Gemini 2.5 Flash
- Keine klinische Sprache, nur beobachtende Reflexion

### 5.3 Themen / Topics (`/topics`) — **Premium**

**Funktion:** Strukturierte Erkundungspfade für Lebensthemen.

**10 Themen-Pfade:**

| Thema | Icon | Schritte | Farbe |
|---|---|---|---|
| Stress & Overwhelm | 🌊 | 5 | calm |
| Relationships | 💜 | 5 | gentle |
| Family | 🏠 | 6 | warm |
| Self-Esteem | ✨ | 6 | primary |
| Work & Burnout | 🔥 | 5 | accent |
| Decisions & Direction | 🧭 | 6 | calm |
| Loneliness | 🌙 | 5 | gentle |
| Boundaries | 🛡️ | 6 | primary |
| Breakups | 💔 | 7 | warm |
| Anxiety | 🌿 | 5 | calm |

**Jeder Pfad enthält:**
- Reflexionspfad: Schritte vom Typ `reflection`, `exercise`, `journal`, `chat`
- Übungen: 2 spezifische Übungen pro Thema
- Fortschritts-Tracking (lokal)

### 5.4 Stimmung / Mood (`/mood`)

**Funktion:** Tägliches Stimmungs-Check-in mit Visualisierung.

**Ablauf:**
1. **MoodSelector:** Stimmungswert 1-5 (Emoji-Skala)
2. **FeelingTags:** Detaillierte Gefühlsauswahl
3. **Notiz:** Optionaler Freitext
4. Speicherung in Datenbank

**Datenbank-Tabelle: `mood_checkins`**

| Feld | Typ | Beschreibung |
|---|---|---|
| id | UUID | Primary Key |
| user_id | UUID | Auth User ID |
| user_session_id | TEXT | Legacy-Feld |
| mood_value | INTEGER | 1-5 |
| feelings | TEXT[] | Gefühls-Tags |
| note | TEXT | Optionale Notiz |
| created_at | TIMESTAMPTZ | Zeitstempel |

**RLS:** Nur eigene Einträge (auth.uid() = user_id).

**Visualisierung:**
- **MoodChart:** Recharts-basierte Stimmungskurve
- Zeiträume: 7 Tage, 30 Tage, 90 Tage (30/90 = Premium)

### 5.5 Übungen / Toolbox (`/toolbox`)

**Funktion:** Evidenzbasierte Selbsthilfe-Übungen.

**6 Übungen:**

| Übung | Kategorie | Dauer | Schritte |
|---|---|---|---|
| 60-Second Breathing | breathing | 1 min | 14 |
| Thought Reframing | cognitive | 5 min | 10 |
| Guided Journaling | journaling | 10 min | 7 |
| Values Clarification | values | 8 min | 9 |
| Boundary Setting | boundaries | 7 min | 10 |
| 5-4-3-2-1 Grounding | grounding | 3 min | 11 |

**Ausführung (ExercisePlayer):**
- Schritt-für-Schritt mit automatischem Fortschritt (Timer)
- Pause/Resume möglich
- Abschluss-Feedback

**Tier-Aufteilung:**
- Free: `breathing` + `grounding` (Core exercises)
- Premium: Alle 6 Übungen

### 5.6 Sitzungszusammenfassung (`/summary`) — **Premium**

**Funktion:** KI-generierte Zusammenfassung des aktuellen Chat-Gesprächs.

**Edge Function `generate-summary`:**
- Input: Chat-Nachrichten (min. 2)
- Output (JSON):
  - `summary`: 2-3 Sätze Zusammenfassung
  - `emotionalThemes`: 2-4 Themen
  - `nextStep`: Nächster Schritt
  - `moodProgression`: Start/End-Emoji + Insight
- Export als Download oder Zwischenablage

### 5.7 Wochenrückblick (Weekly Recap) — **Premium**

**Edge Function `weekly-recap`:**
- Input: Mood-Check-ins + Journal-Einträge des Zeitraums
- Zeiträume: 7d, 14d, 30d
- Output (JSON):
  - `patterns[]`: 3-5 beobachtete Muster
  - `potential_needs[]`: 2 mögliche Bedürfnisse
  - `suggested_next_step`: Sanfter Vorschlag
  - `summary_bullets[]`: Zusammenfassung

**Datenbank-Tabelle: `weekly_recaps`**

| Feld | Typ | Beschreibung |
|---|---|---|
| id | UUID | Primary Key |
| user_id | UUID | Auth User ID |
| user_session_id | TEXT | Legacy-Feld |
| patterns | TEXT[] | Beobachtete Muster |
| potential_needs | TEXT[] | Mögliche Bedürfnisse |
| suggested_next_step | TEXT | Vorschlag |
| summary_bullets | TEXT[] | Zusammenfassung |
| time_range | TEXT | '7d', '14d', '30d' |
| created_at | TIMESTAMPTZ | Zeitstempel |

### 5.8 Einstellungen (`/settings`)

**Abschnitte:**

1. **Sprache & Region**
   - Sprache: Deutsch / Englisch
   - Gespeichert in `localStorage` + `profiles.language`

2. **Gesprächsstil**
   - Ton: Sanft / Ausgewogen / Strukturiert
   - Anrede: Du (informell) / Sie (formell)
   - Innerer Dialog: Ein/Aus (exploriert verschiedene innere Perspektiven)

3. **Erscheinungsbild**
   - Theme: Light / Dark / System
   - Akzentfarbe

4. **Erinnerungen**
   - Tägliche Check-in-Benachrichtigungen (Push via Capacitor)

5. **Datenschutz & Daten**
   - Link zu `/privacy`
   - Konto löschen

6. **Hilfe & Support**
   - Link zu `/faq`, `/contact`

7. **Abo-Verwaltung (SubscriptionSection)**
   - Abo-Status anzeigen
   - Kündigen / Reaktivieren
   - Stripe Billing Portal (Web)

### 5.9 Sicherheit / Safety (`/safety`)

**Immer zugänglich, kein Auth erforderlich.**

- Notruf: 112 (EU) / 911 (US)
- Telefonseelsorge: 0800 111 0 111 / 0800 111 0 222
- Crisis Text Line
- Weitere lokale Ressourcen

---

## 6. Monetarisierung

### 6.1 Free vs. Premium Features

**Free (Core Emotional Support):**
- Chat: "Talk it out" + "Calm me down"
- Journal: Freies Schreiben
- Mood: Check-ins + 7-Tage-Ansicht
- Toolbox: Atmung + Erdung
- Safety: Krisenressourcen

**Premium (Soulvay Plus):**
- Chat: "Clarify my thoughts" + "Understand my patterns"
- Journal: Geführte Prompts + KI-Reflexion
- Mood: 30/90-Tage-Trends
- Topics: Alle 10 Themen-Pfade
- Toolbox: Alle 6 Übungen
- Session Summaries
- Wochenrückblicke

### 6.2 Preise

| Plan | Preis | Trial |
|---|---|---|
| Monatlich | €9,99/Monat | 7 Tage kostenlos |
| Jährlich | €79,00/Jahr | Kein Trial (bereits rabattiert) |

### 6.3 Zahlungs-Integration

#### RevenueCat (iOS/Android)

- **Wann:** App läuft als native Capacitor-App
- **Product IDs:** `mindmate_plus_monthly`, `mindmate_plus_yearly`
- **Entitlement:** `premium`
- **API Key Secret:** `REVENUECAT_API_KEY`
- **Hooks:** `useRevenueCat`, `useAppleIAP`
- **Webhook:** Edge Function `revenuecat-webhook`
- **Receipt Verification:** Edge Function `verify-apple-receipt`

#### Stripe (Web)

- **Wann:** App läuft im Browser (nicht native)
- **Ablauf:**
  1. User klickt "Upgrade" auf `/upgrade`
  2. Frontend ruft Edge Function `create-checkout`
  3. Stripe Checkout Session wird erstellt:
     - Customer wird in Stripe erstellt/wiederverwendet
     - Subscription mit Preis-Konfiguration
     - Metadata: `user_id`, `plan_type`
     - Promotion Codes erlaubt
  4. User wird zu Stripe Checkout weitergeleitet
  5. Nach Zahlung → Webhook `stripe-webhook` verarbeitet Events

**Stripe Webhook Events:**

| Event | Aktion |
|---|---|
| `checkout.session.completed` | Subscription auf "active" setzen |
| `customer.subscription.updated` | Status + Periodenende aktualisieren |
| `customer.subscription.deleted` | Status auf "canceled" setzen |
| `invoice.payment_succeeded` | Status auf "active" (Renewal) |
| `invoice.payment_failed` | Status auf "past_due" |

**Stripe Webhook URL:**
```
https://djnbvnufmegiursvqbhp.supabase.co/functions/v1/stripe-webhook
```

**Abo-Verwaltung (Edge Function `manage-subscription`):**
- Actions: `status`, `cancel`, `reactivate`, `portal`
- Portal: Stripe Billing Portal für Self-Service

### 6.4 Premium-Gate (`usePremium` Hook)

- Prüft Abo-Status via:
  1. RevenueCat (native) → `checkSubscriptionStatus()`
  2. Datenbank-Tabelle `subscriptions` → Status "active"
- Komponenten: `PremiumGate`, `UpgradePrompt`, `MessageLimitIndicator`
- Umgebungserkennung: `isRevenueCatAvailable` (Capacitor Plugin vorhanden?)

**Datenbank-Tabelle: `subscriptions`**

| Feld | Typ | Beschreibung |
|---|---|---|
| id | UUID | Primary Key |
| user_id | UUID | Auth User ID |
| user_session_id | TEXT | Legacy-Feld |
| stripe_customer_id | TEXT | Stripe Customer ID |
| stripe_subscription_id | TEXT | Stripe Subscription ID |
| status | TEXT | 'active', 'inactive', 'canceled', 'past_due' |
| plan_type | TEXT | 'monthly', 'yearly' |
| cancel_at_period_end | BOOLEAN | Kündigung zum Periodenende |
| current_period_start | TIMESTAMPTZ | Periodenbeginn |
| current_period_end | TIMESTAMPTZ | Periodenende |
| created_at | TIMESTAMPTZ | — |
| updated_at | TIMESTAMPTZ | — |

**RLS:**
- SELECT: `auth.uid() = user_id`
- ALL (Service Role): `true` (für Webhook-Verarbeitung)

---

## 7. Datenbank-Schema

### 7.1 Tabellen-Übersicht

| Tabelle | Zweck | RLS |
|---|---|---|
| `profiles` | Benutzerprofil (Name, Sprache, Avatar) | Eigene Daten |
| `subscriptions` | Abo-Status | Eigene + Service Role |
| `mood_checkins` | Stimmungs-Einträge | Eigene Daten |
| `journal_entries` | Tagebuch-Einträge | Eigene Daten |
| `weekly_recaps` | Wochenrückblicke | Eigene (kein UPDATE/DELETE) |
| `user_roles` | Admin-Rollen | Nur Admins |

### 7.2 Datenbank-Funktionen

| Funktion | Zweck |
|---|---|
| `handle_new_user()` | Trigger: Erstellt Profil bei Registrierung |
| `has_role(_user_id, _role)` | Prüft Admin-/Moderator-Rolle |
| `update_updated_at_column()` | Trigger: Aktualisiert `updated_at` |

### 7.3 Storage

- **Bucket:** `avatars` (public)
- **Pfad:** `{user_id}/{filename}`

---

## 8. Edge Functions (Backend)

Alle Functions haben `verify_jwt = false` (in `supabase/config.toml`).

| Function | Zweck | KI | Externe API |
|---|---|---|---|
| `chat` | KI-Chat mit Streaming | Gemini 2.5 Flash | — |
| `generate-summary` | Session-Zusammenfassung | Gemini 2.5 Flash | — |
| `journal-reflect` | Journal-Reflexion/Muster | Gemini 2.5 Flash | — |
| `weekly-recap` | Wochenrückblick | Gemini 2.5 Flash | — |
| `text-to-speech` | Sprachausgabe | — | ElevenLabs |
| `create-checkout` | Stripe Checkout Session | — | Stripe |
| `stripe-webhook` | Stripe Event-Verarbeitung | — | Stripe |
| `manage-subscription` | Abo-Verwaltung | — | Stripe |
| `delete-account` | Konto + alle Daten löschen | — | — |
| `admin` | Admin-Funktionen | — | — |
| `setup-review-account` | Apple Review Test-Account | — | — |
| `verify-apple-receipt` | iOS Receipt Validierung | — | Apple |
| `revenuecat-webhook` | RevenueCat Events | — | RevenueCat |

### 8.1 Secrets (Konfigurierte Umgebungsvariablen)

| Secret | Zweck |
|---|---|
| `LOVABLE_API_KEY` | Lovable AI Gateway |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_API_KEY_1` | ElevenLabs TTS |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signatur |
| `REVENUECAT_API_KEY` | RevenueCat |
| `SUPABASE_URL` | Auto-konfiguriert |
| `SUPABASE_ANON_KEY` | Auto-konfiguriert |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-konfiguriert |
| `SUPABASE_DB_URL` | Auto-konfiguriert |
| `SUPABASE_PUBLISHABLE_KEY` | Auto-konfiguriert |

---

## 9. Authentifizierung

- **Methode:** E-Mail + Passwort
- **E-Mail-Bestätigung:** Aktiviert
- **Auth-Flow:**
  1. `/auth` Seite mit Login/Registrierung
  2. Registrierung → E-Mail-Bestätigung
  3. Login → Session via Supabase Auth
- **Hooks:**
  - `useAuth()`: `isAuthenticated`, `isLoading`, `user`, `signOut`
  - `useSessionId()`: Legacy Session-ID Support
- **Guards:**
  - `OnboardingGuard`: Prüft Onboarding + Auth
  - `ProtectedRoute`: Nur Auth (nicht im aktiven Routing verwendet)

### 9.1 Konto löschen (`/delete-account`)

Edge Function `delete-account`:
1. Verifiziert Auth-Token
2. Löscht Daten aus: `mood_checkins`, `journal_entries`, `weekly_recaps`, `subscriptions`, `profiles`
3. Löscht Avatar-Dateien aus Storage
4. Löscht Auth-User via Admin API

---

## 10. Internationalisierung (i18n)

- **Hook:** `useTranslation()` → `{ t, language }`
- **Sprachen:** Deutsch (`de`), Englisch (`en`)
- **Speicherung:** `localStorage` + Profil (`profiles.language`)
- **Umfang:** ~200+ Translation Keys für alle UI-Elemente
- **Kategorien:** Navigation, Chat, Journal, Toolbox, Topics, Settings, Safety, Summary, Mood, Onboarding, Upgrade, Errors

---

## 11. Theme-System

- **Modi:** Light (Standard) / Dark / System
- **Initialisierung:** `ThemeInitializer` Komponente in App.tsx
- **Speicherung:** `localStorage: mindmate-theme`
- **Hook:** `useTheme()`
- **CSS:** Semantic Tokens in `index.css` (HSL-basiert)
- **Tokens:** `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, etc.

---

## 12. Native App (Capacitor)

- **Capacitor Version:** 8
- **Plattformen:** iOS, Android
- **Plugins:**
  - `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`
  - `@revenuecat/purchases-capacitor` (In-App Purchases)
- **Konfiguration:** `capacitor.config.ts`
- **PWA:** Zusätzlich via `vite-plugin-pwa`
  - Manifest: `public/manifest.json`

---

## 13. Sicherheits-Features

### 13.1 Krisenerkennung
- ~30 Keywords (EN) in 4 Kategorien: Self-harm, Suicidal, Immediate danger, Violence
- Automatische Aktivierung des Crisis Response Protocol
- Professionelle Ressourcen werden immer mitgeliefert

### 13.2 RLS (Row Level Security)
- Alle Tabellen haben RLS aktiviert
- Nutzer können nur eigene Daten lesen/schreiben
- Service Role für Webhook-Verarbeitung
- Admin-Rolle für User-Verwaltung

### 13.3 DSGVO / GDPR
- Cookie-Consent (`CookieConsent` Komponente)
- Wird erst nach Onboarding angezeigt
- Datenschutzerklärung (`/privacy`)
- Konto-Löschung (`/delete-account`)
- Impressum (`/impressum`)
- Widerrufsbelehrung (`/cancellation`)

---

## 14. Admin-Bereich (`/admin`)

- **Zugang:** `OnboardingGuard` + `useAdmin()` Hook
- **Rollen:** `admin`, `moderator`, `user` (Enum: `app_role`)
- **Funktionalität:** User-Verwaltung, Rollen zuweisen
- **Edge Function `admin`:** Backend für Admin-Operationen

---

## 15. Lokale Datenspeicherung (localStorage)

| Key | Wert | Zweck |
|---|---|---|
| `soulvay_onboarding_completed` | Boolean | Onboarding-Status |
| `appTourCompleted` | Boolean | App-Tour abgeschlossen |
| `mindmate-theme` | JSON | Theme-Konfiguration |
| `mindmate-language` | 'de'/'en' | Sprache |
| `mindmate-tone` | 'gentle'/'neutral'/'structured' | Gesprächston |
| `mindmate-address` | 'du'/'sie' | Anredeform |
| `mindmate-inner-dialogue` | Boolean | Innerer Dialog Feature |
| Voice Settings | JSON | TTS-Einstellungen |

---

## 16. Drittanbieter-Integrationen

| Dienst | Zweck | Secret | Nutzung |
|---|---|---|---|
| Lovable AI Gateway | KI-Chat, Zusammenfassungen, Reflexionen, Recaps | `LOVABLE_API_KEY` | Gemini 2.5 Flash |
| ElevenLabs | Text-to-Speech | `ELEVENLABS_API_KEY` | Multilingual v2, Sarah Voice |
| Stripe | Web-Zahlungen | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Checkout, Webhooks, Billing Portal |
| RevenueCat | Native In-App Purchases | `REVENUECAT_API_KEY` | iOS/Android Abos |

---

## 17. Testhinweise für QA

### 17.1 Kritische Flows zum Testen

1. **Neuer Nutzer Flow:** `/` → `/welcome` → Onboarding → `/auth` → Registrierung → E-Mail-Bestätigung → `/chat`
2. **Login Flow:** `/auth` → Login → Redirect to `/chat`
3. **Chat:** Nachricht senden → Streaming-Antwort → TTS abspielen → Zusammenfassung generieren
4. **Krisenerkennung:** "I want to hurt myself" eingeben → Crisis Protocol
5. **Journal:** Eintrag erstellen → Speichern → KI-Reflexion → Muster erkennen
6. **Mood:** Check-in → Gefühle wählen → Notiz → Chart ansehen
7. **Toolbox:** Übung starten → Schritte durchlaufen → Abschluss
8. **Upgrade (Web):** `/upgrade` → Plan wählen → Stripe Checkout → Webhook → Status "active"
9. **Konto löschen:** `/delete-account` → Bestätigung → Alle Daten gelöscht
10. **Sprache wechseln:** DE ↔ EN → Alle Labels aktualisiert

### 17.2 Bekannte Edge Cases

- **Leerer Chat:** Zusammenfassung sollte verweigert werden (< 2 Nachrichten)
- **Offline:** Keine spezielle Offline-Unterstützung, Chat benötigt Verbindung
- **Rate Limiting:** AI Gateway kann 429 zurückgeben → User sieht "Moment bitte"
- **Subscription Race Condition:** Webhook kann vor Frontend-Redirect ankommen
- **Legacy `user_session_id`:** Ältere Einträge nutzen Session-ID statt User-ID
- **TTS Truncation:** Texte > 2000 Zeichen werden abgeschnitten

### 17.3 URLs

| Umgebung | URL |
|---|---|
| Preview | https://id-preview--dc1f3645-7930-4a62-8f99-9c8b700fe75a.lovable.app |
| Published | https://mindmate-companion-11.lovable.app |
| Stripe Webhook | https://djnbvnufmegiursvqbhp.supabase.co/functions/v1/stripe-webhook |
