# Capability Layer

## Overview
The capability layer defines the functional systems that power the platform. These are the underlying engines behind every feature — not what users see, but what makes everything work.

---

## Authentication & Identity
- Email/password and social login (Google, Apple)
- Role-based account types: Customer, Detailer/Owner, Crew Member
- Owner creates crew accounts; crew accounts are subordinate and linked
- JWT-based session management via Supabase Auth
- Permission scopes defined per role at account creation and adjustable by owner

---

## Booking Engine
- Real-time availability calculation based on calendar, travel buffers, and service duration
- Conflict detection — prevents double-booking
- Booking state machine: Requested → Confirmed → In Progress → Completed → Reviewed
- Cancellation and rescheduling logic with configurable notice windows
- Recurring appointment scheduler with automated rebooking triggers
- Waitlist queue management per detailer

---

## Payment Infrastructure (Stripe)
- Customer payment capture at booking (card on file or pay at booking)
- Deposit collection option for detailers
- Tip processing at job completion
- Stripe Connect for detailer payouts (direct deposit)
- Platform fee deduction per transaction before payout
- Subscription billing for detailer monthly plans (Starter/Pro/Crew)
- Rain Protection Membership subscription at $7.99/month
- Refund and dispute handling routed through Stripe

---

## Notification System
- Push notifications (iOS and Android via Expo Notifications or similar)
- SMS notifications via Twilio
- Automated triggers:
  - Booking confirmation (customer + detailer)
  - 24-hour reminder (customer)
  - 1-hour reminder (customer)
  - Detailer en route (customer) — V2
  - Job completion confirmation (customer)
  - Review request (customer, 1 hour post-completion)
  - Lapsed customer re-engagement (60-day no-booking trigger) — V2
  - Low inventory alert (detailer) — V2
- In-app notification center for all users

---

## Weather API Integration (Rain Protection)
- Provider: Tomorrow.io or Open-Meteo (real-time and historical precipitation data)
- Logic: Query precipitation data by customer zip code for 72-hour window following appointment completion timestamp
- Trigger threshold: Measurable rainfall (>0.1 inches) within the window
- Automated claim processing — no customer action required
- Claim logged to customer account, redeemable exterior wash unlocked
- Monthly claim limit: 1 per subscriber per 30-day period
- Reporting: Rain event frequency by market for actuarial tracking

---

## Location & Routing
- Detailer defines service radius in miles from a home base address
- Customer search returns detailers whose service area covers the requested location
- Google Maps API for address validation, distance calculation, and travel time estimation
- Travel buffer auto-calculation between jobs based on real drive time
- Route optimization engine (V2): sequences daily jobs to minimize total drive time
- GPS tracking (V2): real-time crew location broadcast to owner dashboard

---

## Media Storage
- Supabase Storage for all media assets
- Detailer profile photos and portfolio images
- Before/after job photos linked to specific appointment records
- Damage documentation photos with automatic timestamp metadata
- Business document uploads (insurance, license) — owner access only
- Image compression on upload to manage storage costs

---

## CRM Engine (V2)
- Customer record: contact info, vehicle profiles, full booking history, notes
- Vehicle record: make, model, year, color, condition notes, service history
- Automated re-engagement: identify lapsed customers, trigger personalized outreach
- Customer lifetime value calculation per detailer
- Segmentation: new customers, regulars, lapsed, high-value

---

## Reporting & Analytics Engine (V2)
- Detailer dashboard: revenue by period, average ticket, top services, booking volume
- Crew performance: jobs completed per tech, ratings per tech, revenue generated per tech
- Customer retention metrics: repeat booking rate, average time between bookings
- Platform-level analytics (internal): GMV, active detailers, active customers, churn rate by tier
- Data stored in Supabase, queried via server-side functions for dashboard rendering

---

## Review & Reputation System
- 5-star rating per completed job
- Written review optional, required to submit rating
- Detailer public profile shows aggregate rating and review count
- Reviews tied to verified completed bookings only — no unverified reviews
- Detailer can respond to reviews (V2)
- Badge system for milestones: jobs completed, rating thresholds, tenure (V2)

---

## Tech Stack Summary
| Layer | Tool |
|-------|------|
| Frontend/Mobile | React Native (Expo) |
| Backend/Database | Supabase (PostgreSQL) |
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
