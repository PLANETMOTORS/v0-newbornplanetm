import { defineType, defineField } from 'sanity'
import { DocumentTextIcon, UsersIcon, HelpCircleIcon, StarIcon, TagIcon } from '@sanity/icons'

// ============================================
// AUTHOR SCHEMA — E-E-A-T signals for Google
// ============================================
export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      description: 'e.g., Hamza Patel',
      validation: (Rule) => Rule.required().error('Author name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      description: 'Auto-generated from name. Used for /team/[slug] pages.',
      validation: (Rule) => Rule.required().error('Slug is required for author pages'),
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'string',
      description: 'e.g., Finance Manager, Sales Consultant, EV Specialist',
      validation: (Rule) => Rule.required().error('Role is required for E-E-A-T signals'),
    }),
    defineField({
      name: 'photo',
      title: 'Profile Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Headshot photo. Required for Google E-E-A-T author signals.',
      validation: (Rule) => Rule.required().error('Profile photo is required for E-E-A-T signals'),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'e.g., "Hamza Patel, Finance Manager at Planet Motors"',
          validation: (Rule) => Rule.required().error('Alt text is required for accessibility (WCAG 2.1 AA)'),
        }),
      ],
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Author bio shown on blog posts and team page. Include credentials and expertise.',
    }),
    defineField({
      name: 'expertise',
      title: 'Areas of Expertise',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'e.g., EV financing, trade-in valuation, credit repair',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        { name: 'linkedin', title: 'LinkedIn URL', type: 'url' },
        { name: 'twitter', title: 'Twitter/X URL', type: 'url' },
        { name: 'email', title: 'Email', type: 'string' },
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured on About Page',
      type: 'boolean',
      initialValue: false,
      description: 'Show this person on the About Us / Team page',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
      description: 'Lower numbers appear first on the team page',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo' },
    prepare({ title, subtitle, media }) {
      return { title: title || 'Unnamed Author', subtitle: subtitle || 'No role set', media }
    },
  },
})

// ============================================
// BLOG POST SCHEMA
// ============================================
export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'settings', title: 'Settings' },
  ],
  fields: [
    // ── Content tab ──────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'The headline shown on the blog listing and post page.',
      validation: (Rule) => Rule.required().error('Title is required'),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      description: 'Auto-generated from title. Must be unique. e.g., /blog/how-to-finance-a-used-car',
      validation: (Rule) =>
        Rule.required()
          .custom((slug) => {
            if (!slug?.current) return 'Slug is required'
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.current)) {
              return 'Slug must be lowercase letters, numbers, and hyphens only (no spaces or special characters)'
            }
            return true
          })
          .error('A valid URL slug is required'),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      description: 'Required for Google E-E-A-T signals. Select the person who wrote this post.',
      validation: (Rule) => Rule.required().error('Author is required for SEO and E-E-A-T compliance'),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      group: 'content',
      description: 'When this post goes live. Leave blank to keep as draft.',
      // Not required — absence means the post is a draft (filtered out by defined(publishedAt) in GROQ)
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt / Summary',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Short summary shown on blog listing cards and used as meta description fallback. 150–160 characters recommended.',
      validation: (Rule) =>
        Rule.required()
          .max(300)
          .error('Excerpt is required and must be under 300 characters'),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
      description: 'Hero image for the blog post. Recommended: 1200×630px.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the image for screen readers and SEO. e.g., "2024 Tesla Model 3 parked at Planet Motors Richmond Hill"',
          validation: (Rule) => Rule.required().error('Alt text is required for accessibility (WCAG 2.1 AA)'),
        }),
      ],
      validation: (Rule) => Rule.required().error('Cover image is required'),
    }),
    defineField({
      name: 'body',
      title: 'Body Content',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block',
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' },
                  {
                    name: 'blank',
                    type: 'boolean',
                    title: 'Open in new tab',
                    description: 'Enable for external links',
                    initialValue: false,
                  },
                ],
              },
            ],
          },
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Heading 4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
              validation: (Rule) => Rule.required().error('Alt text is required on all images'),
            }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        },
      ],
      description: 'Full article content. Use Heading 2 for main sections, Heading 3 for subsections.',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'content',
      options: {
        layout: 'tags',
        list: [
          { title: 'Car Buying Tips', value: 'Car Buying Tips' },
          { title: 'Financing', value: 'Financing' },
          { title: 'EV & Electric Vehicles', value: 'EV & Electric Vehicles' },
          { title: 'Trade-In', value: 'Trade-In' },
          { title: 'Maintenance', value: 'Maintenance' },
          { title: 'Industry News', value: 'Industry News' },
          { title: 'Planet Motors News', value: 'Planet Motors News' },
        ],
      },
      description: 'Select one or more categories for this post.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'content',
      options: { layout: 'tags' },
      description: 'Optional free-form tags for internal filtering.',
    }),
    defineField({
      name: 'readTime',
      title: 'Read Time',
      type: 'string',
      group: 'content',
      description: 'e.g., "5 min read". Leave blank to auto-calculate.',
      placeholder: '5 min read',
    }),
    // ── SEO tab ──────────────────────────────────────────────────────────────
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      group: 'seo',
      description: 'Overrides the post title in search results. 50–60 characters recommended.',
      validation: (Rule) =>
        Rule.max(60).warning('SEO title should be 60 characters or less to avoid truncation in Google'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 3,
      group: 'seo',
      description: 'Shown in Google search results. 150–160 characters recommended.',
      validation: (Rule) =>
        Rule.max(160).warning('Meta description should be 160 characters or less'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      group: 'seo',
      description: 'Image shown when shared on Facebook, Twitter, LinkedIn. 1200×630px recommended. Defaults to cover image if not set.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule) => Rule.required().error('Alt text required on OG image'),
        }),
      ],
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      group: 'seo',
      description: 'Override the canonical URL if this content is syndicated elsewhere. Leave blank to use the default /blog/[slug] URL.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from Search Engines (noindex)',
      type: 'boolean',
      group: 'seo',
      initialValue: false,
      description: 'Enable to prevent Google from indexing this post. Use for drafts or thin content.',
    }),
    // ── Settings tab ─────────────────────────────────────────────────────────
    defineField({
      name: 'featured',
      title: 'Featured Post',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
      description: 'Pin this post to the top of the blog listing.',
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related Posts',
      type: 'array',
      group: 'settings',
      of: [{ type: 'reference', to: [{ type: 'blogPost' }] }],
      validation: (Rule) => Rule.max(3).unique(),
      description: 'Up to 3 related posts shown at the bottom of this article.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishedAt',
      media: 'coverImage',
      author: 'author.name',
    },
    prepare({ title, date, media, author: authorName }) {
      const isPublished = Boolean(date)
      return {
        title: `${isPublished ? '✅' : '📝'} ${title || 'Untitled'}`,
        subtitle: isPublished
          ? `${new Date(date).toLocaleDateString('en-CA')} · ${authorName || '⚠️ No author'}`
          : '⏳ Draft — set publishedAt to publish',
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Published Date (Newest First)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})

// ============================================
// TESTIMONIAL SCHEMA
// ============================================
export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({ name: 'name', title: 'Customer Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'location', title: 'Location', type: 'string', description: 'e.g., Richmond Hill, ON' }),
    defineField({ name: 'rating', title: 'Rating (1–5)', type: 'number', validation: (Rule) => Rule.required().integer().min(1).max(5) }),
    defineField({ name: 'text', title: 'Review Text', type: 'text', rows: 4, validation: (Rule) => Rule.required() }),
    defineField({ name: 'body', title: 'Review Body (Legacy)', type: 'text', rows: 4, hidden: true }),
    defineField({ name: 'vehiclePurchased', title: 'Vehicle Purchased', type: 'string', description: 'e.g., 2022 Tesla Model 3' }),
    defineField({ name: 'date', title: 'Review Date', type: 'datetime' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
    defineField({
      name: 'source',
      title: 'Review Source',
      type: 'string',
      options: {
        list: [
          { title: 'Google', value: 'google' },
          { title: 'Facebook', value: 'facebook' },
          { title: 'Direct', value: 'direct' },
          { title: 'DealerRater', value: 'dealerrater' },
        ],
      },
    }),
    defineField({
      name: 'customerPhoto',
      title: 'Customer Photo',
      type: 'image',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'e.g., "John D., satisfied Planet Motors customer"',
          validation: (Rule) => Rule.required().error('Alt text required'),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', rating: 'rating', featured: 'featured' },
    prepare({ title, rating, featured }) {
      const stars = rating ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}` : '☆☆☆☆☆'
      return {
        title: `${featured ? '✅' : '📝'} ${title || 'Unnamed'}`,
        subtitle: stars,
      }
    },
  },
})

// ============================================
// FAQ ENTRY SCHEMA
// ============================================
export const faqEntry = defineType({
  name: 'faqEntry',
  title: 'FAQ Entry',
  type: 'document',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required().error('Question is required'),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Rich text answer. Supports bold, italic, and links.',
      validation: (Rule) => Rule.required().error('Answer is required'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'General', value: 'general' },
          { title: 'Financing', value: 'financing' },
          { title: 'Trade-In', value: 'trade-in' },
          { title: 'Delivery', value: 'delivery' },
          { title: 'Warranty', value: 'warranty' },
          { title: 'EV & Electric Vehicles', value: 'ev' },
          { title: 'Inspection', value: 'inspection' },
        ],
      },
    }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
  ],
  preview: {
    select: { title: 'question', category: 'category' },
    prepare({ title, category }) {
      return {
        title: `✅ ${title || 'Untitled'}`,
        subtitle: category || 'General',
      }
    },
  },
})

// ============================================
// PROTECTION PLAN SCHEMA
// ============================================
export const protectionPlan = defineType({
  name: 'protectionPlan',
  title: 'Protection Plan',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({ name: 'title', title: 'Plan Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required().error('Slug is required'),
    }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
    defineField({ name: 'ctaLabel', title: 'CTA Label', type: 'string' }),
    defineField({ name: 'ctaUrl', title: 'CTA URL', type: 'string' }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'icon', title: 'Icon', type: 'string' },
          { name: 'label', title: 'Label', type: 'string' },
        ],
      }],
    }),
    defineField({ name: 'name', title: 'Plan Name (Legacy)', type: 'string', hidden: true }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    defineField({ name: 'price', title: 'Starting Price ($)', type: 'number' }),
    defineField({ name: 'priceNote', title: 'Price Note', type: 'string' }),
    defineField({ name: 'features', title: 'Features', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'coverage', title: 'Coverage Details', type: 'text', rows: 4 }),
    defineField({
      name: 'icon',
      title: 'Plan Icon',
      type: 'image',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule) => Rule.required().error('Alt text required'),
        }),
      ],
    }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'title', tagline: 'tagline', active: 'active' },
    prepare({ title, tagline, active }) {
      return {
        title: `${active ? '✅' : '📝'} ${title || 'Untitled'}`,
        subtitle: tagline || '⏳ No tagline set',
      }
    },
  },
})
