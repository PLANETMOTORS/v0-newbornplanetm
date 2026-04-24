# Planet Motors — Master QA Test Case Suite

**Project:** Planet Motors (v0-newbornplanetm)
**Stack:** Next.js 16.2 · Supabase · Stripe 18 · Sanity CMS · Serwist PWA · Vercel Edge
**Repo:** https://github.com/PLANETMOTORS/v0-newbornplanetm
**Last Updated:** 2026-04-23
**Status Key:** ✅ Pass · ⚠️ Needs Fix · ❌ Fail · 🔲 Not Run · 🚫 Blocked

---

## A. Core Journey / Sales Funnel

### TC-001 — Vehicle Purchase Funnel (End-to-End)

| Field | Value |
|---|---|
| **Test Case ID** | TC-001 |
| **Module** | Vehicle Purchase Funnel |
| **Priority** | P0 |
| **Severity** | Critical |
| **Preconditions** | Vehicle in Supabase `status = available`; Stripe test env configured; `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel env |
| **Test Data** | Stripe test card `4242 4242 4242 4242`; Ontario postal code `M5V 3A8` |
| **Steps** | 1. Browse `/inventory` → 2. Open `/vehicles/[id]` → 3. Open `/finance/[vehicleId]` → 4. Enter delivery postal code → 5. Proceed to checkout → 6. Complete Stripe payment |
| **Expected Result** | Order confirmation shown; Supabase `deposits.status = succeeded`; vehicle `status = reserved`; `deal_events` row with `event_type = checkout.session.completed` |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Owner** | Engineering Lead |
| **Evidence** | — |
| **Notes** | Stripe webhook at `app/api/webhooks/stripe/route.ts`. Finance calc at `app/finance/[vehicleId]/page.tsx`. Delivery API at `app/api/v1/deliveries/route.ts`. |

---

### TC-002 — Checkout Cancel Path

| Field | Value |
|---|---|
| **Test Case ID** | TC-002 |
| **Module** | Checkout Cancel Path |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | 1. Start checkout → 2. Click Back/Cancel on Stripe hosted page → 3. Return to site via cancel URL |
| **Expected Result** | User lands on cancel page; no `deposits` row marked `succeeded`; vehicle remains `available`; no charge on Stripe |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Owner** | Engineering Lead |
| **Notes** | Webhook handles `checkout.session.expired` → releases vehicle. Verify cancel URL is not hardcoded to localhost. |

---

### TC-003 — Checkout Failure Recovery

| Field | Value |
|---|---|
| **Test Case ID** | TC-003 |
| **Module** | Checkout Failure Recovery |
| **Priority** | P0 |
| **Severity** | Critical |
| **Test Data** | Decline card `4000 0000 0000 0002` then valid `4242 4242 4242 4242` |
| **Steps** | 1. Start checkout → 2. Enter decline card → 3. Retry with valid card |
| **Expected Result** | Clear error on failure; retry possible; single `deposits` row; `payment_intent.payment_failed` webhook fires; successful retry marks succeeded |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Owner** | Engineering Lead |
| **Notes** | `app/api/webhooks/stripe/route.ts` handles `payment_intent.payment_failed` → `upsertDeposit` with failed status. |

---

## B. Stripe / Payments

### TC-010 — Amount Integrity

| Field | Value |
|---|---|
| **Test Case ID** | TC-010 |
| **Module** | Amount Integrity |
| **Priority** | P0 |
| **Severity** | Critical |
| **Steps** | 1. Note on-site total (base + HST 13% + delivery) → 2. Open Stripe Checkout → 3. Compare line items |
| **Expected Result** | Totals match exactly. HST via `PROVINCE_TAX_RATES.ON.hst` from `lib/tax/canada.ts`. Stripe `amount` in cents = frontend total × 100. |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Owner** | Engineering Lead |

---

### TC-011 — Webhook Idempotency

| Field | Value |
|---|---|
| **Test Case ID** | TC-011 |
| **Module** | Webhook Idempotency |
| **Priority** | P0 |
| **Severity** | Critical |
| **Steps** | 1. Trigger `checkout.session.completed` → 2. Replay same event via Stripe Dashboard "Resend" |
| **Expected Result** | Second replay returns HTTP 200 immediately; no duplicate `deposits` or `deal_events` rows; vehicle status unchanged |
| **Actual Result** | ✅ Code verified — `isEventAlreadyProcessed()` checks `deal_events.idempotency_key` (UNIQUE on `source + idempotency_key`); `deposits` uses `stripe_payment_intent_id` UNIQUE upsert |
| **Status** | ✅ Pass (code review) — manual replay test pending |
| **Owner** | Engineering Lead |
| **Notes** | `app/api/webhooks/stripe/route.ts` lines 40–70. Covers: `payment_intent.succeeded`, `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`. |

---

### TC-012 — Success URL Handling

| Field | Value |
|---|---|
| **Test Case ID** | TC-012 |
| **Module** | Success URL Handling |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | 1. Complete payment → 2. Follow Stripe redirect to success URL |
| **Expected Result** | Correct success page loads; `session_id` param present; order state consistent with Supabase |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | Verify success URL is not hardcoded to localhost in Stripe session creation. |

---

### TC-013 — Refund Flow

| Field | Value |
|---|---|
| **Test Case ID** | TC-013 |
| **Module** | Refund Flow |
| **Priority** | P1 |
| **Severity** | High |
| **Steps** | 1. Issue full refund via Stripe Dashboard → 2. Issue partial refund → 3. Check Supabase `deposits` and `deal_events` |
| **Expected Result** | `deposits.status` updated; `deal_events` row inserted; vehicle released on full refund |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

## C. Finance Calculator

### TC-020 — Finance Formula Accuracy

| Field | Value |
|---|---|
| **Test Case ID** | TC-020 |
| **Module** | Finance Formula Accuracy |
| **Priority** | P0 |
| **Severity** | Critical |
| **Test Data** | Price: $45,000; Down: $5,000; Trade-in: $0; APR: 6.99%; Term: 60 months; Ontario HST 13% |
| **Steps** | 1. Open `/finance/[vehicleId]` → 2. Enter test data → 3. Compare output to formula: `P = (L × r) / (1 − (1+r)^−n)` |
| **Expected Result** | Monthly payment matches formula ±$0.01 rounding |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Owner** | Engineering Lead |
| **Notes** | `app/finance/[vehicleId]/page.tsx`. Uses `PROVINCE_TAX_RATES.ON.hst`, `safeNum()` from `lib/pricing/format`. Terms: 24/36/48/60/72/84/96 months. Frequencies: weekly/bi-weekly/semi-monthly/monthly. |

---

### TC-021 — Finance Calculator Edge Inputs

| Field | Value |
|---|---|
| **Test Case ID** | TC-021 |
| **Module** | Finance Calculator Edge Inputs |
| **Priority** | P0 |
| **Severity** | High |
| **Test Data** | Zero down; APR 29.99%; term 96 months; negative values; text input; down > price |
| **Steps** | Enter each edge value and observe output |
| **Expected Result** | Valid cases compute without NaN/Infinity; invalid inputs blocked/sanitized via `safeNum()`; no crash |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

### TC-022 — Tax/Fee Toggle Logic

| Field | Value |
|---|---|
| **Test Case ID** | TC-022 |
| **Module** | Tax/Fee Toggle Logic |
| **Priority** | P1 |
| **Severity** | High |
| **Steps** | 1. Toggle HST on/off → 2. Switch province (if supported) → 3. Verify payment updates |
| **Expected Result** | Payment updates correctly; HST 13% (Ontario) applied when toggled on; no stale values |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

## D. Delivery Calculator (Postal Code)

### TC-030 — Postal Code Validation

| Field | Value |
|---|---|
| **Test Case ID** | TC-030 |
| **Module** | Postal Code Validation |
| **Priority** | P0 |
| **Severity** | High |
| **Test Data** | Valid: `M5V 3A8`, `K1A 0A9`, `V6B 1A1`; Invalid: `12345`, `ABC`, `M5V`, empty |
| **Steps** | Submit each postal code to delivery calculator |
| **Expected Result** | Valid Canadian formats accepted; invalid rejected with clear error; no crash |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | `app/api/v1/deliveries/route.ts` — has `idempotentReplay: true` flag (line 82). |

---

### TC-031 — Service Zone Logic

| Field | Value |
|---|---|
| **Test Case ID** | TC-031 |
| **Module** | Service Zone Logic |
| **Priority** | P0 |
| **Severity** | High |
| **Test Data** | In-zone: Toronto/GTA; Out-of-zone: remote northern Ontario; Out-of-country: US zip |
| **Steps** | Submit in-zone and out-of-zone codes |
| **Expected Result** | In-zone: fee displayed; out-of-zone: "not serviceable" message; no fee for ineligible zones |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

### TC-032 — Delivery API Failure Handling

| Field | Value |
|---|---|
| **Test Case ID** | TC-032 |
| **Module** | Delivery API Failure Handling |
| **Priority** | P1 |
| **Severity** | Medium |
| **Steps** | Simulate timeout (block network in DevTools); submit postal code |
| **Expected Result** | User-friendly error shown; no crash; retry possible |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

## E. Forms & Submission Reliability

### TC-040 — Required Field Validation

| Field | Value |
|---|---|
| **Test Case ID** | TC-040 |
| **Module** | Required Field Validation |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | Submit each form (lead capture, financing application, trade-in, contact, schedule) with empty/partial data |
| **Expected Result** | Required fields flagged client-side; no backend submission on invalid data; errors specific and actionable |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | Forms: financing (`app/api/v1/financing/capture-lead/route.ts`), trade-in, contact, schedule. |

---

### TC-041 — Successful Form Submission

| Field | Value |
|---|---|
| **Test Case ID** | TC-041 |
| **Module** | Successful Form Submission |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | Fill all forms with valid data and submit |
| **Expected Result** | Success message shown; Supabase record created; CRM/email notification triggered |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

### TC-042 — Double Submit Protection

| Field | Value |
|---|---|
| **Test Case ID** | TC-042 |
| **Module** | Double Submit Protection |
| **Priority** | P1 |
| **Severity** | High |
| **Steps** | Click submit 3× rapidly on slow network (throttle in DevTools) |
| **Expected Result** | Single record created; button disabled after first click; no duplicate leads/orders |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

## F. UI / UX Inspection

### TC-050 — Responsive Layout

| Field | Value |
|---|---|
| **Test Case ID** | TC-050 |
| **Module** | Responsive Layout |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | Verify at 375px (iPhone SE), 768px (iPad), 1280px (desktop), 1920px (ultrawide) |
| **Expected Result** | No overlap, cut-off text, or unusable controls at any breakpoint |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | Key pages: `/`, `/inventory`, `/vehicles/[id]`, `/finance/[vehicleId]`, `/blog`. |

---

### TC-051 — Interactive State Visibility

| Field | Value |
|---|---|
| **Test Case ID** | TC-051 |
| **Module** | Interactive State Visibility |
| **Priority** | P1 |
| **Severity** | Medium |
| **Steps** | Hover, focus, active, disabled checks on all buttons, links, inputs |
| **Expected Result** | States visually distinct; no invisible focus rings; disabled controls non-interactive |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

### TC-052 — Modal/Drawer Behavior

| Field | Value |
|---|---|
| **Test Case ID** | TC-052 |
| **Module** | Modal/Drawer Behavior |
| **Priority** | P1 |
| **Severity** | Medium |
| **Steps** | Open/close all modals and drawers (vehicle quick-view, compare, image gallery) |
| **Expected Result** | No background scroll; close controls work; focus trapped; Escape key closes |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

## G. Accessibility

### TC-060 — Keyboard Navigation

| Field | Value |
|---|---|
| **Test Case ID** | TC-060 |
| **Module** | Keyboard Navigation |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | Navigate full funnel using Tab/Shift+Tab/Enter/Space only |
| **Expected Result** | Logical tab order; all controls reachable; visible focus indicator on every element |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | `app/accessibility/` page exists — verify it's not a placeholder. |

---

### TC-061 — Screen Reader Labels

| Field | Value |
|---|---|
| **Test Case ID** | TC-061 |
| **Module** | Screen Reader Labels |
| **Priority** | P1 |
| **Severity** | High |
| **Steps** | Use VoiceOver (macOS/iOS) or NVDA (Windows) on forms, buttons, vehicle cards |
| **Expected Result** | Proper labels/roles/states announced; icon-only buttons have `aria-label`; form errors announced |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

### TC-062 — Offscreen/Hidden Content

| Field | Value |
|---|---|
| **Test Case ID** | TC-062 |
| **Module** | Offscreen/Hidden Content |
| **Priority** | P1 |
| **Severity** | Medium |
| **Steps** | Inspect hidden menu/modal content with screen reader |
| **Expected Result** | Hidden elements have `aria-hidden="true"` or `display:none`; not focusable when closed |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

## H. Performance / Core Web Vitals

### TC-070 — LCP/TTI/TBT/Speed Index Baseline

| Field | Value |
|---|---|
| **Test Case ID** | TC-070 |
| **Module** | CWV Baseline |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | Run Lighthouse on: `/`, `/inventory`, `/vehicles/[id]` (VDP), checkout entry |
| **Expected Result** | LCP < 2.5s; TTI < 3.8s; TBT < 200ms; Speed Index < 3.4s (mobile Moto G4 throttled) |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | SW precache: 261 URLs (23.6MB). 4.16MB chunk `09okea7j~1zn8.js` moved to StaleWhileRevalidate in `chore/zero-latency-mobile`. |

---

### TC-071 — JS/CSS Optimization

| Field | Value |
|---|---|
| **Test Case ID** | TC-071 |
| **Module** | JS/CSS Optimization |
| **Priority** | P1 |
| **Severity** | Medium |
| **Steps** | Audit unused JS/CSS in Chrome Coverage tab on key pages |
| **Expected Result** | Non-critical assets deferred; no render-blocking scripts in `<head>`; unused CSS < 30% |
| **Actual Result** | ⚠️ Known — `09okea7j~1zn8.js` (4.16MB) was in SW precache; moved to runtime cache in `chore/zero-latency-mobile` |
| **Status** | ⚠️ Needs Fix (chunk splitting follow-up) |
| **Notes** | Serwist warning: chunk exceeds `maximumFileSizeToCacheInBytes`. Consider code-splitting. |

---

### TC-072 — DOM Size Risk

| Field | Value |
|---|---|
| **Test Case ID** | TC-072 |
| **Module** | DOM Size Risk |
| **Priority** | P2 |
| **Severity** | Medium |
| **Steps** | Chrome DevTools → Performance → DOM size on `/inventory` and `/vehicles/[id]` |
| **Expected Result** | DOM nodes < 1,500; depth < 32; no excessive reflow hotspots |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | Inventory uses pagination — verify DOM is not rendering all vehicles at once. |

---

## I. Backend Integrity / Dirty Code / Conflicts

### TC-080 — Merge Conflict / Dead Code Check

| Field | Value |
|---|---|
| **Test Case ID** | TC-080 |
| **Module** | Merge Conflict / Dead Code |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | `grep -r "<<<<<<\|>>>>>>\|=======" --include="*.ts" --include="*.tsx" .` |
| **Expected Result** | No conflict markers; no debug artifacts; no stale feature flags |
| **Actual Result** | ✅ No conflict markers found in codebase |
| **Status** | ✅ Pass |
| **Notes** | Dev-only routes (`/mockup`, `/production-readiness`) blocked in production via `middleware.ts`. |

---

### TC-081 — API Contract Consistency

| Field | Value |
|---|---|
| **Test Case ID** | TC-081 |
| **Module** | API Contract Consistency |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | Compare frontend `Vehicle` interface with Supabase schema; compare Stripe session payload with webhook handler |
| **Expected Result** | No schema mismatch; no silent data truncation |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | Finance calculator uses Supabase `vehicles` table directly (not Sanity). Verify `Vehicle` interface in `app/finance/[vehicleId]/page.tsx` matches Supabase column names. |

---

### TC-082 — Inventory Concurrency / Race Condition

| Field | Value |
|---|---|
| **Test Case ID** | TC-082 |
| **Module** | Inventory Concurrency |
| **Priority** | P0 |
| **Severity** | Critical |
| **Steps** | Run `scripts/load-test-checkout-race.ts` — simultaneous purchase attempts on same vehicle |
| **Expected Result** | One successful reservation; others get "vehicle no longer available"; no double-reservation |
| **Actual Result** | ✅ Code verified — `scripts/012_checkout_race_condition_fix.sql` + `scripts/007_race_condition_fixes.sql` implement DB-level locking; `scripts/022_lock_vehicle_accept_allowed_statuses.sql` restricts status transitions |
| **Status** | ✅ Pass (code review) — load test pending |
| **Owner** | Engineering Lead |
| **Notes** | Load test script at `scripts/load-test-checkout-race.ts`. Run against staging before launch. |

---

## J. Analytics / Tracking

### TC-090 — Funnel Event Tracking

| Field | Value |
|---|---|
| **Test Case ID** | TC-090 |
| **Module** | Funnel Event Tracking |
| **Priority** | P0 |
| **Severity** | High |
| **Steps** | Trigger each funnel step; verify in GA4 DebugView or GTM Preview |
| **Expected Result** | Events fire once: `vehicle_view`, `calculator_use`, `form_start`, `form_submit`, `checkout_start`, `payment_success`, `payment_fail` |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |
| **Notes** | UTM tracking schema: `scripts/016_add_utm_tracking.sql`. Verify UTM params captured on checkout session creation. |

---

### TC-091 — UTM Persistence

| Field | Value |
|---|---|
| **Test Case ID** | TC-091 |
| **Module** | UTM Persistence |
| **Priority** | P1 |
| **Severity** | Medium |
| **Steps** | Enter via `?utm_source=google&utm_medium=cpc&utm_campaign=ev-toronto`; complete checkout |
| **Expected Result** | UTM params stored in Supabase order/lead record; attribution preserved through Stripe redirect |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

### TC-092 — Consent Mode

| Field | Value |
|---|---|
| **Test Case ID** | TC-092 |
| **Module** | Consent Mode |
| **Priority** | P1 |
| **Severity** | High |
| **Steps** | Reject all cookie categories; verify no analytics events fire; accept; verify events fire |
| **Expected Result** | Tracking follows consent settings; no GA4/ad pixels fire before consent |
| **Actual Result** | 🔲 Not Run |
| **Status** | 🔲 Not Run |

---

## K. PWA

### TC-100 — Manifest Validity

| Field | Value |
|---|---|
| **Test Case ID** | TC-100 |
| **Module** | Manifest Validity |
| **Priority** | P2 |
| **Severity** | Low |
| **Steps** | Chrome DevTools → Application → Manifest; run Lighthouse PWA audit |
| **Expected Result** | Manifest valid; icons present (32×32, 180×180, 192×192, 512×512, SVG); `start_url = /`; `display_override` includes `window-controls-overlay` |
| **Actual Result** | ✅ `public/manifest.json` updated — `display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"]` added in `chore/zero-latency-mobile` |
| **Status** | ✅ Pass (pending Lighthouse verification) |

---

### TC-101 — Service Worker Cache Behavior

| Field | Value |
|---|---|
| **Test Case ID** | TC-101 |
| **Module** | Service Worker Cache Behavior |
| **Priority** | P1 |
| **Severity** | Medium |
| **Steps** | 1. Load app → 2. Go offline → 3. Navigate to `/~offline` → 4. Come back online → 5. Hard reload — verify no stale pricing |
| **Expected Result** | Offline page shown; fresh data on reconnect; no stale vehicle prices from cache |
| **Actual Result** | ✅ Code verified — API routes use `NetworkOnly`; Supabase excluded from cache; 4.16MB chunk moved to `StaleWhileRevalidate`; Sanity CDN images use `CacheFirst` (content-addressed) |
| **Status** | ✅ Pass (code review) — manual offline test pending |
| **Notes** | SW updated in `chore/zero-latency-mobile`. |

---

## L. Security & Privacy

### TC-110 — HTTPS & Security Headers

| Field | Value |
|---|---|
| **Test Case ID** | TC-110 |
| **Module** | HTTPS & Security Headers |
| **Priority** | P0 |
| **Severity** | Critical |
| **Steps** | `curl -I https://planetmotors.com` or securityheaders.com scan |
| **Expected Result** | HTTPS enforced; `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`; `X-Frame-Options: DENY`; `Content-Security-Policy` present |
| **Actual Result** | ✅ Code verified — `next.config.mjs` lines 111–230: HSTS, X-Frame-Options: DENY, split CSP (strict for main site, permissive for /studio) |
| **Status** | ✅ Pass (code review) — production header scan pending |
| **Notes** | CSP split: strict for main site; relaxed for `/studio` (Sanity requires `unsafe-eval`). |

---

### TC-111 — XSS / Injection Guardrails

| Field | Value |
|---|---|
| **Test Case ID** | TC-111 |
| **Module** | XSS / Injection Guardrails |
| **Priority** | P0 |
| **Severity** | Critical |
| **Test Data** | `<script>alert(1)</script>`, `'; DROP TABLE vehicles; --`, `javascript:alert(1)` |
| **Steps** | Submit malicious strings in: search/filter, form fields, URL params, postal code |
| **Expected Result** | Input sanitized/escaped; no script execution; no SQL error exposed |
| **Actual Result** | ✅ Code verified — `sanitize` imports in: `app/auth/callback/route.ts`, `app/actions/upload-license.ts`, `app/api/v1/financing/capture-lead/route.ts`, `app/api/v1/admin/` routes; Supabase parameterized queries prevent SQL injection |
| **Status** | ✅ Pass (code review) — manual injection test pending |
| **Notes** | Blog slug page uses `sanitize-html` for rendering HTML from `lib/blog-data.ts`. |

---

### TC-112 — Sensitive Data Exposure

| Field | Value |
|---|---|
| **Test Case ID** | TC-112 |
| **Module** | Sensitive Data Exposure |
| **Priority** | P0 |
| **Severity** | Critical |
| **Steps** | 1. Search client bundle for `sk_live`, `whsec_`, `service_role` → 2. Check network tab for PII in URLs → 3. Review Vercel env vars |
| **Expected Result** | No secrets in client bundle; no PII in URLs; all secrets in Vercel env vars only |
| **Actual Result** | ✅ `.env.example` shows placeholder only; `SANITY_API_TOKEN` server-side only; `NEXT_PUBLIC_` prefix only on safe public values |
| **Status** | ✅ Pass (code review) — bundle scan pending |
| **Notes** | Run `grep -r "sk_live\|whsec_\|service_role" .next/static/` after build to confirm no leakage. |

---

## Pre-Launch Sign-Off Matrix

| Area | Owner | Status | Notes |
|---|---|---|---|
| Stripe Checkout | Engineering Lead | 🔲 Not Run | TC-001–013 |
| Finance Calculator | Engineering Lead | 🔲 Not Run | TC-020–022; uses `PROVINCE_TAX_RATES.ON.hst` |
| Delivery Calculator | Engineering Lead | 🔲 Not Run | TC-030–032 |
| Forms | Engineering Lead | 🔲 Not Run | TC-040–042 |
| Mobile UX | QA | 🔲 Not Run | TC-050–052 |
| Desktop UX | QA | 🔲 Not Run | TC-050–052 |
| Performance/CWV | Engineering Lead | ⚠️ In Progress | 4.16MB chunk addressed; Lighthouse pending |
| Accessibility | QA | 🔲 Not Run | TC-060–062 |
| Security | Engineering Lead | ✅ Code Review Pass | TC-110–112; production scan pending |
| Analytics | Marketing | 🔲 Not Run | TC-090–092 |
| SEO | Marketing | 🔲 Not Run | `/sitemap.xml`, `/robots.ts` |
| Backend Stability | Engineering Lead | ✅ Code Review Pass | TC-080–082; race conditions addressed |
| PWA | Engineering Lead | ✅ Code Review Pass | TC-100–101; manifest + SW updated |
| Webhook Idempotency | Engineering Lead | ✅ Code Review Pass | TC-011; `deal_events` UNIQUE constraint |

---

## Exit Criteria (Go/No-Go)

- [ ] All P0 Critical/High issues resolved and retested
- [ ] No payment integrity or order status mismatch defects open
- [ ] Finance and delivery calculators validated with approved sample set
- [ ] Mobile + desktop critical paths signed off
- [ ] Accessibility blockers resolved
- [ ] Analytics funnel verified in production-like conditions
- [ ] Launch owner + engineering lead + business stakeholder sign-off complete

---

## Defect Reporting Format

```
Bug ID:
Linked Test Case ID:
Title:
Environment: (Prod/Staging + browser/device)
Steps to Reproduce:
Expected vs Actual:
Severity / Priority:
Attachments:
Root Cause Suspected:
Assigned Engineer:
Target Fix Version:
```

---

## Human Click-Path Scenarios (Manual Execution Required)

1. Browse inventory → open vehicle → calculate finance → calculate delivery → checkout → payment success
2. Same flow with payment fail/cancel and recovery
3. Same flow on mobile (slow 3G network throttle in DevTools)
4. Multi-tab and back-button behavior through checkout
5. Session timeout and resume behavior
6. Form error correction flow (invalid → corrected → submit success)

---

*Generated from live codebase analysis of PLANETMOTORS/v0-newbornplanetm on 2026-04-23.*
*Stack: Next.js 16.2 · Stripe 18 · Supabase · Sanity CMS · Serwist PWA · Vercel Edge Middleware*
