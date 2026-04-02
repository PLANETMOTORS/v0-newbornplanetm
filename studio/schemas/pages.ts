import { defineType, defineField } from 'sanity'

// Reusable object types
const trustBadge = defineType({
  name: 'trustBadge',
  title: 'Trust Badge',
  type: 'object',
  fields: [
    defineField({ name: 'icon', title: 'Icon', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'string' }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
  ],
})

const benefitItem = defineType({
  name: 'benefitItem',
  title: 'Benefit Item',
  type: 'object',
  fields: [
    defineField({ name: 'icon', title: 'Icon', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
  ],
})

const processStep = defineType({
  name: 'processStep',
  title: 'Process Step',
  type: 'object',
  fields: [
    defineField({ name: 'stepNumber', title: 'Step Number', type: 'number' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'icon', title: 'Icon', type: 'string' }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
  ],
})

const testimonialItem = defineType({
  name: 'testimonialItem',
  title: 'Testimonial',
  type: 'object',
  fields: [
    defineField({ name: 'name', title: 'Customer Name', type: 'string' }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({ name: 'rating', title: 'Rating (1-5)', type: 'number' }),
    defineField({ name: 'quote', title: 'Quote', type: 'text' }),
    defineField({ name: 'image', title: 'Photo', type: 'image' }),
    defineField({ name: 'date', title: 'Date', type: 'date' }),
    defineField({ name: 'vehiclePurchased', title: 'Vehicle Purchased', type: 'string' }),
  ],
})

const comparisonRow = defineType({
  name: 'comparisonRow',
  title: 'Comparison Row',
  type: 'object',
  fields: [
    defineField({ name: 'feature', title: 'Feature', type: 'string' }),
    defineField({ name: 'us', title: 'Us', type: 'string' }),
    defineField({ name: 'others', title: 'Others', type: 'string' }),
    defineField({ name: 'usValue', title: 'Us (Boolean)', type: 'boolean' }),
    defineField({ name: 'othersValue', title: 'Others (Boolean)', type: 'boolean' }),
  ],
})

const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'object',
  fields: [
    defineField({ name: 'question', title: 'Question', type: 'string' }),
    defineField({ name: 'answer', title: 'Answer', type: 'text' }),
  ],
})

const ctaButton = defineType({
  name: 'ctaButton',
  title: 'CTA Button',
  type: 'object',
  fields: [
    defineField({ name: 'text', title: 'Button Text', type: 'string' }),
    defineField({ name: 'url', title: 'URL', type: 'string' }),
    defineField({ name: 'style', title: 'Style', type: 'string', options: { list: ['primary', 'secondary', 'outline'] } }),
  ],
})

// Homepage Schema - Complete
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero Section' },
    { name: 'trust', title: 'Trust Badges' },
    { name: 'featured', title: 'Featured Vehicles' },
    { name: 'testimonials', title: 'Testimonials' },
    { name: 'faq', title: 'FAQ' },
    { name: 'promo', title: 'Promo Banner' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // Hero Section
    defineField({ name: 'heroHeadline', title: 'Hero Headline', type: 'string', group: 'hero' }),
    defineField({ name: 'heroSubheadline', title: 'Hero Subheadline', type: 'text', group: 'hero' }),
    defineField({ name: 'heroImage', title: 'Hero Background Image', type: 'image', group: 'hero' }),
    defineField({ name: 'heroVideo', title: 'Hero Video URL', type: 'url', group: 'hero' }),
    defineField({ name: 'heroCta', title: 'Hero CTA Button', type: 'ctaButton', group: 'hero' }),
    defineField({ name: 'heroCtaSecondary', title: 'Hero Secondary CTA', type: 'ctaButton', group: 'hero' }),
    
    // Trust Badges
    defineField({
      name: 'trustBadges',
      title: 'Trust Badges',
      type: 'array',
      of: [{ type: 'trustBadge' }],
      group: 'trust',
    }),
    defineField({ name: 'altText', title: 'Alt Text', type: 'string', group: 'trust' }),
    
    // Featured Vehicles
    defineField({
      name: 'featuredVehicleStockNumbers',
      title: 'Featured Vehicle Stock Numbers',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Up to 6 stock numbers to pin on the homepage inventory section.',
      group: 'featured',
    }),
    defineField({
      name: 'featuredVehicles',
      title: 'Featured Vehicles',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'vehicle' }] }],
      group: 'featured',
    }),
    
    // Testimonials
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [{ type: 'testimonialItem' }, { type: 'reference', to: [{ type: 'testimonial' }] }],
      group: 'testimonials',
    }),
    
    // FAQ
    defineField({
      name: 'faqHighlights',
      title: 'FAQ Highlights (on homepage)',
      type: 'array',
      of: [{ type: 'faqItem' }, { type: 'reference', to: [{ type: 'faqEntry' }] }],
      group: 'faq',
    }),
    
    // Promo Banner
    defineField({ name: 'promoBannerEnabled', title: 'Show Promo Banner', type: 'boolean', group: 'promo' }),
    defineField({ name: 'promoBannerText', title: 'Promo Banner Text', type: 'string', group: 'promo' }),
    defineField({ name: 'promoBannerLink', title: 'Promo Banner Link', type: 'string', group: 'promo' }),
    defineField({ name: 'promoBannerColor', title: 'Promo Banner Color', type: 'string', group: 'promo' }),
    
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', group: 'seo' }),
    defineField({ name: 'seoImage', title: 'SEO Image', type: 'image', group: 'seo' }),
  ],
  preview: {
    prepare() {
      return { title: 'Homepage' }
    },
  },
})

// Landing Page Schema (Financing, Sell Your Car, etc.)
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
    { name: 'faq', title: 'FAQ' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'pageType', title: 'Page Type', type: 'string', options: { list: ['financing', 'sell-your-car', 'service', 'about', 'contact', 'custom'] } }),
    
    // Hero Section
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'highlightText', title: 'Highlight Text (e.g., "+$500 Bonus")', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
        { name: 'backgroundVideo', title: 'Background Video URL', type: 'url' },
        { name: 'ctaPrimary', title: 'Primary CTA', type: 'ctaButton' },
        { name: 'ctaSecondary', title: 'Secondary CTA', type: 'ctaButton' },
      ],
    }),
    defineField({
      name: 'formSettings',
      title: 'Form Settings',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'showForm', title: 'Show Form', type: 'boolean' },
        { name: 'formTitle', title: 'Form Title', type: 'string' },
        { name: 'formType', title: 'Form Type', type: 'string', options: { list: ['financing', 'trade-in', 'contact', 'appointment'] } },
      ],
    }),
    
    // Benefits Section (Why Sell to Us, Why Finance With Us, etc.)
    defineField({
      name: 'benefitsSection',
      title: 'Why Sell to Us',
      type: 'object',
      group: 'benefits',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'sectionSubtitle', title: 'Section Subtitle', type: 'text' },
        { name: 'benefitItems', title: 'Benefit Items', type: 'array', of: [{ type: 'benefitItem' }] },
      ],
    }),
    
    // Comparison Table
    defineField({
      name: 'comparisonSection',
      title: 'Comparison Table',
      type: 'object',
      group: 'comparison',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'usLabel', title: 'Us Label', type: 'string' },
        { name: 'othersLabel', title: 'Others Label', type: 'string' },
        { name: 'rows', title: 'Comparison Rows', type: 'array', of: [{ type: 'comparisonRow' }] },
      ],
    }),
    
    // Process Steps (How It Works)
    defineField({
      name: 'processSection',
      title: 'How It Works',
      type: 'object',
      group: 'process',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'sectionSubtitle', title: 'Section Subtitle', type: 'text' },
        { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'processStep' }] },
      ],
    }),
    
    // Testimonials
    defineField({
      name: 'testimonialsSection',
      title: 'Testimonials',
      type: 'object',
      group: 'testimonials',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'testimonials', title: 'Testimonials', type: 'array', of: [{ type: 'testimonialItem' }, { type: 'reference', to: [{ type: 'testimonial' }] }] },
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
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'ctaPrimary', title: 'Primary CTA', type: 'ctaButton' },
        { name: 'ctaSecondary', title: 'Secondary CTA', type: 'ctaButton' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
      ],
    }),
    
    // FAQ
    defineField({
      name: 'faqSection',
      title: 'FAQ Section',
      type: 'object',
      group: 'faq',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'faqs', title: 'FAQs', type: 'array', of: [{ type: 'faqItem' }] },
      ],
    }),
    
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', group: 'seo' }),
    defineField({ name: 'seoImage', title: 'SEO Image', type: 'image', group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', pageType: 'pageType' },
    prepare({ title, pageType }) {
      return { title: title || 'Untitled', subtitle: pageType }
    },
  },
})

// Financing Page Schema
export const financingPage = defineType({
  name: 'financingPage',
  title: 'Financing Page',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero Section' },
    { name: 'benefits', title: 'Benefits' },
    { name: 'calculator', title: 'Calculator' },
    { name: 'lenders', title: 'Lenders' },
    { name: 'process', title: 'Process' },
    { name: 'faq', title: 'FAQ' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Financing' }),
    
    // Hero
    defineField({ name: 'heroHeadline', title: 'Hero Headline', type: 'string', group: 'hero' }),
    defineField({ name: 'heroSubheadline', title: 'Hero Subheadline', type: 'text', group: 'hero' }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', group: 'hero' }),
    defineField({ name: 'heroCta', title: 'Hero CTA', type: 'ctaButton', group: 'hero' }),
    
    // Benefits
    defineField({ name: 'benefitsTitle', title: 'Benefits Section Title', type: 'string', group: 'benefits' }),
    defineField({ name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'benefitItem' }], group: 'benefits' }),
    
    // Calculator Settings
    defineField({ name: 'showCalculator', title: 'Show Payment Calculator', type: 'boolean', group: 'calculator', initialValue: true }),
    defineField({ name: 'calculatorTitle', title: 'Calculator Title', type: 'string', group: 'calculator' }),
    defineField({ name: 'defaultDownPayment', title: 'Default Down Payment', type: 'number', group: 'calculator' }),
    defineField({ name: 'defaultTerm', title: 'Default Term (months)', type: 'number', group: 'calculator' }),
    
    // Lenders
    defineField({ name: 'lendersTitle', title: 'Lenders Section Title', type: 'string', group: 'lenders' }),
    defineField({ name: 'featuredLenders', title: 'Featured Lenders', type: 'array', of: [{ type: 'reference', to: [{ type: 'lender' }] }], group: 'lenders' }),
    
    // Process
    defineField({ name: 'processTitle', title: 'Process Section Title', type: 'string', group: 'process' }),
    defineField({ name: 'processSteps', title: 'Process Steps', type: 'array', of: [{ type: 'processStep' }], group: 'process' }),
    
    // FAQ
    defineField({ name: 'faqTitle', title: 'FAQ Section Title', type: 'string', group: 'faq' }),
    defineField({ name: 'faqs', title: 'FAQs', type: 'array', of: [{ type: 'faqItem' }], group: 'faq' }),
    
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', group: 'seo' }),
  ],
  preview: {
    prepare() {
      return { title: 'Financing Page' }
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
    { name: 'benefits', title: 'Why Sell to Us' },
    { name: 'process', title: 'How It Works' },
    { name: 'comparison', title: 'Comparison' },
    { name: 'testimonials', title: 'Testimonials' },
    { name: 'cta', title: 'CTA' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Sell Your Car' }),
    
    // Hero
    defineField({ name: 'heroHeadline', title: 'Hero Headline', type: 'string', group: 'hero' }),
    defineField({ name: 'heroSubheadline', title: 'Hero Subheadline', type: 'text', group: 'hero' }),
    defineField({ name: 'heroHighlightText', title: 'Highlight Text (e.g., "+$500 Bonus")', type: 'string', group: 'hero' }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', group: 'hero' }),
    defineField({ name: 'heroCta', title: 'Hero CTA', type: 'ctaButton', group: 'hero' }),
    
    // Why Sell to Us
    defineField({ name: 'benefitsTitle', title: 'Benefits Section Title', type: 'string', group: 'benefits' }),
    defineField({ name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'benefitItem' }], group: 'benefits' }),
    
    // How It Works
    defineField({ name: 'processTitle', title: 'Process Section Title', type: 'string', group: 'process' }),
    defineField({ name: 'processSteps', title: 'Process Steps', type: 'array', of: [{ type: 'processStep' }], group: 'process' }),
    
    // Comparison
    defineField({ name: 'comparisonTitle', title: 'Comparison Section Title', type: 'string', group: 'comparison' }),
    defineField({ name: 'comparisonRows', title: 'Comparison Rows', type: 'array', of: [{ type: 'comparisonRow' }], group: 'comparison' }),
    
    // Testimonials
    defineField({ name: 'testimonialsTitle', title: 'Testimonials Section Title', type: 'string', group: 'testimonials' }),
    defineField({ name: 'testimonials', title: 'Testimonials', type: 'array', of: [{ type: 'testimonialItem' }], group: 'testimonials' }),
    
    // CTA
    defineField({ name: 'ctaHeadline', title: 'CTA Headline', type: 'string', group: 'cta' }),
    defineField({ name: 'ctaSubheadline', title: 'CTA Subheadline', type: 'text', group: 'cta' }),
    defineField({ name: 'ctaButton', title: 'CTA Button', type: 'ctaButton', group: 'cta' }),
    
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', group: 'seo' }),
  ],
  preview: {
    prepare() {
      return { title: 'Sell Your Car Page' }
    },
  },
})

// VDP (Vehicle Detail Page) Settings
export const vdpSettings = defineType({
  name: 'vdpSettings',
  title: 'Vehicle Detail Page Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', initialValue: 'VDP Settings' }),
    defineField({ name: 'showPaymentCalculator', title: 'Show Payment Calculator', type: 'boolean', initialValue: true }),
    defineField({ name: 'showTradeInCta', title: 'Show Trade-In CTA', type: 'boolean', initialValue: true }),
    defineField({ name: 'showFinancingCta', title: 'Show Financing CTA', type: 'boolean', initialValue: true }),
    defineField({ name: 'show360Viewer', title: 'Show 360 Viewer', type: 'boolean', initialValue: true }),
    defineField({ name: 'showCarfaxBadge', title: 'Show Carfax Badge', type: 'boolean', initialValue: true }),
    defineField({ name: 'showSimilarVehicles', title: 'Show Similar Vehicles', type: 'boolean', initialValue: true }),
    defineField({ name: 'ctaButtonText', title: 'Primary CTA Button Text', type: 'string', initialValue: 'Get Pre-Approved' }),
    defineField({ name: 'ctaButtonUrl', title: 'Primary CTA Button URL', type: 'string' }),
    defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Schedule Test Drive' }),
    defineField({ name: 'secondaryCtaUrl', title: 'Secondary CTA URL', type: 'string' }),
    defineField({
      name: 'disclaimerText',
      title: 'Disclaimer Text',
      type: 'text',
      initialValue: 'Prices shown do not include taxes, licensing, or fees. Payment estimates are for illustrative purposes only.',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'VDP Settings' }
    },
  },
})

// Export all types
export const pageSchemas = [
  trustBadge,
  benefitItem,
  processStep,
  testimonialItem,
  comparisonRow,
  faqItem,
  ctaButton,
  homepage,
  landingPage,
  financingPage,
  sellYourCarPage,
  vdpSettings,
]
