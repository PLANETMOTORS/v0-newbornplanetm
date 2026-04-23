# Domain Cutover — Config Changes Checklist

**Cutover Date:** Saturday, April 26, 2026  
**Old Domain:** `ev.planetmotors.ca`  
**New Domain:** `www.planetmotors.ca` (canonical), `planetmotors.ca` (apex → www redirect)

---

## Vercel (Engineer — before Saturday)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| Custom domain (www) | _not added_ | `www.planetmotors.ca` | Vercel → Project → Domains |
| Custom domain (apex) | _not added_ | `planetmotors.ca` | Vercel → Project → Domains |
| Apex redirect | — | `planetmotors.ca` → `www.planetmotors.ca` | Vercel auto-configures |
| `NEXT_PUBLIC_SITE_URL` | `https://ev.planetmotors.ca` | `https://www.planetmotors.ca` | Vercel → Env Vars |
| `NEXT_PUBLIC_BASE_URL` | `https://ev.planetmotors.ca` | `https://www.planetmotors.ca` | Vercel → Env Vars |
| SSL | — | Verify green on both domains | Vercel → Domains |

---

## Stripe (Tony — Saturday morning)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| Webhook endpoint URL | `https://ev.planetmotors.ca/api/webhooks/stripe` | `https://www.planetmotors.ca/api/webhooks/stripe` | [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) |
| Webhook signing secret | Keep existing `whsec_...` | Re-generate if URL changes | Env var: `STRIPE_WEBHOOK_SECRET` |
| Checkout success URL | Uses `NEXT_PUBLIC_SITE_URL` | Auto-updates with env var | No manual change |
| Checkout cancel URL | Uses `NEXT_PUBLIC_SITE_URL` | Auto-updates with env var | No manual change |

---

## Resend — Email (Tony — Wednesday–Thursday)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| Sending domain | `planetmotors.ca` | Verify `planetmotors.ca` | [Resend Dashboard → Domains](https://resend.com/domains) |
| DNS records (SPF/DKIM) | — | Add to Cloudflare zone | Resend provides records |
| `FROM_EMAIL` | `notifications@planetmotors.ca` | No change needed | Vercel env var |

---

## Meta / Facebook (Tony — Saturday morning)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| Pixel domain verification | `ev.planetmotors.ca` | `www.planetmotors.ca` | [Meta Business Suite → Settings → Domain Verification](https://business.facebook.com/settings/owned-domains) |
| Conversions API (CAPI) endpoint | Uses server-side `capig.planetmotors.ca` | No change (subdomain stays) | — |
| `NEXT_PUBLIC_META_PIXEL_ID` | Current value | No change needed | Vercel env var |

---

## Google Analytics / GTM (Tony — Saturday)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| GA4 property data stream URL | `ev.planetmotors.ca` | `www.planetmotors.ca` | [GA4 → Admin → Data Streams](https://analytics.google.com/) |
| GTM container | Current | No change needed | — |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Current `G-...` | No change needed | Vercel env var |
| `NEXT_PUBLIC_GTM_ID` | Current `GTM-...` | No change needed | Vercel env var |

---

## Google Search Console (Tony — Saturday)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| Property | `https://ev.planetmotors.ca` | Add `https://www.planetmotors.ca` | [Search Console](https://search.google.com/search-console) |
| Sitemap | `https://ev.planetmotors.ca/sitemap.xml` | Submit `https://www.planetmotors.ca/sitemap.xml` | Search Console → Sitemaps |
| Domain verification | — | Add TXT record to Cloudflare | Search Console → Settings |

---

## Sanity CMS (Engineer — Saturday)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| CORS origins | `https://ev.planetmotors.ca` | Add `https://www.planetmotors.ca` | [Sanity Manage → API → CORS](https://www.sanity.io/manage) |
| Webhook URL | `https://ev.planetmotors.ca/api/sanity-webhook` | `https://www.planetmotors.ca/api/sanity-webhook` | Sanity Manage → API → Webhooks |

---

## AutoRaptor CRM (Tony — Saturday)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| `AUTORAPTOR_ADF_ENDPOINT` | Current URL | No change (external service) | Vercel env var |
| Webhook callback URL (if any) | Check dashboard | Update to `www.planetmotors.ca` | AutoRaptor dashboard |

---

## Cloudflare DNS (Tony — Wednesday–Thursday)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| `planetmotors.ca` A record | — | Vercel IP (`76.76.21.21`) | Cloudflare DNS |
| `www.planetmotors.ca` CNAME | — | `cname.vercel-dns.com` | Cloudflare DNS |
| Proxy status | — | **DNS only** (grey cloud) for Vercel | Cloudflare DNS |
| TTL | Default | **300s** (lowered pre-cutover) | Cloudflare DNS |
| DMARC record | — | `v=DMARC1; p=quarantine; rua=mailto:dmarc@planetmotors.ca` | Cloudflare DNS |

---

## Cloudinary (Engineer — check)

| Setting | Current Value | New Value | Where |
|---------|--------------|-----------|-------|
| Upload presets | Not URL-bound | No change needed | — |
| Notification URL | Check if set | Update if domain-bound | Cloudinary Settings |

---

## Post-Cutover Verification (Tony — Sunday April 27)

- [ ] `https://www.planetmotors.ca` loads correctly in incognito
- [ ] `https://planetmotors.ca` redirects to `https://www.planetmotors.ca`
- [ ] `https://ev.planetmotors.ca` → 301 to `https://www.planetmotors.ca`
- [ ] Spot-check 5 CarPages URLs from CSV → each redirects correctly
- [ ] Contact form submit → email arrives at `info@planetmotors.ca`
- [ ] Stripe test checkout → webhook fires successfully
- [ ] Google Search Console — no crawl errors after 24h
- [ ] `dig planetmotors.ca +ttl` shows TTL ≤ 300
