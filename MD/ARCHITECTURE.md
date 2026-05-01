# FOAM — Architecture

> This document is the architectural overview of the entire FOAM platform. It connects the stack, the systems, the data flow, and the decision rationale in one place. Use this as the map before going deep into any individual component.

---

## Architectural Philosophy

FOAM is built on three principles that drive every technical decision:

**1. Mobile-native from day one.** The product lives on a phone. Every architectural choice — from API response shape to image compression to notification delivery — is optimized for a mobile client on a variable network connection, not a desktop browser.

**2. Supply-side first.** The detailer experience is the product's moat. The architecture prioritizes the reliability and depth of the operator OS — booking engine, payment infrastructure, crew management — before scaling the customer discovery layer.

**3. Build for the loop, not the feature.** The core loop is: customer books → detailer fulfills → payment processes → review submitted. Every system exists to make that loop fast, reliable, and repeatable. Features that don't serve the loop are V2.

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

### Single App, Three Role-Based Experiences

One React Native app. One download. Three completely distinct navigation experiences driven by the authenticated user's role.

```
App Entry
    │
    ├── Unauthenticated → Onboarding Flow → Role Selection
    │
    └── Authenticated
            │
            ├── role: 'customer'  → Customer Navigator
            │       ├── Discover Tab
            │       ├── Bookings Tab
            │       ├── Messages Tab (V2)
            │       └── Profile Tab
            │
            ├── role: 'detailer'  → Detailer Navigator
            │       ├── Today Tab
            │       ├── Bookings Tab
            │       ├── Customers Tab
            │       ├── Business Tab
            │       └── Profile Tab
            │
            └── role: 'crew'      → Crew Navigator
                    ├── My Jobs Tab
                    ├── Earnings Tab
                    └── Profile Tab
```

Role is stored in the `users` table and embedded in the Supabase JWT as a custom claim. The React Native app reads the claim on auth and routes to the correct navigator. Role cannot be self-modified — crew accounts are provisioned by owner accounts.

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

### Edge Functions (Server-Side Logic)

Operations that require server-side execution run as Supabase Edge Functions (Deno runtime):

| Function | Trigger | Purpose |
|----------|---------|---------|
| `stripe-webhook` | Stripe webhook event | Handle payment confirmations, subscription changes, failed payments |
| `booking-confirmed` | Booking status → confirmed | Send confirmation push + SMS to customer and detailer |
| `appointment-reminder` | Scheduled cron | 24hr and 1hr reminders for upcoming bookings |
| `rain-check` | Scheduled cron (daily) | Query weather API for completed bookings in past 72hrs, trigger Rain Coverage claims |
| `review-request` | Booking status → completed | Send review request push + SMS 1hr after completion |
| `lapsed-customer` | Scheduled cron (weekly) | Identify customers 60+ days without booking, queue re-engagement (V2) |
| `payout-summary` | Scheduled cron (weekly) | Generate detailer payout reports |

---

## Data Architecture

### Database Design Principles

- All primary keys are UUIDs generated server-side
- All timestamps are `timestamptz` (timezone-aware)
- Soft deletes where data integrity matters (bookings, customers) — `is_active` flag rather than hard delete
- Denormalized fields for read performance (`avg_rating`, `total_reviews` on `detailer_profiles`) — updated via triggers
- Foreign keys enforced at the database level, not just application level

### Core Entity Relationships

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
bookings (1) ──────────── (many) booking_photos
bookings (1) ──────────── (many) booking_addons
```

Full schema with all columns: see [[Data-Model]]

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

## Payment Architecture

### The Money Flow

```
Customer pays
      │
      ▼
Stripe Payment Intent created
      │
      ▼
Funds held by Stripe
      │
      ▼
Job completed (detailer marks done)
      │
      ▼
Stripe captures payment
      │
      ├── Platform fee deducted (per PRICING_STRATEGY.md)
      │
      └── Net amount transferred to detailer's Stripe Connect account
                │
                ▼
          Detailer's bank account (standard Stripe payout schedule)
```

### Stripe Connect — Express Accounts

Detailers onboard via Stripe Connect Express — the fastest path to getting detailers paid without FOAM handling KYC directly. Stripe handles:
- Identity verification
- Bank account linking
- Tax reporting (1099-K)
- Payout scheduling

FOAM handles:
- Platform fee deduction before transfer
- Tip routing (tip goes to detailer's Connect account in full)
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

### Notification Priority by Type

| Notification | Push | SMS | In-App |
|-------------|------|-----|--------|
| Booking confirmed | ✅ | ✅ | ✅ |
| 24-hour reminder | ✅ | ✅ | ✅ |
| 1-hour reminder | ✅ | ❌ | ✅ |
| En route (V2) | ✅ | ❌ | ✅ |
| Job complete | ✅ | ❌ | ✅ |
| Review request | ✅ | ✅ | ✅ |
| Payment received | ✅ | ❌ | ✅ |
| Rain Coverage triggered | ✅ | ✅ | ✅ |
| New booking (detailer) | ✅ | ✅ | ✅ |

SMS is reserved for high-priority customer-facing notifications where a missed push could break the experience (confirmation and reminder). Everything else is push + in-app only.

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
- Before/after photos stored with appointment ID in path for direct association
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
| [[Data-Model]] | Complete PostgreSQL schema with all tables, columns, and relationships |
| [[Capability-Layer]] | Functional systems and their business logic |
| [[Features]] | What gets built in MVP vs V2 |
| [[AI-Rules]] | How Claude is used in development |
| [[AI-Confidence-Model]] | How to weight AI architectural recommendations |
