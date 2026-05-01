#!/usr/bin/env npx tsx
/**
 * scripts/seed-old-blogs.ts
 *
 * Migrates the 11 blog posts from the legacy Planet Motors site
 * (planetmotorsinc.tadvantagesites.com/resources/) into Sanity CMS.
 *
 * Each post is rewritten for 2026 SEO best practices while preserving
 * the original topic and publication chronology.
 *
 * Usage:
 *   SANITY_API_TOKEN=<developer-token> npx tsx scripts/seed-old-blogs.ts
 *
 * Safe to run multiple times — uses createOrReplace (idempotent).
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

async function upsertMany(docs: Record<string, unknown>[]) {
  return sanityRequest(`/data/mutate/${DATASET}`, "POST", {
    mutations: docs.map((doc) => ({ createOrReplace: doc })),
  })
}

// ── Portable-text helpers ──────────────────────────────────────────────────

function block(key: string, text: string, style: "normal" | "h2" | "h3" = "normal") {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }
}

function body(
  items: ReadonlyArray<readonly [string, string, ("normal" | "h2" | "h3")?]>,
) {
  return items.map(([key, text, style]) => block(key, text, style ?? "normal"))
}

// ── Blog posts — original dates preserved ──────────────────────────────────

const oldBlogPosts = [
  // 1. Best-selling electric cars (originally Nov 8, 2023)
  {
    _id: "blogPost-old-best-selling-evs-canada-2023",
    _type: "blogPost",
    title: "Best-Selling Electric Cars in Canada (2023 Roundup)",
    slug: { _type: "slug", current: "best-selling-electric-cars-canada-2023-roundup" },
    publishedAt: "2023-11-08T20:48:00Z",
    excerpt: "From the Nissan Leaf to the Chevrolet Bolt, these were the most affordable and popular electric vehicles on Canadian roads in 2023. Here's what made each one stand out.",
    seoTitle: "Best-Selling Electric Cars in Canada 2023 | Planet Motors",
    seoDescription: "Discover Canada's top-selling EVs in 2023 — pricing, range, and what made the Nissan Leaf, Chevy Bolt, Kia Soul EV, and Mazda MX-30 popular choices.",
    body: body([
      ["intro", "The high cost of gas generated massive interest in electric vehicles across Canada in 2023, and with more options available than ever before, drivers had real choices at every price point. Here's a look at the best-selling affordable EVs that year — and what made each one worth considering."],
      ["h-leaf", "Nissan Leaf EV", "h2"],
      ["p-leaf", "The Nissan Leaf was Canada's most affordable EV and one of the first fully electric vehicles available in the country. With 240 km of range, a generous suite of standard safety features, and one of the smoothest driver-assistance systems in the industry, the Leaf remained a reliable entry point into EV ownership."],
      ["h-bolt", "Chevrolet Bolt EV", "h2"],
      ["p-bolt", "The Bolt EV offered excellent value with approximately 417 km of rated range — drivers regularly reported closer to 460 km in real-world conditions. Roomy, practical, and loaded with useful trip-planning information, the Bolt was an easy car to live with daily."],
      ["h-soul", "Kia Soul EV Premium", "h2"],
      ["p-soul", "With its iconic boxy design and 248 km of range, the Kia Soul EV stood out for its practicality and ease of use. Kia included a long list of standard safety features, and the front-mounted charging port made pulling into charging stations much easier than many competitors."],
      ["h-mx30", "Mazda MX-30", "h2"],
      ["p-mx30", "The Mazda MX-30 brought suicide doors, upscale aspirations, and refined driving dynamics — but only 161 km of range and limited availability in BC and Quebec. Despite the low range, many reviewers praised it as one of the most stylish and fun-to-drive EVs in its class."],
      ["h-outlook", "What This Meant for Canadian EV Buyers", "h2"],
      ["p-outlook", "The Chevrolet Bolt EV stood out as the best overall value with the longest range at the most competitive price. As the EV market continues to mature, battery costs continue to decline, and more affordable options arrive every year. At Planet Motors, we carry certified pre-owned EVs with Aviloo battery health reports so you can buy with confidence."],
      ["cta", "Browse our current EV inventory at planetmotors.ca/inventory?type=electric — every vehicle comes with a 210-point inspection and 10-day money-back guarantee."],
    ]),
  },

  // 2. Honda Civic Hybrid (originally Oct 26, 2023)
  {
    _id: "blogPost-old-honda-civic-hybrid-2024",
    _type: "blogPost",
    title: "Honda Civic Hybrid Returns to Canada in 2024",
    slug: { _type: "slug", current: "honda-civic-hybrid-returns-canada-2024" },
    publishedAt: "2023-10-26T20:51:00Z",
    excerpt: "After a nine-year hiatus, Honda is bringing back the Civic Hybrid for 2025 — with Canadian-built sedans and US-built hatchbacks hitting dealerships in spring 2024.",
    seoTitle: "Honda Civic Hybrid 2024: Canada Return | Planet Motors",
    seoDescription: "Honda brings back the Civic Hybrid after 9 years. Canadian-built sedans, two-motor hybrid powertrain, and projected 40% hybrid mix. What buyers should know.",
    body: body([
      ["intro", "Canada is seeing Honda bring back the Civic Hybrid for the first time since 2015. The 2025 Honda Civic Hybrid entered production in spring 2024, with sedans built in Canada and hatchbacks assembled in the United States."],
      ["h-history", "A Brief History of the Civic Hybrid", "h2"],
      ["p-history", "The Honda Civic Hybrid debuted in 2002 as one of the earliest hybrid vehicles available in North America. Unlike the distinctive Toyota Prius, it looked like a standard Civic — same general design, just with a changed grille, new wheels, and a roof antenna. Honda produced hybrid versions through the eighth generation (2006–2011) and ninth generation (2012–2015) before discontinuing it in favour of the Insight."],
      ["h-powertrain", "The New Two-Motor Hybrid Powertrain", "h2"],
      ["p-powertrain", "The 2025 Civic Hybrid uses a variant of Honda's proven two-motor hybrid system, also found in the Accord and CR-V. The Accord Hybrid version produces 181 horsepower and 232 lb-ft of torque from a 2.0L four-cylinder. The Civic may use a 1.5L variant for better efficiency. All-wheel drive is likely given that the rival Toyota Corolla Hybrid offers it."],
      ["h-sales", "Sales Projections and Market Impact", "h2"],
      ["p-sales", "Honda projects that over 40% of all Civic sales in North America will be the hybrid variant. This aligns with current trends — already 35% of CR-V and Accord buyers choose the hybrid option. Honda's broader electrification goal targets 100% electric new-car sales by 2040."],
      ["h-buyers", "What This Means for Used Car Buyers", "h2"],
      ["p-buyers", "As hybrid Civics enter the market, expect strong trade-in demand for older Civics and competitive pricing on certified pre-owned hybrid models within a few years. At Planet Motors, we already carry a range of hybrid and electric vehicles with comprehensive inspection reports."],
      ["cta", "Thinking about trading in your current vehicle? Get an instant trade-in quote at planetmotors.ca/trade-in."],
    ]),
  },

  // 3. Selling out of Province (originally ~Sep 2023)
  {
    _id: "blogPost-old-selling-out-of-province",
    _type: "blogPost",
    title: "Selling a Vehicle Out of Province in Canada: What Dealers and Buyers Should Know",
    slug: { _type: "slug", current: "selling-vehicle-out-of-province-canada" },
    publishedAt: "2023-09-15T14:00:00Z",
    excerpt: "Thanks to the internet and social media, buying and selling vehicles across provincial lines has become common in Canada. Here's how it works and what to watch for.",
    seoTitle: "Selling a Car Out of Province in Canada | Planet Motors",
    seoDescription: "How to buy or sell a vehicle across provincial lines in Canada. Shipping, registration, inspection requirements, and what to expect from the process.",
    body: body([
      ["intro", "Thanks to the internet and social media, dealerships are selling more vehicles to buyers in other provinces without ever meeting face to face. It's now common for a vehicle to be sold without the buyer seeing the car in person — contracts signed digitally, and the vehicle shipped directly to the buyer's door."],
      ["h-process", "How Cross-Province Sales Work", "h2"],
      ["p-process", "The typical process involves online browsing, video walkarounds or 360° spin views, digital paperwork, and arranged shipping. At Planet Motors, our 360° Spin Viewer lets buyers inspect every angle of a vehicle remotely, and our Canada-wide delivery service handles the logistics."],
      ["h-registration", "Registration and Inspection Requirements", "h2"],
      ["p-registration", "Each province has its own vehicle registration and safety inspection requirements. When buying from Ontario, the vehicle comes with an Ontario Safety Standards Certificate. The buyer's home province may require an additional provincial inspection — for example, Quebec requires a SAAQ inspection, and BC requires a provincial inspection at a designated facility."],
      ["h-taxes", "Tax Considerations", "h2"],
      ["p-taxes", "HST or GST/PST applies based on the buyer's province of residence, not where the vehicle is purchased. Ontario charges 13% HST, while Alberta has no provincial sales tax on vehicles. Understanding the tax implications before purchasing can affect your total cost significantly."],
      ["h-shipping", "Vehicle Shipping Across Canada", "h2"],
      ["p-shipping", "Enclosed and open-carrier shipping options are available coast to coast. Typical delivery times range from 3–10 business days depending on distance. Planet Motors coordinates shipping through trusted carriers and provides tracking updates throughout the process."],
      ["h-protection", "Buyer Protection", "h2"],
      ["p-protection", "When purchasing from an OMVIC-registered dealer like Planet Motors, buyers in any province benefit from Ontario's consumer protection regulations, including mandatory disclosure requirements and access to the Motor Vehicle Dealers Compensation Fund."],
      ["cta", "Planet Motors offers Canada-wide delivery on all vehicles. Browse our inventory at planetmotors.ca/inventory or call 1-866-797-3332."],
    ]),
  },

  // 4. Infotainment system guide (originally ~Aug 2023)
  {
    _id: "blogPost-old-infotainment-system-guide",
    _type: "blogPost",
    title: "How to Check an Infotainment System Before Buying a Used Car",
    slug: { _type: "slug", current: "check-infotainment-system-used-car" },
    publishedAt: "2023-08-22T16:00:00Z",
    excerpt: "Voice recognition, smartphone connectivity, Apple CarPlay, Android Auto — up to 25% of used car complaints involve infotainment issues. Here's what to test before you buy.",
    seoTitle: "Check Infotainment System in Used Cars | Planet Motors",
    seoDescription: "How to test a used car's infotainment system before buying. Check Apple CarPlay, Android Auto, Bluetooth, voice recognition, and touchscreen responsiveness.",
    body: body([
      ["intro", "When buying a used car, the infotainment system is one of the most overlooked inspection points — yet up to 25% of used car complaints involve issues with voice recognition, smartphone connectivity, or touchscreen responsiveness. Here's what to check before signing."],
      ["h-carplay", "Test Apple CarPlay and Android Auto", "h2"],
      ["p-carplay", "Bring your own phone and cable to the test drive. Plug in and verify that Apple CarPlay or Android Auto connects within a few seconds. Test navigation, phone calls, and music playback. Some older vehicles only support wired connections, while newer models offer wireless connectivity — confirm which version the vehicle supports."],
      ["h-bluetooth", "Bluetooth Pairing and Audio", "h2"],
      ["p-bluetooth", "Pair your phone via Bluetooth and make a test call. Listen for audio quality issues, static, or lag. Try streaming music and verify that steering-wheel controls (volume, skip, voice assistant) respond correctly. Check if the system can pair multiple devices — this matters for families sharing a vehicle."],
      ["h-touch", "Touchscreen Responsiveness", "h2"],
      ["p-touch", "Tap through all menus and settings. Look for lag, dead spots, or ghost touches. Test pinch-to-zoom on the navigation map if supported. Check the screen visibility in direct sunlight — some older screens wash out badly. Verify that the backup camera displays clearly without distortion."],
      ["h-updates", "Software Updates and Navigation Maps", "h2"],
      ["p-updates", "Ask the dealer whether the infotainment software and navigation maps have been updated. Outdated maps can be frustrating, and some manufacturers charge for map updates. Over-the-air (OTA) update capability is a significant advantage in newer vehicles — Tesla, for example, pushes free updates regularly."],
      ["h-warranty", "What Planet Motors Checks", "h2"],
      ["p-warranty", "Every vehicle at Planet Motors goes through a 210-point inspection that includes full infotainment system testing — Bluetooth pairing, CarPlay/Android Auto, backup camera, speaker functionality, and touchscreen responsiveness. If there's an issue, we fix it before the vehicle reaches the showroom."],
      ["cta", "Shop with confidence at planetmotors.ca/inventory — every vehicle is inspected and backed by our 10-day money-back guarantee."],
    ]),
  },

  // 5. When to sell your car (originally ~Jul 2023)
  {
    _id: "blogPost-old-when-to-sell-your-car",
    _type: "blogPost",
    title: "When Is the Best Time to Sell Your Car in Canada?",
    slug: { _type: "slug", current: "best-time-sell-car-canada" },
    publishedAt: "2023-07-18T15:00:00Z",
    excerpt: "Timing your car sale right can mean thousands of extra dollars. Here's how seasonality, mileage milestones, and market conditions affect your vehicle's resale value in Canada.",
    seoTitle: "Best Time to Sell Your Car in Canada | Planet Motors",
    seoDescription: "When to sell your car for maximum value in Canada. Seasonal trends, mileage thresholds, loan payoff timing, and market conditions that affect resale prices.",
    body: body([
      ["intro", "The best time to sell a car is when you can get the maximum price for it. That usually means selling while the vehicle is still relatively new and has low mileage — but there are several other factors that Canadian sellers should consider."],
      ["h-season", "Seasonal Timing Matters", "h2"],
      ["p-season", "Spring and early summer (March through June) are peak selling seasons in Canada. Tax refunds give buyers more cash for down payments, and warmer weather puts people in a buying mood. Convertibles and sports cars sell best in spring, while SUVs and trucks see strong demand before winter. Avoid listing in December — holiday spending and cold weather suppress buyer activity."],
      ["h-mileage", "Key Mileage Milestones", "h2"],
      ["p-mileage", "Sell before major mileage thresholds: 60,000 km, 100,000 km, and 160,000 km. Canadian Black Book data shows that vehicles lose value sharply at each milestone. If your car is approaching 100,000 km, selling at 95,000 km can preserve significant value compared to waiting."],
      ["h-loan", "Consider Your Loan Situation", "h2"],
      ["p-loan", "Only sell your car if you can pay off the remaining loan balance. If you owe more than the car is worth (negative equity), you'll need to cover the difference. Trading in at a dealership can simplify this — the dealer handles the loan payoff and rolls any remaining balance into your new financing."],
      ["h-market", "Watch Market Conditions", "h2"],
      ["p-market", "The used car market fluctuates with supply and demand. When new car inventory is tight (as it was during 2021–2023), used car prices rise significantly. Monitor sites like Canadian Black Book and AutoTrader.ca to understand current market value for your specific make and model."],
      ["h-tips", "How to Maximize Your Sale Price", "h2"],
      ["p-tips", "Detail the car professionally, gather all maintenance records, and get a pre-sale inspection. Having a CARFAX report ready builds buyer confidence. If trading in, get quotes from multiple dealerships — Planet Motors offers instant online trade-in valuations at planetmotors.ca/trade-in."],
      ["cta", "Ready to sell? Get your trade-in value in 60 seconds at planetmotors.ca/trade-in — no obligation, no pressure."],
    ]),
  },

  // 6. 10-day special license (originally ~Jun 2023)
  {
    _id: "blogPost-old-10-day-special-license-ontario",
    _type: "blogPost",
    title: "Ontario 10-Day Special Licence: When You Need One and How to Get It",
    slug: { _type: "slug", current: "ontario-10-day-special-licence" },
    publishedAt: "2023-06-12T13:00:00Z",
    excerpt: "Special licences let you temporarily drive unregistered or over-weight vehicles in Ontario. Here's when you need one and exactly how the application process works.",
    seoTitle: "Ontario 10-Day Special Licence Guide | Planet Motors",
    seoDescription: "How to get a 10-day special licence in Ontario for unregistered vehicles, out-of-province registrations, or commercial vehicles exceeding registered weight.",
    body: body([
      ["intro", "Ontario's special licence program allows individuals to temporarily operate vehicles that don't qualify for standard temporary licence plates. Whether you're transporting a newly purchased vehicle to register it in another province or need to exceed a commercial vehicle's registered weight limit, here's what you need to know."],
      ["h-when", "When You Need a Special Licence", "h2"],
      ["p-when", "A 10-day special licence is required when you need to: drive a new passenger vehicle purchased in Ontario to register it in another jurisdiction, exceed the weight limit stated on a commercial vehicle's licence, or operate a vehicle that cannot receive temporary plates for other regulatory reasons."],
      ["h-eligible", "Who Is Eligible", "h2"],
      ["p-eligible", "Any individual whose vehicle or circumstances don't qualify for temporary licence plates (temporary vehicle registration) can apply. This commonly includes out-of-province buyers purchasing from Ontario dealers, commercial operators needing temporary weight exemptions, and individuals transporting vehicles for registration elsewhere."],
      ["h-apply", "How to Apply", "h2"],
      ["p-apply", "Visit a ServiceOntario centre with: proof of vehicle ownership (bill of sale), valid driver's licence, proof of insurance covering the vehicle, and payment for the special licence fee. The licence is valid for 10 consecutive days from the date of issue — plan your trip accordingly."],
      ["h-insurance", "Insurance Requirements", "h2"],
      ["p-insurance", "You must have valid insurance coverage before obtaining a special licence. Contact your insurance provider to arrange temporary coverage for the vehicle if it's not already insured. Most providers can bind coverage same-day."],
      ["h-dealers", "How Dealers Can Help", "h2"],
      ["p-dealers", "When you purchase a vehicle from an OMVIC-registered dealer like Planet Motors, we guide you through the licensing process — including helping out-of-province buyers understand what documentation they need for their home province. Our team handles the paperwork so you can focus on enjoying your new vehicle."],
      ["cta", "Buying from out of province? Planet Motors offers Canada-wide delivery and full documentation support. Call us at 1-866-797-3332 or visit planetmotors.ca/contact."],
    ]),
  },

  // 7. Fall car care tips (originally ~May 2023)
  {
    _id: "blogPost-old-fall-car-care-tips",
    _type: "blogPost",
    title: "3 Essential Fall Car Care Tips for Canadian Drivers",
    slug: { _type: "slug", current: "fall-car-care-tips-canada" },
    publishedAt: "2023-05-30T17:00:00Z",
    excerpt: "As winter approaches and days get shorter, your car needs extra attention. Check your lights, inspect your tires, and prepare for cold-weather driving with these essential tips.",
    seoTitle: "Fall Car Care Tips for Canadian Drivers | Planet Motors",
    seoDescription: "Prepare your car for fall and winter in Canada. Essential tips on headlights, tire inspection, and seasonal maintenance to keep you safe on the road.",
    body: body([
      ["intro", "Car care needs change with the seasons, and fall in Canada brings shorter days, colder temperatures, and unpredictable road conditions. These three essential checks will help keep your vehicle safe and reliable as winter approaches."],
      ["h-lights", "1. Check All Your Lights", "h2"],
      ["p-lights", "As winter approaches, days get shorter and city driving means navigating in darker conditions. Ensure all your car's headlights, taillights, and brake lights are functioning properly. Replace any burnt-out bulbs immediately — a single non-functioning brake light can lead to a rear-end collision and an Ontario Highway Traffic Act fine."],
      ["p-lights2", "Consider upgrading to LED bulbs if your vehicle supports them. LEDs produce brighter, whiter light and last significantly longer than halogen bulbs. Also clean your headlight lenses — oxidized or yellowed lenses can reduce light output by up to 80%."],
      ["h-tires", "2. Inspect and Rotate Your Tires", "h2"],
      ["p-tires", "While most Canadian drivers know to switch to winter tires, fall is the time to inspect your all-seasons before making the swap. Check tread depth using the quarter test (insert a quarter with the caribou head down — if you can see the top of the head, it's time for new tires). Look for uneven wear patterns that could indicate alignment issues."],
      ["p-tires2", "Ontario law doesn't mandate winter tires, but insurance companies offer discounts of 3–5% for using them. Plan your tire swap for late October or early November — waiting until the first snowfall means long wait times at tire shops."],
      ["h-fluids", "3. Top Up Fluids and Check Your Battery", "h2"],
      ["p-fluids", "Switch to winter-grade windshield washer fluid rated to -40°C. Check your coolant/antifreeze levels and ensure the mixture is correct for cold weather (typically 50/50). Cold weather is harder on batteries — have your battery tested if it's more than 3 years old. A battery that struggles in fall will fail in January."],
      ["h-bonus", "Bonus: Fall Is a Great Time to Buy", "h2"],
      ["p-bonus", "Dealership inventory is typically highest in fall as trade-ins from summer sales come through. This means better selection and often better deals. At Planet Motors, every vehicle receives a 210-point inspection regardless of season — so you know it's winter-ready."],
      ["cta", "Browse our winter-ready inventory at planetmotors.ca/inventory — all vehicles inspected and backed by our 10-day money-back guarantee."],
    ]),
  },

  // 8. Trade-in at home (originally ~Apr 2023)
  {
    _id: "blogPost-old-trade-in-at-home",
    _type: "blogPost",
    title: "How to Trade In Your Car From Home: A Step-by-Step Guide",
    slug: { _type: "slug", current: "trade-in-car-from-home-guide" },
    publishedAt: "2023-04-18T14:00:00Z",
    excerpt: "You don't have to leave your house to sell your car. Provide basic vehicle information, get bids from dealers across Canada, and accept the best offer — all online.",
    seoTitle: "Trade In Your Car From Home in Canada | Planet Motors",
    seoDescription: "How to trade in your car without leaving home. Online valuations, digital paperwork, and free vehicle pickup across Canada. Step-by-step guide from Planet Motors.",
    body: body([
      ["intro", "You don't have to leave your house to sell your car. The digital trade-in process lets you get a competitive offer, complete paperwork online, and have your vehicle picked up — all without visiting a dealership."],
      ["h-step1", "Step 1: Provide Your Vehicle Information", "h2"],
      ["p-step1", "Start by entering your vehicle's basic details: year, make, model, trim, mileage, and condition. Upload photos of the exterior, interior, and any existing damage. The more accurate your description, the closer your initial quote will be to the final offer."],
      ["h-step2", "Step 2: Receive Your Valuation", "h2"],
      ["p-step2", "Planet Motors uses Canadian Black Book data combined with current market conditions to generate a fair trade-in value. Your quote considers comparable recent sales, current demand for your specific model, and regional market differences across Canada."],
      ["h-step3", "Step 3: Accept Your Offer", "h2"],
      ["p-step3", "Review the offer details, including any conditions (such as a verification inspection). If you accept, we handle all the paperwork digitally — ownership transfer, lien verification, and payment processing."],
      ["h-step4", "Step 4: Vehicle Pickup and Payment", "h2"],
      ["p-step4", "We arrange free pickup of your vehicle at a time that works for you. Once the vehicle passes the verification inspection (confirming it matches your description), payment is processed immediately. Most sellers receive funds within 1–2 business days via e-Transfer or direct deposit."],
      ["h-trading", "Trading In Toward a New Purchase", "h2"],
      ["p-trading", "If you're upgrading rather than just selling, your trade-in value is applied as a credit toward your new vehicle. This also gives you an HST advantage in Ontario — you only pay tax on the price difference between the new vehicle and your trade-in value."],
      ["cta", "Start your online trade-in at planetmotors.ca/trade-in — get your offer in 60 seconds, no obligation."],
    ]),
  },

  // 9. Summer maintenance tips (originally ~Mar 2023)
  {
    _id: "blogPost-old-summer-maintenance-tips",
    _type: "blogPost",
    title: "Summer Car Maintenance Tips: Keep Your Vehicle Running Smoothly",
    slug: { _type: "slug", current: "summer-car-maintenance-tips" },
    publishedAt: "2023-03-20T12:00:00Z",
    excerpt: "High temperatures, dust, and occasional rain can strain your car's most important systems in summer. These essential maintenance tips will keep your vehicle prepared and safe.",
    seoTitle: "Summer Car Maintenance Tips for Canadian Drivers | Planet Motors",
    seoDescription: "Essential summer car maintenance tips for Canadian drivers. Oil changes, cooling system checks, tire pressure, and AC maintenance to keep your car running smoothly.",
    body: body([
      ["intro", "Canadian summers bring high temperatures, dusty roads, and occasional heavy rain that can strain your car's most critical systems. With these essential maintenance steps, your vehicle will run smoother and safer all summer long."],
      ["h-oil", "Get Your Oil and Filter Changed", "h2"],
      ["p-oil", "Extreme heat accelerates oil breakdown, reducing its ability to lubricate and protect engine components. If you're due for an oil change, don't delay — summer driving conditions (especially stop-and-go traffic and highway road trips) put extra stress on your engine. Use the oil grade recommended in your owner's manual."],
      ["h-cooling", "Check Your Cooling System", "h2"],
      ["p-cooling", "Your engine's cooling system works hardest in summer. Check coolant levels and top up if needed — the reservoir has minimum and maximum marks. Inspect radiator hoses for cracks, bulges, or soft spots. If your coolant hasn't been flushed in the last 2–3 years, consider having it done before summer road trips."],
      ["h-ac", "Test Your Air Conditioning Early", "h2"],
      ["p-ac", "Don't wait until the first heat wave to discover your AC isn't working. Run it for 10 minutes and check that it blows cold air consistently. A gradual loss of cooling usually indicates a refrigerant leak — have it inspected before it fails completely on a 35°C day."],
      ["h-tires", "Monitor Tire Pressure", "h2"],
      ["p-tires", "Heat causes air to expand, increasing tire pressure. Check your tire pressure when the tires are cold (before driving) and adjust to the manufacturer's specification — found on the sticker inside the driver's door jamb. Over-inflated tires wear unevenly and reduce traction, while under-inflated tires overheat and can blow out."],
      ["h-wipers", "Replace Windshield Wipers", "h2"],
      ["p-wipers", "Winter takes a toll on wiper blades. If they streak, skip, or chatter, replace them before summer rain arrives. Quality wiper blades cost $15–30 each and make a significant difference in visibility during thunderstorms."],
      ["h-battery", "Check Your Battery", "h2"],
      ["p-battery", "Extreme heat is actually harder on car batteries than cold. High temperatures accelerate chemical reactions inside the battery, increasing corrosion and evaporating electrolyte fluid. If your battery is over 3 years old, have it tested — replacing a failing battery at your convenience is far better than a roadside breakdown."],
      ["cta", "Planning a summer road trip? Make sure your vehicle is ready. Browse our inspected, road-trip-ready inventory at planetmotors.ca/inventory."],
    ]),
  },

  // 10. Business vehicle registration in Ontario (originally ~Feb 2023)
  {
    _id: "blogPost-old-business-vehicle-registration-ontario",
    _type: "blogPost",
    title: "How to Register a Vehicle for Your Business in Ontario",
    slug: { _type: "slug", current: "register-vehicle-business-ontario" },
    publishedAt: "2023-02-14T10:00:00Z",
    excerpt: "All vehicles in Ontario must be registered to be legal on the road. Businesses can't use a driver's licence — they need a Registration Identification Number (RIN). Here's the full process.",
    seoTitle: "Register a Business Vehicle in Ontario | Planet Motors",
    seoDescription: "How to register a vehicle under a business or corporation in Ontario. RIN applications, required documents, HST implications, and fleet purchasing tips.",
    body: body([
      ["intro", "All vehicles in Ontario must be registered to be legally driven on the road. While individuals register vehicles with their driver's licence, businesses cannot obtain a driver's licence — they cannot physically drive a vehicle. The Ontario government created the Registration Identification Number (RIN) to solve this."],
      ["h-rin", "What Is a RIN (Registration Identification Number)?", "h2"],
      ["p-rin", "A RIN is a unique number assigned to a business or corporation that allows it to register vehicles in Ontario. It functions like a driver's licence number for the purpose of vehicle registration — linking the vehicle to the business entity rather than an individual."],
      ["h-apply", "How to Get a RIN for Your Business", "h2"],
      ["p-apply", "Visit a ServiceOntario centre with: articles of incorporation or business registration documents, a valid business number (BN) from the Canada Revenue Agency, proof of business address, and government-issued photo ID of the authorized representative. The RIN is typically issued the same day."],
      ["h-register", "Registering the Vehicle", "h2"],
      ["p-register", "Once you have your RIN, vehicle registration follows the standard process: bring the bill of sale, vehicle permit (if used), safety standards certificate, and your RIN to ServiceOntario. The vehicle will be registered under the business name with the RIN as the identifier."],
      ["h-tax", "HST and Business Vehicle Purchases", "h2"],
      ["p-tax", "Businesses registered for HST can claim Input Tax Credits (ITCs) on vehicle purchases used for commercial purposes. This means you can recover the 13% HST paid on the vehicle — a significant savings on a $30,000+ purchase. Consult your accountant for specific eligibility based on your business type and vehicle use."],
      ["h-fleet", "Fleet Purchasing Tips", "h2"],
      ["p-fleet", "For businesses purchasing multiple vehicles, dealerships like Planet Motors offer fleet pricing and dedicated account management. We can help with volume discounts, custom financing arrangements, and coordinated delivery schedules. All vehicles come with our standard 210-point inspection and warranty options."],
      ["cta", "Looking for a vehicle for your business? Contact our fleet team at planetmotors.ca/contact or call 1-866-797-3332 for dedicated business purchasing assistance."],
    ]),
  },

  // 11. "Show More" post — check what might be the 11th
  // Based on the old site pattern, this is likely the earliest post
  {
    _id: "blogPost-old-why-buy-from-registered-dealer",
    _type: "blogPost",
    title: "Why You Should Buy From an OMVIC-Registered Dealer in Ontario",
    slug: { _type: "slug", current: "why-buy-omvic-registered-dealer-ontario" },
    publishedAt: "2023-01-25T11:00:00Z",
    excerpt: "Buying from an OMVIC-registered dealer gives you legal protections that private sales don't. Here's what OMVIC registration means for your next vehicle purchase.",
    seoTitle: "Why Buy From an OMVIC-Registered Dealer | Planet Motors",
    seoDescription: "Benefits of buying from an OMVIC-registered dealer in Ontario. Consumer protections, compensation fund access, mandatory disclosures, and your rights as a buyer.",
    body: body([
      ["intro", "When purchasing a vehicle in Ontario, buying from an OMVIC-registered dealer provides legal protections that private sales simply cannot match. The Ontario Motor Vehicle Industry Council (OMVIC) regulates all motor vehicle dealers in the province, ensuring fair and transparent transactions."],
      ["h-what", "What Is OMVIC?", "h2"],
      ["p-what", "OMVIC is the regulatory body that oversees Ontario's motor vehicle sales industry. All dealers must be registered with OMVIC to legally sell vehicles in Ontario. Registration requires dealers to meet standards for business practices, advertising, and consumer disclosure."],
      ["h-protections", "Consumer Protections You Get", "h2"],
      ["p-protections", "When you buy from an OMVIC-registered dealer, you're entitled to: a written contract with all terms clearly stated, full disclosure of the vehicle's history (including accidents, liens, and previous use), access to the Motor Vehicle Dealers Compensation Fund (up to $45,000 if a dealer fails to deliver), and the right to cancel within certain timeframes."],
      ["h-vs-private", "OMVIC Dealer vs Private Sale", "h2"],
      ["p-vs-private", "Private sales offer no regulatory protections. If the seller misrepresents the vehicle's condition, history, or ownership status, your only recourse is civil court — a costly and time-consuming process. With an OMVIC dealer, you have immediate access to complaint resolution and compensation mechanisms."],
      ["h-verify", "How to Verify OMVIC Registration", "h2"],
      ["p-verify", "Visit omvic.on.ca and use the dealer search tool to confirm any dealership's registration status. You can also verify individual salesperson registrations. Planet Motors is a fully registered OMVIC dealer — our registration number is displayed in our showroom and on our website."],
      ["h-planet", "Planet Motors' OMVIC Commitment", "h2"],
      ["p-planet", "As an OMVIC-registered dealer, Planet Motors adheres to the highest standards of transparency. Every vehicle comes with a detailed condition report, CARFAX history, and our 210-point inspection. We believe informed buyers are confident buyers."],
      ["cta", "Shop with OMVIC protection at planetmotors.ca/inventory — 10-day money-back guarantee, $250 refundable deposits, and Canada-wide delivery."],
    ]),
  },
]

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📝 Seeding ${oldBlogPosts.length} legacy blog posts into Sanity...`)
  console.log(`   Project: ${PROJECT_ID} | Dataset: ${DATASET}\n`)

  try {
    const result = await upsertMany(oldBlogPosts)
    console.log(`✅ Successfully seeded ${oldBlogPosts.length} blog posts`)
    console.log(`   Transaction ID: ${result.transactionId}`)

    console.log("\n📋 Posts seeded (chronological order):")
    for (const post of oldBlogPosts.sort((a, b) =>
      a.publishedAt.localeCompare(b.publishedAt)
    )) {
      console.log(`   ${post.publishedAt.slice(0, 10)} — ${post.title}`)
    }
  } catch (err) {
    console.error("❌ Failed to seed blog posts:", err)
    process.exit(1)
  }
}

main()
