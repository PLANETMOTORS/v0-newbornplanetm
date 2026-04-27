-- =====================================================
-- RETURNS SCHEMA
-- Planet Motors - 10-day vehicle return requests
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.returns (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id               UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  customer_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Why the customer is returning the vehicle.
  reason                 TEXT NOT NULL,
  additional_comments    TEXT,

  -- Logistics
  preferred_pickup_date  DATE,

  -- Lifecycle status
  status                 VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'pickup_scheduled', 'inspecting', 'refunded', 'cancelled')),

  -- Finance
  estimated_refund_cents INTEGER NOT NULL DEFAULT 0,
  actual_refund_cents    INTEGER,

  -- Timestamps
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A customer may only open one active return per order.
CREATE UNIQUE INDEX IF NOT EXISTS returns_order_id_active_idx
  ON public.returns (order_id)
  WHERE status NOT IN ('rejected', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_returns_customer_id  ON public.returns (customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id     ON public.returns (order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status       ON public.returns (status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at   ON public.returns (created_at DESC);

-- Auto-update updated_at on every row change.
CREATE OR REPLACE FUNCTION public.update_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_returns_updated_at ON public.returns;
CREATE TRIGGER trg_update_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_returns_updated_at();

-- RLS: customers can only see and create their own returns.
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own returns" ON public.returns;
CREATE POLICY "Users can view own returns"
  ON public.returns FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can create own returns" ON public.returns;
CREATE POLICY "Users can create own returns"
  ON public.returns FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Service-role key bypasses RLS by design; this explicit policy restricts ALL
-- access (update/delete/admin) to service_role only, preventing anon/authenticated
-- roles from acquiring full access through this policy.
DROP POLICY IF EXISTS "Service role full access to returns" ON public.returns;
CREATE POLICY "Service role full access to returns"
  ON public.returns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
