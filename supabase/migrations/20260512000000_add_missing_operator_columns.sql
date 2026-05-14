-- ============================================================
-- Record: Add missing columns to business_assets and
--         business_locations
--
-- Context:
--   The live Supabase database had these tables already but
--   they were created without the columns the app code expects.
--   The columns were added directly to the live DB to unblock
--   operator onboarding (PGRST204 errors on insert/update).
--   This migration records those additions so any new
--   environment (staging, fresh project) can be brought to
--   the same state by running it through the SQL editor.
--
-- Affected code:
--   app/onboarding/operator/build.tsx — handleSaveVan inserts
--   asset_type; handleSaveLocation inserts crew_member_ids.
--
-- HOW TO APPLY:
--   1. Open the Supabase dashboard → SQL editor
--   2. Paste this entire file and run it
--   3. NOTE: the live production database already has these
--      columns — running this there is safe (IF NOT EXISTS)
--      but will produce no visible change.
--   4. Run order with other migrations:
--        20260512000000_add_missing_operator_columns.sql  ← THIS FILE (run first)
--        20260513000000_fix_customer_profiles_rls.sql
--        20260513000001_fix_operator_tables_rls.sql       (run last)
-- ============================================================


-- ── business_assets: add asset_type ──────────────────────────
-- The app stores whether the unit is a van, trailer, truck,
-- or other. A CHECK constraint mirrors the discriminated union
-- used in the TypeScript types.

ALTER TABLE public.business_assets
  ADD COLUMN IF NOT EXISTS asset_type text
    DEFAULT 'van'
    CHECK (asset_type IN ('van', 'trailer', 'truck', 'other'));


-- ── business_locations: add crew_member_ids ──────────────────
-- Array of team_member UUIDs assigned to this location.
-- The app inserts an empty array on creation and updates it
-- from the Assign Crew step and the location edit drawer.
-- Stored as uuid[] (native Postgres array) matching the
-- direct column addition made to the live DB.

ALTER TABLE public.business_locations
  ADD COLUMN IF NOT EXISTS crew_member_ids uuid[]
    DEFAULT '{}';


-- ── Verification query (run manually after applying) ─────────
--
--   SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name   IN ('business_assets', 'business_locations')
--     AND column_name  IN ('asset_type', 'crew_member_ids')
--   ORDER BY table_name, column_name;
--
-- Expected rows:
--   business_assets    | asset_type      | text  | 'van'  | YES
--   business_locations | crew_member_ids | ARRAY | '{}'   | YES
