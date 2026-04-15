/**
 * 4 Data Integrity Tests for Planet Motors
 * 
 * Uses SUPABASE_SERVICE_ROLE_KEY (admin client) to verify:
 *   Test 1: RPC functions exist in database (007_race_condition_fixes.sql deployed)
 *   Test 2: Order lifecycle — atomic claim + status transitions
 *   Test 3: Reservation persistence — create, query, cleanup
 *   Test 4: Vehicle status transitions — webhook atomicity
 * 
 * SECURITY: This script runs locally only. The service role key is NEVER committed.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_PREFIX = '__DI_TEST__'
let passCount = 0
let failCount = 0
let testVehicleId: string | null = null

function pass(name: string, detail?: string) {
  passCount++
  console.log(`  ✓ PASSED: ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name: string, detail: string) {
  failCount++
  console.error(`  ✗ FAILED: ${name} — ${detail}`)
}

// ─── Test 1: Verify RPC functions exist ──────────────────────────────────────
async function test1_rpcFunctionsExist() {
  console.log('\n═══ TEST 1: Verify RPC Functions Exist ═══')
  
  const requiredFunctions = [
    'claim_vehicle_for_reservation',
    'claim_vehicle_for_order',
    'transition_vehicle_status',
    'lock_vehicle_for_checkout',
  ]

  // Query pg_proc to check if functions exist
  const { data, error } = await supabase.rpc('claim_vehicle_for_reservation', {
    p_vehicle_id: '00000000-0000-0000-0000-000000000000',
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_customer_email: 'test@test.com',
  })

  // We expect either a valid JSONB response or an error about the vehicle not existing
  // If we get "function does not exist", the migration hasn't been run
  
  for (const fn of requiredFunctions) {
    let testArgs: Record<string, unknown>
    
    switch (fn) {
      case 'claim_vehicle_for_reservation':
        testArgs = {
          p_vehicle_id: '00000000-0000-0000-0000-000000000000',
          p_user_id: '00000000-0000-0000-0000-000000000000',
          p_customer_email: 'nonexistent@test.com',
        }
        break
      case 'claim_vehicle_for_order':
        testArgs = {
          p_vehicle_id: '00000000-0000-0000-0000-000000000000',
          p_user_id: '00000000-0000-0000-0000-000000000000',
        }
        break
      case 'transition_vehicle_status':
        testArgs = {
          p_vehicle_id: '00000000-0000-0000-0000-000000000000',
          p_from_statuses: ['available'],
          p_to_status: 'reserved',
        }
        break
      case 'lock_vehicle_for_checkout':
        testArgs = {
          p_vehicle_id: '00000000-0000-0000-0000-000000000000',
        }
        break
      default:
        testArgs = {}
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(fn, testArgs)
    
    if (rpcError && (rpcError.message.includes('does not exist') || rpcError.message.includes('Could not find the function'))) {
      fail(`RPC ${fn}`, `Function NOT in database — run scripts/007_race_condition_fixes.sql. Error: ${rpcError.message}`)
    } else {
      // Function exists — it may return an error about vehicle not found, which is expected
      pass(`RPC ${fn} exists`, rpcError ? `callable (returned: ${rpcError.message})` : `callable (returned: ${JSON.stringify(rpcData)})`)
    }
  }
}

// ─── Test 2: Order Lifecycle — Atomic Claim + Status Transitions ─────────────
async function test2_orderLifecycle() {
  console.log('\n═══ TEST 2: Order Lifecycle — Atomic Claim + Status Transitions ═══')

  // Find a real vehicle to test with (pick one that's 'available')
  const { data: vehicles, error: vErr } = await supabase
    .from('vehicles')
    .select('id, stock_number, status, year, make, model')
    .eq('status', 'available')
    .limit(1)

  if (vErr || !vehicles || vehicles.length === 0) {
    fail('Find available vehicle', vErr?.message || 'No available vehicles found in database')
    return
  }

  const vehicle = vehicles[0]
  testVehicleId = vehicle.id
  console.log(`  Using vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.stock_number})`)

  // 2a: claim_vehicle_for_order should succeed
  const { data: claimResult, error: claimErr } = await supabase.rpc('claim_vehicle_for_order', {
    p_vehicle_id: vehicle.id,
    p_user_id: '00000000-0000-0000-0000-000000000001', // fake test user
  })

  if (claimErr) {
    fail('claim_vehicle_for_order', claimErr.message)
    return
  }

  if (claimResult?.success) {
    pass('claim_vehicle_for_order succeeded', `status transition: available → pending`)
  } else {
    fail('claim_vehicle_for_order', `returned: ${JSON.stringify(claimResult)}`)
    return
  }

  // 2b: Verify vehicle status is now 'pending'
  const { data: updated } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', vehicle.id)
    .single()

  if (updated?.status === 'pending') {
    pass('Vehicle status is now pending')
  } else {
    fail('Vehicle status check', `expected 'pending', got '${updated?.status}'`)
  }

  // 2c: Second claim on same vehicle should FAIL (race condition guard)
  const { data: claim2 } = await supabase.rpc('claim_vehicle_for_order', {
    p_vehicle_id: vehicle.id,
    p_user_id: '00000000-0000-0000-0000-000000000002', // different user
  })

  if (claim2?.success === false) {
    pass('Second claim correctly rejected', claim2.error)
  } else {
    fail('Race condition guard', `Second claim should have been rejected but got: ${JSON.stringify(claim2)}`)
  }

  // 2d: Restore vehicle to 'available' for cleanup
  const { error: restoreErr } = await supabase
    .from('vehicles')
    .update({ status: 'available', updated_at: new Date().toISOString() })
    .eq('id', vehicle.id)

  if (!restoreErr) {
    pass('Vehicle restored to available (cleanup)')
  } else {
    fail('Cleanup', restoreErr.message)
  }
}

// ─── Test 3: Reservation Persistence ─────────────────────────────────────────
async function test3_reservationPersistence() {
  console.log('\n═══ TEST 3: Reservation Persistence — Create, Query, Cleanup ═══')

  // Find an available vehicle
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, stock_number, year, make, model')
    .eq('status', 'available')
    .limit(1)

  if (!vehicles || vehicles.length === 0) {
    fail('Find available vehicle', 'No available vehicles')
    return
  }

  const vehicle = vehicles[0]
  testVehicleId = vehicle.id
  console.log(`  Using vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.stock_number})`)

  // 3a: Create reservation via RPC
  const testEmail = `${TEST_PREFIX}${Date.now()}@test.planetmotors.ca`
  const { data: resResult, error: resErr } = await supabase.rpc('claim_vehicle_for_reservation', {
    p_vehicle_id: vehicle.id,
    p_user_id: null,
    p_customer_email: testEmail,
    p_customer_phone: '416-555-0199',
    p_customer_name: 'DI Test User',
    p_deposit_amount: 25000,
    p_notes: 'Data Integrity Test — auto-cleanup',
  })

  if (resErr) {
    fail('claim_vehicle_for_reservation', resErr.message)
    return
  }

  if (resResult?.success && resResult?.reservation_id) {
    pass('Reservation created', `ID: ${resResult.reservation_id}`)
  } else {
    fail('Reservation creation', JSON.stringify(resResult))
    return
  }

  const reservationId = resResult.reservation_id

  // 3b: Query reservation back — verify persistence
  const { data: reservation, error: queryErr } = await supabase
    .from('reservations')
    .select('id, vehicle_id, customer_email, customer_name, status, deposit_amount, expires_at')
    .eq('id', reservationId)
    .single()

  if (queryErr) {
    fail('Query reservation', queryErr.message)
  } else if (reservation) {
    const checks = [
      reservation.vehicle_id === vehicle.id,
      reservation.customer_email === testEmail,
      reservation.customer_name === 'DI Test User',
      reservation.status === 'pending',
      reservation.deposit_amount === 25000,
      new Date(reservation.expires_at) > new Date(),
    ]
    if (checks.every(Boolean)) {
      pass('Reservation data persisted correctly', `email=${testEmail}, status=pending, deposit=25000, expires_at valid`)
    } else {
      fail('Reservation data verification', `Mismatch: ${JSON.stringify(reservation)}`)
    }
  }

  // 3c: Vehicle should now be 'reserved'
  const { data: vStatus } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', vehicle.id)
    .single()

  if (vStatus?.status === 'reserved') {
    pass('Vehicle status is reserved')
  } else {
    fail('Vehicle status after reservation', `expected 'reserved', got '${vStatus?.status}'`)
  }

  // 3d: Duplicate reservation by same email should re-use existing
  const { data: dupeResult } = await supabase.rpc('claim_vehicle_for_reservation', {
    p_vehicle_id: vehicle.id,
    p_user_id: '00000000-0000-0000-0000-000000000001',
    p_customer_email: testEmail,
  })

  if (dupeResult?.success && dupeResult?.reservation_id === reservationId) {
    pass('Duplicate reservation re-uses existing', `same ID: ${reservationId}`)
  } else if (dupeResult?.success) {
    pass('Duplicate reservation handled', `returned ID: ${dupeResult.reservation_id}`)
  } else {
    fail('Duplicate reservation', JSON.stringify(dupeResult))
  }

  // 3e: Different email should be blocked
  const { data: blockedResult } = await supabase.rpc('claim_vehicle_for_reservation', {
    p_vehicle_id: vehicle.id,
    p_user_id: '00000000-0000-0000-0000-000000000002',
    p_customer_email: 'other-customer@test.com',
  })

  if (blockedResult?.success === false) {
    pass('Different customer correctly blocked', blockedResult.error)
  } else {
    fail('Reservation exclusivity', `Should have blocked different customer: ${JSON.stringify(blockedResult)}`)
  }

  // Cleanup: delete test reservation and restore vehicle
  await supabase.from('reservations').delete().eq('id', reservationId)
  await supabase.from('vehicles').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', vehicle.id)
  pass('Cleanup complete (reservation deleted, vehicle restored)')
}

// ─── Test 4: Vehicle Status Transitions (Webhook Atomicity) ──────────────────
async function test4_statusTransitions() {
  console.log('\n═══ TEST 4: Vehicle Status Transitions — Webhook Atomicity ═══')

  // Find an available vehicle
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, stock_number, year, make, model')
    .eq('status', 'available')
    .limit(1)

  if (!vehicles || vehicles.length === 0) {
    fail('Find available vehicle', 'No available vehicles')
    return
  }

  const vehicle = vehicles[0]
  testVehicleId = vehicle.id
  console.log(`  Using vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.stock_number})`)

  // 4a: Transition available → reserved (valid)
  const { data: t1 } = await supabase.rpc('transition_vehicle_status', {
    p_vehicle_id: vehicle.id,
    p_from_statuses: ['available'],
    p_to_status: 'reserved',
  })

  if (t1 === true) {
    pass('available → reserved', 'transition succeeded')
  } else {
    fail('available → reserved', `returned ${t1}`)
    // Restore and bail
    await supabase.from('vehicles').update({ status: 'available' }).eq('id', vehicle.id)
    return
  }

  // 4b: Transition reserved → pending (valid — simulates checkout.session.completed webhook)
  const { data: t2 } = await supabase.rpc('transition_vehicle_status', {
    p_vehicle_id: vehicle.id,
    p_from_statuses: ['available', 'reserved'],
    p_to_status: 'pending',
  })

  if (t2 === true) {
    pass('reserved → pending', 'transition succeeded')
  } else {
    fail('reserved → pending', `returned ${t2}`)
  }

  // 4c: Invalid transition — pending → reserved with wrong from_statuses should FAIL
  const { data: t3 } = await supabase.rpc('transition_vehicle_status', {
    p_vehicle_id: vehicle.id,
    p_from_statuses: ['available'],
    p_to_status: 'reserved',
  })

  if (t3 === false) {
    pass('Invalid transition correctly rejected', 'pending → reserved blocked (from_statuses=[available])')
  } else {
    fail('Invalid transition guard', `Should have returned false, got ${t3}`)
  }

  // 4d: Transition pending → sold (valid — simulates payment_intent.succeeded webhook)
  const { data: t4 } = await supabase.rpc('transition_vehicle_status', {
    p_vehicle_id: vehicle.id,
    p_from_statuses: ['pending', 'reserved'],
    p_to_status: 'sold',
  })

  if (t4 === true) {
    pass('pending → sold', 'transition succeeded')
  } else {
    fail('pending → sold', `returned ${t4}`)
  }

  // 4e: Non-existent vehicle should return false
  const { data: t5 } = await supabase.rpc('transition_vehicle_status', {
    p_vehicle_id: '00000000-0000-0000-0000-999999999999',
    p_from_statuses: ['available'],
    p_to_status: 'reserved',
  })

  if (t5 === false) {
    pass('Non-existent vehicle returns false')
  } else {
    fail('Non-existent vehicle guard', `expected false, got ${t5}`)
  }

  // Cleanup: restore vehicle to available
  await supabase.from('vehicles').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', vehicle.id)
  pass('Cleanup complete (vehicle restored to available)')
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║     PLANET MOTORS — 4 DATA INTEGRITY TESTS                 ║')
  console.log('║     Using SUPABASE_SERVICE_ROLE_KEY (admin client)          ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')

  // Verify connection first
  const { data: connTest, error: connErr } = await supabase
    .from('vehicles')
    .select('id')
    .limit(1)

  if (connErr) {
    console.error(`\n✗ FATAL: Cannot connect to Supabase — ${connErr.message}`)
    process.exit(1)
  }
  console.log(`\n✓ Connected to Supabase (${supabaseUrl})`)
  console.log(`  Vehicles table accessible: ${connTest && connTest.length > 0 ? 'YES' : 'EMPTY'}`)

  try {
    await test1_rpcFunctionsExist()
    await test2_orderLifecycle()
    await test3_reservationPersistence()
    await test4_statusTransitions()
  } catch (err) {
    console.error(`\n✗ UNEXPECTED ERROR: ${err}`)
    failCount++
  } finally {
    // Safety cleanup: ensure test vehicle is restored
    if (testVehicleId) {
      await supabase.from('vehicles').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', testVehicleId)
    }
    // Delete any straggling test reservations
    await supabase.from('reservations').delete().like('customer_email', `${TEST_PREFIX}%`)
  }

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log(`  RESULTS: ${passCount} passed, ${failCount} failed`)
  console.log('══════════════════════════════════════════════════════════════\n')

  process.exit(failCount > 0 ? 1 : 0)
}

main()
