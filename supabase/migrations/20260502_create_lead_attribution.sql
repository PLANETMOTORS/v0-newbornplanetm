-- Lead Attribution — stores first-touch and last-touch attribution for every lead.
-- Linked to the leads table via lead_id. Populated server-side after form submission.

CREATE TABLE IF NOT EXISTS public.lead_attribution (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID          NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,

  -- First-touch attribution (captured on landing)
  first_touch_source    VARCHAR(200),
  first_touch_medium    VARCHAR(200),
  first_touch_campaign  VARCHAR(200),
  first_touch_content   VARCHAR(200),
  first_touch_term      VARCHAR(200),
  first_touch_landing   TEXT,
  first_touch_referrer  TEXT,
  first_touch_at        TIMESTAMPTZ,

  -- Last-touch attribution (captured at conversion)
  last_touch_source     VARCHAR(200),
  last_touch_medium     VARCHAR(200),
  last_touch_campaign   VARCHAR(200),
  last_touch_content    VARCHAR(200),
  last_touch_term       VARCHAR(200),
  last_touch_landing    TEXT,
  last_touch_referrer   TEXT,
  last_touch_at         TIMESTAMPTZ,

  -- Click IDs for cross-platform matching
  gclid             VARCHAR(200),
  gbraid            VARCHAR(200),
  wbraid            VARCHAR(200),
  fbclid            VARCHAR(200),
  ttclid            VARCHAR(200),
  msclkid           VARCHAR(200),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One attribution record per lead
CREATE UNIQUE INDEX IF NOT EXISTS idx_la_lead_id
  ON public.lead_attribution (lead_id);

-- Reporting: group by source/medium
CREATE INDEX IF NOT EXISTS idx_la_first_source_medium
  ON public.lead_attribution (first_touch_source, first_touch_medium);

CREATE INDEX IF NOT EXISTS idx_la_last_source_medium
  ON public.lead_attribution (last_touch_source, last_touch_medium);

-- RLS: Only service_role can read/write
ALTER TABLE public.lead_attribution ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.lead_attribution IS
  'First-touch and last-touch marketing attribution per lead. Populated server-side.';
