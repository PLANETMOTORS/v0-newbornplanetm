# Homepage hero headline — content style guide

This guide is the single source of truth for the words that appear in
the homepage `<h1>`. It exists because the headline has been rewritten
six times by different bots and editors, each time eroding SEO,
trust signals, or both.

If you intend to change the H1 for any reason — read this first.

## Canonical headline (current)

| Layer | Value |
| --- | --- |
| H1 | `Canada's Battery-Health Certified Used EVs` |
| Sub-H1 | `Inspected on 210 points, Aviloo battery-health certified, delivered nationwide — backed by a 10-day money-back guarantee.` |
| CTA primary | `Browse Inventory` → `/inventory` |
| CTA secondary | `Get Pre-Approved` → `/financing/application` |

## Where the words actually live

The homepage hero is **CMS-driven** at runtime, with a code-level
fallback that mirrors the CMS exactly:

1. **Source of truth (production):** Sanity document
   `_id == "homepage"`, fields:
   - `heroSection.headline`
   - `heroSection.subheadline`
   - `heroSection.primaryCta.{label, buttonLabel, url}`
   - `heroSection.secondaryCta.{label, buttonLabel, url}`
2. **GROQ query:** `HOMEPAGE_QUERY` in `lib/sanity/queries.ts`.
3. **Fetcher:** `getHomepageData()` in `lib/sanity/fetch.ts`,
   cached for 300 s with tag `sanity-homepage`.
4. **Server component:** `app/page.tsx` calls the fetcher inside a
   3-second `withTimeout(...)`. If Sanity is slow or down, the page
   still ships with `homepageData = null`.
5. **Renderer:** `components/homepage-content.tsx`. Reads
   `homepageData?.heroSection?.headline ?? null`. If null, renders
   the **hardcoded fallback JSX** — which must match the canonical
   headline above word-for-word.
6. **Revalidation:** Sanity webhook
   (`app/api/webhooks/sanity/route.ts`) calls `revalidateTag(
   "sanity-homepage")` on every homepage mutation, so a CMS change
   is live within a few seconds (no deploy required).

> A change to **either** the Sanity document **or** the code-level
> fallback without updating the other will produce a visible
> headline flicker if Sanity is briefly unreachable. **Always patch
> both.**

## Editorial rules

Every headline candidate must answer **all four** of these in 12
words or fewer:

1. **Who you are** — must contain a category word: `Used EV`, `Used
   Vehicle`, `Used Car`, or `Used Hybrid`.
2. **Where you are** — must include `Canada` (or a Canadian
   region — `Ontario`, `Toronto`, etc.) for geographic SEO.
3. **What the buyer gets** — must reference at least one verifiable
   trust proof from this approved list:
   - `Battery-Health Certified` / `Aviloo Certified`
   - `210-point inspection`
   - `10-day money-back guarantee`
   - `Multi-lender financing`
   - `Canada-wide delivery` / `nationwide delivery`
4. **Why you** — battery-health certification is the moat. The H1
   should foreground it whenever possible.

## Banned phrases (do not use, ever)

These are saturated, generic, or actively erode trust in the used-car
category. Any headline containing one of them is auto-rejected by
review:

- `Find your perfect ride`
- `Find your dream car`
- `Drive the future`
- `The smarter way to buy`
- `Your next vehicle`
- `Buy with confidence` (without a concrete proof point following it)
- `Experience vehicles like…` / `Experience the…`
- `Reimagined`
- `Next-gen` / `Next-generation`
- `Revolutionary`

## Updating the headline

If you have a strong reason to change the H1:

1. Confirm the new candidate satisfies all four editorial rules above.
2. Confirm it is ≤ 12 words and ≤ 65 characters (title-tag budget).
3. Apply the change in **both** places, in this order:
   1. Sanity Studio → `homepage` document → save.
   2. `components/homepage-content.tsx` → update the fallback `<h1>`
      JSX so it matches word-for-word.
4. Open a PR. The PR description must quote the new headline and
   note which trust signals (rule 3) it surfaces.
5. After merge, verify Sanity Vision shows the same string and the
   live homepage renders it within 5 minutes.

## History (for the record)

| Date | Headline | Source | Why retired |
| --- | --- | --- | --- |
| Initial | `Experience vehicles like never before` | v0 bot | Vague hype, no SEO. |
| Premium-features rev | `Buy or Sell Your Car Online` | v0 bot | Commodity wording. |
| Trust-first rev | `Buy Your Next Vehicle With Confidence` | v0 bot | "Confidence" with no proof. |
| Homepage redesign | `The Smarter Way to Buy or Sell Your Car` | v0 bot | "Smarter how?" — no proof. |
| SEO PR | `Canada's Battery-Certified Used EV Dealership` | Copilot (e712dcc1) | Strong SEO but cold tone, ends in "Dealership". |
| PR #493 | `Find Your Perfect Ride` | Copilot via Sanity mutation | Banned phrase per this guide. |
| **Now** | `Canada's Battery-Health Certified Used EVs` | feat/hero-headline-canonical | Locked at both Sanity and code-fallback layers. |
