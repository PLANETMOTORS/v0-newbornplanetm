import type { StructureBuilder } from 'sanity/structure'
import { 
  Car, 
  Home, 
  FileText, 
  Settings, 
  Star, 
  HelpCircle,
  Shield,
  Search,
  DollarSign,
  LayoutGrid,
  Megaphone,
  FileStack,
  Receipt,
  Menu
} from 'lucide-react'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Planet Motors CMS')
    .items([
      // Inventory
      S.listItem()
        .title('Inventory')
        .icon(() => Car({ size: 20 }))
        .child(
          S.list()
            .title('Inventory')
            .items([
              S.documentTypeListItem('vehicle').title('All Vehicles'),
              S.divider(),
              S.listItem()
                .title('By Status')
                .child(
                  S.list()
                    .title('By Status')
                    .items([
                      S.listItem()
                        .title('Available')
                        .child(S.documentList().title('Available').filter('_type == "vehicle" && status == "available"')),
                      S.listItem()
                        .title('In-Transit')
                        .child(S.documentList().title('In-Transit').filter('_type == "vehicle" && status == "in-transit"')),
                      S.listItem()
                        .title('Reserved')
                        .child(S.documentList().title('Reserved').filter('_type == "vehicle" && status == "reserved"')),
                      S.listItem()
                        .title('Pending Sale')
                        .child(S.documentList().title('Pending Sale').filter('_type == "vehicle" && status == "pending"')),
                      S.listItem()
                        .title('Sold')
                        .child(S.documentList().title('Sold').filter('_type == "vehicle" && status == "sold"')),
                    ])
                ),
              S.listItem()
                .title('By Condition')
                .child(
                  S.list()
                    .title('By Condition')
                    .items([
                      S.listItem()
                        .title('New')
                        .child(S.documentList().title('New Vehicles').filter('_type == "vehicle" && condition == "new"')),
                      S.listItem()
                        .title('Used')
                        .child(S.documentList().title('Used Vehicles').filter('_type == "vehicle" && condition == "used"')),
                      S.listItem()
                        .title('Certified Pre-Owned')
                        .child(S.documentList().title('CPO Vehicles').filter('_type == "vehicle" && condition == "certified"')),
                    ])
                ),
            ])
        ),
      
      // Financing & Lenders
      S.listItem()
        .title('Financing')
        .icon(() => DollarSign({ size: 20 }))
        .child(
          S.list()
            .title('Financing')
            .items([
              S.documentTypeListItem('lender').title('Lenders'),
              S.divider(),
              S.listItem()
                .title('Financing Page')
                .icon(() => Receipt({ size: 20 }))
                .child(
                  S.document()
                    .schemaType('financingPage')
                    .documentId('financingPage')
                    .title('Financing Page Content')
                ),
              S.listItem()
                .title('Inventory Settings')
                .icon(() => LayoutGrid({ size: 20 }))
                .child(
                  S.document()
                    .schemaType('inventorySettings')
                    .documentId('inventorySettings')
                    .title('Inventory & Payment Settings')
                ),
            ])
        ),
      
      S.divider(),
      
      // Homepage
      S.listItem()
        .title('Homepage')
        .icon(() => Home({ size: 20 }))
        .child(
          S.document()
            .schemaType('homepage')
            .documentId('homepage')
            .title('Homepage Content')
        ),
      
      // Landing Pages
      S.listItem()
        .title('Landing Pages')
        .icon(() => FileStack({ size: 20 }))
        .child(
          S.list()
            .title('Landing Pages')
            .items([
              S.listItem()
                .title('Sell Your Car')
                .child(
                  S.document()
                    .schemaType('sellYourCarPage')
                    .documentId('sellYourCarPage')
                    .title('Sell Your Car Page')
                ),
              S.divider(),
              S.documentTypeListItem('landingPage').title('Custom Landing Pages'),
            ])
        ),
      
      // Website Content
      S.listItem()
        .title('Website Content')
        .icon(() => Megaphone({ size: 20 }))
        .child(
          S.list()
            .title('Website Content')
            .items([
              S.documentTypeListItem('homepageHero').title('Hero Variants'),
              S.documentTypeListItem('banner').title('Banners'),
              S.documentTypeListItem('page').title('Static Pages'),
              S.documentTypeListItem('promotion').title('Promotions'),
            ])
        ),
      
      // Blog
      S.listItem()
        .title('Blog')
        .icon(() => FileText({ size: 20 }))
        .child(S.documentTypeList('blogPost').title('Blog Posts')),
      
      // Testimonials
      S.listItem()
        .title('Testimonials')
        .icon(() => Star({ size: 20 }))
        .child(S.documentTypeList('testimonial').title('Testimonials')),
      
      // FAQ
      S.listItem()
        .title('FAQ')
        .icon(() => HelpCircle({ size: 20 }))
        .child(S.documentTypeList('faqEntry').title('FAQ Entries')),
      
      // Protection Plans
      S.listItem()
        .title('Protection Plans')
        .icon(() => Shield({ size: 20 }))
        .child(S.documentTypeList('protectionPlan').title('Protection Plans')),
      
      S.divider(),
      
      // SEO
      S.listItem()
        .title('SEO Settings')
        .icon(() => Search({ size: 20 }))
        .child(S.documentTypeList('seoSettings').title('SEO Settings')),
      
      // VDP Settings
      S.listItem()
        .title('VDP Settings')
        .icon(() => Car({ size: 20 }))
        .child(
          S.document()
            .schemaType('vdpSettings')
            .documentId('vdpSettings')
            .title('Vehicle Detail Page Settings')
        ),
      
      // Navigation
      S.listItem()
        .title('Navigation')
        .icon(() => Menu({ size: 20 }))
        .child(
          S.document()
            .schemaType('navigation')
            .documentId('navigation')
            .title('Navigation Settings')
        ),
      
      // Site Settings
      S.listItem()
        .title('Site Settings')
        .icon(() => Settings({ size: 20 }))
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),
    ])
