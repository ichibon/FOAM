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
- `EXPO_PUBLIC_SUPABASE_URL` — `https://api.foamauto.com` (custom domain; never use the raw `.supabase.co` URL in production)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe for client)

## OAuth Callback URLs
These must be registered in the Supabase dashboard, Google Cloud Console, and Apple Developer portal:
- Browser-side (OAuth provider → Supabase): `https://api.foamauto.com/auth/v1/callback`
- App deep-link (Supabase → app): `foam://auth/callback`

## Development
- **Workflow**: "Start application" runs `npx expo start --web --port 5000` (web preview in Replit canvas)
- **Port**: 5000 (web preview)

## Git / GitHub Workflow
- The agent makes code changes locally; Replit auto-checkpoints commit them to the local `main` branch automatically.
- **The agent does NOT push to GitHub** — pushing from the agent sandbox is blocked and was causing history divergence.
- To push to GitHub, run `git push origin main` from the Shell tab. The origin URL already includes the PAT so no auth prompt is needed.
- If the local and remote histories ever diverge again, run: `git fetch origin && git reset --hard origin/main` to align local with GitHub.
- Stale `.git/*.lock` files (left by Replit's checkpoint system) can be cleared with `rm -f .git/*.lock .git/refs/remotes/origin/*.lock .git/objects/maintenance.lock`

## Native Device Testing
Testing native features (Google OAuth, Apple Sign In, SecureStore, deep links) requires a real device build — Expo Go and tunnel mode are not sufficient.

### One-time setup: EAS development build
1. Log in to Expo on your machine: `npx eas login`
2. From the project root, run: `eas build --profile development --platform ios`
3. EAS builds the `.ipa` on Expo's cloud servers (~10–15 min) and sends you a link
4. Open the link on your iPhone to install the dev build via TestFlight or direct download

### Each dev session (after the build is installed)
1. From the Replit shell, run: `npx expo start --tunnel`
2. Scan the QR code shown in the console with the **FOAM dev build** app (not Expo Go)
3. The app loads and hot-reloads from the Replit server over the tunnel

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
