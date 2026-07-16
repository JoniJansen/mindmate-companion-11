# Subscription-DB-Fix — Execution Runbook

**Purpose.** Copy-paste-ready guide to apply the fix laid out in `audit/SUBSCRIPTION_DB_FIX_PLAN_20260624.md`. Unblocks Elite-Audit #6 (server-side premium gate) and stops the silent-failure webhook loop.

**Time.** ~10 minutes if pre-check is clean.

**Where.** Supabase Dashboard → SQL Editor. Or `supabase db remote` CLI if you prefer.

**Safety.** Every step is either read-only or wraps writes in a single transaction with a backup table taken first. Rollback path documented at the bottom.

---

## Prerequisites

1. Supabase project access with `postgres` role (or equivalent).
2. You have the current production DB — not a fresh clone.
3. No other migration running.

---

## Step 1 — Pre-Check (READ-ONLY, must be run first)

Paste all 5 queries into the SQL Editor and run. **These do not modify anything.**

```sql
-- 1) Total rows in subscriptions
SELECT count(*) AS total_rows FROM public.subscriptions;

-- 2) Current unique indexes on subscriptions
SELECT i.relname AS index_name,
       ix.indisunique AS is_unique,
       pg_get_indexdef(ix.indexrelid) AS index_def
FROM pg_index ix
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
WHERE t.relname = 'subscriptions'
  AND t.relnamespace = 'public'::regnamespace
ORDER BY i.relname;

-- 3) KERNFRAGE: duplicate user_id rows? (EXPECTED: 0)
SELECT user_id, count(*) AS dupe_count
FROM public.subscriptions
GROUP BY user_id
HAVING count(*) > 1
ORDER BY dupe_count DESC;

-- 4) Rows where user_session_id ≠ user_id? (EXPECTED: 0)
SELECT count(*) AS mismatch_rows
FROM public.subscriptions
WHERE user_session_id IS DISTINCT FROM user_id::text;

-- 5) NULL user_id rows? (EXPECTED: 0)
SELECT count(*) AS null_user_id_rows
FROM public.subscriptions
WHERE user_id IS NULL;
```

## Decision tree

| Query 3 | Query 4 | Query 5 | Verdict |
|---|---|---|---|
| 0 | 0 | 0 | ✅ **GO** — Migration is purely additive. Skip to Step 2. |
| >0 | any | any | ⚠️ **STOP** — Real duplicates exist. Read `SUBSCRIPTION_DB_FIX_PLAN_20260624.md` §3 "Dedup statusbewusst", decide which row to keep per user, then adapt the dedup step. |
| any | >0 | any | ⚠️ **STOP** — user_session_id/user_id mismatch. Investigate why before migrating. |
| any | any | >0 | ⚠️ **STOP** — NULL user_id rows. Investigate + clean up first. |

**If verdict is not GO, do not proceed.** Paste the query results into a message and I'll help interpret.

---

## Step 2 — Backup (write, but only creates a snapshot)

```sql
CREATE TABLE public.subscriptions_backup_20260716 AS
SELECT * FROM public.subscriptions;
```

Verify the row count matches Query 1 above:

```sql
SELECT count(*) FROM public.subscriptions_backup_20260716;
```

The backup can be dropped once the migration is verified and stable (recommended: keep for 30 days).

---

## Step 3 — Migration (single transaction)

Run this **as one block**. It either fully commits or fully rolls back.

```sql
BEGIN;

LOCK TABLE public.subscriptions IN SHARE ROW EXCLUSIVE MODE;

-- Safety-net dedup: status-aware, active row wins.
-- Should be a no-op if pre-check Query 3 returned 0.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY
        CASE WHEN status = 'active'   THEN 1
             WHEN status = 'trialing' THEN 2
             WHEN status = 'past_due' THEN 3
             ELSE 4 END,
        updated_at DESC
    ) AS rn
  FROM public.subscriptions
)
DELETE FROM public.subscriptions s
USING ranked r
WHERE s.id = r.id AND r.rn > 1;

-- The load-bearing change: add the UNIQUE index that all four writers
-- rely on for their `onConflict:'user_id'` upsert.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_key
  ON public.subscriptions (user_id);

COMMIT;
```

If any statement fails, the entire block rolls back — no partial state.

---

## Step 4 — Post-Migration Verification (READ-ONLY)

```sql
-- Confirm the unique index now exists
SELECT indexdef FROM pg_indexes
WHERE tablename = 'subscriptions'
  AND schemaname = 'public'
  AND indexname = 'subscriptions_user_id_key';

-- Confirm no duplicates
SELECT count(*) AS still_duplicate
FROM (
  SELECT user_id FROM public.subscriptions
  GROUP BY user_id HAVING count(*) > 1
) x;

-- Confirm row count reasonable (should equal backup or slightly less if dedup removed)
SELECT
  (SELECT count(*) FROM public.subscriptions) AS current_rows,
  (SELECT count(*) FROM public.subscriptions_backup_20260716) AS backup_rows;
```

Expected:
- `indexdef` returns exactly one row containing `CREATE UNIQUE INDEX ... (user_id)`
- `still_duplicate` = 0
- `current_rows` ≤ `backup_rows` (equal if dedup was a no-op)

---

## Step 5 — Test the fix

Trigger any of the four writer paths and confirm no `42P10` errors:

**Option A (fastest):** In Supabase Dashboard → Edge Functions → `revenuecat-webhook` → Logs — trigger a test event from RevenueCat Dashboard's webhook tester. Should return 200, not 500.

**Option B:** Make a test purchase in Sandbox (Stripe or Apple), watch webhook logs.

**Option C (client):** In the app, sign in as a premium user, then in browser DevTools console:
```js
await window.supabase.functions.invoke('manage-subscription', { body: { action: 'status' } })
```
Should return `{ isPremium: true, ... }` without errors.

---

## What this unblocks

- **RevenueCat-Webhook** stops returning 500 (no more infinite retries)
- **verify-apple-receipt** stops returning 400
- **Stripe-Webhook** actually writes to the DB (previously silently discarded)
- **manage-subscription** `action: 'status'` reflects real state for iOS/Android users, not just Stripe/Web
- **Elite-Audit #6** (`requirePremium()` server-side gate) can now safely check `subscriptions.status = 'active'` without locking out paying users

---

## Rollback (if something goes very wrong)

Only needed if verification fails or new bugs appear after the migration.

```sql
BEGIN;
-- Drop the new index
DROP INDEX IF EXISTS public.subscriptions_user_id_key;

-- Restore from backup (WARNING: this replaces ALL current subscriptions data,
-- losing any writes that succeeded between backup time and now)
TRUNCATE public.subscriptions;
INSERT INTO public.subscriptions SELECT * FROM public.subscriptions_backup_20260716;
COMMIT;
```

**Rollback is destructive** to any subscription writes that happened between Step 2 (backup) and now. Only use if the migration itself corrupted something.

Better recovery in most cases: just drop the new index (`DROP INDEX subscriptions_user_id_key;`). Row data stays intact. Everything reverts to the pre-migration state.

---

## After success

1. Ping me — I'll implement Elite-Audit #6 (`requirePremium()` helper + gate on the 5 premium edge functions) safely knowing the DB is honest.
2. Consider dropping `subscriptions_backup_20260716` after ~30 days of stable operation.
3. Monitor the four writer paths for a week — no more silent 42P10 errors in edge-function logs.
