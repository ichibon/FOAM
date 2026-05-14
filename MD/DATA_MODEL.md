# Data Model
**Version 1.5 — Updated May 2026**

Changes from v1.4 marked with `[v1.5]`
Changes from v1.3 marked with `[v1.4]`
Changes from v1.2 marked with `[v1.3]`
Changes from v1.1 marked with `[v1.2]`
Changes from v1.0 marked with `[v1.1]`

Built on Supabase (PostgreSQL 17). All tables use UUID primary keys. Row-level security enforced at the database layer via Supabase RLS policies. Role-based access enforced at both application and database layers.

**Migrations applied through v1.5:**
`002_security_fixes` → `003_revoke_rls` → `004_performance_fixes` → `005_final_policy_cleanup` → `v1_1_*` → `v1_3_multi_unit_*` → `v1_4_first_run_flags` → `v1_5_operator_approval_and_badges` → `v1_6_pay_models_tips_crew_payments` → `v1_7_payment_policy_columns` → `v1_8_subscription_tier` → `v1_9_foam_credit_rpc` → `v2_0_ops_review_ai_checklist` → `v2_0_customer_subscriptions` → `v2_0_events_and_campaigns` → `v2_0_superadmin_role` → `v2_0_security_fixes`

---

## Core Tables

### users
```sql
id                        uuid PRIMARY KEY DEFAULT gen_random_uuid()
email                     text UNIQUE NOT NULL
phone                     text
full_name                 text
avatar_url                text
role                      text NOT NULL
  -- 'customer' | 'operator' | 'manager' | 'team_member' | 'superadmin'
  -- superadmin: FOAM ops only — not exposed in the app
first_payment_celebrated      boolean DEFAULT false
  -- [v1.1] confetti trigger — fires once on operator's first received payment
first_run_today_seen          boolean DEFAULT false
first_run_bookings_seen       boolean DEFAULT false
first_run_customers_seen      boolean DEFAULT false
first_run_discover_seen       boolean DEFAULT false
first_run_vehicles_seen       boolean DEFAULT false
first_run_service_menu_seen   boolean DEFAULT false
first_run_earnings_seen       boolean DEFAULT false
first_run_team_seen           boolean DEFAULT false
created_at                timestamptz DEFAULT now()
updated_at                timestamptz DEFAULT now()
```

---

### detailer_profiles
The central operator record. Every operator type (mobile, fixed, hybrid) uses this table. RLS ensures operators only see their own record; superadmins see all.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES users(id)
business_name       text
bio                 text
operation_type      text NOT NULL DEFAULT 'mobile'
  -- 'mobile' | 'fixed' | 'hybrid'

-- Mobile operator fields
service_radius      integer          -- miles from home_base
home_base_lat       decimal
home_base_lng       decimal

-- Fixed location fields
location_address    text
location_lat        decimal
location_lng        decimal
location_hours      jsonb
  -- { mon: {open:'08:00',close:'18:00'}, tue: ..., sat: ..., sun: null }
bay_count           integer DEFAULT 1
accepts_walkins     boolean DEFAULT false

-- Multi-unit / fleet
is_multi_unit       boolean DEFAULT false  -- [v1.3] fleet or franchise operator

-- Stripe & payments
stripe_account_id   text
stripe_customer_id  text               -- Stripe Customer for subscription billing

-- Subscription (denormalized for edge function perf)
subscription_tier   text DEFAULT 'starter'
  -- [v1.3] 'starter' | 'pro' | 'crew'
  -- Kept in sync with detailer_subscriptions.tier via trigger
subscription_started_at   timestamptz
subscription_expires_at   timestamptz
platform_fee_override     decimal(5,2)
  -- [v1.3] NULL = use tier default. Set by FOAM ops for special cases.

-- Approval & onboarding [v1.5]
approval_status     text NOT NULL DEFAULT 'pending'
  -- 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmitted'
submitted_at        timestamptz
reviewed_at         timestamptz
reviewed_by         uuid REFERENCES users(id)   -- superadmin who actioned
approved_at         timestamptz
rejection_reasons   jsonb DEFAULT '[]'
  -- array of {reason, note, rejected_by, rejected_at}
resubmitted_at      timestamptz

-- Verification badges [v1.5]
badge_verified      boolean DEFAULT false
  -- Set true by Stripe identity verification (account.updated webhook)
badge_licensed      boolean DEFAULT false
  -- Set true when business_license_status = 'verified'
badge_insured       boolean DEFAULT false
  -- Set true when insurance_name_match = true and doc reviewed

-- Document storage [v1.5]
license_doc_url     text    -- Supabase Storage path: /{detailer_id}/license/
insurance_doc_url   text    -- Supabase Storage path: /{detailer_id}/insurance/
identity_verified_at timestamptz

-- AI review output [v1.4]
ai_review_score           decimal(4,3)
  -- Composite confidence score from operator-review-ai (0.000–1.000)
ai_flags                  jsonb NOT NULL DEFAULT '[]'
  -- [{type, severity, detail, field}] — structured flags from AI review
ai_auto_approve_eligible  boolean NOT NULL DEFAULT false
  -- true when all deterministic checks pass AND ai_review_score >= 0.85
ai_reviewed_at            timestamptz

-- Insurance document AI vision check [v1.4]
insurance_name_match      boolean
  -- null = not checked, true = name matches, false = mismatch
insurance_extracted_name  text
  -- Name as extracted from insurance certificate by Claude vision
insurance_checked_at      timestamptz

-- Background check [v1.4]
background_check_status   text NOT NULL DEFAULT 'not_started'
  -- 'not_started' | 'pending' | 'clear' | 'review_required' | 'failed'
  -- Initiated on Stripe Connect completion. Checkr webhook updates this.
background_check_id       text   -- Checkr report ID
background_check_completed_at timestamptz

-- Business license [v1.4]
business_license_status   text NOT NULL DEFAULT 'not_uploaded'
  -- 'not_uploaded' | 'uploaded' | 'verified'
business_license_verified_at timestamptz

-- Ops admin [v1.4]
ops_notes           jsonb NOT NULL DEFAULT '[]'
  -- [{note, added_by (uuid), added_at}] — internal FOAM ops notes
suspension_reason   text
suspended_at        timestamptz
suspended_by        uuid REFERENCES users(id)

-- Performance metrics
is_active           boolean DEFAULT true
is_verified         boolean DEFAULT false
avg_rating          decimal(3,2)
total_reviews       integer DEFAULT 0

-- Strike tracking [v1.1]
cancellation_count          integer DEFAULT 0
operator_cancel_strike_count integer DEFAULT 0
operator_flagged_at         timestamptz

-- Tip configuration [v1.6]
tip_collection_post_service boolean DEFAULT true
tip_collection_pre_set      boolean DEFAULT false
tip_collection_cash_logging boolean DEFAULT true
tips_disabled               boolean DEFAULT false
tip_distribution_model      text DEFAULT 'assigned_crew'
  -- 'assigned_crew' | 'operator' | 'split_equal_day' | 'split_percentage'
tip_crew_percentage         integer DEFAULT 100
tip_operator_percentage     integer DEFAULT 0

created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

**Subscription tier sync trigger:**
```sql
CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE detailer_profiles
    SET subscription_tier = NEW.tier
    WHERE id = NEW.detailer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON detailer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_tier();
```

---

### team_members
```sql
id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id                     uuid REFERENCES users(id) UNIQUE
manager_id                  uuid REFERENCES detailer_profiles(id)
display_name                text
team_role                   text NOT NULL DEFAULT 'member'
  -- 'manager' | 'member'
invite_status               text NOT NULL DEFAULT 'pending'
  -- 'invited' | 'pending' | 'approved' | 'declined'
invited_at                  timestamptz
approved_at                 timestamptz
declined_at                 timestamptz
declined_by                 uuid REFERENCES users(id)
invite_method               text
  -- 'email' | 'sms' | 'code'
is_active                   boolean DEFAULT true
can_view_customer_contact   boolean DEFAULT false
can_reschedule_jobs         boolean DEFAULT false
can_view_team_earnings      boolean DEFAULT false
commission_rate             decimal(5,2)
pay_model                   text DEFAULT 'commission'
  -- 'commission' | 'hourly' | 'flat_rate'
hourly_rate                 decimal(10,2)
flat_rate_amount            decimal(10,2)
flat_rate_period            text
  -- 'daily' | 'weekly'
created_at                  timestamptz DEFAULT now()
```

---

### customer_profiles
```sql
id                     uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id                uuid REFERENCES users(id) UNIQUE
stripe_customer_id     text
rain_protection_active boolean DEFAULT false
  -- Legacy: kept for backwards compat. Use customer_subscriptions going forward.
rain_protection_sub_id text
  -- Legacy: Stripe sub ID for original Rain Coverage sub
dispute_count          integer DEFAULT 0
  -- [v1.1] tracks dispute history for fraud detection
is_suspended           boolean DEFAULT false
  -- [v1.1] account suspension flag — set by FOAM ops
foam_credit            decimal(10,2) DEFAULT 0
  -- [v1.9] platform credit balance, applied at checkout
created_at             timestamptz DEFAULT now()
updated_at             timestamptz DEFAULT now()
```

---

### vehicles
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id     uuid REFERENCES customer_profiles(id)
make            text
model           text
year            integer
color           text
license_plate   text
  -- [v1.1] optional, shown on operator job screens
vehicle_type    text
  -- 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'other'
notes           text
is_default      boolean DEFAULT false
created_at      timestamptz DEFAULT now()
```

---

## Services & Pricing

### service_packages
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
name            text NOT NULL
description     text
duration_mins   integer NOT NULL
base_price      decimal(10,2) NOT NULL
is_active       boolean DEFAULT true
display_order   integer DEFAULT 0
created_at      timestamptz DEFAULT now()
```

### service_addons
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
name            text NOT NULL
description     text
price           decimal(10,2) NOT NULL
duration_mins   integer DEFAULT 0
is_active       boolean DEFAULT true
```

### vehicle_size_pricing
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
package_id       uuid REFERENCES service_packages(id)
vehicle_type     text   -- 'sedan' | 'suv' | 'truck' | 'van'
price_adjustment decimal(10,2)
```

---

## Bookings

### bookings
```sql
id                        uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id               uuid REFERENCES customer_profiles(id)
detailer_id               uuid REFERENCES detailer_profiles(id)
team_member_id            uuid REFERENCES team_members(id)
crew_member_id            uuid REFERENCES team_members(id)
  -- legacy single crew assignment; booking_crew table preferred
vehicle_id                uuid REFERENCES vehicles(id)
package_id                uuid REFERENCES service_packages(id)
service_type              text NOT NULL DEFAULT 'mobile'
  -- 'mobile' | 'fixed'
status                    text NOT NULL DEFAULT 'requested'
  -- 'requested' | 'confirmed' | 'in_progress' | 'completed'
  -- | 'partially_completed' | 'cancelled' | 'no_show'
scheduled_at              timestamptz NOT NULL
estimated_duration_mins   integer
service_address           text
service_lat               decimal
service_lng               decimal
bay_number                integer   -- fixed location bay assignment
location_id               uuid REFERENCES business_locations(id)
asset_id                  uuid REFERENCES business_assets(id)
subtotal                  decimal(10,2)
platform_fee              decimal(10,2)
tip_amount                decimal(10,2) DEFAULT 0
total                     decimal(10,2)
notes                     text
is_recurring              boolean DEFAULT false
recurrence_rule           text
  -- 'weekly' | 'biweekly' | 'monthly'
parent_booking_id         uuid REFERENCES bookings(id)
  -- links recurring instances to parent booking
cancellation_policy       text DEFAULT 'standard'
  -- 'flexible' | 'standard' | 'strict'
cancelled_by              uuid REFERENCES users(id)
cancelled_at              timestamptz
cancellation_reason       text
no_show_reported_at       timestamptz
submitted_by              uuid REFERENCES users(id)
submitted_by_role         text
  -- 'operator' | 'team_member'
reschedule_count          integer DEFAULT 0
  -- [v1.2] increments each reschedule (max 2)
operator_reschedule_count integer DEFAULT 0
  -- [v1.2] operator-initiated reschedule counter
original_scheduled_at     timestamptz
  -- [v1.2] preserves original appointment time
last_rescheduled_at       timestamptz
last_rescheduled_by       uuid REFERENCES users(id)
created_at                timestamptz DEFAULT now()
updated_at                timestamptz DEFAULT now()
```

### booking_vehicles [v1.1]
Multi-vehicle bookings — one row per vehicle per booking.
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id       uuid REFERENCES bookings(id)
vehicle_id       uuid REFERENCES vehicles(id)
status           text DEFAULT 'pending'
  -- 'pending' | 'completed' | 'no_show' | 'skipped'
subtotal         decimal(10,2)
no_show_fee      decimal(10,2) DEFAULT 0
completion_notes text
created_at       timestamptz DEFAULT now()
```

### booking_vehicle_services [v1.1]
Services applied per vehicle in a multi-vehicle booking.
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_vehicle_id  uuid REFERENCES booking_vehicles(id)
package_id          uuid REFERENCES service_packages(id)
price               decimal(10,2)
duration_mins       integer
status              text DEFAULT 'pending'
  -- 'pending' | 'completed' | 'skipped'
skip_reason         text
  -- 'time_constraint' | 'customer_requested' | 'vehicle_condition' | 'access_issue'
created_at          timestamptz DEFAULT now()
```

### booking_addons
Add-ons applied to a booking.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id  uuid REFERENCES bookings(id)
addon_id    uuid REFERENCES service_addons(id)
price       decimal(10,2)
```

### booking_crew
Crew member assignments per booking (supports multi-crew jobs).
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id  uuid REFERENCES bookings(id)
crew_id     uuid REFERENCES team_members(id)
role        text DEFAULT 'crew'
  -- 'lead' | 'crew'
tip_share   decimal(10,2)
created_at  timestamptz DEFAULT now()
```

### booking_photos [v1.1]
Before/after/damage photos linked to a booking and specific vehicle.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id  uuid REFERENCES bookings(id)
vehicle_id  uuid REFERENCES vehicles(id)
  -- [v1.1] links photo to specific vehicle in multi-vehicle bookings
photo_url   text NOT NULL
photo_type  text   -- 'before' | 'after' | 'damage'
uploaded_by uuid REFERENCES users(id)
created_at  timestamptz DEFAULT now()
```

### booking_modifications [v1.2]
Field-level service changes by crew during a job. Requires manager approval.
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id          uuid REFERENCES bookings(id)
booking_vehicle_id  uuid REFERENCES booking_vehicles(id)
modified_by         uuid REFERENCES users(id)
modification_type   text NOT NULL   -- 'service_added' | 'service_removed'
service_id          uuid REFERENCES service_packages(id)
original_price      decimal(10,2)
new_price           decimal(10,2)
reason              text
  -- required for removals: 'customer_requested' | 'vehicle_condition'
  -- | 'time_constraint' | 'access_issue'
status              text NOT NULL DEFAULT 'pending'
  -- 'pending' | 'approved' | 'auto_approved' | 'rejected'
approved_by         uuid REFERENCES users(id)
approved_at         timestamptz
auto_approve_at     timestamptz   -- created_at + 5 minutes
rejection_reason    text
stripe_payment_intent_id text
hold_amount         decimal(10,2)
hold_captured       boolean DEFAULT false
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

---

## Payments

### payments
```sql
id                        uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id                uuid REFERENCES bookings(id) UNIQUE
stripe_payment_intent_id  text UNIQUE
amount                    decimal(10,2)
hold_amount               decimal(10,2)
hold_placed_at            timestamptz
hold_expires_at           timestamptz
capture_amount            decimal(10,2)
stripe_capture_method     text DEFAULT 'manual'
platform_fee              decimal(10,2)
payout_amount             decimal(10,2)
tip_amount                decimal(10,2) DEFAULT 0
tip_payment_intent_id     text
tip_payment_status        text
  -- 'pending' | 'captured' | 'failed' | 'waived'
tip_model                 text
  -- 'post_service' | 'pre_set' | 'cash' | 'none'
status                    text DEFAULT 'pending'
  -- 'authorized' | 'pending' | 'captured' | 'paid_out'
  -- | 'refunded' | 'failed' | 'hold_expired' | 'cancelled' | 'disputed'
payment_method_type       text
  -- 'card' | 'apple_pay' | 'google_pay' | 'cashapp' | 'bank_transfer'
modification_intents      jsonb DEFAULT '[]'
  -- [v1.2] [{modification_id, payment_intent_id, amount, captured}]
cancellation_fee_amount   decimal(10,2)
cancellation_fee_tier     text   -- 'free' | 'twenty_five' | 'fifty' | 'no_show'
cancellation_initiated_by text   -- 'customer' | 'operator' | 'foam' | 'system'
cancelled_at              timestamptz
cancellation_reason       text
instant_payout_requested  boolean DEFAULT false
instant_payout_fee        decimal(10,2)
dispute_opened_at         timestamptz
dispute_resolved_at       timestamptz
dispute_outcome           text   -- 'won' | 'lost'
created_at                timestamptz DEFAULT now()
updated_at                timestamptz DEFAULT now()
```

### payouts
Operator payout records, linked to Stripe Transfer.
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id         uuid REFERENCES detailer_profiles(id)
stripe_payout_id    text
amount              decimal(10,2)
period_start        timestamptz
period_end          timestamptz
status              text DEFAULT 'pending'   -- 'pending' | 'paid' | 'failed'
created_at          timestamptz DEFAULT now()
```

### cash_tips [v1.6]
In-person cash tips logged by operator/crew for record-keeping.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id  uuid REFERENCES bookings(id)
crew_id     uuid REFERENCES team_members(id)
amount      decimal(10,2)
logged_by   uuid REFERENCES users(id)
note        text
created_at  timestamptz DEFAULT now()
```

---

## Reviews

### reviews
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id  uuid REFERENCES bookings(id) UNIQUE
customer_id uuid REFERENCES customer_profiles(id)
detailer_id uuid REFERENCES detailer_profiles(id)
rating      integer NOT NULL   -- 1–5
body        text
tags        text[] DEFAULT '{}'
created_at  timestamptz DEFAULT now()
```

---

## Fixed Location & Fleet Infrastructure [v1.3, updated v1.5]

### business_locations
Physical shop and car wash locations for fixed and hybrid operators.
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid NOT NULL REFERENCES detailer_profiles(id)
name            text NOT NULL
address         text NOT NULL
lat             decimal NOT NULL
lng             decimal NOT NULL
bay_count       integer DEFAULT 1
accepts_walkins boolean DEFAULT false
hours           jsonb DEFAULT '{}'
  -- { mon: {open:'08:00',close:'18:00'}, tue: ..., sun: null }
phone           text
is_active       boolean DEFAULT true
display_order   integer DEFAULT 0
avg_rating      decimal
total_reviews   integer DEFAULT 0
crew_member_ids uuid[] DEFAULT '{}'
  -- [v1.5] array of team_member IDs assigned to this location
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### business_assets [v1.5]
Mobile units (vans, trailers, trucks) owned by the operator. Each asset is a bookable unit on the marketplace.
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id          uuid NOT NULL REFERENCES detailer_profiles(id)
asset_type           text NOT NULL DEFAULT 'van'
  -- 'van' | 'trailer' | 'truck' | 'other'
name                 text NOT NULL
license_plate        text
home_base_lat        decimal DEFAULT 0
home_base_lng        decimal DEFAULT 0
service_radius_miles integer DEFAULT 15
service_zone_geojson jsonb
  -- optional custom polygon override for service zone
primary_crew_id      uuid REFERENCES team_members(id)
  -- default crew member assigned to this asset
equipment_notes      text
is_active            boolean DEFAULT true
display_order        integer DEFAULT 0
created_at           timestamptz DEFAULT now()
updated_at           timestamptz DEFAULT now()
```

### asset_crew_assignments
Which crew member is assigned to which asset on a given day.
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
asset_id       uuid REFERENCES business_assets(id)
crew_id        uuid REFERENCES team_members(id)
assigned_date  date
is_primary     boolean DEFAULT false
created_at     timestamptz DEFAULT now()
```

### fixed_location_slots
Time slots for fixed location bay bookings.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id uuid REFERENCES detailer_profiles(id)
slot_date   date NOT NULL
slot_time   time NOT NULL
bay_number  integer DEFAULT 1
status      text DEFAULT 'available'
  -- 'available' | 'booked' | 'blocked'
booking_id  uuid REFERENCES bookings(id)
created_at  timestamptz DEFAULT now()
```

---

## Crew Payroll [v1.6]

### crew_time_entries
Clock-in/out records for crew members.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
crew_id      uuid REFERENCES team_members(id)
booking_id   uuid REFERENCES bookings(id)
clock_in     timestamptz NOT NULL
clock_out    timestamptz
hours_worked decimal
date         date NOT NULL
notes        text
created_at   timestamptz DEFAULT now()
```

### crew_manual_payments
Manual payroll adjustments outside of job-based commission.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
crew_id     uuid REFERENCES team_members(id)
detailer_id uuid REFERENCES detailer_profiles(id)
amount      decimal(10,2)
reason      text
paid_at     timestamptz
created_by  uuid REFERENCES users(id)
created_at  timestamptz DEFAULT now()
```

---

## Subscriptions

### detailer_subscriptions
Operator tier subscriptions (Starter/Pro/Crew). Normalized source of truth.
```sql
id                     uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id            uuid REFERENCES detailer_profiles(id)
stripe_subscription_id text
tier                   text   -- 'starter' | 'pro' | 'crew'
status                 text   -- 'active' | 'past_due' | 'cancelled'
current_period_start   timestamptz
current_period_end     timestamptz
created_at             timestamptz DEFAULT now()
```

**Note:** `detailer_subscriptions.tier` is the source of truth. `detailer_profiles.subscription_tier` is a denormalized copy synced via trigger for performant edge function fee lookups.

### subscription_products [v1.4]
Consumer subscription product catalog. Managed by FOAM ops superadmins.
```sql
id                       uuid PRIMARY KEY DEFAULT gen_random_uuid()
name                     text NOT NULL          -- 'Rain Coverage' | 'FOAM+'
slug                     text NOT NULL UNIQUE   -- 'rain-coverage' | 'foam-plus'
description              text
monthly_price            decimal(10,2) NOT NULL
annual_price             decimal(10,2) NOT NULL
status                   text NOT NULL DEFAULT 'draft'
  -- 'draft' | 'active' | 'deprecated'
stripe_monthly_price_id  text
stripe_annual_price_id   text
created_at               timestamptz DEFAULT now()
updated_at               timestamptz DEFAULT now()
```

**Seeded at launch:**
- Rain Coverage: $7.99/month, $69.99/year, status: draft (V2 launch)
- FOAM+: $14.99/month, $129.99/year, status: draft (V2 launch)

### customer_subscriptions [v1.4]
Per-customer subscription records. One record per product per customer.
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id             uuid NOT NULL REFERENCES customer_profiles(id)
product_id              uuid NOT NULL REFERENCES subscription_products(id)
stripe_subscription_id  text UNIQUE
stripe_customer_id      text
plan                    text NOT NULL DEFAULT 'monthly'
  -- 'monthly' | 'annual'
status                  text NOT NULL DEFAULT 'active'
  -- 'active' | 'paused' | 'cancelled' | 'trial' | 'past_due'
trial_ends_at           timestamptz
current_period_start    timestamptz
current_period_end      timestamptz
cancelled_at            timestamptz
cancellation_reason     text
cancelled_by            text   -- 'customer' | 'ops' | 'system'
paused_at               timestamptz
paused_by               text   -- 'customer' | 'ops' | 'system'
foam_credit_issued      decimal(10,2) DEFAULT 0
  -- total credits issued against this subscription
ops_notes               jsonb NOT NULL DEFAULT '[]'
  -- [{note, added_by, added_at}]
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()
UNIQUE (customer_id, product_id)
```

---

## Rain Protection

### rain_protection_claims
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id           uuid REFERENCES customer_profiles(id)
booking_id            uuid REFERENCES bookings(id)
rain_detected_at      timestamptz
precipitation_inches  decimal(5,3)
zip_code              text
claim_status          text   -- 'triggered' | 'redeemed' | 'expired'
redemption_booking_id uuid REFERENCES bookings(id)
expires_at            timestamptz
created_at            timestamptz DEFAULT now()
```

---

## Events & Campaigns [v1.4]

### events
Community washes, fundraisers, platform campaigns, general events.
```sql
id                            uuid PRIMARY KEY DEFAULT gen_random_uuid()
title                         text NOT NULL
slug                          text UNIQUE
event_type                    text NOT NULL DEFAULT 'general'
  -- 'community_wash' | 'fundraiser' | 'campaign' | 'general'
status                        text NOT NULL DEFAULT 'draft'
  -- 'draft' | 'published' | 'live' | 'completed' | 'cancelled'
description                   text
event_date                    date
start_time                    time
end_time                      time
is_all_day                    boolean DEFAULT false
location_name                 text
location_address              text
location_lat                  decimal
location_lng                  decimal
is_virtual                    boolean DEFAULT false
  -- true for platform-wide campaigns with no physical location
capacity                      integer DEFAULT 0   -- 0 = unlimited
registered_count              integer DEFAULT 0   -- denormalized
operator_participation        text NOT NULL DEFAULT 'none'
  -- 'none' (FOAM-run only) | 'open' | 'invite'
operator_signup_count         integer DEFAULT 0   -- denormalized
fundraiser_goal               decimal(10,2)
fundraiser_raised             decimal(10,2) DEFAULT 0
fundraiser_price_per_vehicle  decimal(10,2)
campaign_discount_pct         integer
campaign_service_ids          jsonb   -- array of service_package IDs
published_at                  timestamptz
starts_at                     timestamptz
completed_at                  timestamptz
cancelled_at                  timestamptz
cancellation_reason           text
created_by                    uuid REFERENCES users(id)
updated_by                    uuid REFERENCES users(id)
created_at                    timestamptz DEFAULT now()
updated_at                    timestamptz DEFAULT now()
```

### event_operator_signups [v1.4]
Operator participation in events (when operator_participation ≠ 'none').
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE
detailer_id   uuid NOT NULL REFERENCES detailer_profiles(id)
status        text NOT NULL DEFAULT 'pending'
  -- 'pending' | 'confirmed' | 'declined' | 'cancelled'
confirmed_at  timestamptz
notes         text
created_at    timestamptz DEFAULT now()
UNIQUE (event_id, detailer_id)
```

---

## Ops Administration [v1.4]

### ops_audit_log
Immutable audit trail of every FOAM ops superadmin action.
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
performed_by  uuid NOT NULL REFERENCES users(id)
  -- superadmin user who performed the action
action        text NOT NULL
  -- 'operator_approved' | 'operator_rejected' | 'operator_suspended'
  -- | 'operator_reactivated' | 'strike_cleared' | 'fee_override_set'
  -- | 'fee_override_removed' | 'subscription_cancelled' | 'subscription_paused'
  -- | 'subscription_resumed' | 'credit_issued' | 'customer_suspended'
  -- | 'customer_reactivated' | 'dispute_evidence_submitted' | 'payout_released'
  -- | 'event_published' | 'event_cancelled'
target_type   text NOT NULL
  -- 'detailer_profile' | 'customer_profile' | 'booking'
  -- | 'payment' | 'subscription' | 'event'
target_id     uuid NOT NULL
payload       jsonb NOT NULL DEFAULT '{}'
  -- {reason, previous_value, new_value, amount, note}
ip_address    inet
created_at    timestamptz DEFAULT now()
```

**RLS:** Superadmins only. No update or delete policies — append-only by design.

---

## CRM & Customer Retention (V2)

### customer_notes
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id uuid REFERENCES detailer_profiles(id)
customer_id uuid REFERENCES customer_profiles(id)
note        text
created_at  timestamptz DEFAULT now()
```

### lapsed_customer_queue
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id      uuid REFERENCES detailer_profiles(id)
customer_id      uuid REFERENCES customer_profiles(id)
last_booking_at  timestamptz
days_since_last  integer
outreach_sent_at timestamptz
created_at       timestamptz DEFAULT now()
```

---

## Inventory (V2)

### inventory_items
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id         uuid REFERENCES detailer_profiles(id)
name                text NOT NULL
unit                text   -- 'oz' | 'gallon' | 'count' | 'bottle'
current_qty         decimal(10,2)
low_stock_threshold decimal(10,2)
cost_per_unit       decimal(10,2)
created_at          timestamptz DEFAULT now()
```

---

## Views (SECURITY INVOKER)

### booking_summary
Fast read view for booking + payment status. Uses SECURITY INVOKER — RLS of the querying user is enforced.
```sql
SELECT b.id, b.customer_id, b.detailer_id, b.status, b.scheduled_at,
       b.service_type, b.estimated_duration_mins, b.service_address,
       b.created_at, p.amount, p.platform_fee, p.payout_amount,
       p.status AS payment_status
FROM bookings b LEFT JOIN payments p ON p.booking_id = b.id
```

### detailer_summary
Lightweight operator view for discovery and ops queue. Uses SECURITY INVOKER.
```sql
SELECT dp.id, dp.user_id, dp.business_name, dp.operation_type,
       dp.approval_status, dp.subscription_tier, dp.badge_verified,
       dp.avg_rating, dp.total_reviews, dp.is_active, dp.created_at
FROM detailer_profiles dp
```

---

## Key Relationships [v1.5]
```
users (1) ──── (1) detailer_profiles
users (1) ──── (1) customer_profiles
users (1) ──── (1) team_members

detailer_profiles (1) ──── (many) team_members
detailer_profiles (1) ──── (many) service_packages
detailer_profiles (1) ──── (1) detailer_subscriptions
detailer_profiles (1) ──── (many) business_locations      [v1.3]
detailer_profiles (1) ──── (many) business_assets         [v1.3]

business_assets (1) ──── (many) asset_crew_assignments    [v1.3]
business_assets (many) ──── (1) team_members (primary_crew_id) [v1.5]

customer_profiles (1) ──── (many) vehicles
customer_profiles (1) ──── (many) customer_subscriptions  [v1.4]

subscription_products (1) ──── (many) customer_subscriptions  [v1.4]

bookings (many) ──── (1) customer_profiles
bookings (many) ──── (1) detailer_profiles
bookings (many) ──── (1) business_locations
bookings (many) ──── (1) business_assets
bookings (1) ──── (many) booking_vehicles           [v1.1]
bookings (1) ──── (many) booking_addons
bookings (1) ──── (many) booking_crew
booking_vehicles (1) ──── (many) booking_vehicle_services  [v1.1]
booking_vehicles (1) ──── (many) booking_photos     [v1.1]
bookings (1) ──── (many) booking_modifications      [v1.2]
bookings (1) ──── (1) reviews
bookings (1) ──── (1) payments

events (1) ──── (many) event_operator_signups        [v1.4]
ops_audit_log (many) ──── (1) users (performed_by)   [v1.4]
```

---

## RLS Policy Summary

| Table | Customer | Operator | Team Member | Superadmin |
|-------|----------|----------|-------------|------------|
| users | own row | own row | own row | all rows |
| detailer_profiles | read approved only | own row | manager's profile | all rows |
| customer_profiles | own row | bookings only | — | all rows |
| bookings | own bookings | assigned bookings | assigned jobs | all rows |
| payments | own bookings | own bookings | — | all rows |
| business_locations | — | own rows | — | all rows |
| business_assets | — | own rows | — | all rows |
| customer_subscriptions | own rows | — | — | all rows |
| subscription_products | active only | active only | active only | all rows |
| events | published/live | published/live | published/live | all rows |
| ops_audit_log | — | — | — | all rows |

---

*Last updated: May 2026 (v1.5). Schema verified against live Supabase instance. Cross-reference ARCHITECTURE.md for edge functions, PAYMENT_POLICY.md for fee logic, CAPABILITY_LAYER.md for system integrations.*
