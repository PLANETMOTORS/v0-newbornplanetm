-- 005_create_webhook_events_schema.sql
-- Idempotency log for Stripe webhook events.
-- Prevents duplicate processing if Stripe retries a delivery.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id    TEXT NOT NULL,
  event_type         TEXT NOT NULL,
  status             TEXT NOT NULL CHECK (status IN ('processing', 'processed', 'failed')),
  processed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce one record per Stripe event regardless of retries.
CREATE UNIQUE INDEX IF NOT EXISTS stripe_webhook_events_event_id_idx
  ON public.stripe_webhook_events (stripe_event_id);

-- Lookup index for re-delivery checks.
CREATE INDEX IF NOT EXISTS stripe_webhook_events_type_idx
  ON public.stripe_webhook_events (event_type, processed_at DESC);

-- RLS: webhook handler runs as service-role key, no user-facing access needed.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Service-role key bypasses RLS; deny all anon/authenticated reads to protect event data.
CREATE POLICY "No public access to webhook events"
  ON public.stripe_webhook_events
  FOR ALL
  TO authenticated, anon
  USING (false);
