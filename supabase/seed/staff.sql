-- =============================================================================
-- Planet Motors — Staff Seed Data
-- Run AFTER migration 20260423000001_garage_foundation.sql
--
-- NOTE: These inserts reference auth.users rows that must already exist.
-- Create the auth users first via Supabase Dashboard → Authentication → Users,
-- then run this seed to populate staff_members.
--
-- Staff roster:
--   Toni Sultzberg  — owner / finance_manager
--   Hamza           — sales
-- =============================================================================

-- Insert staff members (replace UUIDs with actual auth.users IDs after creation)
-- To get the UUID: Dashboard → Authentication → Users → copy the user's UUID

-- Toni Sultzberg — Owner & Finance Manager
insert into staff_members (user_id, role, display_name, title, email, phone, active)
values (
  '00000000-0000-0000-0000-000000000001', -- REPLACE with Toni's auth.users UUID
  'owner',
  'Toni Sultzberg',
  'Owner & Finance Manager',
  'toni@planetmotors.ca',
  '+1-905-555-0100',
  true
)
on conflict (user_id) do update set
  role         = excluded.role,
  display_name = excluded.display_name,
  title        = excluded.title,
  email        = excluded.email,
  phone        = excluded.phone,
  active       = excluded.active;

-- Hamza — Sales
insert into staff_members (user_id, role, display_name, title, email, phone, active)
values (
  '00000000-0000-0000-0000-000000000002', -- REPLACE with Hamza's auth.users UUID
  'sales',
  'Hamza',
  'Sales Consultant',
  'hamza@planetmotors.ca',
  '+1-905-555-0101',
  true
)
on conflict (user_id) do update set
  role         = excluded.role,
  display_name = excluded.display_name,
  title        = excluded.title,
  email        = excluded.email,
  phone        = excluded.phone,
  active       = excluded.active;

-- Verify
select user_id, role, display_name, title, active from staff_members;
