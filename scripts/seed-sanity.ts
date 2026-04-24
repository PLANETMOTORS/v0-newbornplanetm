#!/usr/bin/env npx tsx
/**
 * scripts/seed-sanity.ts
 *
 * Seeds the Sanity production dataset with real content.
 *
 * This script:
 *   1. Creates the "production" dataset if it doesn't exist
 *   2. Upserts site settings (dealerName, phone, address, hours)
 *   3. Upserts blog post categories
 *   4. Upserts blog posts (so blog pages stop 404-ing)
 *   5. Upserts protection plan content
 *
 * Usage:
 *   SANITY_API_TOKEN=<editor-or-admin-token> npx tsx scripts/seed-sanity.ts
 *
 * Required env vars:
 *   SANITY_API_TOKEN  — Sanity token with "Editor" role or higher
 *   NEXT_PUBLIC_SANITY_PROJECT_ID — project ID (defaults to wlxj8olw)
 *
 * Safe to run multiple times — uses upsert (_id-based) so no duplicates.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "wlxj8olw"
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"
const API_VERSION = "2021-06-07"
const TOKEN = process.env.SANITY_API_TOKEN

if (!TOKEN) {
  console.error("❌ SANITY_API_TOKEN is required")
  process.exit(1)
}

const BASE_URL = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}`

// ── HTTP helpers ───────────────────────────────────────────────────────────

async function sanityRequest(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sanity API ${method} ${path} → ${res.status}: ${text}`)
  }

  return res.json()
}

/** Upsert a single document (createOrReplace) */
async function upsert(doc: Record<string, unknown>) {
  return sanityRequest(`/data/mutate/${DATASET}`, "POST", {
    mutations: [{ createOrReplace: doc }],
  })
}

/** Upsert multiple documents in one batch */
async function upsertMany(docs: Record<string, unknown>[]) {
  return sanityRequest(`/data/mutate/${DATASET}`, "POST", {
    mutations: docs.map((doc) => ({ createOrReplace: doc })),
  })
}

// ── Dataset creation ───────────────────────────────────────────────────────

async function ensureDataset() {
  console.log(`\n📦 Ensuring dataset "${DATASET}" exists...`)
  try {
    // List datasets
    const res = await fetch(
      `https://api.sanity.io/v${API_VERSION}/projects/${PROJECT_ID}/datasets`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    )
    const datasets: Array<{ name: string }> = await res.json()
    const exists = datasets.some((d) => d.name === DATASET)

    if (exists) {
      console.log(`  ✓ Dataset "${DATASET}" already exists`)
      return
    }

    // Create dataset
    const create = await fetch(
      `https://api.sanity.io/v${API_VERSION}/projects/${PROJECT_ID}/datasets/${DATASET}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ aclMode: "private" }),
      }
    )
    if (!create.ok) {
      const text = await create.text()
      throw new Error(`Failed to create dataset: ${text}`)
    }
    console.log(`  ✓ Created dataset "${DATASET}"`)
  } catch (err) {
    console.error("  ⚠ Could not verify/create dataset:", err)
    console.log("  → Continuing anyway (dataset may already exist)")
  }
}

// ── Seed data ──────────────────────────────────────────────────────────────

async function seedSiteSettings() {
  console.log("\n⚙️  Seeding site settings...")
  await upsert({
    _id: "siteSettings",
    _type: "siteSettings",
    dealerName: "Planet Motors",
    tagline: "Richmond Hill's Premier Pre-Owned Dealership",
    phone: "1-888-888-8888",
    phoneLocal: "(905) 884-8888",
    email: "info@planetmotors.ca",
    streetAddress: "30 Major Mackenzie Dr E",
    city: "Richmond Hill",
    province: "Ontario",
    postalCode: "L4C 2G1",
    country: "Canada",
    googleMapsUrl: "https://maps.google.com/?q=30+Major+Mackenzie+Dr+E+Richmond+Hill+ON",
    weekdayHours: { open: "9:00 AM", close: "7:00 PM" },
    saturdayHours: { open: "9:00 AM", close: "6:00 PM" },
    sundayHours: null,
    omvicNumber: "4747474",
    ratingValue: 4.8,
    ratingCount: 312,
    socialLinks: {
      facebook: "https://facebook.com/planetmotors",
      instagram: "https://instagram.com/planetmotors",
      youtube: "https://youtube.com/@planetmotors",
    },
  })
  console.log("  ✓ Site settings seeded")
}

async function seedCategories() {
  console.log("\n🏷️  Seeding blog categories...")
  const categories = [
    { _id: "category-buying-guide", _type: "category", title: "Buying Guide", slug: { _type: "slug", current: "buying-guide" } },
    { _id: "category-maintenance", _type: "category", title: "Maintenance", slug: { _type: "slug", current: "maintenance" } },
    { _id: "category-financing", _type: "category", title: "Financing", slug: { _type: "slug", current: "financing" } },
    { _id: "category-ev", _type: "category", title: "Electric Vehicles", slug: { _type: "slug", current: "electric-vehicles" } },
    { _id: "category-news", _type: "category", title: "Dealership News", slug: { _type: "slug", current: "dealership-news" } },
  ]
  await upsertMany(categories)
  console.log(`  ✓ ${categories.length} categories seeded`)
}

async function seedBlogPosts() {
  console.log("\n📝 Seeding blog posts...")

  const posts = [
    {
      _id: "post-clutch-replacement-cost-canada",
      _type: "post",
      title: "Clutch Replacement Cost in Canada: What to Expect in 2025",
      slug: { _type: "slug", current: "clutch-replacement-cost-canada" },
      publishedAt: "2025-03-15T09:00:00Z",
      excerpt: "Clutch replacement in Canada typically costs $800–$2,500 depending on your vehicle make, model, and province. Here's what you need to know before booking a repair.",
      categories: [{ _type: "reference", _ref: "category-maintenance" }],
      readingTime: 8,
      body: [
        {
          _type: "block",
          _key: "intro",
          style: "normal",
          children: [{ _type: "span", _key: "s1", text: "If your car is slipping gears, making grinding noises, or the clutch pedal feels spongy, you may be facing a clutch replacement. In Canada, this repair typically costs between $800 and $2,500 — but the final price depends on several factors." }],
        },
        {
          _type: "block",
          _key: "h1",
          style: "h2",
          children: [{ _type: "span", _key: "s2", text: "Average Clutch Replacement Cost by Province" }],
        },
        {
          _type: "block",
          _key: "p1",
          style: "normal",
          children: [{ _type: "span", _key: "s3", text: "Ontario: $900–$2,200 | Quebec: $800–$2,000 | BC: $1,000–$2,500 | Alberta: $850–$2,100. Labour rates vary significantly by region, with major cities like Toronto and Vancouver commanding premium rates." }],
        },
        {
          _type: "block",
          _key: "h2",
          style: "h2",
          children: [{ _type: "span", _key: "s4", text: "What's Included in a Clutch Replacement?" }],
        },
        {
          _type: "block",
          _key: "p2",
          style: "normal",
          children: [{ _type: "span", _key: "s5", text: "A complete clutch job typically includes: clutch disc, pressure plate, release bearing (throw-out bearing), pilot bearing, and flywheel resurfacing or replacement. Always ask your mechanic to inspect the flywheel — replacing it at the same time saves significant labour costs." }],
        },
        {
          _type: "block",
          _key: "h3",
          style: "h2",
          children: [{ _type: "span", _key: "s6", text: "Signs You Need a Clutch Replacement" }],
        },
        {
          _type: "block",
          _key: "p3",
          style: "normal",
          children: [{ _type: "span", _key: "s7", text: "Watch for: slipping clutch (engine revs but car doesn't accelerate), difficulty shifting gears, burning smell when engaging the clutch, clutch pedal vibration, or the clutch engaging very high or very low in the pedal travel." }],
        },
        {
          _type: "block",
          _key: "h4",
          style: "h2",
          children: [{ _type: "span", _key: "s8", text: "How to Extend Clutch Life" }],
        },
        {
          _type: "block",
          _key: "p4",
          style: "normal",
          children: [{ _type: "span", _key: "s9", text: "Avoid riding the clutch (keeping your foot partially on the pedal), don't use the clutch to hold on hills (use the handbrake instead), and shift smoothly. A well-maintained clutch can last 100,000–160,000 km." }],
        },
        {
          _type: "block",
          _key: "cta",
          style: "normal",
          children: [{ _type: "span", _key: "s10", text: "Considering trading in your manual transmission vehicle? Planet Motors offers instant trade-in quotes — get your offer in 60 seconds at planetmotors.ca/trade-in." }],
        },
      ],
    },
    {
      _id: "post-used-car-buying-guide-canada",
      _type: "post",
      title: "The Complete Used Car Buying Guide for Canadians (2025)",
      slug: { _type: "slug", current: "used-car-buying-guide-canada" },
      publishedAt: "2025-02-10T09:00:00Z",
      excerpt: "Everything you need to know about buying a used car in Canada — from CARFAX reports to OMVIC regulations, financing, and negotiation tips.",
      categories: [{ _type: "reference", _ref: "category-buying-guide" }],
      readingTime: 12,
      body: [
        {
          _type: "block",
          _key: "intro",
          style: "normal",
          children: [{ _type: "span", _key: "s1", text: "Buying a used car in Canada is one of the biggest financial decisions most people make. This guide covers everything from finding the right vehicle to closing the deal safely." }],
        },
        {
          _type: "block",
          _key: "h1",
          style: "h2",
          children: [{ _type: "span", _key: "s2", text: "Step 1: Set Your Budget" }],
        },
        {
          _type: "block",
          _key: "p1",
          style: "normal",
          children: [{ _type: "span", _key: "s3", text: "Include all costs: purchase price, HST/GST, licensing, insurance, and potential repairs. A good rule of thumb: your total vehicle costs (payment + insurance + fuel) should not exceed 20% of your take-home pay." }],
        },
        {
          _type: "block",
          _key: "h2",
          style: "h2",
          children: [{ _type: "span", _key: "s4", text: "Step 2: Check the Vehicle History" }],
        },
        {
          _type: "block",
          _key: "p2",
          style: "normal",
          children: [{ _type: "span", _key: "s5", text: "Always get a CARFAX Canada report. It shows accident history, odometer readings, lien information, and whether the vehicle was ever declared a total loss. Planet Motors provides CARFAX reports on every vehicle." }],
        },
        {
          _type: "block",
          _key: "h3",
          style: "h2",
          children: [{ _type: "span", _key: "s6", text: "Step 3: Understand OMVIC Protection" }],
        },
        {
          _type: "block",
          _key: "p3",
          style: "normal",
          children: [{ _type: "span", _key: "s7", text: "In Ontario, all registered dealers must be OMVIC-licensed. This gives you legal protections including the right to a written contract, disclosure of all fees, and access to the Motor Vehicle Dealers Compensation Fund if something goes wrong." }],
        },
      ],
    },
    {
      _id: "post-ev-buying-guide-canada",
      _type: "post",
      title: "Electric Vehicle Buying Guide Canada 2025: Incentives, Range & What to Check",
      slug: { _type: "slug", current: "electric-vehicle-buying-guide-canada" },
      publishedAt: "2025-01-20T09:00:00Z",
      excerpt: "Canada's EV market is booming. Here's how to navigate federal and provincial incentives, understand battery health, and find the right used EV.",
      categories: [{ _type: "reference", _ref: "category-ev" }],
      readingTime: 10,
      body: [
        {
          _type: "block",
          _key: "intro",
          style: "normal",
          children: [{ _type: "span", _key: "s1", text: "Used electric vehicles offer exceptional value in 2025 — but buying one requires different due diligence than a gas vehicle. Battery health is the most critical factor." }],
        },
        {
          _type: "block",
          _key: "h1",
          style: "h2",
          children: [{ _type: "span", _key: "s2", text: "Federal iZEV Incentive: Up to $5,000" }],
        },
        {
          _type: "block",
          _key: "p1",
          style: "normal",
          children: [{ _type: "span", _key: "s3", text: "Canada's iZEV program offers up to $5,000 off eligible new EVs. Used EVs don't qualify for the federal incentive, but Ontario's Electric Vehicle Incentive Program (EVIP) may apply. Check tc.canada.ca for current eligibility." }],
        },
        {
          _type: "block",
          _key: "h2",
          style: "h2",
          children: [{ _type: "span", _key: "s4", text: "Battery Health: The Most Important Check" }],
        },
        {
          _type: "block",
          _key: "p2",
          style: "normal",
          children: [{ _type: "span", _key: "s5", text: "Planet Motors uses Aviloo battery certification on all used EVs. This independent test measures actual battery capacity vs. original capacity, giving you a precise State of Health (SoH) percentage. Look for 80%+ SoH for good long-term value." }],
        },
      ],
    },
    {
      _id: "post-auto-financing-canada",
      _type: "post",
      title: "Auto Financing in Canada: How to Get the Best Rate in 2025",
      slug: { _type: "slug", current: "auto-financing-canada-best-rates" },
      publishedAt: "2025-03-01T09:00:00Z",
      excerpt: "Interest rates, credit scores, loan terms — here's how to navigate auto financing in Canada and get the lowest possible rate on your next vehicle.",
      categories: [{ _type: "reference", _ref: "category-financing" }],
      readingTime: 9,
      body: [
        {
          _type: "block",
          _key: "intro",
          style: "normal",
          children: [{ _type: "span", _key: "s1", text: "Auto loan rates in Canada range from 6.29% to 29.99% APR depending on your credit score, loan term, and lender. Here's how to get the best deal." }],
        },
        {
          _type: "block",
          _key: "h1",
          style: "h2",
          children: [{ _type: "span", _key: "s2", text: "What Credit Score Do You Need?" }],
        },
        {
          _type: "block",
          _key: "p1",
          style: "normal",
          children: [{ _type: "span", _key: "s3", text: "760+: Best rates (6.29%–7.99%) | 700–759: Good rates (8%–12%) | 650–699: Fair rates (12%–18%) | Below 650: Subprime rates (18%–29.99%). Planet Motors works with 20+ lenders to find options for all credit situations." }],
        },
        {
          _type: "block",
          _key: "h2",
          style: "h2",
          children: [{ _type: "span", _key: "s4", text: "Soft vs Hard Credit Checks" }],
        },
        {
          _type: "block",
          _key: "p2",
          style: "normal",
          children: [{ _type: "span", _key: "s5", text: "Planet Motors uses a soft credit check for pre-approval — this does NOT affect your credit score. A hard check only happens when you formally apply for financing. You can get pre-approved and shop with confidence." }],
        },
      ],
    },
  ]

  await upsertMany(posts)
  console.log(`  ✓ ${posts.length} blog posts seeded`)
}

async function seedProtectionPlans() {
  console.log("\n🛡️  Seeding protection plans...")
  const plans = [
    {
      _id: "plan-basic",
      _type: "protectionPlan",
      name: "Basic Coverage",
      slug: { _type: "slug", current: "basic-coverage" },
      price: 29,
      period: "/month",
      description: "Essential protection for peace of mind",
      highlighted: false,
      features: ["Powertrain coverage", "24/7 roadside assistance", "Trip interruption coverage", "Rental car reimbursement"],
    },
    {
      _id: "plan-premium",
      _type: "protectionPlan",
      name: "Premium Coverage",
      slug: { _type: "slug", current: "premium-coverage" },
      price: 59,
      period: "/month",
      description: "Comprehensive protection for your vehicle",
      highlighted: true,
      features: ["Everything in Basic", "Electrical system coverage", "Air conditioning coverage", "Suspension coverage", "Brake system coverage"],
    },
    {
      _id: "plan-ultimate",
      _type: "protectionPlan",
      name: "Ultimate Coverage",
      slug: { _type: "slug", current: "ultimate-coverage" },
      price: 99,
      period: "/month",
      description: "Complete bumper-to-bumper protection",
      highlighted: false,
      features: ["Everything in Premium", "Full mechanical coverage", "Electronics & technology", "Interior components", "Appearance protection", "Zero deductible option"],
    },
  ]
  await upsertMany(plans)
  console.log(`  ✓ ${plans.length} protection plans seeded`)
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Seeding Sanity dataset`)
  console.log(`   Project: ${PROJECT_ID}`)
  console.log(`   Dataset: ${DATASET}`)

  await ensureDataset()
  await seedSiteSettings()
  await seedCategories()
  await seedBlogPosts()
  await seedProtectionPlans()

  console.log("\n✅ Seed complete!")
  console.log("\nNext steps:")
  console.log("  1. Verify at https://planetmotors.ca/blog — posts should no longer 404")
  console.log("  2. Check Sanity Studio at https://planetmotors.sanity.studio")
  console.log("  3. Run: pnpm build — should compile without CMS errors")
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err)
  process.exit(1)
})
