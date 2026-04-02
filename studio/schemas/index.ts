// Vehicle
import { vehicle } from './vehicle'
import { lender } from './lender'

// Pages - Homepage, Financing, Sell Your Car, Landing Pages, VDP Settings
import { pageSchemas } from './pages'

// Homepage & Website Components
import { homepageHero, banner, page, promotion } from './homepage'

// Content
import { blogPost, testimonial, faqEntry, protectionPlan } from './content'

// Settings
import { siteSettings, seoSettings } from './settings'
import { inventorySettings } from './inventorySettings'

export const schemaTypes = [
  // Vehicles
  vehicle,
  lender,
  
  // Pages (Homepage, Financing, Sell Your Car, VDP Settings, Object types)
  ...pageSchemas,
  
  // Website Components
  homepageHero,
  banner,
  page,
  promotion,
  
  // Content
  blogPost,
  testimonial,
  faqEntry,
  protectionPlan,
  
  // Settings
  siteSettings,
  seoSettings,
  inventorySettings,
]
