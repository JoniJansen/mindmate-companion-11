
-- Fix: Convert all RESTRICTIVE RLS policies to PERMISSIVE
-- PostgreSQL requires drop+recreate to change policy type

-- ===== session_insights =====
DROP POLICY IF EXISTS "Users can view own insights" ON public.session_insights;
CREATE POLICY "Users can view own insights" ON public.session_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON public.session_insights;
CREATE POLICY "Users can insert own insights" ON public.session_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own insights" ON public.session_insights;
CREATE POLICY "Users can delete own insights" ON public.session_insights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== daily_prompts =====
DROP POLICY IF EXISTS "Authenticated users can read prompts" ON public.daily_prompts;
CREATE POLICY "Authenticated users can read prompts" ON public.daily_prompts FOR SELECT TO authenticated USING (true);

-- ===== mood_checkins =====
DROP POLICY IF EXISTS "Users can view their own mood checkins" ON public.mood_checkins;
CREATE POLICY "Users can view their own mood checkins" ON public.mood_checkins FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own mood checkins" ON public.mood_checkins;
CREATE POLICY "Users can create their own mood checkins" ON public.mood_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own mood checkins" ON public.mood_checkins;
CREATE POLICY "Users can update their own mood checkins" ON public.mood_checkins FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own mood checkins" ON public.mood_checkins;
CREATE POLICY "Users can delete their own mood checkins" ON public.mood_checkins FOR DELETE USING (auth.uid() = user_id);

-- ===== journal_entries =====
DROP POLICY IF EXISTS "Users can view their own entries" ON public.journal_entries;
CREATE POLICY "Users can view their own entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own entries" ON public.journal_entries;
CREATE POLICY "Users can create their own entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own entries" ON public.journal_entries;
CREATE POLICY "Users can update their own entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own entries" ON public.journal_entries;
CREATE POLICY "Users can delete their own entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- ===== companion_profiles =====
DROP POLICY IF EXISTS "Users can read own companion" ON public.companion_profiles;
CREATE POLICY "Users can read own companion" ON public.companion_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own companion" ON public.companion_profiles;
CREATE POLICY "Users can insert own companion" ON public.companion_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own companion" ON public.companion_profiles;
CREATE POLICY "Users can update own companion" ON public.companion_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own companion" ON public.companion_profiles;
CREATE POLICY "Users can delete own companion" ON public.companion_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== emotional_patterns =====
DROP POLICY IF EXISTS "Users can view own patterns" ON public.emotional_patterns;
CREATE POLICY "Users can view own patterns" ON public.emotional_patterns FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own patterns" ON public.emotional_patterns;
CREATE POLICY "Users can insert own patterns" ON public.emotional_patterns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own patterns" ON public.emotional_patterns;
CREATE POLICY "Users can delete own patterns" ON public.emotional_patterns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== user_memories =====
DROP POLICY IF EXISTS "Users can view own memories" ON public.user_memories;
CREATE POLICY "Users can view own memories" ON public.user_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memories" ON public.user_memories;
CREATE POLICY "Users can insert own memories" ON public.user_memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own memories" ON public.user_memories;
CREATE POLICY "Users can update own memories" ON public.user_memories FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own memories" ON public.user_memories;
CREATE POLICY "Users can delete own memories" ON public.user_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== subscriptions =====
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can insert subscriptions" ON public.subscriptions FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can update subscriptions" ON public.subscriptions FOR UPDATE TO service_role USING (true);

DROP POLICY IF EXISTS "Service role can select subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can select subscriptions" ON public.subscriptions FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "Users can delete their own subscription" ON public.subscriptions;
CREATE POLICY "Users can delete their own subscription" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ===== user_activity_log =====
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity_log;
CREATE POLICY "Users can view their own activity" ON public.user_activity_log FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity_log;
CREATE POLICY "Users can insert their own activity" ON public.user_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== weekly_recaps =====
DROP POLICY IF EXISTS "Users can view their own recaps" ON public.weekly_recaps;
CREATE POLICY "Users can view their own recaps" ON public.weekly_recaps FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own recaps" ON public.weekly_recaps;
CREATE POLICY "Users can create their own recaps" ON public.weekly_recaps FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recaps" ON public.weekly_recaps;
CREATE POLICY "Users can update their own recaps" ON public.weekly_recaps FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recaps" ON public.weekly_recaps;
CREATE POLICY "Users can delete their own recaps" ON public.weekly_recaps FOR DELETE USING (auth.uid() = user_id);

-- ===== chat_messages =====
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));

-- ===== user_roles =====
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===== daily_chat_usage =====
DROP POLICY IF EXISTS "Users can view own chat usage" ON public.daily_chat_usage;
CREATE POLICY "Users can view own chat usage" ON public.daily_chat_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages chat usage" ON public.daily_chat_usage;
CREATE POLICY "Service role manages chat usage" ON public.daily_chat_usage FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ===== conversations =====
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
CREATE POLICY "Users can insert own conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== profiles =====
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);
