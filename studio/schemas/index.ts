// Planet Motors - Sanity Schema Index
// Last updated: 2025-04-25 — added author schema, lender from lender.ts (not pages.ts)

import { vehicle } from './vehicle'
import { lender } from './lender'
import { pageSchemas } from './pages'
import { homepageHero, banner, page, promotion } from './homepage'
import { author, blogPost, testimonial, faqEntry, protectionPlan } from './content'
import { siteSettings, seoSettings, navigation } from './settings'
import { inventorySettings } from './inventorySettings'
import { supabaseVehicleReference } from './supabaseVehicleReference'

export const schemaTypes = [
  // Vehicles
  vehicle,

  // Lender (full schema from lender.ts — NOT the minimal duplicate from pages.ts)
  lender,

  // Page schemas (object types + page documents — lender removed from this array)
  ...pageSchemas,

  // Website components
  homepageHero,
  banner,
  page,
  promotion,

  // Content
  author,
  blogPost,
  testimonial,
  faqEntry,
  protectionPlan,

  // Settings
  siteSettings,
  seoSettings,
  inventorySettings,
  navigation,

  // Custom input types
  supabaseVehicleReference,
]
