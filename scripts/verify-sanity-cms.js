// Sanity CMS Verification Script
const projectId = '4588vjsz'
const dataset = 'production'
const apiVersion = '2024-01-01'
const token = process.env.SANITY_API_TOKEN

async function verifySanity() {
  console.log('=== SANITY CMS VERIFICATION ===\n')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}\n`)

  if (!token) {
    console.log('ERROR: SANITY_API_TOKEN not set')
    return
  }

  const baseUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`

  // Query all document types
  const query = `{
    "documentTypes": array::unique(*[]._type),
    "homepage": *[_type == "homepage"][0],
    "financingPage": *[_type == "financingPage"][0],
    "sellYourCarPage": *[_type == "sellYourCarPage"][0],
    "siteSettings": *[_type == "siteSettings"][0],
    "inventorySettings": *[_type == "inventorySettings"][0],
    "vehicles": count(*[_type == "vehicle"]),
    "lenders": count(*[_type == "lender"]),
    "testimonials": count(*[_type == "testimonial"]),
    "blogPosts": count(*[_type == "blogPost"]),
    "protectionPlans": count(*[_type == "protectionPlan"]),
    "pages": count(*[_type == "page"]),
    "allDocs": *[_type in ["homepage", "financingPage", "sellYourCarPage", "siteSettings", "inventorySettings", "page", "vehicle"]][0...20]
  }`

  try {
    const url = `${baseUrl}?query=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.log(`ERROR: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.log(text)
      return
    }

    const data = await response.json()
    const result = data.result

    console.log('=== DOCUMENT TYPES IN DATABASE ===')
    console.log(result.documentTypes.join(', '))

    console.log('\n=== DOCUMENT COUNTS ===')
    console.log(`Vehicles: ${result.vehicles}`)
    console.log(`Lenders: ${result.lenders}`)
    console.log(`Testimonials: ${result.testimonials}`)
    console.log(`Blog Posts: ${result.blogPosts}`)
    console.log(`Protection Plans: ${result.protectionPlans}`)
    console.log(`Pages: ${result.pages}`)

    console.log('\n=== SINGLETON DOCUMENTS ===')
    console.log(`Homepage: ${result.homepage ? 'EXISTS' : 'MISSING'}`)
    if (result.homepage) {
      const fields = Object.keys(result.homepage).filter(k => !k.startsWith('_'))
      console.log(`  Fields: ${fields.join(', ')}`)
    }
    
    console.log(`Financing Page: ${result.financingPage ? 'EXISTS' : 'MISSING'}`)
    if (result.financingPage) {
      const fields = Object.keys(result.financingPage).filter(k => !k.startsWith('_'))
      console.log(`  Fields: ${fields.join(', ')}`)
    }

    console.log(`Sell Your Car Page: ${result.sellYourCarPage ? 'EXISTS' : 'MISSING'}`)
    if (result.sellYourCarPage) {
      const fields = Object.keys(result.sellYourCarPage).filter(k => !k.startsWith('_'))
      console.log(`  Fields: ${fields.join(', ')}`)
    }

    console.log(`Site Settings: ${result.siteSettings ? 'EXISTS' : 'MISSING'}`)
    if (result.siteSettings) {
      const fields = Object.keys(result.siteSettings).filter(k => !k.startsWith('_'))
      console.log(`  Fields: ${fields.join(', ')}`)
    }

    console.log(`Inventory Settings: ${result.inventorySettings ? 'EXISTS' : 'MISSING'}`)
    if (result.inventorySettings) {
      const fields = Object.keys(result.inventorySettings).filter(k => !k.startsWith('_'))
      console.log(`  Fields: ${fields.join(', ')}`)
    }

    console.log('\n=== SAMPLE DOCUMENTS ===')
    result.allDocs.forEach(doc => {
      const fields = Object.keys(doc).filter(k => !k.startsWith('_'))
      console.log(`\n[${doc._type}] ${doc._id}`)
      console.log(`  Fields: ${fields.slice(0, 10).join(', ')}${fields.length > 10 ? '...' : ''}`)
    })

    console.log('\n=== VERIFICATION COMPLETE ===')

  } catch (err) {
    console.log('ERROR:', err.message)
  }
}

verifySanity()
