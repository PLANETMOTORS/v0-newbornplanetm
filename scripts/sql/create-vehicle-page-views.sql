-- Vehicle Page Views — lightweight tracking for social proof signals
-- Run this in the Supabase SQL editor to enable view tracking.
-- The social proof API degrades gracefully if this table doesn't exist.

CREATE TABLE IF NOT EXISTS vehicle_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookups: "views in last 24h for vehicle X"
CREATE INDEX IF NOT EXISTS idx_vehicle_page_views_vehicle_time
  ON vehicle_page_views (vehicle_id, viewed_at DESC);

-- Deduplicate: same visitor viewing same vehicle can only be counted once per calendar day
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_page_views_dedup
  ON vehicle_page_views (vehicle_id, visitor_hash, (viewed_at::date));

-- Auto-cleanup: views older than 30 days (optional — run via pg_cron or manual)
-- DELETE FROM vehicle_page_views WHERE viewed_at < now() - INTERVAL '30 days';

-- RLS: allow inserts from service role only (no anonymous access)
ALTER TABLE vehicle_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON vehicle_page_views
  FOR ALL TO service_role USING (true) WITH CHECK (true);
