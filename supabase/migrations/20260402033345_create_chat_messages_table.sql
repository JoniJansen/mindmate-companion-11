-- Create chat_messages table for persistent chat history
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- For anonymous users or session tracking
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_chat_messages_user_session ON public.chat_messages(user_id, session_id, created_at);

-- Updated_at trigger
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();</content>
<parameter name="filePath">/Users/jonathanjansen/soulvay/supabase/migrations/20260402033345_create_chat_messages_table.sql