// Vehicle
import { vehicle } from './vehicle'
import { lender } from './lender'

// Pages - Homepage, Financing, Sell Your Car, Landing Pages, VDP Settings + Object types
import { pageSchemas } from './pages'

// Homepage & Website Components
import { homepageHero, banner, page, promotion } from './homepage'

// Content
import { blogPost, testimonial, faqItem, faqEntry, protectionPlan } from './content'

// Settings
import { siteSettings, seoSettings, navigation } from './settings'
import { inventorySettings } from './inventorySettings'

export const schemaTypes = [
  // Vehicles
  vehicle,
  lender,
  
  // Pages (Homepage, Financing, Sell Your Car, VDP Settings, AI Settings, Sell Page)
  // Also includes object types: trustBadge, benefitItem, processStep, testimonialItem, comparisonRow, faqItemObj, ctaButton
  ...pageSchemas,
  
  // Website Components (Hero variants, Banners, Static Pages, Promotions)
  homepageHero,
  banner,
  page,
  promotion,
  
  // Content (Blog, Testimonials, FAQ, Protection Plans)
  blogPost,
  testimonial,
  faqItem,
  faqEntry,
  protectionPlan,
  
  // Settings
  siteSettings,
  seoSettings,
  inventorySettings,
  navigation,
]
