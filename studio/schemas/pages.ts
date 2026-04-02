import { defineType, defineField } from 'sanity'

// ============================================
// REUSABLE OBJECT TYPES - EXACT DATABASE MATCH
// ============================================

const trustBadge = defineType({
  name: 'trustBadge',
  title: 'Trust Badge',
  type: 'object',
  fields: [
    defineField({ name: 'icon', title: 'Icon', type: 'string' }),
    defineField({ name: 'text', title: 'Text', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
  ],
})

const ctaButton = defineType({
  name: 'ctaButton',
  title: 'CTA Button',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'url', title: 'URL', type: 'string' }),
    defineField({ name: 'text', title: 'Text', type: 'string' }),
    defineField({ name: 'style', title: 'Style', type: 'string' }),
  ],
})

// ============================================
// HOMEPAGE - EXACT DATABASE MATCH
// ============================================
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    
    // Hero Section
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'headlineHighlight', title: 'Headline Highlight', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'primaryCta', title: 'Primary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
        { name: 'secondaryCta', title: 'Secondary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
        { name: 'highlightCta', title: 'Highlight CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
      ],
    }),
    
    // Trust Badges
    defineField({
      name: 'trustBadges',
      title: 'Trust Badges',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'icon', title: 'Icon', type: 'string' },
        { name: 'text', title: 'Text', type: 'string' },
      ]}],
    }),
    
    // Quick Filters (array with label + url)
    defineField({
      name: 'quickFilters',
      title: 'Quick Filters',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'url', title: 'URL', type: 'string' },
      ]}],
    }),
    
    // Financing Promo
    defineField({
      name: 'financingPromo',
      title: 'Financing Promo',
      type: 'object',
      fields: [
        { name: 'rate', title: 'Rate', type: 'string' },
        { name: 'rateLabel', title: 'Rate Label', type: 'string' },
        { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
        { name: 'ctaUrl', title: 'CTA URL', type: 'string' },
      ],
    }),
    
    // Announcement Bar
    defineField({
      name: 'announcementBar',
      title: 'Announcement Bar',
      type: 'object',
      fields: [
        { name: 'show', title: 'Show', type: 'boolean' },
        { name: 'message', title: 'Message', type: 'string' },
        { name: 'linkText', title: 'Link Text', type: 'string' },
        { name: 'linkUrl', title: 'Link URL', type: 'string' },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text' },
      ],
    }),
  ],
  preview: { prepare() { return { title: 'Homepage' } } },
})

// ============================================
// FINANCING PAGE - EXACT DATABASE MATCH
// ============================================
export const financingPage = defineType({
  name: 'financingPage',
  title: 'Financing Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    
    // Hero Section
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'featuredRateText', title: 'Featured Rate Text', type: 'string' },
        { name: 'rateSubtext', title: 'Rate Subtext', type: 'string' },
        { name: 'primaryCta', title: 'Primary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
        { name: 'secondaryCta', title: 'Secondary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
      ],
    }),
    
    // Benefits
    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'icon', title: 'Icon', type: 'string' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}],
    }),
    
    // Calculator
    defineField({
      name: 'calculator',
      title: 'Calculator',
      type: 'object',
      fields: [
        { name: 'defaultVehiclePrice', title: 'Default Vehicle Price', type: 'number' },
        { name: 'defaultDownPayment', title: 'Default Down Payment', type: 'number' },
        { name: 'defaultTerm', title: 'Default Term', type: 'number' },
        { name: 'defaultInterestRate', title: 'Default Interest Rate', type: 'number' },
        { name: 'termOptions', title: 'Term Options', type: 'array', of: [{ type: 'number' }] },
      ],
    }),
    
    // Process Steps
    defineField({
      name: 'processSteps',
      title: 'Process Steps',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'step', title: 'Step Number', type: 'number' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}],
    }),
    
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text' },
      ],
    }),
  ],
  preview: { prepare() { return { title: 'Financing Page' } } },
})

// ============================================
// SELL YOUR CAR PAGE - EXACT DATABASE MATCH
// ============================================
export const sellYourCarPage = defineType({
  name: 'sellYourCarPage',
  title: 'Sell Your Car Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    
    // Hero Section with formSettings
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'highlightText', title: 'Highlight Text', type: 'string' },
        { name: 'formSettings', title: 'Form Settings', type: 'object', fields: [
          { name: 'vinPlaceholder', title: 'VIN Placeholder', type: 'string' },
          { name: 'licensePlatePlaceholder', title: 'License Plate Placeholder', type: 'string' },
          { name: 'submitButtonText', title: 'Submit Button Text', type: 'string' },
        ]},
      ],
    }),
    
    // Benefits
    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'icon', title: 'Icon', type: 'string' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}],
    }),
    
    // Comparison Table with headers and rows
    defineField({
      name: 'comparisonTable',
      title: 'Comparison Table',
      type: 'object',
      fields: [
        { name: 'headers', title: 'Headers', type: 'array', of: [{ type: 'string' }] },
        { name: 'rows', title: 'Rows', type: 'array', of: [{ type: 'array', of: [{ type: 'string' }] }] },
      ],
    }),
    
    // Process Steps
    defineField({
      name: 'processSteps',
      title: 'Process Steps',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'step', title: 'Step Number', type: 'number' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}],
    }),
    
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text' },
      ],
    }),
  ],
  preview: { prepare() { return { title: 'Sell Your Car Page' } } },
})

// ============================================
// SELL PAGE (LEGACY) - EXACT DATABASE MATCH
// ============================================
export const sellPage = defineType({
  name: 'sellPage',
  title: 'Sell Page (Legacy)',
  type: 'document',
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text' }),
    
    // Hero
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'highlightText', title: 'Highlight Text', type: 'string' },
        { name: 'trustBadges', title: 'Trust Badges', type: 'array', of: [{ type: 'object', fields: [
          { name: 'icon', title: 'Icon', type: 'string' },
          { name: 'label', title: 'Label', type: 'string' },
        ]}]},
        { name: 'form', title: 'Form', type: 'object', fields: [
          { name: 'placeholderVin', title: 'VIN Placeholder', type: 'string' },
          { name: 'placeholderPlate', title: 'Plate Placeholder', type: 'string' },
          { name: 'buttonText', title: 'Button Text', type: 'string' },
        ]},
      ],
    }),
    
    // Benefits
    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'items', title: 'Items', type: 'array', of: [{ type: 'object', fields: [
          { name: 'icon', title: 'Icon', type: 'string' },
          { name: 'title', title: 'Title', type: 'string' },
          { name: 'description', title: 'Description', type: 'text' },
        ]}]},
      ],
    }),
    
    // Process
    defineField({
      name: 'process',
      title: 'Process',
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'object', fields: [
          { name: 'stepNumber', title: 'Step Number', type: 'number' },
          { name: 'icon', title: 'Icon', type: 'string' },
          { name: 'title', title: 'Title', type: 'string' },
          { name: 'description', title: 'Description', type: 'text' },
        ]}]},
      ],
    }),
    
    // Comparison
    defineField({
      name: 'comparison',
      title: 'Comparison',
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'sectionSubtitle', title: 'Section Subtitle', type: 'string' },
        { name: 'competitors', title: 'Competitors', type: 'array', of: [{ type: 'object', fields: [
          { name: 'name', title: 'Name', type: 'string' },
          { name: 'isUs', title: 'Is Us', type: 'boolean' },
        ]}]},
        { name: 'rows', title: 'Rows', type: 'array', of: [{ type: 'object', fields: [
          { name: 'feature', title: 'Feature', type: 'string' },
          { name: 'values', title: 'Values', type: 'array', of: [{ type: 'object', fields: [
            { name: 'value', title: 'Value', type: 'string' },
            { name: 'status', title: 'Status', type: 'string' },
          ]}]},
        ]}]},
      ],
    }),
    
    // CTA
    defineField({
      name: 'cta',
      title: 'CTA',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'string' },
        { name: 'bonusText', title: 'Bonus Text', type: 'string' },
        { name: 'buttonText', title: 'Button Text', type: 'string' },
        { name: 'buttonUrl', title: 'Button URL', type: 'string' },
      ],
    }),
  ],
  preview: { prepare() { return { title: 'Sell Page (Legacy)' } } },
})

// ============================================
// AI SETTINGS - EXACT DATABASE MATCH
// ============================================
export const aiSettings = defineType({
  name: 'aiSettings',
  title: 'AI Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    
    // Anna Assistant
    defineField({
      name: 'annaAssistant',
      title: 'Anna Assistant',
      type: 'object',
      fields: [
        { name: 'enabled', title: 'Enabled', type: 'boolean' },
        { name: 'displayName', title: 'Display Name', type: 'string' },
        { name: 'welcomeMessage', title: 'Welcome Message', type: 'text' },
        { name: 'quickActions', title: 'Quick Actions', type: 'array', of: [{ type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'prompt', title: 'Prompt', type: 'string' },
          { name: 'icon', title: 'Icon', type: 'string' },
        ]}]},
      ],
    }),
    
    // Price Negotiator
    defineField({
      name: 'priceNegotiator',
      title: 'Price Negotiator',
      type: 'object',
      fields: [
        { name: 'enabled', title: 'Enabled', type: 'boolean' },
        { name: 'requireVerification', title: 'Require Verification', type: 'boolean' },
        { name: 'negotiationRules', title: 'Negotiation Rules', type: 'object', fields: [
          { name: 'lowPriceThreshold', title: 'Low Price Threshold', type: 'number' },
          { name: 'lowPriceMaxDiscount_0_31days', title: 'Low Price Max Discount (0-31 days)', type: 'number' },
          { name: 'lowPriceMaxDiscount_32_46days', title: 'Low Price Max Discount (32-46 days)', type: 'number' },
          { name: 'lowPriceMaxDiscount_47plus', title: 'Low Price Max Discount (47+ days)', type: 'number' },
          { name: 'highPriceMaxDiscount_0_46days', title: 'High Price Max Discount (0-46 days)', type: 'number' },
          { name: 'highPriceMaxDiscount_47plus', title: 'High Price Max Discount (47+ days)', type: 'number' },
        ]},
      ],
    }),
    
    // Instant Appraisal
    defineField({
      name: 'instantAppraisal',
      title: 'Instant Appraisal',
      type: 'object',
      fields: [
        { name: 'enabled', title: 'Enabled', type: 'boolean' },
        { name: 'requireVerification', title: 'Require Verification', type: 'boolean' },
        { name: 'offerValidDays', title: 'Offer Valid Days', type: 'number' },
        { name: 'hstRate', title: 'HST Rate', type: 'number' },
        { name: 'dataSources', title: 'Data Sources', type: 'array', of: [{ type: 'string' }] },
      ],
    }),
    
    // Fees
    defineField({
      name: 'fees',
      title: 'Fees',
      type: 'object',
      fields: [
        { name: 'adminFee', title: 'Admin Fee', type: 'number' },
        { name: 'certification', title: 'Certification', type: 'number' },
        { name: 'financeDocFee', title: 'Finance Doc Fee', type: 'number' },
        { name: 'licensing', title: 'Licensing', type: 'number' },
        { name: 'omvic', title: 'OMVIC', type: 'number' },
      ],
    }),
    
    // Financing
    defineField({
      name: 'financing',
      title: 'Financing',
      type: 'object',
      fields: [
        { name: 'lowestRate', title: 'Lowest Rate', type: 'number' },
        { name: 'numberOfLenders', title: 'Number of Lenders', type: 'number' },
        { name: 'terms', title: 'Terms', type: 'array', of: [{ type: 'number' }] },
        { name: 'paymentFrequencies', title: 'Payment Frequencies', type: 'array', of: [{ type: 'string' }] },
      ],
    }),
  ],
  preview: { prepare() { return { title: 'AI Settings' } } },
})

// ============================================
// FAQ ITEM (Document) - EXACT DATABASE MATCH
// ============================================
export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  fields: [
    defineField({ name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'answer', title: 'Answer', type: 'text', validation: (Rule) => Rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  preview: { select: { title: 'question' } },
})

// ============================================
// LENDER - EXACT DATABASE MATCH
// ============================================
export const lender = defineType({
  name: 'lender',
  title: 'Lender',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'interestRate', title: 'Interest Rate', type: 'number' }),
    defineField({ name: 'maxTerm', title: 'Max Term', type: 'number' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean' }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  preview: { select: { title: 'name' } },
})

// Export all schemas
export const pageSchemas = [
  trustBadge,
  ctaButton,
  homepage,
  financingPage,
  sellYourCarPage,
  sellPage,
  aiSettings,
  faqItem,
  lender,
]
