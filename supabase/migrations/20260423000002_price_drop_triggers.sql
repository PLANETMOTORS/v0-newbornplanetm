-- =============================================================================
-- Planet Motors — Week 5: Price-Drop Trigger + Aviloo Recheck Reminder
-- 2026-04-23
-- =============================================================================

-- Price-drop trigger on vehicles table
-- Fires when price_cents drops or status changes to 'sold'
-- Inserts into notifications_queue for all users who saved the vehicle

create or replace function on_vehicle_price_change()
returns trigger language plpgsql security definer as $$
begin
  -- Price drop: notify all users who saved this vehicle with notify_on_price_drop=true
  if new.price_cents < old.price_cents then
    insert into notifications_queue (
      user_id, template, payload, channels
    )
    select
      sv.user_id,
      'saved_vehicle.price_drop',
      jsonb_build_object(
        'vehicle_id', new.id,
        'vin', new.vin,
        'title', coalesce(new.title, new.year::text || ' ' || new.make || ' ' || new.model),
        'old_price_cents', old.price_cents,
        'new_price_cents', new.price_cents,
        'drop_cents', old.price_cents - new.price_cents
      ),
      array['email','push']::notification_channel[]
    from saved_vehicles sv
    where sv.vehicle_id = new.id
      and sv.notify_on_price_drop = true;

    -- Update last_known_price_cents for all savers
    update saved_vehicles
    set last_known_price_cents = new.price_cents
    where vehicle_id = new.id;
  end if;

  -- Sold: notify everyone who saved it
  if new.status = 'sold' and old.status != 'sold' then
    insert into notifications_queue (user_id, template, payload, channels)
    select
      sv.user_id,
      'saved_vehicle.sold',
      jsonb_build_object(
        'vehicle_id', new.id,
        'title', coalesce(new.title, new.year::text || ' ' || new.make || ' ' || new.model)
      ),
      array['email']::notification_channel[]
    from saved_vehicles sv
    where sv.vehicle_id = new.id;
  end if;

  return new;
end;
$$;

-- Attach trigger to vehicles table (safe: only fires if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'vehicles' and table_schema = 'public') then
    drop trigger if exists vehicles_price_change_trg on vehicles;
    create trigger vehicles_price_change_trg
      after update of price_cents, status on vehicles
      for each row execute function on_vehicle_price_change();
  end if;
end;
$$;

-- Aviloo recheck reminder: nightly cron finds dossiers with next_aviloo_due_at < now+30d
create or replace function enqueue_aviloo_recheck_reminders()
returns void language plpgsql security definer as $$
begin
  insert into notifications_queue (user_id, template, payload, channels)
  select
    vd.current_owner_user_id,
    'aviloo.recheck_due',
    jsonb_build_object(
      'vin', vd.vin,
      'make', vd.make,
      'model', vd.model,
      'year', vd.year,
      'current_soh_pct', vd.current_aviloo_soh_pct,
      'due_at', vd.next_aviloo_due_at
    ),
    array['email','sms']::notification_channel[]
  from vehicle_dossiers vd
  where vd.current_owner_user_id is not null
    and vd.next_aviloo_due_at is not null
    and vd.next_aviloo_due_at <= now() + interval '30 days'
    -- Don't re-notify if already queued in last 7 days
    and not exists (
      select 1 from notifications_queue nq
      where nq.user_id = vd.current_owner_user_id
        and nq.template = 'aviloo.recheck_due'
        and nq.created_at > now() - interval '7 days'
    );
end;
$$;

-- Typesense outbox trigger for vehicles (Week 6)
create or replace function enqueue_vehicle_search_sync()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    insert into search_outbox(entity_type, entity_id, operation)
    values ('vehicle', old.id, 'delete');
    return old;
  end if;
  insert into search_outbox(entity_type, entity_id, operation, payload)
  values ('vehicle', new.id, 'upsert', to_jsonb(new))
  on conflict do nothing;
  return new;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'vehicles' and table_schema = 'public') then
    drop trigger if exists vehicles_search_sync_trg on vehicles;
    create trigger vehicles_search_sync_trg
      after insert or update or delete on vehicles
      for each row execute function enqueue_vehicle_search_sync();
  end if;
end;
$$;
