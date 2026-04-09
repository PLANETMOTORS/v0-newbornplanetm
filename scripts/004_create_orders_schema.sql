-- =====================================================
-- ORDERS SCHEMA
-- Planet Motors - Checkout and purchase orders
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(32) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,

  status VARCHAR(30) NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'confirmed', 'processing', 'ready_for_delivery', 'in_transit', 'delivered', 'cancelled', 'refunded')),

  payment_method VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('financing', 'cash', 'bank_draft')),
  financing_offer_id TEXT,
  trade_in_offer_id TEXT,

  delivery_type VARCHAR(20) NOT NULL DEFAULT 'pickup'
    CHECK (delivery_type IN ('pickup', 'delivery')),
  delivery_address_id UUID,
  hub_id UUID,
  preferred_date DATE,
  preferred_time_slot VARCHAR(50),

  protection_plan_id TEXT,

  vehicle_price_cents INTEGER NOT NULL,
  documentation_fee_cents INTEGER NOT NULL DEFAULT 49900,
  omvic_fee_cents INTEGER NOT NULL DEFAULT 1000,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  protection_plan_fee_cents INTEGER NOT NULL DEFAULT 0,
  tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 13.00,
  tax_amount_cents INTEGER NOT NULL,
  total_before_credits_cents INTEGER NOT NULL,
  trade_in_credit_cents INTEGER NOT NULL DEFAULT 0,
  down_payment_cents INTEGER NOT NULL DEFAULT 0,
  total_credits_cents INTEGER NOT NULL DEFAULT 0,
  total_price_cents INTEGER NOT NULL,
  amount_financed_cents INTEGER NOT NULL DEFAULT 0,

  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  documents_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  return_policy JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle_id ON public.orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_orders_updated_at ON public.orders;
CREATE TRIGGER trg_update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_orders_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can update own open orders" ON public.orders;
CREATE POLICY "Users can update own open orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = customer_id AND status IN ('created', 'confirmed'))
  WITH CHECK (auth.uid() = customer_id);
