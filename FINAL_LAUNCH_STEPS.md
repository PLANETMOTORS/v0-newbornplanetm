# 🚀 Planet Motors — Final Launch Steps (Manual)

> Complete these 4 steps in order. Each step is a prerequisite for the next.

---

## Step 1 — Set Vercel Production Environment Variables

**Do this BEFORE merging the PR.**

1. Go to: https://vercel.com/planetmotors/v0-newbornplanetm/settings/environment-variables
2. Add/update these variables for **Production** environment:

```
STRIPE_WEBHOOK_SECRET     = whsec_...   (from Stripe Dashboard → Developers → Webhooks → Signing secret)
SANITY_WEBHOOK_SECRET     = <secret>    (from Sanity Manage → API → Webhooks → your webhook secret)
NEXT_PUBLIC_SANITY_DATASET = production
SANITY_API_TOKEN          = sk...       (from Sanity Manage → API → Tokens → write token)
```

3. Also verify these are set (should already be there):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY          (must be sk_live_... not sk_test_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (must be pk_live_...)
TYPESENSE_HOST
TYPESENSE_API_KEY
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

---

## Step 2 — Create Sanity Production Dataset & Seed Documents

1. Go to: https://manage.sanity.io → select project `4588vjsz`
2. Click **Datasets** → **Add dataset** → name it `production` → **Create**
3. Go to: https://v0-newbornplanetm.vercel.app/studio (or run `pnpm dev` locally)
4. Create the **Site Settings** document:
   - Type: `siteSettings`
   - Fill in: dealerName, phone, email, streetAddress, city, province, postalCode
   - Fill in: businessHours, omvicNumber
   - **Publish**
5. Create the **Homepage** document:
   - Type: `homepage`
   - Fill in: heroSection → headline, subheadline, primaryCta
   - Add featuredVehicles (select from inventory)
   - **Publish**
6. Create the **Sell Your Car** document:
   - Type: `sellYourCar`
   - Fill in: heroSection → headline, subheadline
   - **Publish**

---

## Step 3 — Merge the Release PR

1. Go to: https://github.com/PLANETMOTORS/v0-newbornplanetm/pull/new/release/engineering-sprint-2026-04-23
2. Click **Create pull request**
3. Title: `release: Engineering Sprint 2026-04-23 — Garage UI, Health Check, Launch Guide`
4. Review the 5 commits:
   - `chore: Sanity Studio v5 re-audit (#PR1)`
   - `feat: Garage Frontend UI (#PR2)`
   - `chore: production health check script (#PR3)`
   - `docs: Planet Motors Launch Guide (#PR4)`
   - `chore: LAUNCH_STATUS.md + Lighthouse scores`
5. Click **Merge pull request** → **Confirm merge**
6. Vercel will auto-deploy to production (watch: https://vercel.com/planetmotors/v0-newbornplanetm/deployments)

---

## Step 4 — Post-Deploy Health Check

Run immediately after Vercel deployment completes (~2-3 minutes):

```bash
cd /Users/tonisultzberg@icloud.com/v0-newbornplanetm
BASE_URL=https://v0-newbornplanetm.vercel.app bash scripts/production-health-check.sh
```

**Expected result:** 🟢 GO — 52/53 PASS, 0 FAIL

After setting env vars, the webhook endpoints should now return 400/401 instead of 500:
- Stripe webhook: 500 → 400 ✅
- Sanity webhook: 500 → 401 ✅

Re-run health check after env vars are set to confirm full 53/53 PASS.

---

## Quick Reference

| Action | URL |
|--------|-----|
| Vercel env vars | https://vercel.com/planetmotors/v0-newbornplanetm/settings/environment-variables |
| Vercel deployments | https://vercel.com/planetmotors/v0-newbornplanetm/deployments |
| Sanity Manage | https://manage.sanity.io |
| Sanity Studio (prod) | https://v0-newbornplanetm.vercel.app/studio |
| GitHub PR | https://github.com/PLANETMOTORS/v0-newbornplanetm/pull/new/release/engineering-sprint-2026-04-23 |
| Stripe Webhooks | https://dashboard.stripe.com/webhooks |
| Live site | https://v0-newbornplanetm.vercel.app |

---

*Complete all 4 steps in order. The site will be live after Step 3 deploys.*
