-- Fix RLS on public.users so authenticated users can insert/upsert/update their own row.
-- Previous UPDATE policy was missing WITH CHECK, and there was no INSERT policy at all
-- (breaking client-side upsert(onConflict: id) which translates to INSERT ... ON CONFLICT).
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Add onboarding_complete column referenced by fetchUserProfile in useAuth.tsx.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;
