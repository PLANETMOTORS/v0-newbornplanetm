-- =====================================================
-- ADD LICENSE STORAGE PATH TO RESERVATIONS
-- Planet Motors - Secure driver's license document storage
-- =====================================================
-- Stores the raw Supabase Storage bucket path (e.g. "<vehicleId>/<ts>_license.jpg")
-- for the driver's license uploaded during checkout. Do NOT store signed URLs
-- here — they expire. The admin portal generates short-lived signed URLs on demand.

-- Add column to reservations table
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS license_storage_path TEXT;

COMMENT ON COLUMN public.reservations.license_storage_path IS
  'Raw path inside the secure_documents bucket. Admin portal generates signed URLs on demand.';

-- Also add to orders table for cases where full purchase (not just deposit) stores the license
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS license_storage_path TEXT;

COMMENT ON COLUMN public.orders.license_storage_path IS
  'Raw path inside the secure_documents bucket. Admin portal generates signed URLs on demand.';

-- =====================================================
-- PRIVATE STORAGE BUCKET
-- Must be created via Supabase Dashboard or CLI — SQL reference only.
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('secure_documents', 'secure_documents', false)
--   ON CONFLICT (id) DO NOTHING;
--
-- No public access. Uploads use the service role key server-side.
-- RLS policies are not needed because the service role bypasses RLS.
-- Cleanup: orphaned files from abandoned checkouts (>24h) should be
-- purged by a scheduled cron job or Edge Function.
