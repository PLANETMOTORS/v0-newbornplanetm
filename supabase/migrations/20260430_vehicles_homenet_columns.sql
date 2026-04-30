-- ────────────────────────────────────────────────────────────────────────
-- Migration: 20260430_vehicles_homenet_columns
-- Purpose:   Add three columns the HomeNet cron writes to but that the
--            production Supabase schema is missing.
-- Why now:   PR #571 + #572 routed the cron to Supabase. First sync
--            attempt errored on every row with:
--              "column \"description\" of relation \"vehicles\" does not exist"
--            The Neon DB had these columns added at some point but the
--            equivalent Supabase migration was never applied.
-- Safety:    All three are NULLABLE — existing 22 rows stay valid.
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS description     text,
  ADD COLUMN IF NOT EXISTS source_vdp_url  text,
  ADD COLUMN IF NOT EXISTS title_status    text;

COMMENT ON COLUMN public.vehicles.description    IS
  'Free-form vehicle description from the HomeNet feed (Comments / Comment1 column). May be empty.';
COMMENT ON COLUMN public.vehicles.source_vdp_url IS
  'Original HomeNet VDP URL for this vehicle. Used as canonical when present.';
COMMENT ON COLUMN public.vehicles.title_status   IS
  'Title status from feed: Clean, Salvage, Rebuilt, etc. Drives OMVIC disclosure UI.';
