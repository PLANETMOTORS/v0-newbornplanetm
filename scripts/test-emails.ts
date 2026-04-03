import { sendNotificationEmail } from '../lib/email'

async function runTests() {
  console.log('Starting email tests...\n')
  
  const tests = [
    {
      type: 'finance_application' as const,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '416-555-1234',
      vehicleInfo: '2024 BMW X5 xDrive40i',
      applicationId: 'TEST-001',
      additionalData: { annualIncome: 85000, requestedAmount: 45000 }
    },
    {
      type: 'trade_in_quote' as const,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '416-555-1234',
      vehicleInfo: '2020 Honda Accord',
      quoteId: 'TIQ-TEST-001',
      tradeInValue: 18500
    },
    {
      type: 'test_drive_request' as const,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '416-555-1234',
      vehicleInfo: '2024 Mercedes-Benz GLE 350',
      additionalData: { preferredDate: 'April 5, 2026', preferredTime: '2:00 PM' }
    },
    {
      type: 'vehicle_inquiry' as const,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '416-555-1234',
      vehicleInfo: '2023 Audi Q7',
      additionalData: { message: 'Is this vehicle still available?' }
    },
    {
      type: 'ico_accepted' as const,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '416-555-1234',
      vehicleInfo: '2019 Toyota Camry',
      quoteId: 'ICO-TEST-001',
      tradeInValue: 22000
    }
  ]

  const results = []
  
  for (const test of tests) {
    console.log(`Testing: ${test.type}...`)
    const result = await sendNotificationEmail(test)
    results.push({ type: test.type, ...result })
    console.log(`  Result: ${result.success ? 'SUCCESS' : 'FAILED'} ${result.error || ''}\n`)
  }

  console.log('\n=== TEST SUMMARY ===')
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log(`Passed: ${passed}/${results.length}`)
  console.log(`Failed: ${failed}/${results.length}`)
  
  if (failed > 0) {
    console.log('\nFailed tests:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.type}: ${r.error}`)
    })
  }

  return results
}

runTests().then(results => {
  console.log('\nDone.')
  process.exit(results.every(r => r.success) ? 0 : 1)
}).catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
