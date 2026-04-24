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
      console.log(JSON.stringify({ error: response.status, statusText: response.statusText })
      const text = await response.text()
      console.log(JSON.stringify({ body: text.slice(0, 500) })
      return
    }

    const data = await response.json()
    const result = data.result

    console.log('=== DOCUMENT TYPES IN DATABASE ===')
    console.log(JSON.stringify({ documentTypes: result.documentTypes })

    console.log('\n=== DOCUMENT COUNTS ===')
    console.log(JSON.stringify({ vehicles: result.vehicles, lenders: result.lenders, testimonials: result.testimonials, blogPosts: result.blogPosts, protectionPlans: result.protectionPlans, pages: result.pages })

    console.log('\n=== SINGLETON DOCUMENTS ===')
    for (const [key, label] of [['homepage', 'Homepage'], ['financingPage', 'Financing Page'], ['sellYourCarPage', 'Sell Your Car Page'], ['siteSettings', 'Site Settings'], ['inventorySettings', 'Inventory Settings']]) {
      const doc = result[key]
      if (doc) {
        const fields = Object.keys(doc).filter(k => !k.startsWith('_'))
        console.log(JSON.stringify({ [label]: 'EXISTS', fields })
      } else {
        console.log(JSON.stringify({ [label]: 'MISSING' })
      }
    }

    console.log('\n=== SAMPLE DOCUMENTS ===')
    result.allDocs.forEach(doc => {
      const fields = Object.keys(doc).filter(k => !k.startsWith('_'))
      console.log(JSON.stringify({ type: doc._type, id: doc._id, fields: fields.slice(0, 10), truncated: fields.length > 10 })
    })

    console.log('\n=== VERIFICATION COMPLETE ===')

  } catch (err) {
    console.log(JSON.stringify({ error: err.message })
  }
}

verifySanity()
