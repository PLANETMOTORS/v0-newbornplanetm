import { defineType, defineField } from 'sanity'

// ============================================
// REUSABLE OBJECT TYPES
// ============================================

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

const faqItemObject = defineType({
  name: 'faqItemObject',
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
    defineField({ name: 'label', title: 'Button Label', type: 'string' }),
    defineField({ name: 'url', title: 'URL', type: 'string' }),
    defineField({ name: 'style', title: 'Style', type: 'string', options: { list: ['primary', 'secondary', 'outline'] } }),
  ],
})

// SEO Object for reuse
const seoFields = [
  { name: 'metaTitle', title: 'Meta Title', type: 'string' },
  { name: 'metaDescription', title: 'Meta Description', type: 'text' },
  { name: 'title', title: 'SEO Title', type: 'string' },
  { name: 'description', title: 'SEO Description', type: 'text' },
  { name: 'image', title: 'OG Image', type: 'image' },
  { name: 'keywords', title: 'Keywords', type: 'array', of: [{ type: 'string' }] },
]

// ============================================
// HOMEPAGE
// ============================================
export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Homepage' }),
    
    // Hero Section (nested object)
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'headlineHighlight', title: 'Headline Highlight', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'highlightText', title: 'Highlight Text', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
        { name: 'backgroundVideo', title: 'Background Video URL', type: 'url' },
        { name: 'primaryCta', title: 'Primary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
        { name: 'secondaryCta', title: 'Secondary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
        { name: 'showForm', title: 'Show Form', type: 'boolean' },
        { name: 'formTitle', title: 'Form Title', type: 'string' },
      ],
    }),
    
    // Trust Badges
    defineField({
      name: 'trustBadges',
      title: 'Trust Badges',
      type: 'array',
      of: [{ type: 'trustBadge' }],
    }),
    
    // Quick Filters
    defineField({
      name: 'quickFilters',
      title: 'Quick Filters',
      type: 'object',
      fields: [
        { name: 'showFilters', title: 'Show Quick Filters', type: 'boolean' },
        { name: 'filterOptions', title: 'Filter Options', type: 'array', of: [
          { type: 'object', fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'value', title: 'Value', type: 'string' },
            { name: 'type', title: 'Filter Type', type: 'string' },
          ]}
        ]},
      ],
    }),
    
    // Financing Promo
    defineField({
      name: 'financingPromo',
      title: 'Financing Promo',
      type: 'object',
      fields: [
        { name: 'enabled', title: 'Show Financing Promo', type: 'boolean' },
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'string' },
        { name: 'rate', title: 'Rate', type: 'string' },
        { name: 'rateLabel', title: 'Rate Label', type: 'string' },
        { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
        { name: 'ctaUrl', title: 'CTA URL', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
      ],
    }),
    
    // Announcement Bar
    defineField({
      name: 'announcementBar',
      title: 'Announcement Bar',
      type: 'object',
      fields: [
        { name: 'show', title: 'Show Announcement', type: 'boolean' },
        { name: 'enabled', title: 'Enabled', type: 'boolean' },
        { name: 'message', title: 'Message', type: 'string' },
        { name: 'text', title: 'Text', type: 'string' },
        { name: 'linkText', title: 'Link Text', type: 'string' },
        { name: 'linkUrl', title: 'Link URL', type: 'string' },
        { name: 'link', title: 'Link', type: 'string' },
        { name: 'backgroundColor', title: 'Background Color', type: 'string' },
        { name: 'textColor', title: 'Text Color', type: 'string' },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: seoFields,
    }),
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
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Financing' }),
    
    // Hero Section
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'highlightText', title: 'Highlight Text', type: 'string' },
        { name: 'featuredRateText', title: 'Featured Rate Text', type: 'string' },
        { name: 'rateSubtext', title: 'Rate Subtext', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
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
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'items', title: 'Benefit Items', type: 'array', of: [{ type: 'benefitItem' }] },
      ],
    }),
    
    // Calculator
    defineField({
      name: 'calculator',
      title: 'Calculator Settings',
      type: 'object',
      fields: [
        { name: 'showCalculator', title: 'Show Calculator', type: 'boolean' },
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
        { name: 'defaultVehiclePrice', title: 'Default Vehicle Price', type: 'number' },
        { name: 'defaultDownPayment', title: 'Default Down Payment', type: 'number' },
        { name: 'defaultTerm', title: 'Default Term (months)', type: 'number' },
        { name: 'defaultInterestRate', title: 'Default Interest Rate (%)', type: 'number' },
        { name: 'minPrice', title: 'Min Price', type: 'number' },
        { name: 'maxPrice', title: 'Max Price', type: 'number' },
        { name: 'termOptions', title: 'Term Options', type: 'array', of: [{ type: 'number' }] },
      ],
    }),
    
    // Process Steps
    defineField({
      name: 'processSteps',
      title: 'Process Steps',
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'processStep' }] },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: seoFields,
    }),
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
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Sell Your Car' }),
    
    // Hero Section
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'highlightText', title: 'Highlight Text', type: 'string' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
        { name: 'primaryCta', title: 'Primary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
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
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'items', title: 'Benefit Items', type: 'array', of: [{ type: 'benefitItem' }] },
      ],
    }),
    
    // Comparison Table
    defineField({
      name: 'comparisonTable',
      title: 'Comparison Table',
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'headers', title: 'Column Headers', type: 'object', fields: [
          { name: 'feature', title: 'Feature Column', type: 'string' },
          { name: 'us', title: 'Us Column', type: 'string' },
          { name: 'others', title: 'Others Column', type: 'string' },
        ]},
        { name: 'rows', title: 'Comparison Rows', type: 'array', of: [{ type: 'comparisonRow' }] },
      ],
    }),
    
    // Process Steps
    defineField({
      name: 'processSteps',
      title: 'Process Steps',
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'steps', title: 'Steps', type: 'array', of: [{ type: 'processStep' }] },
      ],
    }),
    
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: seoFields,
    }),
  ],
  preview: { prepare() { return { title: 'Sell Your Car Page' } } },
})

// ============================================
// TRADE-IN PAGE
// ============================================
export const tradeInPage = defineType({
  name: 'tradeInPage',
  title: 'Trade-In Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Trade-In' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
        { name: 'primaryCta', title: 'Primary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
      ],
    }),
    defineField({ name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'benefitItem' }] }),
    defineField({ name: 'processSteps', title: 'Process Steps', type: 'array', of: [{ type: 'processStep' }] }),
    defineField({ name: 'faqs', title: 'FAQs', type: 'array', of: [{ type: 'faqItemObject' }] }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'Trade-In Page' } } },
})

// ============================================
// CONTACT US PAGE
// ============================================
export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact Us Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Contact Us' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
      ],
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      fields: [
        { name: 'phone', title: 'Phone', type: 'string' },
        { name: 'email', title: 'Email', type: 'string' },
        { name: 'address', title: 'Address', type: 'text' },
        { name: 'googleMapsEmbed', title: 'Google Maps Embed URL', type: 'url' },
        { name: 'hours', title: 'Business Hours', type: 'array', of: [{ type: 'object', fields: [
          { name: 'day', title: 'Day', type: 'string' },
          { name: 'hours', title: 'Hours', type: 'string' },
        ]}]},
      ],
    }),
    defineField({
      name: 'formSettings',
      title: 'Form Settings',
      type: 'object',
      fields: [
        { name: 'formTitle', title: 'Form Title', type: 'string' },
        { name: 'submitButtonText', title: 'Submit Button Text', type: 'string' },
        { name: 'successMessage', title: 'Success Message', type: 'text' },
      ],
    }),
    defineField({ name: 'faqs', title: 'FAQs', type: 'array', of: [{ type: 'faqItemObject' }] }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'Contact Us Page' } } },
})

// ============================================
// ABOUT US PAGE
// ============================================
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Us Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'About Us' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
      ],
    }),
    defineField({
      name: 'story',
      title: 'Our Story',
      type: 'object',
      fields: [
        { name: 'title', title: 'Section Title', type: 'string' },
        { name: 'content', title: 'Content', type: 'array', of: [{ type: 'block' }] },
        { name: 'image', title: 'Image', type: 'image' },
      ],
    }),
    defineField({
      name: 'team',
      title: 'Team',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'name', title: 'Name', type: 'string' },
          { name: 'role', title: 'Role', type: 'string' },
          { name: 'bio', title: 'Bio', type: 'text' },
          { name: 'image', title: 'Photo', type: 'image' },
        ],
      }],
    }),
    defineField({ name: 'values', title: 'Our Values', type: 'array', of: [{ type: 'benefitItem' }] }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'About Us Page' } } },
})

// ============================================
// BLOG INDEX PAGE
// ============================================
export const blogIndexPage = defineType({
  name: 'blogIndexPage',
  title: 'Blog Index Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Blog' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
      ],
    }),
    defineField({ name: 'featuredPosts', title: 'Featured Posts', type: 'array', of: [{ type: 'reference', to: [{ type: 'blogPost' }] }] }),
    defineField({ name: 'postsPerPage', title: 'Posts Per Page', type: 'number', initialValue: 12 }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'Blog Index Page' } } },
})

// ============================================
// INVENTORY PAGE
// ============================================
export const inventoryPage = defineType({
  name: 'inventoryPage',
  title: 'Inventory Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Inventory' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'showSearch', title: 'Show Search', type: 'boolean' },
      ],
    }),
    defineField({
      name: 'filterSettings',
      title: 'Filter Settings',
      type: 'object',
      fields: [
        { name: 'showMakeFilter', title: 'Show Make Filter', type: 'boolean' },
        { name: 'showModelFilter', title: 'Show Model Filter', type: 'boolean' },
        { name: 'showYearFilter', title: 'Show Year Filter', type: 'boolean' },
        { name: 'showPriceFilter', title: 'Show Price Filter', type: 'boolean' },
        { name: 'showBodyTypeFilter', title: 'Show Body Type Filter', type: 'boolean' },
      ],
    }),
    defineField({ name: 'vehiclesPerPage', title: 'Vehicles Per Page', type: 'number', initialValue: 24 }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'Inventory Page' } } },
})

// ============================================
// VDP (Vehicle Detail Page) SETTINGS
// ============================================
export const vdpSettings = defineType({
  name: 'vdpSettings',
  title: 'Vehicle Detail Page Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', initialValue: 'VDP Settings' }),
    defineField({
      name: 'layout',
      title: 'Layout Settings',
      type: 'object',
      fields: [
        { name: 'showGallery', title: 'Show Gallery', type: 'boolean', initialValue: true },
        { name: 'showSpecs', title: 'Show Specs', type: 'boolean', initialValue: true },
        { name: 'showCalculator', title: 'Show Calculator', type: 'boolean', initialValue: true },
        { name: 'showSimilarVehicles', title: 'Show Similar Vehicles', type: 'boolean', initialValue: true },
      ],
    }),
    defineField({
      name: 'ctaButtons',
      title: 'CTA Buttons',
      type: 'object',
      fields: [
        { name: 'primaryLabel', title: 'Primary Button Label', type: 'string' },
        { name: 'primaryAction', title: 'Primary Action', type: 'string' },
        { name: 'secondaryLabel', title: 'Secondary Button Label', type: 'string' },
        { name: 'secondaryAction', title: 'Secondary Action', type: 'string' },
      ],
    }),
    defineField({ name: 'disclaimers', title: 'Disclaimers', type: 'text' }),
  ],
  preview: { prepare() { return { title: 'VDP Settings' } } },
})

// ============================================
// SERVICES PAGE
// ============================================
export const servicesPage = defineType({
  name: 'servicesPage',
  title: 'Services Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Services' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
      ],
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'title', title: 'Service Title', type: 'string' },
          { name: 'description', title: 'Description', type: 'text' },
          { name: 'icon', title: 'Icon', type: 'string' },
          { name: 'image', title: 'Image', type: 'image' },
          { name: 'link', title: 'Link', type: 'string' },
        ],
      }],
    }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'Services Page' } } },
})

// ============================================
// WARRANTY PAGE
// ============================================
export const warrantyPage = defineType({
  name: 'warrantyPage',
  title: 'Warranty Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'Warranty' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
      ],
    }),
    defineField({ name: 'protectionPlans', title: 'Featured Protection Plans', type: 'array', of: [{ type: 'reference', to: [{ type: 'protectionPlan' }] }] }),
    defineField({ name: 'faqs', title: 'FAQs', type: 'array', of: [{ type: 'faqItemObject' }] }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'Warranty Page' } } },
})

// ============================================
// FAQ PAGE
// ============================================
export const faqPage = defineType({
  name: 'faqPage',
  title: 'FAQ Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string', initialValue: 'FAQ' }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
      ],
    }),
    defineField({
      name: 'categories',
      title: 'FAQ Categories',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'title', title: 'Category Title', type: 'string' },
          { name: 'faqs', title: 'FAQs', type: 'array', of: [{ type: 'faqItemObject' }] },
        ],
      }],
    }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'FAQ Page' } } },
})

// ============================================
// SELL PAGE (Legacy)
// ============================================
export const sellPage = defineType({
  name: 'sellPage',
  title: 'Sell Page (Legacy)',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string' }),
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
        { name: 'form', title: 'Form Settings', type: 'object', fields: [
          { name: 'placeholderVin', title: 'VIN Placeholder', type: 'string' },
          { name: 'placeholderPlate', title: 'Plate Placeholder', type: 'string' },
          { name: 'buttonText', title: 'Button Text', type: 'string' },
        ]},
      ],
    }),
    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'items', title: 'Benefit Items', type: 'array', of: [{ type: 'benefitItem' }] },
      ],
    }),
    defineField({
      name: 'comparison',
      title: 'Comparison',
      type: 'object',
      fields: [
        { name: 'sectionTitle', title: 'Section Title', type: 'string' },
        { name: 'competitors', title: 'Competitors Label', type: 'string' },
        { name: 'rows', title: 'Comparison Rows', type: 'array', of: [{ type: 'comparisonRow' }] },
      ],
    }),
    defineField({
      name: 'cta',
      title: 'CTA Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'bonusText', title: 'Bonus Text', type: 'string' },
        { name: 'buttonText', title: 'Button Text', type: 'string' },
        { name: 'buttonUrl', title: 'Button URL', type: 'string' },
      ],
    }),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { prepare() { return { title: 'Sell Page (Legacy)' } } },
})

// ============================================
// FAQ ITEM (Document type)
// ============================================
export const faqItemDoc = defineType({
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  fields: [
    defineField({ name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'answer', title: 'Answer', type: 'text', validation: (Rule) => Rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string', options: { list: [
      { title: 'General', value: 'general' },
      { title: 'Financing', value: 'financing' },
      { title: 'Trade-In', value: 'trade-in' },
      { title: 'Delivery', value: 'delivery' },
      { title: 'Warranty', value: 'warranty' },
    ]}}),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
  preview: { select: { title: 'question', subtitle: 'category' } },
})

// ============================================
// AI SETTINGS
// ============================================
export const aiSettings = defineType({
  name: 'aiSettings',
  title: 'AI Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', initialValue: 'AI Settings' }),
    
    // Anna Assistant
    defineField({
      name: 'annaAssistant',
      title: 'Anna Assistant',
      type: 'object',
      fields: [
        { name: 'enabled', title: 'Enabled', type: 'boolean' },
        { name: 'displayName', title: 'Display Name', type: 'string' },
        { name: 'avatarImage', title: 'Avatar Image', type: 'image' },
        { name: 'welcomeMessage', title: 'Welcome Message', type: 'text' },
        { name: 'personality', title: 'Personality', type: 'text' },
        { name: 'quickActions', title: 'Quick Actions', type: 'array', of: [{
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'prompt', title: 'Prompt', type: 'string' },
            { name: 'icon', title: 'Icon', type: 'string' },
          ],
        }]},
      ],
    }),
    
    // Price Negotiator
    defineField({
      name: 'priceNegotiator',
      title: 'Price Negotiator',
      type: 'object',
      fields: [
        { name: 'enabled', title: 'Enabled', type: 'boolean' },
        { name: 'negotiationRules', title: 'Negotiation Rules', type: 'object', fields: [
          { name: 'minDiscountPercent', title: 'Min Discount %', type: 'number' },
          { name: 'maxDiscountPercent', title: 'Max Discount %', type: 'number' },
          { name: 'requireManagerApproval', title: 'Require Manager Approval', type: 'boolean' },
          { name: 'approvalThreshold', title: 'Approval Threshold', type: 'number' },
          { name: 'counterOfferStrategy', title: 'Counter Offer Strategy', type: 'string' },
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
        { name: 'provider', title: 'Provider', type: 'string' },
        { name: 'apiKey', title: 'API Key', type: 'string' },
        { name: 'adjustmentRules', title: 'Adjustment Rules', type: 'array', of: [{
          type: 'object',
          fields: [
            { name: 'condition', title: 'Condition', type: 'string' },
            { name: 'adjustment', title: 'Adjustment %', type: 'number' },
          ],
        }]},
      ],
    }),
    
    // Fees Configuration
    defineField({
      name: 'fees',
      title: 'Fees Configuration',
      type: 'object',
      fields: [
        { name: 'documentationFee', title: 'Documentation Fee', type: 'number' },
        { name: 'licensingFee', title: 'Licensing Fee', type: 'number' },
        { name: 'registrationFee', title: 'Registration Fee', type: 'number' },
        { name: 'additionalFees', title: 'Additional Fees', type: 'array', of: [{
          type: 'object',
          fields: [
            { name: 'name', title: 'Fee Name', type: 'string' },
            { name: 'amount', title: 'Amount', type: 'number' },
            { name: 'taxable', title: 'Taxable', type: 'boolean' },
          ],
        }]},
      ],
    }),
    
    // Financing Configuration
    defineField({
      name: 'financing',
      title: 'Financing Configuration',
      type: 'object',
      fields: [
        { name: 'defaultRate', title: 'Default Rate %', type: 'number' },
        { name: 'defaultTerm', title: 'Default Term (months)', type: 'number' },
        { name: 'creditTiers', title: 'Credit Tiers', type: 'array', of: [{
          type: 'object',
          fields: [
            { name: 'name', title: 'Tier Name', type: 'string' },
            { name: 'minScore', title: 'Min Score', type: 'number' },
            { name: 'maxScore', title: 'Max Score', type: 'number' },
            { name: 'rate', title: 'Rate %', type: 'number' },
          ],
        }]},
      ],
    }),
  ],
  preview: { prepare() { return { title: 'AI Settings' } } },
})

// ============================================
// LANDING PAGE (Generic)
// ============================================
export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landing Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Page Title', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'pageType', title: 'Page Type', type: 'string', options: { list: ['financing', 'sell-your-car', 'service', 'about', 'contact', 'custom'] } }),
    defineField({
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'subheadline', title: 'Subheadline', type: 'text' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image' },
        { name: 'primaryCta', title: 'Primary CTA', type: 'object', fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'url', title: 'URL', type: 'string' },
        ]},
      ],
    }),
    defineField({ name: 'sections', title: 'Content Sections', type: 'array', of: [
      { type: 'object', name: 'textSection', title: 'Text Section', fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'content', title: 'Content', type: 'array', of: [{ type: 'block' }] },
      ]},
      { type: 'object', name: 'benefitsSection', title: 'Benefits Section', fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'benefits', title: 'Benefits', type: 'array', of: [{ type: 'benefitItem' }] },
      ]},
    ]}),
    defineField({ name: 'seo', title: 'SEO Settings', type: 'object', fields: seoFields }),
  ],
  preview: { select: { title: 'title', subtitle: 'pageType' } },
})

// ============================================
// EXPORT ALL SCHEMAS
// ============================================
export const pageSchemas = [
  // Object types
  trustBadge,
  benefitItem,
  processStep,
  testimonialItem,
  comparisonRow,
  faqItemObject,
  ctaButton,
  
  // Document types - Pages
  homepage,
  financingPage,
  sellYourCarPage,
  tradeInPage,
  contactPage,
  aboutPage,
  blogIndexPage,
  inventoryPage,
  servicesPage,
  warrantyPage,
  faqPage,
  landingPage,
  
  // Settings
  vdpSettings,
  aiSettings,
  
  // Legacy
  sellPage,
  faqItemDoc,
]
