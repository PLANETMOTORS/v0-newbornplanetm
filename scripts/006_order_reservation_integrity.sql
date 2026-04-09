-- 006_order_reservation_integrity.sql
-- Enforce order/reservation concurrency invariants at the database layer.

-- Prevent more than one active order on the same vehicle.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_vehicle_single_active
  ON public.orders (vehicle_id)
  WHERE status IN ('created', 'confirmed', 'processing', 'ready_for_delivery', 'in_transit');

-- Prevent more than one active reservation on the same vehicle.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_vehicle_single_active
  ON public.reservations (vehicle_id)
  WHERE status IN ('pending', 'confirmed');
