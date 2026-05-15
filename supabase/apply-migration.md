# Applying Supabase Migrations

Migrations live in `supabase/migrations/`. They **cannot** be applied automatically
from the Replit environment — they require access to the Supabase SQL editor or a
direct database connection.

## How to apply a migration

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor** → **New query**
3. Open the migration file from `supabase/migrations/`
4. Paste the contents into the editor and click **Run**

## Pending migrations (apply in order)

The following have **not** yet been applied to the live database:

| File | What it does |
|------|-------------|
| `20260515000002_v2_1_role_model_manager_removal.sql` | Adds `has_team` column to `detailer_profiles` + trigger to keep it in sync with `team_members` |
| `20260515000005_vehicle_size_pricing.sql` | Creates `vehicle_size_pricing` table with RLS — stores per-vehicle-type price overrides and upcharges for service packages |

## Already applied migrations (do not re-run)

These are already in the live database. Running them again is safe (all use
`IF NOT EXISTS` / `OR REPLACE`) but produces no change:

| File | Applied |
|------|---------|
| `20260508000000_stripe_integration.sql` | ✅ |
| `20260513000000_fix_customer_profiles_rls.sql` | ✅ |
| `20260513000001_fix_operator_tables_rls.sql` | ✅ |
| `20260513000002_add_missing_operator_columns.sql` | ✅ |
| `20260515000000_fix_users_rls_and_add_onboarding_complete.sql` | ✅ |
| `20260515000001_add_metadata_to_business_assets.sql` | ✅ |
