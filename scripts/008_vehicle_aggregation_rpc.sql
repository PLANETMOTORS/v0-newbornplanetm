-- 008_vehicle_aggregation_rpc.sql
-- Efficient vehicle inventory aggregation function
-- Returns make/body_style counts and price/year ranges in a single DB round-trip,
-- avoiding large row transfers to compute aggregations in application code.

CREATE OR REPLACE FUNCTION public.get_vehicle_aggregations()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'makes', (
      SELECT json_agg(row_to_json(t) ORDER BY t.key)
      FROM (
        SELECT make AS key, COUNT(*)::int AS count
        FROM vehicles
        WHERE status = 'available' AND make IS NOT NULL
        GROUP BY make
      ) t
    ),
    'bodyStyles', (
      SELECT json_agg(row_to_json(t) ORDER BY t.key)
      FROM (
        SELECT body_style AS key, COUNT(*)::int AS count
        FROM vehicles
        WHERE status = 'available' AND body_style IS NOT NULL
        GROUP BY body_style
      ) t
    ),
    'priceRanges', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          range_label AS key,
          COUNT(*)::int AS count
        FROM vehicles
        CROSS JOIN LATERAL (
          SELECT CASE
            WHEN price < 3000000                       THEN 'Under $30k'
            WHEN price >= 3000000 AND price < 5000000  THEN '$30k-$50k'
            WHEN price >= 5000000 AND price < 7500000  THEN '$50k-$75k'
            WHEN price >= 7500000 AND price < 10000000 THEN '$75k-$100k'
            ELSE 'Over $100k'
          END AS range_label
        ) r
        WHERE status = 'available'
        GROUP BY range_label
        ORDER BY MIN(price)
      ) t
    )
  );
$$;

-- Grant execute to the anon and authenticated roles used by Supabase
GRANT EXECUTE ON FUNCTION public.get_vehicle_aggregations() TO anon, authenticated;
