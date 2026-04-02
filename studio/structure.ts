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
  Menu,
  Bot,
  ArrowRightLeft
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
              S.listItem()
                .title('Sell Page (Legacy)')
                .icon(() => ArrowRightLeft({ size: 20 }))
                .child(
                  S.documentTypeList('sellPage').title('Sell Page (Legacy)')
                ),
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
        .child(S.documentTypeList('faqItem').title('FAQ Items')),
      
      // Protection Plans
      S.listItem()
        .title('Protection Plans')
        .icon(() => Shield({ size: 20 }))
        .child(S.documentTypeList('protectionPlan').title('Protection Plans')),
      
      S.divider(),
      
      // AI Settings
      S.listItem()
        .title('AI Settings')
        .icon(() => Bot({ size: 20 }))
        .child(
          S.document()
            .schemaType('aiSettings')
            .documentId('aiSettings')
            .title('AI & Automation Settings')
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
