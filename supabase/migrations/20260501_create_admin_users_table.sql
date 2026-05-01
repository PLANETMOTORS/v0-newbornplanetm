-- 20260501_create_admin_users_table.sql
--
-- DB-managed admin user roster.
--
-- Background
-- ---------
-- The original admin gate read a comma-separated `ADMIN_EMAILS` env var
-- (fallback: hard-coded list of two addresses). Granting / revoking
-- access required a Vercel re-deploy and there was no audit trail of
-- who did what.
--
-- This migration introduces `admin_users` so the admin roster can be
-- managed from the new `/admin/users` page at runtime, with role
-- granularity (admin / manager / viewer) and a soft-delete via
-- `is_active = false`.
--
-- Idempotent: every CREATE uses IF NOT EXISTS, every INSERT uses
-- ON CONFLICT DO NOTHING.

-- citext extension is used by other tables for case-insensitive emails.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email       CITEXT       NOT NULL UNIQUE,
  role        VARCHAR(20)  NOT NULL DEFAULT 'admin'
                CHECK (role IN ('admin', 'manager', 'viewer')),
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  invited_by  UUID         REFERENCES public.admin_users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to admin_users"
  ON public.admin_users;
CREATE POLICY "Service role full access to admin_users"
  ON public.admin_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_users_email
  ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active
  ON public.admin_users(is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.update_admin_users_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_admin_users_updated_at();

-- Seed the existing hard-coded admins so nobody loses access on rollout.
INSERT INTO public.admin_users (email, role, is_active, notes)
VALUES
  ('toni@planetmotors.ca', 'admin', true, 'Auto-seeded from launch ADMIN_EMAILS list'),
  ('admin@planetmotors.ca', 'admin', true, 'Auto-seeded from launch ADMIN_EMAILS list')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE public.admin_users IS
  'Runtime-managed admin roster. Replaces the comma-separated ADMIN_EMAILS env var.';
COMMENT ON COLUMN public.admin_users.role IS
  'admin = full access; manager = inventory + leads only; viewer = read-only';
