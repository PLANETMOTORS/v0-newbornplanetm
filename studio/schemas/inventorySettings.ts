import { defineType, defineField } from 'sanity'

export const inventorySettings = defineType({
  name: 'inventorySettings',
  title: 'Inventory Settings',
  type: 'document',
  fields: [
    // Page Title - fixes "title" unknown field error
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'The main heading for your inventory page.',
      initialValue: 'Our Inventory',
    }),
    
    // Show Filters Sidebar - fixes "showFiltersSidebar" unknown field error
    defineField({
      name: 'showFiltersSidebar',
      title: 'Show Filters Sidebar',
      type: 'boolean',
      description: 'Toggle to show or hide the sidebar filters on the frontend.',
      initialValue: true,
    }),
    
    // Items Per Page
    defineField({
      name: 'itemsPerPage',
      title: 'Items Per Page',
      type: 'number',
      description: 'Number of vehicles to display per page.',
      initialValue: 12,
      validation: (Rule) => Rule.min(6).max(48),
    }),
    
    // Default Sort Order
    defineField({
      name: 'defaultSortOrder',
      title: 'Default Sort Order',
      type: 'string',
      options: {
        list: [
          { title: 'Newest First', value: 'newest' },
          { title: 'Price: Low to High', value: 'price_asc' },
          { title: 'Price: High to Low', value: 'price_desc' },
          { title: 'Mileage: Low to High', value: 'mileage_asc' },
          { title: 'Year: Newest First', value: 'year_desc' },
        ],
      },
      initialValue: 'newest',
    }),
    
    // Show Comparison Tool
    defineField({
      name: 'showComparisonTool',
      title: 'Show Comparison Tool',
      type: 'boolean',
      description: 'Allow users to compare multiple vehicles.',
      initialValue: true,
    }),
    
    // Show Quick View
    defineField({
      name: 'showQuickView',
      title: 'Show Quick View',
      type: 'boolean',
      description: 'Enable quick view modal for vehicle details.',
      initialValue: true,
    }),
    
    // Filter Options
    defineField({
      name: 'filterOptions',
      title: 'Available Filters',
      type: 'object',
      fields: [
        { name: 'showMakeFilter', title: 'Show Make Filter', type: 'boolean', initialValue: true },
        { name: 'showModelFilter', title: 'Show Model Filter', type: 'boolean', initialValue: true },
        { name: 'showYearFilter', title: 'Show Year Filter', type: 'boolean', initialValue: true },
        { name: 'showPriceFilter', title: 'Show Price Filter', type: 'boolean', initialValue: true },
        { name: 'showMileageFilter', title: 'Show Mileage Filter', type: 'boolean', initialValue: true },
        { name: 'showBodyTypeFilter', title: 'Show Body Type Filter', type: 'boolean', initialValue: true },
        { name: 'showFuelTypeFilter', title: 'Show Fuel Type Filter', type: 'boolean', initialValue: true },
        { name: 'showTransmissionFilter', title: 'Show Transmission Filter', type: 'boolean', initialValue: true },
        { name: 'showDrivetrainFilter', title: 'Show Drivetrain Filter', type: 'boolean', initialValue: true },
        { name: 'showColorFilter', title: 'Show Color Filter', type: 'boolean', initialValue: false },
      ],
    }),
    
    // Price Display
    defineField({
      name: 'priceDisplay',
      title: 'Price Display Settings',
      type: 'object',
      fields: [
        { name: 'showBiWeeklyPayment', title: 'Show Bi-Weekly Payment', type: 'boolean', initialValue: true },
        { name: 'showMonthlyPayment', title: 'Show Monthly Payment', type: 'boolean', initialValue: true },
        { name: 'defaultPaymentTerm', title: 'Default Payment Term (months)', type: 'number', initialValue: 72 },
        { name: 'defaultInterestRate', title: 'Default Interest Rate (%)', type: 'number', initialValue: 6.99 },
      ],
    }),
    
    // Payment Calculator Settings
    defineField({
      name: 'taxRate',
      title: 'Sales Tax Rate (%)',
      type: 'number',
      description: 'State/local sales tax rate applied to vehicle purchases.',
      initialValue: 8.25,
      validation: (Rule) => Rule.min(0).max(15),
    }),
    defineField({
      name: 'defaultDownPayment',
      title: 'Default Down Payment ($)',
      type: 'number',
      description: 'Suggested down payment amount for payment calculations.',
      initialValue: 2000,
    }),
    defineField({
      name: 'averageTradeInValue',
      title: 'Average Trade-In Value ($)',
      type: 'number',
      description: 'Estimated trade-in amount applied to monthly payment calculations.',
      initialValue: 1500,
    }),
    defineField({
      name: 'defaultTerm',
      title: 'Default Loan Term (months)',
      type: 'number',
      description: 'Default loan term for payment calculations.',
      options: {
        list: [
          { title: '36 months', value: 36 },
          { title: '48 months', value: 48 },
          { title: '60 months', value: 60 },
          { title: '72 months', value: 72 },
          { title: '84 months', value: 84 },
        ],
      },
      initialValue: 60,
    }),
    
    // Credit Score Tiers for Dynamic Interest Rates
    defineField({
      name: 'creditTiers',
      title: 'Credit Score Interest Rate Tiers',
      type: 'array',
      description: 'Define interest rates based on credit score ranges.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'tierName', title: 'Tier Name', type: 'string' },
            { name: 'minScore', title: 'Minimum Credit Score', type: 'number' },
            { name: 'maxScore', title: 'Maximum Credit Score', type: 'number' },
            { name: 'interestRate', title: 'Interest Rate (%)', type: 'number' },
          ],
          preview: {
            select: { tierName: 'tierName', rate: 'interestRate', min: 'minScore', max: 'maxScore' },
            prepare({ tierName, rate, min, max }) {
              return { title: `${tierName}: ${rate}%`, subtitle: `Score ${min}-${max}` }
            },
          },
        },
      ],
      initialValue: [
        { tierName: 'Excellent', minScore: 750, maxScore: 850, interestRate: 3.99 },
        { tierName: 'Good', minScore: 700, maxScore: 749, interestRate: 5.99 },
        { tierName: 'Fair', minScore: 650, maxScore: 699, interestRate: 8.99 },
        { tierName: 'Needs Work', minScore: 550, maxScore: 649, interestRate: 14.99 },
      ],
    }),
    
    // No Results Message
    defineField({
      name: 'noResultsMessage',
      title: 'No Results Message',
      type: 'text',
      rows: 2,
      description: 'Message to display when no vehicles match the filters.',
      initialValue: 'No vehicles found matching your criteria. Try adjusting your filters.',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Inventory Settings',
      }
    },
  },
})
