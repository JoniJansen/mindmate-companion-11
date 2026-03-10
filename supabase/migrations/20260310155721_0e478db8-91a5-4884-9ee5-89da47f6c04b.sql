
-- Feature 1: Personal Memory Engine
CREATE TABLE public.user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  memory_type text NOT NULL DEFAULT 'context',
  content text NOT NULL,
  confidence_score numeric DEFAULT 0.7,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memories" ON public.user_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON public.user_memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON public.user_memories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON public.user_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Feature 2: Emotional Pattern Detection
CREATE TABLE public.emotional_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern_type text NOT NULL DEFAULT 'recurring_theme',
  description text NOT NULL,
  confidence numeric DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.emotional_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own patterns" ON public.emotional_patterns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON public.emotional_patterns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own patterns" ON public.emotional_patterns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Feature 3: Session Insights
CREATE TABLE public.session_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id text,
  insight_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insights" ON public.session_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.session_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON public.session_insights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Feature 4: Daily Reflection Prompts
CREATE TABLE public.daily_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text text NOT NULL,
  prompt_text_de text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read prompts" ON public.daily_prompts FOR SELECT TO authenticated USING (true);

-- Seed daily prompts
INSERT INTO public.daily_prompts (prompt_text, prompt_text_de, category) VALUES
('How are you feeling right now?', 'Wie fühlst du dich gerade?', 'check-in'),
('What''s on your mind today?', 'Was beschäftigt dich heute?', 'check-in'),
('One thought before sleep?', 'Ein Gedanke vor dem Schlafen?', 'evening'),
('Anything weighing on you today?', 'Belastet dich heute etwas?', 'check-in'),
('What made you smile today?', 'Was hat dich heute zum Lächeln gebracht?', 'gratitude'),
('What do you need right now?', 'Was brauchst du gerade?', 'self-care'),
('How was your energy today?', 'Wie war deine Energie heute?', 'reflection'),
('What are you looking forward to?', 'Worauf freust du dich?', 'forward'),
('Is there something you want to let go of?', 'Gibt es etwas, das du loslassen möchtest?', 'release'),
('What felt good this week?', 'Was hat sich diese Woche gut angefühlt?', 'gratitude'),
('How did you take care of yourself today?', 'Wie hast du heute für dich gesorgt?', 'self-care'),
('What''s one thing you''re proud of?', 'Worauf bist du stolz?', 'affirmation');

-- Enable realtime for session_insights
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_insights;
