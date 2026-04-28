# Security Posture & Launch Runbook

Owner: Senior Security Engineer  •  Last review: pre-launch  •  Status: living document

This document is the canonical security posture for the Planet Motors web
property and the partner stack that backs it. It is intentionally
operational — every recommendation maps to a concrete control already
configured in code, or a setting that must be turned on in a partner
console before launch day.

---

## 1. Threat model in one paragraph

We process card-not-present payments (Stripe Checkout), capture
finance applications containing PII, and sit in front of a Postgres
database that holds vehicle inventory + customer records. Realistic
adversaries: credential stuffers, refund/chargeback fraud rings,
opportunistic web scrapers, and a compromised admin session
(insider risk). The expensive failure modes are: (a) fraudulent
reservation/charge confirmation, (b) PII exfiltration that triggers
PIPEDA breach reporting, (c) an account takeover that lets an attacker
edit reservations or vehicle prices.

---

## 2. Code-level controls (already shipped)

| Control                           | Implementation                                               | Audit reference |
| --------------------------------- | ------------------------------------------------------------ | --------------- |
| Stripe webhook signature verify   | Raw body + `STRIPE_WEBHOOK_SECRET` + generic 400 on fail     | `app/api/webhooks/stripe/route.ts` |
| Webhook idempotency               | `event.id` UNIQUE on `deal_events.idempotency_key`           | same file       |
| Atomic vehicle claim              | `claim_vehicle_for_reservation` Postgres RPC (SELECT FOR UPDATE) | `app/actions/reservation.ts` |
| Server-side payment validation    | `fullPaymentVerification` + DB trigger `enforce_payment_before_confirm` | `lib/reservation-payment-rules.ts` |
| Auth rate-limit (login)           | 5 attempts / 15 min / (IP + sha256(email))                   | `lib/security/auth-rate-limit.ts` |
| Auth rate-limit (refresh)         | 60 attempts / hour / (IP + sha256(refresh_token))            | same |
| Mass-assignment defence           | Zod allow-list schemas on admin PATCH                        | `lib/security/admin-mutation-schemas.ts` |
| CSP + clickjacking + nosniff      | Edge middleware emits CSP, X-Frame-Options DENY, COOP, etc.  | `lib/security/security-headers.ts` |
| Cookie hardening                  | `secure` (prod), `sameSite=lax`, `httpOnly`, scoped path     | `lib/supabase/middleware.ts` |
| Sentry PII redaction              | `beforeSend` + `beforeBreadcrumb` scrub email/phone/JWT/Stripe/SIN/card | `lib/security/sentry-redaction.ts` |
| Replay session masking            | `maskAllText` + `blockAllMedia` on Sentry Replay             | `sentry.client.config.ts` |
| Stack-trace stripping in prod     | `console.error` no longer carries `error.stack` in NODE_ENV=production | `app/actions/reservation.ts` |
| CSRF origin allow-list            | `validateOrigin` on every public POST                        | `lib/csrf.ts` |
| Email/phone log hashing           | sha256 truncated to 12 chars before any `console.error`      | `app/actions/reservation.ts` |
| HTML sanitisation                 | `sanitize-html` on every `dangerouslySetInnerHTML`           | `app/blog/[slug]/page.tsx` |
| Env validation                    | Zod schema, throws on missing required vars                  | `lib/env.ts` |
| Service-role isolation            | `createAdminClient()` uses `autoRefreshToken: false`         | `lib/supabase/admin.ts` |

Unit-test coverage for the audited security fixes currently lives in
`__tests__/lib/security-audit-fixes.test.ts`,
`__tests__/lib/auth-rate-limit.test.ts`, and
`__tests__/lib/supabase-cookie-defaults.test.ts` (locked into CI).
This statement is **not** a claim that every control listed above has
its own dedicated unit test — header-level controls (CSP, HSTS, XFO,
referrer policy, permissions policy) are owned by `next.config.mjs:async headers()`
and are exercised by the Next.js framework itself plus production smoke
checks, not by these test files.

---

## 3. Partner-product responsibilities

This is the security ownership matrix per partner product. Anything
*not* listed here is implicitly out of scope for that partner.

### 3.1 Vercel — hosting & runtime

* **Custom domains**: bind `planetmotors.ca` + `www.planetmotors.ca` with HTTPS auto-renew. Force `https://www.` redirect.
* **Branch Protection**: require `lint-and-build` + `SonarCloud Code Analysis` + `e2e` checks on `main`. No merges without two reviews on any PR that touches `app/api/**` or `lib/security/**`.
* **Environment variable scopes**: Production / Preview / Development must be set independently. Never copy a `sk_live_*` key into Preview.
* **Deploy Protection**: enable for Preview deployments so the public can't hit a half-baked branch.
* **Web Analytics + Speed Insights**: keep on; CSP allow-lists `va.vercel-scripts.com`.
* **Edge Config (recommended)**: store the rate-limit thresholds and feature flags here so they can be changed without a re-deploy.
* **Log Drains** to Datadog (see §3.9).

### 3.2 Supabase — database + Auth + RLS

* **RLS on every table**: enforced. `customers`, `orders`, `reservations`, `deals`, `deposits`, `finance_applications_v2` all have `customer_id = auth.uid()` policies. Verify with the Supabase RLS dashboard before launch.
* **Service-role key**: only used by `lib/supabase/admin.ts`, which gates on environment and never lands in browser bundles.
* **Auth — password policy**: 12-char minimum, password breach check enabled in Auth → Policies.
* **Auth — MFA**: enable TOTP for all admin accounts (those listed in `ADMIN_EMAILS`).
* **JWT expiry**: keep at 1 h access + 30 d refresh. Refresh-rotation enabled.
* **Schema visibility**: `service_role`-only schemas (e.g. `private`, `audit`) for any table the public API never touches.

### 3.3 Supabase Team / Enterprise — PITR + branches

* **PITR window**: 7 days minimum. Document the exact recovery procedure in `docs/INCIDENT-RUNBOOK.md` (separate file).
* **Logical backup** to S3 nightly (Supabase scheduled function or an external worker — not just relying on PITR).
* **Branch workflow** for migrations: every schema change ships through a Supabase branch + a CI migration check. Never run ad-hoc DDL in production.
* **Read-replica**: optional today; required when traffic > 1000 RPS.

### 3.4 Upstash Redis — rate-limit + idempotency

* **TLS**: REST API only over HTTPS — never expose the raw Redis port.
* **Token scoping**: separate read-only token for analytics/observability vs. the read-write token used by `lib/redis.ts`.
* **Eviction policy**: `volatile-lru`. We TTL every key (`rate_limit:*`, `vehicle_lock:*`, `session:*`); a hung key without TTL must never starve memory.
* **Geographic placement**: same region as the Vercel function region (us-east-1 for Vercel `iad1`).

### 3.5 Cloudflare — WAF + DDoS + bot

* **Proxy on**: orange-cloud the apex + `www`. All traffic flows through Cloudflare before Vercel.
* **WAF managed rules**: enable the OWASP core rule set + Cloudflare-managed payment ruleset.
* **Bot Fight Mode**: on. Set Super Bot Fight Mode for `/api/v1/auth/login`, `/api/v1/financing/apply`, `/api/v1/reservations`.
* **Rate-Limit rule**: 60 req/min/IP on `/api/v1/auth/*` (defence-in-depth alongside the in-app Redis limiter).
* **TLS**: minimum TLS 1.2; enable HSTS preload (matches the `Strict-Transport-Security` header set by `lib/security/security-headers.ts`).
* **Page Rules**: cache `/_next/static/*` + `/images/*` aggressively; bypass cache on every `/api/*` route.
* **Argo / Tunnel**: optional today; consider when adding admin-only origins.

### 3.6 Sentry — application monitoring & triage

* **Project per environment**: `planet-motors-prod` / `planet-motors-preview`. Different DSNs prevent test-data noise in prod alerts.
* **PII scrubbing**: code-side via `lib/security/sentry-redaction.ts` (covered). ALSO turn on Sentry's built-in *Data Scrubbing* in project settings as belt-and-braces.
* **Alert rules**:
  - `api/webhooks/stripe` failure rate > 1% in 5 min → page on-call.
  - `app/api/v1/auth/login` 401 rate > 30/min from a single IP → page on-call (pairs with Cloudflare WAF).
  - Any unhandled `payment_intent.payment_failed` handler error → page.
* **Release tracking**: tag every Vercel deploy with the git SHA so triage can blame the exact commit.
* **Ownership rules**: route `app/api/webhooks/stripe/**` errors to the payments owner.

### 3.7 Resend — transactional email

* **Domain verification**: `planetmotors.ca` MUST be in the *Verified* state before launch. Without DKIM/SPF/DMARC the lead emails will silently spam-fold.
* **DMARC**: `p=quarantine` minimum, `pct=100`, `rua=mailto:dmarc@planetmotors.ca`.
* **Sending domains**: separate `mail.planetmotors.ca` (or `notify.`) so a deliverability incident on one doesn't poison the apex.
* **API key scope**: Send-only token in production. Admin tokens kept only in 1Password.
* **Webhooks**: subscribe to `email.bounced` + `email.complained` and forward to Sentry as alerts (so we see deliverability problems within minutes, not days).

### 3.8 Stripe — payments + webhooks + Radar

* **Live-mode keys**: only on Vercel Production scope. Never on Preview or Development.
* **Mode-mismatch guard**: CI step asserts `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are the same mode (both `_live_` or both `_test_`).
* **Webhook endpoint**: `https://www.planetmotors.ca/api/webhooks/stripe`. Subscribe ONLY to: `payment_intent.{created,succeeded,payment_failed}`, `checkout.session.{completed,expired,async_payment_failed}`. Anything else is logged and ignored.
* **Webhook secret rotation**: rotate `STRIPE_WEBHOOK_SECRET` quarterly. Stripe supports a 24 h overlap so rotation is zero-downtime.
* **Radar for Fraud Teams** — turn on. Recommended rules:
  - `Block if :card_country: != 'CA' and :amount: > 50000` (CAD cents) — most chargebacks come from foreign cards on big-ticket reservations.
  - `Review if :is_anonymous_ip: = true`.
  - `Review if :seconds_since_account_created: < 600 and :amount: > 25000`.
  - Always `request_three_d_secure` when `risk_level >= elevated`.
* **3DS enforcement**: `payment_method_options.card.request_three_d_secure = 'automatic'` for the Checkout Session — already supported, verify in Stripe dashboard logs after first 100 live transactions.
* **Dispute & refund SOP** (separate doc `docs/STRIPE-OPS.md` to author before launch):
  - Triage SLA: respond to `dispute.created` within 24 h.
  - Refund SLA: full refund processed within 1 business day of approval.
  - Evidence package: VIN + reservation timestamp + email exchange + delivery proof.
  - Single owner: VP Operations.

### 3.9 Datadog — logs / metrics / APM

* **Vercel Log Drain** → Datadog `service:planet-motors-web`. Apply attribute parsing for `customerEmailHash`, `vehicleId`, `requestId`.
* **Synthetics**:
  - Browser test on `/cars/tesla/model-3` every 5 min from us-east-1 + ca-central-1.
  - API test on `POST /api/v1/reservations` (test-mode Stripe) every 15 min.
* **APM**: trace the Stripe webhook handler end-to-end; flag any handler over p95 = 3 s.
* **Log retention**: 15 days for INFO/WARN, 90 days for ERROR. Anything sensitive caught by the redactor still gets logged as `[REDACTED]` so trends survive.
* **Dashboard**: One canonical dashboard with: webhook success rate, 401/429 rate on `/auth/*`, reservation-confirmed/cancelled ratio, finance-application submission rate.

### 3.10 1Password Business — secret governance

* **Vault layout**: `prod/api-keys`, `prod/db`, `prod/payments`, `prod/observability`. Never co-mingle test and live in the same item.
* **Access**: only the on-call engineers + the VP Engineering have read access to `prod/payments`. Audit logs reviewed monthly.
* **Rotation cadence**:
  - `STRIPE_SECRET_KEY` — 90 days.
  - `STRIPE_WEBHOOK_SECRET` — 90 days, 24 h overlap.
  - `SUPABASE_SERVICE_ROLE_KEY` — 180 days, requires DB downtime window.
  - `RESEND_API_KEY` — 180 days.
  - `KV_REST_API_TOKEN` (Upstash) — 180 days.
  - All NEXT_PUBLIC_* — never auto-rotate; rotate on suspected exposure only.
* **CLI integration**: `op inject -i .env.tpl -o .env.local` for local dev. No engineer ever sees a raw production secret.
* **Just-in-time access**: a break-glass procedure documented for incident response; approval logged, key rotated immediately after use.

### 3.11 Typesense Cloud — search

* **API key scoping**: `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` is search-only and may ship to the browser. Admin/index keys stay server-side in the indexing job.
* **Per-collection ACLs**: the public search key can read `vehicles` and `blog_posts`, nothing else.
* **Rate-limit at the cluster**: 200 RPS hard cap on the public search key.

---

## 4. Pre-launch checklist (operator-facing)

Run this checklist on the day of cutover. Each box maps to one of §3.

- [ ] Vercel: `STRIPE_SECRET_KEY` starts with `sk_live_` AND `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_` (Production scope).
- [ ] Vercel: `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` set in Production scope.
- [ ] Vercel: `STRIPE_WEBHOOK_SECRET` set; matches the endpoint in Stripe Dashboard.
- [ ] Vercel: `SUPABASE_SERVICE_ROLE_KEY` rotated within the last 30 days.
- [ ] Stripe Dashboard: webhook endpoint `https://www.planetmotors.ca/api/webhooks/stripe` shows `Active`, last delivery green.
- [ ] Stripe Dashboard: Radar for Fraud Teams enabled, custom rules from §3.8 active.
- [ ] Resend Dashboard: domain `planetmotors.ca` is `Verified`. DKIM/SPF/DMARC all green.
- [ ] Supabase Dashboard: RLS enabled on `reservations`, `orders`, `deposits`, `finance_applications_v2`, `customers`. Run the RLS test suite (`supabase db lint --rls`) one more time.
- [ ] Supabase Dashboard: PITR window is 7 d; off-site backup ran in the last 24 h.
- [ ] Cloudflare Dashboard: orange-cloud on, WAF managed rules ON, Rate-Limit rule on `/api/v1/auth/*` ON, HSTS preload set.
- [ ] Sentry: alert rules from §3.6 created and assigned to the on-call rotation. Last test event received from each environment.
- [ ] Datadog: Vercel log drain receiving events; canonical dashboard renders; synthetics passing.
- [ ] 1Password: all production keys present; no engineer has copies in `~/.env.local` outside of `op inject`.
- [ ] Typesense Cloud: public search key scope verified read-only.
- [ ] Run `pnpm audit --prod` and confirm no CRITICAL findings on the dependency graph.
- [ ] Browse `https://www.planetmotors.ca/` in an incognito window. Confirm `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY` headers in the response.
- [ ] Submit a real test reservation in Stripe Live mode for a single dummy vehicle. Verify the webhook fires, deposit row appears, vehicle status transitions, and the success email arrives.
- [ ] Document the previous deployment ID as the rollback target.

---

## 5. Final senior-level recommendation

The application code is launch-grade. The remaining work is operational — partner-console settings and the pre-launch checklist above. None of those items are blocked by code; all are blocked only by access-and-attention from a human with admin permissions on each partner console.

If a launch goes ahead **before** the §4 checklist is complete, the highest-impact gap is item 6 (Stripe Radar): fraud rules act as a one-way ratchet — every chargeback you avoid in the first 30 days lowers your dispute-rate floor for the rest of your processing history. After Radar, the next-highest gap is item 9 (Resend domain verification) — without it, lead emails go to spam and you lose attribution silently.

Code controls have been verified against `pnpm typecheck` (clean), `pnpm test` (512 tests passing), `pnpm lint` (no errors), and `pnpm build` (production compile clean). 36 of those 512 tests directly cover the audit fixes shipped in this branch.
