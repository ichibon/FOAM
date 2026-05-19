-- Drop old constraints, remap existing data, add new constraints

ALTER TABLE vehicle_size_pricing DROP CONSTRAINT IF EXISTS vehicle_size_pricing_vehicle_type_check;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_vehicle_type_check;

-- Dedup before remap: if a package has both 'truck' and 'van' (both → xxl), keep one
DELETE FROM vehicle_size_pricing
WHERE vehicle_type IN ('truck', 'van')
  AND ctid NOT IN (
    SELECT MIN(ctid)
    FROM vehicle_size_pricing
    WHERE vehicle_type IN ('truck', 'van')
    GROUP BY package_id
  );

-- Remap vehicle_size_pricing to xl / xxl tiers
UPDATE vehicle_size_pricing SET vehicle_type = 'xl'  WHERE vehicle_type = 'suv';
UPDATE vehicle_size_pricing SET vehicle_type = 'xxl' WHERE vehicle_type IN ('truck', 'van');
DELETE FROM vehicle_size_pricing WHERE vehicle_type IN ('sedan', 'coupe', 'other');

ALTER TABLE vehicle_size_pricing
  ADD CONSTRAINT vehicle_size_pricing_vehicle_type_check
  CHECK (vehicle_type IN ('xl', 'xxl'));

-- Remap vehicles to standard / xl / xxl
UPDATE vehicles SET vehicle_type = 'xl'       WHERE vehicle_type = 'suv';
UPDATE vehicles SET vehicle_type = 'xxl'      WHERE vehicle_type IN ('truck', 'van');
UPDATE vehicles SET vehicle_type = 'standard' WHERE vehicle_type NOT IN ('xl', 'xxl') OR vehicle_type IS NULL;

ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_vehicle_type_check
  CHECK (vehicle_type IN ('standard', 'xl', 'xxl'));
