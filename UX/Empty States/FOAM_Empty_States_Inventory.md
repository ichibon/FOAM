# FOAM — Empty States Inventory
**Version 1.0 · Task 9 · All 6 Roles**

---

## Philosophy

Empty states are not broken screens. They are brand moments — the first meaningful thing most new users see after completing onboarding, and the thing every user sees when something temporarily has no data. Every empty state in FOAM has a clear next step. None of them are dead ends.

---

## The Unified EmptyState Component

One component. Context-aware props. Two visual modes.

FOAM uses a single `EmptyState` component across all screens, all roles, and all states. The screen never changes structurally. The content — icon, headline, body, CTA — is passed as props from the calling screen based on the user's role and current context.

### Props

```typescript
interface EmptyStateProps {
  variant: 'first_run' | 'functional'
  icon: string              // Lucide icon name, e.g. 'calendar-days'
  headline: string          // Max 5 words
  body: string              // Max 2 lines, max-width 280px
  ctaLabel: string          // Primary CTA button label
  ctaRoute: string          // Navigation route on CTA tap
  ghostLabel?: string       // Optional ghost CTA label
  ghostRoute?: string       // Optional ghost CTA route
  fullScreen?: boolean      // Default: true. Set false when rendering inside a tab screen that keeps its header/nav chrome.
}
```

### Visual Modes

Two modes. Different emotional weight. Same structural bones.

| Property | first_run | functional |
|----------|-----------|------------|
| Headline font | Playfair Display 24px 700 | Inter 20px 600 |
| Icon treatment | 48px FOAM Blue inside 80px Accent Subtle circle (#E1F0F7) | 48px #A3A3A3 (Text Tertiary), bare — no circle |
| CTA shape | Pill (9999px radius, 48px height, 24px h-padding) | Standard (8px radius, 48px height, full width) |
| White space | 40px icon to headline · 16px headline to body · 32px body to CTA | 24px icon to headline · 12px headline to body · 24px body to CTA |
| Background | #FAFAFA full screen | #FAFAFA — content area only if fullScreen=false |
| Trigger | First-ever visit, controlled by flag in users table | All subsequent visits when screen has no data |

### Success States (Special Case)

Some functional empty states signal a positive condition — no unassigned jobs, no active alerts. These use the same component with the icon color overridden to Success green (#16A34A) and a slightly warmer headline tone.

```typescript
// Example: all jobs assigned
<EmptyState
  variant="functional"
  icon="shield-check"
  iconColor="#16A34A"  // override Text Tertiary with Success green
  headline="All clear."
  body="No issues on any active jobs right now."
  ctaLabel="View Today"
  ctaRoute="/manager/today"
/>
```

### Implementation Notes

- First-run flags live on the `users` table. Set to `true` on first render of the empty state. Never reset.
- The component checks the flag before rendering — if `first_run_X_seen = false`, renders `first_run` variant and sets flag. All subsequent renders use `functional` variant.
- `fullScreen=false` renders the component in a content area, not the full viewport. The calling screen provides its own header, tab bar, and any persistent chrome. Use this for tab screens like Today and Team.
- Never use this component for loading states — loading has its own skeleton component.
- Never use this component for error states — errors have a separate ErrorState component with retry logic.

---

## Component Usage Example

```tsx
// Today tab — no jobs, first visit, solo mobile operator
<EmptyState
  variant="first_run"
  icon="calendar-days"
  headline="Wide open today."
  body="Share your booking link and put someone on the calendar."
  ctaLabel="Share My Link"
  ctaRoute="/operator/profile/share"
  ghostLabel="Explore the app"
  ghostRoute="/operator/today"
  fullScreen={false}
/>

// Today tab — no jobs, returning operator
<EmptyState
  variant="functional"
  icon="calendar-x"
  headline="Nothing on the books today."
  body="Open up your availability and share your booking link."
  ctaLabel="Share My Link"
  ctaRoute="/operator/profile/share"
  fullScreen={false}
/>
```

---

## First-Run Flag Reference

All flags live on `public.users`. Set to `true` on first render. Never reset.

| Flag Column | Screen | Roles |
|-------------|--------|-------|
| `first_run_today_seen` | Today Tab — no jobs | Operator, Manager, Crew |
| `first_run_bookings_seen` | Bookings — no upcoming | Operator, Customer |
| `first_run_customers_seen` | Customers — none | Operator, Manager |
| `first_run_discover_seen` | Discover — first load | Customer |
| `first_run_vehicles_seen` | Vehicles — none | Customer |
| `first_run_service_menu_seen` | Service menu — empty | All operators |
| `first_run_earnings_seen` | Earnings — no data | Crew |
| `first_run_team_seen` | Team — no members | Manager |
| `first_payment_celebrated` | Payment received | Operator (already live) |

---

## What Empty States Never Do

- Never use a sad face, broken icon, or crying emoji — these signal failure, not opportunity
- Never say "No data available" or "Nothing to show" — system messages, not human ones
- Never leave an empty state without a CTA — every empty state has a clear next step
- Never use the same copy for first-run and returning users — different stakes, different tone
- Never explain why there's no data in technical terms — "No bookings found" is wrong, "Nothing here yet" is right
- Never block the user — ghost CTAs and ghost links always provide an escape hatch

---

## Role 1 — Customer

Customer empty states focus on momentum. The customer has no history yet — the app communicates that value is one tap away.

### Discover Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| First load — no detailers yet | first_run | map-pin | "Let's find you a detailer." | "Top-rated mobile detailers and shops near you, all in one place." | Search Near Me → /customer/discover | — |
| No detailers in area | functional | map-pin-off | "Nobody's in your area yet." | "We're growing fast. Check back soon or expand your search." | Expand Search → /customer/discover/expand | — |
| Search — no results | functional | search | "Nothing matched that search." | "Try a different service or location." | Clear Search → /customer/discover | — |

### Bookings Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No upcoming — first run | first_run | calendar | "Your calendar's wide open." | "Find a detailer and get your car looking right." | Find a Detailer → /customer/discover | — |
| No upcoming — returning | functional | calendar | "Nothing coming up." | "Book a detail and you'll see it here." | Book Now → /customer/discover | — |
| No booking history | functional | clock | "No detailing history yet." | "Your first booking is one tap away." | Book Now → /customer/discover | — |

### Profile — Vehicles

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No vehicles — first run | first_run | car | "No rides added yet." | "Add your vehicle once and we'll remember it for every booking." | Add a Vehicle → /customer/vehicles/add | I'll add it later → /customer/profile |
| No vehicles — returning | functional | car | "No vehicles saved." | "Add a vehicle and we'll pre-fill it every time you book." | Add a Vehicle → /customer/vehicles/add | — |

### Profile — Payment Methods

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No payment methods | functional | credit-card | "No payment method saved." | "Add a card so you're ready to book in seconds." | Add Card → /customer/payments/add | — |

### Profile — Reviews Written

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No reviews written | functional | star | "No reviews yet." | "After your first detail, let your detailer know how they did." | Book a Detail → /customer/discover | — |

### Rain Coverage

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| Not subscribed | functional | cloud-rain | "Not covered yet." | "Add Rain Coverage and we'll replace your detail if it rains." | Get Covered → /customer/rain-coverage | — |

---

## Role 2 — Solo Mobile Operator

Operator empty states are about momentum and business confidence. The tone is energetic and action-oriented.

### Today Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No jobs — first run | first_run | calendar-days | "Wide open today." | "Share your booking link and put someone on the calendar." | Share My Link → /operator/profile/share | Explore the app → /operator/today |
| No jobs — returning | functional | calendar-x | "Nothing on the books today." | "Open up your availability and share your booking link." | Share My Link → /operator/profile/share | — |

### Bookings Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No upcoming — first run | first_run | book-open | "Your first booking is out there." | "Share your profile and let customers find you." | Share My Profile → /operator/profile/share | Build my service menu → /operator/business/services |
| No upcoming — returning | functional | book-open | "Nothing scheduled yet." | "Share your booking link to fill the calendar." | Share Booking Link → /operator/profile/share | — |
| No past bookings | functional | clock | "No completed jobs yet." | "Your first booking will show up here once it's done." | View Upcoming → /operator/bookings | — |

### Customers Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No customers — first run | first_run | users | "Your first customer is out there." | "Do the work. They'll be here before you know it." | Share Booking Link → /operator/profile/share | Explore my profile → /operator/profile |
| No customers — returning | functional | users | "No customers yet." | "Do the work, the list will grow." | Share Booking Link → /operator/profile/share | — |

### Business Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No revenue today | functional | bar-chart-2 | "No earnings yet today." | "Jobs will show up here as they're completed." | View Today's Jobs → /operator/today | — |
| No payout history | functional | dollar-sign | "No payouts yet." | "Complete your first job and payment hits within 2 business days." | View Jobs → /operator/today | — |
| No reviews | functional | star | "No reviews yet." | "Do the work, the reviews will come." | View Bookings → /operator/bookings | — |

### Business — Service Menu

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No services — first run | first_run | wrench | "No services yet." | "Add your first service and start taking bookings." | Add a Service → /operator/business/services/add | — |
| No services — returning | functional | wrench | "Service menu is empty." | "Add a service to start accepting bookings." | Add a Service → /operator/business/services/add | — |

---

## Role 3 — Fixed Location Operator

Fixed location operators think in bays and walk-ins. Empty states speak to the shop context.

### Today Tab — Bay View

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| All bays empty — first run | first_run | building | "Bays are open." | "Turn on walk-ins or share your booking link to fill the day." | Enable Walk-Ins → /operator/today/walkins | Share Booking Link → /operator/profile/share |
| All bays empty — returning | functional | building | "All bays empty right now." | "Walk-ins on? Share your link to fill the day." | Toggle Walk-Ins → /operator/today/walkins | — |

### Walk-In Queue

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No walk-ins | functional | users | "No walk-ins right now." | "Toggle walk-ins on to start accepting arrivals." | Enable Walk-Ins → /operator/today/walkins | — |

### Bookings — Drop-Offs

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No scheduled drop-offs | functional | calendar | "Nothing scheduled yet." | "Share your booking link to get cars in the queue." | Share Booking Link → /operator/profile/share | — |

---

## Role 4 — Team Manager

Manager empty states signal operational readiness or required action. Always provide a direct path forward.

### Today Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No jobs — first run | first_run | calendar-days | "Nothing on the board yet." | "Add your team and start taking bookings. This fills up fast." | Add Team Member → /manager/team/add | Share booking link → /manager/profile/share |
| All assigned, none started | functional (success) | shield-check (Success green) | "All clear. Team is loaded up." | "All jobs assigned and ready. Check back when the day kicks off." | View Team → /manager/team | — |

### Unassigned Jobs

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No unassigned jobs | functional (success) | calendar-check (Success green) | "All jobs assigned." | "Great work. Check back when new bookings come in." | View All Jobs → /manager/bookings | — |

### Live Alerts

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No active alerts | functional (success) | shield-check (Success green) | "All clear." | "No issues on any active jobs right now." | View Today → /manager/today | — |

### Team Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No crew — first run | first_run | users-2 | "No crew yet." | "Your operation starts with your people. Add your first team member." | Add Team Member → /manager/team/add | — |
| No crew on duty today | functional | users-2 | "Nobody on duty today." | "Check your team schedule or add availability." | View Team Calendar → /manager/team/calendar | — |

### Team Calendar

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No jobs on selected day | functional | calendar | "Nothing scheduled this day." | "Assign a job or open availability for this date." | Assign a Job → /manager/bookings/unassigned | — |

### Bookings Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No upcoming bookings | functional | book-open | "No upcoming bookings." | "Share your booking link to start filling the calendar." | Share Booking Link → /manager/profile/share | — |

### Business Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No revenue | functional | bar-chart-2 | "No revenue yet." | "Complete your first job and the numbers start here." | View Jobs → /manager/bookings | — |
| No payroll to process | functional | dollar-sign | "Nothing to pay out right now." | "Completed jobs will show up here when crew earnings are ready." | View Team → /manager/team | — |
| No commission overrides | functional | percent | "Everyone's on the default rate." | "You can set individual rates for each crew member anytime." | Edit Default Rate → /manager/team/commission | — |

---

## Role 5 — Crew / Team Member

Crew empty states are calm and factual. If there are no jobs, it's because the manager hasn't assigned any. The app communicates that clearly without creating anxiety.

### My Jobs Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No jobs — pending approval | first_run | clock | "You're almost in." | "Your manager will approve you with one tap. Usually happens fast." | Explore the App → /crew/profile | — |
| No jobs today — approved | functional | briefcase | "No jobs today." | "Your manager hasn't assigned anything yet. Check back soon." | View Earnings → /crew/earnings | — |
| No upcoming jobs | functional | calendar | "Nothing coming up." | "Jobs assigned to you will appear here." | View Earnings → /crew/earnings | — |

### Earnings Tab

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No earnings — first run | first_run | dollar-sign | "Your first earnings are coming." | "Complete your first job and your earnings show up here in real time." | View My Jobs → /crew/jobs | — |
| No earnings this period | functional | dollar-sign | "Nothing earned this period." | "Complete jobs and your earnings update in real time." | View My Jobs → /crew/jobs | — |

### Issues Flagged

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No issues flagged | functional (success) | shield-check (Success green) | "No issues flagged." | "Everything's good. Tap Flag an Issue from any job if something comes up." | View My Jobs → /crew/jobs | — |

---

## Role 6 — Multi-Unit Operator / Manager

Multi-unit adds unit-specific empty states. When a specific unit is selected and has no data, the empty state is scoped to that unit by injecting the unit name into the copy.

### Today Tab — Unit Selected

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| Unit selected, no jobs | functional | calendar-x | "[Unit name] has nothing today." | "No jobs scheduled for this unit. Assign something or open availability." | Assign a Job → /manager/bookings/unassigned | — |

### Business Tab — Unit Selected

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| Unit selected, no revenue | functional | bar-chart-2 | "No revenue from [Unit name] yet." | "Jobs completed at this unit will appear here." | View Jobs → /manager/bookings | — |

### Profile — Locations & Vans

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| No units added — first run | first_run | building | "No units added yet." | "Add your first van or location to start building your operation." | Add a Van → /operator/units/add-van | Add a Location → /operator/units/add-location |
| Unit pending approval | functional (warning) | clock (Warning amber) | "[Unit name] is under review." | "We review new locations within 24 hours. You'll get a notification when it goes live." | View All Units → /operator/units | — |

### Van — No Crew Assigned Today

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| Van has no crew today | functional | truck | "No crew on [Van name] today." | "Assign a crew member from the Team tab for today's jobs." | Assign Crew → /manager/team | — |

### Location — No Bookings Today

| State | Variant | Icon | Headline | Body | Primary CTA | Ghost CTA |
|-------|---------|------|----------|------|-------------|-----------|
| Location has no bookings | functional | building | "[Location name] has no bookings today." | "Share the booking link for this location or enable walk-ins." | Share Booking Link → /operator/units/[id]/share | — |

---

## UXPilot Generation List — First-Run States Only

Generate these 12 screens in UXPilot. All other empty states are implemented by developers using the functional component spec above.

| # | Screen | Role | Session |
|---|--------|------|---------|
| 1 | Today Tab — Wide open today | Solo Mobile Operator | 1 |
| 2 | Bookings — Your first booking is out there | Solo Mobile Operator | 1 |
| 3 | Customers — Your first customer is out there | Solo Mobile Operator | 1 |
| 4 | Service Menu — No services yet | All operators | 1 |
| 5 | Discover — Let's find you a detailer | Customer | 1 |
| 6 | Vehicles — No rides added yet | Customer | 1 |
| 7 | Today Tab — Nothing on the board yet | Team Manager | 1 |
| 8 | Team Tab — No crew yet | Team Manager | 1 |
| 9 | My Jobs — You're almost in (pending) | Crew | 2 |
| 10 | Earnings — Your first earnings are coming | Crew | 2 |
| 11 | Today Tab — Bays are open | Fixed Location Operator | 2 |
| 12 | Operation Builder — No units added yet | Multi-Unit Operator | 2 |
