ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_ai_consent
  ON public.profiles(user_id)
  WHERE ai_consent_given = TRUE;