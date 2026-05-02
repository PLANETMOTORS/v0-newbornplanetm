-- ═══════════════════════════════════════════════════════════════════════════
-- PLANET ULTRA — Search Bar Supabase RPCs
-- Migration: search_bar_rpcs
--
-- Creates get_popular_searches() RPC for dynamic ranked suggestions
-- shown on search bar focus (before the user types anything).
-- Predictive type-ahead is handled by Typesense — this RPC only
-- serves the "Popular Searches" section.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Enable pg_trgm for fast prefix matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN indexes for prefix search performance
CREATE INDEX IF NOT EXISTS idx_vehicles_make_trgm
  ON vehicles USING gin (make gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicles_model_trgm
  ON vehicles USING gin (model gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicles_body_style_trgm
  ON vehicles USING gin (body_style gin_trgm_ops);

-- 3. Popular Searches RPC
--    Scoring: (inventory_count / max_count) × 0.70
--           + merchandising_priority        × 0.20
--           + freshness_boost               × 0.10
--    Returns up to 8 results ordered by score DESC.

CREATE OR REPLACE FUNCTION get_popular_searches()
RETURNS TABLE (
  label       TEXT,
  type        TEXT,
  count       BIGINT,
  href        TEXT,
  score       NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH

  active_vehicles AS (
    SELECT * FROM vehicles
    WHERE status IN ('available', 'in_transit')
  ),

  body_styles AS (
    SELECT
      body_style                  AS label,
      'body_style'                AS type,
      COUNT(*)                    AS cnt,
      '/inventory?bodyStyle=' || REPLACE(body_style, ' ', '+') AS href
    FROM active_vehicles
    WHERE body_style IS NOT NULL
    GROUP BY body_style
    HAVING COUNT(*) >= 2
  ),

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
    FROM active_vehicles
    WHERE fuel_type IS NOT NULL
    GROUP BY fuel_type
    HAVING COUNT(*) >= 2
  ),

  makes AS (
    SELECT
      make                        AS label,
      'make'                      AS type,
      COUNT(*)                    AS cnt,
      '/inventory/used/' || LOWER(REPLACE(make, ' ', '-')) AS href
    FROM active_vehicles
    WHERE make IS NOT NULL
    GROUP BY make
    HAVING COUNT(*) >= 2
  ),

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
    JOIN active_vehicles v
      ON v.price < pt.threshold
    GROUP BY pt.label, pt.href, pt.threshold
    HAVING COUNT(*) >= 3
  ),

  all_suggestions AS (
    SELECT * FROM body_styles
    UNION ALL
    SELECT * FROM fuel_types
    UNION ALL
    SELECT * FROM makes
    UNION ALL
    SELECT * FROM price_buckets
  ),

  max_count AS (
    SELECT COALESCE(MAX(cnt), 1) AS val FROM all_suggestions
  ),

  scored AS (
    SELECT
      s.label,
      s.type,
      s.cnt   AS count,
      s.href,
      ROUND(
        (s.cnt::NUMERIC / m.val) * 0.70
        + CASE s.type
            WHEN 'body_style' THEN 0.15
            WHEN 'fuel'       THEN 0.18
            WHEN 'make'       THEN 0.12
            WHEN 'price'      THEN 0.10
            ELSE 0.05
          END * 0.20
        + 0.10,
        4
      ) AS score
    FROM all_suggestions s
    CROSS JOIN max_count m
  )

  SELECT label, type, count, href, score
  FROM scored
  ORDER BY score DESC
  LIMIT 8;
$$;
