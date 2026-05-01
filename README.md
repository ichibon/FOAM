# FOAM — Project README

> The operating system for mobile auto detailing. Where customers find and book the best detailers, and detailers run their entire business.

---

## What This Is

A mobile-first marketplace app with three distinct experiences — customers, detailers, and crew — built on a single codebase. Inspired by the experience model of The Cut (barbershop app), purpose-built for the mobile auto detailing industry.

This README is the entry point for the entire project. Every major decision — product, design, architecture, strategy, brand — lives in the `/MD` folder as a structured markdown file. When in doubt, check the docs before asking or assuming.

---

## Project Status

| Phase | Status |
|-------|--------|
| Documentation & Planning | 🟡 In Progress |
| Brand Identity | 🔴 Not Started |
| Design System & Wireframes | 🟡 In Progress |
| MVP Development | 🔴 Not Started |
| Detailer Recruitment (Atlanta) | 🔴 Not Started |
| Soft Launch | 🎯 Target: July 2025 |
| Public Launch | 🎯 Target: August 2025 |

---

## The Stack

| Layer | Tool |
|-------|------|
| Frontend / Mobile | React Native (Expo) |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Payments | Stripe + Stripe Connect |
| File Storage | Supabase Storage |
| SMS Notifications | Twilio |
| Push Notifications | Expo Notifications |
| Weather Data | Tomorrow.io or Open-Meteo |
| Maps & Routing | Google Maps API |
| Development Environment | Replit |
| UI Design | UXPilot |
| AI Co-Development | Claude |

---

## The Three User Roles

**Customer** — Finds detailers by location, books services, pays in-app, builds a relationship with their detailer over time. Free to use.

**Detailer / Owner** — Uses the platform as a complete business OS. Manages bookings, payments, customers, service menu, crew, and business performance from a single app. Pays a monthly subscription + per-booking platform fee.

**Crew Member** — Subordinate account linked to an owner. Sees assigned jobs, navigates to locations, marks jobs complete, tracks personal earnings. Access controlled by owner.

---

## Monetization Summary

### Detailer Subscriptions
| Tier | Monthly | Standard Booking Fee | Recurring Booking Fee |
|------|---------|---------------------|----------------------|
| Starter | $29–39 | $10 | $8 |
| Pro | $69–89 | $8 | $6 |
| Crew | $149–199 | $6 | $5 |

Annual plans available at all tiers (2 months free).
Additional crew beyond 3: $20–25/month per tech.

### Customer
- Free to book
- Rain Coverage Membership: $7.99/month (V2)

---

## Quick Links — MD Documentation

All documentation lives in the `/MD` folder. Here's what exists and what each file covers.

---

### 📦 Product

#### [`/MD/product/VISION.md`](/MD/product/VISION.md)
The north star. Why this exists, what problem it solves, the founder's edge, and Year 1 success metrics. Start here if you're new to the project.

#### [`/MD/product/CORE_CONCEPTS.md`](/MD/product/CORE_CONCEPTS.md)
The foundational mechanics of the platform — the three roles, the marketplace model, the OS concept, the permission architecture, Rain Coverage, recurring appointments, and geographic strategy. Reference this when making any product decision.

#### [`/MD/product/FEATURES.md`](/MD/product/FEATURES.md)
Complete feature list for MVP (V1) and V2, broken down by user role (customer, detailer, crew). Includes a priority table (P0/P1/P2) for build order. Reference this during development sprints and scope conversations.

---

### 🏗️ Architecture

#### [`/MD/architecture/ARCHITECTURE.md`](/MD/architecture/ARCHITECTURE.md)
The full system overview — architectural philosophy, system diagram, tech stack with rationale, application architecture (single app / three roles), backend design (Supabase RLS, Edge Functions), payment money flow, notification delivery stack, media storage buckets, security threat model, authentication flow, environment setup, and scalability path. Read this first before touching any backend code or infrastructure.

#### [`/MD/architecture/CAPABILITY_LAYER.md`](/MD/architecture/CAPABILITY_LAYER.md)
The functional systems powering the platform — booking engine, payment infrastructure, notification system, weather API, location and routing, media storage, CRM engine, reporting, and review system. Reference this when designing backend logic or integrating third-party services.

#### [`/MD/architecture/DATA_MODEL.md`](/MD/architecture/DATA_MODEL.md)
Full Supabase/PostgreSQL schema. All tables, columns, types, and relationships for users, bookings, payments, crew, vehicles, reviews, subscriptions, inventory, and rain protection. Reference this when writing database queries, building API routes, or setting up Supabase.

---

### 🎨 Design

#### [`/MD/design/DESIGN_SYSTEM.md`](/MD/design/DESIGN_SYSTEM.md)
The visual foundation — color system (dark and light mode with full Cobalt Blue accent palette), typography (Outfit + Inter), spacing system, border radius, elevation/shadow, component library specs (buttons, inputs, cards, bottom sheets), iconography, and motion summary. Reference this in UXPilot and when writing component styles.

#### [`/MD/design/INTERACTION_PRINCIPLES.md`](/MD/design/INTERACTION_PRINCIPLES.md)
How the app behaves — core UX principles, navigation structure for all three roles, key interaction flows (booking, job management, crew assignment), gesture vocabulary, motion and animation timing, empty states, loading states, and accessibility requirements. The Cut is the experience benchmark. Reference this before designing or building any screen.

#### [`/MD/design/MICROCOPY.md`](/MD/design/MICROCOPY.md)
Every word the app says. Voice and tone guide, onboarding copy for customers and detailers, booking flow copy, empty states, error messages, notification text, button and CTA tone guide, and Rain Coverage membership copy. Reference this before writing any in-app text.

---

### 🏢 Brand

#### [`/MD/brand/BRAND_DNA.md`](/MD/brand/BRAND_DNA.md)
The brand foundation — essence (Control), five character traits, four voice principles with Do/Don't tables, brand promise, and the enemy FOAM exists to defeat ("Good Enough"). Everything FOAM says publicly traces back to this document. Reference this before writing any copy, designing any screen, or making any marketing decision.

#### [`/MD/brand/VISUAL_IDENTITY.md`](/MD/brand/VISUAL_IDENTITY.md)
Complete creative brief for the design team — typography direction (Outfit + Inter, with rationale), full color palette psychology and specific hex values, photography style guide (what to shoot, how to light it), logo concept direction (water bead mark + wordmark), and the three words every new customer should feel. Reference this in UXPilot and before any visual production.

#### [`/MD/brand/BRAND_MESSAGE_HIERARCHY.md`](/MD/brand/BRAND_MESSAGE_HIERARCHY.md)
The messaging source of truth — tagline ("Your business. Your car. Clean."), elevator pitch (standard and investor variants), long-form brand story (problem, solution, vision), and audience-specific key messages for solo detailers, crew operators, and customers. Includes a competitor proof test table. Reference this for every campaign, pitch deck, and public communication.

#### [`/MD/brand/SOCIAL_MEDIA_BRAND_GUIDE.md`](/MD/brand/SOCIAL_MEDIA_BRAND_GUIDE.md)
The execution playbook for Instagram, TikTok, Facebook, and Meta Ads — six visual templates with exact specs, caption style guide (tone, length, signature phrases, emoji rules), six content categories with look/feel definitions, the five brand elements required in every post, and the five things FOAM never does. Includes a weekly content calendar cadence for the Atlanta launch phase.

#### [`/MD/brand/BRAND_STORY.md`](/MD/brand/BRAND_STORY.md)
The founder origin story in four formats — 50-word social bio, 200-word core (Hero's Journey), 350-word about page, and 600-word full founder narrative for press and pitch contexts. Built around the Foam Auto Spa origin. Reference this for the about page, App Store description, press kit, and any founder-facing communication.

---

### 📈 Strategy

#### [`/MD/strategy/COMPETITIVE_ANALYSIS.md`](/MD/strategy/COMPETITIVE_ANALYSIS.md)
Full breakdown of direct competitors (Washos, Spiffy, Detail King, Mobile Tech RX), indirect competitors (Booksy, Vagaro, Square, Google/Yelp), competitive gaps the platform exploits, the real strategic moat (data lock-in), and a monitoring cadence. Reference this before any positioning or marketing decision.

#### [`/MD/strategy/GO_TO_MARKET.md`](/MD/strategy/GO_TO_MARKET.md)
Three-phase launch plan — supply activation (pre-launch), soft launch (July), public launch (Aug–Sep). Covers detailer recruitment strategy, customer acquisition channels, launch market (Atlanta only), KPIs by phase, and what not to do. Reference this for every GTM and growth decision.

#### [`/MD/strategy/PRICING_STRATEGY.md`](/MD/strategy/PRICING_STRATEGY.md)
Detailed tier breakdowns, customer pricing rationale, flat fee vs. percentage analysis, unit economics modeling, competitive pricing context, and pricing review cadence. Reference this before any pricing conversation with detailers or investors.

#### [`/MD/strategy/ROADMAP.md`](/MD/strategy/ROADMAP.md)
Full build and GTM timeline from now through Q2 2026. Organized by phase: Foundation, Soft Launch, Public Launch, Deepen the OS, Growth Infrastructure, Market 2. Includes a parking lot for validated ideas without a timeline. Reference this during sprint planning and investor conversations.

#### [`/MD/strategy/AEO_SEO_GEO.md`](/MD/strategy/AEO_SEO_GEO.md)
Complete discoverability strategy across three disciplines: SEO (ranking on Google), AEO (being cited by AI assistants like ChatGPT and Perplexity), and GEO (owning local market answers city by city). Includes keyword strategy, content pillars, schema markup requirements, Atlanta launch tactics, and an integrated calendar. Reference this when building the marketing site, publishing content, or planning press outreach.

---

### 🤖 AI

#### [`/MD/ai/AI_RULES.md`](/MD/ai/AI_RULES.md)
Rules for how Claude is used in this project — AI roles, decision boundaries, prompt engineering guidelines, saved prompts for recurring sessions, and hallucination prevention rules. Reference this at the start of every Claude working session.

#### [`/MD/ai/AI_CONFIDENCE_MODEL.md`](/MD/ai/AI_CONFIDENCE_MODEL.md)
The scoring framework for every AI-generated recommendation in this project. Defines the 0.0–1.0 confidence scale, domain-specific confidence ceilings, decay rules, override protocols, and the confidence log tracking all major decisions. Reference this whenever an AI recommendation is being acted on — especially for pricing, GTM, and product decisions.

---

## How to Use These Docs

**Starting a new Claude session?**
Load `VISION.md` and `CORE_CONCEPTS.md` as context first. Then load whichever domain file is relevant to the session (e.g., `FEATURES.md` for product work, `DATA_MODEL.md` for backend work).

**Making a product decision?**
Check `CORE_CONCEPTS.md` and `FEATURES.md` first. If the answer isn't there, document the decision in the relevant file after it's made.

**Writing code?**
Start with `ARCHITECTURE.md` for the full system map, then `DATA_MODEL.md` for schema, `CAPABILITY_LAYER.md` for system logic, and `DESIGN_SYSTEM.md` for component specs.

**Designing a screen?**
Start with `INTERACTION_PRINCIPLES.md` for behavior, `DESIGN_SYSTEM.md` for visual specs, and `MICROCOPY.md` for every word on the screen.

**Talking to a detailer, investor, or partner?**
`VISION.md` for the pitch, `COMPETITIVE_ANALYSIS.md` for positioning, `PRICING_STRATEGY.md` for the business model, `GO_TO_MARKET.md` for the plan.

---

## Outstanding Decisions

These are open questions that need resolution before or during development:

- [x] **App name** — FOAM ✅
- [x] **Brand identity** — Brand DNA, Visual Identity, Message Hierarchy, Social Guide, and Brand Story complete ✅
- [x] **Design System accent colors** — Cobalt Blue (#2563EB) and Outfit/Inter locked in DESIGN_SYSTEM.md ✅
- [ ] **Legal review** — Rain Coverage membership structure needs attorney review before launch
- [ ] **React Native vs PWA** — Confirm approach for cross-platform development in Replit
- [ ] **Android timeline** — iOS confirmed as primary; Android launch date to be set

---

## Folder Structure

```
/
├── README.md                               ← You are here
├── /MD
│   ├── /product
│   │   ├── VISION.md
│   │   ├── CORE_CONCEPTS.md
│   │   └── FEATURES.md
│   ├── /architecture
│   │   ├── ARCHITECTURE.md                 ← Start here for backend work
│   │   ├── CAPABILITY_LAYER.md
│   │   └── DATA_MODEL.md
│   ├── /design
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── INTERACTION_PRINCIPLES.md
│   │   └── MICROCOPY.md
│   ├── /brand
│   │   ├── BRAND_DNA.md
│   │   ├── VISUAL_IDENTITY.md
│   │   ├── BRAND_MESSAGE_HIERARCHY.md
│   │   ├── SOCIAL_MEDIA_BRAND_GUIDE.md
│   │   └── BRAND_STORY.md
│   ├── /ai
│   │   ├── AI_RULES.md
│   │   └── AI_CONFIDENCE_MODEL.md
│   └── /strategy
│       ├── COMPETITIVE_ANALYSIS.md
│       ├── GO_TO_MARKET.md
│       ├── PRICING_STRATEGY.md
│       ├── ROADMAP.md
│       └── AEO_SEO_GEO.md
├── /wiki                                   ← GitHub Wiki source files
│   ├── Home.md
│   ├── Start-Here.md
│   ├── _Sidebar.md
│   ├── wiki-setup.sh
│   └── WIKI_SETUP_INSTRUCTIONS.md
└── /src                                    ← App source code (coming)
```

---

## Founder Context

Built by a first-generation American who operated a mobile detailing business called Foam Auto Spa in Atlanta, GA. The product exists because the founder lived the problem — managing crew through text messages, chasing payments on Venmo, and losing customer vehicle history when a phone died. That operator experience is the product's unfair advantage over every competitor who studied the industry from the outside.

---

*Last updated: April 2026. Update this README whenever a major decision is made or a new file is added.*
