-- ============================================================
-- vehicle_size_pricing
-- Stores per-vehicle-type price overrides (sedan) and
-- upcharges (suv, truck, van) for a service package.
--
-- Design notes:
--   • sedan  → price_adjustment holds the FULL sedan price
--   • suv / truck / van → price_adjustment is an UPCHARGE
--     added on top of service_packages.base_price
--   This matches the ServiceDrawer UI ("$" for sedan, "+$"
--   for the other types).
--
-- HOW TO APPLY:
--   1. Open the Supabase dashboard → SQL Editor → New query
--   2. Paste this file and click Run
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicle_size_pricing (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      UUID        NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  vehicle_type    TEXT        NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'truck', 'van')),
  price_adjustment NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (package_id, vehicle_type)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_size_pricing_package_id
  ON vehicle_size_pricing(package_id);

ALTER TABLE vehicle_size_pricing ENABLE ROW LEVEL SECURITY;

-- Operators can read and write pricing for packages they own.
CREATE POLICY "operators can manage vehicle size pricing"
  ON vehicle_size_pricing FOR ALL
  USING (
    package_id IN (
      SELECT sp.id
      FROM   service_packages sp
      JOIN   detailer_profiles dp ON dp.id = sp.detailer_id
      WHERE  dp.user_id = auth.uid()
    )
  );

-- Authenticated users (customers booking) can read pricing.
CREATE POLICY "authenticated users can view vehicle size pricing"
  ON vehicle_size_pricing FOR SELECT
  TO authenticated
  USING (true);
