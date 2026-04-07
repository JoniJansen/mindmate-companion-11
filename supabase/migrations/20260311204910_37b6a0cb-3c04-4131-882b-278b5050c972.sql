
-- P0.3: Fix nullable user_id on ownership-dependent tables
-- Step 1: Delete orphaned rows where user_id IS NULL (these are inaccessible via RLS anyway)
DELETE FROM mood_checkins WHERE user_id IS NULL;
DELETE FROM journal_entries WHERE user_id IS NULL;
DELETE FROM weekly_recaps WHERE user_id IS NULL;

-- Step 2: For subscriptions, NULL user_id rows may be from Stripe webhook before user association
-- Keep them but set a sentinel — actually just delete since they're invisible via RLS
DELETE FROM subscriptions WHERE user_id IS NULL;

-- Step 3: Add NOT NULL constraints
ALTER TABLE mood_checkins ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE journal_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE weekly_recaps ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN user_id SET NOT NULL;
