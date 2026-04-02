// Vehicle
import { vehicle } from './vehicle'
import { lender } from './lender'

// Pages - Homepage, Financing, Sell Your Car, Sell Page (legacy), AI Settings, FAQ Item
// Also includes object types: trustBadge, benefitItem, processStep
import { pageSchemas } from './pages'

// Homepage & Website Components
import { homepageHero, banner, page, promotion } from './homepage'

// Content (faqItem is in pageSchemas to match database structure)
import { blogPost, testimonial, faqEntry, protectionPlan } from './content'

// Settings
import { siteSettings, seoSettings, navigation } from './settings'
import { inventorySettings } from './inventorySettings'

export const schemaTypes = [
  // Vehicles
  vehicle,
  lender,
  
  // Pages (Homepage, Financing, Sell Your Car, Sell Page Legacy, AI Settings, FAQ Item)
  // Also includes object types: trustBadge, benefitItem, processStep
  ...pageSchemas,
  
  // Website Components (Hero variants, Banners, Static Pages, Promotions)
  homepageHero,
  banner,
  page,
  promotion,
  
  // Content (Blog, Testimonials, FAQ Entry, Protection Plans)
  blogPost,
  testimonial,
  faqEntry,
  protectionPlan,
  
  // Settings
  siteSettings,
  seoSettings,
  inventorySettings,
  navigation,
]
