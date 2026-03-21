-- =============================================================================
-- Fix: bikes table RLS policies
-- Issue: users unable to update their own bike data
-- Root cause: UPDATE policy was missing or lacked a WITH CHECK clause,
--             causing Supabase to silently return 0 rows on every update.
-- =============================================================================

-- Diagnostic query (run manually in Supabase SQL editor to inspect before/after):
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'bikes'
-- ORDER BY cmd;

-- -----------------------------------------------------------------------------
-- Re-create all four CRUD policies for bikes idempotently.
-- Dropping by name ensures stale/duplicate policies don't conflict.
-- -----------------------------------------------------------------------------

-- SELECT
DROP POLICY IF EXISTS "Users can view own bikes" ON public.bikes;
CREATE POLICY "Users can view own bikes"
  ON public.bikes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT
DROP POLICY IF EXISTS "Users can insert own bikes" ON public.bikes;
CREATE POLICY "Users can insert own bikes"
  ON public.bikes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE  ← this was the broken one
-- USING  : which existing rows the user is allowed to target
-- WITH CHECK : which new values are allowed after the update
--             (prevents a user from reassigning a bike to another user_id)
DROP POLICY IF EXISTS "Users can update own bikes" ON public.bikes;
CREATE POLICY "Users can update own bikes"
  ON public.bikes
  FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE
DROP POLICY IF EXISTS "Users can delete own bikes" ON public.bikes;
CREATE POLICY "Users can delete own bikes"
  ON public.bikes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Confirm RLS is enabled on the table (no-op if already enabled)
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
