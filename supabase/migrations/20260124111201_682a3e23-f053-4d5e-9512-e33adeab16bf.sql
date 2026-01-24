-- Create mood_checkins table for structured mood tracking
CREATE TABLE public.mood_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_session_id TEXT NOT NULL,
  mood_value INTEGER NOT NULL CHECK (mood_value BETWEEN 1 AND 5),
  feelings TEXT[] DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;

-- RLS policies for mood_checkins
CREATE POLICY "Users can view their own mood checkins"
ON public.mood_checkins FOR SELECT
USING (true);

CREATE POLICY "Users can create mood checkins"
ON public.mood_checkins FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own mood checkins"
ON public.mood_checkins FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own mood checkins"
ON public.mood_checkins FOR DELETE
USING (true);

-- Create weekly_recaps table for AI-generated insights
CREATE TABLE public.weekly_recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_session_id TEXT NOT NULL,
  time_range TEXT NOT NULL DEFAULT '7d',
  patterns TEXT[] DEFAULT '{}',
  potential_needs TEXT[] DEFAULT '{}',
  suggested_next_step TEXT,
  summary_bullets TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.weekly_recaps ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_recaps
CREATE POLICY "Users can view their own recaps"
ON public.weekly_recaps FOR SELECT
USING (true);

CREATE POLICY "Users can create recaps"
ON public.weekly_recaps FOR INSERT
WITH CHECK (true);

-- Add tags column to journal_entries for emotion/topic tagging
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add prompt_id column to journal_entries for guided prompts
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS prompt_id TEXT;