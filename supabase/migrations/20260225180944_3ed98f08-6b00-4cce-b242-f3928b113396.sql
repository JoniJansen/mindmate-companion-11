
-- Activity log for streak tracking
CREATE TABLE public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('mood_checkin', 'journal_entry', 'exercise_completed', 'chat_session')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one activity type per user per day
CREATE UNIQUE INDEX idx_user_activity_unique ON public.user_activity_log (user_id, activity_date, activity_type);

-- Index for streak queries
CREATE INDEX idx_user_activity_date ON public.user_activity_log (user_id, activity_date DESC);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own activity" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity" ON public.user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity" ON public.user_activity_log
  FOR DELETE USING (auth.uid() = user_id);
