// Sanity CMS Verification Script
// Run with: npx ts-node scripts/verify-sanity-cms.ts

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '4588vjsz',
  dataset: 'production',
  apiVersion: '2025-04-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

async function verifySchemas() {
  console.log('🔍 Verifying Sanity CMS Schema Status...\n')
  
  const documentTypes = [
    'homepage',
    'financingPage', 
    'sellYourCarPage',
    'landingPage',
    'vehicle',
    'lender',
    'protectionPlan',
    'blogPost',
    'testimonial',
    'faqEntry',
    'siteSettings',
    'seoSettings',
    'inventorySettings',
    'vdpSettings',
    'navigation',
    'homepageHero',
    'banner',
    'page',
    'promotion',
  ]
  
  console.log('📋 Checking document types in database:\n')
  
  for (const type of documentTypes) {
    try {
      const count = await client.fetch(`count(*[_type == "${type}"])`)
      const hasUnknownFields = await client.fetch(`
        *[_type == "${type}"][0] {
          "keys": array::unique(array::compact(object::keys(@)))
        }
      `)
      console.log(`✅ ${type}: ${count} document(s)`)
      if (hasUnknownFields?.keys) {
        console.log(`   Fields: ${hasUnknownFields.keys.slice(0, 10).join(', ')}${hasUnknownFields.keys.length > 10 ? '...' : ''}`)
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error"
      console.log(`❌ ${type}: Error - ${msg}`)
    }
  }
  
  // Check for documents with validation issues
  console.log('\n📋 Checking for documents with potential issues:\n')
  
  try {
    const homepageDoc = await client.fetch(`*[_type == "homepage"][0]`)
    if (homepageDoc) {
      console.log('Homepage document found:')
      console.log('  - Has trustBadges:', !!homepageDoc.trustBadges)
      console.log('  - Has hero:', !!homepageDoc.hero)
      console.log('  - Has promoBanner:', !!homepageDoc.promoBanner)
    } else {
      console.log('⚠️ No homepage document found')
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.log(`❌ Homepage check error: ${msg}`)
  }
  
  try {
    const financingDoc = await client.fetch(`*[_type == "financingPage"][0]`)
    if (financingDoc) {
      console.log('\nFinancing Page document found:')
      console.log('  - Has hero:', !!financingDoc.hero)
      console.log('  - Has benefits:', !!financingDoc.benefits)
      console.log('  - Has processSteps:', !!financingDoc.processSteps)
    } else {
      console.log('⚠️ No financingPage document found')
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.log(`❌ Financing Page check error: ${msg}`)
  }
  
  console.log('\n✅ Verification complete!')
}

verifySchemas().catch(console.error)
