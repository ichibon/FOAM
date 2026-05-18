-- Allow vehicles to be created without an auth user (walk-in / ghost accounts).
-- customer_id will be backfilled when the walk-in customer claims their account.
ALTER TABLE vehicles ALTER COLUMN customer_id DROP NOT NULL;
