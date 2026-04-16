-- 012_checkout_race_condition_fix.sql
-- Prevents double-booking race conditions in the checkout flow.
-- 
-- Problem: Multiple users can start Stripe checkout sessions for the same vehicle
-- simultaneously. Without a lock at session creation time, the first user to
-- complete payment wins — but the other users' payments also succeed, creating
-- double-bookings.
--
-- Fix:
-- 1. Add 'checkout_in_progress' vehicle status for session-level locking
-- 2. Ensure the orders table and unique partial index exist
-- 3. Add a Postgres function for atomic vehicle locking

-- ── Step 1: Add checkout_in_progress to vehicle status constraint ──────────
-- Drop the existing CHECK constraint and re-create with the new status
ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_status_check;

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_status_check
  CHECK (status IN ('available', 'reserved', 'sold', 'pending', 'checkout_in_progress'));

-- ── Step 2: Ensure orders table exists ─────────────────────────────────────
-- (Idempotent — only creates if missing. Full schema from 004_create_orders_schema.sql)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ── Step 3: Unique partial index — prevents double-booking at DB level ─────
-- Only one active order per vehicle. This is the last line of defense.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_vehicle_single_active
  ON public.orders (vehicle_id)
  WHERE status IN ('created', 'confirmed', 'processing', 'ready_for_delivery', 'in_transit');

-- ── Step 4: Atomic vehicle lock function ───────────────────────────────────
-- Used by startVehicleCheckout to atomically claim a vehicle for checkout.
-- Returns JSONB with vehicle data fields (matching the TypeScript interface in
-- app/actions/stripe.ts). Uses SELECT ... FOR UPDATE for row-level locking,
-- then transitions to 'checkout_in_progress' so the lock persists beyond this TX.
CREATE OR REPLACE FUNCTION public.lock_vehicle_for_checkout(
  p_vehicle_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_vehicle RECORD;
BEGIN
  SELECT id, year, make, model, price, status
    INTO v_vehicle
    FROM public.vehicles
   WHERE id = p_vehicle_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vehicle not found');
  END IF;

  IF v_vehicle.status NOT IN ('available', 'reserved') THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Vehicle is %s, not available for checkout', v_vehicle.status));
  END IF;

  -- Transition to 'checkout_in_progress' so the lock persists beyond COMMIT.
  -- Without this, the FOR UPDATE lock releases and concurrent requests slip through.
  UPDATE public.vehicles
     SET status = 'checkout_in_progress', updated_at = NOW()
   WHERE id = p_vehicle_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_vehicle.id,
    'year', v_vehicle.year,
    'make', v_vehicle.make,
    'model', v_vehicle.model,
    'price', v_vehicle.price,
    'status', v_vehicle.status
  );
END;
$$;

-- ── Step 5: Updated_at trigger for orders ──────────────────────────────────
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

-- ── Step 6: RLS policies for orders ────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Service role full access to orders" ON public.orders;
CREATE POLICY "Service role full access to orders"
  ON public.orders FOR ALL
  USING (auth.role() = 'service_role');
