-- 009_rename_audit_client_ip_to_hash.sql
-- One-time migration for DBs created before client_ip was renamed to client_ip_hash.
-- Existing rows may still hold legacy raw IPs until purged under your retention policy.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'negotiation_audits' AND column_name = 'client_ip'
  ) THEN
    ALTER TABLE public.negotiation_audits RENAME COLUMN client_ip TO client_ip_hash;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'finance_calc_audits' AND column_name = 'client_ip'
  ) THEN
    ALTER TABLE public.finance_calc_audits RENAME COLUMN client_ip TO client_ip_hash;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offer_access_audits' AND column_name = 'client_ip'
  ) THEN
    ALTER TABLE public.offer_access_audits RENAME COLUMN client_ip TO client_ip_hash;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'offer_selection_audits' AND column_name = 'client_ip'
  ) THEN
    ALTER TABLE public.offer_selection_audits RENAME COLUMN client_ip TO client_ip_hash;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'id_verification_audits' AND column_name = 'client_ip'
  ) THEN
    ALTER TABLE public.id_verification_audits RENAME COLUMN client_ip TO client_ip_hash;
  END IF;
END $$;
