-- =============================================================================
-- Planet Motors — Garage Foundation Migration
-- 2026-04-23 | Week 1
--
-- Sections:
--   1. Extensions
--   2. Customers & Lifecycle
--   3. Staff Members + RLS helpers
--   4. Deals + Deal Events (event-sourced spine)
--   5. Trade-Ins + Photos
--   6. Finance Applications
--   7. Deposits
--   8. Deliveries
--   9. Vehicle Dossier + Documents + Aviloo SOH History
--  10. Saved Vehicles + Price-Drop Trigger
--  11. Notifications Domain
--  12. Disclosure Ledger (OMVIC-defensible)
--  13. Audit Log
--  14. Typesense Outbox
--  15. RLS Policies
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists citext;
create extension if not exists pgcrypto;

-- =============================================================================
-- 2. CUSTOMERS & LIFECYCLE
-- =============================================================================
create type customer_lifecycle as enum (
  'prospect', 'applicant', 'depositor', 'buyer', 'owner', 'advocate'
);

create table if not exists customers (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid unique not null references auth.users(id) on delete cascade,
  email                    citext not null,
  phone                    text,
  first_name               text,
  last_name                text,
  preferred_name           text,
  lifecycle                customer_lifecycle not null default 'prospect',
  lifecycle_changed_at     timestamptz not null default now(),
  assigned_sales_user_id   uuid references auth.users(id),
  assigned_finance_user_id uuid references auth.users(id),
  language                 text not null default 'en' check (language in ('en', 'fr')),
  marketing_consent        boolean not null default false,
  marketing_consent_at     timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists customers_user_id_idx      on customers (user_id);
create index if not exists customers_lifecycle_idx    on customers (lifecycle);
create index if not exists customers_sales_user_idx   on customers (assigned_sales_user_id);

-- Auto-create customer row on signup
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into customers (user_id, email, phone)
  values (new.id, new.email, new.phone)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- =============================================================================
-- 3. STAFF MEMBERS + RLS HELPERS
-- =============================================================================
create type staff_role as enum (
  'owner', 'sales_manager', 'finance_manager', 'sales', 'service', 'admin'
);

create table if not exists staff_members (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  role         staff_role not null,
  display_name text not null,
  title        text,
  email        citext not null,
  phone        text,
  avatar_url   text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Helper: is the current user a staff member?
create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff_members
    where user_id = auth.uid() and active = true
  );
$$;

-- Helper: what role does the current staff member have?
create or replace function current_staff_role()
returns staff_role
language sql stable security definer set search_path = public as $$
  select role from staff_members
  where user_id = auth.uid() and active = true
  limit 1;
$$;

-- =============================================================================
-- 4. DEALS + DEAL EVENTS
-- =============================================================================
create type deal_stage as enum (
  'inquiry', 'application', 'approved', 'deposit_paid',
  'contracted', 'funded', 'delivered', 'closed', 'cancelled'
);

create table if not exists deals (
  id                       uuid primary key default gen_random_uuid(),
  customer_id              uuid not null references customers(id) on delete restrict,
  user_id                  uuid not null references auth.users(id),
  vehicle_id               uuid,  -- references vehicles(id) — added when vehicles table exists
  vin                      text,
  homenet_id               text,
  stage                    deal_stage not null default 'inquiry',
  stage_changed_at         timestamptz not null default now(),
  assigned_sales_user_id   uuid references auth.users(id),
  assigned_finance_user_id uuid references auth.users(id),
  autoraptor_deal_id       text,
  sla_respond_by           timestamptz,
  internal_notes           text,  -- staff-only; excluded from customer-facing views
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists deals_user_id_idx       on deals (user_id);
create index if not exists deals_stage_idx         on deals (stage);
create index if not exists deals_vin_idx           on deals (vin);
create index if not exists deals_sales_user_idx    on deals (assigned_sales_user_id);

-- Deal Events — append-only, idempotent, ordered
create type event_source as enum (
  'customer', 'staff', 'stripe', 'routeone', 'dealertrack',
  'persona', 'homenet', 'aviloo', 'twilio', 'resend', 'system'
);

create table if not exists deal_events (
  id                  uuid primary key default gen_random_uuid(),
  deal_id             uuid not null references deals(id) on delete cascade,
  event_type          text not null,
  source              event_source not null,
  actor_user_id       uuid references auth.users(id),
  payload             jsonb not null default '{}',
  source_event_id     text,
  source_occurred_at  timestamptz,
  sequence_number     bigint generated always as identity,
  occurred_at         timestamptz not null default now(),
  idempotency_key     text,
  constraint deal_events_idempotency_unique unique (source, idempotency_key)
);

create index if not exists deal_events_deal_id_idx
  on deal_events (deal_id, source_occurred_at desc nulls last, sequence_number desc);
create index if not exists deal_events_type_idx    on deal_events (event_type);
create index if not exists deal_events_source_idx  on deal_events (source, source_event_id);

-- Customer-safe view (excludes internal_notes)
create or replace view deals_public as
  select
    id, customer_id, user_id, vehicle_id, vin, homenet_id,
    stage, stage_changed_at,
    assigned_sales_user_id, assigned_finance_user_id,
    autoraptor_deal_id, sla_respond_by,
    created_at, updated_at
  from deals;

-- =============================================================================
-- 5. TRADE-INS + PHOTOS
-- =============================================================================
create type trade_in_state as enum (
  'draft', 'submitted', 'appraising', 'offered',
  'accepted', 'countered', 'declined', 'locked_to_deal', 'expired'
);

create table if not exists trade_ins (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references customers(id) on delete cascade,
  user_id               uuid not null references auth.users(id),
  vin                   text,
  year                  int,
  make                  text,
  model                 text,
  trim                  text,
  mileage_km            int,
  condition_self_report jsonb,
  blackbook_quote_cents bigint,
  blackbook_raw         jsonb,
  offer_cents           bigint,
  offer_rationale       text,
  offer_expires_at      timestamptz,
  state                 trade_in_state not null default 'draft',
  linked_deal_id        uuid references deals(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists trade_in_photos (
  id           uuid primary key default gen_random_uuid(),
  trade_in_id  uuid not null references trade_ins(id) on delete cascade,
  storage_path text not null,
  kind         text not null check (kind in (
    'exterior_front','exterior_rear','exterior_driver','exterior_passenger',
    'odometer','interior_front','interior_rear','damage','vin_plate','other'
  )),
  cloudinary_id text,
  uploaded_at  timestamptz not null default now()
);

-- =============================================================================
-- 6. FINANCE APPLICATIONS
-- =============================================================================
create type finance_app_state as enum (
  'draft', 'idv_pending', 'idv_verified', 'submitted',
  'pending_stips', 'approved', 'declined', 'contracted',
  'funded', 'withdrawn'
);

create table if not exists finance_applications (
  id                   uuid primary key default gen_random_uuid(),
  deal_id              uuid not null references deals(id) on delete cascade,
  customer_id          uuid not null references customers(id) on delete restrict,
  user_id              uuid not null references auth.users(id),
  state                finance_app_state not null default 'draft',
  state_changed_at     timestamptz not null default now(),
  persona_inquiry_id   text,
  routeone_ref_id      text,
  dealertrack_ref_id   text,
  lender               text,
  apr_bps              int,
  term_months          int,
  amount_financed_cents bigint,
  stips_outstanding    jsonb default '[]',
  decline_reason       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists finance_apps_user_id_idx on finance_applications (user_id);
create index if not exists finance_apps_deal_id_idx on finance_applications (deal_id);

-- =============================================================================
-- 7. DEPOSITS
-- =============================================================================
create type deposit_state as enum (
  'pending', 'succeeded', 'refunded', 'failed', 'disputed'
);

create table if not exists deposits (
  id                        uuid primary key default gen_random_uuid(),
  deal_id                   uuid not null references deals(id) on delete restrict,
  user_id                   uuid not null references auth.users(id),
  stripe_payment_intent_id  text unique not null,
  stripe_customer_id        text,
  amount_cents              bigint not null,
  currency                  text not null default 'cad',
  state                     deposit_state not null default 'pending',
  paid_at                   timestamptz,
  refunded_at               timestamptz,
  refund_reason             text,
  created_at                timestamptz not null default now()
);

-- =============================================================================
-- 8. DELIVERIES
-- =============================================================================
create type delivery_state as enum (
  'scheduled', 'prepping', 'ready', 'in_transit',
  'delivered', 'post_delivery_followup'
);

create table if not exists deliveries (
  id                  uuid primary key default gen_random_uuid(),
  deal_id             uuid not null references deals(id) on delete cascade,
  user_id             uuid not null references auth.users(id),
  state               delivery_state not null default 'scheduled',
  scheduled_for       timestamptz,
  delivered_at        timestamptz,
  method              text check (method in ('pickup','home_delivery','cross_border','transporter')),
  origin_address      text,
  destination_address text,
  tracking_milestones jsonb default '[]',
  driver_name         text,
  driver_phone        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- =============================================================================
-- 9. VEHICLE DOSSIER + DOCUMENTS + AVILOO SOH HISTORY
-- =============================================================================
create table if not exists vehicle_dossiers (
  id                        uuid primary key default gen_random_uuid(),
  vin                       text unique not null,
  current_owner_customer_id uuid references customers(id) on delete set null,
  current_owner_user_id     uuid references auth.users(id),
  year                      int,
  make                      text,
  model                     text,
  trim                      text,
  build_data                jsonb,
  original_sale_deal_id     uuid references deals(id),
  original_sale_date        date,
  current_aviloo_soh_pct    numeric(4,1),
  current_aviloo_tested_at  timestamptz,
  next_aviloo_due_at        timestamptz,
  warranty_expires_at       date,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists dossiers_owner_user_idx on vehicle_dossiers (current_owner_user_id);

create type dossier_doc_kind as enum (
  'aviloo_soh', 'carfax', 'safety_cert', 'bill_of_sale',
  'omvic_disclosure', 'lien_search', 'window_sticker',
  'delivery_photos', 'service_record', 'warranty_doc',
  'finance_contract', 'trade_in_record', 'other'
);

create table if not exists dossier_documents (
  id                        uuid primary key default gen_random_uuid(),
  dossier_id                uuid not null references vehicle_dossiers(id) on delete cascade,
  kind                      dossier_doc_kind not null,
  storage_path              text not null,
  title                     text not null,
  issued_at                 timestamptz not null,
  metadata                  jsonb default '{}',
  uploaded_by               uuid references auth.users(id),
  uploaded_at               timestamptz not null default now(),
  customer_acknowledged_at  timestamptz
);

create index if not exists dossier_docs_dossier_idx
  on dossier_documents (dossier_id, kind, issued_at desc);

create table if not exists aviloo_soh_history (
  id                 uuid primary key default gen_random_uuid(),
  dossier_id         uuid not null references vehicle_dossiers(id) on delete cascade,
  tested_at          timestamptz not null,
  soh_pct            numeric(4,1) not null,
  capacity_kwh       numeric(5,2),
  report_document_id uuid references dossier_documents(id),
  tested_by          text default 'Planet Motors',
  created_at         timestamptz not null default now()
);

create index if not exists aviloo_history_dossier_idx
  on aviloo_soh_history (dossier_id, tested_at desc);

-- =============================================================================
-- 10. SAVED VEHICLES + PRICE-DROP / SOLD TRIGGERS
-- =============================================================================
create table if not exists saved_vehicles (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references customers(id) on delete cascade,
  user_id               uuid not null references auth.users(id),
  vehicle_id            uuid not null,  -- references vehicles(id) when table exists
  notes                 text,
  notify_on_price_drop  boolean not null default true,
  notify_on_similar     boolean not null default false,
  last_known_price_cents bigint,
  created_at            timestamptz not null default now(),
  unique (customer_id, vehicle_id)
);

-- =============================================================================
-- 11. NOTIFICATIONS DOMAIN
-- =============================================================================
create type notification_channel as enum ('email', 'sms', 'push', 'in_app');
create type notification_state as enum (
  'queued', 'sending', 'sent', 'delivered', 'failed', 'suppressed'
);

create table if not exists notification_preferences (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  deal_updates      jsonb not null default '{"email":true,"sms":true,"push":true}',
  finance_updates   jsonb not null default '{"email":true,"sms":true,"push":true}',
  delivery_updates  jsonb not null default '{"email":true,"sms":true,"push":true}',
  saved_vehicle     jsonb not null default '{"email":true,"sms":false,"push":true}',
  marketing         jsonb not null default '{"email":false,"sms":false,"push":false}',
  aviloo_recheck    jsonb not null default '{"email":true,"sms":true,"push":false}',
  quiet_hours_start time default '21:00',
  quiet_hours_end   time default '08:00',
  updated_at        timestamptz not null default now()
);

create table if not exists notifications_queue (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id),
  deal_id        uuid references deals(id),
  template       text not null,
  payload        jsonb not null default '{}',
  channels       notification_channel[] not null,
  state          notification_state not null default 'queued',
  scheduled_for  timestamptz not null default now(),
  attempts       int not null default 0,
  last_error     text,
  created_at     timestamptz not null default now()
);

create index if not exists notif_queue_state_idx
  on notifications_queue (state, scheduled_for)
  where state in ('queued','sending');

create table if not exists notification_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  queue_id            uuid not null references notifications_queue(id) on delete cascade,
  channel             notification_channel not null,
  provider            text not null,
  provider_message_id text,
  state               notification_state not null default 'sending',
  rendered_subject    text,
  rendered_body       text,
  sent_at             timestamptz,
  delivered_at        timestamptz,
  failed_at           timestamptz,
  failure_reason      text,
  suppression_reason  text
);

create index if not exists notif_deliveries_queue_idx    on notification_deliveries (queue_id);
create index if not exists notif_deliveries_provider_idx on notification_deliveries (provider, provider_message_id);

-- Suppression table (hard bounces, STOP replies, opt-outs)
create table if not exists notification_suppressions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id),
  channel    notification_channel not null,
  address    text not null,  -- email or phone
  reason     text not null,  -- 'hard_bounce', 'spam_complaint', 'sms_stop', 'opt_out'
  created_at timestamptz not null default now(),
  unique (channel, address)
);

-- =============================================================================
-- 12. DISCLOSURE LEDGER (OMVIC-DEFENSIBLE)
-- =============================================================================
create type disclosure_kind as enum (
  'cash_price_all_in',
  'financing_terms',
  'accident_history',
  'aviloo_soh',
  'carfax',
  'lien_status',
  'prior_use',
  'safety_certification',
  'omvic_dealer_statement',
  'trade_in_valuation',
  'warranty_terms',
  'privacy_consent',
  'marketing_consent',
  'e_sign_consent'
);

create table if not exists disclosures (
  id                       uuid primary key default gen_random_uuid(),
  deal_id                  uuid references deals(id) on delete restrict,
  customer_id              uuid not null references customers(id) on delete restrict,
  user_id                  uuid not null references auth.users(id),
  kind                     disclosure_kind not null,
  content_hash             text not null,
  content_snapshot         jsonb not null,
  version                  text not null,
  presented_at             timestamptz not null default now(),
  viewed_at                timestamptz,
  acknowledged_at          timestamptz,
  acknowledgment_ip        inet,
  acknowledgment_user_agent text,
  signed_document_id       uuid references dossier_documents(id),
  created_at               timestamptz not null default now()
);

create index if not exists disclosures_deal_idx
  on disclosures (deal_id, kind, presented_at desc);
create index if not exists disclosures_user_idx
  on disclosures (user_id, kind);

-- Disclosures are append-only — immutable once written
create or replace rule disclosures_no_update
  as on update to disclosures do instead nothing;
create or replace rule disclosures_no_delete
  as on delete to disclosures do instead nothing;

-- =============================================================================
-- 13. AUDIT LOG
-- =============================================================================
create type audit_action as enum (
  'read', 'create', 'update', 'delete', 'impersonate_start', 'impersonate_end',
  'export', 'login', 'logout', 'role_change'
);

create table if not exists audit_log (
  id                   uuid primary key default gen_random_uuid(),
  actor_user_id        uuid references auth.users(id),
  actor_role           staff_role,
  impersonated_user_id uuid references auth.users(id),
  action               audit_action not null,
  resource_type        text not null,
  resource_id          uuid,
  before_snapshot      jsonb,
  after_snapshot       jsonb,
  ip                   inet,
  user_agent           text,
  request_id           text,
  occurred_at          timestamptz not null default now()
);

create index if not exists audit_log_actor_idx    on audit_log (actor_user_id, occurred_at desc);
create index if not exists audit_log_resource_idx on audit_log (resource_type, resource_id);
create index if not exists audit_log_impersonate_idx on audit_log (impersonated_user_id, occurred_at desc);

-- Audit log is append-only
create or replace rule audit_log_no_update
  as on update to audit_log do instead nothing;
create or replace rule audit_log_no_delete
  as on delete to audit_log do instead nothing;

-- log_audit() RPC — service role only, called from middleware/Edge Functions
create or replace function log_audit(
  p_actor_user_id        uuid,
  p_actor_role           staff_role,
  p_action               audit_action,
  p_resource_type        text,
  p_resource_id          uuid default null,
  p_before_snapshot      jsonb default null,
  p_after_snapshot       jsonb default null,
  p_ip                   inet default null,
  p_user_agent           text default null,
  p_request_id           text default null,
  p_impersonated_user_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into audit_log (
    actor_user_id, actor_role, impersonated_user_id, action,
    resource_type, resource_id, before_snapshot, after_snapshot,
    ip, user_agent, request_id
  ) values (
    p_actor_user_id, p_actor_role, p_impersonated_user_id, p_action,
    p_resource_type, p_resource_id, p_before_snapshot, p_after_snapshot,
    p_ip, p_user_agent, p_request_id
  ) returning id into v_id;
  return v_id;
end;
$$;

-- =============================================================================
-- 14. TYPESENSE OUTBOX
-- =============================================================================
create table if not exists search_outbox (
  id           uuid primary key default gen_random_uuid(),
  entity_type  text not null,
  entity_id    uuid not null,
  operation    text not null check (operation in ('upsert','delete')),
  payload      jsonb,
  enqueued_at  timestamptz not null default now(),
  processed_at timestamptz,
  attempts     int not null default 0,
  last_error   text
);

create index if not exists search_outbox_pending_idx
  on search_outbox (processed_at, enqueued_at)
  where processed_at is null;

-- =============================================================================
-- 15. ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
alter table customers                enable row level security;
alter table staff_members            enable row level security;
alter table deals                    enable row level security;
alter table deal_events              enable row level security;
alter table trade_ins                enable row level security;
alter table trade_in_photos          enable row level security;
alter table finance_applications     enable row level security;
alter table deposits                 enable row level security;
alter table deliveries               enable row level security;
alter table vehicle_dossiers         enable row level security;
alter table dossier_documents        enable row level security;
alter table aviloo_soh_history       enable row level security;
alter table saved_vehicles           enable row level security;
alter table notification_preferences enable row level security;
alter table notifications_queue      enable row level security;
alter table notification_deliveries  enable row level security;
alter table notification_suppressions enable row level security;
alter table disclosures              enable row level security;
alter table audit_log                enable row level security;
alter table search_outbox            enable row level security;

-- ── Customers ────────────────────────────────────────────────────────────────
create policy customers_select on customers for select
  using (user_id = auth.uid() or is_staff());

create policy customers_self_insert on customers for insert
  with check (user_id = auth.uid());

create policy customers_self_update on customers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy customers_staff_update on customers for update
  using (is_staff()) with check (is_staff());

-- ── Staff members: staff can read all, no client writes ──────────────────────
create policy staff_members_select on staff_members for select
  using (is_staff() or user_id = auth.uid());

-- ── Deals: customer reads own, staff writes all, no deletes ─────────────────
create policy deals_select on deals for select
  using (user_id = auth.uid() or is_staff());

create policy deals_staff_insert on deals for insert
  with check (is_staff());

create policy deals_staff_update on deals for update
  using (is_staff()) with check (is_staff());

-- ── Deal events: readable by owner or staff; service role only for writes ────
create policy deal_events_select on deal_events for select
  using (
    is_staff() or
    exists (select 1 from deals d where d.id = deal_id and d.user_id = auth.uid())
  );

-- ── Trade-ins ────────────────────────────────────────────────────────────────
create policy trade_ins_select on trade_ins for select
  using (user_id = auth.uid() or is_staff());

create policy trade_ins_customer_insert on trade_ins for insert
  with check (user_id = auth.uid());

create policy trade_ins_customer_update on trade_ins for update
  using (user_id = auth.uid() and state = 'draft')
  with check (user_id = auth.uid());

create policy trade_ins_staff_all on trade_ins for all
  using (is_staff()) with check (is_staff());

create policy trade_in_photos_select on trade_in_photos for select
  using (
    is_staff() or
    exists (select 1 from trade_ins t where t.id = trade_in_id and t.user_id = auth.uid())
  );

create policy trade_in_photos_customer_insert on trade_in_photos for insert
  with check (
    exists (select 1 from trade_ins t where t.id = trade_in_id and t.user_id = auth.uid())
  );

-- ── Finance: customer reads own, staff writes ────────────────────────────────
create policy finance_select on finance_applications for select
  using (user_id = auth.uid() or is_staff());

create policy finance_staff_all on finance_applications for all
  using (is_staff()) with check (is_staff());

-- ── Deposits: customer reads own, service role writes ────────────────────────
create policy deposits_select on deposits for select
  using (user_id = auth.uid() or is_staff());

-- ── Deliveries: customer reads own, staff writes ─────────────────────────────
create policy deliveries_select on deliveries for select
  using (user_id = auth.uid() or is_staff());

create policy deliveries_staff_all on deliveries for all
  using (is_staff()) with check (is_staff());

-- ── Vehicle Dossier: VIN-scoped, current owner reads ────────────────────────
create policy dossier_select on vehicle_dossiers for select
  using (current_owner_user_id = auth.uid() or is_staff());

create policy dossier_docs_select on dossier_documents for select
  using (
    is_staff() or
    exists (
      select 1 from vehicle_dossiers vd
      where vd.id = dossier_id and vd.current_owner_user_id = auth.uid()
    )
  );

create policy aviloo_history_select on aviloo_soh_history for select
  using (
    is_staff() or
    exists (
      select 1 from vehicle_dossiers vd
      where vd.id = dossier_id and vd.current_owner_user_id = auth.uid()
    )
  );

-- ── Saved vehicles ───────────────────────────────────────────────────────────
create policy saved_select on saved_vehicles for select
  using (user_id = auth.uid() or is_staff());

create policy saved_insert on saved_vehicles for insert
  with check (user_id = auth.uid());

create policy saved_delete on saved_vehicles for delete
  using (user_id = auth.uid());

-- ── Notifications ────────────────────────────────────────────────────────────
create policy notif_prefs_self on notification_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notif_queue_self on notifications_queue for select
  using (user_id = auth.uid() or is_staff());

create policy notif_deliveries_staff on notification_deliveries for select
  using (is_staff());

-- ── Disclosures: customer reads own, service role writes ─────────────────────
create policy disclosures_select on disclosures for select
  using (user_id = auth.uid() or is_staff());

-- ── Audit log: owner/admin staff read only, service role writes ──────────────
create policy audit_staff_read on audit_log for select
  using (is_staff() and current_staff_role() in ('owner', 'admin'));

-- ── Search outbox: service role only ─────────────────────────────────────────
-- (no client policies — service role bypasses RLS)

-- =============================================================================
-- DONE
-- =============================================================================
comment on table customers is 'One row per authenticated user. Auto-created by handle_new_auth_user() trigger.';
comment on table deals is 'Central aggregate for every customer transaction. Append-only events in deal_events.';
comment on table deal_events is 'Append-only event log. Idempotent via (source, idempotency_key). Ordered by source_occurred_at.';
comment on table vehicle_dossiers is 'Permanent VIN-anchored document vault. Survives the sale. The Clutch/Carvana moat.';
comment on table disclosures is 'OMVIC-defensible disclosure ledger. Append-only. content_hash proves exact content shown.';
comment on table audit_log is 'Immutable audit trail. Append-only. Retention: forever for finance, 7yr for others.';
