// Planet Motors CMS - GROQ Query Definitions
// All queries exported as plain template strings

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
    // Professional Monthly Payment Calculation (60-month term, ~5% interest factor)
    "estMonthlyPayment": round(coalesce(specialPrice, price) / 60 * 1.05),
    // Resolve special financing lender reference
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
    // Professional Monthly Payment Calculation
    "estMonthlyPayment": round(coalesce(specialPrice, price) / 60 * 1.05),
    // Resolve special financing lender reference with full details
    "specialFinance": specialFinance-> { 
      _id, name, "logo": logo.asset->url, promoRate, standardRate, promoEndDate,
      promoDescription, contactName, contactEmail, contactPhone
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
    _id, year, make, model, trim, price, mileage, fuelType, "mainImage": mainImage.asset->url, slug, stockNumber
  }
`

// ==========================================
// SITE CONFIGURATION QUERIES
// ==========================================

export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"] | order(_updatedAt desc)[0] {
    dealerName, phone, email, streetAddress, city, province, postalCode, latitude, longitude,
    omvicNumber, businessHours, facebookUrl, instagramUrl, twitterUrl, youtubeUrl,
    googleMapsEmbedUrl, announcementBar, mainNavigation, financingDefaults,
    deliveryConfiguration, aggregateRating, defaultSeo, leadRoutingRules, depositAmount
  }
`

export const NAVIGATION_QUERY = `
  *[_type == "navigation"] | order(_updatedAt desc)[0] {
    topBar { showTopBar, phoneNumber, phoneDisplayText, address, addressLink, trustBadges },
    mainNavigation,
    headerCta { showCta, buttonLabel, buttonUrl, buttonStyle },
    footerLinkColumns,
    footerBottom { copyrightText, legalLinks }
  }
`

// ==========================================
// PAGE QUERIES
// ==========================================

export const HOMEPAGE_QUERY = `
  *[_type == "homepage"] | order(_updatedAt desc)[0] {
    heroSection { headline, subheadline, primaryCta, secondaryCta, "backgroundImage": backgroundImage.asset->url, altText, trustBadges },
    featuredVehicleStockNumbers,
    "featuredVehicleIds": featuredVehicles[].vehicleId,
    promoBanner { showBanner, headline, bodyText, ctaLabel, ctaUrl, backgroundColor },
    testimonials, faqHighlights
  }
`

export const SELL_YOUR_CAR_PAGE_QUERY = `
  *[_type == "sellYourCar"][0] {
    heroSection { headline, subheadline, highlightText, formSettings, trustBadges, "backgroundImage": backgroundImage.asset->url },
    benefits, comparisonTable, processSteps, testimonials, ctaSection, seo
  }
`

export const FINANCING_PAGE_QUERY = `
  *[_type == "financing"][0] {
    heroSection { headline, subheadline, featuredRateText, rateSubtext, primaryCta, secondaryCta, heroStats },
    lenders, calculator, processSteps, benefits, faqs, seo
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

// Full-Stack Dynamic Payment Calculator Query
// Fetches vehicles with global settings for accurate payment calculations
export const VEHICLES_WITH_PAYMENT_CALC_QUERY = `
{
  "settings": *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    taxRate,
    defaultTerm,
    defaultDownPayment,
    averageTradeInValue,
    creditTiers
  },
  "vehicles": *[_type == "vehicle" && status == "available"] | order(price asc) {
    _id,
    year,
    make,
    model,
    trim,
    price,
    specialPrice,
    mileage,
    fuelType,
    condition,
    "slug": slug.current,
    "mainImage": mainImage.asset->url,
    "specialFinance": specialFinance-> { 
      name, "logo": logo.asset->url, promoRate, promoEndDate 
    }
  }
}
`

// Single vehicle with full payment calculation context
export const VEHICLE_WITH_PAYMENT_CONTEXT_QUERY = `
{
  "settings": *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    taxRate,
    defaultTerm,
    defaultDownPayment,
    averageTradeInValue,
    creditTiers
  },
  "vehicle": *[_type == "vehicle" && slug.current == $slug][0] {
    _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice,
    status, condition, mileage, exteriorColor, interiorColor, bodyStyle,
    fuelType, transmission, drivetrain, engine, horsepower,
    features, safetyFeatures, "mainImage": mainImage.asset->url,
    "images": images[].asset->url, description, highlights,
    "specialFinance": specialFinance-> { 
      _id, name, "logo": logo.asset->url, promoRate, standardRate, 
      promoEndDate, promoDescription
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

export const BLOG_LIST_QUERY = `
  *[_type == "blogPost"] | order(publishedAt desc)[$start...$end] {
    _id, title, slug, publishedAt, excerpt, "coverImage": coverImage.asset->url, seoTitle, seoDescription,
    "categories": categories[]->title
  }
`

export const BLOG_COUNT_QUERY = `count(*[_type == "blogPost"])`

export const BLOG_POST_QUERY = `
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id, title, slug, publishedAt, excerpt,
    "coverImage": coverImage.asset->url,
    body,
    categories,
    seoTitle, seoDescription
  }
`

/** Fetch all blog post slugs — used for generateStaticParams */
export const BLOG_SLUGS_QUERY = `
  *[_type == "blogPost"] { "slug": slug.current }
`

// ==========================================
// CONTENT QUERIES
// ==========================================

export const FAQ_QUERY = `
  *[_type == "faqItem"] | order(order asc, _createdAt desc) { _id, question, answer, category }
`

export const ACTIVE_PROMOS_QUERY = `
  *[_type == "promotion" && active == true && startDate <= now() && endDate >= now()] {
    _id, title, message, ctaLabel, ctaUrl, startDate, endDate
  }
`

export const TESTIMONIALS_QUERY = `
  *[_type == "testimonial"] | order(order asc, _createdAt desc) {
    _id, "customerName": name, rating, "review": text, vehiclePurchased, location, "publishedAt": _createdAt, featured
  }
`

export const FEATURED_TESTIMONIALS_QUERY = `
  *[_type == "testimonial" && featured == true] | order(order asc, _createdAt desc)[0...6] {
    _id, "customerName": name, rating, "review": text, vehiclePurchased, location, "publishedAt": _createdAt
  }
`

export const PROTECTION_PLANS_QUERY = `
  *[_type == "protectionPlan"] | order(order asc) {
    _id, name, description, price, features, coverage, "icon": icon.asset->url
  }
`

export const LENDERS_QUERY = `
  *[_type == "lender"] | order(promoRate asc, standardRate asc) {
    _id, name, "logo": logo.asset->url, description, specialties, featured,
    promoRate, standardRate, promoEndDate, promoDescription,
    contactName, contactEmail, contactPhone
  }
`

// Get the lowest available interest rate from all lenders
export const LOWEST_RATE_QUERY = `
  *[_type == "lender"] | order(promoRate asc)[0] {
    name, promoRate, standardRate, promoEndDate, "logo": logo.asset->url
  }
`

// Vehicles with special financing sorted by monthly payment
export const VEHICLES_BY_PAYMENT_QUERY = `
  *[_type == "vehicle" && status == "available"] | order(round(coalesce(specialPrice, price) / 60 * 1.05) asc) {
    _id, year, make, model, trim, price, specialPrice, mileage, fuelType,
    "mainImage": mainImage.asset->url, slug,
    "estMonthlyPayment": round(coalesce(specialPrice, price) / 60 * 1.05),
    "specialFinance": specialFinance-> { name, "logo": logo.asset->url, promoRate }
  }
`

// Professional Full-Stack Payment Query with Credit Tier Support
// Pre-calculates payments using "Excellent" (lowest APR) tier for "Starting at" display
export const VEHICLES_WITH_DYNAMIC_PAYMENTS_QUERY = `
{
  "finance": *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    taxRate,
    defaultTerm,
    defaultDownPayment,
    averageTradeInValue,
    creditTiers[] { label, minScore, apr }
  },
  "vehicles": *[_type == "vehicle" && status == "available"] | order(price asc) {
    _id,
    year,
    make,
    model,
    trim,
    price,
    specialPrice,
    mileage,
    fuelType,
    condition,
    featured,
    "slug": slug.current,
    "mainImage": mainImage.asset->url,
    "specialFinance": specialFinance-> { 
      name, "logo": logo.asset->url, promoRate, promoEndDate 
    }
  }
}
`

// Vehicle detail with full finance context for PaymentCalculator component
export const VEHICLE_DETAIL_WITH_FINANCE_QUERY = `
{
  "finance": *[_type == "inventorySettings"] | order(_updatedAt desc)[0] {
    taxRate,
    defaultTerm,
    defaultDownPayment,
    averageTradeInValue,
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
      promoEndDate, promoDescription, contactName, contactEmail, contactPhone
    }
  },
  "lowestLenderRate": *[_type == "lender"] | order(promoRate asc)[0] {
    name, promoRate, "logo": logo.asset->url, promoEndDate
  }
}
`

export const BANNERS_QUERY = `
  *[_type == "banner" && active == true] | order(priority desc) {
    _id, title, message, ctaLabel, ctaUrl, "backgroundImage": backgroundImage.asset->url, backgroundColor, textColor, position, pages
  }
`
