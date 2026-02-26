-- Add DELETE policies for GDPR compliance

-- profiles: allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- subscriptions: allow users to delete their own subscription records
CREATE POLICY "Users can delete their own subscription"
  ON public.subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- weekly_recaps: allow users to delete and update their own recaps
CREATE POLICY "Users can delete their own recaps"
  ON public.weekly_recaps
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recaps"
  ON public.weekly_recaps
  FOR UPDATE
  USING (auth.uid() = user_id);