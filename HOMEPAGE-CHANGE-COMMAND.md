# Homepage Change Command — Planet Motors
## Mandatory Wiring & Connection Checklist for ANY Homepage Modification

---

## DIRECTIVE TYPE: Advisory & Quality Gate Command
## ROLE: Senior Staff Engineer / Technical Director
## MODE: Command & Advise ONLY — No code, no formulas, no snippets. Expert-level direction for ensuring zero broken wiring when the homepage is modified.

---

## RULE #1 — THE GOLDEN RULE

**Every visible element on the homepage MUST connect to something real.**

No dead buttons. No placeholder forms. No links to nowhere. No features that look functional but do nothing. If it is on the page, it MUST work. If it is not ready, it MUST NOT be on the page. There is no middle ground.

---

## 2. BEFORE YOU TOUCH THE HOMEPAGE — MANDATORY INSPECTION

Before making ANY change to the homepage, you MUST perform a full audit of the current wiring state. Do not skip this.

### 2A. Current Homepage Wiring Map (Inspect & Verify)

**Navigation & Header:**
- Verify the main navigation links resolve to real, working pages
- Verify all dropdown/submenu items (Shop Inventory, Sell/Trade, Finance, etc.) lead to functional routes
- Verify the logo links back to homepage
- Verify mobile hamburger menu opens and all items inside it work
- Verify the search bar (if present) triggers a real search with results
- Verify auth buttons (Sign In / Account) connect to the authentication flow

**Hero Section:**
- Verify the primary CTA button links to a real, populated page (e.g., `/inventory`)
- Verify secondary CTA buttons link to correct destinations (e.g., `/trade-in`)
- Verify any vehicle carousel/showcase pulls LIVE data from the database (Supabase `vehicles` table), not hardcoded placeholder data
- Verify carousel navigation (arrows, dots, swipe) actually changes the displayed content
- Verify "View Details" or vehicle cards link to the correct `/vehicles/[id]` page with real data

**Shop by Category / Filter Chips:**
- Verify each category chip (Price range, Body type, Fuel type, EV filter, etc.) navigates to `/inventory` with the correct query parameters pre-applied
- Verify the inventory page correctly reads and applies those filter parameters
- Verify the results shown actually match the filter (not just an unfiltered inventory dump)

**Featured Vehicles Section:**
- Verify vehicles are fetched from the live database, NOT from hardcoded fallback arrays
- Verify each vehicle card displays real data: year, make, model, price, mileage, image
- Verify each vehicle card links to the correct detail page (`/vehicles/[id]`)
- Verify the "View All Inventory" button leads to the full inventory page
- Verify images load from the CDN/storage, not broken placeholder URLs

**Trade-In / Quick Estimate Section:**
- Verify the form inputs (Year/Make/Model, Mileage, Email) are functional and accept user input
- Verify the "Get Instant Offer" or equivalent submit button triggers a real API call to a backend endpoint (e.g., `/api/trade-in/quote`)
- Verify form validation exists: required fields, email format, mileage range
- Verify the user receives a response (success message, error handling, redirect to results)
- Verify rate limiting is active to prevent spam/abuse
- **If the form is not wired to a backend endpoint, DO NOT display it on the page**

**How It Works Section:**
- Verify each step links to the relevant page (Browse → `/inventory`, Finance → `/financing`, Deliver → `/delivery`)
- Verify any "Learn More" button leads to a real, populated page

**Testimonials / Reviews Section:**
- Verify testimonials are fetched from Sanity CMS, NOT from hardcoded arrays
- Verify if CMS returns empty data, the section gracefully hides (not empty blank space)
- Verify star ratings, customer names, and review text render correctly

**FAQ Section:**
- Verify FAQs are fetched from Sanity CMS
- Verify accordion/expand-collapse functionality works
- Verify if CMS returns empty data, the section gracefully hides

**Protection Plans / Warranty Section:**
- Verify each plan CTA links to a real page with actual plan details (not an anchor to nothing)
- Verify pricing information (if displayed) comes from a data source, not hardcoded
- Verify "Learn More" buttons on each plan resolve to detailed plan pages

**Financing Section:**
- Verify "Get Pre-Approved" links to a working financing application page (`/financing`)
- Verify any calculator widget performs real calculations
- Verify the application form submits to a real backend endpoint

**Footer:**
- Verify every single link in the footer resolves to a real, working page
- Verify contact information (phone, email, address) is accurate and consistent site-wide
- Verify social media links open the correct profiles in new tabs
- Verify legal links (Privacy Policy, Terms of Service) lead to populated pages
- Verify the newsletter signup form (if present) submits to a real email service

---

## 3. WHEN ADDING A NEW SECTION OR FEATURE TO THE HOMEPAGE

Follow this checklist for EVERY new element:

### 3A. Button & CTA Wiring Checklist

For every new button or CTA added:

1. **Where does it go?** — Define the exact destination route or action BEFORE placing the button
2. **Does the destination exist?** — Verify the target page/endpoint is built and functional
3. **Is it a link or an action?** — Links navigate to pages. Actions trigger API calls. Know which one.
4. **Link buttons** — Must use proper routing (Next.js Link component), not raw anchor tags
5. **Action buttons** — Must have an onClick handler that calls a real API endpoint
6. **Loading state** — Every action button must show a loading/spinner state while processing
7. **Success state** — User must receive clear feedback when the action completes
8. **Error state** — User must receive clear feedback when the action fails
9. **Disabled state** — Button must be disabled while processing to prevent double-submission
10. **Mobile tap target** — Button must be at least 44x44px touch target on mobile

### 3B. Form Wiring Checklist

For every new form added:

1. **Submission endpoint** — Define the exact API route the form submits to BEFORE building the form
2. **Verify the endpoint exists** — The API route must be built, tested, and returning correct responses
3. **Validation** — Client-side validation for immediate feedback, server-side validation for security
4. **Required fields** — Mark them visually and enforce them in both client and server validation
5. **Rate limiting** — Every public form MUST have rate limiting to prevent abuse
6. **CSRF protection** — Every form submission MUST include origin validation
7. **Success response** — What does the user see after successful submission? Define it.
8. **Error response** — What does the user see when it fails? Define it.
9. **Email confirmation** — Does the form trigger a confirmation email? Wire it.
10. **Admin notification** — Does the form notify the team? Wire it.
11. **Data storage** — Where does the submission data go? Database table must exist.
12. **Spam prevention** — Honeypot field or rate limiting or both

### 3C. Data Connection Checklist

For every section that displays dynamic data:

1. **Data source identified** — Where does the data come from? (Supabase DB, Sanity CMS, API, Redis cache)
2. **Query written and tested** — The data fetch works and returns correct data
3. **Empty state handled** — If the data source returns nothing, the section hides gracefully or shows a meaningful fallback
4. **Error state handled** — If the data fetch fails, the page does not crash
5. **Loading state** — User sees a skeleton/placeholder while data loads
6. **Cache strategy** — Is the data cached? For how long? When does it revalidate?
7. **Fallback data** — If using fallback/default data, it MUST be clearly marked in code as temporary and MUST be replaced with real data before launch

---

## 4. BACKEND CONNECTION VERIFICATION — EVERY HOMEPAGE FEATURE

### Current Backend Services (Verify ALL connections when making changes)

**Supabase (Database):**
- Vehicle inventory queries — Must return real vehicles, not empty arrays
- User authentication — Sign-in/sign-up flows must complete end-to-end
- Order/reservation data — Any "Reserve" buttons must write to the database

**Sanity CMS (Content):**
- Site settings (dealership name, contact info, branding) — Must be fetched, not hardcoded
- Testimonials — Must be fetched from CMS, displayed if available, hidden if empty
- FAQs — Must be fetched from CMS, displayed if available, hidden if empty
- Blog posts — If showing blog previews on homepage, must fetch real posts
- Promotions/banners — Must be CMS-driven for easy updates without code deploys

**Stripe (Payments):**
- If any "Reserve Now" or payment-related buttons exist on homepage, verify Stripe checkout flow works end-to-end
- Verify webhook handling for payment confirmations

**Redis (Caching & Rate Limiting):**
- Any forms on the homepage must have rate limiting active
- Search results caching should be verified if search is on homepage

**Email (Resend):**
- Any form that promises a response must trigger a real email
- Verify email templates render correctly with the submitted data

---

## 5. AFTER MAKING HOMEPAGE CHANGES — MANDATORY VERIFICATION

After every homepage change, run this verification sweep. Do NOT skip any step.

### 5A. Functional Verification

1. **Click every single button on the homepage** — Every one must do something real
2. **Submit every form on the homepage** — Every one must process and respond
3. **Click every link in the navigation** — Every one must load a real page
4. **Click every link in the footer** — Every one must load a real page
5. **Click every vehicle card** — Every one must load the correct vehicle detail page
6. **Test every filter/category chip** — Every one must filter inventory correctly
7. **Test the carousel/slider** — Navigation works, auto-play works (if applicable), data is real
8. **Scroll the entire page** — No broken layouts, no missing sections, no dead space

### 5B. Responsive Verification

1. **Desktop (1920px, 1440px)** — Full layout, all features visible and functional
2. **Tablet (1024px, 768px)** — Layout adapts, all features still functional
3. **Mobile (428px, 390px, 375px)** — Layout stacks properly, all buttons tappable, all forms usable
4. **Test touch interactions** — Swipe on carousels, tap on buttons, scroll on forms
5. **Test landscape orientation** — Nothing breaks when phone rotates

### 5C. Performance Verification

1. **Page load time** — Homepage must load under 3 seconds on 4G connection
2. **Largest Contentful Paint** — Under 2.5 seconds
3. **Cumulative Layout Shift** — Under 0.1 (no jumping content as images load)
4. **Image loading** — All images load, no broken image icons, lazy loading works
5. **Above-the-fold content** — Everything visible without scrolling loads first

### 5D. Data Verification

1. **No hardcoded placeholder data visible** — Every displayed vehicle, testimonial, FAQ, and price must come from a real data source
2. **No "Lorem ipsum" or test content** — Scan every text block
3. **No placeholder images** — Every image must be a real vehicle photo from the CDN
4. **No $0 prices or 0 mileage** — Data must be realistic and accurate
5. **No broken image URLs** — Every image source must resolve

### 5E. SEO Verification After Changes

1. **Meta title** — Unique, descriptive, under 60 characters, includes primary keyword
2. **Meta description** — Compelling, under 160 characters, includes call to action
3. **H1 tag** — Exactly one H1 on the page, contains primary keyword
4. **Heading hierarchy** — H1 → H2 → H3 in logical order, no skipped levels
5. **Image alt texts** — Every image has descriptive alt text
6. **Canonical URL** — Points to the correct homepage URL
7. **Open Graph tags** — Title, description, image set for social sharing
8. **Structured data** — Organization, LocalBusiness, or WebSite schema present and valid

---

## 6. KNOWN ISSUES TO FIX DURING NEXT HOMEPAGE CHANGE

These are currently broken or placeholder on the homepage. Any change to the homepage MUST address these:

| Issue | Current State | Required Fix |
|-------|--------------|-------------|
| **Quick Estimate Form** | Placeholder — no submission endpoint wired | Wire to `/api/trade-in/quote` or remove from page |
| **Testimonials** | Empty arrays passed — not fetching from Sanity CMS | Fetch from CMS, hide section if empty |
| **FAQs** | Empty arrays passed — not fetching from Sanity CMS | Fetch from CMS, hide section if empty |
| **Featured Vehicles Fallback** | Hardcoded fallback vehicles exist if DB is empty | Verify DB has real data, remove hardcoded fallbacks before launch |
| **Protection Plan Anchors** | CTAs link to `/protection-plans#plan-name` | Verify anchor targets exist on the destination page |

---

## 7. THE NON-NEGOTIABLE RULES

These rules apply to EVERY homepage change, no exceptions:

1. **No dead buttons** — If a button exists, it MUST do something. No exceptions.
2. **No placeholder forms** — If a form exists, it MUST submit to a real endpoint. No exceptions.
3. **No hardcoded data in production** — Every dynamic section MUST pull from a real data source.
4. **No silent failures** — Every error MUST be visible to the user with a helpful message.
5. **No broken images** — Every image MUST load or show a proper fallback.
6. **No untested routes** — Every link MUST be clicked and verified after changes.
7. **No CMS disconnection** — Sanity content MUST be live, not bypassed with defaults.
8. **No missing mobile experience** — Every feature MUST work on phone screens.
9. **No SEO regression** — Meta tags, headings, and structured data MUST be verified after every change.
10. **No performance regression** — Core Web Vitals MUST stay in green after every change.

---

## 8. HOMEPAGE CHANGE SIGN-OFF TEMPLATE

After completing any homepage modification, fill this out before considering the work done:

```
HOMEPAGE CHANGE SIGN-OFF
========================
Date: ___________
Change Description: ___________

WIRING VERIFICATION:
[ ] All buttons tested — every one navigates or triggers an action
[ ] All forms tested — every one submits and receives a response
[ ] All navigation links tested — every one loads a real page
[ ] All footer links tested — every one loads a real page
[ ] All vehicle cards tested — every one loads correct detail page
[ ] All filters/chips tested — every one filters correctly
[ ] All carousels tested — navigation and data are functional

DATA VERIFICATION:
[ ] No hardcoded placeholder data visible on the page
[ ] All dynamic sections pulling from real data sources
[ ] Empty states handled gracefully (hide section, don't show blank)
[ ] Images loading from CDN — no broken URLs

RESPONSIVE VERIFICATION:
[ ] Desktop tested (1440px+)
[ ] Tablet tested (768px-1024px)
[ ] Mobile tested (375px-428px)

PERFORMANCE VERIFICATION:
[ ] Page loads under 3 seconds
[ ] No layout shift on load
[ ] Images lazy-load correctly

SEO VERIFICATION:
[ ] Meta title and description present and correct
[ ] H1 tag present and contains primary keyword
[ ] Structured data valid
[ ] Open Graph tags set

SIGN-OFF: ___________
```

---

## IMPORTANT REMINDERS

- **DO NOT** provide code, formulas, or implementation snippets
- **DO** inspect every connection BEFORE and AFTER changes
- **DO** treat every button, form, and link as a contract with the user — it MUST deliver
- **DO** verify on real devices, not just browser resize
- **DO** check both happy path AND error path for every feature
- **DO** keep everything that currently works INTACT — improve, don't break
- **DO** address the known issues listed in Section 6 during any homepage work
- **DO** fill out the sign-off template (Section 8) after every change

---

*This command governs ALL homepage modifications for ev.planetmotors.ca.*
*Zero tolerance for broken wiring. Every element earns its place by working.*
