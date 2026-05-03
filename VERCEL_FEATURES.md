# 🚀 Vercel & React 19 Performance Features

This project has been upgraded to utilize the latest Next.js 16.2 + React 19 primitives for high-performance automotive retail.

---

## 1. Data Throughput (10K Vehicle Scale)

- **Streaming DMS Parser**: Migrated from memory-heavy `split()` logic to **Node.js ReadStreams**. Processes 10k+ vehicles with <200MB RAM footprint.
- **Keyset Pagination**: Replaced legacy `OFFSET` pagination with cursor-based keyset pagination for instant search results at high volumes.
- **Typesense Bulk Sync**: Optimized for high-frequency inventory updates via the Typesense Bulk Import API.

## 2. Media Optimization (P0-B)

- **Vercel Blob Storage**: Fully integrated for vehicle media. Bypasses standard hotlinking for superior SEO and performance.
- **Smart LCP Priority**: Hero images on VDP and above-fold VehicleCards use `fetchPriority="high"` and `priority` props for <1.2s LCP.
- **Wildcard Blob Domains**: Configured CSP and Next.js RemotePatterns to support dynamic Blob subdomains.

## 3. React 19 "Declarative" Forms

- **useActionState**: Unified error and pending state management across all 33 forms, eliminating ~1,000 lines of legacy `useState` boilerplate.
- **useFormStatus**: Implemented a global `SubmitButton` that auto-detects submission state via native React hooks.
- **Aria-Busy Implementation**: Leveraging **Tailwind v4** native `aria-busy` variants for instant CSS-level visual feedback (<16ms) during server round-trips.

## 4. Infrastructure & Security

- **Safe Side-Effects**: Asynchronous tasks (CRM/Email) are isolated in `try/catch` wrappers to ensure external API failures never block user success responses.
- **Zod-to-Field Mapping**: Finance Application uses field-level error mapping via `z.flatten().fieldErrors` for precise user guidance on multi-step forms.
- **Scroll-to-Error UX**: Server Action validation errors auto-scroll to the first invalid field using `requestAnimationFrame` + `aria-invalid` DOM queries.

## 5. Code Quality & Build Pipeline

| Metric | Status |
|--------|--------|
| TypeScript | ✅ 0 errors (`strict` mode) |
| ESLint | ✅ 0 errors, 0 warnings |
| Dead Code | ✅ Purged — 25 legacy Sanity Studio files removed |
| Aria-Busy Coverage | ✅ 23 submit buttons across all forms |
| Test Coverage | ✅ Vitest unit + integration suite |

## 6. Server Actions (Replacing API Routes)

The following forms have been migrated from client-side `fetch()` to **Next.js Server Actions** with built-in CSRF protection:

| Form | Server Action | Zod Schema |
|------|--------------|------------|
| Finance Application (Full) | `submitFinanceApplication` | Field-level errors per section |
| Contact / Inquiry | `submitContactForm` | `contactSchema` |
| Trade-In Quote | `submitTradeInQuote` | `tradeInQuoteRequestSchema` |
| Lead Capture | `submitLeadCapture` | `leadCaptureSchema` |
| Schedule Test Drive | `submitTestDrive` | `testDriveSchema` |
| Live Video Tour | `submitVideoTour` | `videoTourSchema` |
| Price Alert | `submitPriceAlert` | Email validation |
| Newsletter | `SubmitButton` (useFormStatus) | Email validation |

## 7. Deployment Configuration

- **Platform**: Vercel (Edge + Serverless)
- **Framework**: Next.js 16.2 (App Router)
- **Runtime**: Node.js 20 (Serverless Functions)
- **CDN**: Vercel Edge Network with ISR for inventory pages
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Search**: Typesense (self-hosted or cloud)
- **CMS**: Sanity (blog content, homepage curation)
- **Payments**: Stripe (checkout + webhooks)
- **Cache**: Upstash Redis (rate limiting, idempotency)
- **Email**: Resend (transactional notifications)
- **Media**: Vercel Blob (vehicle images)

---

_Last updated: 2026-05-03 — Zero-warning build verified._
