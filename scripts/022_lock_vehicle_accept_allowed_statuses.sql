-- 022_lock_vehicle_accept_allowed_statuses.sql
-- Fixes lock_vehicle_for_checkout to accept p_allowed_statuses parameter.
--
-- Problem: The TypeScript code passes p_allowed_statuses to the RPC call, but
-- the SQL function only accepts p_vehicle_id. PostgREST silently ignores the
-- extra parameter, so the hardcoded ('available', 'reserved') check is always
-- used. This means vehicles in 'checkout_in_progress' status are rejected
-- even when the caller explicitly allows that status (e.g., deposit step
-- re-mounting after the finalize step already locked the vehicle).
--
-- Fix: Add optional p_allowed_statuses TEXT[] parameter with a default of
-- ARRAY['available', 'reserved'] so existing callers without the parameter
-- continue to work, while the checkout flow can pass the expanded list.

CREATE OR REPLACE FUNCTION public.lock_vehicle_for_checkout(
  p_vehicle_id UUID,
  p_allowed_statuses TEXT[] DEFAULT ARRAY['available', 'reserved']
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

  IF NOT (v_vehicle.status = ANY(p_allowed_statuses)) THEN
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
