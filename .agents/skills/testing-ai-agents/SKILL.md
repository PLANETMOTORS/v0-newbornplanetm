# Testing Planet Motors — AI Agents & E2E Suite

## Overview
Planet Motors has 3 AI agents that need security testing:
- **Anna** (`/api/anna`) — Chat assistant (already had rate limiting + CSRF)
- **Price Negotiator** (`/api/negotiate`) — GPT-4o-mini price negotiation
- **Vehicle Valuator** (`/api/vehicle-valuation`) — GPT-4o-mini trade-in appraisal

Security layers: CSRF origin validation (`lib/csrf.ts`), IP-based rate limiting (`lib/redis.ts`), server-side verification codes (`/api/verify/send-code` + `/api/verify/check-code`).

## E2E Test Suite (human-click-timing-debug.spec.ts)

### Overview
The main E2E spec has 40 tests across 3 sections:
- **Section A** — Human Click Simulation (15 tests)
- **Section B** — Tab & Keyboard Navigation (13 tests)
- **Section C** — Page Load Timing (12 tests)

### CRITICAL: BASE_URL Configuration
The spec defaults to `BASE_URL=https://ev.planetmotors.ca` (live production). However, `data-testid` attributes were added in PR #226 and may not exist on the live site yet. **Always run against the branch that has the data-testid attributes:**

```bash
# Run against local dev server (recommended)
BASE_URL=http://localhost:3000 npx playwright test e2e/human-click-timing-debug.spec.ts --reporter=list

# Run against Vercel preview (if accessible)
BASE_URL=https://your-preview-url.vercel.app npx playwright test e2e/human-click-timing-debug.spec.ts --reporter=list
```

If you run against the live site without the data-testid attributes, you will get 34+ timeout failures — this is NOT a code bug, it's a targeting issue.

### Playwright Config WebServer
The `playwright.config.ts` starts a dev server on `localhost:3000` via `webServer`. If a dev server is already running on port 3000, playwright reuses it (`reuseExistingServer: !process.env.CI`). Start the dev server before running tests:

```bash
pnpm dev &  # Start dev server in background
# Wait for it to be ready, then run tests
BASE_URL=http://localhost:3000 npx playwright test e2e/human-click-timing-debug.spec.ts
```

### Known Credential-Dependent Failures
4 tests require real Supabase inventory data and will fail without credentials:

| Test | Reason |
|------|--------|
| A03 — inventory card click → VDP | No `inventory-card` elements without Supabase data |
| A04 — VDP "Start Purchase" | Depends on A03 |
| A13 — right-click vehicle image | No `vdp-hero-image` without vehicle data |
| B12 — VDP gallery arrow keys | No `vdp-image-gallery` without vehicle data |

With placeholder `.env.local` values, expect **36/40 passed**. With real Supabase credentials, expect **40/40**.

### Key Test Assertions
- **A15** (`line 333`): `expect(clickLog.length).toBe(4)` — there are exactly 4 `logClick()` calls in the checkout walkthrough
- **C09** (`line 648`): `test.skip(!fs.existsSync(DL_FRONT))` — requires `e2e/fixtures/dl-front.jpg` to exist (valid JFIF JPEG)

### CI E2E Job
The CI e2e job runs ALL spec files (not just human-click-timing-debug.spec.ts). Other specs (contact, homepage, inventory, vehicle-detail, etc.) run against `localhost:3000` and need real Supabase/Typesense data to pass. Without credentials in CI secrets, these specs will fail. This is a pre-existing issue and not caused by PR changes.

The CI workflow (`.github/workflows/ci.yml`) must include a `pnpm build` step before e2e tests, since `pnpm test:e2e` starts a production server that needs `.next/` build output.

## Local Production Build for CSRF Testing

CSRF validation is **bypassed in development mode** (`NODE_ENV=development`). To test CSRF:

1. Create minimal `.env.local`:
   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:3001
   NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder
   NEXT_PUBLIC_SANITY_PROJECT_ID=placeholder
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
   ```
2. Build: `pnpm build`
3. Start on a free port: `NODE_ENV=production npx next start -p 3001`
4. CSRF allowlist in production includes: `NEXT_PUBLIC_BASE_URL` + `localhost:3000` + `localhost:3001` + `127.0.0.1:3000` + `127.0.0.1:3001`

**Important:** Port 3000 may be auto-occupied by other processes. Use port 3001 and include `http://localhost:3001` as the Origin header.

## CSRF Test Commands

```bash
# Should return 403 "Forbidden: invalid origin"
curl -s -X POST http://localhost:3001/api/negotiate \
  -H "Content-Type: application/json" \
  -d '{"vehiclePrice":30000,"customerOffer":28000}' \
  -w "\nHTTP_STATUS: %{http_code}"

# Should return 403
curl -s -X POST http://localhost:3001/api/negotiate \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil-attacker.com" \
  -d '{"vehiclePrice":30000,"customerOffer":28000}' \
  -w "\nHTTP_STATUS: %{http_code}"

# Should NOT return 403 (passes CSRF, may fail on missing OpenAI key)
curl -s -X POST http://localhost:3001/api/negotiate \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -d '{"vehiclePrice":30000,"customerOffer":28000}' \
  -w "\nHTTP_STATUS: %{http_code}"
```

Repeat for `/api/vehicle-valuation`, `/api/verify/send-code`, `/api/verify/check-code`.

## Rate Limiting

Rate limiting uses Upstash Redis (`lib/redis.ts`). Without Redis env vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`), `rateLimit()` gracefully degrades — returns `{success: true}` and allows all requests. **Rate limiting cannot be tested locally without Redis.** Test in Vercel preview or production.

## Verification Code Testing

Server-side code generation uses `crypto.randomInt(100000, 999999)` and stores in Redis with 10-min TTL. To verify the client no longer supplies codes:

```bash
curl -s -X POST http://localhost:3001/api/verify/send-code \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -d '{"method":"email","destination":"test@test.com","code":"999999"}' \
  -w "\nHTTP_STATUS: %{http_code}"
```

Expected: `{"success":true,"method":"email"}` — the `code` field is ignored.

## UI Testing

- **Trade-In page** (`/trade-in`): Scroll to "Get an AI Instant Quote" section. Verify Year/Make/Model/Trim/Mileage fields and Email/SMS verification buttons render.
- **VDP page** (`/vehicles/[id]`): Requires inventory data from Supabase. If no Supabase, inventory page shows "Error loading inventory" and you cannot navigate to a VDP. The PriceNegotiator component is at the bottom of VDP pages.
- **Anna chat**: Click "Chat with Anna" floating button (bottom-right). Already secured with CSRF + rate limiting.

## Vercel Preview Deployment Protection

Vercel previews may have deployment protection enabled (returns HTTP 401). Options:
1. Use `vercel curl` (requires Vercel CLI authenticated)
2. Use Vercel MCP server's `get_access_to_vercel_url` function
3. Use bypass token (see Vercel docs on protection bypass automation)
4. Test locally in production mode instead (recommended for CSRF testing)
5. Use Netlify preview instead (`https://deploy-preview-{PR_NUMBER}--planetnewborn-v0-newbornplanetm.netlify.app`) — these are accessible without auth but are static exports (no API routes)

## Devin Secrets Needed

- `KV_REST_API_URL` — Upstash Redis URL (for rate limiting tests)
- `KV_REST_API_TOKEN` — Upstash Redis token (for rate limiting tests)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (for inventory/VDP UI tests + 4 E2E tests)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (for inventory/VDP UI tests + 4 E2E tests)
- OpenAI/AI Gateway key — only needed for full end-to-end AI response testing

## Build & Lint Commands

```bash
pnpm build          # Next.js production build
pnpm lint           # ESLint
npx tsc --noEmit    # TypeScript strict check
pnpm test:e2e       # Run ALL E2E specs (needs local server)
```

## Key Files

- `lib/csrf.ts` — CSRF origin validation logic
- `lib/redis.ts` — Rate limiting + verification code storage
- `app/api/negotiate/route.ts` — Price Negotiator endpoint
- `app/api/vehicle-valuation/route.ts` — Vehicle Valuator endpoint
- `app/api/verify/send-code/route.ts` — Server-side verification code generation
- `app/api/verify/check-code/route.ts` — Timing-safe code verification
- `e2e/human-click-timing-debug.spec.ts` — Main 40-test E2E spec
- `e2e/fixtures/dl-front.jpg` — Required fixture for C09 Vercel Blob upload test
- `.github/workflows/ci.yml` — CI pipeline (lint-and-build, bundle-check, e2e)
- `playwright.config.ts` — Playwright configuration (webServer on port 3000)
