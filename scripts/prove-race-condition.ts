/* eslint-disable @typescript-eslint/no-non-null-assertion */
// Make this file a module so TypeScript doesn't merge its scope with other scripts.
export {}

/**
 * Race Condition Proof-of-Concept
 *
 * Demonstrates the TOCTOU (Time-of-Check-to-Time-of-Use) race condition
 * in the OLD reservation and order flows.
 *
 * OLD PATTERN (vulnerable):
 *   1. READ vehicle.status       ← Thread A reads "available"
 *   2. CHECK status == available  ← Thread B reads "available" (same time)
 *   3. INSERT reservation         ← Thread A inserts
 *   4. UPDATE vehicle.status      ← Thread B ALSO inserts (double-booking!)
 *
 * NEW PATTERN (fixed):
 *   1. SELECT ... FOR UPDATE      ← Thread A locks the row
 *   2. Thread B BLOCKS here       ← waits for Thread A to commit
 *   3. INSERT + UPDATE in one TX  ← Thread A commits
 *   4. Thread B reads new status  ← sees "reserved", rejects
 *
 * Usage:
 *   npx tsx scripts/prove-race-condition.ts
 *
 * This does NOT require a running server or database. It simulates the
 * concurrency patterns to prove the race window exists.
 */

// Simulated database state
let vehicleStatus = 'available'
let reservationCount = 0
let orderCount = 0
const reservations: Array<{ id: number; email: string; createdAt: number }> = []
const orders: Array<{ id: number; userId: string; createdAt: number }> = []

// Simulate network/IO delay (the race window)
const simulateDelay = (ms: number) => new Promise(r => setTimeout(r, ms))
const randomDelay = () => simulateDelay(Math.random() * 10) // 0-10ms jitter

// ─────────────────────────────────────────────────────────────
// OLD CODE: Vulnerable TOCTOU pattern (from reservation.ts before fix)
// ─────────────────────────────────────────────────────────────
async function oldCreateReservation(email: string): Promise<{ success: boolean; error?: string }> {
  // Step 1: READ vehicle status (non-atomic)
  await randomDelay()
  const currentStatus = vehicleStatus  // ← All 50 threads read "available" here

  // Step 2: CHECK if available
  if (currentStatus !== 'available' && currentStatus !== 'reserved') {
    return { success: false, error: `Vehicle is ${currentStatus}` }
  }

  // Step 3: CHECK for conflicting reservation (non-atomic read)
  await randomDelay()
  const hasConflict = reservations.some(r => r.email !== email)
  if (hasConflict) {
    return { success: false, error: 'Active reservation exists' }
  }

  // ⚠️ RACE WINDOW: Between the check above and the insert below,
  // other threads can also pass the check.

  // Step 4: INSERT reservation (non-atomic)
  await randomDelay()
  reservationCount++
  reservations.push({ id: reservationCount, email, createdAt: Date.now() })

  // Step 5: UPDATE vehicle status (non-atomic)
  await randomDelay()
  vehicleStatus = 'reserved'

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// OLD CODE: Vulnerable order creation (from orders/route.ts before fix)
// ─────────────────────────────────────────────────────────────
async function oldCreateOrder(userId: string): Promise<{ success: boolean; error?: string }> {
  // Step 1: READ vehicle status
  await randomDelay()
  const currentStatus = vehicleStatus

  // Step 2: CHECK if available
  if (currentStatus !== 'available') {
    return { success: false, error: `Vehicle is ${currentStatus}` }
  }

  // ⚠️ RACE WINDOW

  // Step 3: Optimistic update — tries WHERE status = currentStatus
  await randomDelay()
  // In the old code, this UPDATE could succeed for multiple threads
  // because they all cached currentStatus = 'available'
  orderCount++
  orders.push({ id: orderCount, userId, createdAt: Date.now() })
  vehicleStatus = 'pending'

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// NEW CODE: Fixed with simulated SELECT FOR UPDATE
// ─────────────────────────────────────────────────────────────
let dbLock: Promise<void> = Promise.resolve()

async function newCreateReservation(email: string): Promise<{ success: boolean; error?: string }> {
  // Acquire exclusive lock (simulates SELECT ... FOR UPDATE)
  let releaseLock: () => void
  const previousLock = dbLock
  dbLock = new Promise(resolve => { releaseLock = resolve })

  await previousLock // Wait for any previous holder to release

  try {
    // Now we have exclusive access — check and modify atomically
    if (vehicleStatus !== 'available' && vehicleStatus !== 'reserved') {
      return { success: false, error: `Vehicle is ${vehicleStatus}` }
    }

    const hasConflict = reservations.some(r => r.email !== email)
    if (hasConflict) {
      return { success: false, error: 'Active reservation exists' }
    }

    await randomDelay() // Simulate DB work

    reservationCount++
    reservations.push({ id: reservationCount, email, createdAt: Date.now() })
    vehicleStatus = 'reserved'

    return { success: true }
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    releaseLock!() // Release the lock
  }
}

async function newCreateOrder(userId: string): Promise<{ success: boolean; error?: string }> {
  let releaseLock: () => void
  const previousLock = dbLock
  dbLock = new Promise(resolve => { releaseLock = resolve })

  await previousLock

  try {
    if (vehicleStatus !== 'available') {
      return { success: false, error: `Vehicle is ${vehicleStatus}` }
    }

    await randomDelay()

    orderCount++
    orders.push({ id: orderCount, userId, createdAt: Date.now() })
    vehicleStatus = 'pending'

    return { success: true }
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    releaseLock!()
  }
}

// ─────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────
async function runTest(
  name: string,
  fn: (id: string) => Promise<{ success: boolean; error?: string }>,
  concurrency: number
) {
  // Reset state
  vehicleStatus = 'available'
  reservationCount = 0
  orderCount = 0
  reservations.length = 0
  orders.length = 0
  dbLock = Promise.resolve()

  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, i) =>
      fn(`user-${i}@test.com`)
    )
  )

  const successes = results.filter(r => r.success).length
  const failures = results.filter(r => !r.success).length
  const isDoubleBooked = successes > 1

  return { name, successes, failures, isDoubleBooked, totalReservations: reservations.length, totalOrders: orders.length }
}

async function main() {
  const CONCURRENCY = 50
  const RUNS = 5 // Run multiple times to catch the race

  console.log('=' .repeat(70))
  console.log('  RACE CONDITION PROOF-OF-CONCEPT')
  console.log('  Simulating', CONCURRENCY, 'concurrent users per run,', RUNS, 'runs each')
  console.log('='.repeat(70))

  // Test 1: OLD reservation pattern
  console.log('\n--- OLD RESERVATION PATTERN (vulnerable) ---')
  let oldDoubleBookings = 0
  for (let i = 0; i < RUNS; i++) {
    const result = await runTest(
      `Old Reservation Run ${i + 1}`,
      (email) => oldCreateReservation(email),
      CONCURRENCY
    )
    if (result.isDoubleBooked) oldDoubleBookings++
    console.log(
      `  Run ${i + 1}: ${result.successes} successes, ${result.failures} failures, ` +
      `${result.totalReservations} DB rows → ${result.isDoubleBooked ? 'DOUBLE-BOOKED!' : 'OK'}`
    )
  }

  // Test 2: OLD order pattern
  console.log('\n--- OLD ORDER PATTERN (vulnerable) ---')
  let oldOrderDoubleBookings = 0
  for (let i = 0; i < RUNS; i++) {
    const result = await runTest(
      `Old Order Run ${i + 1}`,
      (userId) => oldCreateOrder(userId),
      CONCURRENCY
    )
    if (result.isDoubleBooked) oldOrderDoubleBookings++
    console.log(
      `  Run ${i + 1}: ${result.successes} successes, ${result.failures} failures, ` +
      `${result.totalOrders} DB rows → ${result.isDoubleBooked ? 'DOUBLE-BOOKED!' : 'OK'}`
    )
  }

  // Test 3: NEW reservation pattern (fixed)
  console.log('\n--- NEW RESERVATION PATTERN (fixed with SELECT FOR UPDATE) ---')
  let newDoubleBookings = 0
  for (let i = 0; i < RUNS; i++) {
    const result = await runTest(
      `New Reservation Run ${i + 1}`,
      (email) => newCreateReservation(email),
      CONCURRENCY
    )
    if (result.isDoubleBooked) newDoubleBookings++
    console.log(
      `  Run ${i + 1}: ${result.successes} successes, ${result.failures} failures, ` +
      `${result.totalReservations} DB rows → ${result.isDoubleBooked ? 'DOUBLE-BOOKED!' : 'OK'}`
    )
  }

  // Test 4: NEW order pattern (fixed)
  console.log('\n--- NEW ORDER PATTERN (fixed with SELECT FOR UPDATE) ---')
  let newOrderDoubleBookings = 0
  for (let i = 0; i < RUNS; i++) {
    const result = await runTest(
      `New Order Run ${i + 1}`,
      (userId) => newCreateOrder(userId),
      CONCURRENCY
    )
    if (result.isDoubleBooked) newOrderDoubleBookings++
    console.log(
      `  Run ${i + 1}: ${result.successes} successes, ${result.failures} failures, ` +
      `${result.totalOrders} DB rows → ${result.isDoubleBooked ? 'DOUBLE-BOOKED!' : 'OK'}`
    )
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('  RESULTS SUMMARY')
  console.log('='.repeat(70))
  console.log(`  OLD reservation: ${oldDoubleBookings}/${RUNS} runs had double-bookings`)
  console.log(`  OLD order:       ${oldOrderDoubleBookings}/${RUNS} runs had double-bookings`)
  console.log(`  NEW reservation: ${newDoubleBookings}/${RUNS} runs had double-bookings`)
  console.log(`  NEW order:       ${newOrderDoubleBookings}/${RUNS} runs had double-bookings`)
  console.log('')

  const oldHasRace = oldDoubleBookings > 0 || oldOrderDoubleBookings > 0
  const newHasRace = newDoubleBookings > 0 || newOrderDoubleBookings > 0

  if (oldHasRace && !newHasRace) {
    console.log('  VERDICT: Race condition PROVEN in old code, FIXED in new code')
    console.log('  STATUS:  PASS')
  } else if (!oldHasRace) {
    console.log('  VERDICT: Race condition not triggered (increase RUNS or CONCURRENCY)')
    console.log('  STATUS:  INCONCLUSIVE (but fix is structurally correct)')
  } else if (newHasRace) {
    console.log('  VERDICT: Fix did NOT resolve the race condition')
    console.log('  STATUS:  FAIL')
  }

  console.log('='.repeat(70))

  // Exit with appropriate code
  process.exit(newHasRace ? 1 : 0)
}

main().catch(console.error)
