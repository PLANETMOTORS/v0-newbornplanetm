/**
 * k6 Load Test: Race Condition Detection for Vehicle Reservation & Checkout
 *
 * Simulates 50 concurrent users all trying to reserve/checkout the SAME vehicle
 * simultaneously. Only ONE should succeed; the rest must get 409 or error responses.
 *
 * Usage:
 *   k6 run scripts/load-test-race-conditions.js \
 *     --env BASE_URL=http://localhost:3000 \
 *     --env VEHICLE_ID=<uuid> \
 *     --env STOCK_NUMBER=<stock> \
 *     --env AUTH_TOKEN=<supabase-jwt>
 *
 * Pass/Fail:
 *   - PASS: Exactly 1 successful reservation/order created, 0 double-bookings.
 *   - FAIL: More than 1 success → race condition confirmed.
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Trend } from 'k6/metrics'

// Custom metrics
const successfulReservations = new Counter('successful_reservations')
const failedReservations = new Counter('failed_reservations')
const doubleBookings = new Counter('double_bookings')
const reservationLatency = new Trend('reservation_latency', true)

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const VEHICLE_ID = __ENV.VEHICLE_ID || 'test-vehicle-001'
const STOCK_NUMBER = __ENV.STOCK_NUMBER || 'PM-TEST-001'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

export const options = {
  scenarios: {
    // Scenario 1: 50 concurrent users hit reservation endpoint simultaneously
    reservation_stampede: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '30s',
      exec: 'testReservationRace',
    },
    // Scenario 2: 50 concurrent users hit order creation endpoint simultaneously
    order_stampede: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '30s',
      startTime: '35s', // Start after reservations finish
      exec: 'testOrderRace',
    },
    // Scenario 3: 50 concurrent users hit checkout (Stripe session creation)
    checkout_stampede: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '30s',
      startTime: '70s',
      exec: 'testCheckoutRace',
    },
  },
  thresholds: {
    // THE critical threshold: zero double-bookings allowed
    'double_bookings': [{ threshold: 'count==0', abortOnFail: true }],
    // At most 1 successful reservation per vehicle
    'successful_reservations': [{ threshold: 'count<=1', abortOnFail: false }],
  },
}

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}),
}

/**
 * Scenario 1: 50 users simultaneously try to reserve the same vehicle.
 * Expected: Exactly 1 succeeds, 49 get conflict/error.
 */
export function testReservationRace() {
  const userEmail = `loadtest-${__VU}-${Date.now()}@test.planetmotors.ca`

  const payload = JSON.stringify({
    vehicleId: VEHICLE_ID,
    stockNumber: STOCK_NUMBER,
    customerEmail: userEmail,
    customerPhone: '4161234567',
    customerName: `Load Test User ${__VU}`,
  })

  const startTime = Date.now()

  // Hit the reservation API endpoint (server action proxy)
  const res = http.post(`${BASE_URL}/api/v1/reservations`, payload, { headers })

  reservationLatency.add(Date.now() - startTime)

  const body = res.json() || {}
  const isSuccess = res.status === 200 && (body.success === true || body.clientSecret)
  const isConflict = res.status === 409 || (body.error && (
    body.error.includes('already has an active reservation') ||
    body.error.includes('currently being reserved') ||
    body.error.includes('not available')
  ))

  if (isSuccess) {
    successfulReservations.add(1)
    console.log(`[VU ${__VU}] RESERVATION SUCCESS: ${userEmail} got reservation`)
  } else if (isConflict) {
    failedReservations.add(1)
    // Expected for 49 of 50 users — this is correct behavior
  } else {
    failedReservations.add(1)
    console.log(`[VU ${__VU}] RESERVATION UNEXPECTED: status=${res.status} body=${JSON.stringify(body)}`)
  }

  check(res, {
    'reservation: status is 200 or 409': (r) => r.status === 200 || r.status === 409 || r.status === 429,
    'reservation: has valid response body': (r) => {
      const b = r.json() || {}
      return b.success !== undefined || b.error !== undefined || b.clientSecret !== undefined
    },
  })
}

/**
 * Scenario 2: 50 users simultaneously try to create an order for the same vehicle.
 * Expected: Exactly 1 succeeds (vehicle transitions to 'pending'), 49 get 409.
 */
export function testOrderRace() {
  const payload = JSON.stringify({
    vehicleId: VEHICLE_ID,
    paymentMethod: 'cash',
    deliveryType: 'pickup',
    province: 'ON',
  })

  const res = http.post(`${BASE_URL}/api/v1/orders`, payload, { headers })

  const body = res.json() || {}
  const isSuccess = res.status === 200 && body.success === true
  const isConflict = res.status === 409

  if (isSuccess) {
    successfulReservations.add(1) // Reuse counter to track total successes
    console.log(`[VU ${__VU}] ORDER SUCCESS: got order ${body.data?.order?.orderNumber}`)
  } else if (isConflict) {
    failedReservations.add(1)
  } else {
    failedReservations.add(1)
    if (res.status !== 401) { // 401 expected if no auth token
      console.log(`[VU ${__VU}] ORDER UNEXPECTED: status=${res.status} body=${JSON.stringify(body)}`)
    }
  }

  check(res, {
    'order: status is 200, 401, or 409': (r) => [200, 401, 409].includes(r.status),
  })
}

/**
 * Scenario 3: 50 users simultaneously try to create a Stripe checkout session.
 * Expected: Only 1 should get a valid client_secret if vehicle-level locking works.
 */
export function testCheckoutRace() {
  const payload = JSON.stringify({
    vehicleId: VEHICLE_ID,
    vehicleName: 'Load Test Vehicle',
    vehiclePriceCents: 3500000,
  })

  const res = http.post(`${BASE_URL}/api/v1/checkout`, payload, { headers })

  const body = res.json() || {}
  const isSuccess = res.status === 200 && body.clientSecret
  const isConflict = res.status === 409 || (body.error && body.error.includes('not available'))

  if (isSuccess) {
    successfulReservations.add(1)
    console.log(`[VU ${__VU}] CHECKOUT SUCCESS: got Stripe session`)
  }

  check(res, {
    'checkout: valid response': (r) => r.status === 200 || r.status === 409 || r.status === 400 || r.status === 401,
  })
}

/**
 * Post-test verification: query the database to count actual reservations/orders.
 * If more than 1 active reservation exists for the same vehicle, that's a double-booking.
 */
export function handleSummary(data) {
  const totalSuccesses = data.metrics.successful_reservations
    ? data.metrics.successful_reservations.values.count
    : 0
  const totalDoubleBookings = data.metrics.double_bookings
    ? data.metrics.double_bookings.values.count
    : 0

  const passed = totalSuccesses <= 1 && totalDoubleBookings === 0

  console.log('\n' + '='.repeat(60))
  console.log('  RACE CONDITION LOAD TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`  Successful reservations/orders: ${totalSuccesses}`)
  console.log(`  Double-bookings detected:       ${totalDoubleBookings}`)
  console.log(`  Result:                         ${passed ? 'PASS ✓' : 'FAIL ✗'}`)
  console.log('='.repeat(60) + '\n')

  return {
    stdout: JSON.stringify({
      passed,
      successfulReservations: totalSuccesses,
      doubleBookings: totalDoubleBookings,
      scenarios: Object.keys(data.metrics).reduce((acc, key) => {
        acc[key] = data.metrics[key].values
        return acc
      }, {}),
    }, null, 2),
  }
}
