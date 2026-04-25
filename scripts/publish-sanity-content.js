const { createClient } = require('@sanity/client')

// Planet Motors CMS - Publish all draft content using Sanity Actions API
const client = createClient({
  projectId: '4588vjsz',
  dataset: 'planetmotors_cms',
  apiVersion: '2025-02-19', // Required for Actions API
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const { randomBytes } = require('crypto')

function generateKey() {
  // Use crypto.randomBytes for a cryptographically random key (not Math.random)
  return randomBytes(6).toString('hex') // 12 hex chars, same length as before
}

// Document definitions
const documents = {
  homepage: {
    _type: 'homepage',
    title: 'Homepage',
    headline: 'The Smarter Way to Buy Your Next Car',
    subheadline: "Ontario's trusted destination for premium pre-owned vehicles",
    primaryCta: { label: 'Browse Inventory', url: '/inventory' },
    secondaryCta: { label: 'Trade-In', url: '/trade-in' },
    trustBadges: [
      { _key: generateKey(), _type: 'trustBadge', label: 'Vehicles Sold', value: '2,500+' },
      { _key: generateKey(), _type: 'trustBadge', label: 'Customer Rating', value: '4.9/5' },
      { _key: generateKey(), _type: 'trustBadge', label: 'Approval Rate', value: '98%' },
      { _key: generateKey(), _type: 'trustBadge', label: 'Years in Business', value: '15+' }
    ],
    showPromoBanner: true,
    promoBannerHeadline: 'Spring Sale Event',
    promoBannerBodyText: 'Get up to $2,000 off select vehicles this month',
    promoBannerCtaLabel: 'View Deals',
    promoBannerCtaUrl: '/inventory?promo=spring-sale',
    promoBannerBackgroundColor: '#1a1a2e'
  },
  
  financingPage: {
    _type: 'financingPage',
    title: 'Financing Page',
    headline: 'Flexible Auto Financing',
    subheadline: 'Get approved in minutes with rates as low as 6.29% APR',
    featuredRateText: '6.29%',
    rateSubtext: 'Starting APR',
    primaryCtaLabel: 'Apply Now',
    primaryCtaUrl: '/financing/apply',
    secondaryCtaLabel: 'Calculate Payments',
    secondaryCtaUrl: '#calculator',
    heroStats: [
      { _key: generateKey(), label: 'Approval Rate', value: '98%' },
      { _key: generateKey(), label: 'Average Savings', value: '$2,500' },
      { _key: generateKey(), label: 'Partner Lenders', value: '15+' }
    ],
    lendersSectionTitle: 'Our Trusted Lending Partners',
    lendersSectionSubtitle: "We work with Canada's top financial institutions",
    processSteps: [
      { _key: generateKey(), stepNumber: 1, title: 'Apply Online', description: 'Fill out our simple application in just 2 minutes' },
      { _key: generateKey(), stepNumber: 2, title: 'Get Approved', description: 'Receive your approval decision within hours' },
      { _key: generateKey(), stepNumber: 3, title: 'Choose Your Vehicle', description: 'Browse our inventory and find your perfect match' },
      { _key: generateKey(), stepNumber: 4, title: 'Drive Home Happy', description: 'Complete the paperwork and drive away same day' }
    ],
    benefits: [
      { _key: generateKey(), title: 'No Hidden Fees', description: 'Transparent pricing with no surprises' },
      { _key: generateKey(), title: 'All Credit Welcome', description: 'Good credit, bad credit, or no credit - we can help' },
      { _key: generateKey(), title: 'Fast Approval', description: 'Most applications approved within 24 hours' },
      { _key: generateKey(), title: 'Flexible Terms', description: 'Choose payment terms that fit your budget' }
    ],
    metaTitle: 'Auto Financing | Planet Motors',
    metaDescription: 'Get approved for auto financing with rates as low as 6.29% APR.'
  },

  sellYourCarPage: {
    _type: 'sellYourCarPage',
    title: 'Sell Your Car Page',
    headline: 'Sell Your Car for Top Dollar',
    subheadline: 'Get a competitive offer in minutes, not days',
    primaryCtaLabel: 'Get Your Offer',
    primaryCtaUrl: '/sell/appraisal',
    secondaryCtaLabel: 'How It Works',
    secondaryCtaUrl: '#process',
    processSteps: [
      { _key: generateKey(), stepNumber: 1, title: 'Get Your Quote', description: 'Enter your vehicle details for an instant estimate' },
      { _key: generateKey(), stepNumber: 2, title: 'Schedule Inspection', description: 'Book a free vehicle inspection at our location' },
      { _key: generateKey(), stepNumber: 3, title: 'Get Paid', description: 'Accept our offer and get paid same day' }
    ],
    benefits: [
      { _key: generateKey(), title: 'No Obligation', description: 'Get a quote with no commitment required' },
      { _key: generateKey(), title: 'Same Day Payment', description: 'Accept our offer and get paid immediately' },
      { _key: generateKey(), title: 'Free Inspection', description: 'No cost vehicle appraisal at our location' }
    ]
  },

  inventorySettings: {
    _type: 'inventorySettings',
    title: 'Inventory Settings',
    pageTitle: 'Browse Our Premium Inventory',
    pageSubtitle: 'Explore our selection of quality pre-owned vehicles',
    defaultView: 'grid',
    itemsPerPage: 12,
    showFiltersSidebar: true
  }
}

async function publishDocuments() {
  console.log('Starting Sanity content migration with Actions API...\n')

  for (const [docId, doc] of Object.entries(documents)) {
    const publishedId = docId
    const draftId = `drafts.${docId}`

    try {
      // Step 1: Delete any existing documents
      try {
        await client.delete(publishedId)
        console.log(`  Deleted existing published: ${publishedId}`)
      } catch (_e) { /* Ignore if doesn't exist */ }
      
      try {
        await client.delete(draftId)
        console.log(`  Deleted existing draft: ${draftId}`)
      } catch (_e) { /* Ignore if doesn't exist */ }

      // Step 2: Create draft document
      const draftDoc = {
        ...doc,
        _id: draftId,
      }
      await client.create(draftDoc)
      console.log(`  Created draft: ${draftId}`)

      // Step 3: Publish the draft using Actions API
      await client.action({
        actionType: 'sanity.action.document.publish',
        publishedId: publishedId,
        draftId: draftId,
      })
      console.log(`  Published: ${publishedId}`)
      console.log(`[OK] ${doc.title || docId}\n`)

    } catch (error) {
      console.error(`[ERROR] ${docId}:`, error.message, '\n')
    }
  }

  console.log('Migration complete!')
}

publishDocuments().catch(console.error)
