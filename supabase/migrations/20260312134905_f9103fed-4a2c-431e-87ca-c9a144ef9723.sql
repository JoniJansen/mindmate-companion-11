CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON public.journal_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON public.conversations (user_id, updated_at DESC);