-- Add default_commission_rate to detailer_profiles.
-- tip_distribution_model already exists (added by stripe migration); no new column needed.
ALTER TABLE detailer_profiles
  ADD COLUMN IF NOT EXISTS default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 38;

-- Crew time entries: tracks when a crew member clocked in/out on a booking.
-- Used as the primary source for payroll earnings calculation.
CREATE TABLE IF NOT EXISTS crew_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  detailer_id UUID NOT NULL REFERENCES detailer_profiles(id) ON DELETE CASCADE,
  clocked_in_at TIMESTAMPTZ,
  clocked_out_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crew_time_entries_booking_id_idx ON crew_time_entries(booking_id);
CREATE INDEX IF NOT EXISTS crew_time_entries_crew_member_id_idx ON crew_time_entries(crew_member_id);
CREATE INDEX IF NOT EXISTS crew_time_entries_detailer_id_idx ON crew_time_entries(detailer_id);

ALTER TABLE crew_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operators can manage their crew time entries"
  ON crew_time_entries FOR ALL
  USING (
    detailer_id IN (
      SELECT id FROM detailer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "crew can view their own time entries"
  ON crew_time_entries FOR SELECT
  USING (
    crew_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );
