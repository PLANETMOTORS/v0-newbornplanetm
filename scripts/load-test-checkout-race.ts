#!/usr/bin/env npx tsx
/**
 * Load Test: Prove checkout race conditions via vehicle status CAS race
 *
 * Tests TWO scenarios:
 *   1. CAS-only path (current /api/v1/orders) — optimistic lock on vehicles.status
 *   2. No-lock path (Stripe webhook flow) — direct order insert with no status check
 *
 * BEFORE fix: Scenario 2 allows multiple orders (double-booking)
 * AFTER fix:  Unique partial index blocks all but 1 order per vehicle
 *
 * Usage: pnpm dlx tsx scripts/load-test-checkout-race.ts
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// ── Env loader ──────────────────────────────────────────────────────────────
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1)
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* file not found */ }
}
loadEnvFile(join(process.cwd(), '.env.neon-check'))
loadEnvFile(join(process.cwd(), '.env.local'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CONCURRENCY = 50
const TEST_STOCK = 'LOADTEST-RACE'
const TEST_VIN_PREFIX = `LT${Date.now().toString(36).slice(-7).toUpperCase()}`

// ── Test Setup ──────────────────────────────────────────────────────────────
async function setup() {
  // Clean old test data
  await admin.from('vehicles').delete().eq('stock_number', TEST_STOCK)

  const vehicleId = crypto.randomUUID()
  const { error } = await admin.from('vehicles').insert({
    id: vehicleId,
    stock_number: TEST_STOCK,
    vin: `${TEST_VIN_PREFIX}AA`,
    year: 2024, make: 'Tesla', model: 'Model 3',
    price: 4500000, mileage: 100, status: 'available',
  })
  if (error) { console.error('❌ Vehicle create failed:', error.message); process.exit(1) }
  return vehicleId
}

// ── Scenario 1: CAS lock race (mimics /api/v1/orders) ──────────────────────
async function casAttempt(vehicleId: string, i: number) {
  const t0 = performance.now()
  // Read
  const { data: v } = await admin.from('vehicles').select('status, price').eq('id', vehicleId).single()
  if (!v || v.status !== 'available')
    return { i, ok: false, reason: 'status_not_available', ms: performance.now() - t0 }
  // CAS update
  const { data: lock } = await admin.from('vehicles')
    .update({ status: 'pending' }).eq('id', vehicleId).eq('status', 'available')
    .select('id').maybeSingle()
  if (!lock)
    return { i, ok: false, reason: 'cas_lost', ms: performance.now() - t0 }
  return { i, ok: true, ms: performance.now() - t0 }
}

// ── Scenario 2: No-lock insert (mimics Stripe webhook) ─────────────────────
// This simulates what happens when multiple Stripe sessions complete: the webhook
// handler just inserts orders without checking vehicle availability.
async function directInsertAttempt(vehicleId: string, userId: string, i: number) {
  const t0 = performance.now()
  const orderNum = `PM-LT-${Date.now().toString(36).toUpperCase()}-${String(i).padStart(3,'0')}`
  const { error } = await admin.from('orders').insert({
    order_number: orderNum, customer_id: userId, vehicle_id: vehicleId,
    status: 'created', payment_method: 'cash', delivery_type: 'pickup',
    vehicle_price_cents: 4500000, documentation_fee_cents: 49900,
    omvic_fee_cents: 1000, delivery_fee_cents: 0, protection_plan_fee_cents: 0,
    tax_rate_percent: 13, tax_amount_cents: 585000,
    total_before_credits_cents: 4550900,
    total_price_cents: 5135900,
  })
  if (error) {
    const reason = error.code === '23505' ? 'unique_constraint' : `db:${error.message}`
    return { i, ok: false, reason, ms: performance.now() - t0 }
  }
  return { i, ok: true, orderNumber: orderNum, ms: performance.now() - t0 }
}


// ── Cleanup ─────────────────────────────────────────────────────────────────
async function cleanup(vehicleId: string, userIds: string[]) {
  await admin.from('orders').delete().like('order_number', 'PM-LT-%')
  await admin.from('vehicles').delete().eq('id', vehicleId)
  for (const uid of userIds) await admin.auth.admin.deleteUser(uid).catch(() => {})
}

// ── Create users in batches ─────────────────────────────────────────────────
async function createUsers(n: number) {
  const users: string[] = []
  const batch = 10
  for (let b = 0; b < n; b += batch) {
    const chunk = await Promise.all(
      Array.from({ length: Math.min(batch, n - b) }, async (_, j) => {
        const email = `lt-${b + j}-${Date.now()}@test.pm.ca`
        const { data, error } = await admin.auth.admin.createUser({
          email, password: `Test!${b + j}`, email_confirm: true,
        })
        if (error) throw error
        return data.user.id
      })
    )
    users.push(...chunk)
    if (b + batch < n) await new Promise(r => setTimeout(r, 200))
  }
  return users
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔═════════════════════════════════════════════════════════╗')
  console.log('║  RACE CONDITION LOAD TEST                              ║')
  console.log('║  50 concurrent users → 1 vehicle                      ║')
  console.log('╚═════════════════════════════════════════════════════════╝')

  // ── Scenario 1: CAS Lock Race ──
  console.log('\n━━━ SCENARIO 1: CAS Lock Race (orders API path) ━━━')
  const vid1 = await setup()
  console.log(`  Vehicle: ${vid1}`)

  const results1 = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => casAttempt(vid1, i))
  )
  const wins1 = results1.filter(r => r.ok).length
  const fails1 = results1.filter(r => !r.ok)
  const reasons1: Record<string, number> = {}
  fails1.forEach(r => { reasons1[r.reason || '?'] = (reasons1[r.reason || '?'] || 0) + 1 })

  console.log(`  Winners:  ${wins1} (expected: 1)`)
  console.log(`  Rejected: ${fails1.length}`)
  for (const [r, c] of Object.entries(reasons1)) console.log(`    ${r}: ${c}`)
  console.log(wins1 === 1 ? '  ✅ CAS lock works for this path' : `  ⚠️  ${wins1} winners — CAS leak detected`)

  // ── Scenario 2: Direct Insert (Stripe webhook) ──
  console.log('\n━━━ SCENARIO 2: Direct Insert Race (Stripe webhook path) ━━━')

  // Check if orders table exists — if not, apply migration
  const { error: tableCheck } = await admin.from('orders').select('id').limit(0)
  if (tableCheck) {
    console.log(`  ⚠️  Orders table missing — applying migration 012...`)
    const dbUrl = process.env.POSTGRES_URL || process.env.NEON_POSTGRES_URL || process.env.NEON_DATABASE_URL
    if (!dbUrl) {
      console.log('  ❌ No POSTGRES_URL env var — cannot apply migration automatically.')
      console.log('  ❌ Run scripts/012_checkout_race_condition_fix.sql manually in Supabase SQL editor.')
      await cleanup(vid1, [])
      process.exit(1)
    }
    try {
      const { Pool } = await import('@neondatabase/serverless')
      const pool = new Pool({ connectionString: dbUrl })
      const migrationContent = readFileSync(join(process.cwd(), 'scripts/012_checkout_race_condition_fix.sql'), 'utf-8')
      // Execute the entire migration as one transaction
      const client = await pool.connect()
      try {
        await client.query(migrationContent)
        console.log('  ✅ Migration applied successfully')
      } catch (e) {
        const msg = (e as Error).message || ''
        if (msg.includes('already exists')) {
          console.log('  ℹ️  Migration already applied (some objects already exist)')
        } else {
          throw e
        }
      } finally {
        client.release()
        await pool.end()
      }
      // Wait for Supabase schema cache to refresh
      console.log('  ⏳ Waiting for schema cache refresh...')
      await new Promise(r => setTimeout(r, 5000))
    } catch (e) {
      console.log(`  ❌ Migration failed: ${(e as Error).message}`)
      console.log('  ❌ Run scripts/012_checkout_race_condition_fix.sql manually in Supabase SQL editor.')
      await cleanup(vid1, [])
      process.exit(1)
    }
  }

  // If orders table exists, test direct insert race
  console.log('  Creating test users...')
  const userIds = await createUsers(CONCURRENCY)
  console.log(`  ${userIds.length} users ready`)

  const vid2 = await setup()
  console.log(`  Vehicle: ${vid2}`)
  console.log(`  Firing ${CONCURRENCY} concurrent order inserts...`)

  const results2 = await Promise.all(
    userIds.map((uid, i) => directInsertAttempt(vid2, uid, i))
  )
  const wins2 = results2.filter(r => r.ok).length
  const fails2 = results2.filter(r => !r.ok)
  const reasons2: Record<string, number> = {}
  fails2.forEach(r => { reasons2[r.reason || '?'] = (reasons2[r.reason || '?'] || 0) + 1 })

  // Ground truth: count active orders
  const { data: active } = await admin.from('orders')
    .select('id, order_number, status')
    .eq('vehicle_id', vid2)
    .in('status', ['created', 'confirmed', 'processing', 'ready_for_delivery', 'in_transit'])
  const n = active?.length || 0

  console.log(`  Succeeded: ${wins2}`)
  console.log(`  Rejected:  ${fails2.length}`)
  for (const [r, c] of Object.entries(reasons2)) console.log(`    ${r}: ${c}`)
  console.log(`  📊 Active orders in DB: ${n}`)

  if (n > 1) {
    console.log(`  ❌ DOUBLE BOOKING: ${n} active orders for 1 vehicle!`)
    for (const o of (active ?? [])) console.log(`    → ${o.order_number} (${o.status})`)
  } else if (n === 1) {
    console.log('  ✅ Exactly 1 order — unique index is working.')
  }

  await cleanup(vid2, userIds)

  console.log('\n═══════════════════════════════════════════════════════════')
  const passed = n <= 1
  console.log(passed ? '✅ PASS — No double booking' : `❌ FAIL — ${n} active orders for 1 vehicle`)
  process.exit(passed ? 0 : 1)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })