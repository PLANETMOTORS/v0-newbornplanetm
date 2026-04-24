// Comprehensive CMS Test - Wide Range Verification
// Tests: API Performance, Schema Validation, Field Matching, Content Delivery

// ── Security: all credentials from environment — never hardcoded ──────────
const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'wlxj8olw'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = process.env.SANITY_API_VERSION || '2024-01-01'
const TOKEN = process.env.SANITY_API_TOKEN

if (!TOKEN) {
  console.error('❌ SANITY_API_TOKEN environment variable is not set.')
  console.error('   Run: export SANITY_API_TOKEN=your_token_here')
  process.exit(1)
}

// ── Helpers ───────────────────────────────────────────────────────────────

const BASE_URL = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`
const AUTH_HEADERS = { Authorization: `Bearer ${TOKEN}` }

/**
 * Execute a GROQ query against the Sanity API.
 * Throws on HTTP errors or missing result.
 */
async function sanityQuery(query) {
  const url = `${BASE_URL}?query=${encodeURIComponent(query)}`
  const response = await fetch(url, { headers: AUTH_HEADERS })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Sanity API error ${response.status}: ${body.slice(0, 200)}`)
  }
  const data = await response.json()
  return data.result
}

async function runComprehensiveTest() {
  console.log('='.repeat(80))
  console.log('COMPREHENSIVE SANITY CMS TEST')
  console.log('='.repeat(80))
  console.log('')

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  }

  // ============================================
  // 1. API PERFORMANCE & RELIABILITY
  // ============================================
  console.log('\n📊 1. API PERFORMANCE & RELIABILITY')
  console.log('-'.repeat(50))

  // Test API latency
  const latencyTests = []
  for (let i = 0; i < 5; i++) {
    const start = Date.now()
    await sanityQuery('*[0]')
    latencyTests.push(Date.now() - start)
  }
  const avgLatency = latencyTests.reduce((a, b) => a + b, 0) / latencyTests.length
  console.log(`   API Latency (avg of 5): ${avgLatency.toFixed(0)}ms`)
  if (avgLatency < 500) {
    console.log('   ✅ PASS: Latency under 500ms')
    results.passed++
  } else if (avgLatency < 1000) {
    console.log('   ⚠️ WARNING: Latency between 500-1000ms')
    results.warnings++
  } else {
    console.log('   ❌ FAIL: Latency over 1000ms')
    results.failed++
  }

  // ============================================
  // 2. DOCUMENT TYPE INVENTORY
  // ============================================
  console.log('\n📋 2. DOCUMENT TYPE INVENTORY')
  console.log('-'.repeat(50))

  const typesQuery = `{
    "allTypes": array::unique(*[]._type),
    "counts": {
      "homepage": count(*[_type == "homepage"]),
      "financingPage": count(*[_type == "financingPage"]),
      "sellYourCarPage": count(*[_type == "sellYourCarPage"]),
      "sellPage": count(*[_type == "sellPage"]),
      "siteSettings": count(*[_type == "siteSettings"]),
      "navigation": count(*[_type == "navigation"]),
      "aiSettings": count(*[_type == "aiSettings"]),
      "faqItem": count(*[_type == "faqItem"]),
      "lender": count(*[_type == "lender"]),
      "testimonial": count(*[_type == "testimonial"]),
      "protectionPlan": count(*[_type == "protectionPlan"]),
      "vehicle": count(*[_type == "vehicle"])
    }
  }`

  const typesData = await sanityQuery(typesQuery)

  console.log('   Document Types Found:', typesData.allTypes.join(', '))
  console.log('\n   Document Counts:')
  for (const [type, count] of Object.entries(typesData.counts)) {
    console.log(`      ${type}: ${count}`)
  }

  // ============================================
  // 3. FIELD-BY-FIELD VERIFICATION
  // ============================================
  console.log('\n🔍 3. FIELD-BY-FIELD VERIFICATION')
  console.log('-'.repeat(50))

  // Define expected schema fields for each document type
  const expectedSchemas = {
    homepage: {
      required: ['_type', '_id'],
      expected: ['title', 'heroSection', 'trustBadges', 'quickFilters', 'financingPromo', 'announcementBar', 'seo'],
      nested: {
        'heroSection': ['headline', 'headlineHighlight', 'subheadline', 'primaryCta', 'secondaryCta', 'backgroundImage'],
        'seo': ['metaTitle', 'metaDescription'],
        'announcementBar': ['show', 'message', 'linkText', 'linkUrl'],
        'financingPromo': ['enabled', 'headline', 'rate', 'rateLabel', 'ctaLabel', 'ctaUrl']
      }
    },
    financingPage: {
      required: ['_type', '_id'],
      expected: ['title', 'heroSection', 'benefits', 'calculator', 'processSteps', 'seo'],
      nested: {
        'heroSection': ['headline', 'subheadline', 'featuredRateText', 'rateSubtext', 'primaryCta'],
        'calculator': ['showCalculator', 'title', 'defaultVehiclePrice', 'defaultDownPayment', 'defaultTerm'],
        'seo': ['metaTitle', 'metaDescription']
      }
    },
    sellYourCarPage: {
      required: ['_type', '_id'],
      expected: ['title', 'heroSection', 'benefits', 'comparisonTable', 'processSteps', 'seo'],
      nested: {
        'heroSection': ['headline', 'subheadline', 'formSettings'],
        'heroSection.formSettings': ['vinPlaceholder', 'licensePlatePlaceholder', 'submitButtonText'],
        'comparisonTable': ['headers', 'rows'],
        'seo': ['metaTitle', 'metaDescription']
      }
    },
    siteSettings: {
      required: ['_type', '_id'],
      expected: ['dealerName', 'email', 'phone', 'address', 'city', 'province', 'postalCode'],
      nested: {}
    },
    aiSettings: {
      required: ['_type', '_id'],
      expected: ['annaAssistant', 'priceNegotiator', 'instantAppraisal', 'fees', 'financing'],
      nested: {
        'annaAssistant': ['displayName', 'enabled', 'welcomeMessage', 'quickActions'],
        'priceNegotiator': ['enabled', 'negotiationRules']
      }
    }
  }

  // Verify each document type
  for (const [docType, schema] of Object.entries(expectedSchemas)) {
    console.log(`\n   📄 ${docType}:`)

    let doc
    try {
      doc = await sanityQuery(`*[_type == "${docType}"][0]`)
    } catch (err) {
      console.log(`      ❌ Query failed: ${err.message}`)
      results.failed++
      continue
    }

    if (!doc) {
      console.log(`      ⚠️ No document found`)
      results.warnings++
      continue
    }

    const docFields = Object.keys(doc).filter(k => !k.startsWith('_') || k === '_type' || k === '_id')

    // Check required fields
    let allRequiredPresent = true
    for (const field of schema.required) {
      if (!doc[field]) {
        console.log(`      ❌ Missing required: ${field}`)
        allRequiredPresent = false
        results.failed++
      }
    }
    if (allRequiredPresent) {
      console.log(`      ✅ All required fields present`)
      results.passed++
    }

    // Check expected fields
    const missingExpected = []
    const presentExpected = []
    for (const field of schema.expected) {
      if (doc[field] !== undefined) {
        presentExpected.push(field)
      } else {
        missingExpected.push(field)
      }
    }

    if (presentExpected.length > 0) {
      console.log(`      ✅ Present: ${presentExpected.join(', ')}`)
    }
    if (missingExpected.length > 0) {
      console.log(`      ⚠️ Not set: ${missingExpected.join(', ')}`)
    }

    // Check nested fields
    for (const [parent, nestedFields] of Object.entries(schema.nested)) {
      const parentParts = parent.split('.')
      let parentObj = doc
      for (const part of parentParts) {
        parentObj = parentObj?.[part]
      }

      if (parentObj && typeof parentObj === 'object') {
        const presentNested = nestedFields.filter(f => parentObj[f] !== undefined)
        const missingNested = nestedFields.filter(f => parentObj[f] === undefined)

        if (presentNested.length > 0) {
          console.log(`      ✅ ${parent}: ${presentNested.join(', ')}`)
          results.passed++
        }
        if (missingNested.length > 0) {
          console.log(`      ⚠️ ${parent} missing: ${missingNested.join(', ')}`)
          results.warnings++
        }
      }
    }

    // Check for unknown fields (fields in DB not in schema)
    const allExpectedFields = [...schema.required, ...schema.expected]
    const unknownFields = docFields.filter(f => !allExpectedFields.includes(f) && !f.startsWith('_'))
    if (unknownFields.length > 0) {
      console.log(`      ℹ️ Extra fields in DB: ${unknownFields.join(', ')}`)
    }
  }

  // ============================================
  // 4. CONTENT DELIVERY TEST
  // ============================================
  console.log('\n\n🚀 4. CONTENT DELIVERY TEST')
  console.log('-'.repeat(50))

  // Test fetching homepage content
  const contentQuery = `*[_type == "homepage"][0]{
    title,
    "hasHero": defined(heroSection),
    "hasTrustBadges": defined(trustBadges) && count(trustBadges) > 0,
    "hasSeo": defined(seo)
  }`

  const contentStart = Date.now()
  const contentData = await sanityQuery(contentQuery)
  const contentTime = Date.now() - contentStart

  console.log(`   Content query time: ${contentTime}ms`)
  console.log(`   Homepage content check:`)
  if (contentData) {
    console.log(JSON.stringify({ title: contentData.title || '(not set)', hasHero: contentData.hasHero, hasTrustBadges: contentData.hasTrustBadges, hasSeo: contentData.hasSeo }))
  }

  // ============================================
  // 5. SCHEMA CONSISTENCY CHECK
  // ============================================
  console.log('\n\n🔄 5. SCHEMA CONSISTENCY CHECK')
  console.log('-'.repeat(50))

  // Check for any documents with validation issues
  const validationQuery = `{
    "documentsWithoutType": count(*[!defined(_type)]),
    "documentsWithoutId": count(*[!defined(_id)]),
    "draftDocuments": count(*[_id match "drafts.*"]),
    "publishedDocuments": count(*[!(_id match "drafts.*")])
  }`

  const validationData = await sanityQuery(validationQuery)

  console.log(JSON.stringify({ documentsWithoutType: validationData.documentsWithoutType, documentsWithoutId: validationData.documentsWithoutId, draftDocuments: validationData.draftDocuments, publishedDocuments: validationData.publishedDocuments })

  if (validationData.documentsWithoutType === 0 && validationData.documentsWithoutId === 0) {
    console.log('   ✅ All documents have valid _type and _id')
    results.passed++
  } else {
    console.log('   ❌ Some documents have missing _type or _id')
    results.failed++
  }

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log('\n\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`   ✅ Passed: ${results.passed}`)
  console.log(`   ⚠️ Warnings: ${results.warnings}`)
  console.log(`   ❌ Failed: ${results.failed}`)
  console.log('')

  if (results.failed === 0) {
    console.log('🎉 ALL CRITICAL TESTS PASSED!')
  } else {
    console.log('⚠️ SOME TESTS FAILED - Review the details above')
  }

  console.log('\n' + '='.repeat(80))
}

runComprehensiveTest().catch(err => {
  console.error('❌ Test suite crashed:', err.message)
  process.exit(1)
})
