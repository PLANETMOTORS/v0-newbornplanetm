#!/usr/bin/env node
/**
 * Planet Motors — Sanity Data Integrity Check
 * ============================================
 * Runs GROQ-powered health checks against the production dataset.
 * Exits 0 on pass, 1 on failure (fails CI).
 *
 * Usage:
 *   node scripts/sanity-check.js
 *   SANITY_PROJECT_ID=wlxj8olw SANITY_DATASET=production SANITY_API_TOKEN=sk... node scripts/sanity-check.js
 */

const { createClient } = require('@sanity/client')

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'wlxj8olw'
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET    || process.env.SANITY_DATASET    || 'production'
const TOKEN      = process.env.SANITY_API_TOKEN || ''

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  useCdn:    false,
  token:     TOKEN,
  apiVersion: '2025-04-01',
})

/**
 * Pre-flight: verify the token is valid and authorized for this project.
 * Exits 1 immediately with a clear configuration-error message if it is not,
 * so that operators see one actionable line instead of 22 identical auth errors.
 */
async function verifyAuth() {
  if (!TOKEN) {
    console.error('\n❌ Configuration error: SANITY_API_TOKEN is not set.')
    console.error('   To fix: add a Viewer (or higher) API token for project')
    console.error(`   "${PROJECT_ID}" as the SANITY_API_TOKEN GitHub secret.`)
    console.error('   Generate one at https://www.sanity.io/manage → API → Tokens\n')
    process.exit(1)
  }
  try {
    // A universal GROQ query that returns an empty array in any schema — used
    // only to verify that the token is accepted by the API.
    await client.fetch('*[0..0]{_id}')
  } catch (err) {
    const isAuthError =
      err.statusCode === 401 ||
      err.statusCode === 403 ||
      /project user not found/i.test(err.message) ||
      /unauthorized/i.test(err.message) ||
      /forbidden/i.test(err.message)

    if (isAuthError) {
      console.error('\n❌ Configuration error: SANITY_API_TOKEN is not authorized for this project.')
      console.error(`   Project : ${PROJECT_ID}`)
      console.error(`   Dataset : ${DATASET}`)
      console.error(`   Detail  : ${err.message}`)
      console.error('\n   To fix:')
      console.error('   1. Open https://www.sanity.io/manage and select project "' + PROJECT_ID + '"')
      console.error('   2. Go to API → Tokens and create a new Viewer token.')
      console.error('   3. Update the SANITY_API_TOKEN secret in GitHub → Settings → Secrets.\n')
      process.exit(1)
    }
    // Re-throw unexpected errors so they surface normally.
    throw err
  }
}

let passed = 0
let failed = 0
const errors = []

async function check(label, query, validator) {
  try {
    const result = await client.fetch(query)
    const ok = validator(result)
    if (ok) {
      console.log(`  ✅ ${label}`)
      passed++
    } else {
      console.error(`  ❌ ${label} — FAILED (result: ${JSON.stringify(result)})`)
      errors.push(label)
      failed++
    }
  } catch (err) {
    console.error(`  ❌ ${label} — ERROR: ${err.message}`)
    errors.push(`${label}: ${err.message}`)
    failed++
  }
}

async function run() {
  console.log(`\n🔍 Sanity Data Integrity Check`)
  console.log(`   Project: ${PROJECT_ID}  Dataset: ${DATASET}\n`)

  await verifyAuth()

  // ─── 1. CORE SINGLETON DOCUMENTS ────────────────────────────────────────────
  console.log('── Core Singleton Documents ──')
  await check(
    'homepage document exists',
    `count(*[_type == "homepage" && !(_id in path("drafts.**"))])`,
    (n) => n >= 1
  )
  await check(
    'siteSettings document exists',
    `count(*[_type == "siteSettings" && !(_id in path("drafts.**"))])`,
    (n) => n >= 1
  )
  await check(
    'navigation document exists',
    `count(*[_type == "navigation" && !(_id in path("drafts.**"))])`,
    (n) => n >= 1
  )
  await check(
    'inventorySettings document exists',
    `count(*[_type == "inventorySettings" && !(_id in path("drafts.**"))])`,
    (n) => n >= 1
  )
  await check(
    'financingPage document exists',
    `count(*[_type == "financingPage" && !(_id in path("drafts.**"))])`,
    (n) => n >= 1
  )
  await check(
    'sellYourCarPage document exists',
    `count(*[_type == "sellYourCarPage" && !(_id in path("drafts.**"))])`,
    (n) => n >= 1
  )
  await check(
    'aiSettings document exists',
    `count(*[_type == "aiSettings" && !(_id in path("drafts.**"))])`,
    (n) => n >= 1
  )

  // ─── 2. HOMEPAGE HERO CONTENT ────────────────────────────────────────────────
  console.log('\n── Homepage Hero Content ──')
  await check(
    'homepage.heroSection.headline is set',
    `*[_type == "homepage"][0].heroSection.headline`,
    (v) => typeof v === 'string' && v.length > 0
  )
  await check(
    'homepage.heroSection.subheadline is set',
    `*[_type == "homepage"][0].heroSection.subheadline`,
    (v) => typeof v === 'string' && v.length > 0
  )
  await check(
    'homepage.heroSection.primaryCta exists',
    `defined(*[_type == "homepage"][0].heroSection.primaryCta)`,
    (v) => v === true
  )

  // ─── 3. SYNC: PUBLISHED vs DRAFT COUNT ──────────────────────────────────────
  console.log('\n── Published vs Draft Sync ──')
  await check(
    'No orphaned drafts (draft without published counterpart)',
    `count(*[_id in path("drafts.**") && !defined(*[_id == string::split(^._id, "drafts.")[1]][0])])`,
    (n) => n === 0
  )
  await check(
    'Published document count ≥ 7 (core singletons)',
    `count(*[!(_id in path("drafts.**")) && !(_id in path("_.groups.**")) && !(_id in path("_.retention.**"))])`,
    (n) => n >= 7
  )

  // ─── 4. DATA INTEGRITY: MISSING REQUIRED FIELDS ─────────────────────────────
  console.log('\n── Data Integrity ──')
  await check(
    'No blogPost missing slug',
    `count(*[_type == "blogPost" && !defined(slug.current)])`,
    (n) => n === 0
  )
  await check(
    'No blogPost missing title',
    `count(*[_type == "blogPost" && !defined(title)])`,
    (n) => n === 0
  )
  await check(
    'No testimonial missing name',
    `count(*[_type == "testimonial" && !defined(name)])`,
    (n) => n === 0
  )
  await check(
    'No protectionPlan missing title',
    `count(*[_type == "protectionPlan" && !defined(title)])`,
    (n) => n === 0
  )

  // ─── 5. BROKEN REFERENCES ───────────────────────────────────────────────────
  console.log('\n── Broken References ──')
  await check(
    'No documents with broken author references',
    `count(*[defined(author._ref) && !defined(author->)])`,
    (n) => n === 0
  )

  // ─── 6. GROQ QUERY TYPE PARITY ──────────────────────────────────────────────
  console.log('\n── GROQ Query Type Parity (website ↔ Sanity) ──')
  await check(
    'SELL_YOUR_CAR_PAGE_QUERY: sellYourCarPage type exists',
    `count(*[_type == "sellYourCarPage"])`,
    (n) => n >= 1
  )
  await check(
    'FINANCING_PAGE_QUERY: financingPage type exists',
    `count(*[_type == "financingPage"])`,
    (n) => n >= 1
  )
  await check(
    'HOMEPAGE_QUERY: homepage type exists',
    `count(*[_type == "homepage"])`,
    (n) => n >= 1
  )

  // ─── 7. DUPLICATE DETECTION ─────────────────────────────────────────────────
  console.log('\n── Duplicate Detection ──')
  await check(
    'No duplicate homepage documents',
    `count(*[_type == "homepage" && !(_id in path("drafts.**"))])`,
    (n) => n <= 1
  )
  await check(
    'No duplicate siteSettings documents',
    `count(*[_type == "siteSettings" && !(_id in path("drafts.**"))])`,
    (n) => n <= 1
  )

  // ─── SUMMARY ─────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (errors.length > 0) {
    console.error('\nFailed checks:')
    errors.forEach((e) => console.error(`  • ${e}`))
    console.error('\n❌ Sanity data integrity check FAILED')
    process.exit(1)
  } else {
    console.log('\n✅ All Sanity data integrity checks passed!')
    process.exit(0)
  }
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
