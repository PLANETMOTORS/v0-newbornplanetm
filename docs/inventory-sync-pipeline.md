# Inventory Sync Pipeline

## Architecture

```
HomenetIOL SFTP (CSV, 2-3x/day)
        ↓
Supabase `vehicles` table (updated every 15 min via cron)
        ↓  AFTER INSERT/UPDATE/DELETE trigger: notify_typesense_sync()
        ↓  net.http_post → pg_net
Supabase Edge Function: typesense-sync (ACTIVE)
        ↓
Typesense `inventory` collection (real-time, <1s latency)
        ↓
Next.js search bar (InstantSearch / getSmartSuggestions)
```

## Supabase DB Trigger

**Trigger:** `typesense_sync_trigger` on `public.vehicles`
**Events:** `INSERT`, `UPDATE`, `DELETE` (AFTER, per-row)
**Function:** `public.notify_typesense_sync()`
**Method:** `net.http_post` via pg_net extension

The trigger fires automatically whenever HomenetIOL SFTP sync updates the `vehicles` table.

## Typesense Collection

- **Collection:** `inventory`
- **Alias:** `vehicles` → `inventory`
- **Documents:** 24 (as of 2026-04-23)
- **Cluster:** `dptb8xe3mkuc45snp.a2.typesense.net` (Growth plan, 3 nodes)
- **Synonyms:** 20 active sets (EV terms, brand typos, Canadian locale, model aliases)

## Manual Full Sync

```bash
curl -X POST \
  https://ldervbcvkoawwknsemuz.supabase.co/functions/v1/typesense-sync \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## Admin System Health

`GET /api/admin/system-health` — returns Sanity webhook status, HomenetIOL SFTP sync status, Typesense status.
`POST /api/admin/system-health` with `{ "action": "purge-cache" }` — triggers `revalidatePath('/', 'layout')`.
