# VDP Technical Specs

## 1) Objective
Define the minimum technical contract to ship a stable Vehicle Detail Page (VDP) with 360 support, while allowing timeline flexibility for non-critical vendor upgrades.

This spec is implementation-ready for this codebase and aligns with current API fields in:
- app/api/v1/vehicles/[id]/route.ts
- app/api/v1/vehicles/route.ts
- components/vehicle-360-viewer.tsx

## 2) Scope
In scope:
- VDP data contract and rendering behavior
- 360 viewer activation rules
- Vendor integration contract for DriveeAI media payloads
- Performance, reliability, and fallback requirements
- Security constraints for media delivery

Out of scope (post-launch optional):
- AVIF multi-pipeline generation
- Global CDN p95 SLA guarantees
- Enterprise observability dashboards beyond baseline logs/alerts

## 3) Required Runtime Config
Required environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

VDP/360 media configuration (required for production 360):
- NEXT_PUBLIC_IMGIX_BASE_URL
- NEXT_PUBLIC_IMGIX_QUALITY_DEFAULT (recommended: 72)
- NEXT_PUBLIC_IMGIX_QUALITY_360 (recommended: 78)

DriveeAI integration configuration (required when DriveeAI feed is active):
- DRIVEAI_DEALER_ID
- DRIVEAI_API_KEY
- DRIVEAI_API_URL

## 4) VDP Data Contract (Current + Required)
### 4.1 Current vehicle detail fields (already returned)
Current endpoint:
- GET /api/v1/vehicles/:id

Current 360-relevant fields in response data.vehicle:
- id
- stock_number
- image_urls
- primary_image_url
- has_360_spin
- video_url
- status
- updated_at

### 4.2 Required additions for reliable 360 rendering
Add these fields to data.vehicle for deterministic rendering and fallback:
- media_provider: string (e.g. driveai, homenet, manual)
- spin_frame_count: number
- spin_frame_template: string
- spin_preview_url: string
- spin_last_synced_at: ISO timestamp
- spin_manifest_version: string

Notes:
- spin_frame_template must support {frame} placeholder with zero-padded index.
- If vendor cannot provide strict template pathing, backend must map vendor payload to a stable internal template contract.

## 5) VDP 360 Rendering Rules
### 5.1 Display gating
Show the 360 viewer only when all conditions are true:
- has_360_spin is true
- stock_number exists
- spin_frame_count >= 24
- spin_frame_template exists OR manifest resolves successfully

Else:
- Do not render broken viewer.
- Render static image gallery with existing image_urls/primary_image_url.

### 5.2 Loading behavior
- Use click-to-activate behavior for 360 (already used in components/vehicle-360-viewer.tsx).
- Use IntersectionObserver lazy visibility.
- On activation, preload only:
  - first frame
  - previous frame
  - next frame
- Continue neighbor prefetch while user interacts.

### 5.3 Fallback behavior
If frame load fails:
- Retry up to 2 times per frame.
- On repeated failure, keep control responsive and skip to next frame.
- If >15% frame failures in a session, auto-fallback to static gallery and show non-blocking notice.

## 6) Vendor Contract (DriveeAI)
Minimum launch contract from DriveeAI must include:
- vehicle identifier mapping key (VIN or stock_number)
- frame_count
- preview_url
- ordered frame URLs or equivalent manifest payload
- quality variants (thumbnail + standard at minimum)
- signed URL behavior for private assets

Preferred (Phase 2):
- versioned manifest endpoint
- checksum per frame or manifest hash
- CDN-backed global cache headers

## 7) Performance Targets
Launch targets:
- First interactive 360 frame after click: <= 1.2s on median mobile
- Frame switch latency during drag: <= 120ms median
- 360 activation success rate: >= 99%
- Static fallback always available if 360 unavailable

Post-launch targets:
- Global p95 frame latency with CDN: <= 250ms
- 360 session failure rate: < 0.5%

## 8) Security and Compliance Requirements
- HTTPS-only media delivery.
- No secret keys in client code.
- Signed URLs for non-public media.
- Do not log raw customer PII in VDP telemetry.
- Use server-side mapping from vendor payloads to internal contract to avoid trust leakage into client rendering.

## 9) API and Caching Requirements
- Vehicle detail endpoint cache header remains public with SWR.
- 360 manifest endpoint (if added):
  - Cache-Control: public, s-maxage=300, stale-while-revalidate=3600
  - Must include manifest version for cache invalidation.

## 10) Implementation Plan
### Phase 1 (must-have for project completion)
1. Extend vehicle detail API with 360 contract fields.
2. Add backend mapper to normalize DriveeAI payload into internal contract.
3. Update VDP to consume contract with strict gating + fallback.
4. Add integration tests for:
   - has_360_spin true with valid frames
   - has_360_spin true with missing frames (fallback)
   - has_360_spin false (gallery only)

### Phase 2 (timeline-flex)
1. CDN edge optimization and advanced caching.
2. Optional multi-format pipeline (AVIF/WebP/JPEG).
3. Enhanced daily monitoring and incident reporting.

## 11) Definition of Done
VDP is considered complete when:
1. VDP renders stable static media for 100% of vehicles.
2. 360 viewer activates only for valid 360-enabled vehicles.
3. 360 failures do not break checkout/reservation paths.
4. API contract documented and versioned.
5. Build and lint pass.
6. Launch runbook includes DriveeAI outage fallback.

## 12) Open Decisions Needed (Business/Owner)
- Is DriveeAI mandatory for launch or post-launch optional?
- Which regions define launch performance baseline?
- Is signed URL private mode required at launch?
- Who owns vendor incident escalation during launch week?
