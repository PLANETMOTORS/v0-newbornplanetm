// Planet Motors GROQ Queries
// Plain string queries for Sanity Content Lake

export const VEHICLES_QUERY = `
  *[_type == "vehicle" && status == "available"] | order(_createdAt desc) {
    _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice,
    status, condition, featured, mileage, exteriorColor, interiorColor, bodyStyle,
    fuelType, transmission, drivetrain, engine, horsepower, doors, seats, evRange,
    batteryCapacity, features, safetyFeatures, "mainImage": mainImage.asset->url,
    "images": images[].asset->url, description, highlights, carfaxUrl, previousOwners,
    accidentFree, serviceHistory, slug, seoTitle, seoDescription
  }
`

export const VEHICLE_BY_SLUG_QUERY = `
  *[_type == "vehicle" && slug.current == $slug][0] {
    _id, year, make, model, trim, vin, stockNumber, price, msrp, specialPrice,
    status, condition, featured, mileage, exteriorColor, interiorColor, bodyStyle,
    fuelType, transmission, drivetrain, engine, horsepower, doors, seats, evRange,
    batteryCapacity, features, safetyFeatures, "mainImage": mainImage.asset->url,
    "images": images[].asset->url, description, highlights, carfaxUrl, previousOwners,
    accidentFree, serviceHistory, slug, seoTitle, seoDescription
  }
`

export const FEATURED_VEHICLES_QUERY = `
  *[_type == "vehicle" && featured == true && status == "available"] | order(_createdAt desc)[0...8] {
    _id, year, make, model, trim, price, mileage, fuelType, "mainImage": mainImage.asset->url, slug
  }
`

export const VEHICLE_COUNT_QUERY = `count(*[_type == "vehicle" && status == "available"])`

export const VEHICLES_BY_STOCK_NUMBERS_QUERY = `
  *[_type == "vehicle" && stockNumber in $stockNumbers && status == "available"] {
    _id, year, make, model, trim, price, mileage, fuelType, "mainImage": mainImage.asset->url, slug, stockNumber
  }
`

export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    dealerName, phone, email, streetAddress, city, province, postalCode, latitude, longitude,
    omvicNumber, businessHours, facebookUrl, instagramUrl, twitterUrl, youtubeUrl,
    googleMapsEmbedUrl, announcementBar, mainNavigation, financingDefaults,
    deliveryConfiguration, aggregateRating, defaultSeo, leadRoutingRules, depositAmount
  }
`

export const HOMEPAGE_QUERY = `
  *[_type == "homepage"][0] {
    heroSection { headline, subheadline, primaryCta, secondaryCta, "backgroundImage": backgroundImage.asset->url, altText, trustBadges },
    featuredVehicleStockNumbers,
    promoBanner { showBanner, headline, bodyText, ctaLabel, ctaUrl, backgroundColor },
    testimonials, faqHighlights
  }
`

export const NAVIGATION_QUERY = `
  *[_type == "navigation"][0] {
    topBar { showTopBar, phoneNumber, phoneDisplayText, address, addressLink, trustBadges },
    mainNavigation,
    headerCta { showCta, buttonLabel, buttonUrl, buttonStyle },
    footerLinkColumns,
    footerBottom { copyrightText, legalLinks }
  }
`

export const BLOG_LIST_QUERY = `
  *[_type == "blogPost"] | order(publishedAt desc)[$start...$end] {
    _id, title, slug, publishedAt, excerpt, "coverImage": coverImage.asset->url, seoTitle, seoDescription
  }
`

export const BLOG_COUNT_QUERY = `count(*[_type == "blogPost"])`

export const BLOG_POST_QUERY = `
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id, title, slug, publishedAt, excerpt, "coverImage": coverImage.asset->url, body, seoTitle, seoDescription
  }
`

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
  *[_type == "inventorySettings"][0] {
    displaySettings { pageTitle, pageSubtitle, defaultView, itemsPerPage, showFiltersSidebar },
    filterConfiguration, sortingOptions, vehicleBadges, seo
  }
`

export const LENDERS_QUERY = `
  *[_type == "lender"] | order(order asc) {
    _id, name, "logo": logo.asset->url, description, specialties, featured
  }
`

export const BANNERS_QUERY = `
  *[_type == "banner" && active == true] | order(priority desc) {
    _id, title, message, ctaLabel, ctaUrl, "backgroundImage": backgroundImage.asset->url, backgroundColor, textColor, position, pages
  }
`
