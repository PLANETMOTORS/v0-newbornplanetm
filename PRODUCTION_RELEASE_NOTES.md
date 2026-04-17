# Production Release Notes — 360° Vehicle Viewer

**Release Date:** April 2026
**Status:** Ready for Production Deployment

---

## Executive Summary

Planet Motors' Vehicle Detail Page (VDP) now features a **native 360° vehicle viewer** replacing the third-party Drivee iframe. All 378 walk-around frames across 11 vehicles have been migrated to Supabase Storage, processed through AI background removal, and rendered with a Carvana-style showroom floor. This eliminates a third-party dependency, reduces frame payload by 55%, and delivers a premium visual experience.

---

## Architectural Shift

### Before (Drivee Iframe)
- Third-party `<iframe>` embedding Drivee's hosted spin viewer
- Frames stored in Drivee's Firebase Storage (`public-iframe` bucket)
- No control over loading performance, styling, or UX
- Monthly subscription cost
- CSP and cookie complications from cross-origin iframe

### After (Native Carvana-Style Viewer)
- **Custom image-sequence spinner** built with React + drag/touch handlers
- Frames hosted in **Supabase Storage** (`vehicle-360` bucket, public)
- AI background removal via `rembg` — transparent WebP frames
- CSS-only **Carvana showroom floor** (linear gradient + horizon line + reflection sheen)
- **Planet Motors logo** watermark (bottom-right, 40% opacity)
- **Interior panorama** toggle for Insta360 equirectangular photos (Pannellum)
- Full control over preloading, caching, and rendering

### Key Components
| Component | Path |
|---|---|
| Spin Viewer | `components/vehicle-spin-viewer.tsx` |
| Interior Viewer | `components/vehicle-interior-viewer.tsx` |
| Frame URL Builder | `lib/drivee-frames.ts` |
| API Route | `app/api/v1/360-frames/[mid]/route.ts` |
| VDP Integration | `app/vehicles/[id]/page.tsx` (line ~795+) |
| Migration Script | `scripts/migrate-360-to-supabase.ts` |

---

## Data Migration

### Supabase Storage
- **Bucket:** `vehicle-360` (public, no auth required for reads)
- **Frame path:** `{MID}/nobg/{NN}.webp` (background-removed transparent WebP)
- **Original frames preserved:** `{MID}/{NN}.webp` (rollback path)
- **Interior panorama:** `{MID}/interior.jpg` (Jeep Wrangler 4xe only)

### Vehicle Inventory (11 Vehicles, 378 Frames)
| Vehicle | MID | Frames |
|---|---|---|
| 2021 Jeep Wrangler 4xe | 190171976531 | 37 |
| 2025 Chevrolet Equinox EV | 744761075195 | 33 |
| 2021 Tesla Model 3 | 132601940353 | 40 |
| 2023 Volkswagen Taos | 806787519944 | 36 |
| 2024 Tesla Model 3 | 890747363179 | 40 |
| 2019 Tesla Model 3 | 640326639530 | 39 |
| 2022 Tesla Model 3 | 061789806057 | 7 |
| 2018 Volkswagen Tiguan | 396425623701 | 39 |
| 2025 Hyundai Kona Electric | 625294835450 | 38 |
| 2018 Audi Q3 | 085109772520 | 37 |
| 2021 Tesla Model 3 (2nd) | 860125156862 | 32 |

### Static Frame Manifest
Frame counts are stored in a static manifest (`FRAME_MANIFEST` in `lib/drivee-frames.ts`), eliminating the need for runtime HEAD probes. The API route responds instantly with pre-known frame URLs.

---

## Performance Wins

| Metric | Before | After | Improvement |
|---|---|---|---|
| Average frame size | ~130 KB | ~55 KB | **55% reduction** |
| Total payload (378 frames) | ~49 MB | ~21 MB | **28 MB saved** |
| First frame load | Iframe bootstrap + frame | Direct image load | **Instant** |
| Frame discovery | 50 parallel HEAD probes | Static manifest lookup | **Zero network** |
| Third-party dependency | Drivee iframe + Firebase | None (self-hosted) | **Eliminated** |
| Monthly cost | Drivee subscription | Supabase free tier | **$0/month** |

---

## Visual Design (Carvana-Style Showroom)

### Background
- **Top (wall):** Clean white (`#ffffff`) fading to light gray (`#f0f0f0`)
- **Bottom (floor):** Subtle gray gradient (`#e8e8e8` → `#e0e0e0`)
- **Horizon line:** At 55% height, semi-transparent edge
- **Floor reflection:** Subtle white sheen below horizon for depth
- **Contact shadow:** Dual-layer radial shadow beneath vehicle

### Branding
- Planet Motors logo in bottom-right corner at 40% opacity
- Non-intrusive, does not interfere with spin interaction

### Controls
- Drag/touch to spin (mouse + touch + trackpad)
- Auto-spin toggle
- Frame counter indicator
- Fullscreen mode
- Exterior/Interior toggle (for vehicles with Insta360 data)

---

## Supabase Integration — Production Checklist

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://ldervbcvkoawwknsemuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### CSP Configuration (already in `next.config.mjs`)
- `img-src`: includes `https://ldervbcvkoawwknsemuz.supabase.co`
- `connect-src`: includes `https://*.supabase.co` and `wss://*.supabase.co`

### Next.js Image Optimization (already configured)
```js
remotePatterns: [
  { protocol: 'https', hostname: 'ldervbcvkoawwknsemuz.supabase.co' }
]
```

### Edge Caching
- API route returns `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
- Frames cached at CDN edge for 1 hour, stale content served for up to 1 day during revalidation

### Security
- No service role keys in client-facing code
- MID validation prevents probing arbitrary storage paths
- `frameUrl()` uses `NEXT_PUBLIC_SUPABASE_URL` env var (public URL, safe for client)
- Bucket is public read-only — no write access without service role key

---

## Rollback Procedure

If the background-removed frames have visual issues in production:

1. In `lib/drivee-frames.ts`, change `frameUrl()` to remove the `/nobg/` segment:
   ```typescript
   // Current (background-removed):
   return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${mid}/nobg/${padded}.webp`
   
   // Rollback (original Drivee frames):
   return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${mid}/${padded}.webp`
   ```
2. Deploy. No database migration or data change needed — original frames are preserved.

---

## Related Pull Requests

| PR | Description |
|---|---|
| [#289](https://github.com/PLANETMOTORS/v0-newbornplanetm/pull/289) | Native 360° spinner — replace Drivee iframe |
| [#291](https://github.com/PLANETMOTORS/v0-newbornplanetm/pull/291) | Migrate frames to Supabase + interior panorama + studio polish |
| [#296](https://github.com/PLANETMOTORS/v0-newbornplanetm/pull/296) | AI background removal + Carvana showroom floor + Planet Motors logo |

---

## Post-Launch Recommendations

1. **Cancel Drivee subscription** — all frames are now self-hosted in Supabase. Verify production stability for 1 week before cancelling.
2. **New vehicle onboarding** — when new 360° photos are taken, run the migration script (`scripts/migrate-360-to-supabase.ts`) and update `FRAME_MANIFEST` in `lib/drivee-frames.ts`.
3. **Background removal for new vehicles** — the `rembg` processing can be added as a CI step or run manually via the Python script used in PR #296.
4. **Interior panoramas** — expand Insta360 interior coverage to more vehicles beyond the Jeep Wrangler.
5. **Future enhancements** — 360° badge on hover (like Carvana), hotspot annotations (like Clutch), zoom-on-click for detail inspection.
