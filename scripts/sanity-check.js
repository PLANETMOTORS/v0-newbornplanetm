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

  // ─── 0. PRE-FLIGHT: VALIDATE TOKEN AND AUTHENTICATION ───────────────────────
  if (!TOKEN) {
    console.error('❌ SANITY_API_TOKEN is not set.')
    console.error('\n   To fix:')
    console.error(`   1. Go to https://www.sanity.io/manage/project/${PROJECT_ID}/settings/api`)
    console.error('   2. Create a new API token with "Viewer" or "Editor" permissions')
    console.error('   3. Add it as the SANITY_API_TOKEN secret in the GitHub repo:')
    console.error('      https://github.com/PLANETMOTORS/v0-newbornplanetm/settings/secrets/actions')
    process.exit(1)
  }

  try {
    // Minimal no-op query — returns nothing but validates credentials
    await client.fetch('*[false][0]')
  } catch (err) {
    const message = typeof err?.message === 'string' ? err.message : ''
    const isAuthError =
      message.includes('project user not found') ||
      err.statusCode === 401 ||
      err.statusCode === 403
    if (isAuthError) {
      console.error('❌ Authentication failed: ' + message)
      console.error('\n   The SANITY_API_TOKEN secret is invalid or the associated user no longer has')
      console.error(`   access to Sanity project "${PROJECT_ID}".`)
      console.error('\n   To fix:')
      console.error(`   1. Go to https://www.sanity.io/manage/project/${PROJECT_ID}/settings/api`)
      console.error('   2. Create a new API token with "Viewer" or "Editor" permissions')
      console.error('   3. Update the SANITY_API_TOKEN secret in the GitHub repo:')
      console.error('      https://github.com/PLANETMOTORS/v0-newbornplanetm/settings/secrets/actions')
      process.exit(1)
    }
    throw err
  }

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
