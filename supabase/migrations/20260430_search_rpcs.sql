-- ═══════════════════════════════════════════════════════════════
-- PLANET ULTRA — Search Bar Supabase RPCs
-- Migration: search_bar_rpcs
--
-- Creates get_popular_searches() RPC for dynamic ranked suggestions
-- shown on search bar focus (before the user types anything).
-- Predictive type-ahead is handled by Typesense — this RPC only
-- serves the "Popular Searches" section.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. POPULAR SEARCHES RPC
--    Dynamic ranking based on inventory count + merchandising priority.
--    Cached server-side (Upstash Redis, 15-min TTL).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_popular_searches()
RETURNS TABLE (
  label       TEXT,
  type        TEXT,       -- 'body_style' | 'fuel' | 'price' | 'make'
  count       BIGINT,
  href        TEXT,
  score       NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH

  -- ── Body style counts ──
  body_styles AS (
    SELECT
      body_style                  AS label,
      'body_style'                AS type,
      COUNT(*)                    AS cnt,
      '/inventory?bodyStyle=' || REPLACE(body_style, ' ', '+') AS href
    FROM vehicles
    WHERE status IN ('available', 'in_transit')
      AND body_style IS NOT NULL
    GROUP BY body_style
    HAVING COUNT(*) >= 2
  ),

  -- ── Fuel type counts ──
  fuel_types AS (
    SELECT
      CASE
        WHEN fuel_type = 'Electric'       THEN 'Electric Vehicles'
        WHEN fuel_type = 'Plug-in Hybrid' THEN 'Plug-in Hybrids'
        WHEN fuel_type = 'Hybrid'         THEN 'Hybrids'
        ELSE fuel_type
      END                                 AS label,
      'fuel'                              AS type,
      COUNT(*)                            AS cnt,
      '/inventory?fuel=' || REPLACE(fuel_type, ' ', '+') AS href
    FROM vehicles
    WHERE status IN ('available', 'in_transit')
      AND fuel_type IS NOT NULL
    GROUP BY fuel_type
    HAVING COUNT(*) >= 2
  ),

  -- ── Make counts ──
  makes AS (
    SELECT
      make                        AS label,
      'make'                      AS type,
      COUNT(*)                    AS cnt,
      '/inventory/used/' || LOWER(REPLACE(make, ' ', '-')) AS href
    FROM vehicles
    WHERE status IN ('available', 'in_transit')
      AND make IS NOT NULL
    GROUP BY make
    HAVING COUNT(*) >= 2
  ),

  -- ── Price bucket counts ──
  price_thresholds(threshold, label, href) AS (
    VALUES
      (20000, 'Under $20,000', '/inventory?maxPrice=20000'),
      (30000, 'Under $30,000', '/inventory?maxPrice=30000'),
      (40000, 'Under $40,000', '/inventory?maxPrice=40000'),
      (50000, 'Under $50,000', '/inventory?maxPrice=50000')
  ),
  price_buckets AS (
    SELECT
      pt.label,
      'price'                     AS type,
      COUNT(*)                    AS cnt,
      pt.href
    FROM price_thresholds pt
    JOIN vehicles v
      ON v.price < pt.threshold
      AND v.status IN ('available', 'in_transit')
    GROUP BY pt.label, pt.href, pt.threshold
    HAVING COUNT(*) >= 3
  ),

  -- ── Union all categories ──
  all_suggestions AS (
    SELECT * FROM body_styles
    UNION ALL
    SELECT * FROM fuel_types
    UNION ALL
    SELECT * FROM makes
    UNION ALL
    SELECT * FROM price_buckets
  ),

  -- ── Scoring ──
  -- Weights: inventory_count 0.70, merchandising 0.20, freshness 0.10
  scored AS (
    SELECT
      a.label,
      a.type,
      a.cnt AS count,
      a.href,
      ROUND(
        (a.cnt::NUMERIC / GREATEST((SELECT MAX(cnt) FROM all_suggestions), 1)) * 0.70
        + CASE
            WHEN a.type = 'fuel' AND a.label IN ('Electric Vehicles', 'Plug-in Hybrids') THEN 0.20
            WHEN a.type = 'make' AND a.label IN ('Tesla', 'Toyota', 'Hyundai', 'BMW')    THEN 0.15
            ELSE 0.05
          END
        + 0.10  -- freshness placeholder (all current inventory = equal)
      , 4) AS score
    FROM all_suggestions a
  )

  SELECT label, type, count, href, score
  FROM scored
  ORDER BY score DESC, count DESC
  LIMIT 8;
$$;


-- ─────────────────────────────────────────────────────────────
-- 2. INDEXES for fast aggregation
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_vehicles_make_trgm
  ON vehicles USING gin (make gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicles_model_trgm
  ON vehicles USING gin (model gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicles_body_style_trgm
  ON vehicles USING gin (body_style gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicles_status_available
  ON vehicles (status)
  WHERE status IN ('available', 'in_transit');
