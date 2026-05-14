-- lat/lng are not collected during onboarding; geocoding happens later
ALTER TABLE business_locations
  ALTER COLUMN lat DROP NOT NULL,
  ALTER COLUMN lng DROP NOT NULL;
