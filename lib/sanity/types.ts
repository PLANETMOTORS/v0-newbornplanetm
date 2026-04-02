// Sanity CMS Types for Planet Motors - matches cms.planetmotors.ca schema

// ==========================================
// SITE CONFIGURATION
// ==========================================

export interface BusinessHour {
  day: string
  open: string
  close: string
  isClosed?: boolean
}

export interface LeadRoutingRule {
  role: string
  email: string
}

export interface SiteSettings {
  dealerName: string
  phone: string
  email: string
  streetAddress: string
  city: string
  province: string
  postalCode: string
  latitude?: number
  longitude?: number
  omvicRegistration?: string
  businessHours?: BusinessHour[]
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  youtubeUrl?: string
  googleMapsUrl?: string
  announcementBar?: {
    showBar: boolean
    message: string
    linkUrl?: string
  }
  financingDefaults?: {
    annualInterestRate: number
    amortizationMonths: number
  }
  deliveryConfiguration?: {
    originPostalCode: string
    originLabel: string
    maxDeliveryDistanceKm: number
    freeDeliveryRadiusKm: number
  }
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  }
  defaultSeo?: {
    metaTitle: string
    metaDescription: string
  }
  leadRoutingRules?: LeadRoutingRule[]
  depositAmount?: number
}

export interface NavItem {
  label: string
  url: string
  children?: NavItem[]
}

export interface FooterColumn {
  title: string
  links: { label: string; url: string }[]
}

export interface Navigation {
  topBar?: {
    showTopBar: boolean
    phoneNumber?: string
    phoneDisplayText?: string
    address?: string
    addressLink?: string
  }
  trustBadges?: { label: string; icon?: string }[]
  mainNavigation?: NavItem[]
  headerCta?: {
    showCta: boolean
    buttonLabel?: string
    buttonUrl?: string
    buttonStyle?: string
  }
  footerLinkColumns?: FooterColumn[]
  footerBottom?: {
    copyrightText?: string
    legalLinks?: { label: string; url: string }[]
  }
}

// ==========================================
// PAGES
// ==========================================

export interface HeroSection {
  headline?: string
  subheadline?: string
  primaryCta?: { buttonLabel: string; url: string }
  secondaryCta?: { buttonLabel: string; url: string }
  backgroundImage?: string
  altText?: string
}

export interface HomepageData {
  heroSection?: HeroSection
  trustBadges?: { label: string; icon?: string }[]
  featuredVehicleStockNumbers?: string[]
  promoBanner?: {
    showBanner: boolean
    headline?: string
    bodyText?: string
    ctaLabel?: string
    ctaUrl?: string
    backgroundColor?: string
  }
  testimonials?: Testimonial[]
  faqHighlights?: FaqEntry[]
}

export interface SellYourCarPage {
  heroSection?: {
    headline?: string
    subheadline?: string
    highlightText?: string
    formSettings?: {
      licensePlatePlaceholder?: string
      vinPlaceholder?: string
      submitButtonText?: string
    }
    trustBadges?: { label: string; icon?: string }[]
    backgroundImage?: string
  }
  benefits?: { title: string; description: string; icon?: string }[]
  comparisonTable?: {
    headline?: string
    rows?: { feature: string; planetMotors: string; competitors: string }[]
  }
  processSteps?: { stepNumber: number; title: string; description: string; icon?: string }[]
  testimonials?: Testimonial[]
  ctaSection?: {
    headline?: string
    subheadline?: string
    buttonLabel?: string
    buttonUrl?: string
  }
  seo?: SeoFields
}

export interface FinancingPage {
  heroSection?: {
    headline?: string
    subheadline?: string
    featuredRateText?: string
    rateSubtext?: string
    primaryCta?: { buttonLabel: string; url: string }
    secondaryCta?: { buttonLabel: string; url: string }
    heroStats?: { value: string; label: string }[]
  }
  lenders?: Lender[]
  calculator?: {
    defaultDownPayment?: number
    defaultTerm?: number
    defaultRate?: number
  }
  processSteps?: { stepNumber: number; title: string; description: string; icon?: string }[]
  benefits?: { title: string; description: string; icon?: string }[]
  faqs?: FaqEntry[]
  seo?: SeoFields
}

export interface InventorySettings {
  displaySettings?: {
    pageTitle?: string
    pageSubtitle?: string
    defaultView?: "grid" | "list"
    itemsPerPage?: number
    showFiltersSidebar?: boolean
  }
  filterConfiguration?: {
    enabledFilters?: string[]
    priceRanges?: { min: number; max: number; label: string }[]
    mileageRanges?: { min: number; max: number; label: string }[]
  }
  sortingOptions?: { value: string; label: string; default?: boolean }[]
  vehicleBadges?: { condition: string; label: string; color: string }[]
  seo?: SeoFields
}

export interface SeoFields {
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
}

// ==========================================
// INVENTORY / VEHICLES
// ==========================================

export interface Vehicle {
  _id: string
  year: number
  make: string
  model: string
  trim?: string
  vin?: string
  stockNumber?: string
  price: number
  msrp?: number
  specialPrice?: number
  status?: "available" | "pending" | "sold"
  condition?: "new" | "used" | "certified"
  featured?: boolean
  mileage?: number
  exteriorColor?: string
  interiorColor?: string
  bodyStyle?: string
  fuelType?: string
  transmission?: string
  drivetrain?: string
  engine?: string
  horsepower?: number
  doors?: number
  seats?: number
  evRange?: number
  batteryCapacity?: number
  features?: string[]
  safetyFeatures?: string[]
  mainImage?: string
  images?: string[]
  description?: string
  highlights?: string[]
  carfaxUrl?: string
  previousOwners?: number
  accidentFree?: boolean
  serviceHistory?: string
  slug?: string
  seoTitle?: string
  seoDescription?: string
}

// ==========================================
// CONTENT
// ==========================================

export interface Testimonial {
  _id: string
  customerName: string
  rating: number
  review: string
  vehiclePurchased?: string
  date?: string
  featured?: boolean
}

export interface BlogPost {
  _id: string
  title: string
  slug: string
  publishedAt: string
  excerpt?: string
  coverImage?: string
  body?: any[] // Portable Text
  seo?: SeoFields
}

export interface FaqEntry {
  _id: string
  question: string
  answer: string
  category?: string
}

export interface Lender {
  _id: string
  name: string
  logo?: string
  description?: string
  website?: string
}

export interface ProtectionPlan {
  _id: string
  name: string
  description?: string
  price?: number
  features?: string[]
  recommended?: boolean
}

// ==========================================
// MARKETING
// ==========================================

export interface Promotion {
  _id: string
  title: string
  message?: string
  ctaLabel?: string
  ctaUrl?: string
  startDate: string
  endDate: string
  backgroundImage?: string
}

export interface Banner {
  _id: string
  title: string
  message?: string
  ctaLabel?: string
  ctaUrl?: string
  image?: string
  backgroundColor?: string
  textColor?: string
}
