# Testing Planet Motors — AI Agents & E2E Suite

## Overview
Planet Motors has 3 AI agents that need security testing:
- **Anna** (`/api/anna`) — Chat assistant (already had rate limiting + CSRF)
- **Price Negotiator** (`/api/negotiate`) — GPT-4o-mini price negotiation
- **Vehicle Valuator** (`/api/vehicle-valuation`) — GPT-4o-mini trade-in appraisal

Security layers: CSRF origin validation (`lib/csrf.ts`), IP-based rate limiting (`lib/redis.ts`), server-side verification codes (`/api/verify/send-code` + `/api/verify/check-code`).

## Admin Vehicle Management Testing

### Overview
The admin vehicle management page (`/admin/inventory`) provides full CRUD operations, VIN decoding via NHTSA, HomeNet sync, CSV export, and debounced search. Login as `admin@planetmotors.ca` with password stored in Devin secrets.

### Test Login
```bash
# Navigate to localhost:3000/admin/inventory
# Login: admin@planetmotors.ca / TestAdmin2024!
```

### CRUD Test Flow (recommended order)
1. **Page Load**: Verify vehicle count in subtitle, 4 status cards (Available/Reserved/Pending/Sold) sum to total
2. **Create via VIN Decoder**: Click "Add Vehicle" → enter 17-char VIN → click "Decode" → verify NHTSA auto-fills Year/Make/Model → fill Stock#/Price/Mileage → Save → count increments
3. **Edit Status**: Click ⋮ menu on test row → "Edit Vehicle" → change Status dropdown → "Save Changes" → verify badge color changes and status card counts update
4. **Delete**: Click ⋮ → "Delete" → confirm dialog → verify vehicle removed and count decrements
5. **Clean up**: Always delete test vehicles after testing to avoid polluting production data

### VIN Decoder Testing
- Test VIN: `1N4BL4BV4KC123456` → 2019 NISSAN Altima
- The NHTSA API is free and doesn't require keys
- Decode button is disabled unless VIN is exactly 17 characters
- Auto-fills: Year, Make, Model, Trim, Body Style, Drivetrain, Engine, Fuel Type

### Search Debounce Verification
Use Playwright to monitor network requests while typing rapidly:
```javascript
const apiCalls = [];
page.on('request', req => {
  if (req.url().includes('/api/v1/admin/vehicles') && req.method() === 'GET') {
    apiCalls.push({ url: req.url(), time: Date.now() });
  }
});
await searchInput.pressSequentially('Tesla', { delay: 50 });
await page.waitForTimeout(1500); // 300ms debounce + buffer
console.log('API calls:', apiCalls.length); // Should be 1, not 5
```

### HomeNet Sync Testing
- Click "Sync HomeNet" button
- Without SFTP env vars configured, expect: red error banner "Sync failed: Database not configured"
- Page should remain fully interactive (no crash, no blank screen)
- The error banner has a dismiss (×) button
- Status banner shows "HomeNet SFTP: Not configured"

### Price Storage
Prices are stored in **cents** in the database. The form accepts dollars (e.g., enter 25000 for $25,000). The API multiplies by 100 before storing.

### Playwright CDP Tips for Admin Pages
- Connect via: `chromium.connectOverCDP('http://localhost:29229')`
- Dialog overlays block clicks on table rows — always close dialogs (press Escape) before interacting with the table
- The ⋮ menu uses Radix dropdown: `button[aria-expanded]` selector, items are `[role=menuitem]`
- Edit dialog has a `select` for status (index 1, after the page-level filter select at index 0)
- Save button text is "Save Changes" (not "Update Vehicle")
- After creating a vehicle, it appears at the top of the table
- Use `{ force: true }` on click when elements might be partially obscured

### Common Pitfalls
- If a dialog is open from a previous failed test, it blocks all table interactions. Press Escape first.
- The status filter dropdown ("All Status") is the first `<select>` on the page; the edit dialog status is the second `<select>`
- Prices display with comma formatting ($25,000) but are entered as plain numbers (25000)
- Mileage displays with "km" suffix (50,000 km)

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

## Performance Testing

### Netlify Preview Limitations
Netlify preview deploys (`https://deploy-preview-{PR}--planetnewborn-v0-newbornplanetm.netlify.app`) have important limitations:
- **No Typesense/Supabase data** — The `/inventory` page will show "Error loading inventory" because Typesense search credentials may not be configured on the preview. This means vehicle grid rendering, `content-visibility` virtualization, and filter state cannot be visually tested on preview.
- **No API routes** — Server-side functionality (reservations, checkout, webhooks) may not work on static Netlify exports.
- **Shared infrastructure** — Lighthouse scores on Netlify preview will be lower than production due to shared hosting. Expect 10-20% lower scores compared to dedicated infrastructure.

### Font Display Verification
Verify all `@font-face` rules use `font-display: swap` via browser console:
```javascript
const fonts = Array.from(document.fonts).map(f => ({family: f.family, display: f.display}));
console.log(fonts);
// Expect all entries to show display: "swap"
```

### Bundle Splitting Verification
Verify lazy-loaded modules (Stripe, chat, analytics) are NOT loaded eagerly:
```javascript
const resources = performance.getEntriesByType('resource');
const stripeResources = resources.filter(r => r.name.toLowerCase().includes('stripe'));
console.log('Stripe resources:', stripeResources.length); // Should be 0
```

### Mobile Navigation Testing via Playwright CDP
The hamburger menu appears below the `lg` breakpoint (1024px). To test mobile nav on a preview deploy, use Playwright via CDP since browser window resize may not work reliably:
```javascript
import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://localhost:29229');
const context = browser.contexts()[0];
const page = await context.newPage();
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('https://deploy-preview-{PR}--planetnewborn-v0-newbornplanetm.netlify.app/');
const menuBtn = page.locator('button[aria-label="Open menu"]');
await menuBtn.click();
// Verify nav items appear and navigation works
```

**Note:** `xdotool windowsize` resizes the Chrome window but does NOT change `window.innerWidth` — CSS media queries may not trigger. Always use Playwright viewport emulation for reliable mobile testing.

### Lighthouse CLI on Preview Deploys
Run Lighthouse against the existing Chrome instance via CDP:
```bash
lighthouse "https://deploy-preview-{PR}--planetnewborn-v0-newbornplanetm.netlify.app/" \
  --only-categories=performance \
  --output=json \
  --output-path=/home/ubuntu/lighthouse-results.json \
  --port=29229
```

**Do NOT** run `lighthouse` without `--port=29229` — it will try to launch a new Chrome instance and fail with `ECONNREFUSED` because Chrome is already running.

Extract scores with:
```bash
cat lighthouse-results.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
perf = data['categories']['performance']['score']
print(f'Performance: {perf * 100:.0f}%')
for m in ['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index']:
    if m in data['audits']:
        print(f'  {data[\"audits\"][m][\"title\"]}: {data[\"audits\"][m][\"displayValue\"]}')
"
```

### Expected Lighthouse Baselines
- Homepage: ~50-55% on Netlify preview (high TBT from Next.js framework bundles)
- Inventory: ~60-70% on Netlify preview (lower JS if page errors early)
- The main bottleneck is JS execution time from Next.js framework chunks, not application code
- CLS should be 0 or near-0 if `content-visibility` + `contain-intrinsic-size` are correctly applied

## UI Testing

- **Trade-In page** (`/trade-in`): Scroll to "Get an AI Instant Quote" section. Verify Year/Make/Model/Trim/Mileage fields and Email/SMS verification buttons render.
- **VDP page** (`/vehicles/[id]`): Requires inventory data from Supabase. If no Supabase, inventory page shows "Error loading inventory" and you cannot navigate to a VDP. The PriceNegotiator component is at the bottom of VDP pages.
- **Anna chat**: Click "Chat with Anna" floating button (bottom-right). Already secured with CSRF + rate limiting.

## API Endpoint Testing Patterns

### Auth-Gated Endpoints
Many API routes (returns, alerts, admin) require Supabase authentication. Without a logged-in session, they return `401 Unauthorized`. To test these endpoints:
1. **Unauthenticated test**: Verify the auth gate works (expect 401)
2. **Authenticated test**: Requires a Supabase session cookie — log in via browser first, then extract the cookie for curl

### Mock/Disabled API Routes
Some API routes are intentionally disabled until real integrations are available:
- **Returns API** (`/api/v1/returns/[id]`): GET returns 404, POST returns 503. Both require auth first (401 if unauthenticated). No fake data ("James P." was removed).
- **Video-Call API** (`/api/video-call/request`): Returns success with "team will email" message. No fake `meet.planetmotors.ca` link.

### Testing Disclaimer Fields
Multiple API responses now include `_disclaimer` fields:
```bash
# Trade-In — verify source + disclaimer
curl -s -X POST localhost:3000/api/v1/trade-in \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"year":2020,"make":"Toyota","model":"Camry","mileage":50000}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('source:', d['data']['offer']['cbbValue']['source']); print('disclaimer:', '_disclaimer' in d['data'])"
# Expected: source: Estimated (based on market data), disclaimer: True

# Delivery Quote — verify disclaimer
curl -s "localhost:3000/api/v1/deliveries/quote?postalCode=M5V1J2" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('disclaimer:', d.get('_disclaimer','')[:60])"
# Expected: disclaimer: Delivery distance and cost are estimates only...
```

### Testing Dead Code Removal
To verify dead code like unused `request.json()` calls has been removed, send invalid JSON and check for 500:
```bash
curl -s -X POST localhost:3000/api/v1/returns/test-123 \
  -H "Content-Type: application/json" \
  -d 'not-json' -w "\nHTTP_STATUS: %{http_code}"
# Expected: 401 (auth gate) — NOT 500 (which would mean dead request.json() still crashes)
```

## Checkout Testing Limitations

The checkout page (`/checkout/[id]`) requires Supabase authentication. Navigating to it redirects to `/auth/login`. To test checkout-specific features like the Stripe error UI:
1. **With auth**: Log in via browser, then navigate to checkout. The Stripe `{!stripeKey ? ...}` conditional (lines 1024-1038) renders "Payment Unavailable" with phone CTA when `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is missing.
2. **Without auth (code-level only)**: Verify the conditional exists in `app/checkout/[id]/page.tsx`. To force the error state, comment out `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local` and restart the dev server. But you still need auth to reach the page.
3. **Env var toggle**: To test with/without Stripe key, use `sed` to toggle the env var:
   ```bash
   # Disable Stripe key
   sed -i 's/^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=/#NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=/' .env.local
   # Re-enable
   sed -i 's/^#NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=/' .env.local
   ```
   Remember to restart the dev server after changing env vars.

## Error Boundary Testing

Error boundaries (`app/{page}/error.tsx`) catch React runtime errors in child components. They exist for: `/contact`, `/blog`, `/financing`, `/about`, `/delivery`, `/schedule`.

### Verification Approaches
1. **Code-level**: Verify files exist and contain the correct pattern:
   ```bash
   grep -c "reportError\|Something Went Wrong\|1-866-797-3332\|Try Again" app/*/error.tsx
   # Each should return 6 (matches for all 4 patterns)
   ```
2. **Functional**: Navigate to each page and confirm it loads normally (boundary doesn't interfere)
3. **Trigger test**: Error injection is difficult on preview deploys. In dev mode, you could temporarily throw an error in a child component to trigger the boundary.

## VDP Gallery Alt Text Verification

Thumbnail `<img>` elements should have descriptive alt text matching `"YEAR MAKE MODEL — photo N of M"`. Verify via browser console:
```javascript
Array.from(document.querySelectorAll('button[aria-label^="View image"] img')).map(img => img.alt)
// Expected: ["2023 Tesla Model Y — photo 1 of 8", "2023 Tesla Model Y — photo 2 of 8", ...]
```

## Admin Email Consolidation Verification

All admin email checks should import from `lib/admin.ts` (not hardcoded arrays):
```bash
grep -r "from.*lib/admin" app/ middleware.ts | wc -l
# Expected: 9 files
```

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
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key (for data integrity tests, race condition testing)
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
- `lib/admin.ts` — Consolidated admin email list (ADMIN_EMAILS + isAdminEmail)
- `lib/error-reporting.ts` — Error reporting to Sentry via reportError()
- `app/api/negotiate/route.ts` — Price Negotiator endpoint
- `app/api/vehicle-valuation/route.ts` — Vehicle Valuator endpoint
- `app/api/verify/send-code/route.ts` — Server-side verification code generation
- `app/api/verify/check-code/route.ts` — Timing-safe code verification
- `app/api/v1/returns/[id]/route.ts` — Disabled returns API (404/503)
- `app/api/v1/trade-in/route.ts` — Trade-in with disclaimer + corrected source
- `app/api/v1/deliveries/quote/route.ts` — Delivery quote with disclaimer
- `app/api/video-call/request/route.ts` — Video call scheduling (no fake link)
- `app/checkout/[id]/page.tsx` — Checkout with Stripe error UI fallback
- `app/contact/error.tsx` — Error boundary pattern (same for blog, financing, about, delivery, schedule)
- `app/admin/inventory/page.tsx` — Admin vehicle management (CRUD, VIN decoder, HomeNet sync)
- `app/api/v1/admin/vehicles/route.ts` — Vehicle list/create API (admin auth required)
- `app/api/v1/admin/vehicles/[id]/route.ts` — Vehicle update/delete API (VIN validation, duplicate check)
- `app/api/v1/admin/vehicles/vin-decode/route.ts` — NHTSA VIN decoder proxy
- `app/api/v1/admin/vehicles/homenet-sync/route.ts` — HomeNet sync trigger
- `e2e/human-click-timing-debug.spec.ts` — Main 40-test E2E spec
- `e2e/fixtures/dl-front.jpg` — Required fixture for C09 Vercel Blob upload test
- `.github/workflows/ci.yml` — CI pipeline (lint-and-build, bundle-check, e2e)
- `playwright.config.ts` — Playwright configuration (webServer on port 3000)
- `app/inventory/page.tsx` — Inventory page with `content-visibility: auto` virtualization
- `components/footer-content.tsx` — Footer as Server Component (no "use client")
- `app/layout.tsx` — Font configuration with `display: 'swap'`
- `components/vehicle-showcase.tsx` — Hero vehicle showcase with SWR + server fallbackData
- `app/vehicles/[id]/layout.tsx` — VDP layout with Pirelly 360° script (scoped here, not global)
