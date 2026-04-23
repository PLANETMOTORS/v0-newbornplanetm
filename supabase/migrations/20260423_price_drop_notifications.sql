-- Price Drop Notifications — dedup tracking + DB trigger for automated alerts
-- Run this in the Supabase SQL editor to enable price drop email alerts.

-- ─────────────────────────────────────────
-- 1. Notification dedup table
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_drop_notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID        NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  old_price       INTEGER     NOT NULL, -- cents
  new_price       INTEGER     NOT NULL, -- cents
  notified_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Dedup: one alert per vehicle per recipient per week
  CONSTRAINT uq_price_drop_weekly
    UNIQUE (vehicle_id, recipient_email, (date_trunc('week', notified_at)))
);

CREATE INDEX IF NOT EXISTS idx_pdn_vehicle_email
  ON public.price_drop_notifications (vehicle_id, recipient_email, notified_at DESC);

-- RLS: service role only
ALTER TABLE public.price_drop_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.price_drop_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────
-- 2. Helper function: notify on price drop
-- ─────────────────────────────────────────
-- This function is called by the trigger below. It inserts a row into
-- net._http_response via pg_net to invoke the Edge Function.
-- If pg_net is not enabled, it falls back to notify via pg_notify channel.

CREATE OR REPLACE FUNCTION public.handle_vehicle_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _payload JSONB;
BEGIN
  -- Only fire when price actually decreased
  IF NEW.price IS NOT NULL
     AND OLD.price IS NOT NULL
     AND NEW.price < OLD.price
  THEN
    _payload := jsonb_build_object(
      'vehicle_id', NEW.id,
      'old_price', OLD.price,
      'new_price', NEW.price,
      'year', NEW.year,
      'make', NEW.make,
      'model', NEW.model,
      'trim', COALESCE(NEW.trim, ''),
      'stock_number', NEW.stock_number,
      'primary_image_url', COALESCE(NEW.primary_image_url, ''),
      'event_at', now()
    );

    -- Use pg_notify to signal the Edge Function via Database Webhook
    PERFORM pg_notify('price_drop', _payload::text);

    -- Also attempt HTTP call via pg_net if available
    BEGIN
      PERFORM net.http_post(
        url := current_setting('app.supabase_url', true) || '/functions/v1/price-drop-alert',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := _payload
      );
    EXCEPTION WHEN OTHERS THEN
      -- pg_net not available or config missing — Edge Function must be
      -- invoked via Supabase Database Webhook (configured in dashboard)
      RAISE NOTICE 'pg_net call skipped: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────
-- 3. Trigger on vehicles table
-- ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_vehicle_price_drop ON public.vehicles;

CREATE TRIGGER trg_vehicle_price_drop
  AFTER UPDATE OF price ON public.vehicles
  FOR EACH ROW
  WHEN (NEW.price < OLD.price)
  EXECUTE FUNCTION public.handle_vehicle_price_drop();

-- ─────────────────────────────────────────
-- 4. Test simulation query (for validation)
-- ─────────────────────────────────────────
-- To simulate a price drop:
--   UPDATE vehicles SET price = price - 100000 WHERE stock_number = 'TEST123';
--
-- To verify the trigger fired:
--   SELECT * FROM price_drop_notifications ORDER BY notified_at DESC LIMIT 5;
--
-- To check pg_notify channel:
--   LISTEN price_drop;
--   UPDATE vehicles SET price = price - 50000 WHERE stock_number = 'TEST123';
