# 🚗 Planet Motors — Launch Guide

> **Version:** 1.0 · **Last Updated:** April 2026  
> **Stack:** Next.js 16 · Supabase · Sanity Studio v5 · Stripe · Typesense · Redis · Serwist PWA

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Environment Variables & Secrets](#2-environment-variables--secrets)
3. [Pre-Launch Checklist](#3-pre-launch-checklist)
4. [Deployment Procedure](#4-deployment-procedure)
5. [Post-Deploy Verification](#5-post-deploy-verification)
6. [Sanity Studio Setup](#6-sanity-studio-setup)
7. [Stripe Webhook Configuration](#7-stripe-webhook-configuration)
8. [Emergency Runbooks](#8-emergency-runbooks)
9. [Monitoring & Alerting](#9-monitoring--alerting)
10. [Secrets Rotation Procedure](#10-secrets-rotation-procedure)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  Next.js 16 App Router · Turbopack · Serwist PWA            │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│  Supabase   │  │   Sanity    │
│  Postgres   │  │  Studio v5  │
│  Auth       │  │  (CMS)      │
│  Realtime   │  └─────────────┘
│  Storage    │
└──────┬──────┘
       │
┌──────▼──────────────────────────────┐
│  External Services                   │
│  · Stripe (payments + webhooks)      │
│  · Typesense (search)                │
│  · Redis/Upstash (cache + rate-lim)  │
│  · Aviloo (EV battery reports)       │
│  · HomenetIOL (inventory feed)       │
│  · Drivee (delivery)                 │
└─────────────────────────────────────┘
```

### Key Routes
| Path | Purpose |
|------|---------|
| `/` | Homepage (Sanity CMS) |
| `/inventory` | Vehicle listing (Typesense search) |
| `/vehicles/[id]` | Vehicle Detail Page (VDP) |
| `/garage` | Customer portal (auth-gated) |
| `/studio/[[...tool]]` | Sanity Studio (admin-only) |
| `/admin` | Internal admin dashboard |
| `/api/admin/system-health` | System health JSON (admin-only) |

---

## 2. Environment Variables & Secrets

### Required — App will not start without these

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # NEVER expose client-side

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxx
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=sk...                    # Read/write token for server-side
SANITY_WEBHOOK_SECRET=whsec_...           # Validates incoming Sanity webhooks

# Stripe
STRIPE_SECRET_KEY=sk_live_...             # Use sk_test_ in staging
STRIPE_WEBHOOK_SECRET=whsec_...           # From Stripe Dashboard → Webhooks
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Typesense
TYPESENSE_HOST=xxxx.a1.typesense.net
TYPESENSE_API_KEY=...                     # Admin key (server-side only)
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=...      # Search-only key (safe for client)

# Redis / Upstash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://planetmotors.ca
ADMIN_SECRET=...                          # Internal admin API auth
```

### Optional / Feature-Specific

```bash
# Aviloo (EV battery)
AVILOO_API_KEY=...
AVILOO_WEBHOOK_SECRET=...

# HomenetIOL (inventory feed)
HOMENET_DEALER_ID=...
HOMENET_API_KEY=...

# Drivee (delivery)
DRIVEE_API_KEY=...
DRIVEE_WEBHOOK_SECRET=...

# Google (reviews, maps)
GOOGLE_PLACES_API_KEY=...
GOOGLE_MAPS_EMBED_KEY=...

# Email (Resend / SendGrid)
RESEND_API_KEY=re_...

# Cron security
CRON_SECRET=...
```

### Secrets Management Rules
- ✅ All secrets stored in **Vercel Environment Variables** (never in `.env` committed to git)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` are **server-only** (no `NEXT_PUBLIC_` prefix)
- ✅ Rotate all secrets immediately if a breach is suspected (see §10)
- ✅ Use separate Stripe keys for staging (`sk_test_`) vs production (`sk_live_`)
- ✅ Sanity dataset: `production` for live, `staging` for preview

---

## 3. Pre-Launch Checklist

### Infrastructure
- [ ] Vercel project linked to `main` branch
- [ ] All environment variables set in Vercel (production + preview)
- [ ] Custom domain configured with SSL (Vercel → Settings → Domains)
- [ ] Supabase project on Pro plan (for connection pooling + backups)
- [ ] Supabase daily backups enabled
- [ ] Typesense cluster running and indexed
- [ ] Redis/Upstash instance active

### Stripe
- [ ] Stripe account in live mode
- [ ] Webhook endpoint registered: `https://planetmotors.ca/api/webhooks/stripe`
- [ ] Webhook events enabled: `payment_intent.*`, `checkout.session.*`, `customer.*`
- [ ] `STRIPE_WEBHOOK_SECRET` set from Stripe Dashboard
- [ ] Test payment flow end-to-end in staging

### Sanity Studio
- [ ] Sanity project ID matches `NEXT_PUBLIC_SANITY_PROJECT_ID`
- [ ] Dataset `production` created in Sanity manage
- [ ] CORS origins set: `https://planetmotors.ca`, `https://planetmotors.ca/studio`
- [ ] API token with write access created for server-side mutations
- [ ] Sanity webhook registered: `https://planetmotors.ca/api/webhooks/sanity`
- [ ] Site settings document created in Studio
- [ ] Homepage document created in Studio

### Search
- [ ] Typesense collection `vehicles` created with correct schema
- [ ] Initial index populated: `pnpm typesense:setup`
- [ ] Search-only API key generated and set as `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY`

### Auth
- [ ] Supabase Auth email templates customized (confirm, reset, magic link)
- [ ] Redirect URLs configured in Supabase: `https://planetmotors.ca/auth/callback`
- [ ] Admin emails listed in `lib/admin.ts` → `ADMIN_EMAILS`

### SEO & Analytics

**Crawlers + structured data**
- [ ] `https://www.planetmotors.ca/robots.txt` allows public pages
      and explicitly allows AI recommendation crawlers (`OAI-SearchBot`,
      `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`)
- [ ] `https://www.planetmotors.ca/sitemap.xml` generates with
      ~150 category pages + every public vehicle + image tags
- [ ] `https://www.planetmotors.ca/llms.txt` returns the AI brief
      with URL grammar section
- [ ] JSON-LD validates on a sample VDP via Google Rich Results Test
- [ ] JSON-LD validates on a sample category page (`/cars/electric`)

**Search engine submission (one-time, post-deploy)**
- [ ] Google Search Console property added + verified
- [ ] Sitemap submitted in GSC (`/sitemap.xml`)
- [ ] Top 5 pages requested for indexing in GSC URL Inspection
- [ ] Bing Webmaster Tools site added + sitemap submitted
- [ ] IndexNow API key set (`INDEXNOW_API_KEY` env var)
- [ ] IndexNow key file accessible at `/<key>.txt`

**Analytics (all gated on consent + env var)**
- [ ] `NEXT_PUBLIC_GA_ID` set; GA4 property receives events
- [ ] `NEXT_PUBLIC_GTM_ID=GTM-K9LZ27CK` set; container published
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` set; Meta Events Manager
      receives PageView and Lead events
- [ ] `META_CONVERSIONS_API_TOKEN` set (server-side CAPI deduped via event_id)
- [ ] `NEXT_PUBLIC_TIKTOK_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_PROJECT_ID`,
      `NEXT_PUBLIC_BING_UET_ID`, `NEXT_PUBLIC_SNAPCHAT_PIXEL_ID`
      set if used
- [ ] Vercel Analytics enabled (Speed Insights + Web Analytics)

---

## 4. Deployment Procedure

### Standard Deploy (main → production)

```bash
# 1. Ensure main is clean and tests pass
git checkout main
git pull origin main

# 2. Run production health check against staging first
BASE_URL=https://staging.planetmotors.ca bash scripts/production-health-check.sh

# 3. Merge PR via GitHub (squash merge preferred)
# → Vercel auto-deploys on push to main

# 4. Monitor Vercel deployment logs
# → Vercel Dashboard → Deployments → Latest

# 5. Run health check against production
BASE_URL=https://planetmotors.ca bash scripts/production-health-check.sh
```

### Sanity Studio Deploy

```bash
# Deploy Studio to Sanity's hosted CDN
cd /path/to/project
npx sanity deploy

# Or access via Next.js route (already embedded):
# https://planetmotors.ca/studio
```

### Database Migrations

```bash
# Always run migrations against staging first
supabase db push --db-url postgresql://...staging...

# Then production
supabase db push --db-url postgresql://...production...

# Verify with
supabase db diff
```

---

## 5. Post-Deploy Verification

Run immediately after every production deploy:

```bash
BASE_URL=https://planetmotors.ca bash scripts/production-health-check.sh
```

**Manual spot-checks:**
1. Load homepage → verify hero image, featured vehicles appear
2. Search for "Tesla" → verify results load from Typesense
3. Open a VDP → verify price, images, financing calculator
4. Click "Save" on a vehicle → verify auth redirect works
5. Admin: visit `/api/admin/system-health` → verify all services green
6. Stripe: trigger a test webhook from Stripe Dashboard → verify 200 response

---

## 6. Sanity Studio Setup

### First-Time Setup

```bash
# 1. Install dependencies (already in package.json)
pnpm install

# 2. Extract schema snapshot
npx sanity schema extract

# 3. Generate TypeScript types
npx sanity typegen generate

# 4. Access Studio locally
pnpm dev
# → http://localhost:3000/studio

# 5. Deploy Studio to Sanity CDN (optional)
npx sanity deploy
```

### Required Documents to Create in Studio

| Document Type | Required Fields |
|--------------|----------------|
| `siteSettings` | dealerName, phone, email, address, businessHours |
| `homepage` | heroSection (headline, CTA), featuredVehicles |
| `sellYourCar` | heroSection, benefits, processSteps |

### Webhook Setup

In Sanity Manage → API → Webhooks:
- **URL:** `https://planetmotors.ca/api/webhooks/sanity`
- **Trigger on:** Create, Update, Delete
- **Filter:** `_type in ["siteSettings", "homepage", "vehicle", "blogPost"]`
- **Secret:** Set `SANITY_WEBHOOK_SECRET` to match

---

## 7. Stripe Webhook Configuration

### Register Webhook in Stripe Dashboard

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add endpoint**
3. URL: `https://planetmotors.ca/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`

### Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

### Verify Webhook Signature

The webhook handler at `app/api/webhooks/stripe/route.ts` validates every request using `stripe.webhooks.constructEvent()`. A missing or invalid signature returns HTTP 400 — this is the expected behaviour tested in the health check script.

---

## 8. Emergency Runbooks

### 🔴 Runbook 1: Site is Down (5xx errors)

```bash
# 1. Check Vercel status
open https://www.vercel-status.com

# 2. Check recent deployments
# Vercel Dashboard → Deployments → Rollback to last known good

# 3. Check Supabase status
open https://status.supabase.com

# 4. Check error logs
# Vercel Dashboard → Functions → Logs

# 5. Emergency rollback
git revert HEAD --no-edit
git push origin main
# Vercel auto-deploys the revert
```

### 🔴 Runbook 2: Stripe Payments Failing

```bash
# 1. Check Stripe status
open https://status.stripe.com

# 2. Verify webhook secret hasn't changed
# Stripe Dashboard → Webhooks → Signing secret

# 3. Check webhook delivery logs
# Stripe Dashboard → Webhooks → [endpoint] → Recent deliveries

# 4. Re-send failed webhooks
# Stripe Dashboard → Webhooks → [event] → Resend

# 5. If STRIPE_WEBHOOK_SECRET rotated, update in Vercel:
# Vercel → Settings → Environment Variables → STRIPE_WEBHOOK_SECRET
# Then redeploy: vercel --prod
```

### 🔴 Runbook 3: Search Not Working

```bash
# 1. Check Typesense cluster health
curl https://$TYPESENSE_HOST/health -H "X-TYPESENSE-API-KEY: $TYPESENSE_API_KEY"

# 2. Re-index vehicles
curl -X POST https://planetmotors.ca/api/typesense-sync \
  -H "Authorization: Bearer $ADMIN_SECRET"

# 3. Or setup fresh collection
curl -X POST https://planetmotors.ca/api/typesense/setup \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

### 🔴 Runbook 4: Supabase Auth Broken

```bash
# 1. Check Supabase status
open https://status.supabase.com

# 2. Verify ANON key hasn't expired (they don't expire, but check rotation)
# Supabase Dashboard → Settings → API → anon key

# 3. Check RLS policies haven't been accidentally changed
# Supabase Dashboard → Authentication → Policies

# 4. Test auth directly
curl https://$SUPABASE_URL/auth/v1/health
```

### 🔴 Runbook 5: Sanity Content Not Updating

```bash
# 1. Check webhook delivery in Sanity Manage
# Sanity Manage → API → Webhooks → [webhook] → Logs

# 2. Manually trigger revalidation
curl -X POST https://planetmotors.ca/api/sanity-webhook \
  -H "Authorization: Bearer $SANITY_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"_type":"siteSettings","_id":"siteSettings"}'

# 3. Check Redis for last webhook trigger
# GET system:sanity_webhook:last_trigger

# 4. Force full revalidation
curl -X POST https://planetmotors.ca/api/admin/system-health?action=revalidate \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

### 🔴 Runbook 6: HomenetIOL Inventory Sync Stale

```bash
# 1. Check last sync time
curl https://planetmotors.ca/api/admin/system-health \
  -H "Cookie: [admin-session-cookie]"
# Look for homenetSync.lastSyncAt

# 2. Trigger manual sync
curl -X POST https://planetmotors.ca/api/cron/homenet-sync \
  -H "Authorization: Bearer $CRON_SECRET"

# 3. Check HomenetIOL API status
# Contact HomenetIOL support if API is down
```

---

## 9. Monitoring & Alerting

### Recommended Setup

| Tool | Purpose | Setup |
|------|---------|-------|
| **Vercel Analytics** | Page performance, Core Web Vitals | Enable in Vercel Dashboard |
| **Vercel Speed Insights** | Real-user performance | `@vercel/speed-insights` (already installed) |
| **Supabase Dashboard** | DB queries, auth events, storage | Built-in |
| **Stripe Dashboard** | Payment success rate, disputes | Built-in |
| **UptimeRobot** (free) | Uptime monitoring, alerts | Monitor `https://planetmotors.ca/` |
| **Sentry** (optional) | Error tracking | Add `SENTRY_DSN` env var |

### Key Metrics to Watch

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Homepage load time | < 2s | > 4s |
| Search response time | < 500ms | > 2s |
| Payment success rate | > 98% | < 95% |
| Auth success rate | > 99% | < 97% |
| Supabase DB connections | < 80% pool | > 90% pool |
| Typesense query latency | < 100ms | > 500ms |

### System Health Endpoint

```bash
# Check all services (requires admin auth)
curl https://planetmotors.ca/api/admin/system-health \
  -H "Cookie: [admin-session-cookie]"

# Returns JSON with:
# - sanityWebhook: last trigger time + status
# - homenetSync: last sync time + status  
# - typesense: configured + reachable
# - supabase: connection status
# - redis: connection status
```

---

## 10. Secrets Rotation Procedure

### When to Rotate
- Suspected breach or unauthorized access
- Team member departure
- Quarterly rotation schedule (recommended)
- After any security audit finding

### Rotation Steps

```bash
# 1. Generate new secret (example for webhook secrets)
openssl rand -hex 32

# 2. Update in Vercel
# Vercel Dashboard → Settings → Environment Variables
# → Edit the variable → Save
# → Redeploy: vercel --prod

# 3. Update in the external service
# (Stripe, Sanity, etc.) — update their webhook secret to match

# 4. Verify with health check
BASE_URL=https://planetmotors.ca bash scripts/production-health-check.sh

# 5. Document rotation in team log (date, who, which secret)
```

### Supabase Service Role Key Rotation

```bash
# 1. Generate new key in Supabase Dashboard → Settings → API
# 2. Update SUPABASE_SERVICE_ROLE_KEY in Vercel
# 3. Redeploy
# 4. Revoke old key in Supabase Dashboard
# ⚠️ Do NOT revoke old key before new key is deployed
```

### Stripe Key Rotation

```bash
# 1. Create new restricted key in Stripe Dashboard → Developers → API keys
# 2. Update STRIPE_SECRET_KEY in Vercel
# 3. Redeploy and verify payments work
# 4. Revoke old key in Stripe Dashboard
# ⚠️ Stripe webhook secrets are separate — rotate independently
```

---

## Quick Reference

```bash
# Run health check
BASE_URL=https://planetmotors.ca bash scripts/production-health-check.sh

# Re-index search
curl -X POST https://planetmotors.ca/api/typesense-sync -H "Authorization: Bearer $ADMIN_SECRET"

# Trigger inventory sync
curl -X POST https://planetmotors.ca/api/cron/homenet-sync -H "Authorization: Bearer $CRON_SECRET"

# Sanity schema + types
npx sanity schema extract && npx sanity typegen generate

# Build locally
pnpm build

# Deploy Studio
npx sanity deploy
```

---

*Planet Motors Launch Guide — maintained by the engineering team.*  
*For urgent issues, contact the on-call engineer via the team Slack channel.*
