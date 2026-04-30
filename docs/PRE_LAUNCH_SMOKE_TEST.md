# Pre-Launch Smoke Test — planetmotors.ca

**Run this top-to-bottom the moment the production deploy goes live.** Each
check is < 2 minutes. The whole runbook takes ~30–45 minutes for one
operator. Cross every box. If any check fails, stop and fix before
announcing the launch.

> Replace `planetmotors.ca` below with whatever apex domain the DNS
> swap actually points to. If the cutover is to a Vercel preview URL
> first, run the runbook there first, then re-run on the apex.

---

## 0  ·  Pre-flight (do this BEFORE you DNS-cut)

| # | Check | Pass criteria |
|---|---|---|
| 0.1 | `vercel env ls` shows all required production vars | `INDEXNOW_KEY`, `NEXT_PUBLIC_SITE_URL`, Supabase keys, Stripe keys, Resend key, GTM/GA4 IDs, `HOMENET_*` |
| 0.2 | Vercel cron schedule for `/api/cron/homenet-sync` is enabled | Vercel dashboard → Settings → Cron Jobs |
| 0.3 | Supabase point-in-time recovery (PITR) is enabled | Supabase dashboard → Database → Backups |
| 0.4 | DNS records ready in Webnames but **not yet swapped** | Cloudflare proxy enabled, name servers ready to flip |
| 0.5 | Most recent Vercel deployment shows green check | Production environment, no failed builds |
| 0.6 | All open PRs that need to land before launch are merged | This runbook assumes #555, safety-guards PR, social-pixels PR, admin-indexnow PR all merged |

**If any of 0.x fails — STOP. Do not flip DNS.**

---

## 1  ·  DNS + TLS (first 10 minutes after cutover)

| # | Check | Command | Pass criteria |
|---|---|---|---|
| 1.1 | DNS resolves to Cloudflare | `dig +short planetmotors.ca` | Returns Cloudflare IPs (104.21.* / 172.67.*) |
| 1.2 | `www.planetmotors.ca` 301-redirects to apex | `curl -I https://www.planetmotors.ca` | `HTTP/2 301` with `location: https://planetmotors.ca/` |
| 1.3 | TLS certificate valid | `curl -vI https://planetmotors.ca 2>&1 \| grep "subject:"` | CN matches, expires > 30 days out |
| 1.4 | HTTP → HTTPS upgrade | `curl -I http://planetmotors.ca` | `HTTP/1.1 301` to https:// |
| 1.5 | HSTS header present | `curl -sI https://planetmotors.ca \| grep -i strict-transport` | `max-age=15552000` or higher with `includeSubDomains` |

---

## 2  ·  Public pages render (first 15 minutes)

Hit each URL in the browser AND with `curl`. Look for **200 OK**, no
console errors, hero image visible, no FOUC.

| # | URL | Check |
|---|---|---|
| 2.1 | `/` | Homepage hero, model carousel, no broken images |
| 2.2 | `/inventory` | Filter sidebar, vehicle cards, infinite-scroll/pagination works |
| 2.3 | `/vehicles/<any-id>` | VDP loads, gallery, JSON-LD in `<head>`, OG tags present |
| 2.4 | `/finance` | Calculator renders, `react-hook-form` validates |
| 2.5 | `/trade-in` | Form renders, file upload works |
| 2.6 | `/contact` | Form posts to `/api/contact` and returns 200 |
| 2.7 | `/about`, `/financing`, `/services` | All load without console errors |
| 2.8 | `/admin` | Redirects to `/sign-in` when not authenticated |
| 2.9 | `/404-fake-url` | Custom 404 page, NOT Next.js default |

---

## 3  ·  SEO surfaces (search engines crawl this stuff first)

| # | URL | Pass criteria |
|---|---|---|
| 3.1 | `/robots.txt` | Returns 200, lists `Sitemap: https://planetmotors.ca/sitemap.xml` |
| 3.2 | `/sitemap.xml` | Returns 200, valid XML, lists all VDPs + static pages |
| 3.3 | `/sitemap-images.xml` | Returns 200, valid XML, image sitemap from PR #552 |
| 3.4 | `/<INDEXNOW_KEY>.txt` | Returns 200 with the key as the only content (NOT 404) |
| 3.5 | View source of any VDP | `<link rel="canonical">` matches the URL exactly |
| 3.6 | View source of `/inventory` | `<link rel="canonical">` is `/inventory` (not `/inventory?page=2`) |
| 3.7 | Run any VDP through https://search.google.com/test/rich-results | `Vehicle` schema valid, no errors |
| 3.8 | Run homepage through https://www.opengraph.xyz | OG image, title, description all populated |
| 3.9 | Run homepage through https://cards-dev.twitter.com/validator | Twitter card preview correct |

---

## 4  ·  Analytics + tracking pixels

> Open the browser **with DevTools → Network tab open** for these.

| # | Check | Pass criteria |
|---|---|---|
| 4.1 | Cookie banner appears on first visit | Bottom-of-screen dialog with Accept All / Reject All / Customize |
| 4.2 | "Reject All" → no analytics network calls | No requests to `googletagmanager.com`, `bat.bing.com`, `clarity.ms`, `analytics.tiktok.com` |
| 4.3 | "Accept All" → GTM container loads | Request to `https://www.googletagmanager.com/gtm.js?id=GTM-XXXX` returns 200 |
| 4.4 | GA4 fires `page_view` | Visible in `https://analytics.google.com → Realtime` within 30s |
| 4.5 | GTM Tag Assistant Chrome extension shows tags firing | https://tagassistant.google.com — tags ✓ |
| 4.6 | TikTok Pixel fires (if env var set) | Network tab → `analytics.tiktok.com/i18n/pixel/events.js` |
| 4.7 | Microsoft Clarity loads (if env var set) | Network tab → `clarity.ms/tag/<id>` |
| 4.8 | Bing UET fires (if env var set) | Network tab → `bat.bing.com/bat.js` + `bat.bing.com/action/0` |

---

## 5  ·  Forms + lead capture (the money path)

| # | Action | Pass criteria |
|---|---|---|
| 5.1 | Submit `/contact` form with test data | Returns success, you receive the email at `ADMIN_EMAIL` within 60s |
| 5.2 | Submit a "Request More Info" CTA on a VDP | Returns success, email received, AutoRaptor ADF webhook fires (check `AUTORAPTOR_ADF_ENDPOINT` logs) |
| 5.3 | Submit `/trade-in` form | Returns success, email received |
| 5.4 | Submit `/finance` pre-qual | Returns success, email received |
| 5.5 | Stripe deposit checkout (if applicable) | Returns to success page, webhook updates DB |
| 5.6 | Live chat widget opens, sends a message | Message visible in chat dashboard |

---

## 6  ·  Admin panel (requires admin login)

| # | Action | Pass criteria |
|---|---|---|
| 6.1 | Sign in with admin email | Lands on `/admin/dashboard` |
| 6.2 | View `/admin/vehicles` list | Shows current inventory, paginated |
| 6.3 | Toggle `featured` on a vehicle, save | Response includes `indexNow: { ok: true, count: 2 }` |
| 6.4 | Open any VDP for the just-edited vehicle | Featured badge visible (if VDP shows it) |
| 6.5 | Create a test vehicle via `/admin/vehicles/new` | 201 + `indexNow: { ok: true }` |
| 6.6 | Delete the test vehicle | 200 + `indexNow: { ok: true }` |

---

## 7  ·  Cron jobs

| # | Check | Pass criteria |
|---|---|---|
| 7.1 | `GET /api/cron/homenet-sync` (manual trigger w/ `CRON_SECRET`) | 200, `success: true`, `safetyAborted: false` |
| 7.2 | Response shows `indexNowPings > 0` if any vehicles changed | Bing/Yandex pinged |
| 7.3 | Vercel cron logs show next scheduled run | Within next 5–15 min |
| 7.4 | Database `vehicles` row count is sensible | Not 0, not absurdly different from CSV size |

---

## 8  ·  Performance (one-time spot check)

| # | Tool | Pass criteria |
|---|---|---|
| 8.1 | https://pagespeed.web.dev — homepage | Mobile LCP < 2.5s, CLS < 0.1, no critical issues |
| 8.2 | https://pagespeed.web.dev — VDP | Mobile LCP < 2.5s, INP < 200ms |
| 8.3 | Lighthouse CI in DevTools — homepage | Performance ≥ 80, Accessibility ≥ 90, SEO ≥ 95 |
| 8.4 | https://gtmetrix.com — homepage | Grade ≥ B |

---

## 9  ·  Search Console + Bing Webmaster (within 24h)

| # | Action |
|---|---|
| 9.1 | Add `planetmotors.ca` to Google Search Console |
| 9.2 | Submit `https://planetmotors.ca/sitemap.xml` in Search Console |
| 9.3 | Submit `https://planetmotors.ca/sitemap-images.xml` |
| 9.4 | Add property to https://www.bing.com/webmasters |
| 9.5 | Submit sitemap to Bing Webmaster |
| 9.6 | Verify IndexNow ownership in Bing Webmaster |
| 9.7 | Add `planetmotors.ca` as a property in Google Analytics 4 |

---

## 10  ·  Monitoring + alerts (within 24h)

| # | Action |
|---|---|
| 10.1 | Sentry: confirm production DSN is set, throw a test error from `/api/_sentry-test`, verify it appears |
| 10.2 | Better Stack / Uptime Robot: monitor `/`, `/inventory`, `/api/health` every 1 min |
| 10.3 | Vercel log drain to Better Stack / Datadog (optional but recommended) |
| 10.4 | Slack / email alert on cron failure (`safetyAborted: true` is the magic string) |
| 10.5 | Cloudflare WAF rules from `docs/cloudflare-waf-rules.json` are deployed |
| 10.6 | Resend: warm up the sending domain if not already, monitor bounce rate |

---

## 11  ·  Final smoke (5 min)

Last thing before announcing:

- [ ] Open the site on iPhone Safari, Android Chrome, desktop Chrome, desktop Safari, desktop Firefox. No layout breakage.
- [ ] Search "Planet Motors Richmond Hill" in Google. If you've claimed your GBP, verify it links to `planetmotors.ca`.
- [ ] Tweet / post the URL — verify the OG card preview is correct.
- [ ] Check `/api/health` returns 200 (write the route from the `health-route.ts.draft` if not already deployed).

---

## Rollback procedure (if anything is on fire)

1. **DNS** — Cloudflare → DNS → temporarily set the apex CNAME back to the previous host.
2. **Vercel** — Deployments → click the last-known-good production deployment → "Promote to Production".
3. **Database** — if a migration broke something, Supabase → Backups → PITR to before the migration.
4. **IndexNow** — no rollback needed; bad pings are filtered server-side by search engines.

Document whatever broke in `docs/POST_LAUNCH_FIXES.md` immediately so it
doesn't get lost in the post-launch fog.

---

**Last updated:** 2026-04-29 (just before launch)
