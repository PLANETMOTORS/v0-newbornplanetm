#!/usr/bin/env node
/**
 * scripts/seed-blog-posts.mjs
 * Seeds all 32 blog posts from lib/blog-data.ts into Sanity production dataset.
 * Usage: SANITY_API_TOKEN=sk... node scripts/seed-blog-posts.mjs
 * Safe to re-run — uses createOrReplace with deterministic _id based on slug.
 */
import { createClient } from "@sanity/client"

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "wlxj8olw"
const TOKEN = process.env.SANITY_API_TOKEN

if (!TOKEN) {
  console.error("❌ SANITY_API_TOKEN is required.")
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: "production",
  apiVersion: "2025-04-01",
  token: TOKEN,
  useCdn: false,
})

const posts = [
  { slug: "check-battery-health-used-tesla-canada", title: "How to Check Battery Health Before Buying a Used Tesla in Canada", excerpt: "Learn how to assess battery degradation, check range estimates, and use diagnostic tools before purchasing a pre-owned Tesla in Canada.", date: "2026-04-09", category: "Electric Vehicles" },
  { slug: "trading-in-car-with-loan-canada", title: "Trading In a Car With a Loan in Canada: What Happens Next?", excerpt: "Understand how trading in a financed vehicle works in Canada, including equity, negative equity, and what dealers do with your existing loan.", date: "2026-03-15", category: "Trade-In" },
  { slug: "buying-used-tesla-canada-2026-guide", title: "Buying a Used Tesla in Canada: Is It Worth It? (2026 Guide)", excerpt: "A comprehensive guide to buying a pre-owned Tesla in Canada — pricing, warranty, charging infrastructure, and what to watch out for.", date: "2026-03-01", category: "Electric Vehicles" },
  { slug: "increase-car-value-before-selling-ontario", title: "How to Increase Your Car's Value Before Selling in Ontario", excerpt: "Simple steps Ontario sellers can take to maximize their vehicle's trade-in or private sale value before listing.", date: "2026-02-20", category: "Selling" },
  { slug: "tesla-warranty-used-cars", title: "Tesla Warranty for Used Cars: What You Need to Know", excerpt: "Everything Canadian buyers need to know about Tesla's used vehicle warranty coverage, transferability, and what's excluded.", date: "2026-02-10", category: "Electric Vehicles" },
  { slug: "trade-in-vs-selling-car-ontario", title: "Trade-In vs Selling Your Car to a Dealer in Ontario", excerpt: "Compare the pros and cons of trading in your vehicle versus selling it privately or to a dealer in Ontario.", date: "2026-01-28", category: "Trade-In" },
  { slug: "tesla-full-self-driving-guide", title: "What Is Tesla Full Self-Driving (FSD)? Complete Buyer Guide", excerpt: "A plain-English explanation of Tesla FSD — what it does, what it doesn't do, and whether it's worth paying for in Canada.", date: "2026-01-15", category: "Electric Vehicles" },
  { slug: "biweekly-vs-monthly-payments-canada", title: "Bi-Weekly vs Monthly Car Payments in Canada: Which is Better?", excerpt: "Break down the math on bi-weekly versus monthly car loan payments and find out which saves you more money in Canada.", date: "2026-01-05", category: "Financing" },
  { slug: "tesla-model-y-vs-model-3", title: "Tesla Model Y vs Tesla Model 3: Which One Should You Buy?", excerpt: "A detailed comparison of the Tesla Model Y and Model 3 for Canadian buyers — range, price, practicality, and value.", date: "2025-12-20", category: "Electric Vehicles" },
  { slug: "awd-vs-rwd-ontario", title: "AWD vs RWD: Which Is Better to Drive in Ontario?", excerpt: "For Ontario winters, does AWD really make a difference? We break down the real-world differences for Canadian drivers.", date: "2025-12-10", category: "Buying Tips" },
  { slug: "we-buy-your-car-canada", title: "We Buy Your Car Across Canada", excerpt: "Planet Motors buys vehicles across Canada — find out how our instant offer process works and what we pay.", date: "2025-11-30", category: "Selling" },
  { slug: "sell-car-for-cash-canada", title: "Quick Guide: Sell Your Car for Cash In Canada", excerpt: "The fastest ways to sell your car for cash in Canada — from instant offers to private sales.", date: "2025-11-20", category: "Selling" },
  { slug: "why-choose-planet-motors", title: "Why Choose Planet Motors?", excerpt: "What makes Planet Motors different from traditional dealerships — our process, pricing, and customer promise.", date: "2025-11-10", category: "About Us" },
  { slug: "how-to-trade-in-used-car", title: "How to Trade in Your Used Car", excerpt: "Step-by-step guide to trading in your used car at Planet Motors — from getting a quote to driving away in your next vehicle.", date: "2025-10-30", category: "Trade-In" },
  { slug: "car-resale-value-toronto", title: "Car Resale Value: How to Maximize it in Toronto", excerpt: "Toronto-specific tips for maximizing your vehicle's resale value — timing, condition, and market factors.", date: "2025-10-20", category: "Selling" },
  { slug: "tax-benefits-trade-in-vs-selling", title: "Tax Benefits of Trading In Your Car vs Selling Privately", excerpt: "In Ontario, trading in your car can save you HST on your next purchase. Here's how the math works.", date: "2025-10-10", category: "Financing" },
  { slug: "sell-financed-car-canada", title: "How to Sell a Financed Car in Canada?", excerpt: "Can you sell a car you still owe money on? Yes — here's how to do it legally and profitably in Canada.", date: "2025-09-30", category: "Selling" },
  { slug: "sell-car-toronto-guide", title: "Sell Your Car in Toronto: Complete Guide", excerpt: "Everything Toronto sellers need to know about getting the best price for their vehicle in 2025.", date: "2025-09-20", category: "Selling" },
  { slug: "sell-everything-before-sell", title: "What to Remove From Your Car Before Selling", excerpt: "A checklist of everything you should remove, clean, and prepare before handing over your keys.", date: "2025-09-10", category: "Selling" },
  { slug: "get-quote-5-minutes", title: "Get a Car Quote in 5 Minutes", excerpt: "How Planet Motors instant quote tool works and what information you need to get an accurate offer fast.", date: "2025-08-30", category: "About Us" },
  { slug: "tesla-cybertruck-2024", title: "Tesla Cybertruck 2024: Is It Coming to Canada?", excerpt: "Everything Canadians need to know about the Tesla Cybertruck — availability, pricing, and delivery timeline.", date: "2025-08-20", category: "Electric Vehicles" },
  { slug: "equifax-newcomers-credit-canada", title: "Building Credit as a Newcomer to Canada: Car Financing Guide", excerpt: "How newcomers to Canada can build credit and qualify for car financing — step by step.", date: "2025-08-10", category: "Financing" },
  { slug: "tesla-robotaxi-robovan", title: "Tesla Robotaxi and Robovan: What Canadian Buyers Should Know", excerpt: "Tesla autonomous vehicle plans and what they mean for Canadian EV buyers and the used car market.", date: "2025-07-30", category: "Electric Vehicles" },
  { slug: "ev-trends-planet-motors", title: "EV Trends in Canada: What's Driving the Market in 2025", excerpt: "The latest electric vehicle trends shaping the Canadian automotive market in 2025.", date: "2025-07-20", category: "Electric Vehicles" },
  { slug: "car-deliveries-canada", title: "Car Deliveries Across Canada: How It Works", excerpt: "Planet Motors delivers vehicles across Canada. Here's how our delivery process works and what it costs.", date: "2025-07-10", category: "About Us" },
  { slug: "understanding-apr-car-loans", title: "Understanding APR on Car Loans in Canada", excerpt: "What APR means, how it's calculated, and how to get the lowest rate on your next car loan in Canada.", date: "2025-06-30", category: "Financing" },
  { slug: "top-cars-fall-winter-2024", title: "Top Cars for Fall and Winter Driving in Canada 2024", excerpt: "The best vehicles for Canadian fall and winter conditions — AWD, heated seats, and cold-weather range.", date: "2025-06-20", category: "Buying Tips" },
  { slug: "top-preowned-vehicles-2024", title: "Top Pre-Owned Vehicles to Buy in Canada 2024", excerpt: "The most reliable and best-value pre-owned vehicles available in Canada for 2024.", date: "2025-06-10", category: "Buying Tips" },
  { slug: "tesla-model-y-future-ev", title: "Tesla Model Y: The Future of EVs in Canada?", excerpt: "Why the Tesla Model Y continues to dominate the Canadian EV market and what buyers should know.", date: "2025-05-30", category: "Electric Vehicles" },
  { slug: "first-time-car-buyer-financing", title: "First-Time Car Buyer Financing Guide for Canada", excerpt: "Everything first-time buyers need to know about getting approved for a car loan in Canada.", date: "2025-05-20", category: "Financing" },
  { slug: "best-selling-electric-cars-canada-2023", title: "Best-Selling Electric Cars in Canada 2023", excerpt: "A look back at the top-selling EVs in Canada in 2023 and what it means for the used car market.", date: "2025-05-10", category: "Electric Vehicles" },
  { slug: "honda-civic-hybrid-2024", title: "Honda Civic Hybrid 2024: Is It Worth Buying Used?", excerpt: "A buyer's guide to the 2024 Honda Civic Hybrid — reliability, fuel economy, and used market pricing.", date: "2025-05-01", category: "Buying Tips" },
]

function makeBody(excerpt) {
  return [{ _type: "block", _key: "intro", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s0", text: excerpt, marks: [] }] }]
}

async function seed() {
  console.log(`\n🌱 Seeding ${posts.length} blog posts → project ${PROJECT_ID} / production\n`)
  let ok = 0, fail = 0
  for (const p of posts) {
    try {
      await client.createOrReplace({
        _id: `blogPost-${p.slug}`,
        _type: "blogPost",
        title: p.title,
        slug: { _type: "slug", current: p.slug },
        publishedAt: new Date(p.date).toISOString(),
        excerpt: p.excerpt,
        categories: [p.category],
        body: makeBody(p.excerpt),
        seoTitle: p.title,
        seoDescription: p.excerpt,
      })
      console.log(`  ✅ ${p.slug}`)
      ok++
    } catch (e) {
      console.error(`  ❌ ${p.slug}: ${e.message}`)
      fail++
    }
  }
  console.log(`\n📊 ${ok} seeded · ${fail} failed`)
  if (fail > 0) process.exit(1)
}

try {
  await seed()
} catch (e) {
  console.error(e)
  process.exit(1)
}
