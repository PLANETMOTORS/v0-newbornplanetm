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

const clientConfig = {
  projectId: PROJECT_ID,
  dataset:   DATASET,
  useCdn:    false,
  apiVersion: '2025-04-01',
}

// Authenticated client (used when a token is provided)
const authedClient = createClient({ ...clientConfig, token: TOKEN })
// Unauthenticated client (fallback for publicly-readable datasets)
const anonClient   = createClient(clientConfig)

// Active client — may be swapped to anonClient if the token is unauthorised
let client = TOKEN ? authedClient : anonClient
let usingAnonFallback = false

let passed = 0
let failed = 0
const errors = []

// Returns true when the error is a Sanity "token not authorised for this project" error.
function isProjectUserNotFoundError(err) {
  return (
    err && typeof err.message === 'string' &&
    err.message.includes('project user not found')
  )
}

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
    // If the token isn't authorised for this project, fall back to the
    // anonymous (unauthenticated) client and retry once.  Public Sanity
    // datasets (like this site's `production` dataset) allow read access
    // without a token, so the check can still succeed.
    if (!usingAnonFallback && isProjectUserNotFoundError(err)) {
      console.warn(`\n⚠️  SANITY_API_TOKEN is not authorised for project "${PROJECT_ID}".`)
      console.warn('   Falling back to unauthenticated access (public dataset reads).\n')
      console.warn('   To fix permanently: regenerate the Sanity API token from a user')
      console.warn(`   who is a member of project "${PROJECT_ID}" and update the`)
      console.warn('   SANITY_API_TOKEN secret in GitHub repository settings.\n')
      client = anonClient
      usingAnonFallback = true
      return check(label, query, validator)
    }
    console.error(`  ❌ ${label} — ERROR: ${err.message}`)
    errors.push(`${label}: ${err.message}`)
    failed++
  }
}

async function run() {
  console.log(`\n🔍 Sanity Data Integrity Check`)
  console.log(`   Project: ${PROJECT_ID}  Dataset: ${DATASET}\n`)

  // ─── 0. TOKEN PRE-FLIGHT ─────────────────────────────────────────────────────
  if (TOKEN) {
    try {
      // A lightweight GROQ query is the cheapest way to verify the token.
      await authedClient.fetch(`count(*[_id == "_.config.v2"][0..0])`)
      console.log('✅ Sanity token authorised\n')
    } catch (err) {
      if (isProjectUserNotFoundError(err)) {
        console.warn(`⚠️  SANITY_API_TOKEN (user "g-GFcM8YRAT305") is NOT a member of project "${PROJECT_ID}".`)
        console.warn('   Falling back to unauthenticated access for all checks.')
        console.warn('   Fix: create a new token from a project member at https://www.sanity.io/manage\n')
        client = anonClient
        usingAnonFallback = true
      } else {
        console.warn(`⚠️  Token pre-flight failed: ${err.message}`)
        console.warn('   Continuing with unauthenticated access.\n')
        client = anonClient
        usingAnonFallback = true
      }
    }
  } else {
    console.log('ℹ️  No SANITY_API_TOKEN set — using public (unauthenticated) access.\n')
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
