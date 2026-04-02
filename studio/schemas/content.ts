import { defineType, defineField } from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'alt', type: 'string', title: 'Alt Text' },
            { name: 'caption', type: 'string', title: 'Caption' },
          ],
        },
      ],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Buying Guide', value: 'buying-guide' },
          { title: 'Maintenance Tips', value: 'maintenance' },
          { title: 'News', value: 'news' },
          { title: 'EV Info', value: 'ev' },
          { title: 'Financing', value: 'financing' },
        ],
      },
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishedAt',
      media: 'coverImage',
    },
    prepare({ title, date, media }) {
      return {
        title,
        subtitle: date ? new Date(date).toLocaleDateString() : 'Draft',
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Published Date (Newest)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
    }),
    defineField({
      name: 'review',
      title: 'Review',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'vehiclePurchased',
      title: 'Vehicle Purchased',
      type: 'string',
    }),
    defineField({
      name: 'customerPhoto',
      title: 'Customer Photo',
      type: 'image',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date',
      type: 'datetime',
    }),
    defineField({
      name: 'source',
      title: 'Source',
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
  ],
  preview: {
    select: {
      title: 'customerName',
      rating: 'rating',
      featured: 'featured',
    },
    prepare({ title, rating, featured }) {
      return {
        title: `${title}${featured ? ' (Featured)' : ''}`,
        subtitle: `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
      }
    },
  },
})

export const faqEntry = defineType({
  name: 'faqEntry',
  title: 'FAQ Entry',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [{ type: 'block' }],
      validation: (Rule) => Rule.required(),
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
          { title: 'Electric Vehicles', value: 'ev' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'question',
      category: 'category',
    },
    prepare({ title, category }) {
      return {
        title,
        subtitle: category,
      }
    },
  },
})

export const protectionPlan = defineType({
  name: 'protectionPlan',
  title: 'Protection Plan',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Plan Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Full Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'price',
      title: 'Starting Price',
      type: 'number',
    }),
    defineField({
      name: 'priceNote',
      title: 'Price Note',
      type: 'string',
      description: 'e.g., "Starting from" or "per month"',
    }),
    defineField({
      name: 'priceType',
      title: 'Price Type',
      type: 'string',
      options: { list: ['one-time', 'monthly', 'per-term'] },
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'coverage',
      title: 'Coverage Details',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'termOptions',
      title: 'Term Options (months)',
      type: 'array',
      of: [{ type: 'number' }],
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'name', price: 'price' },
    prepare({ title, price }) {
      return { title, subtitle: price ? `From $${price}` : '' }
    },
  },
})
