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
- **Payments**: Stripe — deposits, checkout
- **Email**: Resend — magic links, price drop alerts, ADF to AutoRaptor
- **Auth**: Supabase Auth (magic link / OTP) + Clerk (legacy)
- **Search**: Typesense (primary) with PostgreSQL fallback

### Infrastructure
- **Hosting**: Vercel (frontend + API routes)
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **CI/CD**: GitHub Actions — lint → test → build → bundle-check → e2e → VRT
- **VRT**: Playwright visual regression testing
- **Monitoring**: Vercel Analytics

## Project Structure

```
v0-newbornplanetm/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (financing, social proof, webhooks)
│   ├── financing/         # Multi-lender financing flow
│   ├── inventory/         # Vehicle listings (SRP)
│   ├── vehicles/          # Vehicle detail pages (VDP)
│   ├── checkout/          # 8-step Carvana-style checkout
│   └── sell-your-car/     # Trade-in flow (Sanity CMS)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── vehicle/          # VDP, 360° viewer, social proof
│   └── finance-application-form.tsx  # Magic link financing
├── lib/                   # Core utilities
│   ├── rates.ts          # Single source of truth for finance math
│   ├── sanity/           # Sanity client + GROQ queries
│   ├── supabase/         # Supabase clients + Edge Function helpers
│   └── seo/              # SEO metadata utilities
├── supabase/
│   └── functions/        # Edge Functions (Deno)
│       ├── capture-lead/       # Pre-auth lead capture + AutoRaptor ADF
│       ├── finance-prequalify/ # Post-auth soft credit pull
│       └── price-drop-alert/   # Automated price drop emails
├── e2e/                   # Playwright E2E + visual regression tests
├── docs/                  # Technical documentation
├── scripts/              # Migrations, bundle checks, utilities
└── public/               # Static assets
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
```

See `.env.example` for all available options.

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
3. **e2e** — Playwright accessibility + navigation tests
4. **visual-regression** — Playwright `toHaveScreenshot` for VDP + finance form layouts

## Security

- PIPEDA compliant (Canadian privacy)
- PCI DSS Level 1 (Stripe tokenization)
- OMVIC/AMVIC compliant (dealer regulations)
- All sensitive API keys stored in Supabase Secrets (never in browser)
- PII redacted from Edge Function logs

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
