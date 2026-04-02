// Verify all schema types are properly defined
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'inwfosqe',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
})

async function verifySchemaTypes() {
  console.log('=== SCHEMA TYPE VERIFICATION ===\n')
  
  // Check documents with trustBadge arrays
  const docsWithTrustBadges = await client.fetch(`
    *[defined(trustBadges)] {
      _type,
      _id,
      "trustBadgeCount": count(trustBadges),
      "sampleBadge": trustBadges[0]
    }
  `)
  
  console.log('Documents with Trust Badges:')
  for (const doc of docsWithTrustBadges) {
    console.log(`  - ${doc._type} (${doc._id}): ${doc.trustBadgeCount} badges`)
    if (doc.sampleBadge) {
      console.log(`    Sample: ${JSON.stringify(doc.sampleBadge)}`)
    }
  }
  
  // Check for inventory settings
  const inventorySettings = await client.fetch(`*[_type == "inventorySettings"][0]`)
  console.log('\nInventory Settings:')
  if (inventorySettings) {
    console.log(`  - title: ${inventorySettings.title}`)
    console.log(`  - showFiltersSidebar: ${inventorySettings.showFiltersSidebar}`)
  } else {
    console.log('  - No inventory settings document found')
  }
  
  // Check all document types
  const docTypes = await client.fetch(`
    array::unique(*[]._type)
  `)
  console.log('\nAll Document Types in Database:')
  console.log(docTypes.sort().join(', '))
  
  // Check for unknown field issues
  console.log('\n=== VERIFICATION COMPLETE ===')
}

verifySchemaTypes().catch(console.error)
