import { defineType, defineField } from 'sanity'

// Author schema — E-E-A-T signals for blog posts and team bios
// Team: Hamza Patel (Finance), Toni Sultzberg (Dev), Tony Bekheet (Owner)
export const author = defineType({
  name: 'author',
  title: 'Author / Team Member',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Full Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'role', title: 'Role / Title', type: 'string', description: 'e.g., Finance Manager, Lead Developer, Owner' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text', rows: 4, description: 'Short biography for E-E-A-T signals' }),
    defineField({ name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        { name: 'linkedin', title: 'LinkedIn URL', type: 'url' },
        { name: 'twitter', title: 'Twitter/X URL', type: 'url' },
      ],
    }),
    defineField({ name: 'featured', title: 'Featured on About Page', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
  ],
  preview: {
    select: { title: 'name', role: 'role', media: 'photo' },
    prepare({ title, role, media }) {
      return {
        title: `✅ ${title || 'Unnamed'}`,
        subtitle: role || 'No role set',
        media,
      }
    },
  },
})

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
    defineField({ name: 'categories', title: 'Categories', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text' }),
  ],
  preview: {
    select: { title: 'title', date: 'publishedAt', media: 'coverImage' },
    prepare(selection) {
      const { title, date, media } = selection
      const isPublished = Boolean(date)
      return {
        title: `${isPublished ? '✅' : '📝'} ${title || 'Untitled'}`,
        subtitle: isPublished ? `Published ${new Date(date).toLocaleDateString()}` : '⏳ Draft — no publishedAt',
        media,
      }
    },
  },
})

// Testimonial - EXACT match to database structure
export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Customer Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({ name: 'rating', title: 'Rating', type: 'number', validation: (Rule) => Rule.min(1).max(5) }),
    defineField({ name: 'text', title: 'Review Text', type: 'text', rows: 4 }),
    defineField({ name: 'body', title: 'Review Body', type: 'text', rows: 4 }),
    defineField({ name: 'vehiclePurchased', title: 'Vehicle Purchased', type: 'string' }),
    defineField({ name: 'date', title: 'Date', type: 'datetime' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
    defineField({ name: 'source', title: 'Source', type: 'string', options: {
      list: [
        { title: 'Google', value: 'google' },
        { title: 'Facebook', value: 'facebook' },
        { title: 'Direct', value: 'direct' },
        { title: 'DealerRater', value: 'dealerrater' },
      ],
    }}),
    defineField({ name: 'customerPhoto', title: 'Customer Photo', type: 'image' }),
  ],
  preview: {
    select: { title: 'name', rating: 'rating', featured: 'featured' },
    prepare(selection) {
      const { title, rating, featured } = selection
      const stars = rating ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}` : '☆☆☆☆☆'
      return {
        title: `${featured ? '✅' : '📝'} ${title || 'Unnamed'}`,
        subtitle: stars,
      }
    },
  },
})

export const faqEntry = defineType({
  name: 'faqEntry',
  title: 'FAQ Entry',
  type: 'document',
  fields: [
    defineField({ name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'answer', title: 'Answer', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'category', title: 'Category', type: 'string', options: {
      list: [
        { title: 'General', value: 'general' },
        { title: 'Financing', value: 'financing' },
        { title: 'Trade-In', value: 'trade-in' },
        { title: 'Delivery', value: 'delivery' },
        { title: 'Warranty', value: 'warranty' },
      ],
    }}),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
  ],
  preview: {
    select: { title: 'question', category: 'category' },
    prepare(selection) {
      const { title, category } = selection
      return {
        title: `✅ ${title || 'Untitled'}`,
        subtitle: category || 'General',
      }
    },
  },
})

// Protection Plan - EXACT match to database structure
export const protectionPlan = defineType({
  name: 'protectionPlan',
  title: 'Protection Plan',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
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
    defineField({ name: 'price', title: 'Starting Price', type: 'number' }),
    defineField({ name: 'priceNote', title: 'Price Note', type: 'string' }),
    defineField({ name: 'features', title: 'Features', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'coverage', title: 'Coverage Details', type: 'text', rows: 4 }),
    defineField({ name: 'icon', title: 'Icon', type: 'image' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'title', tagline: 'tagline', active: 'active' },
    prepare(selection) {
      const { title, tagline, active } = selection
      return {
        title: `${active ? '✅' : '📝'} ${title || 'Untitled'}`,
        subtitle: tagline || '⏳ No tagline set',
      }
    },
  },
})
