-- Add default_commission_rate to detailer_profiles for operator-level commission settings
ALTER TABLE detailer_profiles
  ADD COLUMN IF NOT EXISTS default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 38;

-- Add tip_distribution preference
ALTER TABLE detailer_profiles
  ADD COLUMN IF NOT EXISTS tip_distribution TEXT NOT NULL DEFAULT 'assigned'
  CHECK (tip_distribution IN ('assigned', 'split_daily'));
