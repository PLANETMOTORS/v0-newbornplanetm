-- 023_reservation_payment_validation.sql
-- Enforce payment validation rules on reservations.
--
-- Rule: A reservation can only be set to 'confirmed' if deposit_status = 'paid'.
-- This prevents any code path (webhook, admin, direct SQL) from confirming a
-- reservation that hasn't received an approved Stripe payment.

-- 1. Trigger function: block confirmation without approved payment
CREATE OR REPLACE FUNCTION public.enforce_reservation_payment_rule()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only enforce when status is being set to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') THEN
    -- Require deposit_status = 'paid'
    IF NEW.deposit_status IS NULL OR NEW.deposit_status <> 'paid' THEN
      RAISE EXCEPTION 'Cannot confirm reservation: deposit has not been paid (deposit_status = %)', COALESCE(NEW.deposit_status, 'NULL')
        USING HINT = 'Only reservations with an approved Stripe payment (deposit_status = paid) can be confirmed.',
              ERRCODE = 'check_violation';
    END IF;

    -- Require a Stripe payment intent or checkout session reference
    IF NEW.stripe_payment_intent_id IS NULL AND NEW.stripe_checkout_session_id IS NULL THEN
      RAISE EXCEPTION 'Cannot confirm reservation: no Stripe payment reference found'
        USING HINT = 'A stripe_payment_intent_id or stripe_checkout_session_id is required to confirm a reservation.',
              ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Attach trigger to reservations table (INSERT and UPDATE)
DROP TRIGGER IF EXISTS enforce_payment_before_confirm ON public.reservations;
CREATE TRIGGER enforce_payment_before_confirm
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_reservation_payment_rule();

-- 3. Validation helper RPC: verify payment status before confirming a reservation.
--    Returns {valid: true} or {valid: false, reason: '...'}.
--    Call this from application code as an additional safety check.
CREATE OR REPLACE FUNCTION public.validate_reservation_payment(
  p_reservation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  SELECT id, status, deposit_status, stripe_payment_intent_id, stripe_checkout_session_id,
         deposit_amount, expires_at
    INTO v_reservation
    FROM public.reservations
   WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Reservation not found');
  END IF;

  -- Already confirmed — no need to re-validate
  IF v_reservation.status = 'confirmed' THEN
    RETURN jsonb_build_object('valid', true, 'reason', 'Already confirmed');
  END IF;

  -- Check deposit status
  IF v_reservation.deposit_status IS NULL OR v_reservation.deposit_status <> 'paid' THEN
    RETURN jsonb_build_object('valid', false, 'reason',
      format('Deposit not paid (current status: %s)', v_reservation.deposit_status));
  END IF;

  -- Check Stripe payment reference exists
  IF v_reservation.stripe_payment_intent_id IS NULL
     AND v_reservation.stripe_checkout_session_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'No Stripe payment reference');
  END IF;

  -- Check not expired
  IF v_reservation.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Reservation has expired');
  END IF;

  RETURN jsonb_build_object('valid', true, 'reason', 'Payment verified');
END;
$$;
