
-- 1. Add SELECT policy for user_roles so authenticated users can read their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Remove DELETE policy from user_activity_log to make it append-only
DROP POLICY IF EXISTS "Users can delete their own activity" ON public.user_activity_log;
