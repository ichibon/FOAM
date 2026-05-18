-- Add missing service_zip column (was being inserted but column didn't exist,
-- causing silent booking insert failures).
-- Also add water/electricity supply fields for mobile van bookings.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_zip TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS has_water_supply BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS has_electricity_supply BOOLEAN NOT NULL DEFAULT FALSE;
