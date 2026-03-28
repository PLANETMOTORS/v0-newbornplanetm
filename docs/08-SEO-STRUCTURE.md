# Planet Motors - SEO Structure

## Overview

Comprehensive SEO implementation for maximum search engine visibility and rich results.

---

## SEO Files Structure

```
/app
  layout.tsx          # Global metadata + JSON-LD schemas
  sitemap.ts          # Dynamic XML sitemap
  robots.ts           # Robots.txt configuration

/components/seo
  json-ld.tsx         # Structured data components

/lib/seo
  metadata.ts         # Metadata generation utilities
```

---

## 1. Metadata Configuration

### Global Metadata (layout.tsx)

```typescript
export const metadata: Metadata = {
  title: 'Planet Motors | Premium Used Car Dealership - Nationwide Delivery',
  description: 'Shop 9,500+ certified pre-owned vehicles...',
  keywords: 'used cars, pre-owned vehicles, car dealership...',
  openGraph: { ... },
  twitter: { ... },
  robots: { index: true, follow: true },
}
```

### Page-Specific Metadata

Use the `generateSEOMetadata` helper:

```typescript
// In any page.tsx
import { generateSEOMetadata } from '@/lib/seo/metadata'

export const metadata = generateSEOMetadata({
  title: "Vehicle Inventory",
  description: "Browse 9,500+ certified vehicles...",
  path: "/inventory",
  keywords: ["car inventory", "used cars for sale"],
})
```

### Pre-built Page Metadata

```typescript
import { pageMetadata } from '@/lib/seo/metadata'

// Use directly
export const metadata = pageMetadata.inventory
export const metadata = pageMetadata.financing
export const metadata = pageMetadata.tradeIn
export const metadata = pageMetadata.about
// etc.
```

---

## 2. JSON-LD Structured Data

### Organization Schema (Global)

Automatically included on all pages via layout.tsx:

- **OrganizationJsonLd** - Business information, address, hours
- **LocalBusinessJsonLd** - Local SEO with aggregate ratings
- **WebsiteSearchJsonLd** - Google Sitelinks searchbox

### Vehicle Schema (VDP)

```typescript
import { VehicleJsonLd } from '@/components/seo/json-ld'

<VehicleJsonLd vehicle={{
  id: "2024-tesla-model-y",
  year: 2024,
  make: "Tesla",
  model: "Model Y",
  price: 64990,
  mileage: 12450,
  image: "/images/vehicles/tesla-model-y.jpg",
}} />
```

### FAQ Schema

```typescript
import { FAQJsonLd } from '@/components/seo/json-ld'

<FAQJsonLd faqs={[
  { question: "What is included?", answer: "..." },
  { question: "How do I finance?", answer: "..." },
]} />
```

### Article Schema (Blog)

```typescript
import { ArticleJsonLd } from '@/components/seo/json-ld'

<ArticleJsonLd article={{
  title: "EV Buying Guide 2024",
  slug: "ev-buying-guide-2024",
  publishedAt: "2024-01-15",
  excerpt: "...",
  coverImage: "/images/blog/ev-guide.jpg",
}} />
```

### Breadcrumb Schema

```typescript
import { BreadcrumbJsonLd } from '@/components/seo/json-ld'

<BreadcrumbJsonLd items={[
  { name: "Home", url: "/" },
  { name: "Inventory", url: "/inventory" },
  { name: "2024 Tesla Model Y", url: "/vehicles/2024-tesla-model-y" },
]} />
```

---

## 3. Sitemap Configuration

### Static Pages

| Page | Priority | Frequency |
|------|----------|-----------|
| Homepage | 1.0 | Daily |
| Inventory | 0.95 | Hourly |
| Financing | 0.9 | Weekly |
| Trade-In | 0.9 | Weekly |
| About | 0.8 | Monthly |
| Contact | 0.8 | Monthly |
| Blog | 0.8 | Daily |
| FAQ | 0.7 | Monthly |

### Dynamic Routes

- **Vehicle Detail Pages**: Priority 0.75, Daily updates
- **Blog Posts**: Priority 0.6, Weekly updates
- **Inventory Filters**: Priority 0.85 (helps SEO for "Tesla for sale", etc.)

### Production Integration

Connect to Sanity CMS and database:

```typescript
// In sitemap.ts
async function getVehicleIds() {
  const vehicles = await fetchVehicles()
  return vehicles.map(v => v.id)
}

async function getBlogSlugs() {
  const posts = await fetchBlogPosts()
  return posts.map(p => p.slug)
}
```

---

## 4. Robots.txt Rules

### Allowed

- All public pages
- Vehicle images
- Blog content

### Blocked

- `/api/` - API routes
- `/account/` - User dashboard
- `/checkout/` - Purchase flow
- `/admin/` - Admin panel
- `/auth/*` - Auth callbacks

### Blocked Bots

- AhrefsBot (aggressive crawler)
- SemrushBot (high request volume)

---

## 5. Page-by-Page SEO Checklist

### Homepage
- [x] Title: "Planet Motors | Premium Used Car Dealership"
- [x] Meta description with call-to-action
- [x] OrganizationJsonLd
- [x] LocalBusinessJsonLd with ratings
- [x] WebsiteSearchJsonLd for sitelinks

### Vehicle Detail Page (VDP)
- [x] Dynamic title: "{Year} {Make} {Model} | Planet Motors"
- [x] Price and mileage in description
- [x] VehicleJsonLd schema
- [x] BreadcrumbJsonLd
- [x] Canonical URL
- [x] OpenGraph image (vehicle photo)

### Inventory
- [x] Filter-specific meta (for /inventory?fuelType=Electric)
- [x] ItemList schema (optional)
- [x] Pagination meta (rel=next/prev)

### Blog
- [x] ArticleJsonLd for each post
- [x] Author markup
- [x] Published/modified dates
- [x] Category tags

### FAQ
- [x] FAQJsonLd for rich snippets
- [x] One Q&A per topic

---

## 6. Technical SEO

### Performance
- Next.js Image optimization
- Font preloading (Inter, Playfair)
- Code splitting
- Vercel Edge caching

### Mobile
- Responsive viewport meta
- Touch-friendly buttons
- Mobile-first design

### Accessibility
- Semantic HTML (main, nav, article)
- ARIA labels
- Alt text for images
- Skip links

### Security
- HTTPS enforced
- CSP headers
- No mixed content

---

## 7. Environment Variables

```bash
# Required for production
NEXT_PUBLIC_SITE_URL=https://planetmotors.ca
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX      # Google Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX      # Google Tag Manager
```

---

## 8. Testing & Validation

### Tools

1. **Google Search Console** - Index status, errors
2. **Google Rich Results Test** - Validate JSON-LD
3. **Lighthouse** - Performance & SEO audit
4. **Schema.org Validator** - Structured data check

### Test URLs

```
https://search.google.com/test/rich-results?url=https://planetmotors.ca
https://validator.schema.org/#url=https://planetmotors.ca
```

---

## 9. Future Enhancements

- [ ] Dynamic OG images per vehicle
- [ ] Hreflang for French (planetmotors.ca/fr)
- [ ] Video schema for walkarounds
- [ ] Review schema from Google Business
- [ ] Product schema for protection plans
- [ ] Event schema for sales/promotions

---

*Last Updated: March 28, 2026*
