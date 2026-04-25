// Check detailed fields for each document type
const projectId = 'wlxj8olw'
const dataset = 'production'
const token = process.env.SANITY_API_TOKEN

async function checkFields() {
  const baseUrl = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}`
  
  const query = `{
    "homepage": *[_type == "homepage"][0],
    "financingPage": *[_type == "financingPage"][0],
    "sellYourCarPage": *[_type == "sellYourCarPage"][0],
    "sellPage": *[_type == "sellPage"][0],
    "siteSettings": *[_type == "siteSettings"][0],
    "navigation": *[_type == "navigation"][0],
    "aiSettings": *[_type == "aiSettings"][0],
    "faqItems": *[_type == "faqItem"][0...3],
    "lenders": *[_type == "lender"][0...2],
    "testimonials": *[_type == "testimonial"][0...2],
    "protectionPlans": *[_type == "protectionPlan"][0...2]
  }`
  
  const response = await fetch(`${baseUrl}?query=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  const data = await response.json()
  const r = data.result
  
  console.log('=== DETAILED FIELD ANALYSIS ===\n')
  
  // Helper to print all fields including nested
  function printFields(obj, prefix = '') {
    if (!obj) return
    Object.keys(obj).forEach(key => {
      if (key.startsWith('_')) return
      const val = obj[key]
      const type = Array.isArray(val) ? 'array' : typeof val
      console.log(`  ${prefix}${key}: ${type}`)
      if (type === 'object' && val !== null) {
        printFields(val, prefix + '  ')
      }
    })
  }
  
  console.log('--- HOMEPAGE ---')
  printFields(r.homepage)
  
  console.log('\n--- FINANCING PAGE ---')
  printFields(r.financingPage)
  
  console.log('\n--- SELL YOUR CAR PAGE ---')
  printFields(r.sellYourCarPage)
  
  console.log('\n--- SELL PAGE (legacy?) ---')
  printFields(r.sellPage)
  
  console.log('\n--- SITE SETTINGS ---')
  printFields(r.siteSettings)
  
  console.log('\n--- NAVIGATION ---')
  printFields(r.navigation)
  
  console.log('\n--- AI SETTINGS ---')
  printFields(r.aiSettings)
  
  console.log('\n--- SAMPLE LENDER ---')
  if (r.lenders[0]) printFields(r.lenders[0])
  
  console.log('\n--- SAMPLE TESTIMONIAL ---')
  if (r.testimonials[0]) printFields(r.testimonials[0])
  
  console.log('\n--- SAMPLE PROTECTION PLAN ---')
  if (r.protectionPlans[0]) printFields(r.protectionPlans[0])
  
  console.log('\n--- SAMPLE FAQ ITEM ---')
  if (r.faqItems[0]) printFields(r.faqItems[0])
}

checkFields()
