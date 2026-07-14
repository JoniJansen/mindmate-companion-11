# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Soulvay is an AI mental-health companion app (chat, journaling, mood tracking, guided exercises). It started as a Lovable web app and is shipped as a **native iOS/Android app via Capacitor** — it is live on the App Store. The same React codebase serves three targets: web/PWA, iOS, and Android. Code frequently branches on runtime target via `isNativeApp()` (`src/lib/nativeDetect.ts`) and `src/lib/platformSeparation.ts`.

**Bundle identity:** the internal `appId` is `com.jonathanjansen.mindmate` ("mindmate" predates the Soulvay rebrand). Do **not** change it — all App Store Connect history, IAP products, and 60+ builds are tied to it. The user-facing name is "Soulvay".

## Source of truth & editing workflow

This repo (GitHub `JoniJansen/mindmate-companion-11`) is the **single source of truth, and all editing happens locally via Claude Code** — the Lovable web editor is no longer used for changes (decided 2026-06-24). Lovable stays connected as host/mirror: it deploys the web/PWA version and provides Google/Apple sign-in (`@lovable.dev/cloud-auth-js`, see `src/integrations/lovable/index.ts`).

- Never tell the user to edit in Lovable. Make changes here, commit locally, and push to `origin` **only on the user's explicit GO** — pushing is what makes Lovable redeploy the web version (and the release rule below still gates iOS-related pushes).
- Before starting work, make sure local `main` is in sync with `origin` (Lovable may have committed in the past): `git fetch && git status -sb`; integrate `origin` first if behind.
- Leave auto-generated Lovable files (e.g. `src/integrations/lovable/index.ts`, marked "do not modify") untouched.

## Package manager

Use **bun** (`bun.lock` is authoritative; the iOS build scripts call `bun`). Avoid `npm`/`npx` for installs even though npm lockfiles exist.

## Commands

```bash
bun install              # install deps
bun run dev              # dev server on :8080
bun run build            # production web build → dist/
bun run build:ios        # rm -rf dist && vite build && cap sync ios  (atomic iOS build — always use this for iOS)
bun run verify:ios       # gate: greps the iOS runtime bundle for the 'mic_free_attempt' marker, must print ✅
bun run lint             # eslint
```

**Tests** use Vitest (jsdom + Testing Library) but there is **no `test` script** in package.json. Run directly:

```bash
npx vitest run                                   # all tests once
npx vitest run src/test/release-gate.test.ts     # a single file
npx vitest                                       # watch mode
```

Test files live in `src/test/` (e.g. `release-gate.test.ts`, `regression.test.ts`, `simulators.test.ts`).

## iOS release — read `RELEASE.md` before any build ≥ 61

iOS releases follow a mandatory, gated checklist in [RELEASE.md](RELEASE.md). It exists because of the Build 60 "stale bundle" incident (an old web bundle shipped inside a new archive). Non-negotiable rules:

- **Always build with `bun run build:ios`** (it wipes `dist/` and runs `cap sync` atomically), then **`bun run verify:ios`** must print ✅ before archiving. A stale `ios/App/App/public` is the default failure mode.
- **Bump the version by editing `ios/App/App/Info.plist` directly with PlistBuddy** (`CFBundleVersion`), then `plutil -lint`. Do not rely on Xcode/pbxproj auto-bumps — the Capacitor Info.plist has historically held a hardcoded version.
- **Do not `git push` release/pipeline-fix commits until the user confirms a TestFlight re-test passed on a real device.** Commit locally, wait for explicit GO. Pushing an unverified "fix" is treated as fatal.

`audit/` contains the post-mortems behind these rules (`BUILD60_ENGINEERING_LESSONS_MASTER.md` etc.) — consult it when a build behaves unexpectedly rather than re-deriving.

## Architecture

**Frontend:** Vite + React 18 + TypeScript, shadcn/ui (Radix primitives in `src/components/ui/`), Tailwind, `react-router-dom` v6, TanStack Query for server state, framer-motion, react-hook-form + zod. Path alias `@/` → `src/`.

**`src/App.tsx` is the composition root.** It wires the provider stack (`QueryClientProvider` → `TooltipProvider` → `AuthProvider` → `BrowserRouter` → `TourProvider`) and all routes. Critical pages (Chat, Home, Auth, Onboarding) are eagerly imported; everything else is `lazy()`-loaded. Main tabbed pages render inside `<OnboardingGuard><AppLayout/></OnboardingGuard>` and are each wrapped in a `SectionErrorBoundary`. The top-level `ErrorBoundary` is the outermost wrapper.

**Auth & gating:** `src/contexts/AuthContext.tsx` + `useAuth` over Supabase auth. The app has several special modes that gate UI/routes: **demo mode**, **AI-consent gate** (`AIConsentModal`), and **review mode** (`src/lib/reviewMode.ts`, `/review-*` pages, `setup-review-account` edge function) used for App Store review. `/dev-qa` is reachable by direct URL only (TestFlight crash verification); `/diagnostics` is gated by `src/lib/diagnosticsAccess.ts` and never appears on production.

**Backend:** Supabase — Postgres (31 migrations in `supabase/migrations/`) plus ~25 **Deno edge functions** in `supabase/functions/` (shared code in `_shared/`). Notable ones: `chat`, `text-to-speech` + `elevenlabs-conversation-token` (voice), `extract-memories`/`detect-patterns`/`session-insight`/`generate-summary`/`weekly-recap` (the AI "memory" features), `generate-companion`, and the billing set below. The browser talks to Supabase via `src/integrations/supabase/client.ts` (`types.ts` is generated).

**Subscriptions are dual-rail and server-verified:**
- iOS in-app purchases → **RevenueCat** (`@revenuecat/purchases-capacitor`), verified by `verify-apple-receipt` and `revenuecat-webhook`.
- Web → **Stripe** (`create-checkout`, `stripe-webhook`), managed via `manage-subscription`.
- Premium status is resolved server-side inside `usePremium` (calls `manage-subscription`), not trusted from the client.
- **RevenueCat must stay lazy-initialized** — it is initialized only when the user opens `/upgrade`, never at app startup. Initializing it at launch caused iPad crashes and an App Store rejection (Build 43). See the comments in `App.tsx`.

**Crash reporting:** Sentry (`@sentry/capacitor` + `@sentry/react`), configured in `src/lib/sentry.ts`, with a native crash-consent modal for GDPR.

**i18n:** custom, not a library — strings in `src/translations/`, accessed via the `useTranslation` hook; `HtmlLangSync` keeps `<html lang>` in sync.

## Conventions & gotchas

- `.env` **is committed** intentionally and holds only public values (`VITE_SUPABASE_*` publishable key, `VITE_SENTRY_DSN`). Real secrets — signing `.p8`/`.p12`/`.mobileprovision`, keystores — are gitignored; never commit them.
- `.claude/` is gitignored (local settings); this root `CLAUDE.md` is tracked.
- Speech recognition uses a **custom fork** plugin pinned in package.json (`github:JoniJansen/capacitor-speech-recognition-spm#...`), not the upstream package.
- The repo root holds several incident/working docs (`DIAGNOSE.md`, `ROOT_CAUSE.md`, `FIX_CLOSURE.md`, `RC_VERIFY.md`, etc.) — these are point-in-time investigation notes, not current spec. `RELEASE.md` and `audit/` are the durable references.
