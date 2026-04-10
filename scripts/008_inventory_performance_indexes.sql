-- Planet Motors: Inventory Performance Indexes
-- Migration: 008_inventory_performance_indexes.sql
-- Run with: psql $DATABASE_URL -f scripts/008_inventory_performance_indexes.sql
--
-- All indexes use CONCURRENTLY to avoid table locks on production.
-- Composite indexes lead with `status` since every query filters on it.

-- 1. Default sort: newest available first
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_created_at
  ON vehicles (status, created_at DESC);

-- 2. Make + model browsing (e.g., /cars/toyota/camry)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_make_model
  ON vehicles (status, make, model);

-- 3. Price range filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_price
  ON vehicles (status, price);

-- 4. Year range filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_year
  ON vehicles (status, year);

-- 5. Mileage filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_mileage
  ON vehicles (status, mileage);

-- 6. Body style + fuel type faceting (most common combo in sidebar)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_fuel_type_body_style
  ON vehicles (status, fuel_type, body_style);

-- 7. Transmission + drivetrain faceting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_transmission_drivetrain
  ON vehicles (status, transmission, drivetrain);

-- 8. Exterior colour filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_exterior_color
  ON vehicles (status, exterior_color);

-- 9. Full-text search on make, model, trim (used by ?q= param)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_fts
  ON vehicles USING GIN (
    to_tsvector('english', coalesce(make, '') || ' ' || coalesce(model, '') || ' ' || coalesce(trim, ''))
  );
