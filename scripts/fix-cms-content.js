import { createClient } from "@sanity/client"
import { randomUUID } from "crypto"

const client = createClient({
  projectId: '4588vjsz',
  dataset: 'planetmotors_cms',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

// Generate a Sanity-style key
function generateKey() {
  return randomUUID().replace(/-/g, '').slice(0, 12)
}

async function fixCmsContent() {
  console.log('Fixing CMS content to match deployed Studio schema...')
  
  // First, delete any existing homepage documents to start fresh
  try {
    await client.delete({ query: '*[_type == "homepage"]' })
    console.log('Deleted old homepage documents')
  } catch (e) {
    console.log('No existing homepage to delete')
  }

  // Create homepage with the exact structure shown in the Studio
  const homepageData = {
    _id: 'homepage',
    _type: 'homepage',
    
    // Hero Section - flat fields as shown in Studio
    headline: 'The Smarter Way to Buy or Sell Your Car',
    subheadline: "Ontario's trusted destination for premium pre-owned vehicles. 210-point inspection, 10-day money-back guarantee, and the best multi-lender financing rates.",
    
    // Primary CTA - as nested object with buttonLabel and url
    primaryCta: {
      buttonLabel: 'Browse Inventory',
      url: '/inventory'
    },
    
    // Secondary CTA
    secondaryCta: {
      buttonLabel: 'Trade-In',
      url: '/trade-in'
    },
    
    // Trust Badges - array with proper _key for each item
    trustBadges: [
      { _key: generateKey(), label: 'Vehicles Sold', value: '2,500+' },
      { _key: generateKey(), label: 'Customer Rating', value: '4.9/5' },
      { _key: generateKey(), label: 'Approval Rate', value: '98%' },
      { _key: generateKey(), label: '210-Point Inspection', value: 'Certified' }
    ],
    
    // Promo Banner
    showBanner: true,
    promoBannerHeadline: '124 new arrivals',
    promoBannerBodyText: 'Updated 2 min ago',
    promoBannerCtaLabel: 'View All',
    promoBannerCtaUrl: '/inventory',
    promoBannerBackgroundColor: '#f97316',
    
    // Testimonials - references to testimonial documents
    testimonials: [],
    
    // FAQ Highlights - references to faqEntry documents  
    faqHighlights: []
  }

  try {
    const result = await client.createOrReplace(homepageData)
    console.log('Homepage created successfully:', result._id)
  } catch (error) {
    console.error('Error creating homepage:', error.message)
    console.error('Full error:', JSON.stringify(error, null, 2))
  }

  // Fix Financing page
  try {
    await client.delete({ query: '*[_type == "financingPage"]' })
    console.log('Deleted old financing page')
  } catch (e) {
    console.log('No existing financing page to delete')
  }

  const financingData = {
    _id: 'financingPage',
    _type: 'financingPage',
    
    headline: 'Auto Financing Made Simple',
    subheadline: 'Get pre-approved in minutes with competitive rates from multiple lenders.',
    featuredRateText: '4.99%',
    rateSubtext: 'as low as',
    
    primaryCta: {
      buttonLabel: 'Get Pre-Approved',
      url: '/financing/apply'
    },
    
    secondaryCta: {
      buttonLabel: 'Calculate Payment',
      url: '/financing#calculator'
    },
    
    heroStats: [
      { _key: generateKey(), label: 'Approval Rate', value: '98%' },
      { _key: generateKey(), label: 'Partner Lenders', value: '15+' },
      { _key: generateKey(), label: 'Avg. Savings', value: '$2,400' }
    ]
  }

  try {
    const result = await client.createOrReplace(financingData)
    console.log('Financing page created successfully:', result._id)
  } catch (error) {
    console.error('Error creating financing page:', error.message)
  }

  // Fix Sell Your Car page
  try {
    await client.delete({ query: '*[_type == "sellYourCarPage"]' })
    console.log('Deleted old sell your car page')
  } catch (e) {
    console.log('No existing sell your car page to delete')
  }

  const sellCarData = {
    _id: 'sellYourCarPage',
    _type: 'sellYourCarPage',
    
    headline: 'Sell Your Car the Smart Way',
    subheadline: 'Get a competitive offer in minutes. No haggling, no hassle.',
    
    primaryCta: {
      buttonLabel: 'Get Your Offer',
      url: '/sell-your-car/get-offer'
    },
    
    secondaryCta: {
      buttonLabel: 'How It Works',
      url: '/sell-your-car#process'
    }
  }

  try {
    const result = await client.createOrReplace(sellCarData)
    console.log('Sell Your Car page created successfully:', result._id)
  } catch (error) {
    console.error('Error creating sell your car page:', error.message)
  }

  // Fix testimonials - use correct field names from schema (customerName, review instead of name, content)
  const testimonials = [
    {
      _id: 'testimonial-1',
      _type: 'testimonial',
      customerName: 'Sarah M.',
      rating: 5,
      review: 'Amazing experience! The team was incredibly helpful and transparent. Got my dream car with excellent financing terms.',
      vehiclePurchased: '2023 BMW X3',
      featured: true,
      source: 'google'
    },
    {
      _id: 'testimonial-2',
      _type: 'testimonial',
      customerName: 'Michael R.',
      rating: 5,
      review: 'Best car buying experience ever. No pressure sales and the 210-point inspection gave me peace of mind.',
      vehiclePurchased: '2022 Mercedes C300',
      featured: true,
      source: 'google'
    },
    {
      _id: 'testimonial-3',
      _type: 'testimonial',
      customerName: 'Jennifer L.',
      rating: 5,
      review: 'The trade-in process was seamless. Got more for my old car than expected and drove away in my new Audi same day!',
      vehiclePurchased: '2023 Audi Q5',
      featured: true,
      source: 'google'
    },
    {
      _id: 'testimonial-4',
      _type: 'testimonial',
      customerName: 'David K.',
      rating: 5,
      review: 'Outstanding service from start to finish. The financing team found me a rate I never thought possible.',
      vehiclePurchased: '2022 Lexus RX350',
      featured: false,
      source: 'facebook'
    },
    {
      _id: 'testimonial-5',
      _type: 'testimonial',
      customerName: 'Amanda S.',
      rating: 5,
      review: 'Highly recommend Planet Motors! Professional, knowledgeable, and truly care about finding you the right vehicle.',
      vehiclePurchased: '2023 Tesla Model Y',
      featured: false,
      source: 'direct'
    },
    {
      _id: 'testimonial-6',
      _type: 'testimonial',
      customerName: 'Robert T.',
      rating: 5,
      review: 'The 10-day money-back guarantee really shows their confidence in their vehicles. Fantastic experience all around.',
      vehiclePurchased: '2022 Volvo XC60',
      featured: false,
      source: 'google'
    }
  ]

  for (const testimonial of testimonials) {
    try {
      const result = await client.createOrReplace(testimonial)
      console.log('Testimonial created:', testimonial.customerName)
    } catch (error) {
      console.error('Error creating testimonial:', testimonial.customerName, error.message)
    }
  }

  // Fix FAQs - use correct field names from schema (question, answer as block array)
  const faqs = [
    {
      _id: 'faq-1',
      _type: 'faqEntry',
      question: 'What is included in your 210-point inspection?',
      answer: [
        {
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Our comprehensive 210-point inspection covers the engine, transmission, brakes, suspension, electrical systems, interior, exterior, and safety features. Every vehicle must pass this inspection before being listed for sale.',
              marks: []
            }
          ]
        }
      ],
      category: 'general',
      order: 1
    },
    {
      _id: 'faq-2',
      _type: 'faqEntry',
      question: 'How does the 10-day money-back guarantee work?',
      answer: [
        {
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: "If you're not completely satisfied with your purchase, return the vehicle within 10 days for a full refund. The vehicle must be in the same condition and have less than 500km added.",
              marks: []
            }
          ]
        }
      ],
      category: 'general',
      order: 2
    },
    {
      _id: 'faq-3',
      _type: 'faqEntry',
      question: 'What financing options do you offer?',
      answer: [
        {
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'We partner with over 15 major lenders including TD, RBC, Scotiabank, BMO, and CIBC to offer competitive rates. We can help with all credit situations, including first-time buyers and those rebuilding credit.',
              marks: []
            }
          ]
        }
      ],
      category: 'financing',
      order: 3
    },
    {
      _id: 'faq-4',
      _type: 'faqEntry',
      question: 'Can I get approved with bad credit?',
      answer: [
        {
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Yes! We specialize in helping customers with all types of credit. Our 98% approval rate means we can find financing solutions for almost everyone. Apply online for a quick pre-approval decision.',
              marks: []
            }
          ]
        }
      ],
      category: 'financing',
      order: 4
    },
    {
      _id: 'faq-5',
      _type: 'faqEntry',
      question: 'Do you offer home delivery?',
      answer: [
        {
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'Yes, we offer free home delivery within the GTA. For locations outside the GTA, delivery fees may apply. We can also arrange shipping anywhere in Canada.',
              marks: []
            }
          ]
        }
      ],
      category: 'delivery',
      order: 5
    },
    {
      _id: 'faq-6',
      _type: 'faqEntry',
      question: 'What warranty comes with the vehicles?',
      answer: [
        {
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: 'All vehicles come with remaining factory warranty if applicable. We also offer extended warranty options through our protection plan partners for additional peace of mind.',
              marks: []
            }
          ]
        }
      ],
      category: 'warranty',
      order: 6
    }
  ]

  for (const faq of faqs) {
    try {
      const result = await client.createOrReplace(faq)
      console.log('FAQ created:', faq.question.substring(0, 40) + '...')
    } catch (error) {
      console.error('Error creating FAQ:', faq.question.substring(0, 40), error.message)
    }
  }

  console.log('\nCMS content fix complete!')
  console.log('Please refresh your Sanity Studio to see the updated content.')
}

fixCmsContent()
