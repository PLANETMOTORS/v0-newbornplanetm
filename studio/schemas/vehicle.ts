import { defineType, defineField } from 'sanity'

export const vehicle = defineType({
  name: 'vehicle',
  title: 'Vehicle',
  type: 'document',
  fields: [
    // Basic Info
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(1900).max(2030),
    }),
    defineField({
      name: 'make',
      title: 'Make',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'model',
      title: 'Model',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'trim',
      title: 'Trim',
      type: 'string',
    }),
    defineField({
      name: 'vin',
      title: 'VIN',
      type: 'string',
      validation: (Rule) => Rule.required().length(17),
    }),
    defineField({
      name: 'stockNumber',
      title: 'Stock Number',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    
    // Pricing
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'msrp',
      title: 'MSRP',
      type: 'number',
    }),
    defineField({
      name: 'specialPrice',
      title: 'Special Price',
      type: 'number',
      description: 'Sale or promotional price',
    }),
    defineField({
      name: 'specialFinance',
      title: 'Special Financing Deal',
      type: 'reference',
      to: [{ type: 'lender' }],
      description: 'Select a lender if this vehicle qualifies for a promotional rate',
    }),
    
    // Status & Condition
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Pending', value: 'pending' },
          { title: 'Sold', value: 'sold' },
          { title: 'Coming Soon', value: 'coming_soon' },
        ],
      },
      initialValue: 'available',
    }),
    defineField({
      name: 'condition',
      title: 'Condition',
      type: 'string',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Used', value: 'used' },
          { title: 'Certified Pre-Owned', value: 'certified' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Show on homepage and featured sections',
    }),
    
    // Vehicle Details
    defineField({
      name: 'mileage',
      title: 'Mileage (km)',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'exteriorColor',
      title: 'Exterior Color',
      type: 'string',
    }),
    defineField({
      name: 'interiorColor',
      title: 'Interior Color',
      type: 'string',
    }),
    defineField({
      name: 'bodyStyle',
      title: 'Body Style',
      type: 'string',
      options: {
        list: [
          { title: 'Sedan', value: 'sedan' },
          { title: 'SUV', value: 'suv' },
          { title: 'Truck', value: 'truck' },
          { title: 'Coupe', value: 'coupe' },
          { title: 'Hatchback', value: 'hatchback' },
          { title: 'Wagon', value: 'wagon' },
          { title: 'Van', value: 'van' },
          { title: 'Convertible', value: 'convertible' },
        ],
      },
    }),
    defineField({
      name: 'fuelType',
      title: 'Fuel Type',
      type: 'string',
      options: {
        list: [
          { title: 'Gasoline', value: 'gasoline' },
          { title: 'Diesel', value: 'diesel' },
          { title: 'Electric', value: 'electric' },
          { title: 'Hybrid', value: 'hybrid' },
          { title: 'Plug-in Hybrid', value: 'phev' },
        ],
      },
    }),
    defineField({
      name: 'transmission',
      title: 'Transmission',
      type: 'string',
      options: {
        list: [
          { title: 'Automatic', value: 'automatic' },
          { title: 'Manual', value: 'manual' },
          { title: 'CVT', value: 'cvt' },
        ],
      },
    }),
    defineField({
      name: 'drivetrain',
      title: 'Drivetrain',
      type: 'string',
      options: {
        list: [
          { title: 'FWD', value: 'fwd' },
          { title: 'RWD', value: 'rwd' },
          { title: 'AWD', value: 'awd' },
          { title: '4WD', value: '4wd' },
        ],
      },
    }),
    defineField({
      name: 'engine',
      title: 'Engine',
      type: 'string',
      description: 'e.g., 2.0L 4-Cylinder Turbo',
    }),
    defineField({
      name: 'horsepower',
      title: 'Horsepower',
      type: 'number',
    }),
    defineField({
      name: 'doors',
      title: 'Doors',
      type: 'number',
    }),
    defineField({
      name: 'seats',
      title: 'Seats',
      type: 'number',
    }),
    
    // EV Specific
    defineField({
      name: 'evRange',
      title: 'EV Range (km)',
      type: 'number',
      description: 'For electric/hybrid vehicles',
    }),
    defineField({
      name: 'batteryCapacity',
      title: 'Battery Capacity (kWh)',
      type: 'number',
    }),
    
    // Features
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'safetyFeatures',
      title: 'Safety Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    
    // Images
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    
    // Description
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Key selling points',
    }),
    
    // History
    defineField({
      name: 'carfaxUrl',
      title: 'CARFAX Report URL',
      type: 'url',
    }),
    defineField({
      name: 'previousOwners',
      title: 'Previous Owners',
      type: 'number',
    }),
    defineField({
      name: 'accidentFree',
      title: 'Accident Free',
      type: 'boolean',
    }),
    defineField({
      name: 'serviceHistory',
      title: 'Service History',
      type: 'boolean',
    }),
    
    // SEO
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: (doc) => `${doc.year}-${doc.make}-${doc.model}-${doc.stockNumber}`,
        maxLength: 96,
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
      year: 'year',
      make: 'make',
      model: 'model',
      trim: 'trim',
      price: 'price',
      status: 'status',
      media: 'mainImage',
    },
    prepare({ year, make, model, trim, price, status, media }) {
      const statusEmoji = status === 'available' ? '' : status === 'pending' ? ' [PENDING]' : ' [SOLD]'
      return {
        title: `${year} ${make} ${model}${trim ? ` ${trim}` : ''}${statusEmoji}`,
        subtitle: price ? `$${price.toLocaleString()}` : 'No price',
        media,
      }
    },
  },
  
  orderings: [
    {
      title: 'Price (High to Low)',
      name: 'priceDesc',
      by: [{ field: 'price', direction: 'desc' }],
    },
    {
      title: 'Price (Low to High)',
      name: 'priceAsc',
      by: [{ field: 'price', direction: 'asc' }],
    },
    {
      title: 'Year (Newest First)',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }],
    },
    {
      title: 'Recently Added',
      name: 'createdAtDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
})
