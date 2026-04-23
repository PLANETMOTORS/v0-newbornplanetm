// Wide Range Test - Comprehensive Sanity CMS Schema Verification
// Tests every document type and every field against deployed schemas

const PROJECT_ID = '4588vjsz'
const DATASET = 'production'
const TOKEN = process.env.SANITY_API_TOKEN

async function sanityFetch(query) {
  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  })
  const data = await res.json()
  return data.result
}

async function runWideRangeTest() {
  console.log('='.repeat(80))
  console.log('WIDE RANGE TEST - SANITY CMS SCHEMA VERIFICATION')
  console.log('='.repeat(80))
  console.log('')

  // Get ALL documents with their full structure
  const allDocs = await sanityFetch(`*[!(_type match "system.*") && !(_type match "sanity.*")]{
    _type,
    _id,
    ...
  }`)

  // Group by document type
  const byType = {}
  for (const doc of allDocs) {
    if (!byType[doc._type]) {
      byType[doc._type] = []
    }
    byType[doc._type].push(doc)
  }

  console.log(`Found ${Object.keys(byType).length} document types with ${allDocs.length} total documents`)
  console.log('')

  // Define expected schemas based on what we created
  const expectedSchemas = {
    homepage: ['title', 'heroSection', 'trustBadges', 'quickFilters', 'financingPromo', 'announcementBar', 'seo'],
    financingPage: ['title', 'heroSection', 'benefits', 'calculator', 'processSteps', 'lenders', 'seo'],
    sellYourCarPage: ['title', 'heroSection', 'benefits', 'comparisonTable', 'processSteps', 'testimonials', 'cta', 'seo'],
    sellPage: ['title', 'hero', 'benefits', 'comparison', 'process', 'cta', 'seo'],
    siteSettings: ['dealerName', 'phone', 'email', 'address', 'city', 'province', 'postalCode', 'hours', 'socialLinks', 'financingDefaults', 'mandatoryFees', 'negotiationRules', 'announcementBar', 'defaultSeo', 'deliveryConfig'],
    aiSettings: ['annaAssistant', 'priceNegotiator', 'instantAppraisal', 'fees', 'financing'],
    faqItem: ['question', 'answer', 'category', 'order'],
    lender: ['name', 'slug', 'logo', 'description', 'baseRate', 'promoRate', 'promoRateExpiry', 'creditTiers', 'featured', 'order'],
    navigation: ['title', 'topBar', 'trustBadges', 'mainNavigation', 'headerCta', 'footerLinkColumns', 'footerBottom'],
    testimonial: ['name', 'location', 'rating', 'text', 'image', 'vehiclePurchased', 'date', 'featured'],
    protectionPlan: ['name', 'slug', 'shortDescription', 'description', 'price', 'priceNote', 'priceType', 'features', 'coverage', 'termOptions', 'icon', 'image', 'order', 'featured'],
    vehicle: ['stockNumber', 'year', 'make', 'model', 'trim', 'price', 'mileage', 'status', 'images', 'specialFinance'],
  }

  let totalIssues = 0
  const issues = []

  for (const [docType, docs] of Object.entries(byType)) {
    console.log('-'.repeat(80))
    console.log(`TESTING: ${docType} (${docs.length} document(s))`)
    console.log('-'.repeat(80))

    // Get all unique fields across all documents of this type
    const allFields = new Set()
    for (const doc of docs) {
      for (const key of Object.keys(doc)) {
        if (!key.startsWith('_')) {
          allFields.add(key)
        }
      }
    }

    const fieldList = Array.from(allFields).sort()
    console.log(`Fields found in database: ${fieldList.join(', ')}`)

    // Check against expected schema
    if (expectedSchemas[docType]) {
      const expected = expectedSchemas[docType]
      const missing = fieldList.filter(f => !expected.includes(f))
      const extra = expected.filter(f => !fieldList.includes(f))

      if (missing.length > 0) {
        console.log(`  ⚠️  MISSING FROM SCHEMA: ${missing.join(', ')}`)
        issues.push({ type: docType, issue: 'missing_from_schema', fields: missing })
        totalIssues += missing.length
      }
      if (extra.length > 0) {
        console.log(`  ℹ️  Not in DB (optional): ${extra.join(', ')}`)
      }
      if (missing.length === 0) {
        console.log(`  ✅ All fields covered in schema`)
      }
    } else {
      console.log(`  ⚠️  NO SCHEMA DEFINED for ${docType}`)
      issues.push({ type: docType, issue: 'no_schema', fields: fieldList })
      totalIssues++
    }

    // Deep inspect nested objects
    for (const doc of docs.slice(0, 1)) { // Check first doc of each type
      for (const [key, value] of Object.entries(doc)) {
        if (key.startsWith('_')) continue
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const nestedFields = Object.keys(value).filter(k => !k.startsWith('_'))
          if (nestedFields.length > 0) {
            console.log(`  📁 ${key} (nested): ${nestedFields.join(', ')}`)
          }
        }
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          const arrayItemFields = Object.keys(value[0]).filter(k => !k.startsWith('_'))
          if (arrayItemFields.length > 0) {
            console.log(`  📋 ${key}[] items: ${arrayItemFields.join(', ')}`)
          }
        }
      }
    }
    console.log('')
  }

  console.log('='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total document types: ${Object.keys(byType).length}`)
  console.log(`Total documents: ${allDocs.length}`)
  console.log(`Total issues found: ${totalIssues}`)
  console.log('')

  if (issues.length > 0) {
    console.log('ISSUES TO FIX:')
    for (const issue of issues) {
      if (issue.issue === 'no_schema') {
        console.log(`  - ${issue.type}: No schema defined. Fields: ${issue.fields.join(', ')}`)
      } else {
        console.log(`  - ${issue.type}: Missing fields in schema: ${issue.fields.join(', ')}`)
      }
    }
  } else {
    console.log('✅ ALL SCHEMAS MATCH DATABASE - NO ISSUES FOUND')
  }

  return { byType, issues, totalIssues }
}

runWideRangeTest().catch(console.error)
