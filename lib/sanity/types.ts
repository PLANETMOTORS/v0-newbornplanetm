export interface SiteSettings {
  dealerName?: string
  phone?: string
  email?: string
  streetAddress?: string
  city?: string
  province?: string
  postalCode?: string
  businessHours?: { day: string; hours: string }[]
  facebookUrl?: string
  instagramUrl?: string
}

export interface Navigation {
  topBar?: { showTopBar?: boolean; phoneNumber?: string; address?: string }
  mainNavigation?: { label: string; url: string }[]
  headerCta?: { showCta?: boolean; buttonLabel?: string; buttonUrl?: string }
}

export interface HomepageData {
  heroSection?: {
    headline?: string
    subheadline?: string
    primaryCta?: { label?: string; url?: string }
    secondaryCta?: { label?: string; url?: string }
    backgroundImage?: string
    trustBadges?: { _key: string; label?: string }[]
  }
  promoBanner?: { showBanner?: boolean; headline?: string; bodyText?: string }
}

export interface Vehicle {
  _id: string
  year?: number
  make?: string
  model?: string
  trim?: string
  price?: number
  mileage?: number
  mainImage?: string
  slug?: { current: string }
}

export interface BlogPost {
  _id: string
  title?: string
  slug?: { current: string }
  publishedAt?: string
  excerpt?: string
  coverImage?: string
}

export interface FaqEntry {
  _id: string
  question?: string
  answer?: string
  category?: string
}

export interface Promotion {
  _id: string
  title?: string
  message?: string
  ctaLabel?: string
  ctaUrl?: string
}

export interface Testimonial {
  _id: string
  customerName?: string
  rating?: number
  review?: string
  location?: string
  featured?: boolean
}

export interface ProtectionPlan {
  _id: string
  name?: string
  description?: string
  price?: number
  features?: string[]
}

export interface Lender {
  _id: string
  name?: string
  logo?: string
  description?: string
}

export interface SellYourCarPage {
  heroSection?: { headline?: string; subheadline?: string }
}

export interface FinancingPage {
  heroSection?: { headline?: string; subheadline?: string }
}

export interface InventorySettings {
  displaySettings?: { pageTitle?: string; itemsPerPage?: number }
}
