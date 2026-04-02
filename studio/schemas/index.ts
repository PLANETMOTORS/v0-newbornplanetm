// Planet Motors - Sanity Schema Index - COMPLETE
// All 25+ schemas for full CMS coverage

// Vehicle & Lender
import { vehicle } from './vehicle'
import { lender } from './lender'

// Pages - ALL page types including new ones:
// Homepage, Financing, Sell Your Car, Trade-In, Contact, About, Blog Index,
// Inventory, Services, Warranty, FAQ Page, Landing Page, VDP Settings, AI Settings
import { pageSchemas } from './pages'

// Homepage & Website Components
import { homepageHero, banner, page, promotion } from './homepage'

// Content
import { blogPost, testimonial, faqEntry, protectionPlan } from './content'

// Settings
import { siteSettings, seoSettings, navigation } from './settings'
import { inventorySettings } from './inventorySettings'

export const schemaTypes = [
  // Vehicles
  vehicle,
  lender,
  
  // All Page Schemas (25+ types including object types)
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
  navigation,
]
