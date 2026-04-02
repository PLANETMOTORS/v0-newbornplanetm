import type { StructureBuilder } from 'sanity/structure'
import { 
  Car, 
  Home, 
  FileText, 
  Settings, 
  Star, 
  HelpCircle,
  Shield,
  DollarSign,
  LayoutGrid,
  Megaphone,
  FileStack,
  Receipt,
  Menu,
  Bot,
  ArrowRightLeft,
  Phone,
  Users,
  BookOpen,
  Wrench,
  CheckCircle,
  Tags
} from 'lucide-react'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Planet Motors CMS')
    .items([
      // ============================================
      // INVENTORY
      // ============================================
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
                      S.listItem().title('Available').child(S.documentList().title('Available').filter('_type == "vehicle" && status == "available"')),
                      S.listItem().title('In-Transit').child(S.documentList().title('In-Transit').filter('_type == "vehicle" && status == "in-transit"')),
                      S.listItem().title('Reserved').child(S.documentList().title('Reserved').filter('_type == "vehicle" && status == "reserved"')),
                      S.listItem().title('Pending Sale').child(S.documentList().title('Pending Sale').filter('_type == "vehicle" && status == "pending"')),
                      S.listItem().title('Sold').child(S.documentList().title('Sold').filter('_type == "vehicle" && status == "sold"')),
                    ])
                ),
              S.divider(),
              S.listItem()
                .title('Inventory Page Settings')
                .icon(() => LayoutGrid({ size: 20 }))
                .child(S.document().schemaType('inventoryPage').documentId('inventoryPage').title('Inventory Page')),
              S.listItem()
                .title('VDP Settings')
                .icon(() => Tags({ size: 20 }))
                .child(S.document().schemaType('vdpSettings').documentId('vdpSettings').title('Vehicle Detail Page Settings')),
            ])
        ),
      
      // ============================================
      // FINANCING
      // ============================================
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
                .child(S.document().schemaType('financingPage').documentId('financingPage').title('Financing Page Content')),
              S.listItem()
                .title('Inventory Settings')
                .icon(() => LayoutGrid({ size: 20 }))
                .child(S.document().schemaType('inventorySettings').documentId('inventorySettings').title('Payment Calculator & Credit Tiers')),
            ])
        ),
      
      S.divider(),
      
      // ============================================
      // PAGES - ALL WEBSITE PAGES
      // ============================================
      S.listItem()
        .title('Pages')
        .icon(() => FileStack({ size: 20 }))
        .child(
          S.list()
            .title('Website Pages')
            .items([
              // Homepage
              S.listItem()
                .title('Homepage')
                .icon(() => Home({ size: 20 }))
                .child(S.document().schemaType('homepage').documentId('homepage').title('Homepage')),
              
              S.divider(),
              
              // Sell Your Car
              S.listItem()
                .title('Sell Your Car')
                .icon(() => ArrowRightLeft({ size: 20 }))
                .child(S.document().schemaType('sellYourCarPage').documentId('sellYourCarPage').title('Sell Your Car Page')),
              
              // Trade-In
              S.listItem()
                .title('Trade-In')
                .icon(() => ArrowRightLeft({ size: 20 }))
                .child(S.document().schemaType('tradeInPage').documentId('tradeInPage').title('Trade-In Page')),
              
              // Contact Us
              S.listItem()
                .title('Contact Us')
                .icon(() => Phone({ size: 20 }))
                .child(S.document().schemaType('contactPage').documentId('contactPage').title('Contact Us Page')),
              
              // About Us
              S.listItem()
                .title('About Us')
                .icon(() => Users({ size: 20 }))
                .child(S.document().schemaType('aboutPage').documentId('aboutPage').title('About Us Page')),
              
              // Blog Index
              S.listItem()
                .title('Blog Index')
                .icon(() => BookOpen({ size: 20 }))
                .child(S.document().schemaType('blogIndexPage').documentId('blogIndexPage').title('Blog Index Page')),
              
              // Services
              S.listItem()
                .title('Services')
                .icon(() => Wrench({ size: 20 }))
                .child(S.document().schemaType('servicesPage').documentId('servicesPage').title('Services Page')),
              
              // Warranty
              S.listItem()
                .title('Warranty')
                .icon(() => CheckCircle({ size: 20 }))
                .child(S.document().schemaType('warrantyPage').documentId('warrantyPage').title('Warranty Page')),
              
              // FAQ Page
              S.listItem()
                .title('FAQ Page')
                .icon(() => HelpCircle({ size: 20 }))
                .child(S.document().schemaType('faqPage').documentId('faqPage').title('FAQ Page')),
              
              S.divider(),
              
              // Custom Landing Pages
              S.listItem()
                .title('Custom Landing Pages')
                .icon(() => FileStack({ size: 20 }))
                .child(S.documentTypeList('landingPage').title('Landing Pages')),
              
              // Legacy Pages
              S.listItem()
                .title('Legacy Pages')
                .child(
                  S.list()
                    .title('Legacy')
                    .items([
                      S.documentTypeListItem('sellPage').title('Sell Page (Legacy)'),
                      S.documentTypeListItem('page').title('Static Pages'),
                    ])
                ),
            ])
        ),
      
      // ============================================
      // CONTENT
      // ============================================
      S.listItem()
        .title('Content')
        .icon(() => Megaphone({ size: 20 }))
        .child(
          S.list()
            .title('Content')
            .items([
              S.documentTypeListItem('blogPost').title('Blog Posts'),
              S.documentTypeListItem('testimonial').title('Testimonials'),
              S.documentTypeListItem('faqItem').title('FAQ Items'),
              S.documentTypeListItem('protectionPlan').title('Protection Plans'),
              S.divider(),
              S.documentTypeListItem('homepageHero').title('Hero Variants'),
              S.documentTypeListItem('banner').title('Banners'),
              S.documentTypeListItem('promotion').title('Promotions'),
            ])
        ),
      
      S.divider(),
      
      // ============================================
      // SETTINGS
      // ============================================
      S.listItem()
        .title('Settings')
        .icon(() => Settings({ size: 20 }))
        .child(
          S.list()
            .title('Settings')
            .items([
              S.listItem()
                .title('Site Settings')
                .icon(() => Settings({ size: 20 }))
                .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site Settings')),
              
              S.listItem()
                .title('Navigation')
                .icon(() => Menu({ size: 20 }))
                .child(S.document().schemaType('navigation').documentId('navigation').title('Navigation')),
              
              S.listItem()
                .title('AI Settings')
                .icon(() => Bot({ size: 20 }))
                .child(S.document().schemaType('aiSettings').documentId('aiSettings').title('AI & Automation')),
            ])
        ),
    ])
