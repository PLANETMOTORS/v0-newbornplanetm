# David's Pre-Launch Test Plan — Planet Motors

## What Changed / Context
This is a comprehensive pre-launch verification covering infrastructure, CI/CD, data pipeline, and acceptance gates for the Monday launch of ev.planetmotors.ca. The site uses Next.js on Vercel with Supabase auth, Stripe payments, and Vercel Blob storage.

## What I Will Test

### A. Infrastructure & CI/CD Gates (Shell-only, no recording needed)
Already completed programmatically. Results:

| Gate | Test | Result |
|------|------|--------|
| Gate 1 | `pnpm build` passes | **PASS** — 58 routes built successfully |
| Gate 1 | `tsc --noEmit` | **CONDITIONAL** — 0 errors in app code; 20 errors in e2e tests + missing packages (typesense, ssh2) |
| Gate 1 | `any` drift | **PASS** — only 6 occurrences in app code (typesense + VDP page) |
| Gate 2 | `vitest run` | **CONDITIONAL** — 109/109 tests pass; 1 suite fails (typesense missing package) |
| Gate 3 | Bundle budget (1700 KB) | **PASS** — 58/58 pages within budget; max 1581 KB (/vehicles/[id]) |
| Gate 4 | Staging monitor | **PASS** — Vercel cache HIT, warm TTFB 95-131ms |
| Gate 5 | Integration tests | See CI — 12/12 checks passed on PR #242 |
| Gate 6 | Security headers | **PASS** — CSP, HSTS, X-Content-Type-Options, X-Frame-Options all present |
| Gate 6 | OMVIC disclaimers | **PARTIAL** — present on homepage (2) and financing (2), missing on inventory (0) |
| Gate 7 | Production promote | **MANUAL** — requires GitHub Environments setup verification by admin |

### B. Product Acceptance Gates (Browser testing — WILL RECORD)

**TEST B1: Homepage renders with correct product rules**
- Navigate to https://ev.planetmotors.ca/
- **Assert**: Title = "Planet Motors | Premium Used Car Dealership - Nationwide Delivery"
- **Assert**: OG tags present (og:title, og:description, og:url, og:image)
- **Assert**: Hero section visible with CTA buttons
- **Assert**: No JS console errors

**TEST B2: Inventory grid loads and is functional**
- Navigate to https://ev.planetmotors.ca/inventory
- **Assert**: Page title contains "Inventory" or "Browse"
- **Assert**: Grid/list layout renders (vehicle cards visible OR "no vehicles" message)
- **Assert**: Search input present (data-testid="typesense-search-input")

**TEST B3: VDP page renders correctly**
- Navigate to https://ev.planetmotors.ca/vehicles (landing page)
- **Assert**: Page renders without crash, shows vehicle browsing interface

**TEST B4: Financing shell renders with form validation**
- Navigate to https://ev.planetmotors.ca/financing
- **Assert**: Title = "Auto Financing & Pre-Approval | Planet Motors"
- Click "Apply Now" or navigate to /financing/application
- **Assert**: Step 1 form renders with required fields (First Name, Last Name, Email, Phone)
- Click "Continue" without filling any fields
- **Assert**: Validation errors appear listing "First Name is required", "Last Name is required", etc.
- **Assert**: User CANNOT proceed to Step 2 without completing Step 1

**TEST B5: Protection shell renders**
- Navigate to https://ev.planetmotors.ca/protection-plans
- **Assert**: Title = "PlanetCare Protection Packages | Planet Motors"
- **Assert**: Protection plan options visible

**TEST B6: Finance application ID upload page renders**
- Navigate to https://ev.planetmotors.ca/financing/verification
- **Assert**: Page renders with "Identity Verification" heading
- **Assert**: ID Type dropdown present (Driver's License, Passport, etc.)
- **Assert**: Front image upload input present (name="id-front-upload")
- **Assert**: Back image upload input present (name="id-back-upload")
- Attempt to upload a test image file to front upload
- **Assert**: Image preview renders in the upload area

**TEST B7: SEO & Compliance verification (browser)**
- Navigate to https://ev.planetmotors.ca/robots.txt
- **Assert**: Contains "User-Agent: GPTBot" with "Disallow: /"
- **Assert**: Contains "Sitemap:" reference
- Navigate to https://ev.planetmotors.ca/trade-in
- **Assert**: OG tags present in page source
- Navigate to https://ev.planetmotors.ca/used-cars/toronto
- **Assert**: Page renders with city-specific content

### C. Auth & Payments Testing Constraints

**IMPORTANT BLOCKERS:**
- `/api/v1/financing/apply` requires Supabase authentication (returns 401 without auth)
- `/api/v1/id-verification` requires Supabase authentication (returns 401 without auth)
- Stripe Identity integration requires live Stripe keys + authenticated user
- **Cannot test**: Full finance form submission → confirmation number generation
- **Cannot test**: ID upload submission to backend → Vercel Blob storage
- **Cannot test**: Full Supabase auth flows without test credentials
- **Can test**: Form UI rendering, validation, file picker interaction

### D. Key Assertions Summary

| Assertion | Expected | Method |
|-----------|----------|--------|
| Build passes | Exit code 0 | Shell |
| All 58 pages within 1700KB budget | 0 over budget | Shell |
| 4 security headers present | CSP, HSTS, X-Content-Type, X-Frame | curl |
| Homepage title correct | "Planet Motors \| Premium Used Car Dealership..." | Browser |
| Financing validation blocks empty submit | Error messages appear | Browser |
| ID upload page renders with file inputs | Upload elements visible | Browser |
| robots.txt blocks AI crawlers | GPTBot disallowed | Browser |
| TTFB under 1s (cold) / under 200ms (warm) | All pages pass | curl |
| Vercel cache HIT on static pages | x-vercel-cache: HIT | curl |
| Confirmation number format | `PM-FA-{ts}-{rand}` | Code review only (auth blocked) |
