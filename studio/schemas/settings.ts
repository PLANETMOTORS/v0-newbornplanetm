import { defineType, defineField } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    // Dealer Info
    defineField({
      name: 'dealerName',
      title: 'Dealer Name',
      type: 'string',
      initialValue: 'Planet Motors',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
    }),
    
    // Contact
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'tollFree',
      title: 'Toll Free',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        { name: 'street', title: 'Street', type: 'string' },
        { name: 'city', title: 'City', type: 'string' },
        { name: 'province', title: 'Province', type: 'string' },
        { name: 'postalCode', title: 'Postal Code', type: 'string' },
      ],
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'Google Maps URL',
      type: 'url',
    }),
    
    // Hours
    defineField({
      name: 'hours',
      title: 'Business Hours',
      type: 'object',
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
      fields: [
        { name: 'minDownPayment', title: 'Min Down Payment (%)', type: 'number', initialValue: 0 },
        { name: 'maxTerm', title: 'Max Term (months)', type: 'number', initialValue: 84 },
        { name: 'defaultRate', title: 'Default Rate (%)', type: 'number', initialValue: 6.99 },
      ],
    }),
    
    // Delivery
    defineField({
      name: 'delivery',
      title: 'Delivery Settings',
      type: 'object',
      fields: [
        { name: 'freeDeliveryRadius', title: 'Free Delivery Radius (km)', type: 'number', initialValue: 100 },
        { name: 'perKmRate', title: 'Per KM Rate ($)', type: 'number', initialValue: 0.50 },
        { name: 'enabled', title: 'Delivery Enabled', type: 'boolean', initialValue: true },
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
    
    // Social Links
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        { name: 'facebook', title: 'Facebook', type: 'url' },
        { name: 'instagram', title: 'Instagram', type: 'url' },
        { name: 'twitter', title: 'Twitter/X', type: 'url' },
        { name: 'youtube', title: 'YouTube', type: 'url' },
        { name: 'tiktok', title: 'TikTok', type: 'url' },
        { name: 'linkedin', title: 'LinkedIn', type: 'url' },
      ],
    }),
    
    // Footer
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright Text',
      type: 'string',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      }
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
      options: {
        layout: 'tags',
      },
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
    select: {
      title: 'pagePath',
      subtitle: 'title',
    },
  },
})
