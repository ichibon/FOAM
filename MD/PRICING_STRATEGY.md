# FOAM — Pricing Strategy
**Version 1.1 — Updated May 8, 2026**
Changes from v1.0 marked with `[v1.1]`

## Philosophy
Charge operators for value, not for access. The platform fee should feel like the cheapest employee an operator has ever hired — one that manages their calendar, collects their money, and brings them customers while they focus on the work.

---

## Operator Subscription Tiers

### Starter — $29/month [v1.1 — confirmed]
**Who it's for:** Solo operators just getting started or testing the platform.
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

**Platform fee:** 15% per completed booking [v1.1 — updated from flat fee]
**Annual:** $290/year (2 months free)

---

### Pro — $69/month [v1.1 — confirmed]
**Who it's for:** Established solo operators running a real business.
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

**Platform fee:** 12% per completed booking [v1.1 — updated from flat fee]
**Annual:** $690/year (2 months free)

---

### Crew — $149/month [v1.1 — confirmed]
**Who it's for:** Operators running multi-tech crew operations.
**What's included:** Everything in Pro, plus:
- Crew member accounts (up to 3 techs included)
- Job assignment and crew scheduling
- Commission, hourly, flat rate, and manual pay models
- Tip distribution rules (4 models)
- Individual crew performance tracking
- GPS crew tracking in field (V2)
- Customer ETA notifications tied to crew location (V2)
- Route optimization across multiple techs (V2)
- Owner dashboard — all jobs, all crew, in real time

**Platform fee:** 10% per completed booking [v1.1 — updated from flat fee]
**Annual:** $1,490/year (2 months free)
**Additional crew beyond 3:** $20–25/month per tech

---

## Annual Plans
All tiers available annually at 2 months free (~17% discount). Annual subscribers churn at significantly lower rates. Push annual prominently during onboarding and at the 60-day mark for monthly subscribers.

**Founding operator pricing:** Locked at launch price for 12 months from onboarding date. After 12 months, price updates apply to new subscribers only.

---

## Customer Pricing

### Booking: Free
Customers pay no platform fee to book. All monetization on the customer side runs through platform fees charged to operators. Every dollar of customer-side friction reduces booking conversion, which reduces operator value, which hurts the platform.

### Rain Coverage Membership: $7.99/month
- Covers exterior wash if measurable rain falls within 72 hours of completed detail
- Triggered automatically via weather API — no claim filing required
- Redemption limited to 1 per 30-day period
- Annual option: $69.99/year (approximately 2 months free)
- Launch timing: V2

### FOAM+ Membership: $14.99/month
FOAM+ is the full customer membership product. Rain Coverage is the entry point — FOAM+ is the destination. Customers booking $150–300 details are not price-sensitive on a $15/month membership.

**What's included:**
- Rain Coverage (automatic exterior wash within 72 hours of measurable rain post-detail)
- Priority booking — guaranteed availability within 48 hours from FOAM+ operators
- Vehicle concierge — platform-initiated rebooking reminders based on service history
- 1 free exterior wash per quarter with any full-service booking
- 5–10% off standard booking price on recurring appointments
- Early access to new operators and services in new markets

**Annual option:** $129.99/year (approximately 2 months free)
**Launch timing:** V2

---

## Platform Fee Structure [v1.1 — fully updated]

### Confirmed Fee Model: Percentage-Based, Tiered by Subscription

| Tier | Monthly | Platform Fee | FOAM nets after Stripe (2.9% + $0.30) |
|------|---------|-------------|--------------------------------------|
| Starter | $29/mo | 15% | ~12% |
| Pro | $69/mo | 12% | ~9% |
| Crew | $149/mo | 10% | ~7% |

**FOAM absorbs Stripe's processing cost.** Operators see one clean percentage — no separate processing charge on top. This is a meaningful differentiator vs Square, which charges processing on top of subscription.

### What the Fee Covers (Operator-Facing Framing)
- Customer discovery — profile in front of customers actively looking for detailers
- Payment processing — cards, Apple Pay, Google Pay, Cash App. All included.
- Business OS — scheduling, crew management, payroll, job tracking

**Never justify the fee by citing FOAM's internal costs.** Always frame as what the fee does for the operator, not why FOAM needs it.

### Cancellation Fee Split
FOAM takes its standard platform fee percentage on all cancellation captures. Operator keeps the remainder. FOAM earns on cancellations the same way it earns on completions.

### Platform Fee Override
FOAM ops can manually set `platform_fee_override` on `detailer_profiles` for special cases (founding operator deals, enterprise partnerships). NULL = use tier default.

### Why Percentage vs Flat Fee [v1.1 — updated decision]

**Previous model:** Flat fee per booking ($10/$8/$6 by tier)

**Updated model:** Percentage of booking value (15%/12%/10% by tier)

**Why percentage wins for FOAM:**
- Scales with ticket size — a $400 ceramic correction yields more than a $60 basic wash
- Aligns FOAM's incentive with the operator's — higher revenue jobs earn FOAM more, which motivates FOAM to bring operators higher-value customers
- Cleaner to communicate: "FOAM takes 12%" vs "FOAM takes $8 per booking, or $6 for recurring, or $10 for Starter..."
- Competitive benchmark: most mature marketplaces (Airbnb 3%, Uber 25%, The Cut 2.75%) use percentages

**Competitive comparison on a $220 job:**
| Platform | Fee | Operator keeps |
|----------|-----|----------------|
| Square Appointments Plus | $5.72 (2.6% + $0.10) | $214.28 |
| FOAM Pro (12%) | $26.40 | $193.60 |
| FOAM Starter (15%) | $33.00 | $187.00 |
| FOAM Crew (10%) | $22.00 | $198.00 |

**The real comparison is not FOAM 12% vs Square 2.6%.** Square doesn't bring operators customers. The true comparison is FOAM 12% vs Square 2.6% + $200–500/month the operator spends on self-generated customer acquisition. On that math, FOAM wins for any operator doing meaningful volume.

---

## Unit Economics [v1.1 — updated for percentage model]

### Solo Operator on Pro Tier
- Monthly subscription: $69
- Average bookings per month: 20
- Average booking value: $180
- Platform fee per booking: 12% = $21.60
- Monthly booking fee revenue to FOAM: $432
- Total monthly FOAM revenue per operator: $501
- Annual FOAM revenue per operator: $6,012

### Crew Operator on Crew Tier (3 techs, 60 jobs/month)
- Monthly subscription: $149
- Average booking value: $220
- Platform fee per booking: 10% = $22
- Monthly booking fee revenue to FOAM: $1,320
- Total monthly FOAM revenue per operator: $1,469
- Annual FOAM revenue per operator: $17,628

### Revenue Targets

| Active Operators | Avg Monthly Rev/Operator | Monthly Platform Revenue | Annual Run Rate |
|-----------------|------------------------|--------------------------|-----------------|
| 25 | $300 | $7,500 | $90,000 |
| 100 | $350 | $35,000 | $420,000 |
| 250 | $400 | $100,000 | $1,200,000 |
| 500 | $450 | $225,000 | $2,700,000 |

---

## Competitive Pricing Context [v1.1 — updated]

| Competitor | Monthly Cost | Transaction Fee | Marketplace? | Detailing-Specific? |
|------------|-------------|----------------|--------------|---------------------|
| Square Appointments Plus | $49/mo | 2.6% + $0.10 | Square Go (generic) | ❌ |
| Square Appointments Premium | $149/mo | 2.4% + $0.15 | Square Go (generic) | ❌ |
| Booksy | $30–90/mo | Varies | ✅ Limited | ❌ |
| Vagaro | $30–85/mo | Varies | ✅ Limited | ❌ |
| Detail King / Mobile Tech RX | $50–100/mo | None | ❌ | ✅ |
| The Cut | Free–$30/mo | 2.75% flat | ✅ Barbershops | ❌ |
| **FOAM Starter** | **$29/mo** | **15%** | **✅ Detailing-specific** | **✅** |
| **FOAM Pro** | **$69/mo** | **12%** | **✅ Detailing-specific** | **✅** |
| **FOAM Crew** | **$149/mo** | **10%** | **✅ Detailing-specific** | **✅** |

**Positioning:** FOAM is the only purpose-built detailing OS with a two-sided marketplace. The percentage fee is higher than Square's processing rate — but Square is not a marketplace and does not bring operators customers. FOAM competes on total operator value, not on transaction cost alone.

---

## Future Revenue Lines

These activate as the platform reaches density. Architecture decisions support them from day one.

| Stream | Model | Timeline |
|--------|-------|----------|
| B2B Fleet Accounts | Monthly retainer, custom pricing | Year 1 |
| Supply Marketplace | 10–20% margin on operator supply purchases | Year 2 |
| Certification Program | $199–499 per cert, $79–99 annual renewal | Year 2 |
| Sponsored Placement | Promoted listings in neighborhood/city search | Year 2 |
| FOAM Advance | Revenue-based financing on GMV history | Year 2–3 |
| FOAM Business Debit | Interchange on operator business expenses | Year 2–3 |

---

## Pricing Review Cadence
- Review operator tier pricing at 6 months post-launch
- Review platform fee percentage at 12 months post-launch
- Review customer membership pricing at 12 months post-launch
- Any pricing change requires 30-day notice to existing subscribers
- Founding operator pricing locked for 12 months from their onboarding date

---

*Version 1.1 — Updated May 8, 2026. Cross-reference PAYMENT_POLICY.md for full payment, cancellation, and reschedule policy. Cross-reference MONETIZATION_STRATEGY.md for full revenue architecture.*
