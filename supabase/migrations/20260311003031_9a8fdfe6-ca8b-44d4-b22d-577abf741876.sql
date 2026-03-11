
-- Create companion_profiles table
CREATE TABLE public.companion_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Mira',
  avatar_url text,
  appearance_prompt text,
  personality_style text NOT NULL DEFAULT 'warm and empathetic',
  tone text NOT NULL DEFAULT 'gentle',
  archetype text NOT NULL DEFAULT 'mira',
  bond_level integer NOT NULL DEFAULT 0,
  last_interaction timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.companion_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own companion
CREATE POLICY "Users can read own companion"
ON public.companion_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own companion
CREATE POLICY "Users can insert own companion"
ON public.companion_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own companion
CREATE POLICY "Users can update own companion"
ON public.companion_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own companion
CREATE POLICY "Users can delete own companion"
ON public.companion_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
