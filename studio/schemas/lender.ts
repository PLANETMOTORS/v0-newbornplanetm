import { defineType, defineField } from 'sanity'

export const lender = defineType({
  name: 'lender',
  title: 'Lender / Financing Partner',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Lender Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'e.g., Chase Auto, Capital One, Ally Bank',
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'interestRate',
      title: 'Promotional Interest Rate (%)',
      type: 'number',
      description: 'Current promotional APR (e.g., 3.9)',
      validation: (Rule) => Rule.min(0).max(30),
    }),
    defineField({
      name: 'standardRate',
      title: 'Standard Interest Rate (%)',
      type: 'number',
      description: 'Non-promotional APR',
      validation: (Rule) => Rule.min(0).max(30),
    }),
    defineField({
      name: 'minCreditScore',
      title: 'Minimum Credit Score',
      type: 'number',
      description: 'Minimum credit score required for this lender',
      validation: (Rule) => Rule.min(300).max(850),
    }),
    defineField({
      name: 'maxLoanTerm',
      title: 'Max Loan Term (months)',
      type: 'number',
      description: 'Maximum financing term in months (e.g., 72, 84)',
      validation: (Rule) => Rule.min(12).max(120),
    }),
    defineField({
      name: 'promoEndDate',
      title: 'Promotion End Date',
      type: 'date',
      description: 'When does this promotional rate expire?',
    }),
    defineField({
      name: 'promoTitle',
      title: 'Promotion Title',
      type: 'string',
      description: 'e.g., "Spring Special", "Year-End Clearance Rate"',
    }),
    defineField({
      name: 'promoDescription',
      title: 'Promotion Description',
      type: 'text',
      rows: 3,
      description: 'Details about the promotional offer',
    }),
    defineField({
      name: 'features',
      title: 'Lender Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'e.g., "No prepayment penalty", "Quick approval"',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      type: 'url',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Is this lender currently accepting applications?',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0,
    }),
  ],
  
  preview: {
    select: {
      name: 'name',
      rate: 'interestRate',
      promo: 'promoTitle',
      media: 'logo',
      active: 'isActive',
    },
    prepare({ name, rate, promo, media, active }) {
      const rateText = rate ? `${rate}% APR` : 'No rate set'
      const statusText = active === false ? ' [INACTIVE]' : ''
      return {
        title: `${name}${statusText}`,
        subtitle: promo ? `${promo} - ${rateText}` : rateText,
        media,
      }
    },
  },
  
  orderings: [
    {
      title: 'Interest Rate (Low to High)',
      name: 'rateAsc',
      by: [{ field: 'interestRate', direction: 'asc' }],
    },
    {
      title: 'Sort Order',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
    {
      title: 'Name (A-Z)',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
})
