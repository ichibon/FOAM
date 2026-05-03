# FOAM — Architecture
**Version 1.1 — Updated May 2, 2026**
Changes from v1.0 marked with `[v1.1]`

> This document is the architectural overview of the entire FOAM platform. It connects the stack, the systems, the data flow, and the decision rationale in one place. Use this as the map before going deep into any individual component.

---

## Architectural Philosophy

FOAM is built on four principles that drive every technical decision:

**1. Mobile-native from day one.** The product lives on a phone. Every architectural choice — from API response shape to image compression to notification delivery — is optimized for a mobile client on a variable network connection, not a desktop browser.

**2. Supply-side first.** The operator experience is the product's moat. The architecture prioritizes the reliability and depth of the operator OS — booking engine, payment infrastructure, team management — before scaling the customer discovery layer.

**3. Build for the loop, not the feature.** The core loop is: customer books → operator fulfills → payment processes → review submitted. Every system exists to make that loop fast, reliable, and repeatable. Features that don't serve the loop are V2.

**4. One platform, two service models.** Mobile (operator comes to customer) and fixed location (customer goes to operator) are both first-class citizens. The architecture handles both booking flows, both discovery modes, and hybrid operators running both simultaneously — without separate codebases or separate databases.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FOAM Platform                        │
│                                                             │
│   ┌───────────┐   ┌────────────────┐   ┌───────────────┐  │
│   │  Customer  │   │Detailer/Owner  │   │  Crew Member  │  │
│   │    App     │   │      App       │   │      App      │  │
│   └─────┬─────┘   └───────┬────────┘   └──────┬────────┘  │
│         │                 │                    │            │
│         └─────────────────┼────────────────────┘            │
│                           │                                 │
│              React Native (Expo) — iOS + Android            │
│                           │                                 │
│         ┌─────────────────┼─────────────────────┐          │
│         │                 │                     │           │
│   ┌─────▼──────┐  ┌───────▼──────┐  ┌──────────▼──────┐  │
│   │  Supabase  │  │    Stripe    │  │  External APIs  │  │
│   │  Backend   │  │   Payments   │  │  Twilio/Maps/   │  │
│   │            │  │              │  │  Weather        │  │
│   │ PostgreSQL │  │   Connect    │  │                 │  │
│   │ Auth       │  │   Elements   │  │                 │  │
│   │ Storage    │  │   Billing    │  │                 │  │
│   │ Realtime   │  │              │  │                 │  │
│   └────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Mobile Client | React Native (Expo) | Single codebase for iOS and Android. Expo handles builds, OTA updates, and native module access without ejecting. |
| Backend / Database | Supabase (PostgreSQL) | Managed Postgres with built-in auth, real-time subscriptions, row-level security, and storage. Removes the need for a separate API server for most operations. |
| Authentication | Supabase Auth | JWT-based sessions, email/password + social (Google, Apple). Role claims embedded in JWT for RLS enforcement. |
| Payments | Stripe + Stripe Connect | Industry standard for marketplace payouts. Connect handles split payments between FOAM and detailers. Elements handles PCI-compliant card capture. |
| File Storage | Supabase Storage | Job photos, profile images, damage documentation, business documents — all stored in Supabase buckets with access controlled by RLS. |
| Push Notifications | Expo Notifications | Cross-platform push delivery through Expo's notification service. Handles iOS APNs and Android FCM from a single API. |
| SMS | Twilio | Appointment reminders and booking confirmations via SMS. Falls back for customers who miss push notifications. |
| Maps & Routing | Google Maps API | Address validation, distance matrix for travel time buffers, place autocomplete for service location entry. |
| Weather Data | Tomorrow.io | Precipitation data by zip code and timestamp for Rain Coverage claim evaluation. Historical and forecast access. |
| Development | Replit | Cloud-based development environment. Handles hosting and deployment without a dedicated DevOps setup. |
| UI Design | UXPilot | AI-assisted wireframing and UI generation for React Native screens. |
| AI Co-Development | Claude | Product decisions, code generation, documentation, and business strategy — governed by AI_RULES.md and AI_CONFIDENCE_MODEL.md. |

---

## Application Architecture

### Single App, Four Role-Based Experiences

One React Native app. One download. Four completely distinct navigation experiences driven by the authenticated user's role.

```
App Entry
    │
    ├── Unauthenticated → Onboarding Flow → Role Selection
    │
    └── Authenticated
            │
            ├── role: 'customer'      → Customer Navigator
            │       ├── Discover Tab  (mobile + fixed, unified feed)
            │       ├── Bookings Tab
            │       └── Profile Tab
            │
            ├── role: 'operator'      → Operator Navigator
            │       ├── Today Tab     (unified calendar — mobile + fixed)
            │       ├── Bookings Tab
            │       ├── Customers Tab
            │       ├── Business Tab
            │       └── Profile Tab
            │
            ├── role: 'manager'       → Manager Navigator
            │       ├── Today Tab     (team + own jobs overview)
            │       ├── Team Tab      (assign jobs, track members)
            │       ├── Bookings Tab
            │       ├── Business Tab
            │       └── Profile Tab
            │
            └── role: 'team_member'   → Team Member Navigator
                    ├── My Jobs Tab
                    ├── Earnings Tab
                    └── Profile Tab
```

Role is stored in the `users` table and embedded in the Supabase JWT as a custom claim. The React Native app reads the claim on auth and routes to the correct navigator.

### Operator Configuration Layer

Within the `operator` role, the app behavior adapts based on `operation_type` on the `detailer_profiles` table:

```
operator.operation_type
    │
    ├── 'mobile'   → Show service radius config, travel time buffers
    │                Hide bay management, location hours
    │
    ├── 'fixed'    → Show location address, hours, bay count, walk-in toggle
    │                Hide service radius, travel time buffers
    │
    └── 'hybrid'   → Show all of the above
                     Unified calendar with mobile + fixed job types
                     Channel revenue breakdown in Business tab
```

### Two Booking Flows

**Mobile booking flow (customer side):**
```
Enter service address
    → Query detailers whose service_radius covers that address
    → Select detailer → build appointment (vehicles + services) → pick time → authorize hold
    → Booking record: service_type = 'mobile', service_address = customer address
    → booking_vehicles records created per vehicle  [v1.1]
    → booking_vehicle_services records created per service per vehicle  [v1.1]
```

**Fixed location booking flow (customer side):**
```
Browse nearby fixed locations (by proximity to customer)
    → Select location → select service → pick drop-off time → authorize hold or mark walk-in
    → Booking record: service_type = 'fixed', service_address = operator location address
```

**Discovery unified feed:**
Both mobile detailers and fixed locations return in the same discovery query. Client renders them in a single list/map. Filter chips let customer narrow by service type.

### State Management

- **Server state:** Supabase real-time subscriptions for live data (booking status changes, new bookings, job completions)
- **Local state:** React state and context for UI — no Redux, no complex state library
- **Optimistic updates:** UI reflects changes immediately; rolls back on server failure
- **Offline handling:** Critical reads cached locally; writes queued and synced on reconnect

---

## Backend Architecture

### Supabase as the Core Backend

FOAM uses Supabase as its primary backend layer. This means most application logic runs through:

- **PostgreSQL** — primary data store for all application state
- **Row Level Security (RLS)** — database-level access control, not just application-level
- **Supabase Functions (Edge Functions)** — server-side logic that can't run client-side (payment webhooks, notification triggers, weather API calls)
- **Supabase Realtime** — websocket-based live updates for booking status, crew location (V2)
- **Supabase Storage** — S3-compatible object storage for all media

### Row Level Security Architecture

RLS is the security backbone. Every table has policies that enforce who can read and write what. No client-side code can bypass RLS — it's enforced at the database layer.

**Key RLS principles:**
```sql
-- Customers see only their own bookings
CREATE POLICY "customers_own_bookings" ON bookings
  FOR SELECT USING (customer_id = auth.uid());

-- Detailers see bookings assigned to them
CREATE POLICY "detailers_own_bookings" ON bookings
  FOR SELECT USING (detailer_id = (
    SELECT id FROM detailer_profiles WHERE user_id = auth.uid()
  ));

-- Crew see only jobs assigned to them
CREATE POLICY "crew_assigned_jobs" ON bookings
  FOR SELECT USING (crew_member_id = (
    SELECT id FROM crew_members WHERE user_id = auth.uid()
  ));
```

### Edge Functions (Server-Side Logic) [v1.1 — updated]

Operations that require server-side execution run as Supabase Edge Functions (Deno runtime):

| Function | Type | Trigger | Purpose |
|----------|------|---------|---------|
| `stripe-webhook` | UPDATED | Stripe webhook event | Handle payment confirmations, subscription changes, failed payments. **[v1.1] Now also handles:** `payment_intent.canceled` (release hold, update status), `payment_intent.payment_failed` (notify customer, block confirmation), `charge.dispute.created` (flag booking, alert ops, assemble evidence, notify operator), `charge.dispute.closed` (update status, release or claw back payout) |
| `stripe-capture` | NEW | Customer taps "Complete Payment" | **[v1.1]** Captures PaymentIntent with final amount including tip. Handles tip adjustment at capture time. Deducts platform fee. Routes net amount to operator's Stripe Connect account. |
| `stripe-hold-expire` | NEW | Scheduled cron — daily | **[v1.1]** Checks `payments.hold_expires_at` on all authorized payments. Re-authorizes holds at T-48hrs before expiry. If re-auth fails: push + SMS to customer, 24hr window to update payment. If no response: cancels booking, notifies operator, reopens slot. |
| `booking-confirmed` | EXISTING | Booking status → confirmed | Send confirmation push + SMS to customer and detailer |
| `booking-cancelled` | NEW | Booking status → cancelled | **[v1.1]** Cancels Stripe PaymentIntent (releases hold). Sends notifications with appropriate messaging based on who cancelled. Applies FOAM credit if operator-caused. Logs cancellation strike to operator record if applicable. Reopens time slot. |
| `no-show-handler` | NEW | Operator confirms no-show | **[v1.1]** Sends grace period push + SMS to customer (10 min window). On operator confirmation: partial capture (50% of affected services). Updates booking status to `no_show`. Notifies customer of no-show fee. Logs to operator record. |
| `appointment-reminder` | EXISTING | Scheduled cron | 24hr and 1hr reminders for upcoming bookings |
| `rain-check` | EXISTING | Scheduled cron (daily) | Query weather API for completed bookings in past 72hrs, trigger Rain Coverage claims |
| `review-request` | EXISTING | Booking status → completed | Send review request push + SMS 1hr after completion |
| `lapsed-customer` | EXISTING | Scheduled cron (weekly) | Identify customers 60+ days without booking, queue re-engagement (V2) |
| `payout-summary` | EXISTING | Scheduled cron (weekly) | Generate detailer payout reports |

---

## Data Architecture

### Database Design Principles

- All primary keys are UUIDs generated server-side
- All timestamps are `timestamptz` (timezone-aware)
- Soft deletes where data integrity matters (bookings, customers) — `is_active` flag rather than hard delete
- Denormalized fields for read performance (`avg_rating`, `total_reviews` on `detailer_profiles`) — updated via triggers
- Foreign keys enforced at the database level, not just application level

### Core Entity Relationships [v1.1 — updated]

```
users (1) ────────── (1) detailer_profiles
users (1) ────────── (1) customer_profiles
users (1) ────────── (1) crew_members

detailer_profiles (1) ── (many) crew_members
detailer_profiles (1) ── (many) service_packages
detailer_profiles (1) ── (many) bookings

customer_profiles (1) ── (many) vehicles
customer_profiles (1) ── (many) bookings

bookings (many) ─────── (1) customer_profiles
bookings (many) ─────── (1) detailer_profiles
bookings (many) ─────── (0..1) crew_members
bookings (1) ──────────── (0..1) reviews
bookings (1) ──────────── (0..1) payments
bookings (1) ──────────── (many) booking_vehicles          [v1.1 — replaces single vehicle_id]
bookings (1) ──────────── (many) booking_addons

booking_vehicles (1) ─── (many) booking_vehicle_services  [v1.1 — new]
booking_vehicles (1) ─── (many) booking_photos            [v1.1 — photos now vehicle-linked]
```

Full schema with all columns: see DATA_MODEL.md

### Data Separation by Role

Data access is partitioned at the RLS level — not the application level:

| Data | Customer Sees | Detailer Sees | Crew Sees |
|------|--------------|---------------|-----------|
| Own booking details | ✅ | ✅ | ✅ (assigned only) |
| Other customers' bookings | ❌ | ❌ | ❌ |
| Detailer revenue data | ❌ | ✅ | ❌ (unless granted) |
| Crew member list | ❌ | ✅ | Own record only |
| Customer vehicle notes | ❌ | ✅ | Conditional (owner setting) |
| Business documents | ❌ | ✅ (own) | ❌ |

---

## Payment Architecture [v1.1 — updated]

### The Money Flow

FOAM uses Stripe's **manual capture model** (authorization hold). This is the same mechanism used by Uber, Airbnb, and DoorDash. Funds are authorized at booking and captured only after the job is complete.

```
Customer books appointment
      │
      ▼
Stripe PaymentIntent created (capture_method: 'manual')
      │
      ▼
Authorization hold placed on customer's card
(Full appointment subtotal recommended — not a token $100 amount)
      │
      ▼
Hold valid for 7 days — managed by stripe-hold-expire Edge Function
      │
      ├── Job happens as scheduled
      │         │
      │         ▼
      │   Customer taps "Complete Payment" on Job Complete screen
      │         │
      │         ▼
      │   stripe-capture Edge Function fires
      │         │
      │         ▼
      │   PaymentIntent captured at final amount (subtotal + tip)
      │         │
      │         ├── Platform fee deducted
      │         │
      │         └── Net amount → operator's Stripe Connect account
      │                   │
      │                   ▼
      │             Operator's bank account (standard Stripe payout schedule)
      │
      ├── Operator cancels before job
      │         │
      │         ▼
      │   booking-cancelled Edge Function fires
      │   PaymentIntent cancelled → hold released (5-7 business days)
      │   Customer notified + FOAM credit applied (Standard Policy)
      │
      ├── Customer no-show
      │         │
      │         ▼
      │   no-show-handler Edge Function fires
      │   Partial capture: 50% of affected services
      │   50% to operator, 50% retained by FOAM
      │   Customer notified of no-show fee
      │
      └── Hold approaches expiry (T-48hrs)
                │
                ▼
          stripe-hold-expire attempts re-authorization
                │
                ├── Success → silent, new expiry set
                │
                └── Failure → customer notified, 24hr window to update payment
                              No response → booking cancelled, slot reopened
```

### Payment Status State Machine [v1.1]

```
authorized → captured → paid_out
     │
     ├── cancelled (hold released)
     ├── hold_expired (re-auth failed, booking cancelled)
     ├── failed (capture failed)
     ├── refunded (post-capture refund)
     └── disputed → won (funds restored) | lost (chargeback absorbed)
```

### Dispute Handling [v1.1 — new]

When a customer disputes a charge with their bank, FOAM's dispute evidence package is auto-assembled from:

| Evidence | Source |
|----------|--------|
| Before photos | `job-photos` storage bucket, linked to booking + vehicle |
| After photos | `job-photos` storage bucket, linked to booking + vehicle |
| Booking timestamp | `bookings.scheduled_at` |
| Completion timestamp | `bookings.updated_at` when status = `completed` |
| Operator rating | `detailer_profiles.avg_rating` + `total_reviews` |
| Customer payment confirmation | `payments.captured_at` |

Before/after photo upload is mandatory before job completion specifically because these photos serve as dispute evidence. This is a functional requirement, not a UX preference.

FOAM ops is notified immediately on `charge.dispute.created`. Evidence is submitted within 5 days. Operator payout is paused during dispute resolution.

### Stripe Connect — Express Accounts

Detailers onboard via Stripe Connect Express — the fastest path to getting detailers paid without FOAM handling KYC directly. Stripe handles:
- Identity verification
- Bank account linking
- Tax reporting (1099-K)
- Payout scheduling

FOAM handles:
- Platform fee deduction before transfer
- Tip routing (tip goes to detailer's Connect account in full, added at capture time)
- Subscription billing (separate from transaction fees)

### Subscription Billing

Detailer tier subscriptions (Starter/Pro/Crew) are managed as Stripe Subscriptions — separate from per-transaction fees. Both are tied to the same Stripe customer record for the detailer.

Rain Coverage ($7.99/month) is a Stripe Subscription on the customer's Stripe customer record.

---

## Notification Architecture

### Delivery Stack

```
Trigger event (booking state change, cron, webhook)
      │
      ▼
Supabase Edge Function
      │
      ├── Push notification → Expo Push API → APNs (iOS) / FCM (Android)
      │
      └── SMS → Twilio API → Carrier → Customer/Detailer phone
```

### Notification Priority by Type [v1.1 — updated]

| Notification | Push | SMS | Customer | Operator | Notes |
|-------------|------|-----|----------|----------|-------|
| Booking confirmed | ✅ | ✅ | ✅ | ✅ | |
| 24-hour reminder | ✅ | ✅ | ✅ | ❌ | |
| 1-hour reminder | ✅ | ❌ | ✅ | ❌ | |
| En route (V2) | ✅ | ❌ | ✅ | ❌ | |
| Job complete | ✅ | ❌ | ✅ | ❌ | |
| Review request | ✅ | ✅ | ✅ | ❌ | |
| Payment received | ✅ | ❌ | ❌ | ✅ | |
| Rain Coverage triggered | ✅ | ✅ | ✅ | ❌ | |
| New booking (detailer) | ✅ | ✅ | ❌ | ✅ | |
| Operator cancelled | ✅ | ✅ | ✅ | ✅ | [v1.1] Customer gets credit + rebooking link |
| No-show grace period | ✅ | ✅ | ✅ | ❌ | [v1.1] "Are you on your way?" |
| No-show confirmed | ✅ | ✅ | ✅ | ✅ | [v1.1] Customer: fee charged. Operator: earnings confirmed. |
| Partial completion | ✅ | ❌ | ✅ | ❌ | [v1.1] Adjusted invoice notification |
| Hold re-auth failed | ✅ | ✅ | ✅ | ❌ | [v1.1] Update payment CTA |
| Booking cancelled — payment failure | ✅ | ✅ | ✅ | ✅ | [v1.1] |
| Dispute opened | ❌ | ❌ | ❌ | ✅ | [v1.1] Payout on hold — handled by ops |
| Dispute resolved — won | ✅ | ❌ | ❌ | ✅ | [v1.1] Payout released |
| Dispute resolved — lost | ✅ | ❌ | ❌ | ✅ | [v1.1] Payout adjusted |

SMS is reserved for high-priority customer-facing notifications where a missed push could break the experience. Everything else is push + in-app only.

---

## Booking State Machine [v1.1 — updated]

```
requested
    │
    ▼
confirmed ──────────────────────────────────────────► cancelled
    │                                                  (operator or customer)
    ▼
in_progress ─────────────────────────────────────────► no_show
    │                                                  (customer absent)
    ▼
completed ──────────────────────────────────────────► partially_completed
    │                                                  (some services skipped)
    ▼
reviewed
```

**Status definitions:**

| Status | Meaning | Payment State |
|--------|---------|--------------|
| `requested` | Customer submitted booking, awaiting operator confirmation | Hold not yet placed |
| `confirmed` | Operator accepted, hold placed on customer card | `authorized` |
| `in_progress` | Operator has started work | `authorized` |
| `completed` | All services finished, invoice sent | `captured` after customer confirms |
| `partially_completed` | Some services completed, adjusted invoice sent | `captured` at adjusted amount |
| `cancelled` | Cancelled by operator or customer | `cancelled` — hold released |
| `no_show` | Customer absent at scheduled time | `captured` at 50% of affected services |

---

## Media Architecture

### Storage Buckets

| Bucket | Contents | Access |
|--------|---------|--------|
| `avatars` | User profile photos | Public read, authenticated write (own only) |
| `portfolio` | Detailer portfolio photos | Public read, authenticated write (detailer only) |
| `job-photos` | Before/after and damage photos | Authenticated read (booking participants), authenticated write (detailer/crew) |
| `documents` | Insurance, licenses, business docs | Authenticated read (owner only), authenticated write (owner only) |

### Image Handling

- Compression on upload: max 1200px wide, 85% quality JPEG
- Thumbnails generated via Supabase image transformation API for feed display
- Before/after photos stored with `booking_id/vehicle_id` in path for direct association and dispute evidence retrieval [v1.1]
- Damage photos stored with timestamp metadata baked into filename

---

## Security Architecture

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Unauthorized data access | RLS on all tables — enforced at database level |
| JWT tampering | Supabase validates JWT signature server-side on every request |
| Payment fraud | Stripe handles PCI compliance — no card data touches FOAM servers |
| Crew accessing owner data | Permission flags on crew_members table, enforced by RLS |
| Customer accessing other customer data | RLS policies scoped to auth.uid() |
| Prompt injection in AI workflows | AI_RULES.md defines boundaries; no user-generated content passed to AI without sanitization |
| Media access control | Storage bucket policies mirror RLS — unauthenticated access only to public buckets |
| Fraudulent chargebacks | Before/after photos mandatory before completion — auto-assembled into dispute evidence package [v1.1] |
| Repeat dispute abuse | customer_profiles.dispute_count tracked — suspension at threshold [v1.1] |
| Hold expiry gaps | stripe-hold-expire cron re-authorizes at T-48hrs — no silent expiry [v1.1] |

### Authentication Flow

```
User opens app
      │
      ├── No session → Onboarding → Email/Password or Social Login
      │                                     │
      │                              Supabase Auth creates session
      │                              JWT contains: user_id, role, email
      │                                     │
      └── Active session → JWT validated → Role-based navigator loads
                                │
                    RLS uses auth.uid() from JWT
                    to scope all database queries
```

---

## Environment Architecture

### Environments

| Environment | Purpose | Database |
|------------|---------|----------|
| Development | Local development in Replit | Supabase local or dev project |
| Staging | Pre-launch testing with real services | Separate Supabase project, Stripe test mode |
| Production | Live app | Production Supabase project, Stripe live mode |

### Environment Variables

Never committed to source control. Managed through Replit Secrets (development) and environment configuration in deployment.

```
# Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY  # Edge functions only — never client-side

# Stripe
STRIPE_PUBLISHABLE_KEY     # Client-safe
STRIPE_SECRET_KEY          # Server only — never client-side
STRIPE_WEBHOOK_SECRET      # Edge function webhook validation

# External APIs
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
GOOGLE_MAPS_API_KEY
TOMORROW_IO_API_KEY

# Expo
EXPO_PROJECT_ID
```

---

## Scalability Considerations

### Current Architecture Limitations

The current stack is optimized for launch and early traction — not for massive scale. Known constraints to be aware of:

- **Supabase connection pooling:** At high concurrent users, raw Postgres connections can bottleneck. Solution: Supabase's built-in PgBouncer connection pooler handles this up to ~10K concurrent connections.
- **Edge Function cold starts:** Supabase Edge Functions have ~50ms cold start latency. Acceptable for webhook handlers and cron jobs, not ideal for latency-sensitive real-time features.
- **Real-time at scale:** Supabase Realtime handles thousands of concurrent connections but has limits at very high scale. V2 GPS tracking will stress-test this.

### Scaling Path

The architecture doesn't need to change to scale from 0 to 10K bookings/month. It does need to evolve for 100K+:

1. **Caching layer** — Redis/Upstash for frequently-read detailer profiles and availability data
2. **Background jobs** — Move heavy processing from Edge Functions to a dedicated queue (BullMQ or similar)
3. **CDN for media** — Serve job photos and profile images through a CDN rather than direct Supabase Storage reads
4. **Read replicas** — Supabase read replicas for analytics queries that shouldn't hit the primary database

None of these are needed at launch. All are achievable without changing the core stack.

---

## Related Documents

| Document | What It Covers |
|----------|---------------|
| DATA_MODEL.md | Complete PostgreSQL schema with all tables, columns, and relationships |
| CAPABILITY_LAYER.md | Functional systems and their business logic |
| FEATURES.md | What gets built in MVP vs V2 |
| FOAM_Edge_Cases_Resolution.md | Resolution paths for all 6 identified failure scenarios |
| AI_RULES.md | How Claude is used in development |
| AI_CONFIDENCE_MODEL.md | How to weight AI architectural recommendations |
