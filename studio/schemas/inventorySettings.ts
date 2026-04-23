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
    
    // Credit Score Tiers for Dynamic Interest Rates (Professional Format)
    defineField({
      name: 'creditTiers',
      title: 'Credit Score Tiers',
      type: 'array',
      description: 'Define APR rates based on credit score. Update these when bank rates change - all vehicle payments update automatically.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Tier Label (e.g. Excellent)', type: 'string' },
            { name: 'minScore', title: 'Min Credit Score', type: 'number' },
            { name: 'apr', title: 'APR (%)', type: 'number', description: 'Annual Percentage Rate' },
          ],
          preview: {
            select: { label: 'label', apr: 'apr', minScore: 'minScore' },
            prepare({ label, apr, minScore }) {
              return { title: `${label}: ${apr}% APR`, subtitle: `Min Score: ${minScore}` }
            },
          },
        },
      ],
      initialValue: [
        { label: 'Excellent', minScore: 740, apr: 4.99 },
        { label: 'Good', minScore: 670, apr: 6.99 },
        { label: 'Fair', minScore: 580, apr: 12.99 },
        { label: 'Subprime', minScore: 500, apr: 18.99 },
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
