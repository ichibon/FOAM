-- ============================================================
-- Fix: Infinite recursion in bookings RLS policies (42P17)
--
-- Root cause: the existing bookings policies reference
-- customer_profiles, while customer_profiles has
-- "operator_reads_booking_customers" which references bookings
-- — creating a circular dependency that Postgres detects as
-- infinite recursion, particularly on walk-in INSERT where
-- customer_id is NULL.
--
-- Fix: drop every existing policy on bookings and replace with
-- non-recursive equivalents that never join back through
-- customer_profiles. bookings.customer_id is a direct FK to
-- users.id, so customer access can be expressed as a simple
-- column comparison against auth.uid().
--
-- HOW TO APPLY:
--   1. Open the Supabase dashboard → SQL editor → New query
--   2. Paste this entire file and click Run
-- ============================================================


-- ── Step 1: Drop all existing policies on bookings ───────────

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'bookings'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.bookings',
      pol.policyname
    );
  END LOOP;
END;
$$;


-- ── Step 2: Recreate correct, non-recursive policies ─────────

-- 2a. Operators: full control over all bookings for their account.
--     detailer_id → detailer_profiles only. No join through customer_profiles.
CREATE POLICY "operator_manages_own_bookings"
  ON public.bookings
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    detailer_id IN (
      SELECT id FROM public.detailer_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    detailer_id IN (
      SELECT id FROM public.detailer_profiles WHERE user_id = auth.uid()
    )
  );


-- 2b. Customers: read their own bookings.
--     bookings.customer_id is a direct FK to users.id, so auth.uid()
--     comparison is safe with no sub-select into customer_profiles.
CREATE POLICY "customer_reads_own_bookings"
  ON public.bookings
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
  );


-- 2c. Crew / team members: read bookings belonging to their operator.
--     Joins through team_members only — no recursion.
CREATE POLICY "crew_reads_operator_bookings"
  ON public.bookings
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    detailer_id IN (
      SELECT manager_id
      FROM   public.team_members
      WHERE  user_id   = auth.uid()
        AND  is_active = true
    )
  );


-- 2d. Superadmins: unrestricted access.
CREATE POLICY "superadmin_all_bookings"
  ON public.bookings
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );


-- ── Step 3: Verification query (run manually after applying) ──
--
--   SELECT policyname, cmd
--   FROM pg_policies
--   WHERE tablename = 'bookings'
--   ORDER BY policyname;
--
-- Expected:
--   crew_reads_operator_bookings  | SELECT
--   customer_reads_own_bookings   | SELECT
--   operator_manages_own_bookings | ALL
--   superadmin_all_bookings       | ALL
