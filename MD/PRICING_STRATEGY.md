# Pricing Strategy

## Philosophy
Charge detailers for value, not for access. The platform fee should feel like the cheapest employee a detailer has ever hired — one that manages their calendar, collects their money, and brings them customers while they focus on the work.

---

## Detailer Subscription Tiers

### Starter — $29-39/month
**Who it's for:** Solo detailers just getting started or testing the platform
**What's included:**
- Customer-facing booking profile
- Calendar and availability management
- Travel time buffer settings
- Payment collection and invoicing
- Tipping built into checkout
- Basic customer profiles and vehicle info
- Automated appointment reminders
- Review requests post-job
- Before/after photo uploads

**Platform fee:** $10 per standard booking / $8 per recurring booking

---

### Pro — $69-89/month
**Who it's for:** Established solo operators running a real business
**What's included:** Everything in Starter, plus:
- Full CRM with service history per customer and vehicle
- Recurring appointment automation
- Lapsed customer re-engagement automation
- Expense tracking and basic P&L view
- Service performance reporting
- Revenue dashboard (weekly, monthly, yearly)
- Dynamic pricing by vehicle size
- Digital waivers and damage documentation
- Promo codes and seasonal discounts
- Business document storage

**Platform fee:** $8 per standard booking / $6 per recurring booking

---

### Crew — $149-199/month
**Who it's for:** Detailers running multi-tech operations
**What's included:** Everything in Pro, plus:
- Crew member accounts (up to 3 techs included)
- Job assignment and crew scheduling
- Commission and tip splitting rules
- Individual crew performance tracking
- GPS crew tracking in field
- Customer ETA notifications tied to crew location
- Route optimization across multiple techs
- Owner dashboard — all jobs, all crew, in real time

**Platform fee:** $6 per standard booking / $5 per recurring booking
**Additional crew beyond 3:** $20-25/month per tech

---

## Annual Plans
All tiers available annually at 2 months free (approximately 17% discount).
Annual subscribers churn at significantly lower rates. Offer prominently during onboarding.

---

## Customer Pricing

### Booking: Free
Customers pay no platform fee to book. All monetization on the customer side runs through the platform fees charged to detailers. Every dollar of customer-side friction reduces booking conversion, which reduces detailer value, which hurts the platform.

### Rain Coverage Membership: $7.99/month
- Covers cost of exterior wash if measurable rain falls within 72 hours of completed detail
- Triggered automatically via weather API — no claim filing required
- Redemption limited to 1 per 30-day period
- Annual option: $69.99/year (approximately 2 months free)
- Launch timing: V2

---

## Platform Fee Logic

The platform fee is deducted from the customer payment before the detailer receives their payout via Stripe Connect.

### Fee Scaling by Tier
| Tier | Standard Booking | Recurring Booking |
|------|-----------------|------------------|
| Starter | $10 | $8 |
| Pro | $8 | $6 |
| Crew | $6 | $5 |

### Why Flat Fee vs Percentage
**Flat fee pros:**
- Easy to explain to detailers ("it's just $10 per booking")
- Detailers don't feel penalized for pricing their services higher
- Predictable cost structure for detailer financial planning

**Flat fee cons:**
- Doesn't scale with ticket size — a $300 ceramic coating costs the same as a $50 wash
- Leaves money on the table at higher price points

**Decision:** Launch with flat fee for simplicity and detailer trust. Revisit at scale.

**Potential hybrid (V2 consideration):** Flat fee up to $150 ticket, then 4-5% above that threshold. This captures upside on premium services without penalizing standard bookings.

---

## Unit Economics (Illustrative)

### Solo Detailer on Pro Tier
- Monthly subscription: $79
- Average bookings per month: 25
- Average booking fee: $8 (mix of standard and recurring)
- Monthly booking fee revenue: $200
- Total monthly revenue per detailer: $279
- Annual revenue per detailer: $3,348

### Crew Operator on Crew Tier (3 techs, 80 jobs/month)
- Monthly subscription: $169 (base + 0 add-on techs)
- Average booking fee: $5.50 (mix of standard and recurring)
- Monthly booking fee revenue: $440
- Total monthly revenue per operator: $609
- Annual revenue per operator: $7,308

### Revenue Targets
| Active Detailers | Avg Monthly Rev/Detailer | Monthly Platform Revenue |
|-----------------|------------------------|------------------------|
| 25 | $200 | $5,000 |
| 50 | $220 | $11,000 |
| 100 | $250 | $25,000 |
| 200 | $275 | $55,000 |

---

## Competitive Pricing Context
- Detail King / Mobile Tech RX: ~$50-100/month, no marketplace, no payments
- Booksy: ~$30-90/month depending on tier, no detailing-specific features
- Vagaro: ~$30-85/month, no mobile service logic
- Square Appointments: Free to $70/month + 2.6% + $0.10 per transaction

Positioning: Premium to generic tools (justified by purpose-built features and marketplace access), competitive with detailing-specific software.

---

## Pricing Review Cadence
- Review detailer tier pricing at 6 months post-launch
- Review platform fee structure at 12 months post-launch
- Any pricing change requires 30-day notice to existing subscribers
- Founding detailer pricing locked for 12 months from their onboarding date
