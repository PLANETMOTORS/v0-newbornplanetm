-- Server Conversion Outbox — queues first-party conversion events for dispatch
-- to Meta CAPI, TikTok Events API, Google Ads Enhanced Conversions, and sGTM.
--
-- A scheduled worker drains rows with status='pending', sends them to each
-- platform API, then marks them as 'dispatched' or 'failed'.

CREATE TABLE IF NOT EXISTS public.server_conversion_outbox (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name      VARCHAR(100)  NOT NULL,
  event_id        VARCHAR(200)  NOT NULL,
  lead_id         UUID,
  application_id  UUID,
  vehicle_vin     VARCHAR(20),
  value           NUMERIC(12,2),
  currency        VARCHAR(3)    NOT NULL DEFAULT 'CAD',
  page_type       VARCHAR(30),

  -- Hashed PII for server-side matching (SHA-256, never plaintext)
  user_data_hashes JSONB        NOT NULL DEFAULT '{}',

  -- Attribution snapshot at time of conversion
  attribution     JSONB         NOT NULL DEFAULT '{}',

  -- Consent state snapshot
  consent_snapshot JSONB        NOT NULL DEFAULT '{}',

  -- Dispatch state
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'dispatched', 'failed', 'skipped')),
  dispatched_at   TIMESTAMPTZ,
  dispatch_error  TEXT,
  retry_count     INT           NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index for the dispatch worker to efficiently drain pending events
CREATE INDEX IF NOT EXISTS idx_sco_status_created
  ON public.server_conversion_outbox (status, created_at)
  WHERE status = 'pending';

-- Prevent duplicate dispatches for the same event
CREATE UNIQUE INDEX IF NOT EXISTS idx_sco_event_id
  ON public.server_conversion_outbox (event_id);

-- Lookup by lead for debugging
CREATE INDEX IF NOT EXISTS idx_sco_lead_id
  ON public.server_conversion_outbox (lead_id)
  WHERE lead_id IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_sco_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sco_updated_at ON public.server_conversion_outbox;
CREATE TRIGGER trg_sco_updated_at
  BEFORE UPDATE ON public.server_conversion_outbox
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sco_updated_at();

-- RLS: Only service_role can read/write (no direct client access)
ALTER TABLE public.server_conversion_outbox ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.server_conversion_outbox IS
  'Queues first-party conversion events for server-side dispatch to Meta CAPI, TikTok Events API, Google Ads EC, sGTM.';
