-- ============================================================
-- v2.1 — Role model: manager removal + has_team gating
--
-- Context (ARCHITECTURE.md v1.4 / DATA_MODEL.md v1.5):
--   'manager' is no longer a separate JWT role. Every operator
--   who manages a team is still role: 'operator'. The team
--   management UI layer activates when
--   detailer_profiles.has_team = true.
--
-- Changes:
--   1. Add has_team boolean to detailer_profiles (DEFAULT false)
--   2. Add trigger: set has_team = true when first active
--      team_member is inserted for an operator; false when last
--      active member is removed or deactivated.
--
-- HOW TO APPLY:
--   1. Open the Supabase dashboard → SQL editor
--   2. Paste this entire file and run it
--   3. Safe to run multiple times (IF NOT EXISTS / OR REPLACE)
--
-- Run order:
--   ...20260515000001_add_metadata_to_business_assets.sql
--   20260515000002_v2_1_role_model_manager_removal.sql  ← THIS
-- ============================================================


-- ── 1. Add has_team to detailer_profiles ─────────────────────

ALTER TABLE public.detailer_profiles
  ADD COLUMN IF NOT EXISTS has_team boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.detailer_profiles.has_team IS
  'true when operator has at least one active team member. '
  'Unlocks Team Tab in bottom nav and command center view on Today Tab. '
  'Managed automatically by the sync_has_team trigger.';


-- ── 2. Trigger function: sync has_team on team_members change ─

CREATE OR REPLACE FUNCTION public.sync_has_team()
RETURNS TRIGGER AS $$
DECLARE
  v_detailer_id uuid;
  v_active_count integer;
BEGIN
  -- Determine which detailer_profiles row to update
  IF TG_OP = 'DELETE' THEN
    v_detailer_id := OLD.manager_id;
  ELSE
    v_detailer_id := NEW.manager_id;
  END IF;

  -- Count active team members for this operator
  SELECT COUNT(*)
    INTO v_active_count
    FROM public.team_members
   WHERE manager_id = v_detailer_id
     AND is_active = true;

  -- Sync has_team on the operator's profile
  UPDATE public.detailer_profiles
     SET has_team = (v_active_count > 0),
         updated_at = now()
   WHERE id = v_detailer_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. Attach trigger to team_members ────────────────────────

DROP TRIGGER IF EXISTS on_team_member_change ON public.team_members;

CREATE TRIGGER on_team_member_change
  AFTER INSERT OR UPDATE OF is_active OR DELETE
  ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_has_team();


-- ── 4. Back-fill: set has_team for operators who already have ─
--       active team members in the database

UPDATE public.detailer_profiles dp
   SET has_team = true,
       updated_at = now()
 WHERE EXISTS (
   SELECT 1
     FROM public.team_members tm
    WHERE tm.manager_id = dp.id
      AND tm.is_active = true
 );


-- ── Verification query (run manually after applying) ─────────
--
--   SELECT id, business_name, has_team
--     FROM public.detailer_profiles
--    ORDER BY has_team DESC, business_name
--    LIMIT 20;
--
--   SELECT trigger_name, event_manipulation, event_object_table
--     FROM information_schema.triggers
--    WHERE trigger_name = 'on_team_member_change';
