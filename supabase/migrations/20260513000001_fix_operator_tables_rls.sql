-- ============================================================
-- Fix: Missing / broken RLS policies on operator tables
--
-- Problem: Operators cannot save vans or locations during
-- onboarding. The build screen shows "Couldn't save vehicle /
-- location. Please try again." because three tables that the
-- onboarding flow writes to have no (or incorrect) RLS
-- policies, causing Supabase to deny all operations.
--
-- Affected tables and affected code paths:
--   1. detailer_profiles  — role-select.tsx upserts here on
--      operator role selection; build.tsx reads it to obtain
--      the detailer_id required for subsequent inserts.
--   2. business_assets    — build.tsx inserts / updates vans.
--   3. business_locations — build.tsx inserts / updates
--      locations.
--
-- Fix: drop every existing policy on each table (runtime loop,
-- no hard-coded names) and recreate correct, non-recursive
-- policies that follow the intent in DATA_MODEL.md.
--
-- HOW TO APPLY:
--   1. Open the Supabase dashboard → SQL editor
--   2. Paste this entire file and run it
--   3. Verify with:
--        SELECT tablename, policyname, cmd
--        FROM pg_policies
--        WHERE tablename IN (
--          'detailer_profiles','business_assets','business_locations'
--        )
--        ORDER BY tablename, policyname;
-- ============================================================


-- ── Helper: drop all policies on a given table ───────────────

DO $$
DECLARE
  pol record;
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'detailer_profiles',
    'business_assets',
    'business_locations'
  ]
  LOOP
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename  = tbl
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        pol.policyname,
        tbl
      );
    END LOOP;
  END LOOP;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- TABLE: detailer_profiles
-- ════════════════════════════════════════════════════════════

-- Operators: full control over their own profile row.
-- This is the key policy that lets:
--   • role-select.tsx upsert the row when "operator" is picked
--   • build.tsx SELECT the id via getDetailerProfileId()
CREATE POLICY "detailer_own_row"
  ON public.detailer_profiles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK(user_id = auth.uid());


-- Customers: read approved operators for discovery / booking.
-- No sub-select into detailer_profiles itself — just a column
-- check on approval_status.
CREATE POLICY "customer_reads_approved_detailers"
  ON public.detailer_profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    approval_status = 'approved'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'customer'
  );


-- Team members: read their own manager's profile.
-- Sub-select goes to team_members only — no recursion.
CREATE POLICY "team_member_reads_manager"
  ON public.detailer_profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT manager_id
      FROM   public.team_members
      WHERE  user_id   = auth.uid()
        AND  is_active = true
      LIMIT 1
    )
  );


-- Superadmins: unrestricted access.
CREATE POLICY "superadmin_all_detailer_profiles"
  ON public.detailer_profiles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );


-- ════════════════════════════════════════════════════════════
-- TABLE: business_assets  (vans, trailers, trucks)
-- ════════════════════════════════════════════════════════════

-- Operators: full control over assets that belong to them.
-- detailer_id is looked up via detailer_profiles — no
-- self-reference into business_assets.
CREATE POLICY "operator_own_assets"
  ON public.business_assets
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    detailer_id = (
      SELECT id FROM public.detailer_profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    detailer_id = (
      SELECT id FROM public.detailer_profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );


-- Superadmins: unrestricted access.
CREATE POLICY "superadmin_all_business_assets"
  ON public.business_assets
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );


-- ════════════════════════════════════════════════════════════
-- TABLE: business_locations  (fixed / hybrid shops)
-- ════════════════════════════════════════════════════════════

-- Operators: full control over locations that belong to them.
CREATE POLICY "operator_own_locations"
  ON public.business_locations
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    detailer_id = (
      SELECT id FROM public.detailer_profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    detailer_id = (
      SELECT id FROM public.detailer_profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );


-- Customers: read active locations for approved detailers.
-- Useful when customers browse fixed-location operators.
CREATE POLICY "customer_reads_active_locations"
  ON public.business_locations
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND detailer_id IN (
      SELECT id FROM public.detailer_profiles
      WHERE  approval_status = 'approved'
    )
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'customer'
  );


-- Superadmins: unrestricted access.
CREATE POLICY "superadmin_all_business_locations"
  ON public.business_locations
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
  );


-- ── Verification query (run manually after applying) ─────────
--
--   SELECT tablename, policyname, cmd, roles
--   FROM pg_policies
--   WHERE tablename IN (
--     'detailer_profiles','business_assets','business_locations'
--   )
--   ORDER BY tablename, policyname;
--
-- Expected rows:
--   detailer_profiles  | customer_reads_approved_detailers | SELECT
--   detailer_profiles  | detailer_own_row                  | ALL
--   detailer_profiles  | superadmin_all_detailer_profiles   | ALL
--   detailer_profiles  | team_member_reads_manager         | SELECT
--   business_assets    | operator_own_assets               | ALL
--   business_assets    | superadmin_all_business_assets    | ALL
--   business_locations | customer_reads_active_locations   | SELECT
--   business_locations | operator_own_locations            | ALL
--   business_locations | superadmin_all_business_locations | ALL
