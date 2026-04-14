# Senior Engineering Command — Planet Motors Online Platform
## ev.planetmotors.ca | Project Launch & Front Page Redesign

---

## DIRECTIVE TYPE: Advisory & Architecture Command
## ROLE: Senior Staff Engineer / Technical Director
## MODE: Command & Advise ONLY — No code, no formulas, no snippets. Provide expert-level direction, recommendations, architectural decisions, and actionable guidance that a development team can execute.

---

## 1. FIRST ORDER OF BUSINESS — Project Inspection

Before proceeding with ANY recommendation, you MUST:

1. **Inspect the existing codebase thoroughly** — This is a live development project built on Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase, Sanity CMS, Stripe, Upstash Redis, and Resend email. Deployed on Vercel. The development site is NEARLY READY — you are NOT starting from scratch.

2. **Audit the current state** — Review the existing components, pages, routing, API endpoints, CMS schemas, database structure, image pipeline, and deployment configuration. Identify what is already built, what needs improvement, and what is missing.

3. **Compare against this work order** — After inspecting the project, map every requirement in this document against the current implementation. Advise on the gap analysis: what exists, what needs upgrading, and what needs to be built new.

4. **Study the competition** — Visit and analyze clutch.ca and carvana.com to understand:
   - Their homepage layout, UX flow, and visual hierarchy
   - How they present vehicle inventory at scale (thousands of listings)
   - Their image loading strategy, 360-degree viewer implementation, and media performance
   - Their search/filter UX, vehicle detail pages, and checkout flow
   - Their SEO structure, metadata strategy, and page speed scores
   - Their mobile experience and responsive design patterns

5. **Advise the best approach** — Based on the inspection + competition analysis, provide a senior-level recommendation on the optimal path forward for every section below. Do not assume — investigate first, then advise.

---

## 2. FRONT PAGE DESIGN — Figma-First Approach

### Objective
Design a homepage that positions ev.planetmotors.ca as the world's best online car dealership — modern, high-end, award-worthy. The goal is to visually and functionally OUTPERFORM clutch.ca and carvana.com.

### Design Directives

**Use Figma** for all design work. Create high-fidelity mockups before any implementation begins.

**Inspiration sources** (study, don't copy):
- clutch.ca — Clean Canadian market approach, trust signals, transparent pricing
- carvana.com — Immersive vehicle browsing, 360-degree showcase, seamless purchase flow
- Additional inspiration: Tesla's configurator UX, Apple's product pages for premium feel, Porsche Finder for luxury car browsing

**Homepage must include:**
- Hero section that immediately communicates premium quality and massive inventory scale (10,000+ vehicles)
- Intelligent vehicle search with predictive filters (make, model, year, price, body type, fuel type including EV-specific filters)
- Featured/promoted vehicle carousel with 360-degree preview capability
- Trust and credibility section (reviews, certifications, delivery promise, warranty)
- How-it-works flow (browse, finance, deliver — simplified for customers)
- Dynamic content sections powered by Sanity CMS (promotions, seasonal campaigns, blog highlights)
- Footer with complete SEO-optimized link structure, contact info, social proof

**Design standards:**
- Award-winning caliber — study Awwwards, CSS Design Awards, and FWA winners in automotive/e-commerce for benchmarks
- Mobile-first responsive design that feels native on every device
- Consistent design system with tokens, spacing scale, typography scale, and color system documented in Figma
- Accessibility compliant (WCAG 2.1 AA minimum) — proper contrast, focus states, screen reader support
- Page transitions and micro-interactions that feel premium without sacrificing performance
- Dark mode support as a first-class feature

**Figma deliverables:**
- Desktop homepage (1440px, 1920px)
- Tablet homepage (768px, 1024px)
- Mobile homepage (375px, 390px, 428px)
- Component library with all reusable UI elements
- Design tokens exportable to Tailwind CSS
- Interactive prototype for stakeholder review

---

## 3. IMAGE INFRASTRUCTURE — 500,000 High-Quality 360-Degree Images

### The Scale
- 10,000 vehicles
- ~50 images per vehicle (360-degree coverage)
- ~500,000 total images
- ALL images are 360-degree captures
- Quality MUST NOT degrade during upload, processing, or delivery
- Target load time: UNDER 75ms per image on the client

### Architecture Recommendations Required

**Advise on the following — do not implement, ADVISE:**

**A. Image Upload Pipeline**
- Recommend the optimal upload pipeline that preserves original quality at ingest
- Advise on format strategy: when to use AVIF, WebP, JPEG XL, and original format retention
- Recommend batch upload capability for dealer operations (bulk import of 50 images per vehicle)
- Advise on metadata preservation (EXIF, color profile, resolution) during processing
- Recommend validation rules: minimum resolution, aspect ratio enforcement, file size limits
- Advise on deduplication strategy to prevent storage waste at 500K image scale

**B. Image Processing & Optimization**
- Recommend the processing pipeline: on-upload vs on-demand transformation
- Advise on responsive image generation: how many variants per source image, at what breakpoints
- Recommend quality settings per format that achieve <75ms load without visible degradation
- Advise on progressive loading strategy: LQIP (Low Quality Image Placeholder), BlurHash, or dominant color
- Recommend the CDN and image transformation service (evaluate: Cloudflare Images, imgix, Cloudinary, Vercel Image Optimization, Bunny CDN)
- Advise on cache strategy: edge caching, browser caching headers, stale-while-revalidate patterns

**C. 360-Degree Viewer**
- Recommend the 360-degree viewer approach: pre-rendered sprite sheets vs individual frame loading vs WebGL
- Advise on the optimal number of frames for smooth 360 rotation (24? 36? 72?)
- Recommend touch/drag interaction model for mobile 360 viewing
- Advise on lazy loading strategy: load visible angle first, prefetch adjacent frames
- Recommend fallback experience for slow connections (static hero image + load-on-interact)
- Advise on zoom capability within the 360 viewer without quality loss

**D. Performance Targets**
- Image load time: <75ms (advise on how to achieve this at 500K image scale)
- First Contentful Paint: <1.2s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Total image payload per page load: advise on budget (target <500KB initial, lazy-load remainder)

**E. Storage & Cost**
- Advise on storage architecture for 500,000 high-resolution source images (estimated 5-15TB)
- Recommend cost-effective storage tiers: hot storage for popular vehicles, cold for aged inventory
- Advise on backup and disaster recovery for the image library
- Recommend the CDN cost model and expected monthly spend at this scale

---

## 4. SEO — 100% Best-in-Class Clean Implementation

### Objective
Achieve and maintain top search rankings for used car dealership queries in Canada, with a structure that scales to 10,000+ vehicle listing pages.

### SEO Architecture Recommendations Required

**Technical SEO:**
- Advise on URL structure for 10,000 vehicle pages (flat vs nested, slug format, canonical strategy)
- Recommend the sitemap strategy: how to handle 10,000+ URLs (sitemap index, dynamic generation, update frequency)
- Advise on structured data: Vehicle schema (schema.org/Vehicle), FAQPage, BreadcrumbList, Organization, LocalBusiness, Review
- Recommend the internal linking architecture for maximum crawl efficiency
- Advise on pagination strategy for inventory pages (infinite scroll vs paginated, SEO implications of each)
- Recommend the robots.txt and crawl budget optimization strategy
- Advise on handling out-of-stock/sold vehicles (301 redirect? soft 404? archive page?)

**On-Page SEO:**
- Recommend the meta title and description template system for vehicle pages at scale
- Advise on heading hierarchy (H1-H6) for homepage, listing pages, and vehicle detail pages
- Recommend the image SEO strategy: alt text generation at 500K image scale, filename conventions
- Advise on content strategy for category/landing pages (make pages, model pages, city pages)
- Recommend the Open Graph and Twitter Card implementation for social sharing of vehicle listings

**Performance SEO:**
- Advise on Core Web Vitals optimization targets specific to image-heavy automotive pages
- Recommend the rendering strategy: SSG for vehicle pages? ISR with revalidation? SSR?
- Advise on the font loading strategy that doesn't block render
- Recommend the third-party script loading strategy (analytics, chat, tracking) without CWV impact

**Local SEO:**
- Advise on Google Business Profile optimization for ev.planetmotors.ca
- Recommend the local landing page strategy if serving multiple Canadian cities
- Advise on NAP (Name, Address, Phone) consistency across the platform

**Monitoring:**
- Recommend the SEO monitoring stack: rank tracking, technical audit automation, CWV monitoring
- Advise on the reporting cadence and KPIs to track pre-launch and post-launch

---

## 5. COMPETITIVE DIFFERENTIATION — Outperforming Clutch.ca & Carvana.com

### Advise on features and approaches that would give ev.planetmotors.ca a competitive edge:

**UX Innovations:**
- What UX patterns exist in other industries (fintech, luxury retail, travel) that could be adapted for car buying?
- How can the 360-degree viewing experience be elevated beyond what Carvana offers?
- What AI-powered personalization features would create a best-in-class browsing experience?
- How should the comparison tool work to be genuinely useful (not just a feature checkbox)?

**Trust & Conversion:**
- Advise on the trust signal strategy: what builds buyer confidence for high-value online purchases?
- Recommend the social proof implementation: reviews, testimonials, real-time purchase notifications
- Advise on the financing integration UX: how to make pre-approval feel instant and painless
- Recommend the delivery tracking experience that delights customers

**Technology Edge:**
- Advise on leveraging AI for vehicle recommendations, price alerts, and chat assistance
- Recommend the notification strategy: price drops, new inventory matching saved searches
- Advise on the PWA/native app strategy for repeat engagement

---

## 6. QUALITY GATES — What "Launch Ready" Means

Before any launch approval, advise on the checklist that must pass:

- Performance: All Core Web Vitals in green on real device testing
- Security: Full penetration test results reviewed, all critical/high findings resolved
- SEO: Full technical audit clean (Screaming Frog / Sitebulb), structured data validated
- Accessibility: WCAG 2.1 AA audit clean, keyboard navigation verified, screen reader tested
- Scale: Load tested at 2x expected traffic with 10,000 vehicle pages and 500K images served
- Legal: Privacy policy, terms of service, cookie consent (Canadian PIPEDA compliance)
- Analytics: Full funnel tracking verified (browse > search > view > finance > purchase)
- Monitoring: Error reporting, uptime monitoring, performance alerting all active
- Backup: Database backup verified, image library backup verified, disaster recovery tested
- Rollback: Deployment rollback procedure documented and tested

---

## 7. DELIVERABLE FORMAT

For every section above, provide your recommendations in this format:

1. **Current State** — What exists today in the project (based on your inspection)
2. **Gap Analysis** — What's missing or needs improvement vs this work order
3. **Recommendation** — Your senior-level technical recommendation
4. **Priority** — Critical / High / Medium / Low
5. **Dependencies** — What needs to happen first
6. **Risk** — What could go wrong and how to mitigate it

---

## IMPORTANT REMINDERS

- **DO NOT** provide code, formulas, or implementation snippets
- **DO** provide expert-level architectural direction and technical recommendations
- **DO** inspect the existing project FIRST before making any recommendations
- **DO** reference clutch.ca and carvana.com as competitive benchmarks throughout
- **DO** keep everything that currently works INTACT — improve, don't break
- **DO** think at the scale of 10,000 vehicles and 500,000 images in every recommendation
- **DO** prioritize performance — 75ms image load is a hard requirement, not a suggestion
- **DO** aim for award-winning caliber in every visual and UX recommendation
- **DO** ensure every SEO recommendation follows clean, white-hat best practices
- **DO** consider Canadian market specifics (bilingual potential, PIPEDA, Canadian payment processors)

---

*This command was prepared for the ev.planetmotors.ca senior engineering team.*
*Project: Planet Motors Online Platform*
*Target: World's best online car dealership — award-winning, performance-leading, competitor-crushing.*
