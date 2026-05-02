-- Migration: Add sold_at timestamp for 7-day sold visibility window
-- When a vehicle is marked as sold, sold_at records the timestamp.
-- Inventory queries show sold vehicles for 7 days after sale, then auto-hide.

-- 1. Add the column (nullable — only set when status = 'sold')
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- 2. Trigger: auto-set sold_at when status transitions to 'sold'
CREATE OR REPLACE FUNCTION set_sold_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status <> 'sold') THEN
    NEW.sold_at = NOW();
  ELSIF NEW.status <> 'sold' THEN
    NEW.sold_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_sold_at ON vehicles;
CREATE TRIGGER trg_set_sold_at
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION set_sold_at_timestamp();

-- 3. Partial index for efficient "recently sold" queries
CREATE INDEX IF NOT EXISTS idx_vehicles_sold_at
  ON vehicles (sold_at)
  WHERE status = 'sold' AND sold_at IS NOT NULL;

-- 4. Backfill: set sold_at for any currently-sold vehicles (use updated_at as best estimate)
UPDATE vehicles SET sold_at = updated_at WHERE status = 'sold' AND sold_at IS NULL;
