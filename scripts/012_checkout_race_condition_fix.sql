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
-- Full schema is defined in 004_create_orders_schema.sql.
-- Run that migration first; this step is a no-op if the table already exists.
-- The CREATE TABLE IF NOT EXISTS and indexes are intentionally omitted here
-- to avoid duplicating the schema definition. Apply 004 before this script.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    RAISE EXCEPTION
      'orders table does not exist. Run 004_create_orders_schema.sql first.';
  END IF;
END;
$$;

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
    'status', 'checkout_in_progress'
  );
END;
$$;

-- ── Step 5: trigger already defined in 004_create_orders_schema.sql ──────────
-- update_orders_updated_at() trigger is created by 004, which must run before
-- this script (enforced by the DO block in Step 2 above).

-- ── Step 6: RLS policies ────────────────────────────────────────────────────
-- User-scoped policies (view/create/update) are created by 004.
-- The service-role policy below is unique to this migration.
DROP POLICY IF EXISTS "Service role full access to orders" ON public.orders;
CREATE POLICY "Service role full access to orders"
  ON public.orders FOR ALL
  USING (current_setting('role') = 'service_role');
