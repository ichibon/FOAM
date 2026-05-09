# Data Model
**Version 1.3 — Updated May 9, 2026**
Changes from v1.2 marked with `[v1.3]`
Changes from v1.1 marked with `[v1.2]`
Changes from v1.0 marked with `[v1.1]`

Built on Supabase (PostgreSQL). All tables use UUID primary keys. Row-level security enforced via Supabase RLS policies. Role-based access control enforced at the application and database layer.

---

## Core Tables

### users
```sql
id                        uuid PRIMARY KEY DEFAULT gen_random_uuid()
email                     text UNIQUE NOT NULL
phone                     text
full_name                 text
avatar_url                text
role                      text NOT NULL  -- 'customer' | 'operator' | 'manager' | 'team_member'
first_payment_celebrated  boolean DEFAULT false  -- [v1.1] confetti trigger — fires once on first payment
created_at                timestamptz DEFAULT now()
updated_at                timestamptz DEFAULT now()
```

### detailer_profiles
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid REFERENCES users(id)
business_name       text
bio                 text
operation_type      text NOT NULL DEFAULT 'mobile'  -- 'mobile' | 'fixed' | 'hybrid'
-- Mobile fields
service_radius      integer  -- miles; used when operation_type = 'mobile' | 'hybrid'
home_base_lat       decimal
home_base_lng       decimal
-- Fixed location fields
location_address    text     -- used when operation_type = 'fixed' | 'hybrid'
location_lat        decimal
location_lng        decimal
location_hours      jsonb    -- { mon: {open:'08:00',close:'18:00'}, tue: ... }
bay_count           integer DEFAULT 1  -- simultaneous jobs at fixed location
accepts_walkins     boolean DEFAULT false
-- Shared
stripe_account_id   text
subscription_tier   text DEFAULT 'starter'  -- [v1.3] denormalized from detailer_subscriptions for edge function lookups. Values: 'starter' | 'pro' | 'crew'. Updated via trigger on detailer_subscriptions insert/update.
platform_fee_override decimal(5,2) NULLABLE  -- [v1.3] manual override set by FOAM ops. NULL = use tier default.
is_active           boolean DEFAULT true
is_verified         boolean DEFAULT false
badge_verified      boolean DEFAULT false  -- set true by Stripe identity verification on Connect onboarding
avg_rating          decimal(3,2)
total_reviews       integer DEFAULT 0
cancellation_count  integer DEFAULT 0  -- [v1.1] tracks cancellations for strike system
operator_cancel_strike_count integer DEFAULT 0  -- [v1.2] cumulative cancellation + reschedule strikes
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

**Note on `subscription_tier` [v1.3]:** This is a denormalized field kept in sync with `detailer_subscriptions.tier` via a database trigger. Edge functions query this column directly to determine platform fee percentage without joining `detailer_subscriptions` on every transaction. The trigger fires on `INSERT` and `UPDATE` of `detailer_subscriptions` where `status = 'active'`.

```sql
-- Trigger to keep subscription_tier in sync
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

### team_members
```sql
id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id                     uuid REFERENCES users(id)
manager_id                  uuid REFERENCES detailer_profiles(id)
display_name                text
team_role                   text NOT NULL DEFAULT 'member'  -- 'manager' | 'member'
is_active                   boolean DEFAULT true
can_view_customer_contact   boolean DEFAULT false
can_reschedule_jobs         boolean DEFAULT false
can_view_team_earnings      boolean DEFAULT false
commission_rate             decimal(5,2)
created_at                  timestamptz DEFAULT now()
```

### customer_profiles
```sql
id                     uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id                uuid REFERENCES users(id)
stripe_customer_id     text
rain_protection_active boolean DEFAULT false
rain_protection_sub_id text  -- Stripe subscription ID
dispute_count          integer DEFAULT 0  -- [v1.1] tracks dispute history for fraud detection
is_suspended           boolean DEFAULT false  -- [v1.1] account suspension flag
created_at             timestamptz DEFAULT now()
updated_at             timestamptz DEFAULT now()
```

### vehicles
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id     uuid REFERENCES customer_profiles(id)
make            text
model           text
year            integer
color           text
license_plate   text NULLABLE  -- [v1.1] optional, shown on operator job screens
vehicle_type    text  -- 'sedan' | 'suv' | 'truck' | 'van' | 'coupe' | 'other'
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
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
package_id      uuid REFERENCES service_packages(id)
vehicle_type    text  -- 'sedan' | 'suv' | 'truck' | 'van'
price_adjustment decimal(10,2)  -- added to or subtracted from base price
```

---

## Bookings

### bookings [v1.1 — updated]
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id             uuid REFERENCES customer_profiles(id)
detailer_id             uuid REFERENCES detailer_profiles(id)
team_member_id          uuid REFERENCES team_members(id) NULLABLE
package_id              uuid REFERENCES service_packages(id) NULLABLE  -- [v1.1] nullable for multi-vehicle bookings
service_type            text NOT NULL DEFAULT 'mobile'  -- 'mobile' | 'fixed'
status                  text NOT NULL DEFAULT 'requested'
  -- 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
scheduled_at            timestamptz NOT NULL
duration_mins           integer NOT NULL
location_address        text  -- customer address for mobile; operator address for fixed
location_lat            decimal
location_lng            decimal
notes                   text
reschedule_count        integer DEFAULT 0  -- [v1.2] increments on each reschedule (max 2)
operator_reschedule_count integer DEFAULT 0  -- [v1.2] separate counter for operator-initiated reschedules
original_scheduled_at   timestamptz  -- [v1.2] preserves original appointment time
cancellation_reason     text NULLABLE
cancelled_by            text NULLABLE  -- 'customer' | 'operator' | 'foam' | 'system'
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()
```

### booking_vehicles [v1.1 — new]
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id)
vehicle_id      uuid REFERENCES vehicles(id)
status          text DEFAULT 'pending'  -- 'pending' | 'in_progress' | 'completed' | 'skipped'
created_at      timestamptz DEFAULT now()
```

### booking_vehicle_services [v1.1 — new]
Supports partial completion per vehicle.

```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_vehicle_id    uuid REFERENCES booking_vehicles(id)
package_id            uuid REFERENCES service_packages(id)
price                 decimal(10,2)
duration_mins         integer
status                text  -- 'pending' | 'completed' | 'skipped'
skip_reason           text NULLABLE
-- Skip reasons: 'time_constraint' | 'customer_requested' | 'vehicle_condition' | 'access_issue'
created_at            timestamptz DEFAULT now()
```

### booking_addons
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id)
addon_id        uuid REFERENCES service_addons(id)
price           decimal(10,2)
```

### booking_photos [v1.1 — updated]
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id)
vehicle_id      uuid REFERENCES vehicles(id) NULLABLE  -- [v1.1] links photo to specific vehicle in multi-vehicle appointments
photo_url       text NOT NULL
photo_type      text  -- 'before' | 'after' | 'damage'
uploaded_by     uuid REFERENCES users(id)
created_at      timestamptz DEFAULT now()
```

### booking_modifications [v1.2 — NEW]
Tracks field-level service changes made by team members during a job. Supports manager approval workflow before changes are committed to the booking total. Created when a team member adds or removes a service in the field.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id          uuid REFERENCES bookings(id)
booking_vehicle_id  uuid REFERENCES booking_vehicles(id) NULLABLE  -- which vehicle the change applies to
modified_by         uuid REFERENCES users(id)  -- team member who requested the change
modification_type   text NOT NULL  -- 'service_added' | 'service_removed'
service_id          uuid REFERENCES service_packages(id)  -- service being added or removed
original_price      decimal(10,2) NULLABLE  -- price before modification (for removals)
new_price           decimal(10,2) NULLABLE  -- price after modification (for additions)
reason              text NULLABLE  -- required for removals: 'customer_requested' | 'vehicle_condition' | 'time_constraint' | 'access_issue'
status              text NOT NULL DEFAULT 'pending'
  -- 'pending' | 'approved' | 'auto_approved' | 'rejected'
  -- auto_approved fires after 5 minutes with no manager response
approved_by         uuid REFERENCES users(id) NULLABLE  -- manager who approved/rejected
approved_at         timestamptz NULLABLE
auto_approve_at     timestamptz  -- set to created_at + 5 minutes on creation
rejection_reason    text NULLABLE  -- manager can add context when rejecting
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

**Approval logic:**
- On creation: `auto_approve_at` = `created_at + 5 minutes`
- Manager push notification fires immediately via `booking-modification-request` Edge Function
- If manager approves before `auto_approve_at`: status → `approved`, booking totals updated, additional Stripe hold created if price increases
- If no response by `auto_approve_at`: status → `auto_approved`, same downstream actions
- If manager rejects: status → `rejected`, service change not applied, team member notified

---

## Payments

### payments [v1.2 — updated]
```sql
id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id                  uuid REFERENCES bookings(id)
stripe_payment_intent_id    text NOT NULL
amount                      decimal(10,2) NOT NULL  -- total hold amount
platform_fee_amount         decimal(10,2)  -- FOAM's cut (tier % of booking value)
operator_amount             decimal(10,2)  -- operator's net after platform fee
tip_amount                  decimal(10,2) DEFAULT 0
tip_payment_intent_id       text  -- separate Stripe PaymentIntent for tip
status                      text  -- 'authorized' | 'captured' | 'cancelled' | 'refunded' | 'disputed'
hold_expires_at             timestamptz  -- Stripe auth hold expiry; re-authorized at T-48hrs
payment_method_type         text  -- 'card' | 'apple_pay' | 'google_pay' | 'cashapp'
modification_intents        jsonb  -- [v1.2] array of additional holds for field-added services: [{modification_id, payment_intent_id, amount, captured}]
cancellation_fee_amount     decimal(10,2)  -- amount captured as cancellation fee
cancellation_fee_tier       text  -- 'free' | 'twenty_five' | 'fifty' | 'no_show'
cancellation_initiated_by   text  -- 'customer' | 'operator' | 'foam' | 'system'
instant_payout_requested    boolean DEFAULT false
instant_payout_fee          decimal(10,2)  -- 1.5% fee for instant payout
created_at                  timestamptz DEFAULT now()
updated_at                  timestamptz DEFAULT now()
```

---

## Reviews

### reviews
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id)
customer_id     uuid REFERENCES customer_profiles(id)
detailer_id     uuid REFERENCES detailer_profiles(id)
rating          integer NOT NULL  -- 1-5
body            text NOT NULL  -- required to submit rating
created_at      timestamptz DEFAULT now()
```

---

## Fixed Location Scheduling

### fixed_location_slots
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
slot_date       date NOT NULL
slot_time       time NOT NULL
bay_number      integer DEFAULT 1
is_booked       boolean DEFAULT false
booking_id      uuid REFERENCES bookings(id) NULLABLE
is_blocked      boolean DEFAULT false  -- maintenance, closures
created_at      timestamptz DEFAULT now()
```

When a customer books a fixed location appointment, a slot row is marked as booked and linked to the booking. Walk-in jobs create a slot record on arrival. Operators can block slots for maintenance or closures.

---

## CRM & Customer Retention (V2)

### customer_notes
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
customer_id     uuid REFERENCES customer_profiles(id)
note            text
created_at      timestamptz DEFAULT now()
```

### lapsed_customer_queue
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
customer_id     uuid REFERENCES customer_profiles(id)
last_booking_at timestamptz
days_since_last integer
outreach_sent_at timestamptz NULLABLE
created_at      timestamptz DEFAULT now()
```

---

## Inventory (V2)

### inventory_items
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
name            text NOT NULL
unit            text  -- 'oz' | 'gallon' | 'count' | 'bottle'
current_qty     decimal(10,2)
low_stock_threshold decimal(10,2)
cost_per_unit   decimal(10,2)
created_at      timestamptz DEFAULT now()
```

---

## Rain Protection (V2)

### rain_protection_claims
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id     uuid REFERENCES customer_profiles(id)
booking_id      uuid REFERENCES bookings(id)
rain_detected_at timestamptz
precipitation_inches decimal(5,3)
zip_code        text
claim_status    text  -- 'triggered' | 'redeemed' | 'expired'
redemption_booking_id uuid NULLABLE REFERENCES bookings(id)
expires_at      timestamptz
created_at      timestamptz DEFAULT now()
```

---

## Subscriptions

### detailer_subscriptions
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
stripe_subscription_id text
tier            text  -- 'starter' | 'pro' | 'crew'
status          text  -- 'active' | 'past_due' | 'cancelled'
current_period_start timestamptz
current_period_end   timestamptz
created_at      timestamptz DEFAULT now()
```

**Note:** `detailer_subscriptions.tier` is the normalized source of truth for an operator's subscription tier. `detailer_profiles.subscription_tier` is a denormalized copy kept in sync via trigger for performant edge function lookups. See `detailer_profiles` note above.

---

## Key Relationships Summary [v1.3]
```
users (1) ──── (1) detailer_profiles
users (1) ──── (1) customer_profiles
users (1) ──── (1) team_members
detailer_profiles (1) ──── (many) team_members
detailer_profiles (1) ──── (many) service_packages
customer_profiles (1) ──── (many) vehicles
bookings (many) ──── (1) customer_profiles
bookings (many) ──── (1) detailer_profiles
bookings (1) ──── (many) booking_vehicles          [v1.1 — replaces single vehicle_id]
booking_vehicles (1) ──── (many) booking_vehicle_services  [v1.1 — new]
booking_vehicles (1) ──── (many) booking_photos    [v1.1 — photos now vehicle-linked]
bookings (1) ──── (many) booking_modifications     [v1.2 — new, team member field edits]
bookings (1) ──── (1) reviews
bookings (1) ──── (1) payments
```
