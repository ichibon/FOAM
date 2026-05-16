-- Add asset_id and location_id to bookings.
-- Tracks which specific van/truck (business_assets) or physical shop
-- (business_locations) a booking was assigned to. Both are nullable;
-- a booking may have neither (unassigned) or exactly one.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.business_assets(id) ON DELETE SET NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.business_locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_asset_id    ON public.bookings(asset_id);
CREATE INDEX IF NOT EXISTS idx_bookings_location_id ON public.bookings(location_id);
