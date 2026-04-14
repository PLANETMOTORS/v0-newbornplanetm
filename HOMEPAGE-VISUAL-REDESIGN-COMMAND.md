# Homepage Visual Redesign Command — Planet Motors
## What To Do When Changing the Homepage Design, Layout, or Sections

---

## DIRECTIVE TYPE: Advisory & Quality Gate Command
## MODE: Command & Advise ONLY — No code, no formulas. Expert direction only.

---

## CURRENT HOMEPAGE STATE (as of April 14, 2026)

### What exists right now:
- **app/page.tsx** — Main homepage entry point
- **components/homepage-content.tsx** — Full homepage layout component
- **components/homepage-featured-vehicles.tsx** — Vehicle cards section
- **components/vehicle-showcase.tsx** — Hero vehicle carousel

### Section order (current):
1. Hero with vehicle showcase carousel
2. Shop by Category chips (Under $30k, SUVs, Electric, Hybrids, Luxury, Family)
3. 4-Step Process (Browse, Pre-Approve, Purchase, Deliver)
4. Featured Vehicles from Supabase
5. Why Choose Us / Trust section
6. Sell/Trade-In section with quick estimate form
7. Reviews/Testimonials
8. Protection Plans
9. Final CTA
10. The Promise section
11. Footer

### Known broken wiring (FIX DURING ANY REDESIGN):
| What | Problem | Fix Required |
|------|---------|-------------|
| `app/page.tsx` lines 7-15 | Hardcoded `DEFAULT_SITE_SETTINGS` with fake address/phone | Must fetch from Sanity CMS |
| `app/page.tsx` line 24 | `testimonials={[]}` — empty array, not from CMS | Must fetch from Sanity |
| `app/page.tsx` line 25 | `faqs={[]}` — empty array, not from CMS | Must fetch from Sanity |
| Quick Estimate form | "Get Instant Offer" button has no submission handler | Must wire to `/api/trade-in/quote` |
| Console | 3 errors on page load | Must investigate and resolve |
| Featured vehicles | Has hardcoded fallback array if Supabase returns empty | Verify DB has real data |

---

## THE COMMAND — WHEN REDESIGNING THE HOMEPAGE

### STEP 1: BEFORE DESIGNING — Inspect What Already Works

Do NOT start a redesign without first mapping what is currently functional vs broken. Run through the current homepage top to bottom and document:

- Which sections are pulling LIVE data from Supabase or Sanity CMS
- Which sections are using hardcoded/placeholder data
- Which buttons actually navigate or trigger actions
- Which forms actually submit to real endpoints
- Which images load from CDN vs are placeholder/broken
- What console errors exist and why

**Study the competition BEFORE designing:**
- Visit clutch.ca — study their homepage flow, trust signals, vehicle card design, search UX
- Visit carvana.com — study their hero section, 360-degree previews, how-it-works flow, purchase CTA
- Note what they do better than the current Planet Motors homepage
- Note what Planet Motors already does that they don't — keep those advantages

---

### STEP 2: THE DESIGN CHANGE — Figma First, Then Implement

**Create the design in Figma BEFORE touching any code.** This is non-negotiable for homepage redesigns.

When the Figma design is approved and you move to implementation:

**For EVERY section you add, move, or modify, answer these questions BEFORE implementing:**

**A. Data Source**
- Where does this section get its data?
- Is it from Supabase (database), Sanity CMS (content), an API endpoint, or static?
- If static/hardcoded — WHY? Should it be CMS-driven for easy updates?
- If from a data source — verify the query works and returns data
- What happens if the data source returns empty? Section must hide gracefully, not show blank space

**B. Every Button**
- What does this button do when clicked?
- Is it a navigation link (goes to a page) or an action (calls an API)?
- If navigation — does the destination page exist and work?
- If action — does the API endpoint exist and return a proper response?
- Does the button have loading, success, error, and disabled states?
- Is the button large enough to tap on mobile (minimum 44x44px)?

**C. Every Form**
- What API endpoint does this form submit to?
- Does that endpoint exist right now?
- What validation runs on the inputs (client-side AND server-side)?
- What does the user see on success?
- What does the user see on error?
- Is rate limiting active on the endpoint?
- Is CSRF protection active on the endpoint?
- Does submission trigger any emails (confirmation to user, notification to team)?

**D. Every Image**
- Where does this image come from? CDN, Supabase storage, Sanity, or static file?
- Is there a fallback if the image fails to load?
- Does the image have proper alt text for accessibility and SEO?
- Is the image lazy-loaded if it's below the fold?
- Is the image optimized (WebP/AVIF format, responsive srcset)?
- Does Cumulative Layout Shift occur when this image loads? (must not)

**E. Every Link**
- Does the link destination exist?
- Is it using proper Next.js routing (Link component), not raw anchor tags?
- Does it open in the same tab (internal) or new tab (external)?
- Is the link text descriptive for accessibility (not "click here")?

---

### STEP 3: THE WIRING — Connecting Everything Properly

**Homepage data flow must work like this:**

**app/page.tsx (Server Component):**
- Fetch site settings from Sanity CMS — dealership name, phone, email, address, hours
- Fetch testimonials from Sanity CMS — customer reviews with ratings
- Fetch FAQs from Sanity CMS — question/answer pairs
- Fetch featured vehicles from Supabase — inventory data
- Fetch active promotions from Sanity CMS — banners, seasonal offers
- Pass ALL fetched data as props to HomepageContent
- If ANY fetch fails — use graceful fallback, not a page crash
- If a data set is empty — pass empty array, let the component hide that section

**components/homepage-content.tsx (Client Component):**
- Receive ALL data as props — never fetch inside this component
- Render sections conditionally — if testimonials array is empty, don't render the testimonials section (no blank space)
- Every button must have its handler defined
- Every form must have its submission logic
- Every link must point to a real route

**Backend endpoints that homepage features depend on:**
| Feature | Endpoint | Must Be Wired |
|---------|----------|---------------|
| Vehicle search | `/api/v1/vehicles` | Search bar and filter chips |
| Trade-in estimate | `/api/trade-in/quote` or `/api/v1/trade-in` | Quick estimate form |
| Financing pre-approval | `/financing/application` (page) | "Get Pre-Approved" CTA |
| Contact/inquiry | `/api/contact` | Any "Contact Us" buttons |
| Newsletter signup | Email service endpoint | Footer newsletter form (if present) |
| Vehicle detail | `/vehicles/[id]` (page) | Every vehicle card click |
| Inventory browse | `/inventory` (page) | "View All" and category chips |

---

### STEP 4: WHEN CHANGING SECTION ORDER OR REMOVING SECTIONS

**Moving a section:**
- Verify the section still receives its data props after the move
- Verify scroll-to-section anchors (if any) still target the correct position
- Verify the visual flow still makes logical sense (trust signals before purchase CTAs, not after)
- Verify responsive layout doesn't break in the new position

**Removing a section:**
- Verify no other part of the site links to an anchor in that section
- Verify the removed component is not imported elsewhere
- Verify the data that was fetched for that section is also removed from the page fetch (don't fetch data you don't display)
- Verify the page still flows logically without that section

**Adding a new section:**
- Follow the FULL checklist in Step 2 above — every button, form, image, link must be verified
- Add the data source to the page-level fetch in app/page.tsx
- Pass the data as props — never fetch inside the section component
- Test the section with real data AND with empty data
- Test the section on desktop, tablet, and mobile

---

### STEP 5: AFTER EVERY HOMEPAGE CHANGE — Mandatory Checks

**Run these checks after EVERY modification. No exceptions.**

**Functional sweep:**
- Open the homepage in a browser
- Check browser console — ZERO errors allowed
- Click every button on the page — every one must respond
- Submit every form — every one must process
- Click every vehicle card — every one must load the detail page
- Click every navigation link — every one must load a page
- Click every footer link — every one must load a page
- Scroll the entire page — no broken layouts, no dead space, no missing images

**Data verification:**
- Confirm vehicle data is coming from Supabase (not hardcoded fallbacks)
- Confirm testimonials are coming from Sanity CMS (not empty arrays)
- Confirm FAQs are coming from Sanity CMS (not empty arrays)
- Confirm site settings (phone, address) are from CMS (not hardcoded in page.tsx)
- Confirm no "Lorem ipsum", placeholder text, or test data is visible

**Responsive check:**
- Test desktop at 1440px and 1920px
- Test tablet at 768px and 1024px
- Test mobile at 375px, 390px, and 428px
- Test landscape orientation on mobile
- Verify all touch interactions work (swipe carousels, tap buttons)

**Performance check:**
- Page loads under 3 seconds
- No layout shift when images load
- Above-the-fold content appears first
- Images lazy-load below the fold
- No render-blocking resources

**SEO check:**
- H1 tag exists and is unique
- Meta title is under 60 characters and descriptive
- Meta description is under 160 characters with CTA
- All images have alt text
- Structured data is valid (Organization, Vehicle listings)
- Open Graph tags set for social sharing

---

## COMMON MISTAKES TO AVOID DURING HOMEPAGE REDESIGN

| Mistake | Why It Happens | How To Prevent |
|---------|---------------|----------------|
| Button looks good but does nothing | Designer adds button, developer forgets handler | Test every button after implementation |
| Form submits but user gets no feedback | Endpoint exists but no success/error UI | Define success and error states BEFORE building the form |
| Section shows blank space | CMS has no content for that section | Hide section when data is empty, don't render empty containers |
| Hardcoded data left in production | Developer uses placeholders during build, forgets to swap | Search for hardcoded strings before deploying |
| Images break on mobile | Desktop images forced into mobile layout | Use responsive images with srcset and proper aspect ratios |
| New section breaks another section | CSS or layout changes cascade | Test the FULL page after every change, not just the new section |
| Console errors ignored | "It works anyway" mentality | Zero console errors is the standard, investigate and fix all |
| CMS data not connected | Faster to hardcode during development | Wire CMS fetch in the FIRST implementation, not as a follow-up |
| Missing loading states | Data takes time to fetch | Add skeleton/loading UI for every data-driven section |
| SEO regression | H1 changed, meta tags forgotten, heading order broken | Run SEO check after every change |

---

## THE GOLDEN RULES FOR HOMEPAGE CHANGES

1. **Figma first** — Design in Figma, approve, THEN implement. Never design in code.
2. **Wire immediately** — Connect to real data from day one. Never ship hardcoded placeholders.
3. **Every button earns its place** — If it's on the page, it must do something. Remove it or wire it.
4. **Every form completes its journey** — Submit, validate, respond, confirm. Full cycle or don't ship.
5. **CMS for content, Database for data** — Testimonials, FAQs, promotions from Sanity. Vehicles from Supabase. Settings from Sanity. Never hardcode what should be editable.
6. **Test the full page** — Not just the section you changed. Every change can break something else.
7. **Zero console errors** — Treat console errors like production incidents. Fix them.
8. **Mobile is not optional** — Every feature, every button, every form must work on a phone.
9. **Performance is a feature** — A beautiful page that loads in 8 seconds is a failure.
10. **Keep what works INTACT** — Improve, enhance, upgrade. Never break working features to add new ones.

---

*This command governs ALL homepage design changes for ev.planetmotors.ca.*
*Hand this to any designer, developer, or AI before they touch the homepage.*
