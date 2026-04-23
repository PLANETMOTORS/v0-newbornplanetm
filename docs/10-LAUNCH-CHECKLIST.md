# ev.planetmotors.ca — Pre-Launch Website Inspection Checklist
### Web Engineer Report — Planet Motors | Next.js 16 + Stripe + Supabase
**Inspector Name:** _________________  
**Date:** _________________  
**Build Version:** _________________  
**Environment:** ☐ Staging ☐ Production

> **Instructions:** Mark every item **✅ Pass / ❌ Fail / — N/A**. Add notes on every failure. No item may be left blank. This report must be signed off before go-live.

## SECTION 1 — ENVIRONMENT & BUILD CONFIGURATION

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 1.1 | Is `.env.local` / production env file fully populated with all required variables (see `.env.example`)? | | |
| 1.2 | Are all **Stripe LIVE keys** (publishable, secret, webhook secret) set — NOT test keys? | | |
| 1.3 | Are all **Supabase production** credentials (URL, anon key, service role key) pointing to production project? | | |
| 1.4 | Are **Typesense** production host + API key + search-only key configured and pointing to live index? | | |
| 1.5 | Are **Sanity** project ID, dataset (`production`), API token, and webhook secret all set? | | |
| 1.6 | Are all **Google** credentials set: GA4 Measurement ID, GTM Container ID, Maps API key, Places API key, Place ID? | | |
| 1.7 | Are **Meta Pixel ID** and **Sentry DSN** (client, server, edge) all pointing to production projects? | | |
| 1.8 | Is **Resend** API key set and sending domain verified in Resend dashboard? | | |
| 1.9 | Are **Upstash Redis** REST URL and token set to production values? | | |
| 1.10 | Is `NEXT_PUBLIC_SITE_URL` set to canonical production domain (no localhost)? | | |
| 1.11 | Is `NODE_ENV=production` confirmed in deployment environment? | | |
| 1.12 | Does `pnpm build` complete with **zero blocking errors**? | | |
| 1.13 | Are all launch **feature flags** set to intended values? | | |
| 1.14 | Are image/CDN domains pointing to production buckets and CDN? | | |
| 1.15 | Are lender/partner API credentials configured for production? | | |
| 1.16 | Is inventory sync cron configured and authenticated? | | |
| 1.17 | Are rate-limiting values set for production traffic expectations? | | |
| 1.18 | Is delivery hub configuration (address + postal + service radius) set correctly? | | |
| 1.19 | Are OTP/SMS credentials configured for verification flows? | | |
| 1.20 | Are preview/test credentials removed from production secrets? | | |

## SECTION 2 — DNS, SSL & DOMAIN

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 2.1 | Does `https://www.planetmotors.ca` resolve correctly with no DNS errors? | | |
| 2.2 | Does `https://ev.planetmotors.ca` redirect to canonical domain as intended? | | |
| 2.3 | Is SSL certificate valid and not expiring within 90 days? | | |
| 2.4 | Does `http://` redirect to `https://` on all URLs? | | |
| 2.5 | Does non-www redirect to www (or vice versa) with 301 as designed? | | |
| 2.6 | Is HSTS configured on production responses? | | |
| 2.7 | Are preview deployment domains blocked from indexing? | | |
| 2.8 | Is deployment project linked to the correct production branch? | | |

## SECTION 3 — SECURITY HEADERS & ACCESS CONTROL

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 3.1 | Are security headers present (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)? | | |
| 3.2 | Is `X-Powered-By` hidden? | | |
| 3.3 | Is CSP active and restricted to approved domains? | | |
| 3.4 | Is `/studio` CSP isolated from public pages where applicable? | | |
| 3.5 | Are Stripe webhook signatures verified for every webhook event? | | |
| 3.6 | Is CSRF protection active on mutable POST endpoints? | | |
| 3.7 | Are admin routes protected and inaccessible without valid admin auth? | | |
| 3.8 | Do unauthenticated admin requests return safe 401/redirect responses? | | |
| 3.9 | Are mutating API routes validating authentication and authorization? | | |
| 3.10 | Is API rate limiting active for financing/contact high-risk routes? | | |
| 3.11 | Are secrets absent from client bundles and browser sources? | | |
| 3.12 | Are all `NEXT_PUBLIC_*` vars non-sensitive? | | |
| 3.13 | Are DB operations protected from injection and unsafe raw query composition? | | |
| 3.14 | Is XSS risk mitigated (no unsafe rendering of unsanitized user input)? | | |
| 3.15 | Is open redirect protection active on auth callback redirects? | | |
| 3.16 | Are Supabase RLS policies enabled on sensitive tables? | | |

## SECTION 4 — PERFORMANCE (CORE WEB VITALS)

> Capture Lighthouse results for **Homepage** (`/`), **Inventory** (`/inventory`), **Vehicle Detail** (`/vehicles/[id]`) on mobile + desktop.

| # | Metric | Target | Mobile | Desktop | ✅❌— |
|---|---|---|---|---|---|
| 4.1 | LCP | ≤ 2.5s | | | |
| 4.2 | TBT | ≤ 200ms | | | |
| 4.3 | CLS | ≤ 0.1 | | | |
| 4.4 | TTI | ≤ 3.8s | | | |
| 4.5 | Speed Index | ≤ 3.4s | | | |
| 4.6 | FCP | ≤ 1.8s | | | |
| 4.7 | Lighthouse Performance | ≥85 mobile / ≥95 desktop | | | |
| 4.8 | Lighthouse Accessibility | ≥95 | | | |
| 4.9 | Lighthouse SEO | ≥95 | | | |
| 4.10 | Lighthouse Best Practices | ≥90 | | | |

## SECTION 5 — JAVASCRIPT / CSS / IMAGES

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 5.1 | Are non-critical scripts deferred/async and non-render-blocking? | | |
| 5.2 | Are third-party tags (GA4/GTM/Meta/Sentry) loaded asynchronously? | | |
| 5.3 | Is Stripe.js loaded only where required for checkout/payment? | | |
| 5.4 | Have bundle chunks been reviewed for unexpectedly large modules? | | |
| 5.5 | Are heavy components loaded with dynamic import where appropriate? | | |
| 5.6 | Is unused JS minimized per Lighthouse findings? | | |
| 5.7 | Is unused CSS minimized and Tailwind content scan paths complete? | | |
| 5.8 | Are render-blocking resources eliminated or justified with notes? | | |
| 5.9 | Are fonts optimized (`font-display: swap`, preload/preconnect where relevant)? | | |
| 5.10 | Are images served via optimized pipeline/CDN and modern formats (AVIF/WebP)? | | |
| 5.11 | Are `<Image>` dimensions set to avoid layout shift? | | |
| 5.12 | Are above-the-fold images prioritized and below-the-fold lazy loaded? | | |
| 5.13 | Are spin viewer/gallery assets lazy loaded instead of all-at-once? | | |

## SECTION 6 — DOM SIZE & CLIENT ERRORS

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 6.1 | Is DOM size below agreed threshold on key pages? | | |
| 6.2 | Are large lists virtualized where expected (inventory grid/list)? | | |
| 6.3 | Are hidden/offscreen UI blocks unmounted when not needed? | | |
| 6.4 | Any duplicate IDs in rendered HTML? | | |
| 6.5 | Any critical HTML validation errors? | | |
| 6.6 | Any `console.error` / unhandled runtime errors on critical flows? | | |
| 6.7 | Any hydration mismatch warnings in browser console? | | |
| 6.8 | Any 404 network failures for scripts/fonts/images/API on load? | | |

## SECTION 7 — MOBILE & DESKTOP UX

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 7.1 | Viewport meta tag present and correct? | | |
| 7.2 | No horizontal overflow on core pages at 360/390/768 breakpoints? | | |
| 7.3 | Nav menu behavior is correct on mobile and desktop? | | |
| 7.4 | Tap targets meet minimum size and spacing on mobile? | | |
| 7.5 | VDP gallery and 360 viewer interactions work on touch + mouse? | | |
| 7.6 | Financing and delivery forms remain usable with virtual keyboard open? | | |
| 7.7 | Checkout steps are fully usable at all breakpoints? | | |
| 7.8 | Sticky header/footer elements do not block primary actions? | | |
| 7.9 | Desktop hover/focus states are visually clear and consistent? | | |
| 7.10 | Compare bar and chat widgets do not obstruct critical content? | | |

## SECTION 8 — FORMS (GENERAL + CONTACT)

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 8.1 | Labels are visible and linked to fields on every form? | | |
| 8.2 | Required-field errors are specific and user-friendly? | | |
| 8.3 | Errors clear once input is corrected? | | |
| 8.4 | Validation runs on both client and server? | | |
| 8.5 | Tab order follows visual order? | | |
| 8.6 | Autocomplete attributes configured correctly? | | |
| 8.7 | Submit buttons prevent duplicate submission? | | |
| 8.8 | Success state shown after submission (toast/message/redirect)? | | |
| 8.9 | Network/API failure shows graceful error feedback? | | |
| 8.10 | Canadian phone and postal formats validate correctly? | | |
| 8.11 | Contact form sends customer confirmation and internal alert? | | |
| 8.12 | Contact leads are recorded in system/CRM without data loss? | | |

## SECTION 9 — FINANCE CALCULATOR

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 9.1 | Monthly payment updates in real-time for term/down payment/rate changes? | | |
| 9.2 | Amortization formula outputs are mathematically correct? | | |
| 9.3 | Total borrowing cost is accurate and clearly displayed? | | |
| 9.4 | Edge cases handled safely (0 down, 0 rate, max term, invalid inputs)? | | |
| 9.5 | Tax/fee handling is correct and clearly disclosed? | | |
| 9.6 | CTA transfers selected values into financing flow correctly? | | |
| 9.7 | Calculator renders correctly from both `/financing` and VDP context? | | |
| 9.8 | Required legal disclaimer (OAC, rates may vary) visible? | | |

## SECTION 10 — DELIVERY CALCULATOR (POSTAL CODE)

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 10.1 | Valid Ontario postal code returns delivery estimate + ETA? | | |
| 10.2 | In-radius postal code returns configured free/discounted fee logic correctly? | | |
| 10.3 | Out-of-radius and interprovincial pricing calculate correctly? | | |
| 10.4 | Invalid postal input returns validation error (no crash)? | | |
| 10.5 | Distance API failures/timeouts show fallback UX (no blank state)? | | |
| 10.6 | Delivery hub origin shown clearly to user? | | |
| 10.7 | Estimate updates without full page reload? | | |
| 10.8 | Delivery estimate carries into checkout totals correctly? | | |
| 10.9 | Taxes on delivery fee calculated and displayed correctly? | | |

## SECTION 11 — STRIPE CHECKOUT & PAYMENT RELIABILITY

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 11.1 | Stripe.js loads from `https://js.stripe.com` only? | | |
| 11.2 | Payment element/form renders correctly on mobile + desktop? | | |
| 11.3 | Staging success, decline, and 3DS test paths behave correctly? | | |
| 11.4 | Successful payment leads to confirmation page with correct details? | | |
| 11.5 | Webhook endpoint receives and processes `payment_intent.succeeded` correctly? | | |
| 11.6 | Invalid webhook signatures are rejected safely? | | |
| 11.7 | Webhook retry/idempotency prevents duplicate orders? | | |
| 11.8 | Vehicle/order status updates after successful payment? | | |
| 11.9 | Refunds synchronize order status correctly? | | |
| 11.10 | Production uses LIVE dashboard + CAD currency as intended? | | |
| 11.11 | Receipt/confirmation email sent after purchase? | | |
| 11.12 | Double-click pay protection prevents double charge? | | |

## SECTION 12 — MULTI-STEP CHECKOUT FLOW

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 12.1 | Vehicle summary step shows correct vehicle and pricing data? | | |
| 12.2 | Payment type branching (cash vs finance) routes correctly? | | |
| 12.3 | Personal info validation gates progression correctly? | | |
| 12.4 | Trade-in step optionality and value application work correctly? | | |
| 12.5 | Financing offers/selection step loads and persists selection? | | |
| 12.6 | Deal customization options update totals accurately? | | |
| 12.7 | Back navigation retains previously entered data? | | |
| 12.8 | Progress indicator accurately reflects current step? | | |
| 12.9 | Refresh/resume behavior preserves step state or gives clear recovery path? | | |
| 12.10 | Vehicle reservation lock prevents simultaneous purchase race condition? | | |
| 12.11 | Reservation release occurs correctly on abandon/timeout? | | |
| 12.12 | Grand total is consistent across all steps and final payment? | | |

## SECTION 13 — FINANCING APPLICATION & VERIFICATION

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 13.1 | Multi-step financing application completes without blocking errors? | | |
| 13.2 | Data persistence between steps works both directions? | | |
| 13.3 | OTP verification send/check endpoints work for valid + invalid/expired codes? | | |
| 13.4 | Confirmation email sent on successful submission? | | |
| 13.5 | Submission appears in admin finance dashboard promptly? | | |
| 13.6 | Lender/bureau integrations return expected responses? | | |
| 13.7 | Sensitive financial data is never logged insecurely? | | |
| 13.8 | PIPEDA-style explicit consent capture is required before submission? | | |

## SECTION 14 — TRADE-IN, SEARCH, INVENTORY, VDP

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 14.1 | Trade-in VIN decode and valuation flows function correctly? | | |
| 14.2 | Trade-in photo uploads work and associate with quote? | | |
| 14.3 | Trade-in fallback UX works when provider API is unavailable? | | |
| 14.4 | Typesense search returns relevant results and autocomplete is performant? | | |
| 14.5 | Filters combine correctly, clear-all works, and state persists as expected? | | |
| 14.6 | Inventory pagination/infinite-scroll has no duplicates/skips? | | |
| 14.7 | Vehicle status badges reflect real-time state accurately? | | |
| 14.8 | VDP image/gallery/swipe/360/specs/price blocks all function correctly? | | |
| 14.9 | "Reserve This Vehicle" CTA opens reservation modal and submits successfully? | | |
| 14.10 | "Apply for Financing" CTA pre-fills vehicle details in financing flow? | | |
| 14.11 | "Schedule Test Drive" CTA routes to schedule page with preselected vehicle? | | |
| 14.12 | "Add to Favorites" persists after refresh/re-login for authenticated users? | | |
| 14.13 | Empty states render correctly when no inventory matches filters? | | |

## SECTION 15 — AUTHENTICATION & ACCOUNT FLOWS

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 15.1 | Sign-up creates user and sends verification email? | | |
| 15.2 | Email verification confirms account and routes correctly? | | |
| 15.3 | Sign-in success/failure messages are correct and safe? | | |
| 15.4 | Password reset flow is fully functional end to end? | | |
| 15.5 | Sign-out clears session and protected routes enforce auth? | | |
| 15.6 | Return URL redirect works after successful login? | | |
| 15.7 | Session expiry/refresh logic works as intended? | | |
| 15.8 | OAuth login (if enabled) functions with correct callback config? | | |

## SECTION 16 — ACCESSIBILITY, SEO, ANALYTICS, PWA

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 16.1 | Keyboard navigation works across global nav, forms, dialogs, checkout? | | |
| 16.2 | Focus order is logical and focus indicator always visible? | | |
| 16.3 | Custom controls have labels/roles/states for assistive tech? | | |
| 16.4 | Landmark structure (`main`, `nav`, etc.) and heading hierarchy are valid? | | |
| 16.5 | Contrast ratios and text scaling behavior meet accessibility expectations? | | |
| 16.6 | Metadata/canonicals/sitemap/robots are configured correctly for production? | | |
| 16.7 | Structured data validates for key pages (organization, vehicle/product, FAQ)? | | |
| 16.8 | GA4/GTM/Meta events fire correctly once (no duplicates)? | | |
| 16.9 | Funnel events cover key conversions (calculator, lead submit, checkout start/success)? | | |
| 16.10 | Consent and cookie preferences correctly gate non-essential tracking? | | |
| 16.11 | PWA manifest/service worker behavior is correct (if enabled)? | | |

## SECTION 17 — GO / NO-GO SIGN-OFF

| # | Gate | ✅❌— | Notes |
|---|---|---|---|
| 17.1 | No open P0 (critical) defects remain. | | |
| 17.2 | No unresolved payment integrity issues remain. | | |
| 17.3 | Finance and delivery calculators validated and approved. | | |
| 17.4 | Mobile and desktop critical user journeys are signed off. | | |
| 17.5 | Monitoring/alerts and rollback plan are confirmed. | | |
| 17.6 | Engineering Lead sign-off complete. | | |
| 17.7 | Product/Business sign-off complete. | | |

## SECTION 18 — HUMAN CLICK TEST MATRIX (MANDATORY)

| # | Scenario | ✅❌— | Evidence |
|---|---|---|---|
| 18.1 | Desktop happy path: inventory → VDP → finance calc → delivery calc → checkout → payment success. | | |
| 18.2 | Mobile happy path (iOS Safari): same flow with touch gestures and keyboard entry. | | |
| 18.3 | Mobile happy path (Android Chrome): same flow including Stripe step and confirmation. | | |
| 18.4 | Declined card flow: user sees friendly message and can retry with successful payment. | | |
| 18.5 | User cancels Stripe and returns to site with state preserved/recovery CTA. | | |
| 18.6 | Mid-checkout refresh/back navigation does not lose critical entered data unexpectedly. | | |
| 18.7 | Abandoned checkout releases reservation after timeout and inventory status recovers. | | |
| 18.8 | Contact form invalid → corrected → successful submit with confirmation path. | | |
| 18.9 | Finance application OTP invalid/expired/valid code paths behave correctly. | | |
| 18.10 | Delivery calculator handles valid, invalid, and external province postal code entries. | | |

## SECTION 19 — DIRTY CODE, CONFLICTS & RELEASE HYGIENE

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 19.1 | No unresolved merge markers (`<<<<<<<`, `=======`, `>>>>>>>`) anywhere in repository. | | |
| 19.2 | No dead debug code (`console.log`, temporary TODO bypasses, test stubs) in production paths. | | |
| 19.3 | No TODO/FIXME in critical modules without linked ticket and risk acceptance. | | |
| 19.4 | No duplicate env keys or conflicting config values across deployment environments. | | |
| 19.5 | API contract changes documented and coordinated between frontend/back-end teams. | | |
| 19.6 | Database migrations are ordered, idempotent where needed, and applied in target environment. | | |
| 19.7 | No race-condition regressions in reservation/order creation under concurrent requests. | | |
| 19.8 | Error handling returns user-safe messages (no stack traces/secrets exposed to clients). | | |

## SECTION 20 — CROSS-BROWSER / DEVICE CERTIFICATION

| # | Target | ✅❌— | Notes |
|---|---|---|---|
| 20.1 | Chrome (latest) desktop: full critical path pass. | | |
| 20.2 | Safari (latest) desktop: full critical path pass. | | |
| 20.3 | Firefox (latest) desktop: full critical path pass. | | |
| 20.4 | Edge (latest) desktop: full critical path pass. | | |
| 20.5 | iOS Safari (latest): mobile core path pass (forms, checkout, calculators). | | |
| 20.6 | Android Chrome (latest): mobile core path pass (forms, checkout, calculators). | | |
| 20.7 | iPad/tablet layout and interactions pass without clipping/blocked actions. | | |
| 20.8 | No blocking browser-specific UI regressions or script errors in console. | | |

## SECTION 21 — MONITORING, ALERTING & INCIDENT READINESS

| # | Question | ✅❌— | Notes |
|---|---|---|---|
| 21.1 | Sentry release is tagged and source maps uploaded for current deployment. | | |
| 21.2 | Alerts configured for checkout failure spikes, webhook failures, and elevated 5xx rates. | | |
| 21.3 | Synthetic uptime check is enabled for homepage, inventory, and checkout entry points. | | |
| 21.4 | Stripe webhook failure alerting + retry visibility dashboard is active. | | |
| 21.5 | On-call escalation path and contact roster are current and available to launch team. | | |
| 21.6 | Rollback procedure tested/documented with owner and maximum recovery time stated. | | |

## SECTION 22 — FINAL EVIDENCE PACKAGE (ATTACHMENTS REQUIRED)

| # | Required Artifact | ✅❌— | Link |
|---|---|---|---|
| 22.1 | Test execution matrix with all checklist item results. | | |
| 22.2 | Screen recording of successful desktop checkout journey. | | |
| 22.3 | Screen recording of successful mobile checkout journey. | | |
| 22.4 | Stripe reconciliation sheet (site totals vs Stripe vs DB). | | |
| 22.5 | Finance calculator validation sheet (formula + sample calculations). | | |
| 22.6 | Delivery calculator validation sheet (postal code sample matrix). | | |
| 22.7 | Open defect list with severity, owner, ETA, and launch impact. | | |
| 22.8 | Signed Go/No-Go approval snapshot from Engineering + Product + QA. | | |

---

## Defect Log (Attach as needed)

| Defect ID | Section | Severity | Summary | Owner | ETA | Status |
|---|---|---|---|---|---|---|
| | | | | | | |

## Final Approval

- **Engineering Lead:** ____________________   **Date:** ______________
- **QA Lead:** ____________________   **Date:** ______________
- **Product/Business Owner:** ____________________   **Date:** ______________

*Document Version: 2.1*
*Last Updated: April 16, 2026*
