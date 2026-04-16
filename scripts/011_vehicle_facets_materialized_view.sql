-- Planet Motors: Materialized Facet Views for 10K Vehicle Scale
-- Migration: 011_vehicle_facets_materialized_view.sql
-- Run with: psql $DATABASE_URL -f scripts/011_vehicle_facets_materialized_view.sql
--
-- This materialized view pre-computes make/model/year/body_style counts for the
-- inventory facet sidebar. At 10K+ vehicles the live aggregation query becomes
-- expensive (~200ms+). The materialized view reduces facet lookups to <5ms.
--
-- Refresh strategy: call REFRESH MATERIALIZED VIEW CONCURRENTLY vehicle_facets_mv
-- after bulk imports or on a cron schedule (e.g., every 5 minutes).
-- CONCURRENTLY allows reads during refresh but requires the UNIQUE INDEX below.
--
-- DO NOT wrap in a transaction — CONCURRENTLY requires autocommit mode.

-- Drop existing view if re-running migration
DROP MATERIALIZED VIEW IF EXISTS vehicle_facets_mv;

-- Create the materialized view with pre-aggregated facet counts
-- Note: COALESCE is used for nullable columns to ensure the unique index works
-- correctly with REFRESH MATERIALIZED VIEW CONCURRENTLY. In PostgreSQL < 15,
-- NULL values are considered distinct in unique indexes, which would break
-- concurrent refresh. Using COALESCE ensures consistent NULL handling.
CREATE MATERIALIZED VIEW vehicle_facets_mv AS
SELECT
  make,
  model,
  year,
  COALESCE(body_style, '') AS body_style,
  COALESCE(fuel_type, '') AS fuel_type,
  COALESCE(transmission, '') AS transmission,
  COALESCE(drivetrain, '') AS drivetrain,
  COUNT(*)::int AS vehicle_count,
  MIN(price)::bigint AS min_price_cents,
  MAX(price)::bigint AS max_price_cents
FROM vehicles
WHERE status = 'available'
GROUP BY make, model, year, COALESCE(body_style, ''), COALESCE(fuel_type, ''), COALESCE(transmission, ''), COALESCE(drivetrain, '')
ORDER BY make, model, year;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
-- All columns are now guaranteed non-NULL due to COALESCE in the view definition
CREATE UNIQUE INDEX idx_vehicle_facets_mv_unique
  ON vehicle_facets_mv (make, model, year, body_style, fuel_type, transmission, drivetrain);

-- Fast lookups by individual facet dimensions
CREATE INDEX idx_vehicle_facets_mv_make ON vehicle_facets_mv (make);
CREATE INDEX idx_vehicle_facets_mv_body_style ON vehicle_facets_mv (body_style);
CREATE INDEX idx_vehicle_facets_mv_fuel_type ON vehicle_facets_mv (fuel_type);
CREATE INDEX idx_vehicle_facets_mv_year ON vehicle_facets_mv (year);

-- ─── Example queries ─────────────────────────────────────────────────────────
--
-- Get all makes with counts:
--   SELECT make, SUM(vehicle_count) AS total
--   FROM vehicle_facets_mv
--   GROUP BY make ORDER BY total DESC;
--
-- Get body style counts for a specific make:
--   SELECT body_style, SUM(vehicle_count) AS total
--   FROM vehicle_facets_mv
--   WHERE make = 'Tesla'
--   GROUP BY body_style ORDER BY total DESC;
--
-- Price range for available inventory:
--   SELECT MIN(min_price_cents) / 100 AS min_price,
--          MAX(max_price_cents) / 100 AS max_price
--   FROM vehicle_facets_mv;
--
-- ─── Refresh command (run via cron or after bulk import) ─────────────────────
--   REFRESH MATERIALIZED VIEW CONCURRENTLY vehicle_facets_mv;
