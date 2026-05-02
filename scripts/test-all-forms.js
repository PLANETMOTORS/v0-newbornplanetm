// Test script for all form submissions
// Run with: node scripts/test-all-forms.js

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000'

const testData = {
  customer: {
    name: 'Test Customer',
    firstName: 'Test',
    lastName: 'Customer',
    email: 'toni@planetmotors.ca',
    phone: '416-985-2277',
  },
  vehicle: {
    id: 'test-vehicle-123',
    name: '2024 Toyota Camry SE',
    year: '2024',
    make: 'Toyota',
    model: 'Camry',
    trim: 'SE',
    mileage: '15000',
    condition: 'excellent',
  },
}

async function testAPI(name, endpoint, method, body) {
  console.log(`\n--- Testing: ${name} ---`)
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`SUCCESS: ${response.status}`)
      console.log({ response: JSON.stringify(data, null, 2).slice(0, 200).replaceAll(/[\n\r]/g, ' ') })
      return { success: true, data }
    } else {
      console.log(`FAILED: ${response.status}`)
      console.log({ error: data })
      return { success: false, error: data }
    }
  } catch (error) {
    console.log({ error: String(error.message).replaceAll(/[\n\r]/g, '_') })
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('='.repeat(50))
  console.log('FORM FUNCTIONALITY TEST SUITE')
  console.log(`Testing against: ${BASE_URL}`)
  console.log('='.repeat(50))
  
  const results = []
  
  // 1. Test Drive / Video Call Request
  results.push(await testAPI(
    'Test Drive Request',
    '/api/video-call/request',
    'POST',
    {
      customerName: `${testData.customer.firstName} ${testData.customer.lastName}`,
      customerEmail: testData.customer.email,
      customerPhone: testData.customer.phone,
      vehicleId: testData.vehicle.id,
      vehicleName: testData.vehicle.name,
      preferredTime: '2024-04-10 at 2:00 PM',
      notes: 'Test drive request from automated test',
      type: 'test_drive',
    }
  ))
  
  // 2. Trade-In Quote
  results.push(await testAPI(
    'Trade-In Quote',
    '/api/trade-in/quote',
    'POST',
    {
      year: testData.vehicle.year,
      make: testData.vehicle.make,
      model: testData.vehicle.model,
      trim: testData.vehicle.trim,
      mileage: testData.vehicle.mileage,
      condition: testData.vehicle.condition,
      customerName: testData.customer.name,
      customerEmail: testData.customer.email,
      customerPhone: testData.customer.phone,
    }
  ))
  
  // 3. Price Alert
  results.push(await testAPI(
    'Price Alert',
    '/api/alerts',
    'POST',
    {
      email: testData.customer.email,
      vehicleId: testData.vehicle.id,
      make: testData.vehicle.make,
      model: testData.vehicle.model,
      maxPrice: 35000,
      preferences: {
        priceDrops: true,
        newListings: true,
        backInStock: false,
      },
    }
  ))
  
  // 4. Live Video Tour Request
  results.push(await testAPI(
    'Live Video Tour',
    '/api/live-video-tour/request',
    'POST',
    {
      customerName: testData.customer.name,
      customerEmail: testData.customer.email,
      customerPhone: testData.customer.phone,
      vehicleId: testData.vehicle.id,
      vehicleName: testData.vehicle.name,
      preferredDate: '2024-04-15',
      preferredTime: '14:00',
      notes: 'Test video tour from automated test',
    }
  ))
  
  // 5. AI Negotiation
  results.push(await testAPI(
    'AI Negotiation',
    '/api/negotiate',
    'POST',
    {
      vehicleId: testData.vehicle.id,
      vehicleName: testData.vehicle.name,
      listPrice: 35000,
      userOffer: 32000,
      customerName: testData.customer.name,
      customerEmail: testData.customer.email,
      customerPhone: testData.customer.phone,
    }
  ))
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('TEST SUMMARY')
  console.log('='.repeat(50))
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${results.length}`)
  
  if (failed > 0) {
    console.log('\nFailed tests need attention!')
    process.exit(1)
  } else {
    console.log('\nAll tests passed!')
    process.exit(0)
  }
}

runTests()
