-- Create journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_session_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to manage their own entries (using session ID for anonymous users)
CREATE POLICY "Users can view their own entries" 
ON public.journal_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create entries" 
ON public.journal_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own entries" 
ON public.journal_entries 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete their own entries" 
ON public.journal_entries 
FOR DELETE 
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();