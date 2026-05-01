#!/usr/bin/env npx tsx
/**
 * scripts/update-blog-seo.ts
 *
 * Updates all blog posts in Sanity CMS with SEO metadata from the
 * verified handoff package (planet-motors-blog-seo-senior).
 *
 * Actions:
 *  1. Deletes the 11 placeholder "blogPost-old-*" posts
 *  2. Updates 37 existing posts with seoTitle, seoDescription, categories
 *  3. Creates 1 new post (sell-your-car-for-cash) if missing
 *
 * Usage:
 *   SANITY_API_TOKEN=<developer-token> pnpm exec tsx scripts/update-blog-seo.ts
 *
 * Safe to run multiple times — uses patch (update) and createIfNotExists.
 */

import { readFileSync } from "node:fs"
import { resolve } from "node:path"

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

async function sanityFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sanity GET ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

async function sanityMutate(mutations: Record<string, unknown>[]) {
  const res = await fetch(`${BASE_URL}/data/mutate/${DATASET}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mutations }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sanity mutate → ${res.status}: ${text}`)
  }
  return res.json()
}

// ── Portable-text helpers ──────────────────────────────────────────────────

function block(
  key: string,
  text: string,
  style: "normal" | "h2" | "h3" = "normal",
) {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }
}

// ── Slug mapping: zip canonical slug → existing Sanity slug ────────────────

const SLUG_MAP: Record<string, string> = {
  "trade-in-vs-selling-your-car-in-ontario": "trade-in-vs-selling-car-ontario",
  "tesla-full-self-driving-fsd-canada-guide": "tesla-full-self-driving-guide",
  "awd-vs-rwd-which-is-better-to-drive-in-ontario": "awd-vs-rwd-ontario",
  "we-buy-your-car-across-canada": "we-buy-your-car-canada",
  "quick-guide-sell-your-car-for-cash-in-canada": "sell-car-for-cash-canada",
  "why-choose-planet-motors-used-car-dealership-in-richmond-hill":
    "why-choose-planet-motors",
  "how-to-trade-in-your-used-car": "how-to-trade-in-used-car",
  "everything-you-need-to-know-before-you-sell-your-car":
    "sell-everything-before-sell",
  "how-to-maximize-car-resale-value-in-toronto": "car-resale-value-toronto",
  "what-are-the-tax-benefits-of-trading-in-your-car-vs-selling-it-privately":
    "tax-benefits-trade-in-vs-selling",
  "get-a-quote-in-5-minutes-from-planet-motors": "get-quote-5-minutes",
  "how-to-sell-a-financed-car-in-canada": "sell-financed-car-canada",
  "how-to-sell-a-car-in-toronto-a-comprehensive-guide":
    "sell-car-toronto-guide",
  "tesla-cybertruck-a-revolutionary-electric-pickup-in-2024":
    "tesla-cybertruck-2024",
  "equifaxs-new-initiative-lets-newcomers-import-their-credit-scores-to-canada":
    "equifax-newcomers-credit-canada",
  "the-future-of-autonomous-vehicles-tesla-unveils-robotaxi-and-robovan":
    "tesla-robotaxi-robovan",
  "new-trends-in-ev-cars-leading-the-charge-at-planet-motors-canada":
    "ev-trends-planet-motors",
  "car-deliveries-in-canada-what-you-need-to-know": "car-deliveries-canada",
  "understanding-apr-in-car-loans-what-you-need-to-know":
    "understanding-apr-car-loans",
  "the-best-cars-for-fall-and-winter-2024-your-guide-to-staying-safe-and-comfortable-on-the-road":
    "top-cars-fall-winter-2024",
  "top-pre-owned-vehicles-to-consider-in-2024": "top-preowned-vehicles-2024",
  "tesla-model-y-the-future-of-evs-at-your-fingertips":
    "tesla-model-y-future-ev",
  "a-beginners-guide-to-first-time-car-buyer-financing-in-canada":
    "first-time-car-buyer-financing",
  "learn-about-the-best-selling-electric-cars-in-canada-2023":
    "best-selling-electric-cars-canada-2023",
  "honda-says-it-will-bring-back-the-civic-hybrid-in-2024":
    "honda-civic-hybrid-2024",
}

// ── Load zip data ──────────────────────────────────────────────────────────

interface ZipPost {
  slug: string
  title: string
  seoTitle: string
  metaDescription: string
  excerpt: string
  category: string
  categoryLabel: string
  tags: string[]
  datePublished: string
  body: { type: string; level?: number; text?: string; items?: string[] }[]
  faq?: { question: string; answer: string }[]
}

const zipDataPath = resolve(
  "/tmp/blog-seo/planet-motors-blog-seo-senior/content/blog-posts.json",
)
const zipPosts: ZipPost[] = JSON.parse(readFileSync(zipDataPath, "utf-8"))

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n📝 Blog SEO Update Script")
  console.log(`   Project: ${PROJECT_ID} | Dataset: ${DATASET}\n`)

  // 1. Get current Sanity posts
  interface SanityPost {
    _id: string
    slug: string
    title: string
    seoTitle?: string
    seoDescription?: string
  }
  const { result: sanityPosts } = await sanityFetch<{ result: SanityPost[] }>(
    `/data/query/${DATASET}?query=${encodeURIComponent(
      '*[_type=="blogPost"] {"slug": slug.current, _id, title, seoTitle, seoDescription}',
    )}`,
  )
  const _sanityById = new Map(sanityPosts.map((p) => [p._id, p]))
  const sanityBySlug = new Map(sanityPosts.map((p) => [p.slug, p]))

  console.log(`   Found ${sanityPosts.length} existing posts in Sanity\n`)

  // 2. Delete the 11 placeholder posts
  const placeholderIds = sanityPosts
    .filter((p) => p._id.startsWith("blogPost-old-"))
    .map((p) => p._id)

  if (placeholderIds.length > 0) {
    console.log(`🗑️  Deleting ${placeholderIds.length} placeholder posts...`)
    const deleteMutations = placeholderIds.map((id) => ({ delete: { id } }))
    await sanityMutate(deleteMutations)
    for (const id of placeholderIds) {
      console.log(`   ✓ Deleted ${id}`)
    }
    console.log()
  }

  // 3. Update existing posts with SEO metadata from zip
  const patchMutations: Record<string, unknown>[] = []
  let updatedCount = 0
  let createdCount = 0

  for (const zipPost of zipPosts) {
    const sanitySlug = SLUG_MAP[zipPost.slug] ?? zipPost.slug
    const existing = sanityBySlug.get(sanitySlug)

    if (existing) {
      // Patch existing post with SEO fields
      patchMutations.push({
        patch: {
          id: existing._id,
          set: {
            seoTitle: zipPost.seoTitle,
            seoDescription: zipPost.metaDescription,
            excerpt: zipPost.excerpt,
            categories: [zipPost.categoryLabel],
          },
        },
      })
      updatedCount++
    } else {
      // Create new post — only sell-your-car-for-cash should hit this
      const bodyBlocks = zipPost.body.map((b, i) => {
        const key = `b${i.toString().padStart(3, "0")}`
        if (b.type === "heading") {
          const style = b.level === 3 ? "h3" : "h2"
          return block(key, b.text ?? "", style)
        }
        if (b.type === "list" && b.items) {
          return {
            _type: "block",
            _key: key,
            style: "normal",
            markDefs: [],
            listItem: "bullet",
            children: [
              {
                _type: "span",
                _key: `${key}-s`,
                text: b.items.join("\n• "),
                marks: [],
              },
            ],
          }
        }
        return block(key, b.text ?? "")
      })

      const newId = `blogPost-${sanitySlug}`
      patchMutations.push({
        createIfNotExists: {
          _id: newId,
          _type: "blogPost",
          title: zipPost.title,
          slug: { _type: "slug", current: sanitySlug },
          publishedAt: `${zipPost.datePublished}T00:00:00.000Z`,
          seoTitle: zipPost.seoTitle,
          seoDescription: zipPost.metaDescription,
          excerpt: zipPost.excerpt,
          categories: [zipPost.categoryLabel],
          body: bodyBlocks,
        },
      })
      createdCount++
      console.log(`   + Creating: ${sanitySlug}`)
    }
  }

  // Execute all mutations in a single transaction
  if (patchMutations.length > 0) {
    console.log(
      `\n📤 Applying ${patchMutations.length} mutations (${updatedCount} updates, ${createdCount} creates)...`,
    )
    const result = await sanityMutate(patchMutations)
    const txnId =
      (result as { transactionId?: string }).transactionId ?? "unknown"
    console.log(`✅ Transaction ID: ${txnId}`)
  }

  // 4. Verify final count
  const { result: finalCount } = await sanityFetch<{ result: number }>(
    `/data/query/${DATASET}?query=${encodeURIComponent(
      'count(*[_type=="blogPost"])',
    )}`,
  )
  console.log(`\n📊 Final blog post count: ${finalCount}`)
  console.log(`   Updated SEO on: ${updatedCount} posts`)
  console.log(`   Created new: ${createdCount} posts`)
  console.log(`   Deleted placeholders: ${placeholderIds.length} posts\n`)
}

main().catch((err) => {
  console.error("❌ Fatal error:", err)
  process.exit(1)
})
