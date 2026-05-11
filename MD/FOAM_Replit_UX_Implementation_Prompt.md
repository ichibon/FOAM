# FOAM — UX Implementation Prompt
## How to Use the Design Files from GitHub
## Version 1.0 — May 10, 2026

---

## OVERVIEW

The `/UX` folder in this repo contains all approved design screens for FOAM
exported as HTML files from UXPilot. These are pixel-perfect reference
designs — not throwaway wireframes. Every color, spacing, font, icon, and
interaction has been approved and should be implemented as close to 1:1
as possible in React Native.

This prompt tells you:
1. What's in each folder and what it maps to in the codebase
2. How screens connect to each other (navigation flow)
3. What each screen needs to do functionally (not just how it looks)
4. Auth setup instructions (Supabase email/password — no OAuth yet)
5. What to build first and in what order

---

## DESIGN SYSTEM REFERENCE

All screens use the FOAM design system. Before implementing any screen,
internalize these values — they appear everywhere:

```
Primary color:     FOAM Blue     #339DC7
Background:        Off-white     #FAFAFA
Card background:   White         #FFFFFF
Border:            Subtle gray   #E4E4E7
Text primary:      Near black    #0A0A0A
Text secondary:    Gray          #525252
Text tertiary:     Light gray    #A3A3A3
Success green:                   #16A34A
Warning amber:                   #D97706
Error red:                       #DC2626
Accent subtle:     Blue tint     #E1F0F7

Headlines:         Playfair Display — emotional moments, first-run states,
                   celebration screens, and the "You're live." approved screen
Body / UI:         Inter — all functional text, labels, CTAs, navigation

Corner radius:     Cards 16px · Inputs 12px · Buttons 8px · Pills 9999px
Shadows:           Level 1: 0 1px 3px rgba(0,0,0,0.08)
                   Level 2: 0 4px 12px rgba(0,0,0,0.10)
                   Level 3: 0 8px 24px rgba(0,0,0,0.12)
Bottom nav height: 83px (includes safe area)
Standard CTA:      48px height · full width · 8px radius · Inter 14px 600
Tab bar icons:     Lucide (rounded variant)
```

---

## FOLDER STRUCTURE & SCREEN MAPPING

### `/UX/Onboarding`

These screens handle ALL pre-auth and role-selection flows.
Maps to: `app/onboarding/` in the scaffold.

**Screens and what they do:**

| File | Screen Name | Route | What It Does |
|------|-------------|-------|-------------|
| Splash | Splash | `/onboarding/splash` | FOAM logo animation, 1.5s, auto-advances |
| Welcome | SignUpOrLogin | `/onboarding/welcome` | Two CTAs: "Create Account" / "Log In". Email + password fields. No OAuth yet — see Auth section below. |
| Role Fork | RoleFork | `/onboarding/role` | "What brings you here?" — 3 cards: Book a detail / Grow my business / Join a crew. Sets role in Supabase users table. |
| Customer Step 1 | AddVehicle | `/onboarding/customer/vehicle` | Make, model, year, color. Saves to vehicles table. |
| Customer Step 2 | AddPayment | `/onboarding/customer/payment` | Stripe Elements card form. Creates Stripe customer via stripe-create-customer Edge Function. |
| Customer Step 3 | LocationPermission | `/onboarding/customer/location` | Native location permission request. |
| Customer Complete | CustomerSetupComplete | `/onboarding/customer/complete` | "You're all set." → navigates to CustomerNavigator |
| Operator Step 1 | OperationType | `/onboarding/operator/type` | Mobile / Fixed / Both — sets operation_type on detailer_profiles |
| Operator Build Operation | BuildOperation | `/onboarding/operator/build` | Multi-unit builder screen. "Add a Van" and "Add a Location" open bottom drawers. |
| Add Van Drawer | AddVanDrawer | (bottom drawer) | Name, license plate, home base, service radius, availability, equipment notes. Saves to business_assets. |
| Add Location Drawer | AddLocationDrawer | (bottom drawer) | Name, address, bay count, hours, walk-in toggle. Saves to business_locations. |
| Operator Step 3 | ServiceMenu | `/onboarding/operator/services` | Add at least one service with name + price. Saves to service_packages. |
| Operator Step 4 | StripeConnect | `/onboarding/operator/stripe` | "Connect with Stripe" button. Calls stripe-create-connect-account Edge Function. Uses Account Sessions + embedded AccountOnboarding component from @stripe/stripe-react-native. |
| Operator Pending | OperatorPending | `/onboarding/operator/pending` | "You're in the queue." Clock icon. Checklist of what was submitted. Shows while approval_status = 'pending' or 'under_review'. |
| Crew Step 1 | EnterInviteCode | `/onboarding/crew/invite` | 6-character code input. Validates against team_members table invite_code column. |
| Crew Step 2 | CrewProfile | `/onboarding/crew/profile` | Name, profile photo. |
| Crew Pending | CrewPending | `/onboarding/crew/pending` | "Waiting on your manager." Checklist showing account created ✓, invite code verified ✓, manager approval ⏱. |

---

### `/UX/Customer Booking Flow`

The end-to-end booking experience for customers.
Maps to: `app/customer/` screens launched from Discover tab.

**Flow sequence:**

```
DiscoverFeed
    → OperatorProfile (tap operator card)
        → BookingStep1_SelectService (tap "Book")
            → BookingStep2_ConfirmLocation
                → BookingStep3_DateTime
                    → BookingStep4_ReviewAndPay
                        → BookingConfirmation
```

| File | Screen Name | What It Does |
|------|-------------|-------------|
| Discover Feed | DiscoverFeed | Map + list of operators. "Come to me" / "I'll go there" filter chips. Calls Supabase to get operators within radius. First-run empty state: "Let's find you a detailer." |
| Operator Profile | OperatorProfile | Operator's public profile. Services, pricing, ratings, photos, "Book [Name]" CTA. |
| Booking Step 1 | SelectService | Multi-vehicle, multi-service selector. Each vehicle card expands to show services. Saves to booking_vehicles and booking_vehicle_services. |
| Booking Step 2 | ConfirmLocation | "Where should they come to you?" — Home / Work / Somewhere else. Or drop-off address for fixed location. |
| Booking Step 3 | SelectDateTime | Calendar + time slot picker. Slots generated from operator's availability. |
| Booking Step 4 | ReviewAndPay | Full booking summary. Calls stripe-create-payment-intent Edge Function on "Confirm & Pay" tap. Opens Stripe payment sheet. Creates booking in 'confirmed' status on success. |
| Booking Confirmation | BookingConfirmation | "You're on the books." Operator details, date/time, add to calendar CTA. |

**Customer Bookings Tab screens:**

| File | Screen Name | What It Does |
|------|-------------|-------------|
| Bookings List | BookingsList | Upcoming / History tabs. Reads bookings table where customer_id = current user. |
| Active Booking | ActiveBooking | ETA tracker, operator info, contact (via in-app message — no raw phone number). |
| Job Complete (customer) | PostJobComplete | "Your car is fresh." Tip prompt. Payment confirmation. Routes to PostJobReview. |
| Post-Job Review | PostJobReview | Star rating + optional text. Saves to reviews table. |
| Booking Detail | BookingDetail | Full job record, before/after photos, receipt, "Book Again" CTA. |

**Customer Profile Tab screens:**

| File | Screen Name | What It Does |
|------|-------------|-------------|
| Profile Home | CustomerProfile | Name, member since, stats. Links to sub-screens. |
| My Vehicles | MyVehicles | List of saved vehicles. "No rides added yet." first-run empty state. |
| Payment Methods | PaymentMethods | Saved Stripe payment methods. |
| Account Settings | AccountSettings | Name, email, phone, password change, delete account. |

---

### `/UX/Solo Operator`

The core operator experience. Covers Today Tab, Bookings, Customers, Business, and Profile.
Maps to: `app/operator/`

**Today Tab flow:**

```
TodayOverview (Today tab default)
    → ActiveJob (tap job card)
        → BeforePhotos (tap "Upload Before Photos")
            → AfterPhotosAndComplete (tap "Mark Job Complete")
                → JobComplete ("Complete & Send Invoice")
                    → PaymentDetailDrawer (tap completed job card)
```

| File | Screen Name | What It Does |
|------|-------------|-------------|
| Today Overview | TodayOverview | Chronological job list. Availability toggle in header. "Wide open today." first-run empty state. Earnings summary row at bottom ($0/$0/$0 when empty). |
| Active Job | ActiveJob | Customer info, vehicle, services, map. "Upload Before Photos" primary CTA. |
| Before Photos | BeforePhotos | Camera capture. Required before job can be marked complete. Saves photos to storage linked to booking_vehicles. |
| After Photos + Complete | AfterPhotosAndComplete | After photo upload + "Complete & Send Invoice" CTA. Calls stripe-capture Edge Function. |
| Job Complete | JobComplete | "Job Complete." stats. First payment: confetti + "Your first payment." celebration (check first_payment_celebrated flag). |
| Payment Drawer - Pending | PaymentDrawer_Pending | Bottom drawer. "Payment Pending" state. Amount, job summary. |
| Payment Drawer - Received | PaymentDrawer_Received | Bottom drawer. "Payment Received" state. Amount + tip reveal. |
| New Booking Request | NewBookingRequest | Accept / Decline with one tap. Shows service, customer, date/time, vehicle. |
| Booking Detail | OperatorBookingDetail | Full job info. Customer history. Edit / cancel options. |
| Customer List | CustomerList | All-time clients. "Your first customer is out there." first-run empty state. |
| Customer Profile | OperatorCustomerProfile | Vehicle info, service history, notes, contact button. |
| Business Overview | BusinessOverview | Period filter chips. Stacked bar chart (service + tip segments). Revenue stats. Next payout card. "No earnings yet today." empty state. |
| Payout History | PayoutHistory | All Stripe payouts. |
| Service Menu | ServiceMenu | Packages + pricing. "No services yet." first-run empty state with tip card. |
| Reviews | Reviews | All ratings. Reply to reviews. "No reviews yet." empty state. |
| Profile Home | OperatorProfile | Public profile preview. Edit profile link. Share profile link. |
| Edit Profile | EditProfile | Name, bio, portfolio photos. |
| Service Radius | ServiceRadius | Map-based radius slider. Only shown if operation_type = 'mobile' or 'hybrid'. |
| Availability | AvailabilitySchedule | Default hours + blocked dates. |
| Location Config | LocationConfig | Address, bay count, hours, walk-in toggle. Only shown if operation_type = 'fixed' or 'hybrid'. |
| Bank & Payout | BankAndPayout | Stripe Connect account status. Instant Payout toggle. |
| Subscription Plan | SubscriptionPlan | Current tier (Starter/Pro/Crew). Upgrade options. |

**Operator Approval States (also in this folder — see also `/UX/Operator Approval - Crew Invite`):**

The operator profile shows a pending banner when approval_status = 'pending' or 'under_review'.
When approval_status = 'approved', the banner disappears and the profile goes live in discovery.

---

### `/UX/Team Manager`

The manager experience. 5-tab navigator. Today is the command center.
Maps to: `app/operator/` with manager sub-navigator (role = 'manager').

**Today Tab flow:**

```
OperationsOverview (default)
    → UnassignedJobs (section or stack)
        → JobAssignment (tap unassigned job)
    → LiveJobAlerts (section or stack)
```

| File | Screen Name | What It Does |
|------|-------------|-------------|
| Operations Overview | ManagerTodayOverview | Jobs in progress, team status chips, unassigned count, three-column summary. "Nothing on the board yet." first-run empty state with numbered onboarding steps. |
| Unassigned Jobs | UnassignedJobs | Bookings needing crew assignment. "All jobs assigned." success empty state. |
| Job Assignment | JobAssignment | Assign booking to crew member. See their current load. |
| Live Alerts | LiveJobAlerts | Real-time issues — late, flagged, complaint. "All clear." success empty state. |
| Team Overview | TeamOverview | All crew members. Status per person. Today's schedule. "No crew yet." first-run empty state with numbered steps + dashed invite button. |
| Member Profile | MemberProfile | Individual crew performance, jobs, earnings, ratings. |
| Add Team Member | AddTeamMember | Invite by phone/email or share invite code. After send: "✓ Invite sent" confirmation state. |
| Commission Rules | CommissionRules | Pay model selector per crew member (Commission/Hourly/Flat Rate). Tip distribution rules. Manual payment drawer. |
| Team Calendar | TeamCalendar | Week view. All members. All jobs. Filterable by person. "Nothing scheduled this day." empty state. |
| Manager Bookings | ManagerBookingsList | All team bookings. Filter by crew member chips. |
| Manager Booking Detail | ManagerBookingDetail | Full job info. Assign / reassign / cancel. |
| Business Overview (Manager) | ManagerBusinessOverview | Total revenue + per-member breakdown. "By Team Member" section. Same period filter as Operator. |
| Payroll Summary | PayrollSummary | What each member earned. Commission / tips / manual payment line items. "Mark as Paid" CTA. "Nothing to pay out." empty state. |

---

### `/UX/Team Member`

The crew experience. Intentionally minimal. 3-tab navigator.
Maps to: `app/team_member/`

| File | Screen Name | What It Does |
|------|-------------|-------------|
| Today's Jobs | TodaysJobs | Chronological job list. "No jobs today." empty state. Welcome banner after approval. |
| Job Detail (crew) | CrewJobDetail | Customer name, vehicle, services, location. No customer phone. Manager notes. Navigate CTA (one tap → Maps). Add service button → opens modification request. |
| Before Photos (crew) | CrewBeforePhotos | Required before marking in-progress. |
| After Photos + Complete (crew) | CrewAfterPhotosAndComplete | After photos + job submission. Shows read-only payment summary before submitting so crew can tell customer total face-to-face. |
| Flag an Issue | FlagIssue | Problem type selector + notes. Submits to manager immediately. |
| Earnings Overview | CrewEarningsOverview | Current period earnings. Period filter chips. "$0 / Earned This Week" zeroed state with pay period card. "Your first earnings are coming." first-run empty state. |
| Past Periods | CrewPastPeriods | Historical payouts. Read only. |
| Crew Profile | CrewProfile | Name, photo, account settings only. |

---

### `/UX/Operator Approval - Crew Invite`

All screens for the operator approval flow and crew invite acceptance flow.
These are triggered by events, not direct navigation.

**Operator Approval Flow:**

| File | Screen Name | Trigger | What It Does |
|------|-------------|---------|-------------|
| Re-Entry Pending | OperatorPendingReEntry | App open while approval_status = 'pending' | Today tab shows pending banner + checklist. "View status →" links to status detail. |
| Approval Status Detail | ApprovalStatusDetail | "View status →" tap | Shows full checklist: Identity ✓, Profile ✓, Stripe ✓, FOAM review ⏱. Optional badge upload (License, Insurance). |
| Approved Screen | OperatorApproved | approval_status changes to 'approved' (via webhook or polling) | "You're live." — Playfair 36px, largest headline in app. Confetti. Badge pills. "See My Profile" CTA. |
| Rejected Screen | OperatorRejected | approval_status = 'rejected' | "One more thing." — Warning amber, NOT red. Lists specific issues with "Fix this →" links. "Fix & Resubmit" CTA. |
| Resubmission Pending | OperatorResubmitPending | After operator fixes issues and resubmits | Same as re-entry pending but copy reflects round 2. Motivation note: "Most resubmissions approved within a few hours." |

**Crew Invite Flow:**

| File | Screen Name | Trigger | What It Does |
|------|-------------|---------|-------------|
| Invite Sent Confirmation | InviteSentConfirmation | After manager taps "Send Invite" | Add Team Member screen updates — button becomes "✓ Invite sent to [email/phone]" success state. |
| SMS Invite Mockup | (reference only) | — | Shows what the crew member receives. Not an in-app screen. |
| Deep Link Landing | CrewDeepLinkLanding | Crew taps SMS/email link | Shows manager's business name and invite context BEFORE account creation. "Create Account" / "I already have an account" CTAs. |
| Manager Pending Card | ManagerPendingCrewCard | crew invite_status = 'pending' | Pending card at top of Team tab. Warning amber left border. "Approve" / "Decline" inline. Badge on Team tab icon. |
| Crew Approved State | CrewApprovedState | Manager taps "Approve" | My Jobs tab shows welcome banner: "You're in! Welcome to [Business Name]." Toast on manager's Team tab: "✓ [Name] approved and added to your team." |

---

### `/UX/Empty States`

12 first-run empty state screens. These are NOT standalone screens —
they are states within existing screens. Reference the designs to implement
the `EmptyState` component variant correctly for each screen.

**Implementation rule:** Every screen that can be empty MUST use the
`EmptyState` component. Props (icon, headline, body, ctaLabel, ctaRoute,
variant) are documented in `FOAM_Empty_States_Inventory.md`.

**First-run vs functional:**
- `first_run` variant: Playfair Display headline, icon in 80px Accent Subtle circle, pill-shaped CTA
- `functional` variant: Inter headline, bare icon (no circle), standard button CTA

**First-run flags on `users` table** — check these before rendering:
```
first_run_today_seen          → Operator/Manager/Crew Today tab
first_run_bookings_seen       → Operator/Customer Bookings tab
first_run_customers_seen      → Operator Customers tab / Manager Team tab
first_run_discover_seen       → Customer Discover tab
first_run_vehicles_seen       → Customer Vehicles screen
first_run_service_menu_seen   → Operator Service Menu
first_run_earnings_seen       → Crew Earnings tab
first_run_team_seen           → Manager Team tab
```

Set flag to `true` immediately after first render. Never reset.

---

### `/UX/Error States`

8 error state screens. 5 are bottom drawers, 3 are full-screen blocking.

**Implementation rule:** Use `ErrorDrawer` (bottom sheet) for payment errors.
Use `ErrorState` (full screen) for blocking errors. All other errors use the
`ErrorState` component inline per `FOAM_Error_States_Inventory.md`.

**The 5 bottom drawer errors** slide up over the current screen — the
booking or business context is still visible behind the backdrop (40% opacity).
The drawer contains an inline card form (Stripe Elements) for payment errors.

| File | Component | When Shown |
|------|-----------|-----------|
| Card Declined | ErrorDrawer | Payment sheet fails — card declined |
| Payment Capture Failed | ErrorDrawer | Job complete but payment capture failed post-service |
| Authorization Hold Failed | ErrorDrawer | Card auth fails at booking confirmation |
| Stripe Not Connected | ErrorDrawer | Operator tries to receive payout without Stripe connected |
| Payout Failed | ErrorDrawer | Stripe payout attempt fails |
| No Internet | ErrorState (full screen) | App detects no connectivity |
| Account Suspended | ErrorState (full screen) | approval_status = 'suspended' |
| App Update Required | ErrorState (full screen) | App version too old |

**Drawer backdrop:** `rgba(0,0,0,0.40)` — slightly darker than standard
drawers to signal urgency. The background screen stays visible behind it.

---

### `/UX/FOAM Admin`

The FOAM ops internal web dashboard for reviewing and approving operators.
This is a **web app**, not part of the React Native app.

**Do not implement this in React Native.** Build it as a separate Next.js
page or simple web app. It needs:

1. Password-protected login (environment variable password is fine at launch)
2. A list of operators where `approval_status = 'pending' OR 'under_review' OR 'resubmitted'`
3. Each operator card shows: name, email, profile photo, service menu (count), Stripe Connect status, badge uploads (license, insurance)
4. Two action buttons per operator: "Approve" and "Reject"
5. Reject triggers a reason input — maps to `rejection_reasons` JSONB on `detailer_profiles`
6. Approve sets `approval_status = 'approved'`, `approved_at = now()`, `badge_verified = true`
7. Reject sets `approval_status = 'rejected'`
8. Both actions update the record via Supabase service role client (bypasses RLS)

---

## NAVIGATION & SCREEN CONNECTION MAP

How screens connect to each other across the full app:

```
App Open
    │
    ├── No session → OnboardingStack
    │       Splash → Welcome → RoleFork
    │           → Customer: AddVehicle → AddPayment → LocationPermission → CustomerSetupComplete
    │           → Operator: OperationType → BuildOperation → ServiceMenu → StripeConnect → OperatorPending
    │           → Crew: EnterInviteCode → CrewProfile → CrewPending
    │
    └── Active session → Read JWT role
            │
            ├── 'customer' → CustomerNavigator
            │       Tab 1 Discover: DiscoverFeed → OperatorProfile → Booking Steps 1-4 → BookingConfirmation
            │       Tab 2 Bookings: BookingsList → ActiveBooking → PostJobComplete → PostJobReview
            │                                    → BookingDetail
            │       Tab 3 Profile: CustomerProfile → MyVehicles → PaymentMethods → AccountSettings
            │
            ├── 'operator' → OperatorNavigator
            │   [IF approval_status ≠ 'approved']: Show pending banner on Today tab
            │   [IF approval_status = 'approved']: Full experience
            │       Tab 1 Today:    TodayOverview → ActiveJob → BeforePhotos → AfterPhotosAndComplete
            │                                     → JobComplete → PaymentDetailDrawer
            │                       NewBookingRequest (deep link or notification)
            │       Tab 2 Bookings: BookingsList → BookingDetail → NewBookingRequest
            │       Tab 3 Customers: CustomerList → CustomerProfile
            │       Tab 4 Business: BusinessOverview → PayoutHistory → ServiceMenu → Reviews
            │       Tab 5 Profile:  OperatorProfile → EditProfile → ServiceRadius → AvailabilitySchedule
            │                                       → LocationConfig → BankAndPayout → SubscriptionPlan
            │                                       → Locations & Vans (multi-unit)
            │
            ├── 'manager' → ManagerNavigator
            │       Tab 1 Today:    ManagerTodayOverview → UnassignedJobs → JobAssignment
            │                                            → LiveJobAlerts
            │       Tab 2 Team:     TeamOverview → MemberProfile → AddTeamMember
            │                                    → CommissionRules → TeamCalendar
            │       Tab 3 Bookings: ManagerBookingsList → ManagerBookingDetail
            │       Tab 4 Business: ManagerBusinessOverview → PayrollSummary → CustomerComplaintView
            │       Tab 5 Profile:  [Same as Operator Profile]
            │
            └── 'team_member' → CrewNavigator
                    [IF invite_status ≠ 'approved']: Show "You're almost in." pending state
                    [IF invite_status = 'approved']: Full experience
                    Tab 1 My Jobs:  TodaysJobs → CrewJobDetail → CrewBeforePhotos
                                               → CrewAfterPhotosAndComplete → FlagIssue
                    Tab 2 Earnings: CrewEarningsOverview → CrewPastPeriods
                    Tab 3 Profile:  CrewProfile → AccountSettings
```

---

## BOTTOM DRAWERS — GLOBAL PATTERN

Several interactions throughout the app use bottom drawers (bottom sheets).
All drawers follow this spec:

```
Border radius:  20px top corners only
Drag handle:    32px wide × 4px tall, #D4D4D8, centered 8px from top
Background:     #FFFFFF
Shadow:         Level 3 (0 8px 24px rgba(0,0,0,0.12))
Standard backdrop: rgba(0,0,0,0.30)
Error backdrop:    rgba(0,0,0,0.40)
Animation:      Slide up 280ms ease-out
```

Drawers used throughout the app:
- Payment Detail Drawer (operator Today tab — completed job card)
- Add Van Drawer (onboarding + Profile → Locations & Vans)
- Add Location Drawer (onboarding + Profile → Locations & Vans)
- Edit Van Drawer (same component as Add Van, pre-populated)
- Edit Location Drawer (same component as Add Location, pre-populated)
- Card Declined / Payment Errors (ErrorDrawer — 5 variants)
- Manual Payment Drawer (Commission Rules screen)

---

## AUTH SETUP — EMAIL + PASSWORD ONLY (NO OAUTH YET)

Google and Apple OAuth are NOT set up yet. Do not implement OAuth flows.
The Sign Up / Log In screen should use email + password only.

**What to implement on the Welcome screen:**

```tsx
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      full_name: fullName,
    }
  }
})

// Log In
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
})
```

**Remove from the Welcome screen design:**
- "Continue with Apple" button
- "Continue with Google" button
- Any OAuth-related divider ("or continue with")

**Replace with:**
- Email input field
- Password input field
- "Create Account" / "Log In" toggle (two modes on same screen)
- "Forgot password?" link → triggers `supabase.auth.resetPasswordForEmail(email)`

**After successful auth:**
```tsx
// Check if user has a role already
const { data: user } = await supabase
  .from('users')
  .select('role, onboarding_complete')
  .eq('id', session.user.id)
  .single()

if (!user.onboarding_complete) {
  router.replace('/onboarding/role')  // New user → role fork
} else {
  // Route to correct navigator based on role
  router.replace(`/${user.role}/`)
}
```

**Role is stored in `users.role`** — NOT in the Supabase JWT by default.
Read it from the database on login, not from the JWT claim, until a custom
JWT hook is set up.

**Password requirements:** Minimum 8 characters. Show inline validation.

**OAuth will be added later.** When it is, Google and Apple buttons
will appear on the Welcome screen above the email/password fields with
an "or" divider. No code changes needed beyond adding the OAuth handlers.

---

## IMPLEMENTATION ORDER

Build in this sequence. Each phase depends on the previous one being stable.

### Phase 1 — Foundation (do first)
1. Auth flow: Welcome screen (email/password only) → role detection → correct navigator
2. Onboarding: Splash → RoleFork → all three setup branches → pending states
3. Empty states component: Build `EmptyState` with `first_run` and `functional` variants
4. Error states component: Build `ErrorState` and `ErrorDrawer`

### Phase 2 — Operator Core
5. Operator Today tab: TodayOverview → ActiveJob → BeforePhotos → AfterPhotosAndComplete → JobComplete
6. Payment drawer: Pending + Received states + first-payment confetti
7. Operator Bookings tab: List → Detail → Accept/Decline
8. Operator Business tab: Overview → Service Menu

### Phase 3 — Customer Flow
9. Customer Discover tab: DiscoverFeed → OperatorProfile
10. Customer Booking Flow: Steps 1-4 → Confirmation (with Stripe payment sheet)
11. Customer Bookings tab: List → Active → Complete → Review

### Phase 4 — Manager + Crew
12. Manager Today tab: Operations overview → Unassigned → Assignment
13. Manager Team tab: Overview → Add Member → Commission Rules
14. Crew My Jobs: Today's Jobs → Job Detail → Photos → Complete
15. Crew Earnings tab

### Phase 5 — Approval Flows + Edge Cases
16. Operator approval states: pending banner → status detail → approved → rejected
17. Crew invite flow: deep link landing → manager pending card → approved state
18. Error drawers: Card declined, payment capture failed, Stripe not connected
19. Blocking error states: No internet, account suspended, app update required

### Phase 6 — Multi-Unit + Admin
20. Multi-unit operator UI: Unit selector chips on Today + Business tabs
21. Locations & Vans profile screen with edit drawers
22. FOAM Admin web dashboard (separate from React Native app)

---

## SUPABASE PROJECT

Project ID: `yteffvegixoqvjoykwzx`
URL: `https://yteffvegixoqvjoykwzx.supabase.co`
Already configured: auth, all tables, RLS policies, all Edge Functions

**Read role from database (not JWT):**
```typescript
const { data: userRecord } = await supabase
  .from('users')
  .select('role, onboarding_complete, first_run_today_seen, first_payment_celebrated')
  .eq('id', session.user.id)
  .single()
```

**Check operator approval status:**
```typescript
const { data: profile } = await supabase
  .from('detailer_profiles')
  .select('approval_status, operation_type, is_multi_unit, subscription_tier')
  .eq('user_id', session.user.id)
  .single()
```

**Check crew invite status:**
```typescript
const { data: member } = await supabase
  .from('team_members')
  .select('invite_status, manager_id, pay_model')
  .eq('user_id', session.user.id)
  .single()
```

---

## EDGE FUNCTIONS (ALL LIVE)

Call these from the app — do not re-implement their logic client-side:

| Function | URL | When to Call |
|----------|-----|-------------|
| `stripe-create-customer` | `/functions/v1/stripe-create-customer` | Customer completes payment setup in onboarding |
| `stripe-create-connect-account` | `/functions/v1/stripe-create-connect-account` | Operator reaches Stripe Connect step in onboarding |
| `stripe-create-payment-intent` | `/functions/v1/stripe-create-payment-intent` | Customer taps "Confirm & Pay" on Booking Step 4 |
| `stripe-capture` | `/functions/v1/stripe-capture` | Operator/crew taps "Complete & Send Invoice" |
| `booking-cancelled` | `/functions/v1/booking-cancelled` | Any booking cancellation by any party |
| `booking-modification-request` | `/functions/v1/booking-modification-request` | Manager approves or rejects a crew service addition |
| `no-show-report` | `/functions/v1/no-show-report` | Operator reports customer as no-show |
| `no-show-confirm` | `/functions/v1/no-show-confirm` | Operator confirms no-show after 10-min grace period |

---

## KEY RULES TO FOLLOW

1. **Pixel-perfect from the HTML files.** If the design shows a 16px card
   radius, implement 16px. Do not approximate.

2. **Never use placeholder text for copy.** All copy is finalized in the
   HTML files. Implement exactly what's shown — every headline, label, CTA,
   and empty state message.

3. **Playfair Display only for emotional moments.** Tab bar labels, form
   labels, and functional UI always use Inter. Playfair is reserved for:
   celebration screens, first-run empty state headlines, "You're live.",
   "Wide open today.", "You're offline." blocking screens.

4. **Every screen that can be empty must use `EmptyState`.**
   Never show a blank white screen.

5. **Bottom navigation is 83px.** Respect iOS safe area — content must
   not overlap the tab bar.

6. **Do not implement OAuth yet.** Email + password only on the Welcome
   screen. Apple and Google OAuth will be added later.

7. **Role routing is strict.** A `customer` should never see operator
   screens. A `team_member` should never see business financials. RLS
   in Supabase enforces this at the data layer — the app enforces it
   at the navigation layer.

8. **Before/after photos are mandatory before job completion.**
   The "Mark Job Complete" or "Complete & Send Invoice" CTA must be
   disabled until at least one before photo and one after photo are uploaded.
   These are dispute evidence — enforcing this is a functional requirement.
