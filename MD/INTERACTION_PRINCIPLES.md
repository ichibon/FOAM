# Interaction Principles

## The North Star
The Cut is the experience benchmark — not visually, but how it feels to use. Fast. Confident. Frictionless. Every interaction should feel like the app already knows what you're trying to do.

---

## Core Principles

### 1. Speed Is a Feature
Every screen should load fast and feel instant. Optimistic UI updates — show the result before the server confirms it, roll back only if it fails. No one should wait for a spinner to book an appointment or mark a job complete.

### 2. Reduce Decisions
Default to the right choice. If a detailer always sets a 20-minute travel buffer, pre-fill 20 minutes. If a customer always books on Saturdays, show Saturday availability first. Progressive personalization reduces decision fatigue over time.

### 3. Mobile-Native Patterns Only
No web-style pagination. No horizontal scrolling tables. No small tap targets. Every interactive element is at least 44px tall. Bottom navigation, swipe gestures, bottom sheets, and pull-to-refresh are the vocabulary of this app.

### 4. One Primary Action Per Screen
Every screen has one obvious thing to do. Secondary actions exist but they don't compete for attention. The primary CTA is always visually dominant and reachable with one thumb.

### 5. Confirmations for Irreversible Actions
Canceling an appointment, removing a crew member, deleting a service — these get a confirmation step. Everything else is instant. Don't interrupt the flow for reversible actions.

### 6. Errors Are Human
Error messages don't say "An error occurred." They say what happened and what to do next. Written in the same upbeat, energetic voice as the rest of the app — not clinical, not alarming.

---

## Navigation Structure

### Customer App
```
Bottom Nav (4 tabs):
├── Discover       — Find detailers, search, browse
├── Bookings       — Upcoming and past appointments
├── Messages       — In-app chat with detailers (V2)
└── Profile        — Account, vehicles, payment, membership
```

### Detailer/Owner App
```
Bottom Nav (5 tabs):
├── Today          — Daily schedule, jobs, route
├── Bookings       — Full calendar and booking management
├── Customers      — CRM, vehicle profiles, history
├── Business       — Earnings, reports, services, crew
└── Profile        — Account, settings, payout info
```

### Crew App
```
Bottom Nav (3 tabs):
├── My Jobs        — Assigned jobs for today and upcoming
├── Earnings       — Personal earnings for current period
└── Profile        — Account and contact info
```

---

## Key Interaction Patterns

### Booking Flow (Customer)
1. Search or tap detailer from Discover
2. View detailer profile — services, ratings, photos
3. Select service package and add-ons
4. Select vehicle (from saved profiles or enter new)
5. Select date and available time slot
6. Enter service location (home, work, other)
7. Review summary — service, location, price, detailer
8. Pay (saved card or enter new)
9. Confirmation screen with job details and detailer contact

Target: under 90 seconds from tap to confirmed booking.

### Job Management Flow (Detailer)
1. Today tab shows chronological job list
2. Tap job to see full details
3. "On My Way" button — triggers customer ETA notification (V2)
4. "Start Job" — timestamps job start
5. Upload before photos (optional but encouraged)
6. "Complete Job" — triggers payment release and review request
7. Upload after photos
8. Next job auto-surfaces

### Crew Assignment Flow (Owner — V2)
1. Create booking or receive booking request
2. Assign to available crew member from dropdown
3. Crew member receives push notification with job details
4. Owner tracks crew location on map view
5. Completion notification sent to owner when tech marks done

---

## Gesture Vocabulary
```
Swipe left on job card:    Quick actions (reschedule, cancel)
Swipe right on job card:   Mark complete (with confirm)
Pull to refresh:           Refresh current screen data
Long press on customer:    Quick action menu (call, message, view history)
Pinch on map (V2):         Zoom in/out on crew location view
```

---

## Motion & Animation

### Timing
```
Micro (feedback):     150ms  — button press states, toggles
Standard:             200ms  — screen element transitions
Modal/Sheet entry:    280ms  — bottom sheets sliding up
Screen transitions:   300ms  — page navigation
Onboarding:           400ms  — first-run animations only
```

### Easing
```
Entrance:   ease-out  — elements decelerate as they arrive
Exit:       ease-in   — elements accelerate as they leave
Move:       ease-in-out — elements moving across screen
Spring:     Used sparingly for satisfying completion moments (job marked done, payment received)
```

### Meaningful Motion Only
- Bottom sheet slides up — doesn't pop or fade
- Cards load with subtle fade-in stagger, not all at once
- Success states get a brief scale + fade confirmation
- Error states shake once — firm, not frantic
- Tab switches are instant — no cross-fade

---

## Empty States
Every empty state has:
1. A relevant illustration or icon (not a generic sad face)
2. A human, energetic headline
3. A clear next action

Examples:
- No upcoming bookings: "Your calendar's wide open. Time to get some cars clean."  → [Find Customers / Share Profile]
- No customers yet: "Your first customer is out there. Let's go find them." → [Share Booking Link]
- No crew members: "Flying solo for now? Add your first tech when you're ready." → [Add Crew Member]

---

## Loading States
- Skeleton screens for content-heavy views (customer discovery, booking history)
- Inline spinners for button actions only
- No full-screen loading spinners after initial app load
- Optimistic updates wherever possible — show the result, reconcile in background

---

## Accessibility
- Minimum tap target: 44x44px
- Color contrast: WCAG AA minimum (4.5:1 for body text)
- All icons have accessible labels
- Screen reader support for all interactive elements
- Dynamic type support — layout adapts to larger system font sizes
