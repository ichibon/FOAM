-- Links an add-on service package to the regular service packages it can be applied to
CREATE TABLE IF NOT EXISTS service_addon_targets (
  addon_id   UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  PRIMARY KEY (addon_id, service_id)
);

ALTER TABLE service_addon_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators manage their addon targets"
  ON service_addon_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM service_packages sp
      JOIN detailer_profiles dp ON dp.id = sp.detailer_id
      WHERE sp.id = service_addon_targets.addon_id AND dp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_packages sp
      JOIN detailer_profiles dp ON dp.id = sp.detailer_id
      WHERE sp.id = service_addon_targets.addon_id AND dp.user_id = auth.uid()
    )
  );
