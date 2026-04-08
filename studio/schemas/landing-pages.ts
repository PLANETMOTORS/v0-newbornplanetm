import { defineType, defineField, defineArrayMember } from 'sanity'

// Trust Badge object type for arrays
const trustBadge = {
  name: 'trustBadge',
  title: 'Trust Badge',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Icon name (e.g., shield, check, star)',
    }),
    defineField({
      name: 'image',
      title: 'Badge Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
  },
}

// Benefit Item for arrays
const benefitItem = {
  name: 'benefitItem',
  title: 'Benefit Item',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
}

// Process Step for arrays
const processStep = {
  name: 'processStep',
  title: 'Process Step',
  type: 'object',
  fields: [
    defineField({
      name: 'stepNumber',
      title: 'Step Number',
      type: 'number',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      stepNumber: 'stepNumber',
    },
    prepare({ title, stepNumber }: { title?: string; stepNumber?: number }) {
      return {
        title: `${stepNumber ? `Step ${stepNumber}: ` : ''}${title || 'Untitled'}`,
      }
    },
  },
}

// Comparison Row for tables
const comparisonRow = {
  name: 'comparisonRow',
  title: 'Comparison Row',
  type: 'object',
  fields: [
    defineField({
      name: 'feature',
      title: 'Feature',
      type: 'string',
    }),
    defineField({
      name: 'planetMotors',
      title: 'Planet Motors',
      type: 'string',
    }),
    defineField({
      name: 'others',
      title: 'Others',
      type: 'string',
    }),
    defineField({
      name: 'highlight',
      title: 'Highlight Row',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'feature',
    },
  },
}

// Testimonial Item for page-specific testimonials
const testimonialItem = {
  name: 'testimonialItem',
  title: 'Testimonial',
  type: 'object',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'author',
      title: 'Author Name',
      type: 'string',
    }),
    defineField({
      name: 'role',
      title: 'Role/Title',
      type: 'string',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
    }),
    defineField({
      name: 'rating',
      title: 'Rating (1-5)',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(5),
    }),
    defineField({
      name: 'vehiclePurchased',
      title: 'Vehicle Purchased',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'author',
      subtitle: 'quote',
    },
  },
}

// Homepage document with all sections
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero Section' },
    { name: 'badges', title: 'Trust Badges' },
    { name: 'featured', title: 'Featured Vehicles' },
    { name: 'testimonials', title: 'Testimonials' },
    { name: 'faq', title: 'FAQ' },
    { name: 'promo', title: 'Promo Banner' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      initialValue: 'Homepage',
    }),
    
    // Hero Section
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
      group: 'hero',
    }),
    defineField({
      name: 'heroImageAlt',
      title: 'Alt Text',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroSubheadline',
      title: 'Hero Subheadline',
      type: 'text',
      rows: 2,
      group: 'hero',
    }),
    defineField({
      name: 'heroCta',
      title: 'Hero CTA Button',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'url', title: 'URL', type: 'string' },
      ],
    }),
    defineField({
      name: 'heroSecondaryCta',
      title: 'Hero Secondary CTA',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'url', title: 'URL', type: 'string' },
      ],
    }),
    
    // Trust Badges
    defineField({
      name: 'trustBadges',
      title: 'Trust Badges',
      type: 'array',
      group: 'badges',
      of: [trustBadge],
    }),
    
    // Featured Vehicles
    defineField({
      name: 'featuredVehicleStockNumbers',
      title: 'Featured Vehicle Stock Numbers',
      type: 'array',
      description: 'Up to 6 stock numbers to pin on the homepage inventory section.',
      group: 'featured',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.max(6),
    }),
    
    // Testimonials
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      group: 'testimonials',
      of: [{ type: 'reference', to: [{ type: 'testimonial' }] }],
    }),
    
    // FAQ Highlights
    defineField({
      name: 'faqHighlights',
      title: 'FAQ Highlights (on homepage)',
      type: 'array',
      group: 'faq',
      of: [{ type: 'reference', to: [{ type: 'faqEntry' }] }],
    }),
    
    // Promo Banner
    defineField({
      name: 'promoBanner',
      title: 'Promo Banner',
      type: 'object',
      group: 'promo',
      fields: [
        { name: 'enabled', title: 'Show Banner', type: 'boolean', initialValue: false },
        { name: 'text', title: 'Banner Text', type: 'string' },
        { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
        { name: 'ctaUrl', title: 'CTA URL', type: 'string' },
        { name: 'backgroundColor', title: 'Background Color', type: 'string' },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
    defineField({
      name: 'seoImage',
      title: 'SEO Image',
      type: 'image',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare() {
      return {
        title: 'Homepage',
      }
    },
  },
})

// Landing Page (for Financing, Sell Your Car, etc.)
export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landing Page',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero Section' },
    { name: 'benefits', title: 'Benefits' },
    { name: 'comparison', title: 'Comparison Table' },
    { name: 'process', title: 'Process Steps' },
    { name: 'testimonials', title: 'Testimonials' },
    { name: 'cta', title: 'CTA Section' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'pageType',
      title: 'Page Type',
      type: 'string',
      options: {
        list: [
          { title: 'Financing', value: 'financing' },
          { title: 'Sell Your Car', value: 'sell-your-car' },
          { title: 'Trade-In', value: 'trade-in' },
          { title: 'About Us', value: 'about' },
          { title: 'Contact', value: 'contact' },
          { title: 'Custom', value: 'custom' },
        ],
      },
    }),
    
    // Hero Section
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text', rows: 2 },
        { name: 'highlightText', title: 'Highlight Text (e.g., "+$500 Bonus")', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image', options: { hotspot: true } },
        { name: 'formEnabled', title: 'Show Form', type: 'boolean', initialValue: true },
        { name: 'formTitle', title: 'Form Title', type: 'string' },
        { name: 'formCtaLabel', title: 'Form CTA Label', type: 'string' },
      ],
    }),
    defineField({
      name: 'formSettings',
      title: 'Form Settings',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'enabled', title: 'Enable Form', type: 'boolean', initialValue: true },
        { name: 'title', title: 'Form Title', type: 'string' },
        { name: 'ctaLabel', title: 'Submit Button Label', type: 'string' },
        { name: 'successMessage', title: 'Success Message', type: 'string' },
      ],
    }),
    
    // Benefits Section (Why Sell to Us / Why Finance with Us)
    defineField({
      name: 'whySellToUs',
      title: 'Why Sell to Us',
      type: 'object',
      group: 'benefits',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'benefitItems', title: 'Benefit Items', type: 'array', of: [benefitItem] },
      ],
    }),
    defineField({
      name: 'benefitsSection',
      title: 'Benefits Section',
      type: 'object',
      group: 'benefits',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'items', title: 'Benefit Items', type: 'array', of: [benefitItem] },
      ],
    }),
    
    // Comparison Table
    defineField({
      name: 'comparisonTable',
      title: 'Comparison Table',
      type: 'object',
      group: 'comparison',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'planetMotorsLabel', title: 'Planet Motors Column Label', type: 'string', initialValue: 'Planet Motors' },
        { name: 'othersLabel', title: 'Others Column Label', type: 'string', initialValue: 'Other Dealers' },
        { name: 'rows', title: 'Comparison Rows', type: 'array', of: [comparisonRow] },
      ],
    }),
    
    // How It Works / Process Steps
    defineField({
      name: 'howItWorks',
      title: 'How It Works',
      type: 'object',
      group: 'process',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'steps', title: 'Steps', type: 'array', of: [defineArrayMember(processStep)] },
      ],
    }),
    
    // Testimonials
    defineField({
      name: 'testimonialsSection',
      title: 'Testimonials Section',
      type: 'object',
      group: 'testimonials',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'testimonials', title: 'Testimonials', type: 'array', of: [testimonialItem] },
      ],
    }),
    
    // CTA Section
    defineField({
      name: 'ctaSection',
      title: 'CTA Section',
      type: 'object',
      group: 'cta',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text', rows: 2 },
        { name: 'ctaLabel', title: 'CTA Button Label', type: 'string' },
        { name: 'ctaUrl', title: 'CTA Button URL', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image', options: { hotspot: true } },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
    defineField({
      name: 'seoImage',
      title: 'SEO Image',
      type: 'image',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      pageType: 'pageType',
    },
    prepare({ title, pageType }) {
      return {
        title: title || 'Untitled',
        subtitle: pageType || 'Landing Page',
      }
    },
  },
})

// Financing Page (specific document)
export const financingPage = defineType({
  name: 'financingPage',
  title: 'Financing Page',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero Section' },
    { name: 'benefits', title: 'Benefits' },
    { name: 'comparison', title: 'Comparison Table' },
    { name: 'process', title: 'Process Steps' },
    { name: 'testimonials', title: 'Testimonials' },
    { name: 'cta', title: 'CTA Section' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      initialValue: 'Financing Page',
    }),
    
    // Hero Section
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text', rows: 2 },
        { name: 'highlightText', title: 'Highlight Text (e.g., "Rates from 6.29%")', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image', options: { hotspot: true } },
      ],
    }),
    defineField({
      name: 'formSettings',
      title: 'Form Settings',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'enabled', title: 'Enable Form', type: 'boolean', initialValue: true },
        { name: 'title', title: 'Form Title', type: 'string' },
        { name: 'ctaLabel', title: 'Submit Button Label', type: 'string' },
      ],
    }),
    
    // Benefits
    defineField({
      name: 'benefitsSection',
      title: 'Benefits Section',
      type: 'object',
      group: 'benefits',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'items', title: 'Benefit Items', type: 'array', of: [benefitItem] },
      ],
    }),
    
    // Comparison Table
    defineField({
      name: 'comparisonTable',
      title: 'Comparison Table',
      type: 'object',
      group: 'comparison',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'rows', title: 'Comparison Rows', type: 'array', of: [comparisonRow] },
      ],
    }),
    
    // How It Works
    defineField({
      name: 'howItWorks',
      title: 'How It Works',
      type: 'object',
      group: 'process',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'steps', title: 'Steps', type: 'array', of: [defineArrayMember(processStep)] },
      ],
    }),
    
    // Testimonials
    defineField({
      name: 'testimonialsSection',
      title: 'Testimonials Section',
      type: 'object',
      group: 'testimonials',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'testimonials', title: 'Testimonials', type: 'array', of: [testimonialItem] },
      ],
    }),
    
    // CTA Section
    defineField({
      name: 'ctaSection',
      title: 'CTA Section',
      type: 'object',
      group: 'cta',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text', rows: 2 },
        { name: 'ctaLabel', title: 'CTA Button Label', type: 'string' },
        { name: 'ctaUrl', title: 'CTA Button URL', type: 'string' },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Financing Page',
      }
    },
  },
})

// Sell Your Car Page
export const sellYourCarPage = defineType({
  name: 'sellYourCarPage',
  title: 'Sell Your Car Page',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero Section' },
    { name: 'benefits', title: 'Benefits' },
    { name: 'comparison', title: 'Comparison Table' },
    { name: 'process', title: 'Process Steps' },
    { name: 'testimonials', title: 'Testimonials' },
    { name: 'cta', title: 'CTA Section' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      initialValue: 'Sell Your Car Page',
    }),
    
    // Hero Section
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text', rows: 2 },
        { name: 'highlightText', title: 'Highlight Text (e.g., "+$500 Bonus")', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image', options: { hotspot: true } },
      ],
    }),
    defineField({
      name: 'formSettings',
      title: 'Form Settings',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'enabled', title: 'Enable Form', type: 'boolean', initialValue: true },
        { name: 'title', title: 'Form Title', type: 'string' },
        { name: 'ctaLabel', title: 'Submit Button Label', type: 'string' },
      ],
    }),
    
    // Why Sell to Us
    defineField({
      name: 'whySellToUs',
      title: 'Why Sell to Us',
      type: 'object',
      group: 'benefits',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'benefitItems', title: 'Benefit Items', type: 'array', of: [benefitItem] },
      ],
    }),
    
    // Comparison Table
    defineField({
      name: 'comparisonTable',
      title: 'Comparison Table',
      type: 'object',
      group: 'comparison',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'rows', title: 'Comparison Rows', type: 'array', of: [comparisonRow] },
      ],
    }),
    
    // How It Works
    defineField({
      name: 'howItWorks',
      title: 'How It Works',
      type: 'object',
      group: 'process',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'steps', title: 'Steps', type: 'array', of: [defineArrayMember(processStep)] },
      ],
    }),
    
    // Testimonials
    defineField({
      name: 'testimonialsSection',
      title: 'Testimonials Section',
      type: 'object',
      group: 'testimonials',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'testimonials', title: 'Testimonials', type: 'array', of: [testimonialItem] },
      ],
    }),
    
    // CTA Section
    defineField({
      name: 'ctaSection',
      title: 'CTA Section',
      type: 'object',
      group: 'cta',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text', rows: 2 },
        { name: 'ctaLabel', title: 'CTA Button Label', type: 'string' },
        { name: 'ctaUrl', title: 'CTA Button URL', type: 'string' },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Sell Your Car Page',
      }
    },
  },
})
