-- booking_contacts: Walk-in / manual booking contact info created by operators.
-- Decoupled from auth.users so operators can log walk-in or phone bookings
-- without requiring the customer to have a FOAM account.

CREATE TABLE IF NOT EXISTS public.booking_contacts (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  detailer_id     UUID         NOT NULL REFERENCES public.detailer_profiles(id) ON DELETE CASCADE,
  full_name       TEXT         NOT NULL,
  phone           TEXT,
  email           TEXT,
  vehicle_make    TEXT,
  vehicle_model   TEXT,
  vehicle_year    INTEGER,
  vehicle_color   TEXT,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE public.booking_contacts ENABLE ROW LEVEL SECURITY;

-- Operators can fully manage their own walk-in contacts.
CREATE POLICY "Operators manage own booking contacts"
  ON public.booking_contacts
  FOR ALL
  TO authenticated
  USING  (detailer_id IN (SELECT id FROM public.detailer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (detailer_id IN (SELECT id FROM public.detailer_profiles WHERE user_id = auth.uid()));

-- Add contact_id to bookings so a walk-in booking can reference a contact
-- rather than a registered user.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.booking_contacts(id) ON DELETE SET NULL;

-- Allow walk-in bookings that have no registered customer / vehicle.
-- customer_id and vehicle_id are now optional; at least one of
-- (customer_id, contact_id) must be provided (enforced at app layer).
ALTER TABLE public.bookings
  ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE public.bookings
  ALTER COLUMN vehicle_id DROP NOT NULL;
