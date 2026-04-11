-- 008_create_audit_tables.sql
-- Audit and event tables required by the Phase 2 hardening layer.
-- All tables are append-only by policy (no UPDATE/DELETE for non-service roles).
-- Apply after 007_customer_tables.sql.

-- ---------------------------------------------------------------------------
-- 1. admin_audit_events
--    General-purpose immutable audit log for all admin-actor state changes.
--    Written by: lib/auth/admin.ts → recordAdminAuditEvent()
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     TEXT        NOT NULL,          -- Supabase user ID or system actor string
  action       TEXT        NOT NULL,          -- e.g. 'inventory_import_csv', 'application_status_change'
  entity_type  TEXT        NOT NULL,          -- e.g. 'vehicle', 'finance_application'
  entity_id    TEXT        NOT NULL,          -- ID of the affected record
  before_state TEXT,                          -- JSON snapshot of state before change (nullable)
  after_state  TEXT,                          -- JSON snapshot of state after change (nullable)
  notes        TEXT,                          -- Free-text supplementary notes (nullable)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_events_actor_idx
  ON public.admin_audit_events (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_events_entity_idx
  ON public.admin_audit_events (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_events_action_idx
  ON public.admin_audit_events (action, created_at DESC);

ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

-- Service-role key bypasses RLS and may insert/read.
-- Deny all direct access by authenticated or anonymous users.
DROP POLICY IF EXISTS "No direct user access to admin_audit_events"
  ON public.admin_audit_events;

CREATE POLICY "No direct user access to admin_audit_events"
  ON public.admin_audit_events
  FOR ALL
  TO authenticated, anon
  USING (false);

-- ---------------------------------------------------------------------------
-- 2. negotiation_audits
--    Audit trail for every price negotiation LLM decision.
--    Written by: app/api/negotiate/route.ts (fire-and-forget)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.negotiation_audits (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id            TEXT        NOT NULL,
  listing_price_cents   BIGINT      NOT NULL CHECK (listing_price_cents > 0),
  customer_offer_cents  BIGINT      NOT NULL CHECK (customer_offer_cents > 0),
  min_acceptable_cents  BIGINT      NOT NULL CHECK (min_acceptable_cents > 0),
  client_ip             TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS negotiation_audits_user_idx
  ON public.negotiation_audits (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS negotiation_audits_vehicle_idx
  ON public.negotiation_audits (vehicle_id, created_at DESC);

ALTER TABLE public.negotiation_audits ENABLE ROW LEVEL SECURITY;

-- Users may read their own negotiation history; service-role may do anything.
DROP POLICY IF EXISTS "Users read own negotiation audits"
  ON public.negotiation_audits;

CREATE POLICY "Users read own negotiation audits"
  ON public.negotiation_audits
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "No user inserts to negotiation_audits"
  ON public.negotiation_audits;

CREATE POLICY "No user inserts to negotiation_audits"
  ON public.negotiation_audits
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- 3. finance_calc_audits
--    Audit trail for finance calculator usage (anonymous or authenticated).
--    Written by: app/api/v1/financing/calculator/route.ts (fire-and-forget)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_calc_audits (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        REFERENCES auth.users(id) ON DELETE SET NULL, -- nullable: anon calcs allowed
  client_ip              TEXT,
  vehicle_price_cents    BIGINT      NOT NULL CHECK (vehicle_price_cents >= 0),
  trade_in_cents         BIGINT      NOT NULL CHECK (trade_in_cents >= 0),
  down_payment_cents     BIGINT      NOT NULL CHECK (down_payment_cents >= 0),
  interest_rate_bps      INT         NOT NULL CHECK (interest_rate_bps >= 0),  -- basis points (e.g. 699 = 6.99%)
  term_months            INT         NOT NULL CHECK (term_months > 0),
  province               TEXT        NOT NULL,
  monthly_payment_cents  BIGINT      NOT NULL CHECK (monthly_payment_cents >= 0),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_calc_audits_user_idx
  ON public.finance_calc_audits (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS finance_calc_audits_created_idx
  ON public.finance_calc_audits (created_at DESC);

ALTER TABLE public.finance_calc_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct user access to finance_calc_audits"
  ON public.finance_calc_audits;

CREATE POLICY "No direct user access to finance_calc_audits"
  ON public.finance_calc_audits
  FOR ALL
  TO authenticated, anon
  USING (false);

-- ---------------------------------------------------------------------------
-- 4. offer_access_audits
--    Records every time a user retrieves financing offers for an application.
--    Written by: app/api/v1/financing/offers/route.ts (fire-and-forget)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offer_access_audits (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  application_id   UUID        NOT NULL,       -- FK to finance_applications
  action           TEXT        NOT NULL DEFAULT 'offers_retrieved',
  offer_count      INT         NOT NULL DEFAULT 0 CHECK (offer_count >= 0),
  client_ip        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offer_access_audits_user_idx
  ON public.offer_access_audits (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS offer_access_audits_application_idx
  ON public.offer_access_audits (application_id, created_at DESC);

ALTER TABLE public.offer_access_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct user access to offer_access_audits"
  ON public.offer_access_audits;

CREATE POLICY "No direct user access to offer_access_audits"
  ON public.offer_access_audits
  FOR ALL
  TO authenticated, anon
  USING (false);

-- ---------------------------------------------------------------------------
-- 5. offer_selection_audits
--    Records every lender offer selection attempt (including stubs).
--    Written by: app/api/v1/financing/offers/[id]/select/route.ts (fire-and-forget)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offer_selection_audits (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  application_id   UUID        NOT NULL,       -- FK to finance_applications
  offer_id         TEXT        NOT NULL,       -- lender-assigned offer identifier
  action           TEXT        NOT NULL,       -- e.g. 'selection_attempted_unavailable_offer'
  client_ip        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offer_selection_audits_user_idx
  ON public.offer_selection_audits (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS offer_selection_audits_application_idx
  ON public.offer_selection_audits (application_id, created_at DESC);

ALTER TABLE public.offer_selection_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct user access to offer_selection_audits"
  ON public.offer_selection_audits;

CREATE POLICY "No direct user access to offer_selection_audits"
  ON public.offer_selection_audits
  FOR ALL
  TO authenticated, anon
  USING (false);
