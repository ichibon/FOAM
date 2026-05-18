-- v2.2: Add order_id to bookings for multi-vehicle order grouping
-- When an operator books N cars in a single form submission, all resulting rows
-- share the same order_id. The UI collapses them into one card in the list and
-- shows all vehicles together on the detail screen.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS order_id uuid;

-- Efficient lookup: list screen filters by detailer_id, detail screen queries siblings
CREATE INDEX IF NOT EXISTS idx_bookings_detailer_order
  ON bookings (detailer_id, order_id)
  WHERE order_id IS NOT NULL;

-- Backfill existing multi-vehicle appointments:
-- Group rows that share (detailer_id + contact_id + minute-truncated scheduled_at)
-- and assign them all the same generated order_id.
-- Solo bookings (groups of 1) are intentionally left with order_id = NULL.
WITH groups AS (
  SELECT
    detailer_id,
    contact_id,
    date_trunc('minute', scheduled_at) AS sched_min
  FROM bookings
  WHERE order_id IS NULL
    AND contact_id IS NOT NULL
  GROUP BY detailer_id, contact_id, date_trunc('minute', scheduled_at)
  HAVING COUNT(*) > 1
),
group_ids AS (
  SELECT
    detailer_id,
    contact_id,
    sched_min,
    gen_random_uuid() AS grp_order_id
  FROM groups
)
UPDATE bookings b
SET order_id = g.grp_order_id
FROM group_ids g
WHERE b.detailer_id = g.detailer_id
  AND b.contact_id = g.contact_id
  AND date_trunc('minute', b.scheduled_at) = g.sched_min
  AND b.order_id IS NULL;
