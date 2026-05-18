-- Add service_zip (was being inserted but column didn't exist).
-- Add water/electricity supply fields for mobile van bookings (nullable — null means not asked).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_zip TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS has_water_supply BOOLEAN DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS has_electricity_supply BOOLEAN DEFAULT NULL;
