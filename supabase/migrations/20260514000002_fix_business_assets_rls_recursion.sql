-- business_assets SELECT policies referenced asset_crew_assignments, whose own
-- SELECT policies referenced business_assets back — causing infinite recursion
-- on any INSERT/SELECT against business_assets.
--
-- Fix: security definer function fetches asset IDs without triggering RLS,
-- breaking the cycle for all asset_crew_assignments owner policies.

CREATE OR REPLACE FUNCTION get_my_business_asset_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ba.id
  FROM business_assets ba
  JOIN detailer_profiles dp ON dp.id = ba.detailer_id
  WHERE dp.user_id = auth.uid()
$$;

DROP POLICY IF EXISTS asset_crew_assignments_select_owner ON asset_crew_assignments;
CREATE POLICY asset_crew_assignments_select_owner ON asset_crew_assignments
  FOR SELECT USING (asset_id IN (SELECT get_my_business_asset_ids()));

DROP POLICY IF EXISTS asset_crew_assignments_insert_owner ON asset_crew_assignments;
CREATE POLICY asset_crew_assignments_insert_owner ON asset_crew_assignments
  FOR INSERT WITH CHECK (asset_id IN (SELECT get_my_business_asset_ids()));

DROP POLICY IF EXISTS asset_crew_assignments_update_owner ON asset_crew_assignments;
CREATE POLICY asset_crew_assignments_update_owner ON asset_crew_assignments
  FOR UPDATE USING (asset_id IN (SELECT get_my_business_asset_ids()));

DROP POLICY IF EXISTS asset_crew_assignments_delete_owner ON asset_crew_assignments;
CREATE POLICY asset_crew_assignments_delete_owner ON asset_crew_assignments
  FOR DELETE USING (asset_id IN (SELECT get_my_business_asset_ids()));
