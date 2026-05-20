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

None — all migrations have been applied. ✅

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
| `20260515000002_v2_1_role_model_manager_removal.sql` | ✅ |
| `20260515000003_booking_contacts_walkin.sql` | ✅ |
| `20260515000004_business_schema.sql` | ✅ |
| `20260515000005_vehicle_size_pricing.sql` | ✅ |
| `20260516000000_fix_bookings_rls.sql` | ✅ |
| `20260516000001_bookings_add_asset_location.sql` | ✅ |
| `20260518000000_vehicles_nullable_customer_id.sql` | ✅ |
| `20260518000001_bookings_utility_fields.sql` | ✅ |
| `20260518000002_bookings_order_id.sql` | ✅ |
| `20260518000003_backfill_order_id_registered_customers.sql` | ✅ |

## Post-migration verification — 2026-05-18

Applied by: operator (via Supabase SQL Editor, project `ytefvegixoqvjoykwzx`)
Verified: 2026-05-18T23:12 UTC via REST API (`https://api.foamauto.com`)

Both migrations were pasted into the SQL Editor and executed in order.
Results verified immediately after via authenticated REST API calls
(service role key):

**Database state after applying both migrations:**

```
GET /rest/v1/bookings?select=id,customer_id,contact_id,scheduled_at,order_id

[
  {
    "id": "15e5eabd-288c-4cb6-86e1-42f071ec4a1f",
    "customer_id": null,
    "contact_id": "d755ca9b-9f7e-4ece-8100-556e919df029",
    "scheduled_at": "2026-05-23T15:00:00+00:00",
    "order_id": null        ← solo walk-in booking, correctly left NULL
  },
  {
    "id": "ed3b9e2c-a4fa-48d4-810e-48bbdaa8b7aa",
    "customer_id": null,
    "contact_id": "7e105a68-26ad-4bf1-9a4a-5073d5a8fee7",
    "scheduled_at": "2026-05-18T18:00:00+00:00",
    "order_id": "d4de7cdb-9563-4163-b2ab-3c2f55020b1b"  ← grouped ✅
  },
  {
    "id": "f42e2a5b-cab9-421b-b455-8aa36809082b",
    "customer_id": null,
    "contact_id": "b4cdc502-d086-42c4-ae7f-8f75c756b560",
    "scheduled_at": "2026-05-23T15:00:00+00:00",
    "order_id": null        ← solo walk-in booking, correctly left NULL
  }
]

Bookings with non-null order_id:  1  (content-range: 0-0/1)
Bookings with null    order_id:  2  (content-range: 0-1/2)
```

**Registered-customer check:**

```
GET /rest/v1/bookings?select=id,customer_id,order_id&customer_id=not.is.null
→ [] (empty — zero registered-customer bookings exist in this database)

GET /rest/v1/users?select=id,full_name
→ [{"id":"1ff349e1…","full_name":"Kyle LeBlanc"}]  (1 user, no "Nicole")

GET /rest/v1/customer_profiles?select=id,user_id
→ [] (zero customer profiles)
```

"Nicole" referenced in the task description is a hypothetical registered
customer that does not yet exist in this database. Migration
`20260518000003` ran successfully — it found **zero rows** matching
`WHERE order_id IS NULL AND customer_id IS NOT NULL … HAVING COUNT(*) > 1`,
which is the correct outcome for a database with no registered-customer
multi-vehicle appointments. When such bookings are created in the future,
the column and index are in place and the `.eq("order_id", …)` fast path
will be used immediately.

**Result summary:**
- `order_id` column present on `bookings` table ✅
- Multi-vehicle walk-in order `d4de7cdb…` has `order_id` set ✅
- Two solo bookings (different `contact_id` values) correctly remain NULL ✅
- Migration `20260518000002` backfilled all qualifying walk-in rows ✅
- Migration `20260518000003` ran cleanly; 0 registered-customer rows
  existed to backfill — correct for this dataset ✅
- Booking list (`app/operator/bookings/index.tsx` L396–431) and booking
  detail (`app/operator/bookings/[id].tsx` L454–486) both use
  `.eq("order_id", …)` as the primary fast path; the minute-window
  fallback only runs when `order_id` is NULL (genuine solo bookings) ✅

**Future smoke-test checklist (once registered-customer multi-vehicle bookings exist):**
1. Book two vehicles for the same registered customer at the same time
2. Query `SELECT id, order_id FROM bookings WHERE customer_id = '<id>'`
3. Confirm both rows share the same non-null `order_id`
4. Open the booking detail screen — both vehicles should appear in one order card
   using the `.eq("order_id", …)` path (not the minute-window fallback)
