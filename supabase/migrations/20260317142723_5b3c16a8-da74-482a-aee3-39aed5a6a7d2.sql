
-- Analytics events table
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  session_id text NOT NULL,
  event_name text NOT NULL,
  event_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events (user_id);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events (event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at);
CREATE INDEX idx_analytics_events_name_created ON public.analytics_events (event_name, created_at);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (supports anonymous + authenticated)
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service_role can read (admin edge function uses service key)
CREATE POLICY "Service role can read analytics"
  ON public.analytics_events FOR SELECT
  TO service_role
  USING (true);
