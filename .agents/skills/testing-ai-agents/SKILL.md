# Testing AI Agent Security — Planet Motors

## Overview
Planet Motors has 3 AI agents that need security testing:
- **Anna** (`/api/anna`) — Chat assistant (already had rate limiting + CSRF)
- **Price Negotiator** (`/api/negotiate`) — GPT-4o-mini price negotiation
- **Vehicle Valuator** (`/api/vehicle-valuation`) — GPT-4o-mini trade-in appraisal

Security layers: CSRF origin validation (`lib/csrf.ts`), IP-based rate limiting (`lib/redis.ts`), server-side verification codes (`/api/verify/send-code` + `/api/verify/check-code`).

## Local Production Build for CSRF Testing

CSRF validation is **bypassed in development mode** (`NODE_ENV=development`). To test CSRF:

1. Create minimal `.env.local`:
   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
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

Vercel previews may have deployment protection enabled, blocking direct curl access. Options:
1. Use `vercel curl` (requires Vercel CLI authenticated)
2. Use Vercel MCP server's `get_access_to_vercel_url` function
3. Use bypass token (see Vercel docs on protection bypass automation)
4. Test locally in production mode instead (recommended for CSRF testing)

## Devin Secrets Needed

- `KV_REST_API_URL` — Upstash Redis URL (for rate limiting tests)
- `KV_REST_API_TOKEN` — Upstash Redis token (for rate limiting tests)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (for inventory/VDP UI tests)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (for inventory/VDP UI tests)
- OpenAI/AI Gateway key — only needed for full end-to-end AI response testing

## Build & Lint Commands

```bash
pnpm build          # Next.js production build
pnpm lint           # ESLint
pnpm run typecheck  # TypeScript strict check (if configured)
npx tsc --noEmit    # Manual TypeScript check
```

## Key Files

- `lib/csrf.ts` — CSRF origin validation logic
- `lib/redis.ts` — Rate limiting + verification code storage
- `app/api/negotiate/route.ts` — Price Negotiator endpoint
- `app/api/vehicle-valuation/route.ts` — Vehicle Valuator endpoint
- `app/api/anna/route.ts` — Anna chat endpoint
- `app/api/verify/send-code/route.ts` — Server-side code generation
- `app/api/verify/check-code/route.ts` — Server-side code verification
- `components/vehicle/price-negotiator.tsx` — PriceNegotiator UI
- `components/trade-in/instant-quote.tsx` — InstantQuote UI
- `components/trade-in/ico-verification-dialog.tsx` — Verification dialog UI
