-- v2.2 fix: Backfill order_id for registered-customer bookings.
-- The previous migration (20260518000002) only grouped walk-in bookings
-- (contact_id IS NOT NULL). Registered customers use customer_id instead,
-- so their multi-vehicle appointments were never linked with an order_id.
-- This migration applies the same grouping logic using customer_id.

WITH groups AS (
  SELECT
    detailer_id,
    customer_id,
    date_trunc('minute', scheduled_at) AS sched_min
  FROM bookings
  WHERE order_id IS NULL
    AND customer_id IS NOT NULL
  GROUP BY detailer_id, customer_id, date_trunc('minute', scheduled_at)
  HAVING COUNT(*) > 1
),
group_ids AS (
  SELECT
    detailer_id,
    customer_id,
    sched_min,
    gen_random_uuid() AS grp_order_id
  FROM groups
)
UPDATE bookings b
SET order_id = g.grp_order_id
FROM group_ids g
WHERE b.detailer_id = g.detailer_id
  AND b.customer_id = g.customer_id
  AND date_trunc('minute', b.scheduled_at) = g.sched_min
  AND b.order_id IS NULL;
