-- Build 51 — Server-side AI Consent enforcement
-- Apple App Review rejection May 14, 2026 (Guidelines 5.1.1(i) / 5.1.2(i))
--
-- Adds durable server-side AI consent state to profiles. This is the source
-- of truth for whether an authenticated user has accepted the AI data-
-- processing disclosure. localStorage remains a UX cache; server enforces.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_ai_consent
  ON public.profiles(user_id)
  WHERE ai_consent_given = TRUE;

-- RLS: existing policies "Users can view their own profile" and
-- "Users can update their own profile" already grant authenticated users
-- SELECT/UPDATE on their own row, including these new columns.
