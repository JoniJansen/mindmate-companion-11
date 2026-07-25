# Soulvay – App-Status-Audit (2026-07-21)

Faktenbasis: Code-Stand `main` (letzter Commit `bb1dddf`). Nur Code-Ebene, keine Live-Calls.

---

## 1. Feature-Inventar

### Aktiv & verdrahtet

| Feature | Beschreibung | Haupt-Dateien |
|---|---|---|
| KI-Chat mit Companion | 4 Modi (talk/clarify/calm/patterns), SSE-Streaming, Bond-abhängiges Verhalten | `src/pages/Chat.tsx`, `src/components/chat/`, `supabase/functions/chat/index.ts` (923 Z.) |
| Companion-System | Auswahl, Bond-Level, animierter Avatar, KI-generierte Avatare | `src/components/companion/`, `src/hooks/useCompanion.ts`, `src/data/companions.ts`, `supabase/functions/generate-companion/` |
| Realtime-Voice | ElevenLabs Conversational-AI-Agents per Signed-URL-WebSocket, Agent-IDs pro Companion | `src/components/chat/RealtimeVoicePanel.tsx`, `src/hooks/useConversationalVoice.ts` (673 Z.), `supabase/functions/elevenlabs-conversation-token/`, `src/data/companionAgentIds.ts` |
| TTS pro Nachricht | ElevenLabs-MP3-Streaming mit Voice-Settings | `src/hooks/useElevenLabsTTS.ts`, `supabase/functions/text-to-speech/index.ts` |
| Speech-to-Text nativ | Eigener SPM-Fork des Capacitor-Plugins | `package.json` Z. 18 (`JoniJansen/capacitor-speech-recognition-spm`), `src/hooks/useSpeechRecognition.ts`, `src/lib/nativeSpeech.ts` |
| Tagebuch + KI-Reflexion | Editor, Prompts, AI-Summary, Chat-Bridge | `src/pages/Journal.tsx`, `src/components/journal/`, `supabase/functions/journal-reflect/`, `generate-summary/` |
| Weekly Recap | Wöchentliche KI-Zusammenfassung | `src/components/journal/WeeklyRecap.tsx`, `supabase/functions/weekly-recap/` |
| Mood-Check-ins | Selector, Feeling-Tags, Chart, Heatmap, Insights | `src/pages/Mood.tsx`, `src/components/mood/` |
| Memory & Patterns | Memory-Extraktion, Muster-Erkennung, Session-Insights | `supabase/functions/extract-memories/`, `detect-patterns/`, `session-insight/`, `src/hooks/useMemoryMoments.ts`, `useInsightsAndPatterns.ts` |
| Streaks & Milestones | Tages-Streak, Wochen-Fortschritt | `src/hooks/useStreak.ts`, `src/components/streak/` |
| Home-Dashboard | Check-in, Daily Prompt, GrowthDashboard, adaptive Vorschläge | `src/pages/Home.tsx`, `src/components/home/`, `src/hooks/useDailyPrompt.ts` |
| Toolbox & Topics | Übungen mit Player, Themen-Kacheln | `src/pages/Toolbox.tsx`, `Topics.tsx`, `src/data/exercises.ts`, `topics.ts` |
| Premium/Abo | 3 Zahlungswege: RevenueCat (iOS-IAP, lazy-init erst auf `/upgrade`), Stripe (Web), Apple-Receipt; Gates/Limits/Trials | `src/hooks/usePremium.ts`, `useRevenueCat.ts`, `useAppleIAP.ts`, `src/components/premium/`, `supabase/functions/create-checkout/`, `manage-subscription/` |
| Onboarding + App-Tour | Guard-geschützt, Tour-Provider global | `src/pages/Onboarding.tsx`, `src/components/routing/OnboardingGuard.tsx`, `src/components/tour/` |
| Auth inkl. Demo-/Review-Modus | Lovable-Cloud-Auth, Demo-Mode, Review-Account-Setup | `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`, `supabase/functions/setup-review-account/` |
| Themes + Accent-Colors | light/dark/system, Accent-Paletten (Default `sage`) via CSS-Variablen, StatusBar-Sync nativ | `src/hooks/useTheme.ts`, `src/lib/nativeStatusBar.ts` |
| i18n DE/EN | Vollständig modular (10 Domänen-Module), `<html lang>`-Sync | `src/translations/` (index.ts, types.ts) |
| PWA | autoUpdate-SW, DE-Manifest; SW wird auf Capacitor aktiv deregistriert | `vite.config.ts` Z. 30–74, `src/main.tsx` Z. 64–76 |
| GDPR/Consent | Cookie-Consent, AI-Consent, nativer Crash-Consent, Account-Löschung | `src/components/gdpr/`, `src/components/AIConsentModal.tsx`, `supabase/functions/delete-account/` |
| Admin + Analytics | Admin-Seite, Dashboard-Function, Event-Tracking | `src/pages/Admin.tsx`, `supabase/functions/admin/`, `analytics-dashboard/`, `track-event/` |
| E-Mail-System | Transactional Mails + Queue + Auth-Hook (React-Email-Templates) | `supabase/functions/send-transactional-email/`, `process-email-queue/`, `auth-email-hook/`, `_shared/email-templates/` |

### Halbfertig / tot

- **`/audio` (AudioLibrary)**: Route in `src/App.tsx` Z. 237 registriert, aber **nirgends verlinkt** (0 Referenzen im restlichen src) — tote Route.
- **Ungenutzte Komponenten (0 Importe)**: `src/components/home/ShareableInsightCard.tsx`, `src/components/premium/InsightPreviewCard.tsx`, `src/components/journal/EmotionalTimeline.tsx`, `src/components/streak/ConversationMilestone.tsx`.
- **Ungenutzter Hook**: `src/hooks/useSpeechSynthesis.ts` (182 Z., Browser-TTS) wird nirgends importiert — es gibt also **keinen Fallback**, wenn ElevenLabs ausfällt.
- **Notifications faktisch web-only**: `src/hooks/usePushNotifications.ts` nutzt nur die Browser-`Notification`-API + `setTimeout`-Scheduler; `@capacitor/local-notifications`/`push-notifications` fehlen in `package.json`. Die Settings-UI (`src/components/settings/NotificationSettings.tsx`) verspricht Reminder, die auf iOS nativ nie feuern.
- **Bewusst unverlinkt (Dev/QA, ok)**: `/dev-qa`, `/diagnostics` (`src/App.tsx` Z. 63–66, 256–261), `useEntitlementSimulator.ts`, `useNetworkSimulator.ts`.

---

## 2. Integrations-Gesundheit (Code-Ebene)

**(a) ElevenLabs/TTS** — `supabase/functions/text-to-speech/index.ts`: Modell `eleven_multilingual_v2`, Default-Voice `EXAVITQu4vr4xnSDxMaL`, Key-Fallback `ELEVENLABS_API_KEY_1` → `ELEVENLABS_API_KEY`, Markdown-Cleaning, 2000-Zeichen-Cap, sauberes 401/429-Handling. Client (`useElevenLabsTTS.ts`) macht max. 1 Retry bei fetch-Fehlern; **kein TTS-Fallback** (s.o.). Realtime-Voice holt Signed-URLs über `elevenlabs-conversation-token/index.ts` (gleicher Key-Fallback). Code wirkt intakt. Hinweis: Premium-Gate via `requirePremium()` steht per `PREMIUM_GATE_MODE`-Default auf **"off"** (`supabase/functions/_shared/auth.ts` Z. 140) — TTS ist serverseitig aktuell nicht enforced.

**(b) KI-Chat** — Alle Text-KI-Functions (chat, journal-reflect, generate-summary, weekly-recap, session-insight, extract-memories, detect-patterns) gehen über das **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`, `LOVABLE_API_KEY`) mit Modell **`google/gemini-3-flash-preview`**; Chat streamt SSE (`chat/index.ts` Z. 867–913). Avatar-Generierung nutzt `google/gemini-3-pro-image-preview` (`generate-companion/index.ts` Z. 52). Kein Modell-Fallback konfiguriert.

**(c) Billing-Webhooks** — `revenuecat-webhook/index.ts`: Bearer-Secret-Check, fail-closed, 10 Event-Typen typisiert, Bestätigungs-Mail via `@lovable.dev/email-js`. `stripe-webhook/index.ts`: eigene HMAC-SHA256-Signaturprüfung ohne SDK inkl. 5-Min-Timestamp-Fenster. `verify-apple-receipt/index.ts`: Production→Sandbox-Kaskade mit `APPLE_SHARED_SECRET`. `create-checkout/index.ts`: direkter Stripe-REST-Call mit `sk_`-Format-Validierung. Alle drei Pfade wirken vollständig und defensiv gebaut.

**(d) Sentry** — `src/lib/sentry.ts` + `src/main.tsx` Z. 9: Init vor React-Render, No-op ohne `VITE_SENTRY_DSN`, doppeltes Consent-Gating (Web-Cookie + nativer Modal, `beforeSend` → null ohne Consent), PII-Scrubbing, `tracesSampleRate 0.1`, Re-Init nach Consent-Wechsel. Korrekt umgesetzt. `@sentry/react` ist hart auf `10.60.0` gepinnt (ohne `^`, `package.json` Z. 58).

---

## 3. Dependency-Frische (package.json vs. `npm view`, Stand 2026-07-25)

| Paket | Installiert | Latest | Update-Risiko |
|---|---|---|---|
| vite | ^5.4.19 | 8.1.5 | **3 Major** — M/L; zieht `vite-plugin-pwa` 0.19.8 → 1.3.0 mit |
| tailwindcss | ^3.4.17 | 4.3.3 | Major, Config-Rewrite (CSS-first) — **L, riskant** |
| react/react-dom | ^18.3.1 | 19.2.8 | Major — M/L (Testing-Library, Radix, Sentry prüfen) |
| react-router-dom | ^6.30.1 | 7.18.1 | Major — **M, moderat**: v7-Future-Flags sind in `App.tsx` Z. 201 schon aktiv |
| recharts | ^2.15.4 | 3.10.1 | Major — M (nur Mood-Charts betroffen) |
| zod / date-fns / lucide-react | 3.x / 3.x / 0.462 | 4.x / 4.x / 1.x | je S–M |
| typescript | ^5.8.3 | 7.0.2 | Major — mit Vite-Update bündeln |

**Aktuell genug (nur Minor-Lücke, gefahrlos):** `@capacitor/*` 8.0.x → 8.4.2, `@tanstack/react-query` 5.83 → 5.101, `framer-motion` 12.23 → 12.42, `@supabase/supabase-js` 2.89 → 2.110, `@sentry/react` 10.60 → 10.68.
Empfehlung: Minor-Sweep sofort; die Major-Kaskade (Vite 8 + Tailwind 4 + React 19) nur als eigenes, testgestütztes Projekt.

---

## 4. Animations-/Polish-Inventar

**Vorhanden:**
- framer-motion in **102 Dateien** inkl. fast aller Pages; global `MotionConfig reducedMotion="user"` + CSS-Kill-Switch (`src/App.tsx` Z. 189–193, `src/index.css`)
- `tailwindcss-animate` + eigene Keyframes (3 in `src/index.css`, 1 in `tailwind.config.ts`)
- Animierter Companion-Avatar (`CompanionAvatarAnimated.tsx`, 11 Verwendungen, Config in `src/data/companionAnimationConfig.ts`), Voice-Waveforms (`AudioWaveform.tsx`, `VoiceWaveform.tsx`)

**Fehlt spürbar:**
- **Keine Route-Transitions**: `src/components/layout/AppLayout.tsx` rendert `<Outlet/>` ohne `AnimatePresence` — jeder Tab-/Seitenwechsel ist ein harter Cut; Lazy-Route-Fallback ist ein generischer Spinner (`PageLoader`, `App.tsx` Z. 180)
- **Skeleton-Loading fast nirgends**: nur 5 Dateien nutzen Skeletons, auf Page-Ebene einzig `CompanionSettings.tsx`
- **Keine EmptyState-Komponente** (0 Treffer auf `EmptyState` im src)
- **Kein Haptik-Feedback**: `@capacitor/haptics` nicht installiert, 0 Haptics-Referenzen im src — für eine native iOS-App eine deutliche Lücke

---

## 5. Top-10 Quick-Wins (sortiert nach Effekt/Aufwand)

| # | Maßnahme | Aufwand | Sichtbarer Effekt |
|---|---|---|---|
| 1 | `@capacitor/haptics` einbauen (Check-in, Streak-Milestone, Nachricht senden, Mood-Tap) | S | App fühlt sich sofort „nativ" an |
| 2 | Route-Transitions via `AnimatePresence` + `motion.div` in `AppLayout.tsx` (Fade/Slide, reduced-motion-safe) | S | Beseitigt harte Screen-Cuts überall |
| 3 | Skeleton-States für Home/Journal/Mood statt Spinner | M | Gefühlt schnellere App bei jedem Öffnen |
| 4 | Wiederverwendbare `EmptyState`-Komponente (Illustration + CTA) für Journal/Mood/ChatHistory | S | Neue Nutzer sehen Führung statt Leere |
| 5 | Native Local Notifications (`@capacitor/local-notifications`) hinter der bestehenden Settings-UI | M | Größter Retention-Hebel; UI existiert schon (`NotificationSettings.tsx`) |
| 6 | Minor-Dependency-Sweep (Capacitor 8.4, react-query, supabase-js, framer-motion, Sentry) | S | Bugfixes/Perf ohne Breaking-Risiko |
| 7 | Tote Route `/audio` entscheiden: von Home/Toolbox verlinken oder Page + Route löschen | S | Entweder neues sichtbares Feature oder weniger Bundle |
| 8 | 4 ungenutzte Komponenten + `useSpeechSynthesis.ts` löschen (oder Letzteren als TTS-Fallback verdrahten) | S | Weniger Bundle/Wartung; optional TTS-Ausfallsicherheit |
| 9 | PWA-Manifest fixen: echte 192/512-Icons (beide zeigen auf dasselbe `logo.png`) + tote Google-Fonts-Cache-Regel entfernen (Fonts sind self-hosted via @fontsource) | S | Sauberer PWA-Install, korrekte Icons |
| 10 | `PREMIUM_GATE_MODE` Rollout planen (off → log → enforce) für TTS/Voice-Functions | S (Code steht) | Schützt ElevenLabs-Kosten vor Nicht-Zahlern |
