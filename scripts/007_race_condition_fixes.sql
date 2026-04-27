-- 007_race_condition_fixes.sql
-- Fix race conditions in reservation, checkout, and order flows.
--
-- Problem: Application-layer checks (read status → decide → write) are not atomic.
-- Concurrent requests can all read "available" before any of them writes "reserved".
--
-- Solution: Database-layer RPC functions that use SELECT ... FOR UPDATE to acquire
-- row-level locks before making decisions, ensuring serialized access per vehicle.

-- 1. Atomic vehicle claim for reservations.
--    Locks the vehicle row, checks status, inserts reservation, updates vehicle — all in one TX.
CREATE OR REPLACE FUNCTION public.claim_vehicle_for_reservation(
  p_vehicle_id UUID,
  p_user_id UUID,
  p_customer_email TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_deposit_amount INTEGER DEFAULT 25000,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_vehicle RECORD;
  v_existing RECORD;
  v_reservation_id UUID;
  v_expires_at TIMESTAMPTZ := NOW() + INTERVAL '48 hours';
BEGIN
  -- Lock the vehicle row. Any concurrent caller blocks here until we COMMIT/ROLLBACK.
  SELECT id, stock_number, year, make, model, status
    INTO v_vehicle
    FROM public.vehicles
   WHERE id = p_vehicle_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vehicle not found');
  END IF;

  IF v_vehicle.status NOT IN ('available', 'reserved') THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Vehicle is %s, not available for reservation', v_vehicle.status));
  END IF;

  -- Check for a conflicting active reservation by a DIFFERENT customer.
  SELECT id, customer_email INTO v_existing
    FROM public.reservations
   WHERE vehicle_id = p_vehicle_id
     AND customer_email <> p_customer_email
     AND status IN ('pending', 'confirmed')
     AND expires_at > NOW()
   LIMIT 1
     FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error',
      'This vehicle already has an active reservation');
  END IF;

  -- Re-use existing reservation for the same customer if one exists.
  SELECT id INTO v_existing
    FROM public.reservations
   WHERE vehicle_id = p_vehicle_id
     AND customer_email = p_customer_email
     AND status IN ('pending', 'confirmed')
     AND expires_at > NOW()
   LIMIT 1
     FOR UPDATE;

  IF FOUND THEN
    v_reservation_id := v_existing.id;
  ELSE
    INSERT INTO public.reservations (
      vehicle_id, user_id, customer_email, customer_phone, customer_name,
      deposit_amount, deposit_status, status, expires_at, notes
    ) VALUES (
      p_vehicle_id, p_user_id, p_customer_email, p_customer_phone, p_customer_name,
      p_deposit_amount, 'pending', 'pending', v_expires_at, p_notes
    )
    RETURNING id INTO v_reservation_id;
  END IF;

  -- Mark vehicle as reserved (idempotent if already reserved).
  UPDATE public.vehicles
     SET status = 'reserved', updated_at = NOW()
   WHERE id = p_vehicle_id
     AND status IN ('available', 'reserved');

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'stock_number', v_vehicle.stock_number,
    'vehicle_year', v_vehicle.year,
    'vehicle_make', v_vehicle.make,
    'vehicle_model', v_vehicle.model
  );
END;
$$;

-- 2. Atomic vehicle claim for full-purchase orders.
--    Locks vehicle row, verifies status, transitions to 'pending'.
CREATE OR REPLACE FUNCTION public.claim_vehicle_for_order(
  p_vehicle_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_vehicle RECORD;
  v_active_reservation RECORD;
BEGIN
  -- Lock the vehicle row.
  SELECT id, stock_number, year, make, model, trim, price, status
    INTO v_vehicle
    FROM public.vehicles
   WHERE id = p_vehicle_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vehicle not found');
  END IF;

  IF v_vehicle.status NOT IN ('available', 'reserved') THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Vehicle is %s, not available for ordering', v_vehicle.status));
  END IF;

  -- If reserved, verify the caller owns the reservation.
  IF v_vehicle.status = 'reserved' THEN
    SELECT id, user_id INTO v_active_reservation
      FROM public.reservations
     WHERE vehicle_id = p_vehicle_id
       AND status IN ('pending', 'confirmed')
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1
       FOR UPDATE;

    IF FOUND THEN
      -- If reservation has no user_id or belongs to a different user, block the claim.
      IF v_active_reservation.user_id IS NULL
         OR v_active_reservation.user_id <> p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error',
          'Vehicle is reserved by another customer');
      END IF;
    END IF;
  END IF;

  -- Atomically transition to 'pending'.
  UPDATE public.vehicles
     SET status = 'pending', updated_at = NOW()
   WHERE id = p_vehicle_id;

  RETURN jsonb_build_object(
    'success', true,
    'vehicle_id', v_vehicle.id,
    'stock_number', v_vehicle.stock_number,
    'year', v_vehicle.year,
    'make', v_vehicle.make,
    'model', v_vehicle.model,
    'trim', v_vehicle.trim,
    'price', v_vehicle.price,
    'previous_status', v_vehicle.status
  );
END;
$$;

-- 3. Atomic vehicle status transition for webhooks.
--    Ensures only one webhook can transition a vehicle at a time.
CREATE OR REPLACE FUNCTION public.transition_vehicle_status(
  p_vehicle_id UUID,
  p_from_statuses TEXT[],
  p_to_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_vehicle RECORD;
BEGIN
  SELECT id, status INTO v_vehicle
    FROM public.vehicles
   WHERE id = p_vehicle_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_vehicle.status <> ALL(p_from_statuses) THEN
    RETURN false;
  END IF;

  UPDATE public.vehicles
     SET status = p_to_status, updated_at = NOW()
   WHERE id = p_vehicle_id;

  RETURN true;
END;
$$;

-- 4. Atomic checkout status check for startVehicleCheckout.
--    NOTE: This initial version transitions to 'pending'. It is superseded by
--    012_checkout_race_condition_fix.sql which transitions to 'checkout_in_progress'
--    instead, providing a more precise status for session-level locking.
--    Run 012 after this script to replace this function with the updated version.
CREATE OR REPLACE FUNCTION public.lock_vehicle_for_checkout(
  p_vehicle_id UUID
)
RETURNS JSONB
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

  UPDATE public.vehicles
     SET status = 'pending', updated_at = NOW()
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
