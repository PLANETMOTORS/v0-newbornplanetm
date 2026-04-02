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
