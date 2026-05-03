# FOAM — AI Confidence Model

> Every AI-assisted decision in this project carries a confidence score. This document defines what those scores mean, how they're applied, and what happens when confidence is too low to act.

---

## Why This Exists

AI is embedded in how FOAM is being built — from product decisions to copy to code. That's a competitive advantage if used with discipline. It becomes a liability the moment a low-confidence AI output gets treated like a high-confidence fact.

This document exists to prevent that. It defines the rules for how AI judgment is weighted, when human override is required, and how confidence degrades over time as conditions change.

The goal isn't to distrust AI. It's to use it with the same critical rigor you'd apply to any advisor who is brilliant but occasionally wrong.

---

## The Confidence Scale

All AI-generated recommendations, analyses, and decisions are scored on a 0.0 to 1.0 scale.

### Score Definitions

| Score Range | Label | Meaning | Required Action |
|-------------|-------|---------|-----------------|
| 0.90 – 1.00 | High | Strong reasoning, established patterns, low ambiguity. Outcome is predictable. | Proceed. Document rationale. |
| 0.80 – 0.89 | Solid | Good reasoning with minor uncertainties. Most assumptions are grounded. | Proceed with noted caveats tracked. |
| 0.70 – 0.79 | Moderate | Reasonable but assumptions are present. Some variables unknown. | Validate with data or user input before committing. |
| 0.60 – 0.69 | Low-Moderate | Directionally useful. Not reliable enough to act on alone. | Treat as hypothesis. Build a test before building the feature. |
| 0.50 – 0.59 | Low | Significant uncertainty. More unknowns than knowns. | Do not act without external validation. Flag for research. |
| Below 0.50 | Unreliable | Insufficient basis for a recommendation. | Discard or rephrase the question entirely. |

---

## Confidence by Decision Domain

Different types of decisions carry different baseline confidence ceilings — not because the reasoning is weaker, but because the variables are harder to predict.

### Domain Confidence Ceilings

| Decision Domain | Max Reliable AI Confidence | Why It Caps Here |
|----------------|---------------------------|-----------------|
| Code logic and architecture | 0.95 | Deterministic. Right or wrong is verifiable. |
| UX and interaction patterns | 0.88 | Best practices exist but user behavior varies. |
| Copywriting and microcopy | 0.85 | Voice is learnable; audience resonance requires testing. |
| Feature prioritization | 0.82 | Product logic is sound; market validation isn't AI's job. |
| Competitive analysis | 0.80 | Based on available information; competitors move. |
| Pricing strategy | 0.78 | Logic is sound; willingness-to-pay requires real users. |
| Go-to-market tactics | 0.75 | Frameworks are reliable; execution is contextual. |
| Market size and revenue projections | 0.65 | Too many unverifiable variables. Use as directional only. |
| Legal and compliance guidance | 0.50 | Starting point only. Attorney required before acting. |
| User psychology and behavior | 0.70 | Patterns exist; individuals deviate. Test before scaling. |

### What This Means in Practice

When Claude produces a pricing recommendation at 0.82 confidence, that score should be read as: *the logic is sound and the reasoning is grounded, but this number should be validated against real detailer conversations before it becomes the published price.* The 0.82 doesn't mean wrong. It means "verified reasoning, unverified market."

---

## Confidence Decay Rules

A confidence score is only valid at the moment it was generated. Conditions change. Information ages.

### Decay Triggers — Immediate Re-evaluation Required

Any of the following invalidates a prior confidence score immediately:

- A competitor launches a new product or pricing change
- User research contradicts an assumption the score was based on
- A market condition shifts (economy, regulation, seasonal behavior)
- The feature or strategy the score applied to has materially changed
- More than 90 days have passed since the score was assigned

### Decay by Domain

| Domain | Confidence Half-Life |
|--------|---------------------|
| Competitive analysis | 60 days |
| Pricing strategy | 90 days |
| Go-to-market tactics | 90 days |
| Feature prioritization | 120 days |
| Brand and messaging | 180 days |
| Code architecture | Until a breaking change |
| UX patterns | Until user testing contradicts |

### The 90-Day Rule

Any AI recommendation older than 90 days that has not been re-validated should be treated as expired. Don't make decisions based on it without re-running the reasoning with current context.

---

## The Override Protocol

AI recommends. Humans decide. These are not the same thing.

### When Human Override Is Required

The following decision types require explicit human judgment regardless of AI confidence score:

| Decision Type | Why Human Override Is Required |
|--------------|-------------------------------|
| Pricing changes | Affects real revenue and detailer trust |
| Feature cuts from roadmap | Affects team effort and user expectations |
| Go-to-market timing | Has financial and reputational consequences |
| Partnership agreements | Legal and relational complexity |
| Hiring or compensation | Human judgment, legal exposure |
| Public statements or crisis response | Brand and legal risk |
| Any decision with capital commitment | Irreversible financial consequence |
| Legal or compliance determinations | Requires licensed professional |

### When AI Can Decide Autonomously

| Decision Type | Rationale |
|--------------|-----------|
| Code structure and implementation | Verifiable output, reversible |
| Copy and microcopy drafts | Subject to human review before publishing |
| Documentation structure | Low-stakes, easy to revise |
| Feature logic descriptions | Conceptual, not binding |
| Database schema suggestions | Reviewed before implementation |
| Wireframe and UX flow proposals | Input to design process, not final output |

---

## Confidence Scoring in Practice

### How to Read a Scored Recommendation

Every significant AI recommendation in this project should include:

1. **The recommendation** — what is being suggested
2. **The confidence score** — 0.0 to 1.0
3. **The reasoning** — why this score was assigned
4. **The key caveats** — what assumptions could break it
5. **The validation path** — what would need to be true to raise confidence

**Example:**

> **Recommendation:** Set Starter tier at $29/month.
> **Confidence:** 0.78
> **Reasoning:** Comparable SaaS tools in adjacent service categories (Booksy, Square) price between $0-70/month. $29 positions FOAM as accessible to new detailers without undervaluing the platform. Recurring fee model reduces price sensitivity.
> **Caveats:** No direct comparable exists for a purpose-built detailing OS. Willingness-to-pay is unvalidated. Detailers in the Atlanta market may have different price sensitivity than the broader industry.
> **Validation path:** Interview 10-15 Atlanta detailers. Present three pricing options blindly ($19, $29, $39). Observe where resistance occurs.

### Confidence Score Log

Track all major scored decisions in the table below. Update when scores are re-evaluated or decisions are validated/invalidated.

| Date | Decision | Domain | Score | Status | Validated? |
|------|----------|--------|-------|--------|------------|
| Apr 2026 | Starter tier: $29-39/month | Pricing | 0.78 | Active | Pending detailer interviews |
| Apr 2026 | Launch in Atlanta first | GTM | 0.87 | Active | Confirmed |
| Apr 2026 | Flat fee over percentage | Pricing | 0.74 | Active | Pending |
| Apr 2026 | iOS before Android | Product | 0.85 | Active | Confirmed |
| Apr 2026 | Supply-first activation | GTM | 0.89 | Active | Confirmed |
| Apr 2026 | React Native (Expo) stack | Architecture | 0.82 | Active | Pending build |
| Apr 2026 | Rain Coverage at $7.99/month | Pricing | 0.79 | Active | Pending legal review |
| Apr 2026 | The Cut as experience benchmark | Product | 0.86 | Active | Confirmed |

---

## Hallucination Prevention Protocol

AI outputs that reference specific facts must be verified before use. No exceptions.

### Always Verify Before Using

| Data Type | Verification Method |
|-----------|-------------------|
| Market size figures ("$15B industry") | Industry reports, Statista, IBISWorld |
| Competitor pricing | Check competitor websites directly |
| Competitor funding or valuation | Crunchbase, press releases |
| Legal or regulatory claims | Attorney review |
| App Store statistics or rankings | App Store Connect, Sensor Tower |
| User behavior patterns ("users typically...") | Your own analytics or cited research |
| Geographic market data | Census data, local business reports |

### Phrases That Signal Unverified Claims

When AI uses the following language, treat the output as a hypothesis — not a fact:

- "Typically..." — a pattern claim, not verified data
- "Studies suggest..." — source required before using
- "Generally speaking..." — directional, not definitive
- "Most users..." — requires your own data to validate
- "Industry standard..." — verify against actual competitors
- "Research shows..." — ask for the specific research

### The Verification Rule

If a statistic or fact from an AI output is going to appear in a pitch deck, press release, investor communication, or public marketing — it must be independently verified first. AI confidence in the reasoning does not equal verified facts.

---

## AI Confidence in the Product Itself

As FOAM builds AI-powered features into the platform — lapsed customer detection, route optimization suggestions, smart scheduling — those features will also carry confidence thresholds.

### Product-Level AI Confidence Standards

| Feature | Minimum Confidence to Show | Fallback Below Threshold |
|---------|--------------------------|--------------------------|
| Lapsed customer re-engagement trigger | 0.75 | Don't trigger, log for manual review |
| Route optimization suggestion | 0.80 | Show manual order, flag optimization as unavailable |
| Smart scheduling recommendation | 0.78 | Show available slots without ranked suggestion |
| Rain event detection (Rain Coverage) | 0.95 | Do not trigger claim — false positives cost money |
| Revenue forecast (owner dashboard) | 0.70 | Show as estimate range, not precise projection |

Rain Coverage has the highest confidence requirement because a false positive means FOAM pays for a wash that wasn't earned. The threshold is 0.95 — measurable rainfall confirmed, not forecasted.

---

## The Bottom Line

High confidence means proceed with awareness.
Moderate confidence means validate before committing.
Low confidence means test before building.
No confidence means don't ship it.

The score is not permission. It's information. Use it accordingly.
