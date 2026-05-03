# FOAM — Mobile Auto Detailing Marketplace

## Overview
FOAM is a React Native (Expo) mobile app and marketplace for the auto detailing industry. It has three distinct user experiences: customers (book detailers), detailers (run their business), and crew (manage assigned jobs).

## Tech Stack
- **Frontend/Mobile**: React Native with Expo (~51.0.0), Expo Router for file-based navigation
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe + Stripe Connect
- **Push Notifications**: Expo Notifications
- **Typography**: Playfair Display (display/brand) + Inter (body)

## Project Structure
```
/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout with providers
│   ├── auth/               # Auth flow: welcome, login, signup, role-select
│   ├── customer/           # Customer experience: discover
│   ├── detailer/           # Detailer experience: today
│   └── crew/               # Crew experience: jobs
├── constants/
│   └── design.ts           # FOAM design tokens (colors, typography, spacing, radius)
├── hooks/
│   └── useAuth.tsx         # Auth context provider and hook
├── lib/
│   └── supabase.ts         # Supabase client (lazy-initialized)
├── types/
│   └── database.ts         # TypeScript types mirroring Supabase schema
├── assets/                 # App icons and splash screens
├── MD/                     # Project documentation (product, design, architecture, brand, strategy, AI)
└── env.example             # Reference for required environment variables
```

## Environment Variables
See `env.example` for all required variables. Key ones:
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe for client)

## Development
- **Workflow**: "Start application" runs `npx expo start --web --port 5000`
- **Port**: 5000 (web preview)
- **QR Code**: Scan from Expo's console output to test on device via Expo Go

## Design System
Defined in `constants/design.ts`. Key brand colors:
- `foamBlue`: #339DC7 (primary accent)
- `foamDarkTeal`: #0F2F3C (primary background / brand dark)
- Dark mode surfaces: #1C5268

## User Roles
- **customer** → `/customer/discover`
- **detailer** → `/detailer/today`
- **crew** → `/crew/jobs`

## Status
- Auth flow (welcome, login, signup, role selection): scaffold complete
- Core screens (discover, today, jobs): placeholder — awaiting MVP development
- Backend (Supabase schema): designed in `/MD/architecture/DATA_MODEL.md`
- Payments (Stripe): designed, not yet implemented
