import type { StructureBuilder } from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Planet Motors CMS')
    .items([
      // INVENTORY
      S.listItem()
        .title('Inventory')
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
        .child(
          S.list()
            .title('Financing')
            .items([
              S.documentTypeListItem('lender').title('Lenders'),
              S.divider(),
              S.listItem().title('Financing Page').child(S.document().schemaType('financingPage').documentId('financingPage').title('Financing Page Content')),
              S.listItem().title('Calculator Settings').child(S.document().schemaType('calculatorSettings').documentId('calculatorSettings').title('Finance Calculator Settings')),
            ])
        ),

      // DELIVERY
      S.listItem()
        .title('Delivery')
        .child(S.document().schemaType('deliverySettings').documentId('deliverySettings').title('Delivery Calculator Settings')),

      S.divider(),

      // PAGES
      S.listItem()
        .title('Pages')
        .child(
          S.list()
            .title('Website Pages')
            .items([
              S.listItem().title('Homepage').child(S.document().schemaType('homepage').documentId('homepage').title('Homepage')),
              S.divider(),
              S.listItem().title('Sell Your Car').child(S.document().schemaType('sellYourCarPage').documentId('sellYourCarPage').title('Sell Your Car Page')),
              S.divider(),
              S.documentTypeListItem('page').title('Static Pages'),
              S.documentTypeListItem('homepageHero').title('Hero Variants'),
              S.documentTypeListItem('banner').title('Banners'),
              S.documentTypeListItem('promotion').title('Promotions'),
            ])
        ),

      // CONTENT
      S.listItem()
        .title('Content')
        .child(
          S.list()
            .title('Content')
            .items([
              S.documentTypeListItem('blogPost').title('Blog Posts'),
              S.documentTypeListItem('testimonial').title('Testimonials'),
              S.documentTypeListItem('faqEntry').title('FAQ Entries'),
              S.documentTypeListItem('faqItem').title('FAQ Items (Legacy)'),
              S.documentTypeListItem('protectionPlan').title('Protection Plans'),
            ])
        ),

      S.divider(),

      // SETTINGS
      S.listItem()
        .title('Settings')
        .child(
          S.list()
            .title('Settings')
            .items([
              S.listItem().title('Site Settings').child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site Settings')),
              S.listItem().title('Navigation').child(S.document().schemaType('navigation').documentId('navigation').title('Navigation')),
              S.listItem().title('Inventory Settings').child(S.document().schemaType('inventorySettings').documentId('inventorySettings').title('Inventory Settings')),
              S.listItem().title('AI Settings').child(S.document().schemaType('aiSettings').documentId('aiSettings').title('AI & Automation')),
              S.listItem().title('VDP Settings').child(S.document().schemaType('vdpSettings').documentId('vdpSettings').title('VDP Settings')),
              S.listItem().title('Customer Auth').child(S.document().schemaType('customerAuthSettings').documentId('customerAuthSettings').title('Customer Sign-In Settings')),
              S.divider(),
              S.documentTypeListItem('seoSettings').title('SEO Settings'),
            ])
        ),
    ])
