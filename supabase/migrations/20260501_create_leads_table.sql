-- 20260501_create_leads_table.sql
--
-- LAUNCH-DAY FIX: the `leads` table SQL (originally in
-- scripts/018_create_leads_conversations_ai_config.sql) was never moved
-- into the auto-applied supabase/migrations/ folder. As a result the
-- production DB has no `leads` table and every customer pre-approval
-- captured by the `capture-lead` edge function silently fails to
-- persist (the email still fires; the row is dropped on the floor).
--
-- This migration is fully idempotent — `IF NOT EXISTS` everywhere — so
-- it is safe to run on environments that already have the table.

-- ── leads ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  source          VARCHAR(50)   NOT NULL DEFAULT 'other'
                    CHECK (source IN (
                      'contact_form','chat','phone','finance_app',
                      'trade_in','reservation','test_drive','walk_in',
                      'referral','other'
                    )),
  status          VARCHAR(30)   NOT NULL DEFAULT 'new'
                    CHECK (status IN (
                      'new','contacted','qualified','negotiating',
                      'converted','lost','archived'
                    )),
  priority        VARCHAR(10)   NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','urgent')),

  -- Customer info
  customer_name   VARCHAR(200),
  customer_email  VARCHAR(200),
  customer_phone  VARCHAR(30),
  customer_id     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Context
  vehicle_id      UUID          REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_info    TEXT,
  subject         VARCHAR(300),
  message         TEXT,
  notes           TEXT,

  -- Tracking
  assigned_to     VARCHAR(200),
  contacted_at    TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  conversion_type VARCHAR(50),
  utm_source      VARCHAR(200),
  utm_medium      VARCHAR(200),
  utm_campaign    VARCHAR(200),

  -- Reference back to the originating record
  source_id       UUID,
  source_table    VARCHAR(100),

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, but the explicit policy is the safety net
-- for any code path that uses the anon key.
DROP POLICY IF EXISTS "Service role full access to leads" ON public.leads;
CREATE POLICY "Service role full access to leads"
  ON public.leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leads_status         ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source         ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created        ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_customer_email ON public.leads(customer_email);
CREATE INDEX IF NOT EXISTS idx_leads_assigned       ON public.leads(assigned_to);

-- Auto-bump updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_leads_updated_at();
