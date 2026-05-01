#!/usr/bin/env node
/**
 * scripts/seed-toronto-selling-guide.mjs
 *
 * Seeds the "How to Sell Your Car in Toronto: The 2026 GTA Owner's Guide"
 * blog post into Sanity production dataset with full Portable Text content.
 *
 * Usage: SANITY_API_TOKEN=sk... node scripts/seed-toronto-selling-guide.mjs
 * Safe to re-run — uses createOrReplace with deterministic _id.
 */
import { createClient } from "@sanity/client"

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "wlxj8olw"
const TOKEN = process.env.SANITY_API_TOKEN

if (!TOKEN) {
  console.error("SANITY_API_TOKEN is required.")
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: "production",
  apiVersion: "2025-04-01",
  token: TOKEN,
  useCdn: false,
})

// ── Post metadata ───────────────────────────────────────────────────────────

const SLUG = "sell-your-car-toronto-2026-guide"
const POST = {
  _id: `blogPost-${SLUG}`,
  _type: "blogPost",
  title: "How to Sell Your Car in Toronto: The 2026 GTA Owner's Guide",
  slug: { _type: "slug", current: SLUG },
  publishedAt: new Date("2026-04-29").toISOString(),
  excerpt:
    "The guide GTA drivers need to sell a car in Toronto in 2026. Pricing, Safety Standard Certificates, MTO paperwork, and the EV battery health step most sellers miss.",
  categories: ["Selling Guides"],
  seoTitle:
    "How to Sell Your Car in Toronto: The 2026 GTA Owner's Guide | Planet Motors",
  seoDescription:
    "The guide GTA drivers need to sell a car in Toronto in 2026. Pricing, Safety Standard Certificates, MTO paperwork, and the EV battery health step most sellers miss.",
}

// ── Portable Text body ──────────────────────────────────────────────────────

function span(key, text, marks = []) {
  return { _type: "span", _key: key, text, marks }
}

function block(key, style, children, extra = {}) {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children,
    ...extra,
  }
}

const body = [
  // H1
  block("b1", "h1", [
    span("s1", "How to Sell Your Car in Toronto: The 2026 GTA Owner's Guide"),
  ]),

  // Lede / deck
  block("b2", "normal", [
    span(
      "s2",
      "Pricing, paperwork, and the one verification step most sellers miss, written for drivers from the Lakeshore to North York.",
      ["em"]
    ),
  ]),

  // Intro paragraph
  block("b3", "normal", [
    span(
      "s3",
      "Selling a car in the GTA should feel simple, but for most owners it does not. Between the Safety Standard Certificate, the Used Vehicle Information Package, and the challenge of pricing your car against the spring market, most sellers leave somewhere between $1,500 and $4,000 on the table. The reason is rarely that the car was worth less. The reason is that the seller did not know how to prove what it was worth."
    ),
  ]),

  block("b4", "normal", [
    span(
      "s4",
      "This guide is the playbook our finance and acquisition teams at Planet Motors use every day. It works whether you are trading in, selling privately, or upgrading from a gas vehicle to your first EV. There is no fluff here. Just the steps, in order, that get a car sold cleanly in Toronto."
    ),
  ]),

  // Callout: What is New for 2026
  block("b5", "blockquote", [
    span("s5a", "What is New for 2026", ["strong"]),
  ]),
  block("b5b", "blockquote", [
    span(
      "s5b",
      "Two things have shifted the GTA market this year. The first is that EV demand recovered sharply after the federal incentive pause, which means battery health documentation now drives EV resale value more than mileage or trim. The second is that OMVIC tightened its reporting requirements, which has made vehicle history transparency a hard expectation among GTA buyers rather than a nice to have."
    ),
  ]),

  // Step 01
  block("b6", "h2", [
    span(
      "s6",
      "Step 01. Price for the Toronto Market, Not the Canadian Average"
    ),
  ]),

  block("b7", "normal", [
    span(
      "s7",
      "Most online valuation tools give you a national average, and Toronto is not average. A 2022 Tesla Model Y in Mississauga commands $4,000 to $6,000 more than the same vehicle in Halifax. A clean history RAV4 Hybrid in North York moves in days. In smaller markets, the same car might sit for a month."
    ),
  ]),

  block("b8", "normal", [
    span(
      "s8",
      "Use this three source method to land on a defensible asking price."
    ),
  ]),

  // Ordered list
  block(
    "b9",
    "normal",
    [
      span("s9a", "AutoTrader's Price Analysis tool.", ["strong"]),
      span(
        "s9b",
        " Filter by your exact trim, year, and a 100 kilometre radius from M5V. This is your floor."
      ),
    ],
    { listItem: "number", level: 1 }
  ),
  block(
    "b10",
    "normal",
    [
      span("s10a", "CarGurus Instant Market Value.", ["strong"]),
      span(
        "s10b",
        " This gives you the median asking price for active GTA listings. Treat it as your ceiling."
      ),
    ],
    { listItem: "number", level: 1 }
  ),
  block(
    "b11",
    "normal",
    [
      span("s11a", "The Black Book trade in estimate.", ["strong"]),
      span(
        "s11b",
        " Request one from any OMVIC registered dealer. We publish ours free. Treat this as your walk away number for trade."
      ),
    ],
    { listItem: "number", level: 1 }
  ),

  block("b12", "normal", [
    span(
      "s12",
      "Your private sale price should land in the upper third of the range between AutoTrader and CarGurus. Above that, your phone goes silent. Below that, you are funding the buyer's vacation."
    ),
  ]),

  // Pullquote
  block("b13", "blockquote", [
    span(
      "s13",
      "The Toronto market punishes vague listings and rewards proof. The seller with documentation always wins the negotiation."
    ),
  ]),

  // Step 02
  block("b14", "h2", [
    span(
      "s14",
      "Step 02. Get a Safety Standard Certificate, and Time It Right"
    ),
  ]),

  block("b15", "normal", [
    span(
      "s15a",
      "Ontario's Safety Standard Certificate is non negotiable if your buyer plans to register the car for road use. It costs $80 to $150 at most licensed shops in the GTA, and it is valid for "
    ),
    span("s15b", "36 days from the date of inspection", ["strong"]),
    span("s15c", "."),
  ]),

  block("b16", "normal", [
    span(
      "s16",
      "That 36 day window matters. If you get the certificate too early, it expires before your buyer registers. If you get it too late, serious buyers walk away. Our recommendation is to book the inspection the same week you list, and only after a pre inspection at a shop you trust. A failed Safety Standard Certificate becomes a public record at most chains, and that record can spook later buyers."
    ),
  ]),

  block("b17", "h3", [
    span(
      "s17",
      "Common Safety Standard Certificate fail points in 2026 GTA inspections"
    ),
  ]),

  // Unordered list — fail points
  block(
    "b18",
    "normal",
    [
      span(
        "s18",
        "Tire tread below 1.5 millimetres. Winter wear is the number one surprise on spring sales."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b19",
    "normal",
    [
      span(
        "s19",
        "Worn ball joints on AWD crossovers, including the RAV4, CR-V, and Highlander."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b20",
    "normal",
    [
      span(
        "s20",
        "Cracked windshields, even hairline ones. Ontario tolerates none in the wiper sweep."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b21",
    "normal",
    [span("s21", "Brake pad thickness under 3 millimetres.")],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b22",
    "normal",
    [
      span(
        "s22",
        "Failed parking brake on Teslas. This is a known service centre issue and is easily fixed."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),

  // Step 03
  block("b23", "h2", [
    span("s23", "Step 03. Assemble Your MTO Document Package"),
  ]),

  block("b24", "normal", [
    span(
      "s24a",
      "This is where private sales fall apart. The buyer arrives with cash, you hand over the keys, and three weeks later you get a call from ServiceOntario because something was not signed correctly. The fix is a clean, complete document package "
    ),
    span("s24b", "before", ["em"]),
    span("s24c", " the buyer arrives."),
  ]),

  // Checklist items
  block(
    "b25",
    "normal",
    [
      span("s25a", "Used Vehicle Information Package.", ["strong"]),
      span(
        "s25b",
        " $20 from ServiceOntario. Mandatory. Order it before you list."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b26",
    "normal",
    [
      span("s26a", "Vehicle Ownership Permit.", ["strong"]),
      span(
        "s26b",
        " Sign over the green portion to the buyer, and keep the blue."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b27",
    "normal",
    [
      span("s27a", "Safety Standard Certificate.", ["strong"]),
      span(
        "s27b",
        " Original copy, dated within 36 days of the buyer's registration."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b28",
    "normal",
    [
      span("s28a", "Bill of Sale.", ["strong"]),
      span(
        "s28b",
        " Name, address, driver's license, VIN, odometer reading, sale price, signed by both parties."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b29",
    "normal",
    [
      span("s29a", "Service records.", ["strong"]),
      span(
        "s29b",
        " Even informal receipts help. They add 3 to 5 percent to perceived value in the GTA market."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b30",
    "normal",
    [
      span("s30a", "Lien release letter.", ["strong"]),
      span(
        "s30b",
        " If you have ever had a loan on the vehicle, get this in writing from your lender. Buyers who do their homework will check."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),

  // Step 04
  block("b31", "h2", [
    span("s31", "Step 04. Choose Your Selling Path Honestly"),
  ]),

  block("b32", "normal", [
    span(
      "s32",
      "There are three viable paths in 2026, and the right one depends less on the dollar amount and more on how much friction you are willing to absorb."
    ),
  ]),

  block("b33", "h3", [span("s33", "Private Sale")]),
  block("b34", "normal", [
    span(
      "s34",
      "This path delivers the highest gross return, typically 8 to 15 percent above trade. The cost is your time. Plan on 4 to 8 hours building listings, another 6 to 12 hours on showings and tire kickers, and you carry liability if the car develops a problem after the sale. This route works best for clean, in demand vehicles under 80,000 kilometres."
    ),
  ]),

  block("b35", "h3", [span("s35", "Trade In at a Dealer")]),
  block("b36", "normal", [
    span(
      "s36",
      "The gross return is lower, but you save HST on your replacement vehicle. In Ontario, that saving is 13 percent of the trade value, applied automatically. On a $30,000 trade against a $60,000 purchase, the tax saving comes to $3,900, which often closes most of the gap to private sale pricing. Add zero hours of effort and zero post sale liability."
    ),
  ]),

  block("b37", "h3", [span("s37", "Consignment")]),
  block("b38", "normal", [
    span(
      "s38",
      "Consignment is the hybrid path. A licensed dealer markets your vehicle for you and remits the proceeds minus a flat fee or percentage. This works best for higher value vehicles above $40,000, where the gross return matters and you want the protection of a registered intermediary handling the paperwork."
    ),
  ]),

  // Step 05
  block("b39", "h2", [
    span("s39", "Step 05. If You Are Selling an EV, Read This Twice"),
  ]),

  block("b40", "normal", [
    span(
      "s40",
      "EV resale in 2026 has split in two. Cars with documented battery health sell at full market value. Cars without documentation are getting offers 12 to 18 percent below book, and sometimes more, because buyers have learned to assume the worst."
    ),
  ]),

  block("b41", "normal", [
    span(
      "s41",
      "An EV battery represents 35 to 45 percent of the vehicle's replacement cost. Verified condition protects every dollar of resale value.",
      ["em"]
    ),
  ]),

  block("b42", "normal", [
    span(
      "s42",
      "The reason is simple. An EV battery represents 35 to 45 percent of the vehicle's replacement cost. An unverified battery is unpriced risk, and the GTA's increasingly informed buyer base now expects proof. Two identical 2021 Model 3 Long Range vehicles with 80,000 kilometres on the clock can vary by more than $4,000 in true market value depending on state of health."
    ),
  ]),

  // Callout: The Aviloo Difference
  block("b43", "blockquote", [
    span("s43", "The Aviloo Difference", ["strong"]),
  ]),
  block("b44", "blockquote", [
    span(
      "s44a",
      "Every EV and PHEV at Planet Motors arrives with an "
    ),
    span("s44b", "Aviloo State of Health certificate", ["strong"]),
    span(
      "s44c",
      ". This is an independent, manufacturer grade battery diagnostic that has become standard practice in European EV markets, and it is the only credential of its kind we have seen in Canadian retail."
    ),
  ]),
  block("b45", "blockquote", [
    span(
      "s45",
      "If you choose to sell your EV through us on consignment or trade, that same certificate is attached to your sale. It is the single highest leverage step you can take to protect your vehicle's value."
    ),
  ]),

  block("b46", "normal", [
    span(
      "s46",
      "The Aviloo report turns \"the battery is probably fine\" into a number every buyer can verify.",
      ["em"]
    ),
  ]),

  // Step 06
  block("b47", "h2", [
    span("s47", "Step 06. Avoid These Five GTA Specific Mistakes"),
  ]),

  block(
    "b48",
    "normal",
    [
      span("s48a", "Listing on a Sunday night.", ["strong"]),
      span(
        "s48b",
        " Toronto's used car market peaks Tuesday through Thursday. Sunday listings get buried by Monday morning's batch."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b49",
    "normal",
    [
      span("s49a", "Photographing in your driveway.", ["strong"]),
      span(
        "s49b",
        " Move the car to a clean, neutral background. An empty parking lot or a quiet side street works well. Anywhere without recycling bins. This single change measurably increases inquiries."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b50",
    "normal",
    [
      span("s50a", "Refusing certified bank drafts.", ["strong"]),
      span(
        "s50b",
        " They are traceable, reversible only with a court order, and do not carry the fraud risk of an e-Transfer over the daily limit."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b51",
    "normal",
    [
      span(
        "s51a",
        "Selling the car before paying off the lien.",
        ["strong"]
      ),
      span(
        "s51b",
        " The buyer cannot register a vehicle with an active lien. Pay it off first, or use a dealer to handle the simultaneous transaction."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),
  block(
    "b52",
    "normal",
    [
      span(
        "s52a",
        "Skipping the Bill of Sale because the buyer seems nice.",
        ["strong"]
      ),
      span(
        "s52b",
        " Every fraud claim we have ever seen at our dealership started with a missing or incomplete Bill of Sale."
      ),
    ],
    { listItem: "bullet", level: 1 }
  ),

  // CTA section
  block("b53", "h3", [
    span("s53", "Skip the steps. Get a real offer in 24 hours."),
  ]),

  block("b54", "normal", [
    span(
      "s54",
      "Planet Motors buys clean GTA vehicles directly. We work with EVs, hybrids, gas vehicles, and lease returns. Our offers come with Aviloo verification and OMVIC protected paperwork, and there is no obligation to accept."
    ),
  ]),

  // FAQ section
  block("b55", "h2", [span("s55", "Frequently Asked Questions")]),

  block("b56", "h3", [
    span(
      "s56",
      "How long does a Safety Standard Certificate last in Ontario?"
    ),
  ]),
  block("b57", "normal", [
    span(
      "s57",
      "A Safety Standard Certificate is valid for 36 days from the date of inspection. The buyer must register the vehicle within that window, otherwise you will need to pay for a re-inspection."
    ),
  ]),

  block("b58", "h3", [
    span(
      "s58",
      "Do I need a Safety Standard Certificate to sell privately?"
    ),
  ]),
  block("b59", "normal", [
    span(
      "s59",
      "You can sell without one, but the vehicle must be sold as is, and the buyer cannot register it for road use until they obtain one. Most GTA buyers will not pay full market value for an as is vehicle."
    ),
  ]),

  block("b60", "h3", [
    span(
      "s60",
      "How is a used Tesla or EV valued differently from a gas car?"
    ),
  ]),
  block("b61", "normal", [
    span(
      "s61",
      "EV resale is heavily influenced by battery state of health. Two identical vehicles with different battery degradation can vary by thousands of dollars. A certified battery report, such as an Aviloo state of health certificate, lets you prove your battery condition and command full market value."
    ),
  ]),

  block("b62", "h3", [
    span(
      "s62",
      "What documents do I need to sell my car in Ontario?"
    ),
  ]),
  block("b63", "normal", [
    span(
      "s63",
      "You need a Used Vehicle Information Package from ServiceOntario, a signed Bill of Sale, the vehicle ownership permit (the green portion goes to the buyer), and a valid Safety Standard Certificate if the buyer plans to plate the vehicle."
    ),
  ]),

  block("b64", "h3", [
    span(
      "s64",
      "Is it better to trade in my car or sell it privately in Toronto?"
    ),
  ]),
  block("b65", "normal", [
    span(
      "s65",
      "Private sales typically yield 8 to 15 percent more, but trade ins reduce HST owed on a replacement vehicle, save weeks of effort, and eliminate liability after the sale. For most GTA owners, the after tax difference is smaller than they expect."
    ),
  ]),
]

// ── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(
    `\nSeeding blog post: "${POST.title}" (slug: ${SLUG})\n`
  )

  try {
    await client.createOrReplace({
      ...POST,
      body,
    })
    console.log(`  Done — ${SLUG} created with ${body.length} Portable Text blocks`)
  } catch (e) {
    console.error(`  Failed: ${e.message}`)
    process.exit(1)
  }
}

try {
  await seed()
} catch (e) {
  console.error(e)
  process.exit(1)
}
