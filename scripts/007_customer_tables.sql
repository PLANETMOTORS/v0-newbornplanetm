-- 007_customer_tables.sql
-- Customer addresses and in-app notifications tables

-- ─────────────────────────────────────────
-- customer_addresses
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                  VARCHAR(20)   NOT NULL DEFAULT 'other'
                          CHECK (type IN ('home', 'work', 'other')),
  label                 VARCHAR(50),
  first_name            VARCHAR(50),
  last_name             VARCHAR(50),
  street                VARCHAR(200)  NOT NULL,
  unit                  VARCHAR(50),
  city                  VARCHAR(100)  NOT NULL,
  province              VARCHAR(10)   NOT NULL,
  postal_code           VARCHAR(10)   NOT NULL,
  country               VARCHAR(50)   NOT NULL DEFAULT 'Canada',
  phone                 VARCHAR(20),
  is_default            BOOLEAN       NOT NULL DEFAULT false,
  delivery_instructions TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Users manage their own addresses"
  ON public.customer_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user
  ON public.customer_addresses(user_id);

-- Enforce at most one default address per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_user_default
  ON public.customer_addresses(user_id)
  WHERE is_default = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_customer_addresses_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trg_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_addresses_updated_at();


-- ─────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        VARCHAR(50)   NOT NULL,
  title       VARCHAR(200)  NOT NULL,
  message     TEXT          NOT NULL,
  vehicle_id  UUID          REFERENCES public.vehicles(id) ON DELETE SET NULL,
  order_id    UUID          REFERENCES public.orders(id) ON DELETE SET NULL,
  read        BOOLEAN       NOT NULL DEFAULT false,
  action_url  VARCHAR(500),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own notifications" ON public.notifications;
CREATE POLICY "Users see their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own notifications" ON public.notifications;
CREATE POLICY "Users update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_date
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id)
  WHERE read = false;
