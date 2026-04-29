# Post-Launch Fixes & Improvements

Tracker for known gaps deferred until after launch (April 2026 cutover). Each item lists the original PR/discussion, the failure mode, the proposed fix, and an effort estimate so future-you can pick them up cold.

> **Convention:** Items here are real gaps, not aspirations. When you ship a fix, delete the entry (or move it to `docs/CHANGELOG.md`). The file should shrink over time.

---

## P0 — Ship within first 2 weeks of launch

### 1. IndexNow safety guard (truncated CSV protection)

**Severity:** High — one bad CSV could mark thousands of vehicles as sold and IndexNow-ping search engines with `SoldOut` schema. Recovery is lossy.

**Where:** `lib/homenet/parser.ts` → `syncVehiclesToDatabase()`

**Failure mode:**
```
HomeNet uploads a partial/truncated CSV (network blip, encoding issue,
parse failure on most rows). The cron's only guard is `length === 0`.
A CSV with 80 rows when current inventory is 5,000 will mark 4,920
vehicles as SOLD in one run, triggering IndexNow `SoldOut` pings to
Bing/Yandex/etc. SEO equity drops within hours.
```

**Fix:** Inventory floor guard inside `syncVehiclesToDatabase` — abort the bulk soft-delete if `incoming.length < HOMENET_INVENTORY_FLOOR_PCT * currentLiveCount`. Default 50%. Returns `safetyAborted: true` so the cron knows not to ping IndexNow for sold URLs.

**Effort:** ~45 min (code + 100% test coverage).

**Tracked in:** Original IndexNow PR review feedback (April 2026).

---

### 2. IndexNow material-change detection

**Severity:** High — current cron pings ZERO IndexNow signals on update-only runs. Price drops, status changes, photo updates, and mileage corrections all go unannounced. At 5K-vehicle scale that's dozens of missed pings per day = significant SEO drift over 60 days.

**Where:**
- `lib/homenet/parser.ts` → `syncVehiclesToDatabase()` — needs to track `updatedVehicleIds`
- `app/api/cron/homenet-sync/route.ts` → ping logic only includes `inserted` + `sold`

**Failure modes:**
| Cron run | Today | Should be |
|---|---|---|
| Pure repricing (10 cars drop $1K each) | 0 pings | 10 VDP + /inventory |
| Status changes only (5 reserved) | 0 pings | 5 VDP + /inventory |
| New photos uploaded | 0 pings | affected VDPs + /inventory |

Also: **`/inventory` is only pinged when there's already an insert or sold**, so update-only runs skip even the listing page.

**Fix:**
1. Pre-fetch a snapshot of existing rows (`vin, price, status, primary_image_url, mileage`) BEFORE the upsert loop.
2. Compare incoming vs snapshot inside the loop; collect IDs whose tracked fields actually changed (skip pure `updated_at` bumps).
3. Add `updatedVehicleIds` to `SyncVehiclesResult`.
4. Cron pings `inserted ∪ updated ∪ sold(if !safetyAborted)`, plus `/inventory` whenever any of those is non-empty.

**Effort:** ~1.5 hours including 100% test coverage on parser + cron route tests for /inventory ping behaviour.

**Tracked in:** Original IndexNow PR review feedback (April 2026).

---

### 3. Sentry alert for `safetyAborted` cron runs

**Severity:** Medium — without active alerting, a stuck-aborted cron could quietly run for hours before someone notices the inventory isn't updating.

**Where:** `app/api/cron/homenet-sync/route.ts`

**Fix:** When `result.safetyAborted === true`, emit `Sentry.captureMessage('HomenetIOL inventory floor breached', { level: 'error', extra: result.safetyContext })`. Pair with a Sentry alert rule that pages on first occurrence.

**Effort:** ~30 min (depends on item #1 landing first).

---

## P1 — Ship within first month

### 4. Read replica wiring (3 hot read paths)

**Severity:** Medium — replica code exists (`lib/supabase/read-replica.ts`, 100% covered) but no callers use `createReadClient()`. Once `SUPABASE_READ_REPLICA_URL` is configured in Vercel, three routes need a 1-line swap to actually offload read traffic.

**Where:**
- `app/api/v1/vehicles/route.ts`
- `app/api/inventory/route.ts` (if exists; verify)
- `app/api/search/route.ts`

**Fix:** Replace `createClient` from `@/lib/supabase/server` with `createReadClient()` from `@/lib/supabase/read-replica`. The fallback logic auto-routes to primary when env vars are missing, so this is safe to ship before the replica is provisioned.

**Effort:** ~30 min including a smoke test per route.

**Blocked by:** Supabase Pro upgrade + replica provisioning (waiting on billing).

---

### 5. Social pixels (TikTok + Microsoft Clarity + Bing UET)

**Severity:** Medium — every visitor before launch is a permanently un-retargetable cohort. Worth installing before any paid acquisition starts.

**Where:** `components/analytics/` — pattern matches existing `google-tag-manager.tsx` and `google-analytics.tsx`.

**Fix:**
- TikTok Pixel: env var `NEXT_PUBLIC_TIKTOK_PIXEL_ID`, follow GTM pattern
- Microsoft Clarity: env var `NEXT_PUBLIC_CLARITY_PROJECT_ID` (free, instant heatmaps + session replay)
- Bing UET: env var `NEXT_PUBLIC_BING_UET_ID`, similar GTM-style tag

All three respect cookie consent (`use-cookie-consent.ts`) like existing pixels do.

**Effort:** ~1 hour for all three.

**Blocked by:** User needs to provision the IDs in each platform first.

---

### 6. CarFax API embedded reports

**Severity:** Low (current state is functional via deep-link to carfax.ca; just suboptimal UX).

**Where:** `app/vehicles/[id]/vdp-client.tsx` — currently has 4 CARFAX placements (3 working deep-links + 1 hardcoded "no accidents" claim).

**Failure mode (sub-issue):** Line 740 hardcodes "✓ No accidents — Reported by Carfax" for ALL vehicles. If a vehicle DOES have accident history, this is an OMVIC truth-in-advertising risk. Either remove the claim or gate it behind real Carfax data.

**Fix steps:**
1. Once CarFax API access arrives, wire `lib/carfax.ts` client.
2. Replace hardcoded "no accidents" with API-driven content per VIN.
3. Replace deep-links with embedded report (modal + tab on /reports section).
4. Add Carfax summary panel ("1 owner, 0 accidents, 12 service records") for conversion lift.

**Effort:** ~3-4 hours depending on Carfax API surface (REST vs widget vs PDF).

**Blocked by:** Carfax API credentials (waiting on email response).

---

### 7. "Featured / Promoted" admin trigger for IndexNow

**Severity:** Low — when admin manually marks a vehicle as featured/promoted via the admin panel, IndexNow currently doesn't get notified.

**Where:** Admin mutation paths that update `featured`, `is_certified`, or other promo flags.

**Fix:** After the DB write, call `pingIndexNow([vehicleUrl])`. Non-blocking, so no UX cost.

**Effort:** ~30 min once the IndexNow PR is merged.

---

## P2 — Nice to have

### 8. Sitemap chunking

**Severity:** Low — single sitemap is fine up to 50K URLs (Google's hard limit). At 5K vehicles + 50 pages + 50 blog posts we're well under.

**When to revisit:** When inventory crosses ~30K vehicles, or when Google Search Console shows partial-index issues per chunk.

**Fix:** Split `app/sitemap.ts` into a sitemap index + 3 chunks (`/sitemap-pages.xml`, `/sitemap-vehicles.xml`, `/sitemap-blog.xml`).

**Effort:** ~1.5 hours.

---

### 9. Curated filter URL canonical refinement

**Severity:** Low — current `/inventory` layout canonicals all variants to `/inventory` base. This collapses link equity but prevents curated filter pages (e.g., `/inventory?fuelType=Electric`) from ranking separately.

**Where:** `app/inventory/layout.tsx` — currently exports static `metadata`.

**Fix:** Convert to `generateMetadata({ searchParams })` and self-canonicalise for the ~30 curated filter URLs already listed in `lib/sitemap-builders.ts`. All other combinations stay canonicalised to `/inventory` base.

**Effort:** ~1 hour.

---

### 10. Vehicle status soft-delete grace period

**Severity:** Low — after the soft-delete migration, sold vehicles stay in the DB forever. Eventually that's a lot of dead rows.

**Fix:** Cron that hard-deletes vehicles where `status = 'sold' AND sold_at < NOW() - INTERVAL '180 days'`. Before deletion, fire IndexNow with the URL so search engines de-index gracefully.

**Effort:** ~1 hour.

---

## How this file is maintained

- Add an entry IMMEDIATELY when a known gap is deferred during PR review.
- Each entry must include: severity, where, failure mode, fix, effort.
- Move to `docs/CHANGELOG.md` (or delete) when shipped.
- Reference this file from PR descriptions when deferring scope.

Last updated: 2026-04-29
