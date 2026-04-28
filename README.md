# Planet Motors

> Canada's Premier Online Used Car Marketplace

[![Node.js](https://img.shields.io/badge/node-22-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/next.js-16-black.svg)](https://nextjs.org)

| Feature | Planet Motors |
|---------|--------------|
| Inspection Points | **210-point** |
| Return Policy | **10 days** |
| Lender Network | **6 Canadian Banks** |
| Home Delivery | **Nationwide** |
| Trade-In Valuation | **Instant CBB + Photos** |
| Price Transparency | **Full breakdown** |
| 360° Vehicle Views | **Interactive AVIF** |
| EV Battery Health | **Full report** |

## Team

| Name | Role | Access |
|------|------|--------|
| **Tony Bekheet** | Owner / CEO | Sanity Admin |
| **Hamza Patel** | Finance Manager | Sanity Editor |
| **Toni Sultzberg** | Lead Developer | Sanity Admin |

> Studio access: `studio.planetmotors.ca` — 2FA required for all accounts.

## Quick Start

```bash
# Clone
git clone https://github.com/PLANETMOTORS/v0-newbornplanetm.git
cd v0-newbornplanetm

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase, Sanity, Stripe, and Clerk credentials

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Supabase Edge Functions (local development)

```bash
# Install Supabase CLI
pnpm add -g supabase

# Link to the project
supabase link --project-ref ldervbcvkoawwknsemuz

# Set secrets (AutoRaptor, Resend API keys)
bash scripts/setup-edge-function-secrets.sh

# Deploy Edge Functions
supabase functions deploy capture-lead
supabase functions deploy finance-prequalify
supabase functions deploy price-drop-alert
```

### Sanity Studio (CMS)

The CMS lives in a separate repo: [`v0-cms-site-build`](https://github.com/PLANETMOTORS/v0-cms-site-build).

```bash
cd v0-cms-site-build
pnpm install
pnpm dev          # Studio at http://localhost:3000/studio
```

Required env vars for Sanity Studio:
- `NEXT_PUBLIC_SANITY_PROJECT_ID` — `wlxj8olw`
- `NEXT_PUBLIC_SANITY_DATASET` — `production`
- `SANITY_STUDIO_SUPABASE_URL` — your Supabase project URL
- `SANITY_STUDIO_SUPABASE_ANON_KEY` — your Supabase anon key

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **Components**: shadcn/ui + Radix UI
- **State**: SWR for server data, React Context for auth/favorites/compare
- **360° Viewer**: Custom AVIF-optimized canvas viewer

### Backend
- **Database**: Supabase (PostgreSQL) — auth, inventory, leads, reservations
- **CMS**: Sanity v5 — pages, blog, settings, featured vehicles
- **Edge Functions**: Supabase Deno — `capture-lead`, `finance-prequalify`, `price-drop-alert`
- **Payments**: Stripe — deposits, checkout, payment-intent verification at confirm-time
- **Email**: Resend — magic links, price drop alerts, ADF to AutoRaptor
- **Auth**:
    - Storefront customers — Supabase Auth (magic link / OTP)
    - Admin users — Supabase Auth (email + password) gated by `ADMIN_EMAILS` allow-list
- **Rate limiting**: Upstash Redis — per-(IP + principal) and per-IP buckets on `/api/v1/auth/*` and checkout endpoints
- **Search**: Typesense Cloud (3-node HA cluster with SDN) — primary, with PostgreSQL fallback
- **Cron**: Vercel Cron — `homenet-sync` (every 15 min), `drivee-sync` (every 6 hrs), `vehicle-release` (every 10 min)
- **CRM**: AutoRaptor — ADF/XML lead push, eLead email forwarding
- **Maps**: Google Maps JavaScript API + Places API — dealership map, address autocomplete

### Infrastructure
- **Hosting**: Vercel Pro (frontend + API routes + cron jobs)
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **CI/CD**: GitHub Actions — lint → test → build → bundle-check → e2e → VRT
- **VRT**: Playwright visual regression testing
- **Monitoring**: Sentry (error tracking, performance monitoring, session replay with PII redaction) + Vercel Analytics
- **Secret Management**: Vercel Environment Variables (encrypted at rest, scoped per environment)

## Project Structure

```
v0-newbornplanetm/
├── app/                            # Next.js App Router pages
│   ├── admin/                     # Admin portal (Supabase email+password auth)
│   │   ├── login/                # Admin sign-in
│   │   ├── forgot-password/      # Reset-link request
│   │   ├── reset-password/       # New-password set after email link
│   │   ├── inventory/            # Vehicle CRUD + status actions
│   │   ├── reservations/         # Reservations + payment validation
│   │   ├── leads/                # CRM-bound lead management
│   │   ├── orders/               # Closed-deal record
│   │   ├── finance/              # Finance application admin
│   │   ├── customers/            # Customer 360
│   │   ├── ai-agents/            # AI assistant configuration
│   │   ├── workflows/            # Email + automation rules
│   │   ├── 360-upload/           # 360° photo manager
│   │   ├── analytics/            # Dashboards
│   │   └── settings/             # Admin settings
│   ├── api/                       # API routes
│   │   ├── v1/auth/              # /login + /refresh — rate-limited (Upstash)
│   │   ├── v1/admin/             # Admin-only mutations w/ allow-list schemas
│   │   ├── webhooks/stripe/      # Stripe webhook → reservation confirm
│   │   └── cron/vehicle-release/ # Vercel Cron — auto-release stuck reservations
│   ├── financing/                 # Multi-lender financing flow
│   ├── inventory/                 # Vehicle listings (SRP) — shows Reserved + Sold badges
│   ├── vehicles/                  # Vehicle detail pages (VDP) — JSON-LD, AVIF 360°
│   ├── checkout/                  # 8-step Carvana-style checkout
│   └── sell-your-car/             # Trade-in flow (Sanity CMS)
├── components/                    # React components
│   ├── ui/                        # shadcn/ui components
│   ├── admin/                     # Admin-only components
│   ├── vehicle/                   # VDP, 360° viewer, social proof
│   └── finance-application-form.tsx  # Magic link financing
├── lib/
│   ├── rates.ts                   # Single source of truth for finance math
│   ├── reservation-payment-rules.ts  # "Stripe-approved only" confirmation rules
│   ├── sanity/                    # Sanity client + GROQ queries
│   ├── supabase/                  # Supabase clients + Edge Function helpers
│   ├── seo/                       # SEO metadata utilities
│   ├── security/                  # auth-rate-limit, cron-auth, sentry-redaction, admin-mutation-schemas, client-ip
│   └── vehicles/                  # status-filter, status-display, fetch-vehicle
├── supabase/
│   └── functions/                 # Edge Functions (Deno)
│       ├── capture-lead/          # Pre-auth lead capture + AutoRaptor ADF
│       ├── finance-prequalify/    # Post-auth soft credit pull
│       └── price-drop-alert/      # Automated price drop emails
├── e2e/                           # Playwright E2E + visual regression tests
├── docs/                          # Technical documentation (SECURITY.md, etc.)
├── scripts/                       # Migrations, bundle checks, utilities
└── public/                        # Static assets
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ldervbcvkoawwknsemuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=wlxj8olw
NEXT_PUBLIC_SANITY_DATASET=production

# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (email)
RESEND_API_KEY=re_...

# Upstash Redis (rate limiting + vehicle locks + verification codes)
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...
UPSTASH_REDIS_REST_URL=https://...upstash.io  # alias for rate-limit module
UPSTASH_REDIS_REST_TOKEN=...

# Vercel Cron (auto-release of stuck reservations)
CRON_SECRET=...

# Sentry (errors + tracing + session replay)
SENTRY_DSN=https://...ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...ingest.sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...  # source map uploads

# Site URLs (SEO canonical, OG meta, sitemap)
NEXT_PUBLIC_BASE_URL=https://www.planetmotors.ca
NEXT_PUBLIC_SITE_URL=https://www.planetmotors.ca

# Admin
ADMIN_EMAIL=toni@planetmotors.ca
ADMIN_EMAILS=toni@planetmotors.ca
FROM_EMAIL=notifications@planetmotors.ca

# Typesense (vehicle search)
TYPESENSE_API_KEY=...           # admin key (server-side indexing)
TYPESENSE_HOST=...a2.typesense.net
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=...  # search-only key (client-safe)
NEXT_PUBLIC_TYPESENSE_HOST=...a2.typesense.net
TYPESENSE_NODES=node1,node2,node3

# AutoRaptor CRM
AUTORAPTOR_ADF_ENDPOINT=https://ar.autoraptor.com/incoming/adf/...
AUTORAPTOR_DEALER_ID=...
AUTORAPTOR_DEALER_NAME=Planet Motors
AUTORAPTOR_ELEAD_EMAIL=eleads-...@app.autoraptor.com

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...

# Security (auto-generated secrets)
INTERNAL_API_SECRET=...          # internal API route auth
CRM_WEBHOOK_SECRET=...           # CRM webhook verification
APPLICATION_SIN_ENCRYPTION_KEY=... # SIN field encryption (AES-256)
APPLICATION_SIN_HASH_PEPPER=...    # SIN hash pepper
```

See `.env.example` for all available options.

## Admin Portal

The admin portal lives at [`/admin`](https://www.planetmotors.ca/admin) and is
gated by an `ADMIN_EMAILS` allow-list (see `lib/admin.ts`) on top of Supabase
email + password auth.

### Sign-in flow

```text
/admin/login            ← email + password (Supabase signInWithPassword)
/admin/forgot-password  ← request a reset link (Supabase resetPasswordForEmail)
/admin/reset-password   ← set new password after email link (updateUser)
/admin                  ← dashboard (allow-list gated by app/admin/layout.tsx)
```

Only emails listed in `ADMIN_EMAILS` (or users with `user_metadata.is_admin === true`)
can access any `/admin/*` page. Non-admins are redirected to the storefront.
The login + forgot-password + reset-password pages render outside the admin
shell so unauthenticated users can authenticate.

### Auto-release cron

`app/api/cron/vehicle-release/route.ts` runs every 10 minutes via Vercel Cron
(`vercel.json`). It releases vehicles that have been stuck in transitional
states so inventory is never permanently locked by an abandoned checkout:

| Trigger | Threshold | New status |
|---------|-----------|------------|
| `checkout_in_progress` with no recent update | 30 minutes | `available` |
| `reserved` with no confirmed deposit / active reservation | 48 hours | `available` |

The endpoint is authenticated with `Authorization: Bearer ${CRON_SECRET}`;
the secret is required in production (the route fails-closed otherwise).

### Reservation payment validation

`lib/reservation-payment-rules.ts` is the single source of truth for the
"Stripe-approved only" rule on reservations. The admin reservations API
(`app/api/v1/admin/reservations/route.ts`) and the Stripe webhook
(`app/api/webhooks/stripe/route.ts`) both run reservations through:

```ts
import {
  validateReservationForConfirmation,
  fullPaymentVerification,
} from "@/lib/reservation-payment-rules"

// Local check (synchronous): deposit_status === 'paid', a Stripe reference
// exists, and the reservation has not expired.
const local = validateReservationForConfirmation(reservation)

// Full check (async): re-verifies the PaymentIntent or Checkout Session
// directly with the Stripe API. Used by admin "confirm" mutations.
const remote = await fullPaymentVerification(reservation)
```

A matching SQL trigger (`scripts/023_reservation_payment_validation.sql`)
enforces the same rule at the database level so the constraint cannot be
bypassed by writing directly to PostgREST.

### Reserved + Sold badges

The inventory page shows vehicles in three states:

- **Available** — purchasable, "Start your purchase" CTA
- **Reserved** — yellow badge, customer has paid the $250 deposit
- **Sold** — red badge, visible for 7 days then auto-hidden by the
  `buildPublicStatusFilter()` helper in `lib/vehicles/status-filter.ts`

Status display tokens (label + Tailwind colour class + schema.org
availability URL) come from one shared map in `lib/vehicles/status-display.ts`
so the badge, the disabled-CTA banner, and the JSON-LD signal can never
drift apart.

## Development

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm test         # Vitest unit/integration tests
pnpm e2e          # Playwright E2E tests
pnpm e2e:vrt      # Visual regression tests only
```

### CodeRabbit Reviews

CodeRabbit is the default review workflow for this workspace.

Preferred ways to run it:

```bash
# Review current local changes
pnpm review

# Review all changes in the workspace context
pnpm review:all

# Open the full-screen interactive CodeRabbit UI
pnpm review:ui
```

Direct CLI equivalents:

```bash
coderabbit --agent -t uncommitted
coderabbit --agent
coderabbit review --interactive
```

In VS Code, you can also use:

- `CodeRabbit: Start Review` from the Command Palette when available
- `Run Task` -> `CodeRabbit: Review Uncommitted`
- `Run Task` -> `CodeRabbit: Review All`
- `Run Task` -> `CodeRabbit: Review Interactive`

If the CLI is not authenticated yet, run:

```bash
coderabbit auth login
```

## CI Pipeline

GitHub Actions runs on every PR and push to `main`:

1. **lint-and-build** — `pnpm lint` → `pnpm test` → `pnpm build`
2. **bundle-check** — Enforces 1700 KB first-load JS budget per page
3. **accessibility** — `axe-core` + Playwright assertions on key flows
4. **e2e** — Playwright navigation + interaction tests
5. **visual-regression** — Playwright `toHaveScreenshot` for VDP + finance form layouts
6. **lighthouse** — Performance + best-practices budget
7. **SonarCloud Scan** — Quality Gate enforces:
   - reliability A, security A, maintainability A
   - new_coverage ≥ 80%
   - new_duplicated_lines_density ≤ 3%
   - 100% of new security hotspots reviewed
8. **Detect secrets** — Tree-walks every diff for credentials

## Security

- **PIPEDA compliant** (Canadian privacy)
- **PCI DSS Level 1** (Stripe tokenization)
- **OMVIC / AMVIC compliant** (dealer regulations)
- **Authentication rate limiting** — `/api/v1/auth/login` capped at 5 attempts
  per (IP + email-hash) and 25 per IP per 15 minutes; `/api/v1/auth/refresh`
  capped at 60 per (IP + token-hash) and 300 per IP per hour. See
  `lib/security/auth-rate-limit.ts`.
- **Admin mutation allow-lists** — every admin PATCH endpoint runs payloads
  through a strict zod schema in `lib/security/admin-mutation-schemas.ts`
  before touching the database (mass-assignment defence).
- **Stripe-approved-only reservations** — both the admin route and a
  PostgreSQL trigger refuse to confirm a reservation without a `paid`
  deposit + a verified Stripe reference. See
  `lib/reservation-payment-rules.ts` and
  `scripts/023_reservation_payment_validation.sql`.
- **Payment flow auth gates** — `startVehicleCheckout` and
  `startCheckoutSession` require authenticated users (`getUser()`) before
  creating Stripe sessions or locking inventory.
- **Checkout rate limiting** — 10 requests per 15 minutes per user on
  checkout endpoints via Upstash Redis.
- **Timing-safe cron authentication** — all cron and webhook endpoints
  use `crypto.timingSafeEqual()` via the shared `verifyCronSecret()`
  utility in `lib/security/cron-auth.ts` (prevents timing attacks on
  secret comparison).
- **userId in Stripe metadata** — injected into both Stripe session and
  payment_intent metadata for full attribution of deposits and deal events.
- **Sentry redaction pipeline** — `beforeSend` + `beforeBreadcrumb`
  scrub PII (email, phone, name, SIN, DOB, address), tokens (JWT, Stripe
  secret, Supabase service-role), and credit-card-shaped digit runs from
  every event before transport. WeakSet-backed cycle detection prevents
  serialization drops.
- **SIN encryption** — finance application SIN fields encrypted with
  AES-256 (`APPLICATION_SIN_ENCRYPTION_KEY`) and hashed with a pepper
  (`APPLICATION_SIN_HASH_PEPPER`) before storage.
- **Cookie hardening** — Supabase session cookies receive `secure` (in
  production) and `sameSite=lax` defaults via
  `lib/supabase/middleware.ts:applySupabaseCookieDefaults`; `httpOnly`
  is deliberately preserved as Supabase set it so the browser SDK can
  read tokens via `document.cookie`.
- **CSP** — single source of truth in `next.config.mjs:async headers()`
  with origin allow-listing for Stripe, Supabase, Sentry, Resend,
  Upstash, Typesense, and analytics partners.
- **Sensitive API keys** stored in Vercel + Supabase secret stores
  (never in browser bundles).
- **PII redacted** from Edge Function logs via `lib/redact.ts`.

See `docs/SECURITY.md` for the full pre-launch security checklist.

## Production Stack

| Service | Purpose | Tier |
|---------|---------|------|
| **Vercel** | Hosting, edge runtime, cron jobs, preview deploys | Pro |
| **Supabase** | Database, auth, RLS, storage, realtime | Pro |
| **Upstash Redis** | Rate limiting, vehicle locking, idempotency cache | Pay-as-you-go |
| **Stripe** | Payments, deposits, webhooks, Radar fraud detection | Standard |
| **Resend** | Transactional email (magic links, alerts, ADF) | Free / Starter |
| **Sentry** | Error tracking, performance monitoring, session replay | Free |
| **Typesense Cloud** | Vehicle search (3-node HA + SDN) | Starter |
| **Sanity** | CMS — pages, blog, featured vehicles, settings | Growth |
| **AutoRaptor** | CRM — ADF/XML lead push, eLead forwarding | Dealer |
| **Google Maps** | Maps JavaScript API + Places API (address autocomplete) | Pay-as-you-go |

## Contributing

1. Create your feature branch (`git checkout -b feature/amazing-feature`)
2. Run lint + tests before committing
3. Open a Pull Request — CI must pass before merge
4. See [docs/AI_SYSTEM_PROMPT.md](docs/AI_SYSTEM_PROMPT.md) for AI agent rules

## Contact

- **Website**: [planetmotors.ca](https://www.planetmotors.ca)
- **Phone**: 1-866-787-3332
- **Local**: 416-985-2277
- **Email**: info@planetmotors.ca
- **Address**: 30 Major Mackenzie E, Richmond Hill, ON L4C 1G7

---

Built with precision in Canada. OMVIC Licensed Dealer.
