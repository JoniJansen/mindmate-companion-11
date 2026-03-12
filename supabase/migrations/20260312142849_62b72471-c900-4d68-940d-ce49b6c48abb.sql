
CREATE TABLE public.voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  disconnect_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice sessions"
  ON public.voice_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice sessions"
  ON public.voice_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice sessions"
  ON public.voice_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_started_at ON public.voice_sessions(started_at);
