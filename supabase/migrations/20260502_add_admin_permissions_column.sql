-- Add custom permissions JSONB column to admin_users table.
-- This allows granular per-feature access control beyond the preset roles.
-- Example: { "leads": "full", "vehicles": "read", "settings": "none" }
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ldervbcvkoawwknsemuz/sql/new

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT NULL;

COMMENT ON COLUMN public.admin_users.permissions IS
  'Optional per-feature access overrides. Keys are feature slugs (dashboard, vehicles, etc.), values are "none"|"read"|"full". NULL means fall back to the role preset.';
