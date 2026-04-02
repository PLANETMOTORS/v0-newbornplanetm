export interface SiteSettings {
  dealerName?: string
  phone?: string
  email?: string
  streetAddress?: string
  city?: string
  province?: string
  postalCode?: string
  businessHours?: Array<{ day: string; open: string; close: string; closed: boolean }>
  socialLinks?: Array<{ platform: string; url: string }>
  logo?: { asset?: { url?: string } }
}

export interface Navigation {
  mainNavigation?: Array<{ _id: string; label: string; href: string; order: number }>
}

export interface HomepageData {
  heroSection?: {
    headline?: string
    subheadline?: string
    primaryCta?: { label: string; url: string }
    secondaryCta?: { label: string; url: string }
    backgroundImage?: string
  }
  featuredVehicleStockNumbers?: string[]
}

export interface SellYourCarPage {
  heroSection?: {
    headline?: string
    subheadline?: string
  }
  benefits?: Array<{ title: string; description: string }>
}

export interface FinancingPage {
  heroSection?: {
    headline?: string
    subheadline?: string
  }
  processSteps?: Array<{ title: string; description: string }>
}

export interface InventorySettings {
  displaySettings?: {
    pageTitle?: string
    pageSubtitle?: string
    defaultView?: string
    itemsPerPage?: number
  }
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
  stockNumber?: string
  featured?: boolean
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
  question: string
  answer: string
  category?: string
}

export interface Promotion {
  _id: string
  title?: string
  message?: string
  active?: boolean
}

export interface Testimonial {
  _id: string
  customerName?: string
  rating?: number
  review?: string
  vehiclePurchased?: string
  featured?: boolean
}

export interface ProtectionPlan {
  _id: string
  name?: string
  description?: string
  price?: number
}

export interface Lender {
  _id: string
  name?: string
  logo?: string
  description?: string
}
