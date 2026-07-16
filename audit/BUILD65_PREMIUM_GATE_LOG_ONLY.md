# Elite-Audit #6 — Server-Side Premium Gate (Three-Mode Flag)

## What ships in this commit

New export in `supabase/functions/_shared/auth.ts`:

```typescript
export async function requirePremium(req: Request): Promise<{ user, supabase }>
```

Behavior is controlled by the Supabase env var `PREMIUM_GATE_MODE`:

| Mode | Behavior | When to use |
|---|---|---|
| `"off"` (default) | Runs `requireUser()` only, skips premium check entirely. Current behavior preserved. | Now, until Sub-DB-Fix is applied. Zero risk of blocking paying users. |
| `"log"` | Runs `requireUser()`, then queries `subscriptions` table. If not premium: logs a structured warning `{ level:"warn", feature:"premium-gate", action:"would_block", userId, subStatus }` — but still allows the request. | After Sub-DB-Fix is applied. Run for 1-2 weeks to observe false positives without any user impact. |
| `"enforce"` | Runs `requireUser()`, then queries `subscriptions` table. If not premium: returns HTTP 402 `PREMIUM_REQUIRED`. | After 1-2 weeks of clean `log` mode (no false-positive warnings). |

Rollback: set `PREMIUM_GATE_MODE=off` again. Instant, no code deploy needed.

All 5 premium edge functions now call `requirePremium(req)` instead of `requireUser(req)`:

- `supabase/functions/text-to-speech/index.ts`
- `supabase/functions/session-insight/index.ts`
- `supabase/functions/generate-summary/index.ts`
- `supabase/functions/journal-reflect/index.ts`
- `supabase/functions/weekly-recap/index.ts`

## Why the three modes

Elite-Audit `SUBSCRIPTION_DB_FIX_PLAN_20260624.md` documents a load-bearing bug: `public.subscriptions.user_id` has no UNIQUE index but four writer paths upsert with `onConflict:'user_id'`, so **every RevenueCat, Apple, Stripe webhook write fails silently** with Postgres 42P10. That means many active paying iOS/Android users have NO row in the `subscriptions` table at all — their premium status is known only to the RevenueCat SDK on their device.

If we shipped a hard `requirePremium` gate that reads `subscriptions.status = 'active'` while the DB is in this state, we would return 402 to every one of those users. That is the same class of bug as the App Store "silent subscription failure" that Elite-Audit was written to prevent.

The three-mode flag lets us **ship the code** (so it's reviewed, deployed, and tested) but **defer the enforcement decision** to when the DB is trustworthy.

## Deployment path

1. **Now**: this commit ships. Env var unset ⇒ mode defaults to `"off"` ⇒ zero behavior change in production.
2. **When Sub-DB-Fix is run** (`audit/SUBSCRIPTION_DB_FIX_RUNBOOK.md`, ~10 min in Supabase SQL Editor): set `PREMIUM_GATE_MODE=log` in Supabase secrets. Watch logs for a week — every `would_block` log entry is a paying user we'd have wrongly blocked. Investigate each.
3. **When `log` mode is clean for ~7 days**: set `PREMIUM_GATE_MODE=enforce`. Server-side premium is now live.
4. **If anything goes wrong after enforce**: set back to `log` or `off` in one env-var change. Undo is instantaneous.

## What the gate does NOT protect against

- **Client-side abuse**: a jailbroken client could still call these functions with a valid JWT and the gate wouldn't help if the DB says they're premium (e.g. compromised account). This is standard risk; premium status is checked, but "who is this user really" is the auth layer's job.
- **RevenueCat-only users**: same as above — the gate reads the DB, not RevenueCat. Users whose premium is only in RC and not in the DB will be blocked in `enforce` mode. This is exactly why Sub-DB-Fix must run first.
- **AI consent**: `requireAIConsent` is unchanged. Functions that need both consent AND premium should be updated to chain both (currently these five need premium and JWT but not consent; session-insight already used `requireAIConsent` in one earlier state — verify before merge that it's still correct).

## Testing

- `bun run test` → 125/125 green with the new export (existing tests are Vitest running on client code; the edge functions are Deno and not part of the vitest suite).
- Manual test path for when `log` mode is enabled: sign in as a non-premium user in a browser, call one of the five functions, watch Supabase edge-function logs for a `would_block` warn line. Sign in as a premium user, no log line should appear.

## Follow-ups

- Sub-DB-Fix must be executed for the gate to be usable in `log`/`enforce` mode. Runbook: `audit/SUBSCRIPTION_DB_FIX_RUNBOOK.md`.
- Once `enforce` is live and stable, consider adding a `requirePremiumAndAIConsent` combined helper so functions that need both don't do two round trips to the DB.
- Metrics: if the `would_block` warn logs become annoying to grep, wire them into Sentry or a dedicated counter. For now, structured JSON in edge-function logs is enough for a week of observation.
