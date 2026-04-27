import { createClient } from "@sanity/client"

const client = createClient({
  projectId: 'wlxj8olw',
  dataset: 'planetmotors_cms',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

async function fixHomepageSchema() {
  console.log('Fixing homepage schema to match Studio structure...')
  
  // The Studio expects flat fields, not nested heroSection object
  // Update the homepage document to use the correct field structure
  const homepageData = {
    _id: 'homepage',
    _type: 'homepage',
    title: 'Homepage',
    
    // Hero Section - flat structure matching Studio schema
    headline: 'The Smarter Way to Buy or Sell Your Car',
    subheadline: "Ontario's trusted destination for premium pre-owned vehicles. 210-point inspection, 10-day money-back guarantee, and the best multi-lender financing rates.",
    
    // Primary CTA
    primaryCta: {
      _type: 'object',
      buttonLabel: 'Browse Inventory',
      url: '/inventory'
    },
    
    // Secondary CTA
    secondaryCta: {
      _type: 'object',
      buttonLabel: 'Trade-In',
      url: '/trade-in'
    },
    
    // Trust Badges
    trustBadges: [
      { _type: 'object', _key: 'tb1', label: 'Vehicles Sold', value: '2,500+' },
      { _type: 'object', _key: 'tb2', label: 'Customer Rating', value: '4.9/5' },
      { _type: 'object', _key: 'tb3', label: 'Approval Rate', value: '98%' },
      { _type: 'object', _key: 'tb4', label: '210-Point Inspection', value: 'Certified' }
    ],
    
    // Promo Banner
    showBanner: true,
    promoBannerHeadline: '124 new arrivals',
    promoBannerBodyText: 'Updated 2 min ago',
    promoBannerCtaLabel: 'View All',
    promoBannerCtaUrl: '/inventory',
    promoBannerBackgroundColor: '#f97316'
  }

  try {
    const result = await client.createOrReplace(homepageData)
    console.log('Homepage updated with correct schema:', result._id)
  } catch (error) {
    console.error('Error updating homepage:', error.message)
  }

  // Also fix the Financing page
  const financingData = {
    _id: 'financingPage',
    _type: 'financingPage',
    title: 'Financing',
    
    // Hero Section - flat structure
    headline: 'Auto Financing Made Simple',
    subheadline: 'Get pre-approved in minutes with competitive rates from multiple lenders.',
    featuredRateText: '6.29%',
    rateSubtext: 'as low as',
    
    // Primary CTA
    primaryCta: {
      _type: 'object',
      buttonLabel: 'Get Pre-Approved',
      url: '/financing/apply'
    },
    
    // Secondary CTA
    secondaryCta: {
      _type: 'object',
      buttonLabel: 'Calculate Payment',
      url: '/financing#calculator'
    },
    
    // Hero Stats
    heroStats: [
      { _type: 'object', _key: 'hs1', label: 'Approval Rate', value: '98%' },
      { _type: 'object', _key: 'hs2', label: 'Partner Lenders', value: '15+' },
      { _type: 'object', _key: 'hs3', label: 'Avg. Savings', value: '$2,400' }
    ]
  }

  try {
    const result = await client.createOrReplace(financingData)
    console.log('Financing page updated with correct schema:', result._id)
  } catch (error) {
    console.error('Error updating financing page:', error.message)
  }

  // Fix Sell Your Car page
  const sellCarData = {
    _id: 'sellYourCarPage',
    _type: 'sellYourCarPage',
    title: 'Sell Your Car',
    
    // Hero Section - flat structure
    headline: 'Sell Your Car the Smart Way',
    subheadline: 'Get a competitive offer in minutes. No haggling, no hassle.',
    
    // Primary CTA
    primaryCta: {
      _type: 'object',
      buttonLabel: 'Get Your Offer',
      url: '/sell-your-car/get-offer'
    },
    
    // Secondary CTA
    secondaryCta: {
      _type: 'object',
      buttonLabel: 'How It Works',
      url: '/sell-your-car#process'
    }
  }

  try {
    const result = await client.createOrReplace(sellCarData)
    console.log('Sell Your Car page updated with correct schema:', result._id)
  } catch (error) {
    console.error('Error updating sell your car page:', error.message)
  }

  console.log('Schema fix complete!')
}

fixHomepageSchema()
