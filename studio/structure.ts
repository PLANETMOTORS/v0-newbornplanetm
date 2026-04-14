import type { StructureBuilder } from 'sanity/structure'
import { 
  Car, Home, Settings, HelpCircle, DollarSign, Megaphone, FileStack, Receipt, Menu, Bot, ArrowRightLeft, Phone, Users, BookOpen, Wrench, CheckCircle, Calculator, Truck
} from 'lucide-react'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Planet Motors CMS')
    .items([
      // INVENTORY
      S.listItem()
        .title('Inventory')
        .icon(() => Car({ size: 20 }))
        .child(
          S.list()
            .title('Inventory')
            .items([
              S.documentTypeListItem('vehicle').title('All Vehicles'),
              S.divider(),
              S.listItem().title('By Status').child(
                S.list().title('By Status').items([
                  S.listItem().title('Available').child(S.documentList().title('Available').filter('_type == "vehicle" && status == "available"')),
                  S.listItem().title('In-Transit').child(S.documentList().title('In-Transit').filter('_type == "vehicle" && status == "in-transit"')),
                  S.listItem().title('Reserved').child(S.documentList().title('Reserved').filter('_type == "vehicle" && status == "reserved"')),
                  S.listItem().title('Sold').child(S.documentList().title('Sold').filter('_type == "vehicle" && status == "sold"')),
                ])
              ),
            ])
        ),
      
      // FINANCING
      S.listItem()
        .title('Financing')
        .icon(() => DollarSign({ size: 20 }))
        .child(
          S.list()
            .title('Financing')
            .items([
              S.documentTypeListItem('lender').title('Lenders'),
              S.divider(),
              S.listItem().title('Financing Page').icon(() => Receipt({ size: 20 })).child(S.document().schemaType('financingPage').documentId('financingPage').title('Financing Page Content')),
              S.listItem().title('Calculator Settings').icon(() => Calculator({ size: 20 })).child(S.document().schemaType('calculatorSettings').documentId('calculatorSettings').title('Finance Calculator Settings')),
            ])
        ),
      
      // DELIVERY
      S.listItem()
        .title('Delivery')
        .icon(() => Truck({ size: 20 }))
        .child(S.document().schemaType('deliverySettings').documentId('deliverySettings').title('Delivery Calculator Settings')),
      
      S.divider(),
      
      // PAGES
      S.listItem()
        .title('Pages')
        .icon(() => FileStack({ size: 20 }))
        .child(
          S.list()
            .title('Website Pages')
            .items([
              S.listItem().title('Homepage').icon(() => Home({ size: 20 })).child(S.document().schemaType('homepage').documentId('homepage').title('Homepage')),
              S.divider(),
              S.listItem().title('Sell Your Car').icon(() => ArrowRightLeft({ size: 20 })).child(S.document().schemaType('sellYourCarPage').documentId('sellYourCarPage').title('Sell Your Car Page')),
              S.listItem().title('Contact Us').icon(() => Phone({ size: 20 })).child(S.document().schemaType('contactPage').documentId('contactPage').title('Contact Us Page')),
              S.listItem().title('About Us').icon(() => Users({ size: 20 })).child(S.document().schemaType('aboutPage').documentId('aboutPage').title('About Us Page')),
              S.listItem().title('Blog Index').icon(() => BookOpen({ size: 20 })).child(S.document().schemaType('blogIndexPage').documentId('blogIndexPage').title('Blog Index Page')),
              S.listItem().title('Services').icon(() => Wrench({ size: 20 })).child(S.document().schemaType('servicesPage').documentId('servicesPage').title('Services Page')),
              S.listItem().title('Warranty').icon(() => CheckCircle({ size: 20 })).child(S.document().schemaType('warrantyPage').documentId('warrantyPage').title('Warranty Page')),
              S.listItem().title('FAQ Page').icon(() => HelpCircle({ size: 20 })).child(S.document().schemaType('faqPage').documentId('faqPage').title('FAQ Page')),
              S.divider(),
              S.listItem().title('Legacy Pages').child(
                S.list().title('Legacy').items([
                  S.documentTypeListItem('sellPage').title('Sell Page (Legacy)'),
                ])
              ),
            ])
        ),
      
      // CONTENT
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
            ])
        ),
      
      S.divider(),
      
      // SETTINGS
      S.listItem()
        .title('Settings')
        .icon(() => Settings({ size: 20 }))
        .child(
          S.list()
            .title('Settings')
            .items([
              S.listItem().title('Site Settings').icon(() => Settings({ size: 20 })).child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site Settings')),
              S.listItem().title('Navigation').icon(() => Menu({ size: 20 })).child(S.document().schemaType('navigation').documentId('navigation').title('Navigation')),
              S.listItem().title('AI Settings').icon(() => Bot({ size: 20 })).child(S.document().schemaType('aiSettings').documentId('aiSettings').title('AI & Automation')),
              S.listItem().title('VDP Settings').icon(() => Car({ size: 20 })).child(S.document().schemaType('vdpSettings').documentId('vdpSettings').title('VDP Settings')),
              S.listItem().title('Customer Auth').icon(() => Users({ size: 20 })).child(S.document().schemaType('customerAuthSettings').documentId('customerAuthSettings').title('Customer Sign-In Settings')),
            ])
        ),
    ])
