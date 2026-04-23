-- Test Plan: Price Drop Alert Trigger
-- Run these queries in the Supabase SQL editor to validate the trigger.

-- ─────────────────────────────────────────
-- Step 1: Verify trigger exists
-- ─────────────────────────────────────────
SELECT tgname, tgenabled, tgtype
FROM pg_trigger
WHERE tgname = 'trg_vehicle_price_drop';

-- Expected: 1 row with tgname = 'trg_vehicle_price_drop'

-- ─────────────────────────────────────────
-- Step 2: Pick a test vehicle
-- ─────────────────────────────────────────
-- Find a vehicle with associated leads or finance applications
SELECT v.id, v.stock_number, v.year, v.make, v.model, v.price,
       (SELECT COUNT(*) FROM leads l WHERE l.vehicle_id = v.id) AS lead_count,
       (SELECT COUNT(*) FROM finance_applications fa WHERE fa.vehicle_id = v.id) AS fin_app_count
FROM vehicles v
WHERE v.status = 'available'
ORDER BY lead_count DESC
LIMIT 5;

-- ─────────────────────────────────────────
-- Step 3: Listen for pg_notify (open in a separate SQL tab)
-- ─────────────────────────────────────────
-- LISTEN price_drop;

-- ─────────────────────────────────────────
-- Step 4: Simulate price drop ($1,000 = 100000 cents)
-- Replace '<VEHICLE_ID>' with the UUID from Step 2
-- ─────────────────────────────────────────
-- UPDATE vehicles
-- SET price = price - 100000, updated_at = now()
-- WHERE id = '<VEHICLE_ID>';

-- ─────────────────────────────────────────
-- Step 5: Verify trigger fired
-- ─────────────────────────────────────────
-- Check price_drop_notifications table for new rows
SELECT * FROM price_drop_notifications
ORDER BY notified_at DESC
LIMIT 10;

-- ─────────────────────────────────────────
-- Step 6: Verify dedup (run same update again)
-- ─────────────────────────────────────────
-- UPDATE vehicles
-- SET price = price - 50000, updated_at = now()
-- WHERE id = '<VEHICLE_ID>';

-- Expected: The same user should NOT receive a second email within 7 days.
-- Check price_drop_notifications — no new row for the same recipient.

-- ─────────────────────────────────────────
-- Step 7: Revert test price change
-- ─────────────────────────────────────────
-- UPDATE vehicles
-- SET price = price + 150000, updated_at = now()
-- WHERE id = '<VEHICLE_ID>';

-- ─────────────────────────────────────────
-- Step 8: Verify Edge Function logs
-- ─────────────────────────────────────────
-- In Supabase Dashboard > Edge Functions > price-drop-alert > Logs
-- You should see structured JSON logs:
--   {"level":"info","fn":"price-drop-alert","msg":"Price drop detected",...}
--   {"level":"info","fn":"price-drop-alert","msg":"Interested users found",...}
--   {"level":"info","fn":"price-drop-alert","msg":"Email sent",...}
--   {"level":"info","fn":"price-drop-alert","msg":"Price drop alerts complete",...}
