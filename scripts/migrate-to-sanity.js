const { createClient } = require('@sanity/client');

const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.error('SANITY_API_WRITE_TOKEN is required');
  process.exit(1);
}

const client = createClient({
  projectId: '4588vjsz',
  dataset: 'planetmotors_cms',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: token,
});

// All hardcoded content from the website
const testimonials = [
  {
    _type: 'testimonial',
    _id: 'testimonial-1',
    name: 'Sarah M.',
    location: 'Toronto, ON',
    rating: 5,
    text: 'Incredible experience! Got approved for financing within hours and drove home in my dream Tesla. The 210-point inspection gave me complete peace of mind.',
    vehiclePurchased: '2023 Tesla Model 3',
    featured: true,
    order: 1,
  },
  {
    _type: 'testimonial',
    _id: 'testimonial-2',
    name: 'Michael R.',
    location: 'Mississauga, ON',
    rating: 5,
    text: 'Best car buying experience ever. The online process was seamless, and they delivered my BMW right to my door. Highly recommend Planet Motors!',
    vehiclePurchased: '2022 BMW X5',
    featured: true,
    order: 2,
  },
  {
    _type: 'testimonial',
    _id: 'testimonial-3',
    name: 'Jennifer L.',
    location: 'Brampton, ON',
    rating: 5,
    text: 'The trade-in value they offered was $3,000 more than other dealers. Combined with their financing rates, I saved over $5,000 total!',
    vehiclePurchased: '2023 Honda CR-V',
    featured: true,
    order: 3,
  },
  {
    _type: 'testimonial',
    _id: 'testimonial-4',
    name: 'David K.',
    location: 'Richmond Hill, ON',
    rating: 5,
    text: 'As a first-time buyer with limited credit history, I was nervous about financing. Planet Motors got me approved at a great rate. Thank you!',
    vehiclePurchased: '2022 Hyundai Tucson',
    featured: true,
    order: 4,
  },
  {
    _type: 'testimonial',
    _id: 'testimonial-5',
    name: 'Amanda S.',
    location: 'Vaughan, ON',
    rating: 5,
    text: 'The 10-day money-back guarantee sealed the deal for me. Turns out I love my new Audi even more than expected. Amazing service from start to finish!',
    vehiclePurchased: '2023 Audi Q5',
    featured: true,
    order: 5,
  },
  {
    _type: 'testimonial',
    _id: 'testimonial-6',
    name: 'Robert T.',
    location: 'Markham, ON',
    rating: 5,
    text: 'Sold my old car and bought a new one all in one visit. The ICO instant offer was fair and the whole process took less than 2 hours.',
    vehiclePurchased: '2023 Mercedes GLC',
    featured: true,
    order: 6,
  },
];

const faqs = [
  {
    _type: 'faqItem',
    _id: 'faq-1',
    question: 'What is included in your 210-point inspection?',
    answer: 'Our comprehensive 210-point inspection covers every major system of the vehicle including engine, transmission, brakes, suspension, electrical systems, safety features, and more. Each vehicle must pass this rigorous inspection before being listed for sale.',
    category: 'buying',
    order: 1,
  },
  {
    _type: 'faqItem',
    _id: 'faq-2',
    question: 'How does the 10-day money-back guarantee work?',
    answer: 'If you are not completely satisfied with your purchase, you can return the vehicle within 10 days for a full refund. The vehicle must be in the same condition as when purchased, with no additional damage or excessive mileage (max 500km).',
    category: 'buying',
    order: 2,
  },
  {
    _type: 'faqItem',
    _id: 'faq-3',
    question: 'What financing options do you offer?',
    answer: 'We work with over 30 lenders including major banks like TD, RBC, Scotiabank, BMO, and CIBC. We offer rates starting from 4.79% APR with terms up to 96 months. We specialize in helping customers with all credit situations.',
    category: 'financing',
    order: 3,
  },
  {
    _type: 'faqItem',
    _id: 'faq-4',
    question: 'Can I get approved with bad credit?',
    answer: 'Yes! We specialize in helping customers with all credit situations including bad credit, no credit, new immigrants, and bankruptcy. Our team works with specialized lenders to find financing solutions for everyone.',
    category: 'financing',
    order: 4,
  },
  {
    _type: 'faqItem',
    _id: 'faq-5',
    question: 'How does your Instant Cash Offer (ICO) work?',
    answer: 'Simply enter your vehicle details online and receive an instant cash offer within minutes. If you accept, bring your vehicle to our location for a quick inspection. Once verified, you will receive payment the same day via cheque or direct deposit.',
    category: 'selling',
    order: 5,
  },
  {
    _type: 'faqItem',
    _id: 'faq-6',
    question: 'Do you offer home delivery?',
    answer: 'Yes! We offer free delivery within 100km of our Richmond Hill location. For deliveries beyond 100km, a small fee applies. We also offer Canada-wide shipping for a flat rate.',
    category: 'delivery',
    order: 6,
  },
  {
    _type: 'faqItem',
    _id: 'faq-7',
    question: 'What warranty options are available?',
    answer: 'All vehicles come with remaining manufacturer warranty where applicable. We also offer extended warranty packages from 3 months to 5 years covering powertrain, comprehensive, or bumper-to-bumper protection.',
    category: 'warranty',
    order: 7,
  },
  {
    _type: 'faqItem',
    _id: 'faq-8',
    question: 'How long does the approval process take?',
    answer: 'Most financing applications are approved within 30 minutes to 2 hours. In some cases with complex credit situations, it may take up to 24 hours to find the best financing option for you.',
    category: 'financing',
    order: 8,
  },
];

const lenders = [
  { _type: 'lender', _id: 'lender-td', name: 'TD Auto Finance', interestRate: 6.29, maxTerm: 84, featured: true, order: 1 },
  { _type: 'lender', _id: 'lender-rbc', name: 'RBC', interestRate: 5.49, maxTerm: 84, featured: true, order: 2 },
  { _type: 'lender', _id: 'lender-scotiabank', name: 'Scotiabank', interestRate: 5.29, maxTerm: 84, featured: true, order: 3 },
  { _type: 'lender', _id: 'lender-bmo', name: 'BMO', interestRate: 5.99, maxTerm: 72, featured: true, order: 4 },
  { _type: 'lender', _id: 'lender-cibc', name: 'CIBC', interestRate: 5.49, maxTerm: 84, featured: true, order: 5 },
  { _type: 'lender', _id: 'lender-desjardins', name: 'Desjardins', interestRate: 4.79, maxTerm: 96, featured: true, order: 6 },
];

const homepage = {
  _type: 'homepage',
  _id: 'homepage',
  heroSection: {
    headline: 'The Smarter Way to',
    highlightText: 'Buy or Sell',
    headlineEnd: 'Your Car',
    subheadline: "Ontario's trusted destination for premium pre-owned vehicles. 210-point inspection, 10-day money-back guarantee, and the best multi-lender financing rates.",
    primaryCta: { label: 'Browse Inventory', url: '/inventory' },
    secondaryCta: { label: 'Trade-In', url: '/trade-in' },
    stats: [
      { value: '2,500+', label: 'Vehicles Sold' },
      { value: '4.9/5', label: 'Customer Rating' },
      { value: '98%', label: 'Approval Rate' },
    ],
  },
  trustBadges: [
    { text: 'OMVIC Licensed', icon: 'shield' },
    { text: '10-Day Returns', icon: 'refresh' },
    { text: '4.8/5 Rating', icon: 'star' },
    { text: '24/7 Support', icon: 'clock' },
  ],
  quickFilters: ['SUV', 'Sedan', 'Electric', 'Luxury', 'Under $20k'],
  announcementBar: {
    show: true,
    text: '124 new arrivals',
    subtext: 'Updated 2 min ago',
  },
};

const financingPage = {
  _type: 'financingPage',
  _id: 'financingPage',
  heroSection: {
    headline: 'Get Pre-Approved in Minutes',
    subheadline: 'Access rates from 30+ lenders. No impact on your credit score.',
    featuredRate: '4.79%',
    rateSubtext: 'Rates as low as',
    primaryCta: { label: 'Apply Now', url: '/financing/apply' },
    secondaryCta: { label: 'Calculate Payment', url: '#calculator' },
  },
  benefits: [
    { title: '30+ Lenders', description: 'Access to Canada\'s top banks and credit unions' },
    { title: '98% Approval', description: 'We help all credit situations get approved' },
    { title: 'Same-Day Approval', description: 'Most applications approved within hours' },
    { title: 'No Credit Impact', description: 'Soft credit check for pre-approval' },
  ],
  processSteps: [
    { step: 1, title: 'Apply Online', description: 'Fill out our simple 2-minute application' },
    { step: 2, title: 'Get Approved', description: 'Receive approval decision within hours' },
    { step: 3, title: 'Choose Vehicle', description: 'Select from our certified inventory' },
    { step: 4, title: 'Drive Home', description: 'Complete paperwork and drive away' },
  ],
};

const sellYourCarPage = {
  _type: 'sellYourCarPage',
  _id: 'sellYourCarPage',
  heroSection: {
    headline: 'Sell Your Car for More',
    subheadline: 'Get an instant cash offer in minutes. No haggling, no hassle.',
    highlightText: '+$500 Bonus',
    primaryCta: { label: 'Get Instant Offer', url: '#ico-form' },
  },
  benefits: [
    { title: 'Instant Offer', description: 'Get a competitive offer in under 2 minutes' },
    { title: 'Free Pickup', description: 'We come to you anywhere in the GTA' },
    { title: 'Same-Day Payment', description: 'Get paid via cheque or direct deposit' },
    { title: 'No Obligation', description: 'Our offer is valid for 7 days' },
  ],
  processSteps: [
    { step: 1, title: 'Enter Details', description: 'Provide your vehicle information' },
    { step: 2, title: 'Get Offer', description: 'Receive instant cash offer' },
    { step: 3, title: 'Schedule Pickup', description: 'We come to inspect & pick up' },
    { step: 4, title: 'Get Paid', description: 'Receive payment same day' },
  ],
};

async function migrate() {
  console.log('Starting content migration to Sanity...\n');

  try {
    // Test connection first
    console.log('Testing connection...');
    await client.fetch('*[_type == "siteSettings"][0]{dealerName}');
    console.log('Connection successful!\n');

    // Migrate testimonials
    console.log('Migrating testimonials...');
    for (const item of testimonials) {
      try {
        await client.createOrReplace(item);
        console.log(`  + Created testimonial: ${item.name}`);
      } catch (err) {
        console.log(`  ! Error with ${item.name}: ${err.message}`);
      }
    }

    // Migrate FAQs
    console.log('\nMigrating FAQs...');
    for (const item of faqs) {
      try {
        await client.createOrReplace(item);
        console.log(`  + Created FAQ: ${item.question.substring(0, 40)}...`);
      } catch (err) {
        console.log(`  ! Error with FAQ: ${err.message}`);
      }
    }

    // Migrate lenders
    console.log('\nMigrating lenders...');
    for (const item of lenders) {
      try {
        await client.createOrReplace(item);
        console.log(`  + Created lender: ${item.name}`);
      } catch (err) {
        console.log(`  ! Error with ${item.name}: ${err.message}`);
      }
    }

    // Migrate homepage
    console.log('\nMigrating homepage content...');
    try {
      await client.createOrReplace(homepage);
      console.log('  + Created homepage content');
    } catch (err) {
      console.log(`  ! Error with homepage: ${err.message}`);
    }

    // Migrate financing page
    console.log('\nMigrating financing page content...');
    try {
      await client.createOrReplace(financingPage);
      console.log('  + Created financing page content');
    } catch (err) {
      console.log(`  ! Error with financing page: ${err.message}`);
    }

    // Migrate sell your car page
    console.log('\nMigrating sell your car page content...');
    try {
      await client.createOrReplace(sellYourCarPage);
      console.log('  + Created sell your car page content');
    } catch (err) {
      console.log(`  ! Error with sell your car page: ${err.message}`);
    }

    console.log('\n========================================');
    console.log('MIGRATION COMPLETE!');
    console.log('========================================');
    console.log('\nContent added to Sanity:');
    console.log(`  - ${testimonials.length} Testimonials`);
    console.log(`  - ${faqs.length} FAQs`);
    console.log(`  - ${lenders.length} Lenders`);
    console.log('  - Homepage content');
    console.log('  - Financing page content');
    console.log('  - Sell Your Car page content');
    console.log('\nRefresh your Sanity Studio to see the content!');

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
