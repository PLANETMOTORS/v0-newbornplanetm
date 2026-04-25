// Planet Motors CMS - GROQ Query Definitions
// All queries exported as plain template strings
//
// IMPORTANT: Field names in every query MUST match the actual schema definitions in
// studio/schemas/. Mismatches silently return null — no runtime error is thrown.
// Last audited: 2025-04-25 — all phantom fields removed, schema-aligned.

// ==========================================
// VEHICLE QUERIES
// ==========================================

export const VEHICLES_QUERY = `
  *[_type == "vehicle" && status == "available"] | order(_createdAt desc) {
    _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice,
    status, condition, featured, mileage, exteriorColor, interiorColor, bodyStyle,
    fuelType, transmission, drivetrain, engine, horsepower, doors, seats, evRange,
    batteryCapacity, features, safetyFeatures, "mainImage": mainImage.asset->url,
    "images": images[].asset->url, description, highlights, carfaxUrl, previousOwners,
    accidentFree, serviceHistory, slug, seoTitle, seoDescription,
    "estMonthlyPayment": round(coalesce(specialPrice, price) / 60 * 1.05),
    "specialFinance": specialFinance-> { _id, name, "logo": logo.asset->url, promoRate, promoEndDate }
  }
`

export const VEHICLE_BY_SLUG_QUERY = `
  *[_type == "vehicle" && slug.current == $slug][0] {
    _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice,
    status, condition, featured, mileage, exteriorColor, interiorColor, bodyStyle,
    fuelType, transmission, drivetrain, engine, horsepower, doors, seats, evRange,
    batteryCapacity, features, safetyFeatures, "mainImage": mainImage.asset->url,
    "images": images[].asset->url, description, highlights, carfaxUrl, previousOwners,
    accidentFree, serviceHistory, slug, seoTitle, seoDescription,
    "estMonthlyPayment": round(coalesce(specialPrice, price) / 60 * 1.05),
    "specialFinance": specialFinance-> {
      _id, name, "logo": logo.asset->url, promoRate, standardRate, promoEndDate,
      promoDescription, contactPhone, contactEmail
    }
  }
`

export const FEATURED_VEHICLES_QUERY = `
  *[_type == "vehicle" && featured == true && status == "available"] | order(_createdAt desc)[0...8] {
    _id, year, make, model, trim, price, specialPrice, mileage, fuelType,
    "mainImage": mainImage.asset->url, slug,
    "estMonthlyPayment": round(coalesce(specialPrice, price) / 60 * 1.05),
    "specialFinance": specialFinance-> { name, "logo": logo.asset->url, promoRate }
  }
`

export const VEHICLE_COUNT_QUERY = `count(*[_type == "vehicle" && status == "available"])`

export const VEHICLES_BY_STOCK_NUMBERS_QUERY = `
  *[_type == "vehicle" && stockNumber in $stockNumbers && status == "available"] {
    _id, year, make, model, trim, price, mileage, fuelType,
    "mainImage": mainImage.asset->url, slug, stockNumber
  }
`

// ==========================================
// SITE CONFIGURATION QUERIES
// ==========================================

// NOTE: Field names match studio/schemas/settings.ts siteSettings schema exactly.
// address is an object {street,city,province,postalCode,country} in the schema.
// We project flat fields (streetAddress, city, province, postalCode) for consumers.
// socialLinks is a nested object — NOT flat facebookUrl/instagramUrl etc.
// omvicLicense (not omvicNumber), googleMapsUrl (not googleMapsEmbedUrl).
export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"] | order(_updatedAt desc)[0] {
    dealerName, tagline, phone, tollFree, email,
    "streetAddress": address.street,
    "city": address.city,
    "province": address.province,
    "postalCode": address.postalCode,
    googleMapsUrl, latitude, longitude,
    omvicLicense,
    businessHours,
    hours { weekdays, saturday, sunday },
    financing { minDownPayment, maxTerm, defaultRate },
    financingDefaults { annualInterestRate, amortizationMonths },
    delivery { freeDeliveryRadius, perKmRate, enabled },
    deliveryConfiguration { originPostalCode, originLabel, maxDeliveryDistanceKm, freeDeliveryRadiusKm },
    leadRouting { salesEmail, financeEmail, tradeInEmail },
    leadRoutingRules,
    depositAmount,
    aggregateRating { ratingValue, reviewCount },
    announcementBar { showBar, message, linkUrl },
    defaultSeo { metaTitle, metaDescription },
    socialLinks { facebook, instagram, twitter, youtube, tiktok, linkedin, googleMapsUrl },
    footerText, copyrightText
  }
`

export const NAVIGATION_QUERY = `
  *[_type == "navigation"] | order(_updatedAt desc)[0] {
    topBar { showTopBar, phoneNumber, phoneDisplayText, address, addressLink },
    mainNavigation,
    headerCta { showCta, buttonLabel, buttonUrl, buttonStyle },
    footerLinkColumns,
    footerBottom { copyrightText, legalLinks }
  }
`

// ==========================================
// PAGE QUERIES
// ==========================================

// NOTE: heroSection fields match pages.ts homepage schema exactly.
// backgroundImage, altText, trustBadges do NOT exist in heroSection.
// featuredVehicleStockNumbers, testimonials, faqHighlights do NOT exist on homepage.
export const HOMEPAGE_QUERY = `
  *[_type == "homepage"] | order(_updatedAt desc)[0] {
    heroSection {
      headline,
      headlineHighlight,
      subheadline,
      primaryCta { label, url },
      secondaryCta { label, url }
    },
    "featuredVehicleIds": featuredVehicles[].vehicleId,
    promoBanner { enabled, showBanner, headline, bodyText, ctaLabel, ctaUrl, backgroundColor },
    quickFilters,
    financingPromo { rate, rateLabel, ctaLabel, ctaUrl },
    announcementBar { show, message, linkText, linkUrl },
    seo { metaTitle, metaDescription }
  }
`

// NOTE: heroSection in sellYourCarPage does NOT have trustBadges or backgroundImage.
export const SELL_YOUR_CAR_PAGE_QUERY = `
  *[_type == "sellYourCarPage"][0] {
    heroSection { headline, subheadline, highlightText, formSettings },
    benefits, comparisonTable, avilooBattery, processSteps, testimonials, ctaSection,
    seo { metaTitle, metaDescription }
  }
`

export const FINANCING_PAGE_QUERY = `
  *[_type == "financingPage"][0] {
    heroSection {
      headline,
      subheadline,
      "highlight": highlightText,
      featuredRateText,
      rateSubtext,
      primaryCta { "buttonLabel": label, url }
    },
    benefits, calculator, processSteps, ctaSection,
    seo { metaTitle, metaDescription }
  }
`

export const INVENTORY_SETTINGS_QUERY = `
  *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    title, showFiltersSidebar, itemsPerPage, defaultSortOrder,
    showComparisonTool, showQuickView, filterOptions, priceDisplay,
    taxRate, defaultDownPayment, averageTradeInValue, defaultTerm,
    creditTiers, noResultsMessage
  }
`

export const VEHICLES_WITH_PAYMENT_CALC_QUERY = `
{
  "settings": *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    taxRate, defaultTerm, defaultDownPayment, averageTradeInValue, creditTiers
  },
  "vehicles": *[_type == "vehicle" && status == "available"] | order(price asc) {
    _id, year, make, model, trim, price, specialPrice, mileage, fuelType, condition,
    "slug": slug.current,
    "mainImage": mainImage.asset->url,
    "specialFinance": specialFinance-> { name, "logo": logo.asset->url, promoRate, promoEndDate }
  }
}
`

export const VEHICLE_WITH_PAYMENT_CONTEXT_QUERY = `
{
  "settings": *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    taxRate, defaultTerm, defaultDownPayment, averageTradeInValue, creditTiers
  },
  "vehicle": *[_type == "vehicle" && slug.current == $slug][0] {
    _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice,
    status, condition, mileage, exteriorColor, interiorColor, bodyStyle,
    fuelType, transmission, drivetrain, engine, horsepower,
    features, safetyFeatures, "mainImage": mainImage.asset->url,
    "images": images[].asset->url, description, highlights,
    "specialFinance": specialFinance-> {
      _id, name, "logo": logo.asset->url, promoRate, standardRate, promoEndDate, promoDescription
    }
  },
  "lowestRate": *[_type == "lender"] | order(promoRate asc)[0] {
    name, promoRate, "logo": logo.asset->url
  }
}
`

// ==========================================
// BLOG QUERIES
// ==========================================

// NOTE: categories is string[] (not a reference array) — do NOT use categories[]->title.
export const BLOG_LIST_QUERY = `
  *[_type == "blogPost" && defined(publishedAt)] | order(publishedAt desc)[$start...$end] {
    _id, title, slug, publishedAt, excerpt,
    "coverImage": coverImage.asset->url,
    "coverImageAlt": coverImage.alt,
    categories, tags, readTime,
    seoTitle, seoDescription,
    "authorName": author->name,
    "authorRole": author->role,
    "authorPhoto": author->photo.asset->url
  }
`

export const BLOG_COUNT_QUERY = `count(*[_type == "blogPost" && defined(publishedAt)])`

export const BLOG_POST_QUERY = `
  *[_type == "blogPost" && defined(publishedAt) && slug.current == $slug][0] {
    _id, title, slug, publishedAt, excerpt,
    "coverImage": coverImage.asset->url,
    "coverImageAlt": coverImage.alt,
    body,
    categories, tags, readTime,
    seoTitle, seoDescription,
    "ogImage": ogImage.asset->url,
    canonicalUrl, noIndex,
    "authorName": author->name,
    "authorRole": author->role,
    "authorPhoto": author->photo.asset->url,
    "authorBio": author->bio,
    "relatedPosts": relatedPosts[]-> {
      _id, title, slug, publishedAt,
      "coverImage": coverImage.asset->url,
      categories
    }
  }
`

export const BLOG_SLUGS_QUERY = `
  *[_type == "blogPost" && defined(publishedAt)] { "slug": slug.current }
`

// ==========================================
// CONTENT QUERIES
// ==========================================

export const FAQ_QUERY = `
  *[_type == "faqEntry"] | order(order asc, _createdAt asc) {
    _id, question, answer, category, order
  }
`

// Legacy FAQ query — faqItem type kept for backward compatibility
export const FAQ_LEGACY_QUERY = `
  *[_type == "faqItem"] | order(order asc, _createdAt desc) { _id, question, answer, category }
`

export const ACTIVE_PROMOS_QUERY = `
  *[_type == "promotion" && active == true && startDate <= now() && endDate >= now()] {
    _id, title, message, ctaLabel, ctaUrl, startDate, endDate
  }
`

export const TESTIMONIALS_QUERY = `
  *[_type == "testimonial"] | order(order asc, _createdAt desc) {
    _id, "customerName": name, rating, "review": text,
    vehiclePurchased, location, source, featured,
    "publishedAt": date
  }
`

export const FEATURED_TESTIMONIALS_QUERY = `
  *[_type == "testimonial" && featured == true] | order(order asc, _createdAt desc)[0...6] {
    _id, "customerName": name, rating, "review": text,
    vehiclePurchased, location, source,
    "publishedAt": date
  }
`

// NOTE: protectionPlan primary field is "title" (not "name" — name is a hidden legacy field).
// Filter by active == true to exclude inactive plans.
export const PROTECTION_PLANS_QUERY = `
  *[_type == "protectionPlan" && active != false] | order(order asc) {
    _id, title, tagline, description, price, priceNote,
    features, coverage, highlights, ctaLabel, ctaUrl, featured,
    "icon": icon.asset->url
  }
`

// NOTE: lender schema fields (lender.ts): name, logo, promoRate, standardRate,
// minCreditScore, maxLoanTerm, promoEndDate, promoTitle, promoDescription,
// features, contactPhone, contactEmail, websiteUrl, isActive, sortOrder.
// Removed non-existent: description, specialties, contactName, featured (use isActive).
export const LENDERS_QUERY = `
  *[_type == "lender" && isActive != false] | order(sortOrder asc, promoRate asc) {
    _id, name, "logo": logo.asset->url,
    promoRate, standardRate, minCreditScore, maxLoanTerm,
    promoEndDate, promoTitle, promoDescription,
    features, contactPhone, contactEmail, websiteUrl
  }
`

export const LOWEST_RATE_QUERY = `
  *[_type == "lender" && isActive != false] | order(promoRate asc)[0] {
    name, promoRate, standardRate, promoEndDate, "logo": logo.asset->url
  }
`

export const VEHICLES_BY_PAYMENT_QUERY = `
  *[_type == "vehicle" && status == "available"] | order(round(coalesce(specialPrice, price) / 60 * 1.05) asc) {
    _id, year, make, model, trim, price, specialPrice, mileage, fuelType,
    "mainImage": mainImage.asset->url, slug,
    "estMonthlyPayment": round(coalesce(specialPrice, price) / 60 * 1.05),
    "specialFinance": specialFinance-> { name, "logo": logo.asset->url, promoRate }
  }
`

export const VEHICLES_WITH_DYNAMIC_PAYMENTS_QUERY = `
{
  "finance": *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    taxRate, defaultTerm, defaultDownPayment, averageTradeInValue,
    creditTiers[] { label, minScore, apr }
  },
  "vehicles": *[_type == "vehicle" && status == "available"] | order(price asc) {
    _id, year, make, model, trim, price, specialPrice, mileage, fuelType,
    condition, featured,
    "slug": slug.current,
    "mainImage": mainImage.asset->url,
    "specialFinance": specialFinance-> { name, "logo": logo.asset->url, promoRate, promoEndDate }
  }
}
`

export const VEHICLE_DETAIL_WITH_FINANCE_QUERY = `
{
  "finance": *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    taxRate, defaultTerm, defaultDownPayment, averageTradeInValue,
    creditTiers[] { label, minScore, apr }
  },
  "vehicle": *[_type == "vehicle" && slug.current == $slug][0] {
    _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice,
    status, condition, featured, mileage, exteriorColor, interiorColor, bodyStyle,
    fuelType, transmission, drivetrain, engine, horsepower, doors, seats,
    features, safetyFeatures, "mainImage": mainImage.asset->url,
    "images": images[].asset->url, description, highlights,
    carfaxUrl, previousOwners, accidentFree, serviceHistory,
    "specialFinance": specialFinance-> {
      _id, name, "logo": logo.asset->url, promoRate, standardRate,
      promoEndDate, promoDescription, contactPhone, contactEmail
    }
  },
  "lowestLenderRate": *[_type == "lender" && isActive != false] | order(promoRate asc)[0] {
    name, promoRate, "logo": logo.asset->url, promoEndDate
  }
}
`

// NOTE: banner schema fields: name, active, position, content, ctaLabel, ctaUrl,
// backgroundColor, textColor, startDate, endDate.
// Removed non-existent: backgroundImage, priority, pages, title, message.
export const BANNERS_QUERY = `
  *[_type == "banner" && active == true] | order(_createdAt desc) {
    _id, name, content, ctaLabel, ctaUrl,
    backgroundColor, textColor, position, startDate, endDate
  }
`

// ==========================================
// AUTHOR / TEAM QUERIES
// ==========================================

export const AUTHORS_QUERY = `
  *[_type == "author"] | order(order asc, name asc) {
    _id, name, slug, role, expertise,
    "photo": photo.asset->url,
    "photoAlt": photo.alt,
    bio, socialLinks, featured, order
  }
`

export const AUTHOR_BY_SLUG_QUERY = `
  *[_type == "author" && slug.current == $slug][0] {
    _id, name, slug, role, expertise,
    "photo": photo.asset->url,
    "photoAlt": photo.alt,
    bio, socialLinks, featured,
    "posts": *[_type == "blogPost" && references(^._id)] | order(publishedAt desc) {
      _id, title, slug, publishedAt, excerpt,
      "coverImage": coverImage.asset->url,
      categories
    }
  }
`

export const FEATURED_TEAM_QUERY = `
  *[_type == "author" && featured == true] | order(order asc) {
    _id, name, role, expertise,
    "photo": photo.asset->url,
    "photoAlt": photo.alt,
    socialLinks
  }
`
