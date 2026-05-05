# Data Model
**Version 1.3 — Updated May 3, 2026**
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
is_multi_unit       boolean NOT NULL DEFAULT false  -- [v1.3] true when business has multiple locations or vans
-- Single-unit mobile fields (used when is_multi_unit = false)
service_radius      integer  -- miles; used when operation_type = 'mobile' | 'hybrid'
home_base_lat       decimal
home_base_lng       decimal
-- Single-unit fixed location fields (used when is_multi_unit = false)
location_address    text     -- used when operation_type = 'fixed' | 'hybrid'
location_lat        decimal
location_lng        decimal
location_hours      jsonb    -- { mon: {open:'08:00',close:'18:00'}, tue: ... }
bay_count           integer DEFAULT 1  -- simultaneous jobs at fixed location
accepts_walkins     boolean DEFAULT false
-- When is_multi_unit = true, location/asset config moves to business_locations
-- and business_assets tables. Single-unit fields above are ignored.
-- Shared
stripe_account_id   text
is_active           boolean DEFAULT true
is_verified         boolean DEFAULT false
avg_rating          decimal(3,2)
total_reviews       integer DEFAULT 0
cancellation_count  integer DEFAULT 0  -- [v1.1] tracks cancellations for strike system
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
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
status                  text
-- Status values [v1.1]:
-- 'requested' | 'confirmed' | 'in_progress' | 'completed' |
-- 'partially_completed' | 'cancelled' | 'no_show'
scheduled_at            timestamptz NOT NULL
estimated_duration_mins integer
service_address         text  -- customer address for mobile, operator address for fixed
service_lat             decimal
service_lng             decimal
bay_number              integer NULLABLE  -- for fixed location jobs
subtotal                decimal(10,2)
tip_amount              decimal(10,2) DEFAULT 0
platform_fee            decimal(10,2)
total                   decimal(10,2)
is_recurring            boolean DEFAULT false
recurrence_rule         text NULLABLE  -- 'weekly' | 'biweekly' | 'monthly'
parent_booking_id       uuid NULLABLE  -- for recurring bookings
cancellation_policy     text DEFAULT 'standard'  -- [v1.1] 'flexible' | 'standard' | 'strict'
cancelled_by            uuid REFERENCES users(id) NULLABLE  -- [v1.1]
cancelled_at            timestamptz NULLABLE  -- [v1.1]
cancellation_reason     text NULLABLE  -- [v1.1] free text + structured reason code
no_show_reported_at     timestamptz NULLABLE  -- [v1.1] when operator tapped 'Report No-Show'
submitted_by            uuid REFERENCES users(id) NULLABLE  -- [v1.2] who submitted job completion
submitted_by_role       text NULLABLE  -- [v1.2] 'operator' | 'team_member' — for dispute evidence
location_id             uuid REFERENCES business_locations(id) NULLABLE  -- [v1.3] which physical location this job is at
asset_id                uuid REFERENCES business_assets(id) NULLABLE  -- [v1.3] which van/mobile unit is serving this job
notes                   text
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()
```

### booking_vehicles [v1.1 — NEW]
Junction table for multi-vehicle appointments. Replaces single `vehicle_id` on bookings. Each row represents one vehicle in an appointment.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id          uuid REFERENCES bookings(id)
vehicle_id          uuid REFERENCES vehicles(id)
subtotal            decimal(10,2)  -- sum of services for this vehicle
status              text  -- 'pending' | 'completed' | 'no_show' | 'skipped'
no_show_fee         decimal(10,2) DEFAULT 0  -- captured if vehicle was no-show
completion_notes    text NULLABLE  -- operator notes on this specific vehicle
created_at          timestamptz DEFAULT now()
```

### booking_vehicle_services [v1.1 — NEW]
Tracks which services were assigned to which vehicle in a multi-vehicle booking. Supports partial completion per vehicle.

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
Tracks field-level service changes made by crew members during a job. Supports manager approval workflow before changes are committed to the booking total. Created when a crew member adds or removes a service in the field.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id          uuid REFERENCES bookings(id)
booking_vehicle_id  uuid REFERENCES booking_vehicles(id) NULLABLE  -- which vehicle the change applies to
modified_by         uuid REFERENCES users(id)  -- crew member who requested the change
modification_type   text NOT NULL  -- 'service_added' | 'service_removed'
service_id          uuid REFERENCES service_packages(id)  -- service being added or removed
original_price      decimal(10,2) NULLABLE  -- price before modification (for removals)
new_price           decimal(10,2) NULLABLE  -- price after modification (for additions)
reason              text NULLABLE  -- required for removals: 'customer_requested' | 'vehicle_condition' | 'time_constraint' | 'access_issue'
status              text NOT NULL DEFAULT 'pending'
-- Status values: 'pending' | 'approved' | 'auto_approved' | 'rejected'
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
- If manager approves before `auto_approve_at`: status → `approved`, booking totals update
- If no manager response by `auto_approve_at`: status → `auto_approved`, booking totals update
- If manager rejects: status → `rejected`, crew notified, original service state restored
- Rejected modifications are retained in the table for audit trail — never deleted

---

## Payments

### payments [v1.1 — updated]
```sql
id                        uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id                uuid REFERENCES bookings(id)
stripe_payment_intent_id  text UNIQUE
amount                    decimal(10,2)
tip_amount                decimal(10,2) DEFAULT 0
platform_fee              decimal(10,2)
payout_amount             decimal(10,2)
-- Authorization hold fields [v1.1]
hold_amount               decimal(10,2)  -- amount authorized at booking (recommended: full subtotal)
hold_placed_at            timestamptz    -- when Stripe authorization was created
hold_expires_at           timestamptz    -- hold_placed_at + 7 days (Stripe hard limit)
capture_amount            decimal(10,2)  -- final captured amount (may exceed hold if tip added within Stripe limits)
stripe_capture_method     text DEFAULT 'manual'  -- always 'manual' for FOAM
-- Cancellation fields [v1.1]
cancelled_at              timestamptz NULLABLE
cancellation_reason       text NULLABLE
-- Dispute fields [v1.1]
dispute_opened_at         timestamptz NULLABLE
dispute_resolved_at       timestamptz NULLABLE
dispute_outcome           text NULLABLE  -- 'won' | 'lost'
-- Status [v1.1 — extended]
status                    text
-- Status values: 'authorized' | 'pending' | 'captured' | 'paid_out' |
--               'refunded' | 'failed' | 'hold_expired' | 'cancelled' | 'disputed'
created_at                timestamptz DEFAULT now()
updated_at                timestamptz DEFAULT now()
```

### payouts
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
stripe_payout_id text
amount          decimal(10,2)
period_start    timestamptz
period_end      timestamptz
status          text  -- 'pending' | 'paid' | 'failed'
created_at      timestamptz DEFAULT now()
```

---

## Reviews & Reputation

### reviews [v1.1 — updated]
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id) UNIQUE
customer_id     uuid REFERENCES customer_profiles(id)
detailer_id     uuid REFERENCES detailer_profiles(id)
rating          integer NOT NULL  -- 1-5
body            text
tags            text[]  -- [v1.1] quick feedback chips: 'on_time' | 'great_results' | 'professional' | 'will_rebook' | 'handled_multiple_cars'
created_at      timestamptz DEFAULT now()
```

---

## Fixed Location Capacity

### fixed_location_slots
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid REFERENCES detailer_profiles(id)
slot_date       date NOT NULL
slot_time       time NOT NULL
bay_number      integer NOT NULL DEFAULT 1
status          text NOT NULL DEFAULT 'available'  -- 'available' | 'booked' | 'blocked'
booking_id      uuid REFERENCES bookings(id) NULLABLE
created_at      timestamptz DEFAULT now()
UNIQUE (detailer_id, slot_date, slot_time, bay_number)
```

Each row represents one bay at one time slot on one date. When a customer books a fixed location appointment, a slot row is marked as booked and linked to the booking. Walk-in jobs create a slot record on arrival. Operators can block slots for maintenance or closures.

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

---

## Multi-Unit Business [v1.3 — NEW]

These tables support operators running multiple physical locations and/or multiple mobile vans under one business account. When `detailer_profiles.is_multi_unit = true`, location and asset config lives here instead of on `detailer_profiles`.

### business_locations [v1.3 — NEW]
Physical shop locations. One business can have many locations. Each appears as a separate card in customer discovery with its own address, hours, and bay configuration.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id     uuid NOT NULL REFERENCES detailer_profiles(id) ON DELETE CASCADE
name            text NOT NULL  -- e.g., "Buckhead Shop", "Midtown Location"
address         text NOT NULL
lat             decimal NOT NULL
lng             decimal NOT NULL
bay_count       integer NOT NULL DEFAULT 1
hours           jsonb NOT NULL  -- { mon: {open:'08:00',close:'18:00'}, ... }
accepts_walkins boolean NOT NULL DEFAULT false
phone           text NULLABLE  -- location-specific phone number
is_active       boolean NOT NULL DEFAULT true
display_order   integer NOT NULL DEFAULT 0  -- controls order in manager Today tab filter
avg_rating      decimal(3,2)  -- location-specific rating (calculated from jobs at this location)
total_reviews   integer NOT NULL DEFAULT 0
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

### business_assets [v1.3 — NEW]
Mobile vans or service units. One business can have many vans. Each van has its own service zone, crew assignment, and equipment loadout. Vans share the operator's discovery profile but have distinct routing and scheduling.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
detailer_id         uuid NOT NULL REFERENCES detailer_profiles(id) ON DELETE CASCADE
name                text NOT NULL  -- e.g., "Van 1", "Marcus's Rig", "Team Blue"
license_plate       text NULLABLE
home_base_lat       decimal NOT NULL  -- where the van starts and ends each day
home_base_lng       decimal NOT NULL
service_radius_miles integer NOT NULL DEFAULT 15
-- Service zone override: if set, this polygon overrides the circle radius
service_zone_geojson jsonb NULLABLE  -- GeoJSON polygon for irregular coverage areas
primary_crew_id     uuid REFERENCES team_members(id) NULLABLE  -- default driver/operator
equipment_notes     text NULLABLE  -- "Has steam cleaner, no clay bar" etc.
is_active           boolean NOT NULL DEFAULT true
display_order       integer NOT NULL DEFAULT 0
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
```

### asset_crew_assignments [v1.3 — NEW]
Tracks which crew members are assigned to which van on which days. Many-to-many. Allows crew to rotate between vans week to week.

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
asset_id    uuid NOT NULL REFERENCES business_assets(id) ON DELETE CASCADE
crew_id     uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE
assigned_date date NOT NULL  -- specific date of assignment
is_primary  boolean NOT NULL DEFAULT false  -- primary operator of this van on this day
created_at  timestamptz NOT NULL DEFAULT now()
UNIQUE (asset_id, crew_id, assigned_date)
```

---

## Key Relationships Summary [v1.3]
```
users (1) ──── (1) detailer_profiles
users (1) ──── (1) customer_profiles
users (1) ──── (1) crew_members
detailer_profiles (1) ──── (many) crew_members
detailer_profiles (1) ──── (many) service_packages
detailer_profiles (1) ──── (many) business_locations    [v1.3 — new, multi-location]
detailer_profiles (1) ──── (many) business_assets       [v1.3 — new, multi-van]
business_assets (1) ──── (many) asset_crew_assignments  [v1.3 — new]
customer_profiles (1) ──── (many) vehicles
bookings (many) ──── (1) customer_profiles
bookings (many) ──── (1) detailer_profiles
bookings (many) ──── (0..1) business_locations  [v1.3 — which location for fixed jobs]
bookings (many) ──── (0..1) business_assets     [v1.3 — which van for mobile jobs]
bookings (1) ──── (many) booking_vehicles          [v1.1 — replaces single vehicle_id]
booking_vehicles (1) ──── (many) booking_vehicle_services  [v1.1 — new]
booking_vehicles (1) ──── (many) booking_photos    [v1.1 — photos now vehicle-linked]
bookings (1) ──── (many) booking_modifications     [v1.2 — new, crew field edits]
bookings (1) ──── (1) reviews
bookings (1) ──── (1) payments
```
