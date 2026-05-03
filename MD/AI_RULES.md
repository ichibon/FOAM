# AI Rules & Confidence Model

## Purpose
This document defines how AI — specifically Claude — is used in the development and ongoing operation of this platform. It establishes rules for AI-assisted decision making, confidence thresholds, and where AI judgment is trusted vs. where human review is required.

---

## AI Roles in This Project

### 1. Product Co-Architect
Claude contributes to feature design, prioritization logic, business model decisions, and product strategy. Every significant product decision documented in this project has an associated confidence score and caveat set.

### 2. Development Co-Pilot
Claude assists with code generation, debugging, database schema design, API logic, and Supabase configuration. Claude works within the Replit environment.

### 3. Content & Copy Engine
Claude generates microcopy, notification text, onboarding flows, error messages, and marketing copy. Human review required before production deployment.

### 4. Business Intelligence
Claude interprets product data, competitive signals, and market feedback to inform roadmap decisions. Outputs are recommendations, not directives.

---

## Confidence Model

All complex AI-generated recommendations carry an explicit confidence score from 0.0 to 1.0.

### Score Definitions
```
0.9 – 1.0:   High confidence. Established patterns, strong reasoning, low ambiguity.
              Action: Proceed. Document rationale.

0.8 – 0.89:  Solid confidence. Good reasoning with minor uncertainties.
              Action: Proceed with awareness of noted caveats.

0.7 – 0.79:  Moderate confidence. Reasonable but assumptions present.
              Action: Validate with user research or market data before committing.

0.6 – 0.69:  Low-moderate confidence. Directionally useful, not definitive.
              Action: Treat as hypothesis. Test before building.

Below 0.6:   Low confidence. Significant uncertainty or insufficient data.
             Action: Do not act on this without external validation. Flag for research.
```

### Confidence Decay Rules
- Confidence scores apply to the moment of generation
- Market conditions, user feedback, or new information can invalidate prior scores
- Any recommendation older than 90 days should be re-evaluated
- Scores on pricing, GTM, and competitive analysis decay fastest

---

## AI Decision Boundaries

### AI Can Decide Autonomously
- Code structure and implementation patterns
- Copy and microcopy drafts (subject to human review)
- Documentation structure and content
- Feature logic descriptions
- Database schema suggestions

### AI Recommends, Human Decides
- Pricing changes
- Feature prioritization shifts
- Go-to-market timing
- Partnership decisions
- Any decision with financial commitment attached

### AI Is Not Used For
- Final legal or compliance determinations
- Financial modeling with real capital at stake
- User data analysis (privacy boundary)
- Any decision affecting crew or customer safety

---

## Prompt Engineering Rules

### Context Always Comes First
Every AI session working on this project should begin with relevant context files loaded. The AI does not carry memory between sessions. Load VISION.md and CORE_CONCEPTS.md as baseline context for any product decision session.

### Be Specific, Not Vague
Bad prompt: "Help me with the booking flow."
Good prompt: "I need the customer booking flow for MVP. The customer has already selected a detailer. Walk me through the steps from service selection to payment confirmation, and flag any edge cases."

### Challenge the Output
AI outputs should be pressure-tested. If a recommendation feels too easy or too obvious, ask Claude to argue the opposite position or identify the weakest assumption in its own reasoning.

### Version Prompts That Work
When a prompt produces a high-quality, reusable output, document it in this file for future reference.

---

## Saved Prompts (Running Log)

### Product Strategy Session Opener
```
Context: I'm building a mobile auto detailing marketplace app with a full operator OS for detailers and crews. 
The model is similar to The Cut (barbershop app). I ran a mobile detailing business called Foam Auto Spa. 
Load VISION.md and CORE_CONCEPTS.md before responding. 
Today's question: [INSERT]
```

### Feature Scoping Prompt
```
I need to define MVP vs V2 for [FEATURE NAME]. 
Users: [Customer / Detailer / Crew]. 
Core job to be done: [WHAT THEY'RE TRYING TO DO]. 
What's the minimum version that actually works, and what gets cut to V2?
```

### Competitive Analysis Prompt
```
Analyze [COMPETITOR NAME] in the context of a mobile auto detailing marketplace with full operator OS. 
Focus on: what they do well, where they fall short, and what gaps I can exploit. 
Be direct. Tell me if they're actually a threat.
```

### Copy Generation Prompt
```
Write [copy type: notification / empty state / error message / CTA] for [USER TYPE: customer / detailer / crew].
Context: [what just happened or what state the user is in].
Voice: Upbeat, friendly, energetic, with swagger. Not corporate. Not robotic.
Give me 2-3 options.
```

---

## Hallucination Prevention Rules
- Never accept specific statistics, market size numbers, or competitor funding figures from AI without verifying via web search
- Legal and compliance guidance from AI is a starting point only — always verify with a qualified attorney
- Pricing benchmarks from AI are directional — validate with real detailer interviews before committing
- Any AI statement beginning with "typically" or "generally" is a pattern claim, not a fact — treat accordingly
