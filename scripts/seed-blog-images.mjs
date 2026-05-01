#!/usr/bin/env node
/**
 * scripts/seed-blog-images.mjs
 * Uploads blog cover images to Sanity CDN and links them to existing blog posts.
 * Usage: SANITY_API_TOKEN=sk... node scripts/seed-blog-images.mjs
 * Requires an Editor/Developer-level token (write access).
 * Safe to re-run — uses patch to update coverImage on existing documents.
 */
import { createClient } from "@sanity/client"
import { readFileSync } from "fs"
import { resolve, extname } from "path"

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "wlxj8olw"
const TOKEN = process.env.SANITY_API_TOKEN

if (!TOKEN) {
  console.error("❌ SANITY_API_TOKEN is required (Editor or Developer level).")
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: "production",
  apiVersion: "2025-04-01",
  token: TOKEN,
  useCdn: false,
})

/**
 * slug → local image path (relative to repo root).
 * Verified against lib/blog-posts/*.ts static data.
 */
const slugImageMap = [
  // ev-tesla.ts
  { slug: "check-battery-health-used-tesla-canada", image: "public/images/blog/8.png" },
  { slug: "trading-in-car-with-loan-canada", image: "public/images/blog/IMG_3792-scaled.jpg" },
  { slug: "buying-used-tesla-canada-2026-guide", image: "public/images/blog/IMG_4474-scaled.jpg" },
  { slug: "increase-car-value-before-selling-ontario", image: "public/images/blog/Untitled-design-20.png" },
  { slug: "tesla-warranty-used-cars", image: "public/images/blog/IMG_1903-2-scaled.jpg" },
  { slug: "trade-in-vs-selling-car-ontario", image: "public/images/blog/Mode-2-2.png" },
  { slug: "tesla-full-self-driving-guide", image: "public/images/blog/Mode-2-1.png" },
  { slug: "biweekly-vs-monthly-payments-canada", image: "public/images/blog/Mode-2.png" },

  // trade-sell.ts
  { slug: "tesla-model-y-vs-model-3", image: "public/images/blog/Mode.png" },
  { slug: "awd-vs-rwd-ontario", image: "public/images/blog/Banner-2-1.png" },
  { slug: "we-buy-your-car-canada", image: "public/images/blog/image-1-1024x579-1.jpg" },
  { slug: "sell-car-for-cash-canada", image: "public/images/blog/image-4-1024x579-1.png" },
  { slug: "why-choose-planet-motors", image: "public/images/blog/image-2-1024x572-1.png" },
  { slug: "how-to-trade-in-used-car", image: "public/images/blog/image-1-1024x572-1.png" },
  { slug: "car-resale-value-toronto", image: "public/images/blog/unnamed-2.jpg" },
  { slug: "tax-benefits-trade-in-vs-selling", image: "public/images/blog/unnamed-5.jpg" },

  // finance-tips.ts
  { slug: "sell-financed-car-canada", image: "public/images/blog/unnamed-8.jpg" },
  { slug: "sell-car-toronto-guide", image: "public/images/blog/unnamed-9.jpg" },
  { slug: "sell-everything-before-sell", image: "public/images/blog/unnamed.jpg" },
  { slug: "get-quote-5-minutes", image: "public/images/blog/unnamed-6.jpg" },
  { slug: "tesla-cybertruck-2024", image: "public/images/blog/blog-2.png" },
  { slug: "equifax-newcomers-credit-canada", image: "public/images/blog/blog-1.png" },
  { slug: "tesla-robotaxi-robovan", image: "public/images/blog/blog-3.png" },
  { slug: "ev-trends-planet-motors", image: "public/images/blog/blog-4.png" },

  // market-news.ts
  { slug: "car-deliveries-canada", image: "public/images/blog/blog-6.png" },
  { slug: "understanding-apr-car-loans", image: "public/images/blog/blog6-1.png" },
  { slug: "top-cars-fall-winter-2024", image: "public/images/blog/blog7-1.jpg" },
  { slug: "top-preowned-vehicles-2024", image: "public/images/blog/blog-8.png" },
  { slug: "tesla-model-y-future-ev", image: "public/images/blog/blog9-1.jpg" },
  { slug: "first-time-car-buyer-financing", image: "public/images/blog/blog-10.png" },
  { slug: "best-selling-electric-cars-canada-2023", image: "public/images/blog/blog-11.png" },
  { slug: "honda-civic-hybrid-2024", image: "public/images/blog/blog12-1.jpg" },

  // 4 original Sanity-only posts (no static images — assign defaults)
  { slug: "top-5-electric-vehicles-canadian-winters", image: "public/images/blog/Mode-2.png", docId: "blog-1" },
  { slug: "best-trade-in-value-ontario", image: "public/images/blog/Banner-2-1.png", docId: "blog-2" },
  { slug: "auto-financing-canada-complete-guide", image: "public/images/blog/blog-2.png", docId: "blog-3" },
  { slug: "aviloo-battery-health-reports-ev-buyers", image: "public/images/blog/8.png", docId: "blog-4" },
]

const CONTENT_TYPE_MAP = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
}

async function uploadAndLink() {
  console.log(`\n🖼️  Uploading ${slugImageMap.length} blog cover images → Sanity project ${PROJECT_ID}\n`)
  let ok = 0
  let fail = 0

  for (const entry of slugImageMap) {
    const docId = entry.docId ?? `blogPost-${entry.slug}`
    try {
      const filePath = resolve(process.cwd(), entry.image)
      const ext = extname(filePath).toLowerCase()
      const contentType = CONTENT_TYPE_MAP[ext] ?? "image/png"
      const buffer = readFileSync(filePath)

      const asset = await client.assets.upload("image", buffer, {
        filename: entry.image.split("/").pop(),
        contentType,
      })

      await client.patch(docId).set({
        coverImage: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
        },
      }).commit()

      console.log(`  ✅ ${entry.slug} → ${asset.url}`)
      ok++
    } catch (e) {
      console.error(`  ❌ ${entry.slug}: ${e.message}`)
      fail++
    }
  }

  console.log(`\n📊 ${ok} uploaded · ${fail} failed`)
  if (fail > 0) process.exit(1)
}

try {
  await uploadAndLink()
} catch (e) {
  console.error(e)
  process.exit(1)
}
