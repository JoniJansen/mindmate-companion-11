-- Table for server-side daily message counting
CREATE TABLE public.daily_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, usage_date)
);

ALTER TABLE public.daily_chat_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view own chat usage"
ON public.daily_chat_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Service role manages the counting
CREATE POLICY "Service role manages chat usage"
ON public.daily_chat_usage FOR ALL TO service_role
USING (true) WITH CHECK (true);