-- ============================================================
-- FOAM Stripe Integration Migration
-- Adds columns and tables required for the full Stripe Connect
-- payment flow (auth holds, capture, tips, cancellations, etc.)
-- ============================================================

-- ── detailer_profiles additions ────────────────────────────

ALTER TABLE detailer_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier         text        NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS platform_fee_override     decimal(6,4)         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS badge_verified            boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_verified_at      timestamptz          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS operator_cancel_strike_count integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS operator_flagged_at       timestamptz          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tip_distribution_model    text        NOT NULL DEFAULT 'assigned_crew',
  ADD COLUMN IF NOT EXISTS tip_crew_percentage       decimal(5,2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS tip_operator_percentage   decimal(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instant_payout_enabled    boolean     NOT NULL DEFAULT false;

-- ── payments additions ──────────────────────────────────────

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_customer_id        text                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id  text                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_method_type       text                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hold_re_auth_failed_at    timestamptz          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancellation_fee_amount   decimal(10,2)        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancellation_fee_tier     text                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancellation_initiated_by text                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instant_payout_requested  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instant_payout_fee        decimal(10,2)        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tip_payment_intent_id     text                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tip_payment_status        text                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS modification_intents      jsonb       NOT NULL DEFAULT '[]'::jsonb;

-- ── booking_crew ────────────────────────────────────────────
-- Links crew/team members to a booking and tracks tip share.

CREATE TABLE IF NOT EXISTS booking_crew (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  team_member_id  uuid        NOT NULL REFERENCES team_members(id),
  role            text        NOT NULL DEFAULT 'crew',   -- 'lead' | 'crew'
  tip_share       decimal(10,2) NOT NULL DEFAULT 0,
  tip_percentage  decimal(5,2)  NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_crew_booking_id     ON booking_crew(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_crew_team_member_id ON booking_crew(team_member_id);

-- ── booking_modifications ───────────────────────────────────
-- Tracks services added mid-job by crew. Each approved
-- modification gets its own Stripe PaymentIntent hold.

CREATE TABLE IF NOT EXISTS booking_modifications (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id               uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by             uuid        NOT NULL REFERENCES users(id),
  modification_type        text        NOT NULL,   -- 'service_added' | 'service_removed' | 'price_adjustment'
  description              text,
  original_price           decimal(10,2),
  new_price                decimal(10,2),
  status                   text        NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  stripe_payment_intent_id text,
  hold_amount              decimal(10,2),
  approved_at              timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_modifications_booking_id ON booking_modifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_status     ON booking_modifications(status);

-- ── detailer_subscriptions (ensure exists) ──────────────────
-- Already in data model; ensure subscription_tier sync trigger

CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE detailer_profiles
    SET subscription_tier = NEW.tier
    WHERE id = NEW.detailer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_subscription_tier ON detailer_subscriptions;
CREATE TRIGGER trg_sync_subscription_tier
  AFTER INSERT OR UPDATE ON detailer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_tier();
