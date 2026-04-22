const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '4588vjsz',
  dataset: 'planetmotors_cms',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

// Homepage content
const homepageContent = {
  _id: 'homepage',
  _type: 'homepage',
  title: 'Planet Motors Homepage',
  heroSection: {
    headline: 'The Smarter Way to',
    headlineHighlight: 'Buy or Sell Your Car',
    subheadline: "Ontario's trusted destination for premium pre-owned vehicles. 210-point inspection, 10-day money-back guarantee, and the best multi-lender financing rates.",
    primaryCta: {
      label: 'Browse Inventory',
      url: '/inventory'
    },
    secondaryCta: {
      label: 'Trade-In',
      url: '/trade-in'
    },
    highlightCta: {
      label: 'Instant Cash Offer',
      url: '/sell-your-car'
    }
  },
  trustBadges: [
    { text: 'OMVIC Licensed', icon: 'shield' },
    { text: '10-Day Returns', icon: 'refresh' },
    { text: '4.8/5 Rating', icon: 'star' },
    { text: '24/7 Support', icon: 'clock' }
  ],
  quickFilters: [
    { label: 'SUV', url: '/inventory?type=suv' },
    { label: 'Sedan', url: '/inventory?type=sedan' },
    { label: 'Electric', url: '/inventory?type=electric' },
    { label: 'Luxury', url: '/inventory?type=luxury' },
    { label: 'Under $20k', url: '/inventory?maxPrice=20000' }
  ],
  announcementBar: {
    show: true,
    message: '124 new arrivals this week!',
    linkText: 'View Latest',
    linkUrl: '/inventory?sort=newest'
  },
  financingPromo: {
    rate: '6.29',
    rateLabel: 'Financing from',
    ctaLabel: 'Get Pre-Approved',
    ctaUrl: '/financing'
  },
  seo: {
    metaTitle: 'Planet Motors | Premium Pre-Owned Vehicles in Richmond Hill',
    metaDescription: "Ontario's trusted destination for certified pre-owned vehicles. 210-point inspection, 10-day money-back guarantee, and competitive financing rates."
  }
};

// Sell Your Car page content
const sellYourCarContent = {
  _id: 'sellYourCarPage',
  _type: 'sellYourCarPage',
  title: 'Sell Your Car - Planet Motors',
  heroSection: {
    headline: 'Get Your Instant Cash Offer',
    subheadline: 'Sell your car the smart way. Get a competitive offer in minutes, not days. No haggling, no hidden fees.',
    highlightText: '+$500 Bonus',
    formSettings: {
      licensePlatePlaceholder: 'Enter License Plate',
      vinPlaceholder: 'Or Enter VIN',
      submitButtonText: 'Get My Offer'
    }
  },
  benefits: [
    {
      title: 'Instant Valuation',
      description: 'Get a competitive cash offer in under 2 minutes using real market data.',
      icon: 'zap'
    },
    {
      title: 'Free Pickup',
      description: 'We come to you. Free vehicle pickup anywhere in the GTA.',
      icon: 'truck'
    },
    {
      title: 'Same-Day Payment',
      description: 'Get paid the same day. Direct deposit or certified cheque.',
      icon: 'dollar'
    },
    {
      title: 'No Obligations',
      description: "Don't like the offer? No problem. Zero pressure, zero fees.",
      icon: 'shield'
    }
  ],
  processSteps: [
    {
      step: 1,
      title: 'Enter Your Vehicle Info',
      description: 'License plate or VIN - takes 30 seconds'
    },
    {
      step: 2,
      title: 'Get Your Instant Offer',
      description: 'See your cash offer based on real market data'
    },
    {
      step: 3,
      title: 'Schedule Free Pickup',
      description: 'We come to you at your convenience'
    },
    {
      step: 4,
      title: 'Get Paid Same Day',
      description: 'Direct deposit or certified cheque - your choice'
    }
  ],
  comparisonTable: {
    headers: ['Feature', 'Planet Motors', 'Private Sale', 'Trade-In'],
    rows: [
      ['Time to Sell', '1-2 Days', '2-8 Weeks', '1 Day'],
      ['Hassle Level', 'None', 'High', 'Low'],
      ['Price Offered', 'Competitive', 'Highest (if lucky)', 'Lowest'],
      ['Payment Security', 'Guaranteed', 'Risk of Fraud', 'Guaranteed'],
      ['Pickup Service', 'Free', 'N/A', 'N/A']
    ]
  },
  seo: {
    metaTitle: 'Sell Your Car | Instant Cash Offer | Planet Motors',
    metaDescription: 'Get an instant cash offer for your car. Free pickup, same-day payment, no haggling. Sell your car the smart way with Planet Motors.'
  }
};

// Financing page content
const financingPageContent = {
  _id: 'financingPage',
  _type: 'financingPage',
  title: 'Financing - Planet Motors',
  heroSection: {
    headline: 'Financing Made Simple',
    subheadline: 'Get pre-approved in minutes with rates as low as 6.29% APR. We work with 20+ lenders to find you the best rate.',
    featuredRateText: '6.29%',
    rateSubtext: 'APR as low as',
    primaryCta: {
      label: 'Get Pre-Approved',
      url: '/financing/apply'
    },
    secondaryCta: {
      label: 'Calculate Payment',
      url: '#calculator'
    }
  },
  benefits: [
    {
      title: 'Quick Approval',
      description: 'Get approved in as little as 30 seconds with our instant decision system.',
      icon: 'zap'
    },
    {
      title: '20+ Lenders',
      description: 'We partner with major banks and credit unions to find you the best rate.',
      icon: 'building'
    },
    {
      title: 'All Credit Welcome',
      description: 'Good credit, bad credit, no credit - we have options for everyone.',
      icon: 'check'
    },
    {
      title: 'No Impact on Credit',
      description: 'Pre-approval uses a soft credit check that won\'t affect your score.',
      icon: 'shield'
    }
  ],
  processSteps: [
    {
      step: 1,
      title: 'Apply Online',
      description: 'Quick 2-minute application'
    },
    {
      step: 2,
      title: 'Get Pre-Approved',
      description: 'Instant decision from multiple lenders'
    },
    {
      step: 3,
      title: 'Shop With Confidence',
      description: 'Know your budget before you shop'
    },
    {
      step: 4,
      title: 'Drive Home Happy',
      description: 'We handle all the paperwork'
    }
  ],
  calculator: {
    defaultVehiclePrice: 25000,
    defaultDownPayment: 2500,
    defaultInterestRate: 6.29,
    defaultTerm: 72,
    termOptions: [24, 36, 48, 60, 72, 84, 96]
  },
  seo: {
    metaTitle: 'Auto Financing | Rates from 6.29% APR | Planet Motors',
    metaDescription: 'Get pre-approved for auto financing in minutes. Competitive rates from 6.29% APR, all credit welcome. 20+ lender partners for the best rate.'
  }
};

async function migratePages() {
  console.log('Starting page content migration to Sanity...\n');

  try {
    // Delete old documents first to avoid conflicts
    console.log('Cleaning up old documents...');
    await client.delete({ query: '*[_type in ["homepage", "sellYourCarPage", "financingPage"]]' });
    console.log('Old documents deleted.\n');

    // Create Homepage
    console.log('Creating Homepage...');
    await client.createOrReplace(homepageContent);
    console.log('Homepage created successfully!\n');

    // Create Sell Your Car page
    console.log('Creating Sell Your Car page...');
    await client.createOrReplace(sellYourCarContent);
    console.log('Sell Your Car page created successfully!\n');

    // Create Financing page
    console.log('Creating Financing page...');
    await client.createOrReplace(financingPageContent);
    console.log('Financing page created successfully!\n');

    console.log('='.repeat(50));
    console.log('PAGE MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log('\nAll page content has been pushed to Sanity Studio.');
    console.log('Please refresh your Sanity Studio to see the content.');

  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.message.includes('permission') || error.message.includes('Insufficient')) {
      console.log('\nThe token does not have write permissions.');
      console.log('Please create a new token with "Editor" permissions.');
    }
    process.exit(1);
  }
}

migratePages();
