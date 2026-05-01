-- Carfax Canada per-VIN badge cache.
--
-- Why a dedicated table (not columns on `vehicles`)?
--   1. Carfax data is keyed by VIN; an inventory row can be replaced /
--      re-listed but the underlying VIN keeps its history. A separate
--      table means we never lose Carfax cache when a vehicle is deleted.
--   2. The `payload` column stores the full normalised CarfaxBadgeSummary
--      so the VDP can render rich badges without joins.
--   3. `fetched_at` drives the staleness heuristic: VDP requests beyond
--      24 h trigger a background refresh; the admin "Re-fetch" button
--      forces an immediate update regardless of TTL.
--
-- RLS: locked. Reads MUST go through GET /api/v1/carfax/[vin] which is
-- rate-limited and authenticated. The server uses lib/supabase/admin.ts
-- (service-role key) which bypasses RLS for both reads and writes; the
-- public anon key is denied by `using (false)` so a browser cannot dump
-- the table directly. This protects the tokenized `vhrReportUrl` and
-- honours the Carfax Canada API agreement (consumption via authenticated
-- server only, not bulk-readable to anonymous clients).

create table if not exists public.carfax_cache (
  vin             text         primary key,
  payload         jsonb        not null,
  has_report      boolean      not null default false,
  result_code     integer      not null default 0,
  result_message  text         not null default '',
  fetched_at      timestamptz  not null default now(),
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

create index if not exists carfax_cache_fetched_at_idx
  on public.carfax_cache (fetched_at desc);

create index if not exists carfax_cache_has_report_idx
  on public.carfax_cache (has_report)
  where has_report = true;

-- Auto-bump updated_at on every UPDATE.
create or replace function public.carfax_cache_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists carfax_cache_set_updated_at on public.carfax_cache;
create trigger carfax_cache_set_updated_at
  before update on public.carfax_cache
  for each row execute function public.carfax_cache_touch_updated_at();

alter table public.carfax_cache enable row level security;

-- Drop the previous wide-open policy if it ever shipped.
drop policy if exists carfax_cache_read_anyone on public.carfax_cache;

-- Block ALL access from non-service roles. The service-role key bypasses
-- RLS, so the server still reads/writes freely; anon and authenticated
-- (browser) clients get nothing back from a direct SELECT.
drop policy if exists carfax_cache_no_anon_read on public.carfax_cache;
create policy carfax_cache_no_anon_read
  on public.carfax_cache
  for select
  to anon, authenticated
  using (false);

comment on table public.carfax_cache is
  'Per-VIN cache of the Carfax Canada Badging API response. Reads and writes are restricted to the service role; browser clients must go through GET /api/v1/carfax/[vin] which is rate-limited.';
