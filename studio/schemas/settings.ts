import { defineType, defineField } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'dealer', title: 'Dealer Info' },
    { name: 'contact', title: 'Contact' },
    { name: 'hours', title: 'Business Hours' },
    { name: 'financing', title: 'Financing' },
    { name: 'delivery', title: 'Delivery' },
    { name: 'social', title: 'Social Links' },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    // Hidden compatibility fields
    defineField({ name: 'title', title: 'Title', type: 'string', hidden: true }),
    defineField({ name: 'showFiltersSidebar', title: 'Show Filters Sidebar', type: 'boolean', initialValue: true, hidden: true }),
    
    // Dealer Info
    defineField({ name: 'dealerName', title: 'Dealer Name', type: 'string', initialValue: 'Planet Motors', group: 'dealer' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', group: 'dealer' }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', group: 'dealer' }),
    defineField({ name: 'favicon', title: 'Favicon', type: 'image', group: 'dealer' }),
    defineField({ name: 'omvicLicense', title: 'OMVIC License Number', type: 'string', group: 'dealer' }),
    
    // Contact
    defineField({ name: 'phone', title: 'Phone', type: 'string', group: 'contact' }),
    defineField({ name: 'tollFree', title: 'Toll Free', type: 'string', group: 'contact' }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'contact' }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      group: 'contact',
      fields: [
        { name: 'street', title: 'Street', type: 'string' },
        { name: 'city', title: 'City', type: 'string' },
        { name: 'province', title: 'Province', type: 'string' },
        { name: 'postalCode', title: 'Postal Code', type: 'string' },
        { name: 'country', title: 'Country', type: 'string', initialValue: 'Canada' },
      ],
    }),
    defineField({ name: 'googleMapsUrl', title: 'Google Maps URL', type: 'url', group: 'contact' }),
    defineField({ name: 'latitude', title: 'Latitude', type: 'number', group: 'contact' }),
    defineField({ name: 'longitude', title: 'Longitude', type: 'number', group: 'contact' }),
    
    // Hours
    defineField({
      name: 'businessHours',
      title: 'Business Hours',
      type: 'array',
      group: 'hours',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'day', title: 'Day', type: 'string' },
            { name: 'open', title: 'Open', type: 'string' },
            { name: 'close', title: 'Close', type: 'string' },
            { name: 'isClosed', title: 'Closed', type: 'boolean' },
          ],
          preview: {
            select: { day: 'day', open: 'open', close: 'close', isClosed: 'isClosed' },
            prepare({ day, open, close, isClosed }) {
              return { title: day, subtitle: isClosed ? 'Closed' : `${open} - ${close}` }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'hours',
      title: 'Hours (Simple)',
      type: 'object',
      group: 'hours',
      fields: [
        { name: 'weekdays', title: 'Weekdays', type: 'string', initialValue: '9:00 AM - 8:00 PM' },
        { name: 'saturday', title: 'Saturday', type: 'string', initialValue: '9:00 AM - 6:00 PM' },
        { name: 'sunday', title: 'Sunday', type: 'string', initialValue: 'Closed' },
      ],
    }),
    
    // Financing Defaults
    defineField({
      name: 'financing',
      title: 'Financing Settings',
      type: 'object',
      group: 'financing',
      fields: [
        { name: 'minDownPayment', title: 'Min Down Payment (%)', type: 'number', initialValue: 0 },
        { name: 'maxTerm', title: 'Max Term (months)', type: 'number', initialValue: 84 },
        { name: 'defaultRate', title: 'Default Rate (%)', type: 'number', initialValue: 6.99 },
      ],
    }),
    defineField({
      name: 'financingDefaults',
      title: 'Financing Defaults',
      type: 'object',
      group: 'financing',
      fields: [
        { name: 'annualInterestRate', title: 'Annual Interest Rate (%)', type: 'number', initialValue: 6.99 },
        { name: 'amortizationMonths', title: 'Amortization (months)', type: 'number', initialValue: 60 },
      ],
    }),
    
    // Delivery
    defineField({
      name: 'delivery',
      title: 'Delivery Settings',
      type: 'object',
      group: 'delivery',
      fields: [
        { name: 'freeDeliveryRadius', title: 'Free Delivery Radius (km)', type: 'number', initialValue: 100 },
        { name: 'perKmRate', title: 'Per KM Rate ($)', type: 'number', initialValue: 0.5 },
        { name: 'enabled', title: 'Delivery Enabled', type: 'boolean', initialValue: true },
      ],
    }),
    defineField({
      name: 'deliveryConfiguration',
      title: 'Delivery Configuration',
      type: 'object',
      group: 'delivery',
      fields: [
        { name: 'originPostalCode', title: 'Origin Postal Code', type: 'string' },
        { name: 'originLabel', title: 'Origin Label', type: 'string' },
        { name: 'maxDeliveryDistanceKm', title: 'Max Delivery Distance (km)', type: 'number' },
        { name: 'freeDeliveryRadiusKm', title: 'Free Delivery Radius (km)', type: 'number' },
      ],
    }),
    
    // Lead Routing
    defineField({
      name: 'leadRouting',
      title: 'Lead Routing',
      type: 'object',
      fields: [
        { name: 'salesEmail', title: 'Sales Email', type: 'string' },
        { name: 'financeEmail', title: 'Finance Email', type: 'string' },
        { name: 'tradeInEmail', title: 'Trade-In Email', type: 'string' },
      ],
    }),
    defineField({
      name: 'leadRoutingRules',
      title: 'Lead Routing Rules',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'role', title: 'Role', type: 'string' },
            { name: 'email', title: 'Email', type: 'string' },
          ],
        },
      ],
    }),
    
    // Deposit
    defineField({ name: 'depositAmount', title: 'Deposit Amount ($)', type: 'number', initialValue: 500 }),
    
    // Aggregate Rating
    defineField({
      name: 'aggregateRating',
      title: 'Aggregate Rating (for SEO)',
      type: 'object',
      fields: [
        { name: 'ratingValue', title: 'Rating Value (1-5)', type: 'number' },
        { name: 'reviewCount', title: 'Review Count', type: 'number' },
      ],
    }),
    
    // Announcement Bar
    defineField({
      name: 'announcementBar',
      title: 'Announcement Bar',
      type: 'object',
      fields: [
        { name: 'showBar', title: 'Show Bar', type: 'boolean' },
        { name: 'message', title: 'Message', type: 'string' },
        { name: 'linkUrl', title: 'Link URL', type: 'string' },
      ],
    }),
    
    // Default SEO
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text' },
      ],
    }),
    
    // Social Links
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      group: 'social',
      fields: [
        { name: 'facebook', title: 'Facebook', type: 'url' },
        { name: 'facebookUrl', title: 'Facebook URL', type: 'url' },
        { name: 'instagram', title: 'Instagram', type: 'url' },
        { name: 'instagramUrl', title: 'Instagram URL', type: 'url' },
        { name: 'twitter', title: 'Twitter/X', type: 'url' },
        { name: 'twitterUrl', title: 'Twitter URL', type: 'url' },
        { name: 'youtube', title: 'YouTube', type: 'url' },
        { name: 'youtubeUrl', title: 'YouTube URL', type: 'url' },
        { name: 'tiktok', title: 'TikTok', type: 'url' },
        { name: 'linkedin', title: 'LinkedIn', type: 'url' },
        { name: 'googleMapsUrl', title: 'Google Maps URL', type: 'url' },
      ],
    }),
    
    // Footer
    defineField({ name: 'footerText', title: 'Footer Text', type: 'text', rows: 2, group: 'footer' }),
    defineField({ name: 'copyrightText', title: 'Copyright Text', type: 'string', group: 'footer' }),
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' }
    },
  },
})

// Navigation Schema
export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', initialValue: 'Navigation' }),
    // Top Bar
    defineField({
      name: 'topBar',
      title: 'Top Bar',
      type: 'object',
      fields: [
        { name: 'showTopBar', title: 'Show Top Bar', type: 'boolean', initialValue: true },
        { name: 'phoneNumber', title: 'Phone Number', type: 'string' },
        { name: 'phoneDisplayText', title: 'Phone Display Text', type: 'string' },
        { name: 'address', title: 'Address', type: 'string' },
        { name: 'addressLink', title: 'Address Link (Google Maps)', type: 'url' },
      ],
    }),
    // Trust Badges in Header - references trustBadge type from pages.ts
    defineField({
      name: 'trustBadges',
      title: 'Header Trust Badges',
      type: 'array',
      of: [{ type: 'trustBadge' }],
    }),
    // Main Navigation
    defineField({
      name: 'mainNavigation',
      title: 'Main Navigation',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navItem',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'url', title: 'URL', type: 'string' },
            {
              name: 'children',
              title: 'Dropdown Items',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'label', title: 'Label', type: 'string' },
                    { name: 'url', title: 'URL', type: 'string' },
                    { name: 'description', title: 'Description', type: 'string' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    // Header CTA
    defineField({
      name: 'headerCta',
      title: 'Header CTA Button',
      type: 'object',
      fields: [
        { name: 'showCta', title: 'Show CTA Button', type: 'boolean', initialValue: true },
        { name: 'buttonLabel', title: 'Button Label', type: 'string', initialValue: 'Get Pre-Approved' },
        { name: 'buttonUrl', title: 'Button URL', type: 'string', initialValue: '/financing' },
        { name: 'buttonStyle', title: 'Button Style', type: 'string', options: { list: ['primary', 'secondary', 'outline'] } },
      ],
    }),
    // Footer Link Columns
    defineField({
      name: 'footerLinkColumns',
      title: 'Footer Link Columns',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Column Title', type: 'string' },
            {
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'label', title: 'Label', type: 'string' },
                    { name: 'url', title: 'URL', type: 'string' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    // Footer Bottom
    defineField({
      name: 'footerBottom',
      title: 'Footer Bottom',
      type: 'object',
      fields: [
        { name: 'copyrightText', title: 'Copyright Text', type: 'string' },
        {
          name: 'legalLinks',
          title: 'Legal Links',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'label', title: 'Label', type: 'string' },
                { name: 'url', title: 'URL', type: 'string' },
              ],
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Navigation Settings' }
    },
  },
})

export const seoSettings = defineType({
  name: 'seoSettings',
  title: 'SEO Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'pagePath',
      title: 'Page Path',
      type: 'string',
      description: 'e.g., /inventory, /financing, /about',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Image for social sharing (1200x630px recommended)',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
    }),
    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      initialValue: false,
      description: 'Hide this page from search engines',
    }),
    defineField({
      name: 'structuredData',
      title: 'Custom Structured Data (JSON-LD)',
      type: 'text',
      rows: 10,
      description: 'Advanced: Custom JSON-LD structured data',
    }),
  ],
  preview: {
    select: { title: 'pagePath', subtitle: 'title' },
  },
})
