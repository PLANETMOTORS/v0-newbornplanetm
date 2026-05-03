-- Planet Motors: 10K-Scale Performance Indexes
-- Migration: 025_10k_performance_indexes.sql
-- Run with: psql $DATABASE_URL -f scripts/025_10k_performance_indexes.sql
--
-- At 10k+ vehicles, keyset (cursor) pagination and multi-column
-- range filters must be backed by composite indexes to stay <200ms.
-- All indexes use CONCURRENTLY to avoid table locks on production.
--
-- DO NOT wrap in a transaction — CONCURRENTLY requires autocommit.

-- ═══════════════════════════════════════════════════════════════════
-- 1. KEYSET PAGINATION — (created_at DESC, id DESC)
-- ═══════════════════════════════════════════════════════════════════
-- The /api/v1/vehicles endpoint uses cursor-based pagination:
--   WHERE (created_at, id) < (cursor_created_at, cursor_id)
--   ORDER BY created_at DESC, id DESC
-- Without this composite index, Postgres falls back to a SeqScan
-- + Sort, which degrades to ~800ms at 10k rows.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_cursor_pagination
  ON vehicles (created_at DESC, id DESC)
  WHERE status IN ('available', 'reserved');

-- ═══════════════════════════════════════════════════════════════════
-- 2. COVERING INDEX for VDP lookup by slug
-- ═══════════════════════════════════════════════════════════════════
-- VDP pages resolve via stock_number → slug. A covering index
-- avoids heap lookups for the most frequent single-row fetch.
-- (The UNIQUE constraint already creates an index on stock_number,
-- but this partial index is smaller and includes only live rows.)

-- ═══════════════════════════════════════════════════════════════════
-- 3. COMPOSITE PRICE + YEAR for range filters
-- ═══════════════════════════════════════════════════════════════════
-- The most common inventory filter combo is price range + year range.
-- A composite index lets Postgres satisfy both predicates in one scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_price_year
  ON vehicles (status, price, year)
  WHERE status IN ('available', 'reserved');

-- ═══════════════════════════════════════════════════════════════════
-- 4. MODEL-LEVEL B-TREE for direct model queries
-- ═══════════════════════════════════════════════════════════════════
-- Category pages query WHERE model ILIKE '%camry%'. The existing
-- idx_vehicles_status_make_model requires make to be specified first.
-- This index supports model-only lookups.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_model
  ON vehicles (status, model);

-- ═══════════════════════════════════════════════════════════════════
-- 5. PARTIAL INDEX for "recently sold" queries (last 7 days)
-- ═══════════════════════════════════════════════════════════════════
-- The public status filter includes recently-sold vehicles (sold_at > 7d).
-- This partial index covers that pattern efficiently.
-- (Note: idx_vehicles_sold_at from 024 covers sold_at lookups but
-- doesn't include updated_at for the ORDER BY.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_sold_recent
  ON vehicles (sold_at DESC)
  WHERE status = 'sold' AND sold_at > NOW() - INTERVAL '7 days';

-- ═══════════════════════════════════════════════════════════════════
-- 6. BODY STYLE B-TREE for category pages
-- ═══════════════════════════════════════════════════════════════════
-- /cars/<slug> pages filter WHERE body_style = ?. The existing
-- composite index leads with (status, fuel_type, body_style) which
-- is suboptimal when only body_style is filtered.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_body_style
  ON vehicles (status, body_style)
  WHERE status IN ('available', 'reserved');

-- ═══════════════════════════════════════════════════════════════════
-- 7. GIN TRIGRAM INDEX for ILIKE search (optional, requires pg_trgm)
-- ═══════════════════════════════════════════════════════════════════
-- Enables fast ILIKE '%search%' queries without full-text search.
-- Only create if pg_trgm extension is available.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm') THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    -- Composite trigram index on make+model for ILIKE patterns
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_make_model_trgm
      ON vehicles USING GIN ((make || '' '' || model) gin_trgm_ops)';
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 8. ANALYZE to update planner statistics
-- ═══════════════════════════════════════════════════════════════════
ANALYZE vehicles;
