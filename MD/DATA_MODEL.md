# Data Model

## Overview
Built on Supabase (PostgreSQL). All tables use UUID primary keys. Row-level security enforced via Supabase RLS policies. Role-based access control enforced at the application and database layer.

---

## Core Tables

### users
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
email           text UNIQUE NOT NULL
phone           text
full_name       text
avatar_url      text
role            text NOT NULL  -- 'customer' | 'operator' | 'manager' | 'team_member'
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
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
is_active           boolean DEFAULT true
is_verified         boolean DEFAULT false
avg_rating          decimal(3,2)
total_reviews       integer DEFAULT 0
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
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id)
stripe_customer_id text
rain_protection_active  boolean DEFAULT false
rain_protection_sub_id  text  -- Stripe subscription ID
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### vehicles
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id     uuid REFERENCES customer_profiles(id)
make            text
model           text
year            integer
color           text
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

### bookings
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id             uuid REFERENCES customer_profiles(id)
detailer_id             uuid REFERENCES detailer_profiles(id)
team_member_id          uuid REFERENCES team_members(id) NULLABLE
vehicle_id              uuid REFERENCES vehicles(id)
package_id              uuid REFERENCES service_packages(id)
service_type            text NOT NULL DEFAULT 'mobile'  -- 'mobile' | 'fixed'
status                  text  -- 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
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
notes           text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### booking_addons
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id)
addon_id        uuid REFERENCES service_addons(id)
price           decimal(10,2)
```

### booking_photos
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id)
photo_url       text NOT NULL
photo_type      text  -- 'before' | 'after' | 'damage'
uploaded_by     uuid REFERENCES users(id)
created_at      timestamptz DEFAULT now()
```

---

## Payments

### payments
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id)
stripe_payment_intent_id text UNIQUE
amount          decimal(10,2)
tip_amount      decimal(10,2) DEFAULT 0
platform_fee    decimal(10,2)
payout_amount   decimal(10,2)
status          text  -- 'pending' | 'captured' | 'paid_out' | 'refunded' | 'failed'
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
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

### reviews
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id      uuid REFERENCES bookings(id) UNIQUE
customer_id     uuid REFERENCES customer_profiles(id)
detailer_id     uuid REFERENCES detailer_profiles(id)
rating          integer NOT NULL  -- 1-5
body            text
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

This table manages capacity for fixed location operators. Each row represents one bay at one time slot on one date. When a customer books a fixed location appointment, a slot row is marked as booked and linked to the booking. Walk-in jobs create a slot record on arrival. Operators can block slots for maintenance or closures.

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

## Key Relationships Summary
```
users (1) ──── (1) detailer_profiles
users (1) ──── (1) customer_profiles
users (1) ──── (1) crew_members
detailer_profiles (1) ──── (many) crew_members
detailer_profiles (1) ──── (many) service_packages
customer_profiles (1) ──── (many) vehicles
bookings (many) ──── (1) customer_profiles
bookings (many) ──── (1) detailer_profiles
bookings (1) ──── (1) reviews
bookings (1) ──── (many) booking_photos
bookings (1) ──── (1) payments
```
