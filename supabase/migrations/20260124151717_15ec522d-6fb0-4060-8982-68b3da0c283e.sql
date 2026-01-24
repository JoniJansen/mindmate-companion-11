-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'de',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing tables to use user_id (UUID) instead of user_session_id
-- Add user_id column to mood_checkins
ALTER TABLE public.mood_checkins ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to journal_entries
ALTER TABLE public.journal_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to weekly_recaps
ALTER TABLE public.weekly_recaps ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies on mood_checkins
DROP POLICY IF EXISTS "Users can create mood checkins" ON public.mood_checkins;
DROP POLICY IF EXISTS "Users can delete their own mood checkins" ON public.mood_checkins;
DROP POLICY IF EXISTS "Users can update their own mood checkins" ON public.mood_checkins;
DROP POLICY IF EXISTS "Users can view their own mood checkins" ON public.mood_checkins;

-- Create secure policies for mood_checkins
CREATE POLICY "Users can view their own mood checkins" 
ON public.mood_checkins FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood checkins" 
ON public.mood_checkins FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood checkins" 
ON public.mood_checkins FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood checkins" 
ON public.mood_checkins FOR DELETE 
USING (auth.uid() = user_id);

-- Drop old permissive policies on journal_entries
DROP POLICY IF EXISTS "Users can create entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON public.journal_entries;

-- Create secure policies for journal_entries
CREATE POLICY "Users can view their own entries" 
ON public.journal_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entries" 
ON public.journal_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries" 
ON public.journal_entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries" 
ON public.journal_entries FOR DELETE 
USING (auth.uid() = user_id);

-- Drop old permissive policies on weekly_recaps
DROP POLICY IF EXISTS "Users can create recaps" ON public.weekly_recaps;
DROP POLICY IF EXISTS "Users can view their own recaps" ON public.weekly_recaps;

-- Create secure policies for weekly_recaps
CREATE POLICY "Users can view their own recaps" 
ON public.weekly_recaps FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recaps" 
ON public.weekly_recaps FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Drop old permissive policies on subscriptions
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;

-- Create secure policies for subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Service role policy for webhook updates (uses service role key)
CREATE POLICY "Service role can manage subscriptions" 
ON public.subscriptions FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_mood_checkins_user_id ON public.mood_checkins(user_id);
CREATE INDEX idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX idx_weekly_recaps_user_id ON public.weekly_recaps(user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);