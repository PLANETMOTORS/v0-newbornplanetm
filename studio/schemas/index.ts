// Vehicle
import { vehicle } from './vehicle'
import { lender } from './lender'

// Homepage & Website
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
  
  // Website Content
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
