// Sanity CMS Types for Planet Motors

export interface SiteSettings {
  dealerName: string
  phone: string
  tollFree?: string
  email: string
  address: {
    street: string
    city: string
    province: string
    postalCode: string
  }
  hours: {
    weekdays: string
    saturday: string
    sunday: string
  }
  financing: {
    minDownPayment: number
    maxTerm: number
    defaultRate: number
  }
  delivery: {
    freeDeliveryRadius: number
    perKmRate: number
  }
  leadRouting: {
    salesEmail: string
    financeEmail: string
    tradeInEmail: string
  }
  socialLinks?: {
    facebook?: string
    instagram?: string
    twitter?: string
    youtube?: string
    tiktok?: string
  }
}

export interface HomepageHero {
  headline: string
  subheadline: string
  ctaLabel: string
  ctaUrl: string
  backgroundImage: string
}

export interface Testimonial {
  _id: string
  customerName: string
  rating: number
  review: string
  vehiclePurchased?: string
  publishedAt: string
  featured?: boolean
}

export interface Promotion {
  _id: string
  title: string
  message: string
  ctaLabel: string
  ctaUrl: string
  startDate: string
  endDate: string
}

export interface FaqEntry {
  _id: string
  question: string
  answer: any[] // Portable Text
  category: "general" | "financing" | "trade-in" | "delivery" | "warranty" | "ev"
}

export interface BlogPost {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt: string
  coverImage: string
  body?: any[] // Portable Text
  seoTitle?: string
  seoDescription?: string
}

export interface ProtectionPlan {
  _id: string
  name: string
  description: string
  price: number
  features: string[]
  coverage: string
  icon?: string
}

export interface HomepageData {
  hero: HomepageHero | null
  testimonials: Testimonial[]
  promos: Promotion | null
  faqPreview: FaqEntry[]
}
