import { defineType, defineField } from 'sanity'

// ============================================
// REUSABLE OBJECT TYPES - These are registered as named types
// so arrays can reference them with { type: 'trustBadge' }
// ============================================
export const trustBadge = defineType({
  name: 'trustBadge',
  title: 'Trust Badge',
  type: 'object',
  fields: [
    defineField({ name: 'icon', title: 'Icon', type: 'string' }),
    defineField({ name: 'text', title: 'Text', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'string' }),
    defineField({ name: 'value', title: 'Value', type: 'string' }),
  ],
})

export const ctaButton = defineType({
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
// HOMEPAGE
// ============================================
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    // Legacy flat hero fields kept to support existing seeded content
    defineField({ name: 'heroHeadline', title: 'Hero Headline (Legacy)', type: 'string', hidden: true }),
    defineField({ name: 'heroSubheadline', title: 'Hero Subheadline (Legacy)', type: 'text', hidden: true }),
    defineField({ name: 'heroCta', title: 'Hero CTA (Legacy)', type: 'ctaButton', hidden: true }),
    defineField({ name: 'heroSecondaryCta', title: 'Hero Secondary CTA (Legacy)', type: 'ctaButton', hidden: true }),
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
      ],
    }),
    defineField({ name: 'trustBadges', title: 'Trust Badges (Legacy)', type: 'array', hidden: true, of: [{ type: 'trustBadge' }]}),
    defineField({ name: 'promoBanner', title: 'Promo Banner', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'showBanner', title: 'Show Banner', type: 'boolean' },
      { name: 'text', title: 'Text', type: 'string' },
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'bodyText', title: 'Body Text', type: 'text' },
      { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
      { name: 'ctaUrl', title: 'CTA URL', type: 'string' },
      { name: 'backgroundColor', title: 'Background Color', type: 'string' },
    ]}),
    defineField({ name: 'quickFilters', title: 'Quick Filters', type: 'array', of: [{ type: 'object', fields: [
      { name: 'label', title: 'Label', type: 'string' },
      { name: 'url', title: 'URL', type: 'string' },
    ]}]}),
    defineField({ name: 'financingPromo', title: 'Financing Promo', type: 'object', fields: [
      { name: 'rate', title: 'Rate', type: 'string' },
      { name: 'rateLabel', title: 'Rate Label', type: 'string' },
      { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
      { name: 'ctaUrl', title: 'CTA URL', type: 'string' },
    ]}),
    defineField({ name: 'announcementBar', title: 'Announcement Bar', type: 'object', fields: [
      { name: 'show', title: 'Show', type: 'boolean' },
      { name: 'message', title: 'Message', type: 'string' },
      { name: 'linkText', title: 'Link Text', type: 'string' },
      { name: 'linkUrl', title: 'Link URL', type: 'string' },
    ]}),
    defineField({ name: 'seoTitle', title: 'SEO Title (Legacy)', type: 'string', hidden: true }),
    defineField({ name: 'seoDescription', title: 'SEO Description (Legacy)', type: 'text', hidden: true }),
    defineField({
      name: 'featuredVehicles',
      title: 'Featured Vehicles',
      description: 'Hand-pick 3-4 vehicles from Supabase inventory to highlight on the homepage. Leave empty to auto-select by price.',
      type: 'array',
      of: [{ type: 'supabaseVehicleReference' }],
      validation: (Rule) => Rule.max(6).unique(),
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: [
      { name: 'metaTitle', title: 'Meta Title', type: 'string' },
      { name: 'metaDescription', title: 'Meta Description', type: 'text' },
    ]}),
  ],
  preview: { prepare() { return { title: 'Homepage' } } },
})

// ============================================
// FINANCING PAGE
// ============================================
export const financingPage = defineType({
  name: 'financingPage',
  title: 'Financing Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'heroSection', title: 'Hero Section', type: 'object', fields: [
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'subheadline', title: 'Subheadline', type: 'text' },
      { name: 'highlight', title: 'Highlight', type: 'string' },
      { name: 'highlightText', title: 'Highlight Text', type: 'string' },
      { name: 'featuredRateText', title: 'Featured Rate Text', type: 'string' },
      { name: 'rateSubtext', title: 'Rate Subtext', type: 'string' },
      { name: 'primaryCta', title: 'Primary CTA', type: 'object', fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'url', title: 'URL', type: 'string' },
      ]},
    ]}),
    defineField({ name: 'highlight', title: 'Highlight (Legacy)', type: 'string', hidden: true }),
    defineField({ name: 'formSettings', title: 'Form Settings (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
    ]}),
    defineField({ name: 'benefitsSection', title: 'Benefits Section (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string' },
      { name: 'items', title: 'Items', type: 'array', of: [{ type: 'object', fields: [
        { name: 'icon', title: 'Icon', type: 'string' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}]},
    ]}),
    defineField({ name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'object', fields: [
      { name: 'icon', title: 'Icon', type: 'string' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
    ]}]}),
    defineField({ name: 'calculator', title: 'Calculator', type: 'object', fields: [
      { name: 'defaultVehiclePrice', title: 'Default Vehicle Price', type: 'number' },
      { name: 'defaultDownPayment', title: 'Default Down Payment', type: 'number' },
      { name: 'defaultTerm', title: 'Default Term', type: 'number' },
      { name: 'termOptions', title: 'Term Options', type: 'array', of: [{ type: 'number' }] },
    ]}),
    defineField({ name: 'processSteps', title: 'Process Steps', type: 'array', of: [{ type: 'object', fields: [
      { name: 'step', title: 'Step', type: 'number' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
    ]}]}),
    defineField({ name: 'howItWorks', title: 'How It Works (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string' },
      { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'object', fields: [
        { name: 'stepNumber', title: 'Step Number', type: 'number' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}]},
    ]}),
    defineField({ name: 'ctaSection', title: 'CTA Section', type: 'object', fields: [
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'subheadline', title: 'Subheadline', type: 'text' },
      { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
      { name: 'ctaUrl', title: 'CTA URL', type: 'string' },
    ]}),
    defineField({ name: 'seoTitle', title: 'SEO Title (Legacy)', type: 'string', hidden: true }),
    defineField({ name: 'seoDescription', title: 'SEO Description (Legacy)', type: 'text', hidden: true }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: [
      { name: 'metaTitle', title: 'Meta Title', type: 'string' },
      { name: 'metaDescription', title: 'Meta Description', type: 'text' },
    ]}),
  ],
  preview: { prepare() { return { title: 'Financing Page' } } },
})

// ============================================
// SELL YOUR CAR PAGE
// ============================================
export const sellYourCarPage = defineType({
  name: 'sellYourCarPage',
  title: 'Sell Your Car Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'heroSection', title: 'Hero Section', type: 'object', fields: [
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'subheadline', title: 'Subheadline', type: 'text' },
      { name: 'highlightText', title: 'Highlight Text', type: 'string' },
      { name: 'formSettings', title: 'Form Settings', type: 'object', fields: [
        { name: 'vinPlaceholder', title: 'VIN Placeholder', type: 'string' },
        { name: 'licensePlatePlaceholder', title: 'License Plate Placeholder', type: 'string' },
        { name: 'submitButtonText', title: 'Submit Button Text', type: 'string' },
      ]},
    ]}),
    defineField({ name: 'formSettings', title: 'Form Settings (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
    ]}),
    defineField({ name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'object', fields: [
      { name: 'icon', title: 'Icon', type: 'string' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
    ]}]}),
    defineField({ name: 'whySellToUs', title: 'Why Sell To Us (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string' },
      { name: 'benefitItems', title: 'Benefit Items', type: 'array', of: [{ type: 'object', fields: [
        { name: 'icon', title: 'Icon', type: 'string' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}]},
    ]}),
    defineField({ name: 'comparisonTable', title: 'Comparison Table', type: 'object', fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string' },
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'planetMotorsLabel', title: 'Planet Motors Label', type: 'string' },
      { name: 'othersLabel', title: 'Others Label', type: 'string' },
      { name: 'headers', title: 'Headers', type: 'array', of: [{ type: 'string' }] },
      { name: 'rows', title: 'Rows', type: 'array', of: [{ type: 'object', fields: [
        { name: 'cells', title: 'Cells', type: 'array', of: [{ type: 'string' }] },
        { name: 'feature', title: 'Feature', type: 'string' },
        { name: 'planetMotors', title: 'Planet Motors', type: 'string' },
        { name: 'others', title: 'Others', type: 'string' },
        { name: 'highlight', title: 'Highlight', type: 'boolean' },
      ] }] },
    ]}),
    defineField({ name: 'avilooBattery', title: 'Aviloo Battery SOH', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
    ]}),
    defineField({ name: 'processSteps', title: 'Process Steps', type: 'array', of: [{ type: 'object', fields: [
      { name: 'step', title: 'Step', type: 'number' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
    ]}]}),
    defineField({ name: 'testimonials', title: 'Testimonials', type: 'array', of: [{ type: 'object', fields: [
      { name: 'name', title: 'Name', type: 'string' },
      { name: 'quote', title: 'Quote', type: 'text' },
      { name: 'rating', title: 'Rating', type: 'number' },
    ]}]}),
    defineField({ name: 'howItWorks', title: 'How It Works (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string' },
      { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'object', fields: [
        { name: 'stepNumber', title: 'Step Number', type: 'number' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}]},
    ]}),
    defineField({ name: 'ctaSection', title: 'CTA Section', type: 'object', fields: [
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'subheadline', title: 'Subheadline', type: 'text' },
      { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
      { name: 'ctaUrl', title: 'CTA URL', type: 'string' },
    ]}),
    defineField({ name: 'seoTitle', title: 'SEO Title (Legacy)', type: 'string', hidden: true }),
    defineField({ name: 'seoDescription', title: 'SEO Description (Legacy)', type: 'text', hidden: true }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: [
      { name: 'metaTitle', title: 'Meta Title', type: 'string' },
      { name: 'metaDescription', title: 'Meta Description', type: 'text' },
    ]}),
  ],
  preview: { prepare() { return { title: 'Sell Your Car Page' } } },
})

// ============================================
// SELL PAGE (LEGACY)
// ============================================
export const sellPage = defineType({
  name: 'sellPage',
  title: 'Sell Page (Legacy)',
  type: 'document',
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text' }),
    defineField({ name: 'hero', title: 'Hero', type: 'object', fields: [
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'subheadline', title: 'Subheadline', type: 'text' },
      { name: 'form', title: 'Form', type: 'object', fields: [
        { name: 'placeholderVin', title: 'VIN Placeholder', type: 'string' },
        { name: 'placeholderPlate', title: 'Plate Placeholder', type: 'string' },
        { name: 'buttonText', title: 'Button Text', type: 'string' },
      ]},
    ]}),
    defineField({ name: 'benefits', title: 'Benefits', type: 'object', fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string' },
      { name: 'items', title: 'Items', type: 'array', of: [{ type: 'object', fields: [
        { name: 'icon', title: 'Icon', type: 'string' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
      ]}]},
    ]}),
    defineField({ name: 'cta', title: 'CTA', type: 'object', fields: [
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'bonusText', title: 'Bonus Text', type: 'string' },
      { name: 'buttonText', title: 'Button Text', type: 'string' },
      { name: 'buttonUrl', title: 'Button URL', type: 'string' },
    ]}),
  ],
  preview: { prepare() { return { title: 'Sell Page (Legacy)' } } },
})

// ============================================
// AI SETTINGS
// ============================================
export const aiSettings = defineType({
  name: 'aiSettings',
  title: 'AI Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'annaAssistant', title: 'Anna Assistant', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'displayName', title: 'Display Name', type: 'string' },
      { name: 'welcomeMessage', title: 'Welcome Message', type: 'text' },
      { name: 'quickActions', title: 'Quick Actions', type: 'array', of: [{ type: 'object', fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'prompt', title: 'Prompt', type: 'string' },
        { name: 'icon', title: 'Icon', type: 'string' },
      ]}]},
    ]}),
    defineField({ name: 'priceNegotiator', title: 'Price Negotiator', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'negotiationRules', title: 'Rules', type: 'object', fields: [
        { name: 'lowPriceThreshold', title: 'Low Price Threshold', type: 'number' },
        { name: 'lowPriceMaxDiscount_0_31days', title: 'Low 0-31 days %', type: 'number' },
        { name: 'lowPriceMaxDiscount_32_46days', title: 'Low 32-46 days %', type: 'number' },
        { name: 'lowPriceMaxDiscount_47plus', title: 'Low 47+ days %', type: 'number' },
        { name: 'highPriceMaxDiscount_0_46days', title: 'High 0-46 days %', type: 'number' },
        { name: 'highPriceMaxDiscount_47plus', title: 'High 47+ days %', type: 'number' },
      ]},
    ]}),
    defineField({ name: 'instantAppraisal', title: 'Instant Appraisal', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'offerValidDays', title: 'Offer Valid Days', type: 'number' },
      { name: 'hstRate', title: 'HST Rate', type: 'number' },
    ]}),
    defineField({ name: 'fees', title: 'Fees', type: 'object', fields: [
      { name: 'adminFee', title: 'Admin Fee', type: 'number' },
      { name: 'certification', title: 'Certification', type: 'number' },
      { name: 'licensing', title: 'Licensing', type: 'number' },
      { name: 'omvic', title: 'OMVIC', type: 'number' },
    ]}),
    defineField({ name: 'financing', title: 'Financing', type: 'object', fields: [
      { name: 'lowestRate', title: 'Lowest Rate', type: 'number' },
      { name: 'numberOfLenders', title: 'Number of Lenders', type: 'number' },
      { name: 'terms', title: 'Terms', type: 'array', of: [{ type: 'number' }] },
    ]}),
  ],
  preview: { prepare() { return { title: 'AI Settings' } } },
})

// ============================================
// FAQ ITEM
// ============================================
export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  fields: [
    defineField({ name: 'question', title: 'Question', type: 'string' }),
    defineField({ name: 'answer', title: 'Answer', type: 'text' }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  preview: { select: { title: 'question' } },
})

// ============================================
// LENDER
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

// ============================================
// VDP SETTINGS - 210 INSPECTION + AVILOO + REQUEST CALL
// ============================================
export const vdpSettings = defineType({
  name: 'vdpSettings',
  title: 'VDP Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'inspection', title: '210-Point Inspection', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
      { name: 'categories', title: 'Categories', type: 'array', of: [{ type: 'object', fields: [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'icon', title: 'Icon', type: 'string' },
        { name: 'points', title: 'Points', type: 'number' },
        { name: 'items', title: 'Items', type: 'array', of: [{ type: 'string' }] },
      ]}]},
    ]}),
    defineField({ name: 'avilooBattery', title: 'Aviloo Battery SOH', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'showForEVOnly', title: 'Show for EV Only', type: 'boolean' },
      { name: 'healthThresholds', title: 'Thresholds', type: 'object', fields: [
        { name: 'excellent', title: 'Excellent %', type: 'number' },
        { name: 'good', title: 'Good %', type: 'number' },
        { name: 'fair', title: 'Fair %', type: 'number' },
      ]},
    ]}),
    defineField({ name: 'requestCall', title: 'Request a Call', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'buttonText', title: 'Button Text', type: 'string' },
      { name: 'responseTime', title: 'Response Time', type: 'string' },
    ]}),
    defineField({ name: 'ctaButtons', title: 'CTA Buttons', type: 'array', of: [{ type: 'object', fields: [
      { name: 'label', title: 'Label', type: 'string' },
      { name: 'url', title: 'URL', type: 'string' },
      { name: 'icon', title: 'Icon', type: 'string' },
      { name: 'style', title: 'Style', type: 'string' },
      { name: 'order', title: 'Order', type: 'number' },
    ]}]}),
  ],
  preview: { prepare() { return { title: 'VDP Settings' } } },
})

// ============================================
// DELIVERY SETTINGS
// ============================================
export const deliverySettings = defineType({
  name: 'deliverySettings',
  title: 'Delivery Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'origin', title: 'Origin', type: 'object', fields: [
      { name: 'address', title: 'Address', type: 'string' },
      { name: 'city', title: 'City', type: 'string' },
      { name: 'province', title: 'Province', type: 'string' },
      { name: 'postalCode', title: 'Postal Code', type: 'string' },
      { name: 'lat', title: 'Latitude', type: 'number' },
      { name: 'lng', title: 'Longitude', type: 'number' },
    ]}),
    defineField({ name: 'deliveryTiers', title: 'Delivery Tiers', type: 'array', of: [{ type: 'object', fields: [
      { name: 'minKm', title: 'Min km', type: 'number' },
      { name: 'maxKm', title: 'Max km', type: 'number' },
      { name: 'costType', title: 'Cost Type', type: 'string' },
      { name: 'cost', title: 'Cost', type: 'number' },
      { name: 'label', title: 'Label', type: 'string' },
    ]}]}),
    defineField({ name: 'freeDeliveryRadius', title: 'Free Delivery Radius (km)', type: 'number' }),
    defineField({ name: 'deliveryTimeEstimates', title: 'Time Estimates', type: 'array', of: [{ type: 'object', fields: [
      { name: 'maxDistance', title: 'Max Distance', type: 'number' },
      { name: 'estimate', title: 'Estimate', type: 'string' },
    ]}]}),
    defineField({ name: 'enclosedTransport', title: 'Enclosed Transport', type: 'boolean' }),
    defineField({ name: 'fullyInsured', title: 'Fully Insured', type: 'boolean' }),
    defineField({ name: 'weekendDelivery', title: 'Weekend Delivery', type: 'boolean' }),
  ],
  preview: { prepare() { return { title: 'Delivery Settings' } } },
})

// ============================================
// CALCULATOR SETTINGS
// ============================================
export const calculatorSettings = defineType({
  name: 'calculatorSettings',
  title: 'Calculator Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'taxRate', title: 'Tax Rate %', type: 'number' }),
    defineField({ name: 'defaultDownPayment', title: 'Default Down Payment', type: 'number' }),
    defineField({ name: 'defaultTerm', title: 'Default Term', type: 'number' }),
    defineField({ name: 'creditTiers', title: 'Credit Tiers', type: 'array', of: [{ type: 'object', fields: [
      { name: 'label', title: 'Label', type: 'string' },
      { name: 'minScore', title: 'Min Score', type: 'number' },
      { name: 'apr', title: 'APR %', type: 'number' },
    ]}]}),
    defineField({ name: 'termOptions', title: 'Term Options', type: 'array', of: [{ type: 'number' }] }),
    defineField({ name: 'showBiWeekly', title: 'Show Bi-Weekly', type: 'boolean' }),
    defineField({ name: 'disclaimer', title: 'Disclaimer', type: 'text' }),
  ],
  preview: { prepare() { return { title: 'Calculator Settings' } } },
})

// ============================================
// CUSTOMER AUTH SETTINGS
// ============================================
export const customerAuthSettings = defineType({
  name: 'customerAuthSettings',
  title: 'Customer Auth Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'signIn', title: 'Sign In', type: 'object', fields: [
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'subheadline', title: 'Subheadline', type: 'string' },
      { name: 'buttonText', title: 'Button Text', type: 'string' },
    ]}),
    defineField({ name: 'signUp', title: 'Sign Up', type: 'object', fields: [
      { name: 'headline', title: 'Headline', type: 'string' },
      { name: 'subheadline', title: 'Subheadline', type: 'string' },
      { name: 'buttonText', title: 'Button Text', type: 'string' },
    ]}),
    defineField({ name: 'financeFields', title: 'Finance Application Fields', type: 'array', of: [{ type: 'object', fields: [
      { name: 'name', title: 'Field Name', type: 'string' },
      { name: 'label', title: 'Label', type: 'string' },
      { name: 'type', title: 'Type', type: 'string' },
      { name: 'required', title: 'Required', type: 'boolean' },
      { name: 'placeholder', title: 'Placeholder', type: 'string' },
      { name: 'options', title: 'Options', type: 'array', of: [{ type: 'string' }] },
      { name: 'order', title: 'Order', type: 'number' },
    ]}]}),
    defineField({ name: 'accountBenefits', title: 'Account Benefits', type: 'array', of: [{ type: 'object', fields: [
      { name: 'icon', title: 'Icon', type: 'string' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'string' },
    ]}]}),
  ],
  preview: { prepare() { return { title: 'Customer Auth Settings' } } },
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
  vdpSettings,
  deliverySettings,
  calculatorSettings,
  customerAuthSettings,
]
