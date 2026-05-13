-- ============================================================
-- Fix: Infinite recursion in customer_profiles RLS policies
-- Error: code 42P17 — infinite recursion detected in policy
--        for relation "customer_profiles"
--
-- Root cause: one or more policies on customer_profiles
-- sub-select FROM customer_profiles itself (or call a helper
-- function that does), causing Postgres to evaluate the
-- policy recursively until the stack is exhausted.
--
-- Fix: drop every existing policy on customer_profiles and
-- replace with non-recursive equivalents that compare
-- user_id directly against auth.uid().
--
-- HOW TO APPLY:
--   1. Open the Supabase dashboard → SQL editor
--   2. Paste this entire file and run it
--   3. Verify with: SELECT policyname, cmd FROM pg_policies
--      WHERE tablename = 'customer_profiles';
-- ============================================================


-- ── Step 1: Drop all existing policies on customer_profiles ──
-- We iterate pg_policies at runtime so we don't need to know
-- the exact names that were created in earlier migrations.

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'customer_profiles'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.customer_profiles',
      pol.policyname
    );
  END LOOP;
END;
$$;


-- ── Step 2: Recreate correct, non-recursive policies ─────────

-- 2a. Customers: full control over their own row only.
--     USING / WITH CHECK both compare user_id directly against
--     auth.uid() — no sub-select into customer_profiles.
CREATE POLICY "customer_own_row"
  ON public.customer_profiles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK(user_id = auth.uid());


-- 2b. Operators: read-only access to customers who have a
--     booking with them. The sub-select goes through bookings
--     and detailer_profiles — never back into customer_profiles.
CREATE POLICY "operator_reads_booking_customers"
  ON public.customer_profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT b.customer_id
      FROM   public.bookings         b
      JOIN   public.detailer_profiles dp ON dp.id = b.detailer_id
      WHERE  dp.user_id = auth.uid()
    )
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('operator', 'manager')
  );


-- 2c. Superadmins: unrestricted access.
--     Role check goes to the users table, not customer_profiles.
CREATE POLICY "superadmin_all"
  ON public.customer_profiles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );


-- ── Step 3: Sanity check (informational, does not block) ─────
-- After running, verify the policies look right:
--
--   SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE tablename = 'customer_profiles'
--   ORDER BY policyname;
--
-- Expected rows:
--   customer_own_row               | ALL    | (user_id = auth.uid())
--   operator_reads_booking_customers | SELECT | (id IN (SELECT ...))
--   superadmin_all                 | ALL    | (role = 'superadmin')
