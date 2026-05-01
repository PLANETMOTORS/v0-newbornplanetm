#!/usr/bin/env node
/**
 * scripts/seed-blog-full-content.mjs
 *
 * Updates the 32 seeded blog posts in Sanity with full article content
 * converted from the static HTML in lib/blog-posts/*.ts → Portable Text.
 *
 * Usage: SANITY_API_TOKEN=sk... node scripts/seed-blog-full-content.mjs
 * Safe to re-run — uses patch (set) on existing documents.
 */
import { createClient } from "@sanity/client"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

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

// ── HTML → Portable Text converter ──────────────────────────────────────────

function htmlToPortableText(html) {
  const blocks = []
  let blockIdx = 0

  // Clean up whitespace
  const cleaned = html.trim().replace(/\n\s+/g, "\n")

  // Match top-level block elements
  const tagRegex = /<(h[1-4]|p|blockquote|ul|ol)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi
  let match

  while ((match = tagRegex.exec(cleaned)) !== null) {
    const tag = match[1].toLowerCase()
    const innerHtml = match[2].trim()

    if (!innerHtml) continue

    // For ul/ol: extract <li> children and create list item blocks
    if (tag === "ul" || tag === "ol") {
      const listType = tag === "ol" ? "number" : "bullet"
      const liRegex = /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi
      let liMatch

      while ((liMatch = liRegex.exec(innerHtml)) !== null) {
        const liContent = liMatch[1].trim()
        if (!liContent) continue

        blockIdx++
        const key = `b${blockIdx}`
        const children = parseInlineMarks(liContent, key)

        blocks.push({
          _type: "block",
          _key: key,
          style: "normal",
          markDefs: [],
          children,
          listItem: listType,
          level: 1,
        })
      }
      continue
    }

    blockIdx++
    const key = `b${blockIdx}`

    let style = "normal"
    if (tag === "h1") style = "h1"
    else if (tag === "h2") style = "h2"
    else if (tag === "h3") style = "h3"
    else if (tag === "h4") style = "h4"
    else if (tag === "blockquote") style = "blockquote"

    // Parse inline marks (strong, em)
    const children = parseInlineMarks(innerHtml, key)

    blocks.push({
      _type: "block",
      _key: key,
      style,
      markDefs: [],
      children,
    })
  }

  // If no blocks were parsed (plain text without tags), create one block
  if (blocks.length === 0 && cleaned.length > 0) {
    const text = cleaned.replace(/<[^>]+>/g, "").trim()
    if (text) {
      blocks.push({
        _type: "block",
        _key: "b1",
        style: "normal",
        markDefs: [],
        children: [{ _type: "span", _key: "s1", text, marks: [] }],
      })
    }
  }

  return blocks
}

function parseInlineMarks(html, blockKey) {
  const children = []
  let spanIdx = 0

  // Remove nested tags we've already handled, strip outer li content
  let text = html

  // Process inline formatting
  const parts = splitInlineMarks(text)

  for (const part of parts) {
    spanIdx++
    children.push({
      _type: "span",
      _key: `${blockKey}-s${spanIdx}`,
      text: part.text,
      marks: part.marks,
    })
  }

  // If no children were produced, add an empty span
  if (children.length === 0) {
    children.push({
      _type: "span",
      _key: `${blockKey}-s1`,
      text: html.replace(/<[^>]+>/g, ""),
      marks: [],
    })
  }

  return children
}

function splitInlineMarks(html) {
  const parts = []
  // Simple approach: extract text with marks
  // Replace <strong>...</strong> and <em>...</em> with markers
  let remaining = html

  // Use a regex-based approach to handle interleaved formatting
  const inlineRegex = /<(strong|em|b|i)>([\s\S]*?)<\/\1>/g
  let lastIndex = 0
  let inlineMatch

  while ((inlineMatch = inlineRegex.exec(remaining)) !== null) {
    // Text before this tag
    const before = remaining.substring(lastIndex, inlineMatch.index)
    const cleanBefore = before.replace(/<[^>]+>/g, "").trim()
    if (cleanBefore) {
      parts.push({ text: cleanBefore, marks: [] })
    }

    const tag = inlineMatch[1].toLowerCase()
    const innerText = inlineMatch[2].replace(/<[^>]+>/g, "").trim()
    const marks = []
    if (tag === "strong" || tag === "b") marks.push("strong")
    if (tag === "em" || tag === "i") marks.push("em")

    if (innerText) {
      parts.push({ text: innerText, marks })
    }

    lastIndex = inlineMatch.index + inlineMatch[0].length
  }

  // Remaining text after last tag
  const after = remaining.substring(lastIndex)
  const cleanAfter = after.replace(/<[^>]+>/g, "").trim()
  if (cleanAfter) {
    parts.push({ text: cleanAfter, marks: [] })
  }

  return parts
}

// ── Extract blog post content from TS files ─────────────────────────────────

function extractPostContent() {
  const files = [
    "lib/blog-posts/ev-tesla.ts",
    "lib/blog-posts/trade-sell.ts",
    "lib/blog-posts/finance-tips.ts",
    "lib/blog-posts/market-news.ts",
  ]

  const posts = new Map()

  for (const file of files) {
    const content = readFileSync(join(__dirname, "..", file), "utf8")

    // Match each createBlogPost call with its slug and content
    const postRegex = /"([^"]+)":\s*createBlogPost\(\s*\{[^}]+\},\s*`([\s\S]*?)`,\s*\[/g
    let postMatch

    while ((postMatch = postRegex.exec(content)) !== null) {
      const slug = postMatch[1]
      const htmlContent = postMatch[2].trim()
      posts.set(slug, htmlContent)
    }
  }

  return posts
}

// ── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  const postContents = extractPostContent()
  console.log(`\n📝 Found ${postContents.size} posts with full content\n`)

  let ok = 0
  let fail = 0

  for (const [slug, html] of postContents) {
    try {
      const body = htmlToPortableText(html)

      if (body.length === 0) {
        console.log(`  ⏭  ${slug} — no content blocks produced, skipping`)
        continue
      }

      await client
        .patch(`blogPost-${slug}`)
        .set({ body })
        .commit()

      console.log(`  ✅ ${slug} (${body.length} blocks)`)
      ok++
    } catch (e) {
      console.error(`  ❌ ${slug}: ${e.message}`)
      fail++
    }
  }

  console.log(`\n📊 ${ok} updated · ${fail} failed · ${postContents.size - ok - fail} skipped`)
  if (fail > 0) process.exit(1)
}

try {
  await seed()
} catch (e) {
  console.error(e)
  process.exit(1)
}
