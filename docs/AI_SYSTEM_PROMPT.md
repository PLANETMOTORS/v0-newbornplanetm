# AI Agent Rules

> Mandatory rules for any AI agent (Devin, Copilot, Cursor, etc.) working in this repository.
> Violations of these rules will break production systems.

---

## Finance Math

- **Do NOT alter `lib/rates.ts` without updating CI tests.** The file `lib/rates.test.ts` has precision assertions for $30k, $50k, and $80k vehicles at 6.29% APR / 72 months. If you change any constant (`RATE_FLOOR`, `DEFAULT_TERM_MONTHS`, `FINANCE_ADMIN_FEE`) or the `calculateBiweeklyPayment()` formula, you MUST update the expected values in the test file. CI will reject the PR if values don't match.

- **Never hardcode rate values.** All rate displays, payment estimates, and AI negotiation fallbacks MUST reference the constants in `lib/rates.ts`. Search for `6.29` or `72` before adding new finance-related code — if you find a hardcoded value, replace it with the constant.

- **The amortization formula is correct.** It uses the standard PMT formula: `P·[r(1+r)^n] / [(1+r)^n − 1]` then converts monthly to bi-weekly via `×12/26`. Do NOT simplify this to `price / term` (that's zero-interest simple division and understates payments by ~17%).

## Sanity CMS

- **Do NOT use Sanity v2 imports.** This project uses Sanity v5 with `defineType`/`defineField` syntax exclusively. The following imports are banned:
  - `part:` prefixed imports
  - `@sanity/desk` (use `sanity/structure` instead)
  - `createSchema` from `@sanity/schema` (use `defineType` instead)
  - Any import from `@sanity/base`

- **Sanity project ID is `wlxj8olw`.** Do not change this. Do not introduce references to the old project ID `4588vjsz`.

- **The CMS repo is `v0-cms-site-build`.** Sanity schemas, Studio components, and CMS-specific code live there — not in this repo. This repo only has the Sanity client (`lib/sanity/`) and GROQ queries.

## Supabase Edge Functions

- **Sensitive API keys live in Supabase Secrets.** AutoRaptor credentials, Resend API keys, and service role keys are NEVER exposed to the browser. They are accessed only within Edge Functions (`supabase/functions/`).

- **Do NOT move Edge Function logic back to Next.js API routes.** The migration from `app/api/v1/financing/` to Supabase Edge Functions was intentional — it hides secrets from browser network requests and reduces latency.

- **Edge Functions use Deno, not Node.** Imports use URL-based modules (`https://esm.sh/`), not npm packages. Check existing functions for patterns before adding new ones.

- **PII must be redacted in Edge Function logs.** Never log full names, emails, phone numbers, SSNs, or credit scores. Use truncation (e.g., `j***@example.com`) if you need to log user identifiers for debugging.

## Visual Regression Testing

- **Always run Playwright VRT before opening UI pull requests.** Any PR that changes VDP layout, the finance form, or mobile CTAs must include updated VRT snapshots. Run: `pnpm exec playwright test e2e/vdp-visual.spec.ts --update-snapshots` if layouts changed intentionally.

- **Do NOT delete VRT snapshot files** (`e2e/vdp-visual.spec.ts-snapshots/`). These are the baselines that protect against CSS regressions.

- **VRT uses 2% pixel diff tolerance.** Minor anti-aliasing differences are acceptable. If your change causes >2% diff, either the layout changed (update snapshots) or you introduced a regression (fix it).

## Authentication Flow

- **The financing form is lead-first, auth-second.** Users fill out the form without logging in. Lead data is captured to the database BEFORE the magic link is sent. Do NOT re-introduce an auth gate (modal, redirect, or guard) before the form submission.

- **Soft credit pulls require authentication.** The `finance-prequalify` Edge Function requires a valid Supabase session token. This only runs after the user clicks the magic link.

## Code Conventions

- **All currency is stored in cents** (integers) in Supabase. Display formatting divides by 100. Do NOT store dollar amounts as floats.

- **Use `tabular-nums` for numeric displays.** The CSS class `tabular-nums` is applied globally to prices, payments, and numeric data. Do NOT use proportional figures for financial numbers.

- **SWR for client-side data fetching.** Social proof, inventory counts, and other dynamic data use SWR. Do NOT use `useEffect` + `fetch` for data that should be cached/revalidated.

- **ISR with 60-second revalidation** for inventory pages. Do NOT set revalidation to 0 (disables caching) or very high values (stale inventory).

## CI Pipeline

- **All PRs must pass CI before merge.** The pipeline runs: lint → test → build → bundle-check → e2e → visual-regression.

- **Bundle budget is 1700 KB first-load JS per page.** If your change exceeds this, the `bundle-check` job will fail. Use dynamic imports or code splitting to stay under budget.

- **Do NOT skip pre-commit hooks** (`--no-verify`). They exist for a reason.

## Security

- **Never commit `.env` files, API keys, or credentials.** Use environment variables via Vercel (production) or `.env.local` (development).

- **CORS on Edge Functions is scoped to Planet Motors domains.** Do NOT add `*` as an allowed origin.

- **RLS (Row Level Security) is enforced on Supabase tables.** Do NOT bypass RLS with the service role key in client-side code. Service role is only for Edge Functions and server-side API routes.
