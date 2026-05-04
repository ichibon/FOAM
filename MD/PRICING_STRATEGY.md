# Pricing Strategy

## Philosophy
Charge detailers for value, not for access. The platform fee should feel like the cheapest employee a detailer has ever hired — one that manages their calendar, collects their money, and brings them customers while they focus on the work.

---

## Confirmed Launch Pricing

| Tier | Monthly | Annual (2 mo free) | Effective Monthly | Annual Savings |
|------|---------|-------------------|-------------------|----------------|
| Starter | $29 | $290 | $24.17 | $58 |
| Pro | $69 | $690 | $57.50 | $138 |
| Crew | $149 | $1,490 | $124.17 | $298 |

These are launch floors, not permanent prices. As the platform proves its value, pricing moves up within the documented ranges ($29-39, $69-89, $149-199). Founding operators lock in their rate for 12 months from onboarding. New subscribers get the prevailing price at time of signup.

Annual is the priority conversion target. Push it prominently on the pricing page (default selection), during onboarding, and again at the 60-day mark for monthly subscribers. Annual subscribers churn at significantly lower rates and generate upfront capital that funds growth before it's "earned" month by month.

---

## Detailer Subscription Tiers

### Starter — $29/month | $290/year
**Who it's for:** Solo detailers just getting started or testing the platform. This tier gets money moving. It's a professional foundation, not a full business OS — and that's intentional. Operators who build real volume will feel the ceiling and upgrade.

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

### Pro — $69/month | $690/year
**Who it's for:** Established solo operators running a real business. This is where serious detailers live. The CRM and recurring automation alone recover the subscription cost many times over. A detailer with 50 customers who isn't automating follow-ups is leaving real money on the table every month.

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

### Crew — $149/month | $1,490/year
**Who it's for:** Detailers running multi-tech operations. At this volume, managing routes, commissions, crew performance, and customer ETAs manually is a full-time job. This tier handles all of it. For an operator running 3 techs and 80 jobs a month, $149 is rounding error.

**What's included:** Everything in Pro, plus:
- Crew member accounts (up to 3 techs included)
- Job assignment and crew scheduling
- Commission and tip splitting rules
- Individual crew performance tracking
- GPS crew tracking in the field
- Customer ETA notifications tied to crew location
- Route optimization across multiple techs
- Owner dashboard — all jobs, all crew, in real time

**Platform fee:** $6 per standard booking / $5 per recurring booking
**Additional crew beyond 3:** $20-25/month per tech

---

## Annual Plans

All tiers available annually at 2 months free (approximately 17% discount).

**Why annual matters beyond the discount:**

Churn protection. A monthly subscriber can leave after 30 days with zero friction. An annual subscriber has already committed. Retention curves on annual plans are dramatically better, and in a marketplace business, operator retention is everything. A detailer who churns takes their customers and booking history with them.

Cash flow. Annual subscribers pay upfront. At 50 Pro operators on annual plans, that's $34,500 hitting the account at once — real capital available before it's earned month by month.

**How to pitch it to operators:** Don't frame it as paying for 10 months and getting 12. Frame it as locking in the founding rate. An operator who signs annual today is protected from price increases for a full year. That's a real benefit, especially when pricing is transparently expected to move up as the platform grows.

**UX note:** Annual should be the default selection on the pricing page. Make monthly the opt-down alternative. That one decision alone will move annual conversion meaningfully.

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

### FOAM+ Membership: $14.99/month
FOAM+ is the full customer membership product. Rain Coverage is the entry point — FOAM+ is the destination. Customers booking $150-300 details are not price-sensitive on a $15/month membership. The vehicle concierge feature alone drives repeat GMV without requiring marketing spend.

**What's included:**
- Rain Coverage (automatic exterior wash within 72 hours of measurable rain post-detail)
- Priority booking — guaranteed availability within 48 hours from FOAM+ operators
- Vehicle concierge — platform-initiated rebooking reminders based on service history and elapsed time
- 1 free exterior wash per quarter included with any full-service booking
- 5-10% off standard booking price on recurring appointments
- Early access to new operators and services as they launch in new markets

**Annual option:** $129.99/year (approximately 2 months free)

**Launch timing:** V2 — design alongside Rain Coverage so the infrastructure supports expansion from the start. The goal is to make FOAM feel like a utility, not a service customers have to remember to use.

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
- Cheaper than Square (2.6% + $0.10) on any ticket over ~$385 at Starter tier — a real competitive talking point on premium services

**Flat fee cons:**
- Doesn't scale with ticket size — a $300 ceramic coating costs the same as a $50 wash
- Leaves money on the table at higher price points

**Decision:** Launch with flat fee for simplicity and detailer trust. Revisit at scale.

**Potential hybrid (V2 consideration):** Flat fee up to $150 ticket, then 4-5% above that threshold. This captures upside on premium services without penalizing standard bookings.

### Strategic Note on Recurring Booking Fees
The current structure discounts recurring bookings to incentivize the behavior. There is a case that this is backwards: recurring appointment automation is a Pro and Crew feature. The correct lever long-term may be tier-gating the feature rather than discounting the transaction. An operator who wants recurring automation upgrades to Pro — that upgrade revenue is worth more than the $2 per-booking discount being given up.

**Recommendation:** Launch with current structure for simplicity and operator trust. Revisit at the 12-month pricing review with real conversion and churn data in hand.

---

## Unit Economics (Illustrative)

### Solo Detailer on Pro Tier
- Monthly subscription: $69
- Average bookings per month: 25
- Average booking fee: $8 (mix of standard and recurring)
- Monthly booking fee revenue: $200
- Total monthly revenue per detailer: $269
- Annual revenue per detailer: $3,228

### Crew Operator on Crew Tier (3 techs, 80 jobs/month)
- Monthly subscription: $149
- Average booking fee: $5.50 (mix of standard and recurring)
- Monthly booking fee revenue: $440
- Total monthly revenue per operator: $589
- Annual revenue per operator: $7,068

### Revenue Targets
| Active Detailers | Avg Monthly Rev/Detailer | Monthly Platform Revenue | Annual Run Rate |
|-----------------|------------------------|------------------------|-----------------|
| 25 | $200 | $5,000 | $60,000 |
| 50 | $220 | $11,000 | $132,000 |
| 100 | $250 | $25,000 | $300,000 |
| 200 | $275 | $55,000 | $660,000 |

---

## Competitive Pricing Context

| Competitor | Price Range | What's Missing |
|---|---|---|
| Detail King / Mobile Tech RX | $50-100/month | No marketplace, no payments, dated UX |
| Booksy | $30-90/month | Not built for mobile services, no travel time logic |
| Vagaro | $30-85/month | Fixed-location software hacked for mobile work |
| Square Appointments | Free to $70/month + 2.6% + $0.10/transaction | No detailing features, percentage fees hurt on high tickets |

**Positioning:** Premium to generic tools (justified by purpose-built features and marketplace access), competitive with detailing-specific software, and cheaper than Square on any premium service ticket.

**The Square angle is worth using actively in operator sales conversations.** A $250 detail job costs a detailer $6.60 in Square fees. FOAM's flat $8-10 is more predictable and often cheaper, and comes with a marketplace, CRM, and crew tools Square will never build.

---

## Future Revenue Lines

These are not launch-day features. They are strategic revenue streams that activate as the platform reaches density and data maturity. Documented here so product and architecture decisions support them from day one.

### B2B Fleet and Corporate Accounts
Fleet and corporate accounts operate on a monthly retainer structure separate from standard tier pricing. A company pays a flat monthly fee covering a defined volume of detail services. FOAM dispatches operators, handles payment, and manages scheduling. The B2B client gets a managed vendor relationship without managing a vendor. Pricing is custom — reference MONETIZATION_STRATEGY.md for structure and target segments.

### Supply Marketplace
FOAM earns referral margin on operator supply purchases made through an in-app curated catalog. 10-20% margin via drop-ship arrangements with premium detailing supply brands. No inventory held by FOAM. Operators save money through negotiated bulk pricing; FOAM earns on the spread. Target: Year 2.

### Certification Program
FOAM-branded operator credentials (FOAM Certified Detailer, Ceramic Specialist, Paint Correction Pro). Priced at $199-499 per certification with $79-99 annual renewal. Certified operators display badges on their profiles and rank higher in search results. Requires one credible training partner to establish legitimacy at launch. Target: Year 2.

### Sponsored Operator Placement
Operators pay to rank higher in neighborhood and city search results — similar to promoted listings on delivery platforms. High-margin, low-infrastructure revenue. Do not launch before the marketplace feels organically full — placement value depends on real competition for visibility. Target: Year 2.

### FOAM Advance (Revenue-Based Financing)
Short-term capital for operators underwritten on platform GMV history — not traditional credit. Flat fee model (not interest). Repaid as a fixed percentage of future bookings processed through FOAM. Requires a Banking-as-a-Service partner (Unit, Column, or Stripe Treasury). Begin partner conversations at Month 6. Pilot target: Month 18. Full structure in MONETIZATION_STRATEGY.md.

### FOAM Business Debit
Co-branded operator debit card for business expenses — gas, supplies, equipment. FOAM earns interchange on every transaction. Expenses auto-categorize against the operator P&L dashboard built into the Pro and Crew tiers. Requires BaaS partner. Target: Year 2-3.

---

## Pricing Review Cadence
- Review detailer tier pricing at 6 months post-launch — evaluate moving to mid-range ($34/$79/$169) for new subscribers
- Review platform fee structure at 12 months post-launch — include recurring fee logic evaluation
- Review customer membership pricing at 12 months post-launch
- Any pricing change requires 30-day notice to existing subscribers
- Founding detailer pricing locked for 12 months from their onboarding date

---

*Last updated: May 2026. Confirmed launch pricing: $29/$69/$149 monthly, $290/$690/$1,490 annually. Cross-reference MONETIZATION_STRATEGY.md for full revenue architecture and future revenue stream detail.*
