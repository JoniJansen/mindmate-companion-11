-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_patterns_user_id ON public.emotional_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_session_insights_user_id ON public.session_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id_date ON public.user_activity_log(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_profiles_user_id ON public.companion_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_chat_usage_user_date ON public.daily_chat_usage(user_id, usage_date);