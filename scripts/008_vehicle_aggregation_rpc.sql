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
    'priceRanges', json_build_array(
      json_build_object('key', 'Under $30k',   'count', (SELECT COUNT(*)::int FROM vehicles WHERE status = 'available' AND price < 3000000)),
      json_build_object('key', '$30k-$50k',    'count', (SELECT COUNT(*)::int FROM vehicles WHERE status = 'available' AND price >= 3000000 AND price < 5000000)),
      json_build_object('key', '$50k-$75k',    'count', (SELECT COUNT(*)::int FROM vehicles WHERE status = 'available' AND price >= 5000000 AND price < 7500000)),
      json_build_object('key', '$75k-$100k',   'count', (SELECT COUNT(*)::int FROM vehicles WHERE status = 'available' AND price >= 7500000 AND price < 10000000)),
      json_build_object('key', 'Over $100k',   'count', (SELECT COUNT(*)::int FROM vehicles WHERE status = 'available' AND price >= 10000000))
    )
  );
$$;

-- Grant execute to the anon and authenticated roles used by Supabase
GRANT EXECUTE ON FUNCTION public.get_vehicle_aggregations() TO anon, authenticated;
