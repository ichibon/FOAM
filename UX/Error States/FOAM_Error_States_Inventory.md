# FOAM — Error & Failure States Inventory
**Version 1.0 · Task 10 · All Roles**

---

## Philosophy

Error states are the most trust-sensitive moments in any product. A user who hits an error is already frustrated — the app's job is to defuse that frustration immediately, explain what happened in human terms, and give them a clear path forward. Never make them feel stupid. Never make them feel stuck. Never leave them staring at a technical message.

FOAM errors follow one rule: **every error state has a recovery path.** There are no dead ends.

---

## The ErrorState Component

One component. Three severity levels. Three recovery types. Context-aware props.

Same architectural pattern as `EmptyState` — config-driven, no database changes required. Error content lives in a config file in the codebase. The component reads severity and recovery type, renders the appropriate visual treatment, and executes the recovery action on CTA tap.

### Props

```typescript
interface ErrorStateProps {
  severity: 'warning' | 'error' | 'blocking'
  recovery: 'retry' | 'navigate' | 'support'
  icon: string                    // Lucide icon name
  headline: string                // Max 6 words. Human, not technical.
  body: string                    // Max 2 lines. Explains what happened + what to do.
  ctaLabel: string                // Recovery action label
  retryAction?: () => void        // Required when recovery = 'retry'
  navigateTo?: string             // Required when recovery = 'navigate'
  ghostLabel?: string             // Optional secondary action
  ghostAction?: () => void        // Ghost action callback or route
  fullScreen?: boolean            // Default: false. True for blocking errors only.
  errorCode?: string              // Optional — shown in small text for support reference
}
```

### Severity Levels

Three levels. Each has distinct visual treatment so the user understands urgency at a glance.

| Property | warning | error | blocking |
|----------|---------|-------|----------|
| Icon color | Warning amber (#D97706) | Error red (#DC2626) | Error red (#DC2626) |
| Icon background | rgba(217,119,6,0.10) | rgba(220,38,38,0.10) | rgba(220,38,38,0.10) |
| Headline color | Text Primary (#0A0A0A) | Text Primary (#0A0A0A) | Text Primary (#0A0A0A) |
| CTA style | Outlined FOAM Blue | Filled Error red | Filled Error red |
| Layout | Inline in content area (fullScreen=false) | Inline or full screen depending on context | Always full screen (fullScreen=true) |
| When to use | Non-critical failure, user can still proceed | Current action failed, user must act | User cannot use the app until resolved |

### Recovery Types

Three recovery paths. The component renders the appropriate CTA behavior.

| Recovery | CTA Behavior | Use When |
|----------|-------------|----------|
| `retry` | Re-fires the failed action via `retryAction()` callback | Transient failures — network hiccup, timeout, rate limit |
| `navigate` | Routes to `navigateTo` path | Wrong screen, missing data, access denied |
| `support` | Opens FOAM support channel (in-app chat or email) | FOAM-side failures the user cannot fix |

### Inline vs Full Screen

Most errors render inline — they replace the content area of the screen that failed, but the header and nav remain. This keeps the user oriented and gives them other options.

Blocking errors are full screen — the user cannot proceed until the issue is resolved. Account suspended, app update required, no internet connection. These are the exception, not the rule.

```typescript
// Inline error — payment method invalid
<ErrorState
  severity="error"
  recovery="navigate"
  icon="credit-card"
  headline="Card declined."
  body="Your payment method didn't work. Update it and try again."
  ctaLabel="Update Payment"
  navigateTo="/customer/payments"
  ghostLabel="Try a different card"
  ghostAction={() => openCardPicker()}
  fullScreen={false}
/>

// Blocking error — no internet
<ErrorState
  severity="blocking"
  recovery="retry"
  icon="wifi-off"
  headline="You're offline."
  body="Check your connection and we'll pick up where you left off."
  ctaLabel="Try Again"
  retryAction={() => checkConnection()}
  fullScreen={true}
/>
```

### Error Config Structure

```typescript
// errorStates.config.ts
export const ERROR_STATES = {
  global: {
    no_internet: { severity: 'blocking', recovery: 'retry', icon: 'wifi-off', ... },
    session_expired: { severity: 'blocking', recovery: 'navigate', icon: 'lock', ... },
    app_update_required: { severity: 'blocking', recovery: 'navigate', icon: 'refresh-cw', ... },
    account_suspended: { severity: 'blocking', recovery: 'support', icon: 'ban', ... },
    generic: { severity: 'error', recovery: 'retry', icon: 'alert-circle', ... },
  },
  customer: {
    payment_failed: { severity: 'error', recovery: 'navigate', icon: 'credit-card', ... },
    booking_conflict: { severity: 'warning', recovery: 'navigate', icon: 'calendar-x', ... },
    no_detailers_available: { severity: 'warning', recovery: 'retry', icon: 'map-pin-off', ... },
    // ...
  },
  operator: {
    stripe_not_connected: { severity: 'error', recovery: 'navigate', icon: 'dollar-sign', ... },
    payout_failed: { severity: 'error', recovery: 'support', icon: 'banknote', ... },
    // ...
  }
}
```

---

## What Error States Never Do

- Never show a raw error code as the headline — "Error 403" is not a headline
- Never blame the user — "You entered an invalid card" becomes "That card didn't work"
- Never leave a user with no path forward — every error has a CTA
- Never use the same generic error for everything — context-specific copy always outperforms "Something went wrong"
- Never auto-dismiss an error — user must acknowledge it
- Never stack multiple errors — show the most critical one, resolve it, then show the next

---

## Global Errors (All Roles)

These errors can appear anywhere in the app regardless of role. They are the only errors that render as full-screen blocking states.

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| No internet | blocking | retry | wifi-off | "You're offline." | "Check your connection and we'll pick up where you left off." | Try Again | — |
| Session expired | blocking | navigate | lock | "You've been gone a while." | "Log back in to pick up where you left off." | Log In | — |
| App update required | blocking | navigate | refresh-cw | "Time for an update." | "A new version of FOAM is available. Update to keep going." | Update Now | — |
| Account suspended | blocking | support | ban | "Your account is on hold." | "Something needs your attention. Contact us and we'll sort it out." | Contact Support | — |
| Generic server error | error | retry | alert-circle | "Something went sideways." | "Give it another tap. If it keeps happening, let us know." | Try Again | Contact Support |
| Rate limited | warning | retry | clock | "Slow down a little." | "Too many requests. Wait a moment and try again." | Try Again | — |
| Maintenance mode | blocking | retry | wrench | "We're doing some work." | "FOAM will be back shortly. Thanks for your patience." | Check Again | — |

---

## Customer Errors

### Booking Flow

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Booking conflict — slot taken | warning | navigate | calendar-x | "That slot just got taken." | "Pick another time and we'll lock it in." | Pick Another Time | — |
| Booking conflict — detailer unavailable | warning | navigate | calendar-x | "Marcus isn't available then." | "Choose a different time or pick another detailer." | See Other Times | Find Another Detailer |
| No detailers in area | warning | retry | map-pin-off | "Nobody's nearby right now." | "We're growing fast. Try expanding your search area." | Expand Search | — |
| Location not found | error | retry | map-pin-off | "We couldn't find that address." | "Double-check it and try again." | Try Again | Enter Manually |
| Booking failed — generic | error | retry | alert-circle | "Booking didn't go through." | "Something went wrong on our end. Give it another tap." | Try Again | Contact Support |

### Payment

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Card declined | error | navigate | credit-card | "Card declined." | "Your payment method didn't work. Update it and try again." | Update Payment | Try Another Card |
| Card expired | error | navigate | credit-card | "That card's expired." | "Add a new card to complete your booking." | Add New Card | — |
| Insufficient funds | error | navigate | credit-card | "Payment didn't go through." | "Check your card and try again." | Update Payment | — |
| No payment method | error | navigate | credit-card | "No payment method saved." | "Add a card to complete your booking." | Add a Card | — |
| Authorization hold failed | error | navigate | credit-card | "Couldn't hold your card." | "Your card needs to be valid to reserve this appointment." | Update Payment | — |
| Payment capture failed | error | support | alert-circle | "Payment didn't complete." | "Your appointment is done but payment needs attention. We're on it." | Contact Support | — |
| Refund failed | error | support | dollar-sign | "Refund hit a snag." | "We're processing your refund. If it doesn't appear in 5–7 days, let us know." | Contact Support | — |

### Discovery

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Location permission denied | warning | navigate | map-pin-off | "Location access is off." | "Enable location in Settings so we can find detailers near you." | Open Settings | Enter Address Manually |
| Search failed | error | retry | search | "Search hit a snag." | "Something went wrong. Try again." | Try Again | — |
| Detailer profile failed to load | error | retry | user-x | "Couldn't load this profile." | "Give it another tap." | Try Again | Go Back |

### Account

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Login failed — wrong credentials | error | retry | lock | "That didn't match." | "Check your email and password and try again." | Try Again | Reset Password |
| Login failed — account not found | error | navigate | user-x | "No account found." | "Check your email or create a new account." | Create Account | Try Again |
| Password reset failed | error | retry | lock | "Reset link expired." | "Request a new one and check your inbox." | Send New Link | — |
| Email already in use | error | navigate | mail | "That email's taken." | "Already have an account? Log in instead." | Log In | — |
| Social auth failed | error | retry | alert-circle | "Sign-in didn't work." | "Try again or use email and password." | Try Again | Use Email |

---

## Operator Errors

### Payments & Payouts

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Stripe not connected | error | navigate | dollar-sign | "Stripe isn't connected." | "Connect your bank account to start receiving payments." | Connect Stripe | — |
| Stripe connection failed | error | retry | dollar-sign | "Stripe connection failed." | "Something went wrong linking your account. Try again." | Try Again | Contact Support |
| Payout failed | error | support | banknote | "Payout didn't go through." | "We couldn't send your payout. Check your bank details or contact us." | Check Bank Details | Contact Support |
| Payout delayed | warning | support | clock | "Payout is taking longer." | "Your payout is delayed. Usually resolves within 1 business day." | Contact Support | — |
| Invoice send failed | error | retry | file-text | "Invoice didn't send." | "Couldn't reach [Customer]. Try sending it again." | Resend Invoice | — |

### Bookings

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Accept booking failed | error | retry | calendar | "Couldn't confirm that booking." | "Something went wrong. Try accepting it again." | Try Again | — |
| Decline booking failed | error | retry | calendar | "Couldn't decline that booking." | "Try again — the customer is still waiting." | Try Again | — |
| Reschedule failed | error | retry | calendar | "Reschedule didn't go through." | "The new time couldn't be saved. Try again." | Try Again | — |
| Cancel booking failed | error | retry | calendar-x | "Cancellation didn't go through." | "Try again. If it keeps failing, contact support." | Try Again | Contact Support |

### Profile & Setup

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Profile save failed | error | retry | user | "Couldn't save your profile." | "Something went wrong. Try saving again." | Try Again | — |
| Photo upload failed | error | retry | image | "Photo didn't upload." | "Check your connection and try again." | Try Again | — |
| Service save failed | error | retry | wrench | "Service didn't save." | "Something went wrong. Try saving again." | Try Again | — |
| Location approval rejected | error | support | building | "[Location name] wasn't approved." | "Something in your setup needs attention. Contact us to find out more." | Contact Support | — |

---

## Crew Errors

### Jobs

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Job submit failed | error | retry | briefcase | "Job didn't submit." | "Something went wrong. Try submitting again." | Try Again | — |
| Photo upload failed | error | retry | camera | "Photos didn't upload." | "Check your connection and try adding them again." | Try Again | — |
| Service change failed | error | retry | plus-circle | "Couldn't add that service." | "The change didn't go through. Try again." | Try Again | — |
| Issue flag failed | error | retry | alert-triangle | "Couldn't flag the issue." | "Try again. Your manager needs to know about this." | Try Again | — |
| Invite code invalid | error | retry | key | "That code doesn't match." | "Double-check with your manager and try again." | Try Again | Contact Manager |
| Invite code expired | error | support | key | "That code has expired." | "Ask your manager to send a new one." | Contact Manager | — |

---

## Manager Errors

### Team Management

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Invite send failed | error | retry | mail | "Invite didn't send." | "Something went wrong. Try sending again." | Try Again | — |
| Job assignment failed | error | retry | users | "Couldn't assign that job." | "Something went wrong. Try assigning again." | Try Again | — |
| Job reassignment failed | error | retry | users | "Reassignment didn't go through." | "Try again." | Try Again | — |
| Commission save failed | error | retry | percent | "Commission rules didn't save." | "Something went wrong. Try saving again." | Try Again | — |
| Member deactivation failed | error | retry | user-x | "Couldn't deactivate that account." | "Try again or contact support." | Try Again | Contact Support |

### Approvals

| Error | Severity | Recovery | Icon | Headline | Body | CTA | Ghost |
|-------|----------|----------|------|----------|------|-----|-------|
| Crew approval failed | error | retry | user-check | "Approval didn't go through." | "Try approving again." | Try Again | — |
| Service change approval failed | error | retry | check-circle | "Approval didn't go through." | "Try again — [Crew member] is waiting." | Try Again | — |
| Service change rejection failed | error | retry | x-circle | "Rejection didn't go through." | "Try again." | Try Again | — |

---

## Payment-Specific Error Screens

These six errors need dedicated UXPilot screens because their layout includes contextual payment data — not just the standard ErrorState component. They appear in the booking and payment flows where showing the specific amounts and booking details alongside the error is critical to user trust.

### P1 — Customer: Card Declined (with booking context)

Full screen modal. Shows the booking the customer was trying to complete alongside the error — so they understand exactly what failed and what's still waiting.

Layout:
- Error icon (credit-card, Error red, in Error red subtle circle) centered
- "Card declined." Inter 22px 600 Text Primary centered
- "Your payment method didn't work." Inter 15px Text Secondary centered
- Booking summary card (white, 16px radius): service · detailer · date/time · amount attempted
- Two CTAs: "Update Payment" (filled Error red primary) · "Try Another Card" (outlined FOAM Blue)
- Ghost: "Cancel this booking" — Text Tertiary, centered

### P2 — Customer: Payment Capture Failed (post-service)

This is the most sensitive payment error. The job is done. The operator is waiting to get paid. Something went wrong capturing the payment. The customer needs to resolve this without feeling like they're being accused of anything.

Layout:
- Error icon (alert-circle, Warning amber) — amber not red — softer tone for post-service
- "Payment needs attention." Inter 22px 600 Text Primary
- "Your detail is complete but we couldn't process payment. Update your card to finish up." Inter 15px Text Secondary
- Job summary card: what was completed · operator name · total due
- "Update Payment" — filled FOAM Blue (not Error red — this is resolution, not failure)
- Ghost: "Contact Support"

### P3 — Customer: Authorization Hold Failed (at booking)

The customer is trying to book but the card authorization failed before the booking was confirmed. Clear, quick, no drama.

Layout:
- Error icon (credit-card, Error red)
- "Couldn't hold your card." Inter 22px 600
- "Your card needs to be valid to reserve this appointment. Update it and try again." Inter 15px
- Appointment details they were trying to book (service · detailer · date)
- "Update Payment" — filled Error red
- Ghost: "Pick a Different Detailer"

### P4 — Operator: Stripe Not Connected

Operator tries to receive a payout or complete a job and gets this. High stakes — their money is involved.

Layout:
- Error icon (dollar-sign, Warning amber) — amber not red, this is fixable
- "Stripe isn't connected." Inter 22px 600 Text Primary
- "Connect your bank account to start receiving payments from your jobs." Inter 15px
- What they're missing: "X jobs completed · $[amount] pending payout" — shows them the money waiting
- "Connect Stripe" — filled FOAM Blue
- Ghost: "I'll do this later" — Text Tertiary, with consequence note below: "Payouts are on hold until connected." Inter 11px Warning amber

### P5 — Operator: Payout Failed

A payout was attempted and failed. Operator needs to know what happened and what to do.

Layout:
- Error icon (banknote, Error red)
- "Payout didn't go through." Inter 22px 600
- "We couldn't send your payout of [amount]. Check your bank details or contact us." Inter 15px
- Payout details card: amount · scheduled date · bank on file · attempt count
- "Check Bank Details" — filled FOAM Blue
- "Contact Support" — outlined FOAM Blue

### P6 — Global: No Internet (Blocking)

Full screen. No navigation. User must restore connection before continuing.

Layout (full screen, centered):
- wifi-off icon (56px, #A3A3A3, Text Tertiary) — no colored circle — muted and factual
- "You're offline." Playfair Display 28px 700 Text Primary
- "Check your connection and we'll pick up where you left off." Inter 16px Text Secondary
- "Try Again" — filled FOAM Blue, pill shape, 48px — same pill treatment as empty states to signal forward momentum
- No ghost CTA — no other path available

---

## UXPilot Generation List

Generate these 8 screens. All other error states use the standard `ErrorState` component.

| # | Screen | Role | Priority |
|---|--------|------|----------|
| 1 | Card Declined — with booking context | Customer | P1 |
| 2 | Payment Capture Failed — post-service | Customer | P1 |
| 3 | Authorization Hold Failed — at booking | Customer | P1 |
| 4 | Stripe Not Connected | Operator | P1 |
| 5 | Payout Failed | Operator | P1 |
| 6 | No Internet — blocking full screen | All roles | P1 |
| 7 | Account Suspended — blocking full screen | All roles | P2 |
| 8 | App Update Required — blocking full screen | All roles | P2 |

---

## Implementation Notes for Developers

**Error logging:** All errors caught by the `ErrorState` component should be logged to the monitoring service (Sentry / Datadog). Pass `errorCode` as a prop when an error has a reference ID — displayed in small Text Tertiary below the body copy for support reference.

**Retry debouncing:** `retryAction` callbacks must be debounced — minimum 1 second between retry attempts. No rapid-fire retry spam.

**Error boundaries:** Wrap every major screen in a React Native ErrorBoundary. If an unhandled exception occurs, render `<ErrorState severity="error" recovery="retry" ... />` rather than crashing to a white screen.

**Toast vs full-screen:** Not every error needs a full ErrorState screen. Transient, non-blocking errors (like a failed search suggestion or a photo compression warning) should use a Toast notification — a small bottom-of-screen banner that auto-dismisses after 4 seconds. Full `ErrorState` is for errors that replace screen content or block the user entirely.

**Toast spec:**
```typescript
// Toast — transient, non-blocking
showToast({
  type: 'error' | 'warning' | 'success',
  message: string,
  duration: 4000, // ms
  action?: { label: string, onPress: () => void }
})
```

Toast colors:
- error: Error red background (#DC2626) · white text
- warning: Warning amber background (#D97706) · white text
- success: Success green background (#16A34A) · white text
