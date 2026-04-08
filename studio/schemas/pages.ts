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
    defineField({ name: 'title', title: 'Title (Legacy)', type: 'string', hidden: true }),
    defineField({ name: 'description', title: 'Description (Legacy)', type: 'string', hidden: true }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
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
        { name: 'highlightCta', title: 'Highlight CTA (Legacy)', type: 'object', hidden: true, fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
      ],
    }),
    defineField({ name: 'trustBadges', title: 'Trust Badges', type: 'array', of: [{ type: 'trustBadge' }]}),
    defineField({ name: 'promoBanner', title: 'Promo Banner (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'text', title: 'Text', type: 'string' },
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
      { name: 'featuredRateText', title: 'Featured Rate Text', type: 'string' },
      { name: 'rateSubtext', title: 'Rate Subtext', type: 'string' },
      { name: 'primaryCta', title: 'Primary CTA', type: 'object', fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'url', title: 'URL', type: 'string' },
      ]},
      { name: 'secondaryCta', title: 'Secondary CTA (Legacy)', type: 'object', hidden: true, fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'url', title: 'URL', type: 'string' },
      ]},
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
      { name: 'defaultInterestRate', title: 'Default Interest Rate (Legacy)', type: 'number', hidden: true },
      { name: 'termOptions', title: 'Term Options', type: 'array', of: [{ type: 'number' }] },
    ]}),
    defineField({ name: 'processSteps', title: 'Process Steps', type: 'array', of: [{ type: 'object', fields: [
      { name: 'step', title: 'Step', type: 'number' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
    ]}]}),
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
    defineField({ name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'object', fields: [
      { name: 'icon', title: 'Icon', type: 'string' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
    ]}]}),
    defineField({ name: 'comparisonTable', title: 'Comparison Table', type: 'object', fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string' },
      { name: 'ourColumnTitle', title: 'Our Column Title', type: 'string' },
      { name: 'othersColumnTitle', title: 'Others Column Title', type: 'string' },
      { name: 'headers', title: 'Headers (Legacy)', type: 'array', of: [{ type: 'string' }] },
      { name: 'rows', title: 'Rows', type: 'array', of: [{ type: 'object', name: 'sellComparisonRow', fields: [
        { name: 'feature', title: 'Feature', type: 'string' },
        { name: 'us', title: 'Us', type: 'string' },
        { name: 'others', title: 'Others', type: 'string' },
        { name: 'tradeIn', title: 'Trade-In (Legacy)', type: 'string', hidden: true },
        { name: 'planetMotors', title: 'Planet Motors (Legacy)', type: 'string' },
        { name: 'competitors', title: 'Competitors (Legacy)', type: 'string' },
        { name: 'columns', title: 'Columns (Legacy Import)', type: 'array', of: [{ type: 'string' }] },
      ] }] },
    ]}),
    defineField({ name: 'processSteps', title: 'Process Steps (Legacy)', type: 'array', hidden: true, of: [{ type: 'object', fields: [
      { name: 'step', title: 'Step (Legacy)', type: 'number', hidden: true },
      { name: 'stepNumber', title: 'Step Number', type: 'number' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
      { name: 'icon', title: 'Icon', type: 'string' },
    ] }]}),
    defineField({ name: 'avilooBattery', title: 'Aviloo Battery SOH', type: 'object', fields: [
      { name: 'enabled', title: 'Enabled', type: 'boolean' },
      { name: 'title', title: 'Title', type: 'string' },
      { name: 'description', title: 'Description', type: 'text' },
    ]}),
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
      { name: 'highlightText', title: 'Highlight Text (Legacy)', type: 'string', hidden: true },
      { name: 'trustBadges', title: 'Trust Badges (Legacy)', type: 'array', hidden: true, of: [{ type: 'trustBadge' }] },
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
      { name: 'subheadline', title: 'Subheadline (Legacy)', type: 'string', hidden: true },
      { name: 'bonusText', title: 'Bonus Text', type: 'string' },
      { name: 'buttonText', title: 'Button Text', type: 'string' },
      { name: 'buttonUrl', title: 'Button URL', type: 'string' },
    ]}),
    defineField({ name: 'comparison', title: 'Comparison (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string', hidden: true },
      { name: 'sectionSubtitle', title: 'Section Subtitle', type: 'string', hidden: true },
      { name: 'headers', title: 'Headers', type: 'array', of: [{ type: 'string' }] },
      { name: 'competitors', title: 'Competitors', type: 'array', hidden: true, of: [{ type: 'object', fields: [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'isUs', title: 'Is Us', type: 'boolean' },
      ]}] },
      { name: 'rows', title: 'Rows', type: 'array', of: [{ type: 'object', fields: [
        { name: 'feature', title: 'Feature', type: 'string' },
        { name: 'us', title: 'Us', type: 'string' },
        { name: 'others', title: 'Others', type: 'string' },
        { name: 'values', title: 'Values', type: 'array', hidden: true, of: [{ type: 'object', fields: [
          { name: 'value', title: 'Value', type: 'string' },
          { name: 'status', title: 'Status', type: 'string' },
        ]}] },
      ]}] },
    ]}),
    defineField({ name: 'process', title: 'Process (Legacy)', type: 'object', hidden: true, fields: [
      { name: 'sectionTitle', title: 'Section Title', type: 'string', hidden: true },
      { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'object', fields: [
        { name: 'step', title: 'Step', type: 'number' },
        { name: 'stepNumber', title: 'Step Number', type: 'string', hidden: true },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
        { name: 'icon', title: 'Icon', type: 'string', hidden: true },
      ]}] },
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
      { name: 'requireVerification', title: 'Require Verification (Legacy)', type: 'boolean', hidden: true },
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
      { name: 'dataSources', title: 'Data Sources (Legacy)', type: 'array', hidden: true, of: [{ type: 'string' }] },
      { name: 'requireVerification', title: 'Require Verification (Legacy)', type: 'boolean', hidden: true },
    ]}),
    defineField({ name: 'fees', title: 'Fees', type: 'object', fields: [
      { name: 'adminFee', title: 'Admin Fee', type: 'number' },
      { name: 'certification', title: 'Certification', type: 'number' },
      { name: 'licensing', title: 'Licensing', type: 'number' },
      { name: 'omvic', title: 'OMVIC', type: 'number' },
      { name: 'financeDocFee', title: 'Finance Doc Fee (Legacy)', type: 'number', hidden: true },
    ]}),
    defineField({ name: 'financing', title: 'Financing', type: 'object', fields: [
      { name: 'lowestRate', title: 'Lowest Rate', type: 'number' },
      { name: 'numberOfLenders', title: 'Number of Lenders', type: 'number' },
      { name: 'terms', title: 'Terms', type: 'array', of: [{ type: 'number' }] },
      { name: 'paymentFrequencies', title: 'Payment Frequencies (Legacy)', type: 'array', hidden: true, of: [{ type: 'string' }] },
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
