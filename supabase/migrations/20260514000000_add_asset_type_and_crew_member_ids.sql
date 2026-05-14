-- Add asset_type to business_assets (van/trailer/truck/other)
ALTER TABLE business_assets
  ADD COLUMN IF NOT EXISTS asset_type text NOT NULL DEFAULT 'van'
    CHECK (asset_type IN ('van', 'trailer', 'truck', 'other'));

-- Add crew_member_ids to business_locations
ALTER TABLE business_locations
  ADD COLUMN IF NOT EXISTS crew_member_ids uuid[] NOT NULL DEFAULT '{}';
