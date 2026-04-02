import { groq } from "next-sanity"

// ==========================================
// VEHICLE QUERIES
// ==========================================

// All vehicles with filters
export const VEHICLES_QUERY = groq`
  *[_type == "vehicle" && status == "available"] | order(_createdAt desc) {
    _id,
    year,
    make,
    model,
    trim,
    vin,
    stockNumber,
    price,
    msrp,
    specialPrice,
    status,
    condition,
    featured,
    mileage,
    exteriorColor,
    interiorColor,
    bodyStyle,
    fuelType,
    transmission,
    drivetrain,
    engine,
    horsepower,
    doors,
    seats,
    evRange,
    batteryCapacity,
    features,
    safetyFeatures,
    "mainImage": mainImage.asset->url,
    "images": images[].asset->url,
    description,
    highlights,
    carfaxUrl,
    previousOwners,
    accidentFree,
    serviceHistory,
    slug,
    seoTitle,
    seoDescription
  }
`

// Single vehicle by slug
export const VEHICLE_BY_SLUG_QUERY = groq`
  *[_type == "vehicle" && slug.current == $slug][0] {
    _id,
    year,
    make,
    model,
    trim,
    vin,
    stockNumber,
    price,
    msrp,
    specialPrice,
    status,
    condition,
    featured,
    mileage,
    exteriorColor,
    interiorColor,
    bodyStyle,
    fuelType,
    transmission,
    drivetrain,
    engine,
    horsepower,
    doors,
    seats,
    evRange,
    batteryCapacity,
    features,
    safetyFeatures,
    "mainImage": mainImage.asset->url,
    "images": images[].asset->url,
    description,
    highlights,
    carfaxUrl,
    previousOwners,
    accidentFree,
    serviceHistory,
    slug,
    seoTitle,
    seoDescription
  }
`

// Featured vehicles for homepage
export const FEATURED_VEHICLES_QUERY = groq`
  *[_type == "vehicle" && featured == true && status == "available"] | order(_createdAt desc)[0...8] {
    _id,
    year,
    make,
    model,
    trim,
    price,
    mileage,
    fuelType,
    "mainImage": mainImage.asset->url,
    slug
  }
`

// Vehicle count for pagination
export const VEHICLE_COUNT_QUERY = groq`
  count(*[_type == "vehicle" && status == "available"])
`

// ==========================================
// SITE SETTINGS & CONTENT QUERIES
// ==========================================

// Site Settings - dealer info, hours, financing, delivery config
export const SITE_SETTINGS_QUERY = groq`
  *[_type == "siteSettings"][0] {
    dealerName,
    phone,
    email,
    streetAddress,
    city,
    province,
    postalCode,
    latitude,
    longitude,
    omvicNumber,
    businessHours,
    facebookUrl,
    instagramUrl,
    twitterUrl,
    youtubeUrl,
    googleMapsEmbedUrl,
    announcementBar,
    mainNavigation,
    financingDefaults,
    deliveryConfiguration,
    aggregateRating,
    defaultSeo,
    leadRoutingRules,
    depositAmount
  }
`

// Homepage - hero, testimonials, FAQ preview
export const HOMEPAGE_QUERY = groq`
  *[_type == "homepage"][0] {
    heroSection {
      headline,
      subheadline,
      primaryCta,
      secondaryCta,
      "backgroundImage": backgroundImage.asset->url,
      altText,
      trustBadges
    },
    featuredVehicleStockNumbers,
    promoBanner {
      showBanner,
      headline,
      bodyText,
      ctaLabel,
      ctaUrl,
      backgroundColor
    },
    testimonials,
    faqHighlights
  }
`

// Navigation settings
export const NAVIGATION_QUERY = groq`
  *[_type == "navigation"][0] {
    topBar {
      showTopBar,
      phoneNumber,
      phoneDisplayText,
      address,
      addressLink,
      trustBadges
    },
    mainNavigation,
    headerCta {
      showCta,
      buttonLabel,
      buttonUrl,
      buttonStyle
    },
    footerLinkColumns,
    footerBottom {
      copyrightText,
      legalLinks
    }
  }
`

// Blog listing - paginated
export const BLOG_LIST_QUERY = groq`
  *[_type == "blogPost"] | order(publishedAt desc)[$start...$end] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    "coverImage": coverImage.asset->url,
    seoTitle,
    seoDescription
  }
`

// Blog post count for pagination
export const BLOG_COUNT_QUERY = groq`
  count(*[_type == "blogPost"])
`

// Single blog post
export const BLOG_POST_QUERY = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    "coverImage": coverImage.asset->url,
    body,
    seoTitle,
    seoDescription
  }
`

// All FAQs by category
export const FAQ_QUERY = groq`
  *[_type == "faqEntry"] | order(category asc, order asc) {
    _id,
    question,
    answer,
    category
  }
`

// Active promotions (date-gated)
export const ACTIVE_PROMOS_QUERY = groq`
  *[_type == "promotion" && active == true && startDate <= now() && endDate >= now()] {
    _id,
    title,
    message,
    ctaLabel,
    ctaUrl,
    startDate,
    endDate
  }
`

// All testimonials
export const TESTIMONIALS_QUERY = groq`
  *[_type == "testimonial"] | order(publishedAt desc) {
    _id,
    customerName,
    rating,
    review,
    vehiclePurchased,
    publishedAt,
    featured
  }
`

// Protection/warranty plans
export const PROTECTION_PLANS_QUERY = groq`
  *[_type == "protectionPlan"] | order(order asc) {
    _id,
    name,
    description,
    price,
    features,
    coverage,
    "icon": icon.asset->url
  }
`

// Sell Your Car page content
export const SELL_YOUR_CAR_PAGE_QUERY = groq`
  *[_type == "sellYourCar"][0] {
    heroSection {
      headline,
      subheadline,
      highlightText,
      formSettings,
      trustBadges,
      "backgroundImage": backgroundImage.asset->url
    },
    benefits,
    comparisonTable,
    processSteps,
    testimonials,
    ctaSection,
    seo
  }
`

// Financing page content
export const FINANCING_PAGE_QUERY = groq`
  *[_type == "financing"][0] {
    heroSection {
      headline,
      subheadline,
      featuredRateText,
      rateSubtext,
      primaryCta,
      secondaryCta,
      heroStats
    },
    lenders,
    calculator,
    processSteps,
    benefits,
    faqs,
    seo
  }
`

// Inventory Settings
export const INVENTORY_SETTINGS_QUERY = groq`
  *[_type == "inventorySettings"][0] {
    displaySettings {
      pageTitle,
      pageSubtitle,
      defaultView,
      itemsPerPage,
      showFiltersSidebar
    },
    filterConfiguration,
    sortingOptions,
    vehicleBadges,
    seo
  }
`

// Lenders
export const LENDERS_QUERY = groq`
  *[_type == "lender"] | order(order asc) {
    _id,
    name,
    "logo": logo.asset->url,
    description,
    specialties,
    featured
  }
`

// Banners
export const BANNERS_QUERY = groq`
  *[_type == "banner" && active == true] | order(priority desc) {
    _id,
    title,
    message,
    ctaLabel,
    ctaUrl,
    "backgroundImage": backgroundImage.asset->url,
    backgroundColor,
    textColor,
    position,
    pages
  }
`
