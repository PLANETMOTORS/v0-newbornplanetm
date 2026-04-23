# Architecture

> System architecture for Planet Motors — updated April 2026.

## Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Vercel Edge  │────▶│  Next.js 16 App  │
│  (React 19)  │◀────│   Network     │◀────│   Router         │
└─────────────┘     └──────────────┘     └────────┬─────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────┐
                    │                              │                  │
              ┌─────▼──────┐              ┌────────▼───────┐  ┌──────▼──────┐
              │  Supabase   │              │   Sanity v5    │  │   Stripe    │
              │  PostgreSQL │              │   Content Lake │  │  Payments   │
              │  + Auth     │              │   (wlxj8olw)   │  │             │
              │  + Edge Fn  │              └────────────────┘  └─────────────┘
              └─────────────┘
```

## Finance-First Math (`lib/rates.ts`)

All payment calculations across the platform are controlled by a single file:

```
lib/rates.ts
├── RATE_FLOOR = 6.29            # Lowest advertised APR
├── RATE_FLOOR_DISPLAY = "6.29%" # Display string
├── DEFAULT_TERM_MONTHS = 72     # Loan term for estimates
├── DEFAULT_DOWN_PAYMENT_PCT = 0 # Default down payment
├── FINANCE_ADMIN_FEE = 895      # Finance docs setup fee
└── calculateBiweeklyPayment()   # PMT formula: P·[r(1+r)^n] / [(1+r)^n − 1] × 12/26
```

**Consumers:**
- VDP header callout — shows bi-weekly payment next to price
- VDP sidebar — finance callout card with APR + payment
- Mobile sticky CTA bar — price + bi-weekly + APR
- Social proof component — uses rates for context
- AI negotiation (Anna) — references `RATE_FLOOR` as fallback

**CI Guard:** `lib/rates.test.ts` has precision assertions for $30k, $50k, and $80k vehicles. Any change to the formula, constants, or rounding that produces a different result will fail CI immediately.

## Sanity-Supabase Inventory Connector

The CMS (Sanity v5) and live inventory (Supabase) are linked via a custom Studio component.

```
Sanity Studio                          Supabase
┌──────────────────┐                   ┌──────────────────┐
│ Homepage doc     │                   │ vehicles table   │
│ ┌──────────────┐ │   REST query      │                  │
│ │ Featured     │─┼──────────────────▶│ id, year, make,  │
│ │ Vehicles     │ │   (search/select) │ model, price,    │
│ │ (array of    │ │                   │ status, mileage  │
│ │ vehicle_id)  │ │                   │                  │
│ └──────────────┘ │                   └──────────────────┘
└──────────────────┘

Studio stores vehicle_id strings → Frontend reads IDs from Sanity GROQ →
Fetches full vehicle details from Supabase for rendering.
```

**Key files (CMS repo — `v0-cms-site-build`):**
- `studio/components/SupabaseVehiclePicker.tsx` — custom Sanity input component
- `studio/schemas/objects/supabaseVehicleReference.ts` — `defineType` wrapper
- `studio/schemas/homepage.ts` — `featuredVehicles` array field

**Key files (website repo):**
- `lib/sanity/queries.ts` — `HOMEPAGE_QUERY` fetches `featuredVehicles[].vehicle_id`
- Homepage component — reads IDs from Sanity, fetches details from Supabase, falls back to auto-selected top-6-by-price if no admin curation

**Fault tolerance:**
- Singleton Supabase client (module-level cache)
- AbortController with 10s timeout on all requests
- Failures show "Unable to load inventory" warning — Studio never crashes
- 7 integration tests cover missing env vars, API errors, timeouts

## Finance-Accelerator (Edge Functions)

Sensitive API keys (AutoRaptor, Resend) are stored in Supabase Secrets and accessed only server-side via Edge Functions. The browser never sees these keys.

```
Browser                    Supabase Edge Functions           External APIs
┌────────┐                ┌────────────────────┐           ┌──────────────┐
│ Finance │  POST /capture │  capture-lead      │  ADF XML  │  AutoRaptor  │
│ Form    │───────────────▶│  - persist lead    │──────────▶│  DMS         │
│         │                │  - send ADF XML    │           └──────────────┘
│         │                │  - trigger magic   │  email    ┌──────────────┐
│         │                │    link via Resend  │──────────▶│  Resend      │
│         │                └────────────────────┘           └──────────────┘
│         │
│ (after  │  POST /prequalify  ┌────────────────────┐
│ magic   │───────────────────▶│  finance-prequalify │
│ link)   │                    │  - verify session   │
│         │                    │  - soft credit pull │
│         │                    │  - return offers    │
└────────┘                    └────────────────────┘
```

**Edge Functions (`supabase/functions/`):**

| Function | Trigger | Auth | Purpose |
|----------|---------|------|---------|
| `capture-lead` | Form submission | Anon (pre-auth) | Persist lead to DB, send ADF XML to AutoRaptor, trigger magic link email |
| `finance-prequalify` | After magic link auth | Bearer (session) | Soft credit pull, lender matching, return offers |
| `price-drop-alert` | DB webhook on `vehicles.price` UPDATE | Service role | Email users who viewed/inquired about a vehicle when its price drops |

**Client helper:** `lib/supabase/edge-functions.ts` — `invokeEdgeFunction()` constructs the correct URL and attaches auth headers.

## Magic Link Auth Flow

The financing form uses a "lead-first, auth-second" pattern to minimize friction:

```
1. User fills out finance form (no login required)
         │
         ▼
2. POST to capture-lead Edge Function
   ├── Insert lead into `leads` table
   ├── Send ADF XML to AutoRaptor
   └── Trigger Supabase Auth magic link via Resend
         │
         ▼
3. Show "We sent a verification link to {email}" UI
         │
         ▼
4. User clicks magic link in email
   └── Supabase Auth creates/signs-in session
         │
         ▼
5. POST to finance-prequalify Edge Function (authenticated)
   ├── Verify session token
   ├── Run soft credit pull
   └── Return lender offers
         │
         ▼
6. Display pre-qualification results
```

**Key constraint:** RouteOne soft credit pull and lender matching ONLY execute after the session is authenticated via the magic link. Lead data is captured before auth.

## Social Proof (VDP)

Real-time trust signals on the Vehicle Detail Page, powered by actual Supabase data:

```
API Route: /api/v1/social-proof?vehicleId=xxx
         │
         ├── Query finance_applications_v2 (last 7 days)
         ├── Query reservations (pending/confirmed)
         └── Query vehicle_page_views (last 24 hours)
         │
         ▼
SocialProof component (SWR, renders null until data)
├── "X people requested financing this week"
├── "X people viewed this in the last 24 hours"
└── "This vehicle was recently reserved — high demand"
```

**Placement:**
- Desktop: above "Get Pre-Approved" CTA in sidebar
- Mobile: below price header

**Zero CLS:** Component renders `null` until SWR returns data. No layout shift.

## Price Drop Alerts

Automated email system for returning traffic:

```
vehicles table UPDATE (price decreased)
         │
         ▼
DB webhook → price-drop-alert Edge Function
         │
         ├── Query leads (last 30 days, this vehicle)
         ├── Query finance_applications (last 30 days)
         ├── Query reservations (last 30 days)
         │
         ├── Dedup: max 1 alert per vehicle per recipient per week
         │   (price_drop_notifications table)
         │
         └── Send branded email via Resend
             ├── Old price → New price (with savings badge)
             └── CTA: "View the new price" → VDP link
```

## CI Pipeline

```
PR opened / push to main
         │
         ├── lint-and-build ──── pnpm lint → pnpm test (vitest) → pnpm build
         │
         ├── bundle-check ───── pnpm build → check-bundle-size.mjs (1700 KB budget)
         │
         ├── e2e ────────────── Playwright: accessibility, navigation, auth flows
         │
         └── visual-regression ─ Playwright toHaveScreenshot:
                                  ├── VDP desktop (sidebar CTA, finance callout)
                                  ├── VDP mobile (sticky CTA bar)
                                  └── Finance form (magic link UI)
```

**VRT config:** 2% pixel diff tolerance, animations disabled, dynamic content masked (images, social proof, 360° viewer).

## Data Flow Summary

| Data | Source | Consumer |
|------|--------|----------|
| Vehicle inventory | Supabase `vehicles` table | SRP, VDP, search, social proof |
| Page content (Sell Your Car, Homepage hero) | Sanity CMS | Next.js pages via GROQ |
| Featured vehicles | Sanity (IDs) + Supabase (details) | Homepage |
| Finance applications | Supabase `finance_applications_v2` | Edge Functions, social proof |
| Leads | Supabase `leads` table | Edge Functions, price drop alerts |
| Reservations | Supabase `reservations` table | Checkout, social proof |
| Payments | Stripe | Checkout, webhooks |
| Email | Resend | Magic links, price drops, ADF |
| Rate constants | `lib/rates.ts` | VDP, finance form, AI, checkout |
