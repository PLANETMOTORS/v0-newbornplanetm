-- Migration: Add UTM tracking fields to orders and reservations for attribution
-- Captures marketing attribution data throughout the purchase funnel

-- Add UTM fields to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255),
  ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255),
  ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255),
  ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255),
  ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255),
  ADD COLUMN IF NOT EXISTS utm_captured_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.utm_source IS 'Marketing attribution: referral source (e.g., google, facebook, email)';
COMMENT ON COLUMN public.orders.utm_medium IS 'Marketing attribution: medium (e.g., cpc, social, email)';
COMMENT ON COLUMN public.orders.utm_campaign IS 'Marketing attribution: campaign name';
COMMENT ON COLUMN public.orders.utm_content IS 'Marketing attribution: content variant (e.g., ad-1, banner-a)';
COMMENT ON COLUMN public.orders.utm_term IS 'Marketing attribution: search terms';
COMMENT ON COLUMN public.orders.utm_captured_at IS 'Timestamp when UTM params were first captured in session';

-- Add UTM fields to reservations table (check if table exists first)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
    ALTER TABLE public.reservations
      ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255),
      ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255),
      ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255),
      ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255),
      ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255),
      ADD COLUMN IF NOT EXISTS utm_captured_at TIMESTAMPTZ;

    COMMENT ON COLUMN public.reservations.utm_source IS 'Marketing attribution: referral source';
    COMMENT ON COLUMN public.reservations.utm_medium IS 'Marketing attribution: medium';
    COMMENT ON COLUMN public.reservations.utm_campaign IS 'Marketing attribution: campaign name';
    COMMENT ON COLUMN public.reservations.utm_content IS 'Marketing attribution: content variant';
    COMMENT ON COLUMN public.reservations.utm_term IS 'Marketing attribution: search terms';
    COMMENT ON COLUMN public.reservations.utm_captured_at IS 'Timestamp when UTM params were first captured';
  END IF;
END $$;
