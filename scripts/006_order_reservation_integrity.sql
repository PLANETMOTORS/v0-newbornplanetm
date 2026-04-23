-- 006_order_reservation_integrity.sql
-- Enforce order/reservation concurrency invariants at the database layer.

-- Remove any pre-existing duplicate active orders per vehicle so the unique index can be created.
-- Keeps the most recently created order for each (vehicle_id, active-status) group.
DELETE FROM public.orders
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY vehicle_id
             ORDER BY created_at DESC
           ) AS rn
    FROM public.orders
    WHERE status IN ('created', 'confirmed', 'processing', 'ready_for_delivery', 'in_transit')
  ) sub
  WHERE rn > 1
);

-- Prevent more than one active order on the same vehicle.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_vehicle_single_active
  ON public.orders (vehicle_id)
  WHERE status IN ('created', 'confirmed', 'processing', 'ready_for_delivery', 'in_transit');

-- Prevent more than one active, non-expired reservation on the same vehicle.
-- Aligns with application-layer logic in app/actions/reservation.ts which filters
-- by status IN ('pending', 'confirmed') AND expires_at > now().
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_vehicle_single_active
  ON public.reservations (vehicle_id)
  WHERE status IN ('pending', 'confirmed') AND expires_at > now();
