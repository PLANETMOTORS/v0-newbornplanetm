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
    defineField({ name: 'link', title: 'Link', type: 'url' }),
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

// Landing Page Schema (for custom landing pages)
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
        { name: 'highlightText', title: 'Highlight Text', type: 'string' },
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
    
    // Benefits Section
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
    
    // Process Steps
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

// Financing Page Schema - COMPLETE with all fields
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
    { name: 'comparison', title: 'Comparison' },
    { name: 'testimonials', title: 'Testimonials' },
    { name: 'cta', title: 'CTA Section' },
    { name: 'faq', title: 'FAQ' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Financing' }),
    
    // Hero Section
    defineField({ name: 'heroHeadline', title: 'Hero Headline', type: 'string', group: 'hero' }),
    defineField({ name: 'heroSubheadline', title: 'Hero Subheadline', type: 'text', group: 'hero' }),
    defineField({ name: 'heroHighlightText', title: 'Highlight Text', type: 'string', group: 'hero' }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', group: 'hero' }),
    defineField({ name: 'heroVideo', title: 'Hero Video URL', type: 'url', group: 'hero' }),
    defineField({ name: 'heroCta', title: 'Hero CTA', type: 'ctaButton', group: 'hero' }),
    defineField({ name: 'heroCtaSecondary', title: 'Secondary CTA', type: 'ctaButton', group: 'hero' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section (Object)',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'highlightText', title: 'Highlight Text', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
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
        { name: 'formType', title: 'Form Type', type: 'string' },
      ],
    }),
    
    // Benefits
    defineField({ name: 'benefitsTitle', title: 'Benefits Section Title', type: 'string', group: 'benefits' }),
    defineField({ name: 'benefitsSubtitle', title: 'Benefits Subtitle', type: 'text', group: 'benefits' }),
    defineField({ name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'benefitItem' }], group: 'benefits' }),
    defineField({
      name: 'whySellToUs',
      title: 'Why Finance With Us',
      type: 'object',
      group: 'benefits',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'benefitItems', title: 'Benefit Items', type: 'array', of: [{ type: 'benefitItem' }] },
      ],
    }),
    
    // Calculator Settings
    defineField({ name: 'showCalculator', title: 'Show Payment Calculator', type: 'boolean', group: 'calculator', initialValue: true }),
    defineField({ name: 'calculatorTitle', title: 'Calculator Title', type: 'string', group: 'calculator' }),
    defineField({ name: 'calculatorDescription', title: 'Calculator Description', type: 'text', group: 'calculator' }),
    defineField({ name: 'defaultDownPayment', title: 'Default Down Payment', type: 'number', group: 'calculator' }),
    defineField({ name: 'defaultTerm', title: 'Default Term (months)', type: 'number', group: 'calculator' }),
    defineField({ name: 'defaultInterestRate', title: 'Default Interest Rate (%)', type: 'number', group: 'calculator' }),
    
    // Lenders
    defineField({ name: 'lendersTitle', title: 'Lenders Section Title', type: 'string', group: 'lenders' }),
    defineField({ name: 'lendersSubtitle', title: 'Lenders Subtitle', type: 'text', group: 'lenders' }),
    defineField({ name: 'featuredLenders', title: 'Featured Lenders', type: 'array', of: [{ type: 'reference', to: [{ type: 'lender' }] }], group: 'lenders' }),
    
    // Process
    defineField({ name: 'processTitle', title: 'Process Section Title', type: 'string', group: 'process' }),
    defineField({ name: 'processSubtitle', title: 'Process Subtitle', type: 'text', group: 'process' }),
    defineField({ name: 'processSteps', title: 'Process Steps', type: 'array', of: [{ type: 'processStep' }], group: 'process' }),
    defineField({
      name: 'howItWorks',
      title: 'How It Works',
      type: 'object',
      group: 'process',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'processStep' }] },
      ],
    }),
    
    // Comparison Table
    defineField({ name: 'comparisonTitle', title: 'Comparison Title', type: 'string', group: 'comparison' }),
    defineField({ name: 'comparisonRows', title: 'Comparison Rows', type: 'array', of: [{ type: 'comparisonRow' }], group: 'comparison' }),
    defineField({
      name: 'comparisonTable',
      title: 'Comparison Table',
      type: 'object',
      group: 'comparison',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'ourColumnTitle', title: 'Our Column Title', type: 'string' },
        { name: 'othersColumnTitle', title: 'Others Column Title', type: 'string' },
        { name: 'rows', title: 'Rows', type: 'array', of: [{ type: 'comparisonRow' }] },
      ],
    }),
    
    // Testimonials
    defineField({ name: 'testimonialsTitle', title: 'Testimonials Title', type: 'string', group: 'testimonials' }),
    defineField({ name: 'testimonials', title: 'Testimonials', type: 'array', of: [{ type: 'testimonialItem' }, { type: 'reference', to: [{ type: 'testimonial' }] }], group: 'testimonials' }),
    defineField({
      name: 'testimonialsSection',
      title: 'Testimonials Section',
      type: 'object',
      group: 'testimonials',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'testimonials', title: 'Testimonials', type: 'array', of: [{ type: 'testimonialItem' }] },
      ],
    }),
    
    // CTA Section
    defineField({ name: 'ctaHeadline', title: 'CTA Headline', type: 'string', group: 'cta' }),
    defineField({ name: 'ctaSubheadline', title: 'CTA Subheadline', type: 'text', group: 'cta' }),
    defineField({ name: 'ctaButton', title: 'CTA Button', type: 'ctaButton', group: 'cta' }),
    defineField({ name: 'ctaBackgroundImage', title: 'CTA Background', type: 'image', group: 'cta' }),
    defineField({
      name: 'ctaSection',
      title: 'CTA Section',
      type: 'object',
      group: 'cta',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'ctaText', title: 'CTA Text', type: 'string' },
        { name: 'ctaLink', title: 'CTA Link', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
      ],
    }),
    
    // FAQ
    defineField({ name: 'faqTitle', title: 'FAQ Section Title', type: 'string', group: 'faq' }),
    defineField({ name: 'faqs', title: 'FAQs', type: 'array', of: [{ type: 'faqItem' }], group: 'faq' }),
    
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', group: 'seo' }),
    defineField({ name: 'seoImage', title: 'SEO Image', type: 'image', group: 'seo' }),
    defineField({ name: 'seoKeywords', title: 'SEO Keywords', type: 'array', of: [{ type: 'string' }], group: 'seo' }),
  ],
  preview: {
    prepare() {
      return { title: 'Financing Page' }
    },
  },
})

// Sell Your Car Page - COMPLETE with all fields
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
    { name: 'faq', title: 'FAQ' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Sell Your Car' }),
    
    // Hero Section
    defineField({ name: 'heroHeadline', title: 'Hero Headline', type: 'string', group: 'hero' }),
    defineField({ name: 'heroSubheadline', title: 'Hero Subheadline', type: 'text', group: 'hero' }),
    defineField({ name: 'heroHighlightText', title: 'Highlight Text', type: 'string', group: 'hero' }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', group: 'hero' }),
    defineField({ name: 'heroVideo', title: 'Hero Video URL', type: 'url', group: 'hero' }),
    defineField({ name: 'heroCta', title: 'Hero CTA', type: 'ctaButton', group: 'hero' }),
    defineField({ name: 'heroCtaSecondary', title: 'Secondary CTA', type: 'ctaButton', group: 'hero' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section (Object)',
      type: 'object',
      group: 'hero',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'highlightText', title: 'Highlight Text', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
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
        { name: 'formType', title: 'Form Type', type: 'string' },
      ],
    }),
    
    // Why Sell to Us
    defineField({ name: 'benefitsTitle', title: 'Benefits Section Title', type: 'string', group: 'benefits' }),
    defineField({ name: 'benefitsSubtitle', title: 'Benefits Subtitle', type: 'text', group: 'benefits' }),
    defineField({ name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'benefitItem' }], group: 'benefits' }),
    defineField({
      name: 'whySellToUs',
      title: 'Why Sell to Us',
      type: 'object',
      group: 'benefits',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'benefitItems', title: 'Benefit Items', type: 'array', of: [{ type: 'benefitItem' }] },
      ],
    }),
    
    // How It Works
    defineField({ name: 'processTitle', title: 'Process Section Title', type: 'string', group: 'process' }),
    defineField({ name: 'processSubtitle', title: 'Process Subtitle', type: 'text', group: 'process' }),
    defineField({ name: 'processSteps', title: 'Process Steps', type: 'array', of: [{ type: 'processStep' }], group: 'process' }),
    defineField({
      name: 'howItWorks',
      title: 'How It Works',
      type: 'object',
      group: 'process',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'processStep' }] },
      ],
    }),
    
    // Comparison
    defineField({ name: 'comparisonTitle', title: 'Comparison Section Title', type: 'string', group: 'comparison' }),
    defineField({ name: 'comparisonRows', title: 'Comparison Rows', type: 'array', of: [{ type: 'comparisonRow' }], group: 'comparison' }),
    defineField({
      name: 'comparisonTable',
      title: 'Comparison Table',
      type: 'object',
      group: 'comparison',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'ourColumnTitle', title: 'Our Column Title', type: 'string' },
        { name: 'othersColumnTitle', title: 'Others Column Title', type: 'string' },
        { name: 'rows', title: 'Rows', type: 'array', of: [{ type: 'comparisonRow' }] },
      ],
    }),
    
    // Testimonials
    defineField({ name: 'testimonialsTitle', title: 'Testimonials Section Title', type: 'string', group: 'testimonials' }),
    defineField({ name: 'testimonials', title: 'Testimonials', type: 'array', of: [{ type: 'testimonialItem' }], group: 'testimonials' }),
    defineField({
      name: 'testimonialsSection',
      title: 'Testimonials Section',
      type: 'object',
      group: 'testimonials',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'testimonials', title: 'Testimonials', type: 'array', of: [{ type: 'testimonialItem' }] },
      ],
    }),
    
    // CTA
    defineField({ name: 'ctaHeadline', title: 'CTA Headline', type: 'string', group: 'cta' }),
    defineField({ name: 'ctaSubheadline', title: 'CTA Subheadline', type: 'text', group: 'cta' }),
    defineField({ name: 'ctaButton', title: 'CTA Button', type: 'ctaButton', group: 'cta' }),
    defineField({ name: 'ctaBackgroundImage', title: 'CTA Background', type: 'image', group: 'cta' }),
    defineField({
      name: 'ctaSection',
      title: 'CTA Section',
      type: 'object',
      group: 'cta',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'ctaText', title: 'CTA Text', type: 'string' },
        { name: 'ctaLink', title: 'CTA Link', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
      ],
    }),
    
    // FAQ
    defineField({ name: 'faqTitle', title: 'FAQ Section Title', type: 'string', group: 'faq' }),
    defineField({ name: 'faqs', title: 'FAQs', type: 'array', of: [{ type: 'faqItem' }], group: 'faq' }),
    
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', group: 'seo' }),
    defineField({ name: 'seoImage', title: 'SEO Image', type: 'image', group: 'seo' }),
    defineField({ name: 'seoKeywords', title: 'SEO Keywords', type: 'array', of: [{ type: 'string' }], group: 'seo' }),
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
  groups: [
    { name: 'display', title: 'Display Options' },
    { name: 'cta', title: 'CTA Buttons' },
    { name: 'calculator', title: 'Calculator' },
    { name: 'similar', title: 'Similar Vehicles' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', initialValue: 'VDP Settings' }),
    
    // Display Options
    defineField({ name: 'showPaymentCalculator', title: 'Show Payment Calculator', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'showTradeInCta', title: 'Show Trade-In CTA', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'showFinancingCta', title: 'Show Financing CTA', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'show360Viewer', title: 'Show 360 Viewer', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'showCarfaxBadge', title: 'Show Carfax Badge', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'showSimilarVehicles', title: 'Show Similar Vehicles', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'showWarrantyInfo', title: 'Show Warranty Info', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'showHistoryReport', title: 'Show History Report', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'showVideoPlayer', title: 'Show Video Player', type: 'boolean', initialValue: true, group: 'display' }),
    defineField({ name: 'galleryStyle', title: 'Gallery Style', type: 'string', options: { list: ['carousel', 'grid', 'filmstrip'] }, group: 'display' }),
    
    // CTA Buttons
    defineField({ name: 'ctaButtonText', title: 'Primary CTA Button Text', type: 'string', initialValue: 'Get Pre-Approved', group: 'cta' }),
    defineField({ name: 'ctaButtonUrl', title: 'Primary CTA Button URL', type: 'string', group: 'cta' }),
    defineField({ name: 'secondaryCtaText', title: 'Secondary CTA Text', type: 'string', initialValue: 'Schedule Test Drive', group: 'cta' }),
    defineField({ name: 'secondaryCtaUrl', title: 'Secondary CTA URL', type: 'string', group: 'cta' }),
    defineField({ name: 'showCallButton', title: 'Show Call Button', type: 'boolean', initialValue: true, group: 'cta' }),
    defineField({ name: 'showTextButton', title: 'Show Text/SMS Button', type: 'boolean', initialValue: true, group: 'cta' }),
    defineField({ name: 'showShareButton', title: 'Show Share Button', type: 'boolean', initialValue: true, group: 'cta' }),
    
    // Calculator Settings
    defineField({ name: 'calculatorPosition', title: 'Calculator Position', type: 'string', options: { list: ['sidebar', 'below-gallery', 'tab'] }, group: 'calculator' }),
    defineField({ name: 'defaultDownPaymentPercent', title: 'Default Down Payment %', type: 'number', initialValue: 10, group: 'calculator' }),
    defineField({ name: 'defaultTermMonths', title: 'Default Term (months)', type: 'number', initialValue: 60, group: 'calculator' }),
    
    // Similar Vehicles
    defineField({ name: 'similarVehiclesCount', title: 'Number of Similar Vehicles', type: 'number', initialValue: 4, group: 'similar' }),
    defineField({ name: 'similarVehiclesCriteria', title: 'Similar By', type: 'string', options: { list: ['make', 'bodyStyle', 'price', 'category'] }, group: 'similar' }),
    
    // Disclaimer
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

// Calculator Settings (Global)
export const calculatorSettings = defineType({
  name: 'calculatorSettings',
  title: 'Payment Calculator Settings',
  type: 'document',
  fields: [
    defineField({ name: 'defaultInterestRate', title: 'Default Interest Rate (%)', type: 'number', initialValue: 6.99 }),
    defineField({ name: 'minDownPayment', title: 'Minimum Down Payment (%)', type: 'number', initialValue: 0 }),
    defineField({ name: 'maxDownPayment', title: 'Maximum Down Payment (%)', type: 'number', initialValue: 50 }),
    defineField({ name: 'availableTerms', title: 'Available Loan Terms', type: 'array', of: [{ type: 'number' }] }),
    defineField({ name: 'taxRate', title: 'Tax Rate (%)', type: 'number', initialValue: 13 }),
    defineField({ name: 'includeTaxInPayment', title: 'Include Tax in Monthly Payment', type: 'boolean', initialValue: true }),
    defineField({ name: 'showBiWeeklyPayment', title: 'Show Bi-Weekly Payment', type: 'boolean', initialValue: true }),
    defineField({ name: 'disclaimerText', title: 'Disclaimer', type: 'text' }),
  ],
  preview: {
    prepare() {
      return { title: 'Calculator Settings' }
    },
  },
})

// Export all page schemas
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
  calculatorSettings,
]
