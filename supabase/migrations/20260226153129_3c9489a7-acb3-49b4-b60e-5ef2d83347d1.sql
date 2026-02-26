
-- Fix 1: Replace overly permissive service role policy with a more restrictive one
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

-- Allow service role INSERT for webhook handlers (stripe, revenuecat, apple receipt)
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role UPDATE for webhook handlers
CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO service_role
  USING (true);

-- Allow service role SELECT for webhook lookups
CREATE POLICY "Service role can select subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO service_role
  USING (true);
