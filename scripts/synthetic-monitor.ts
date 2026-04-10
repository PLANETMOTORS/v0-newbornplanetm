#!/usr/bin/env node
/**
 * Planet Motors — Synthetic Latency Monitor
 * Usage: BASE_URL=https://planetmotors.ca npx tsx scripts/synthetic-monitor.ts
 *
 * Hits the three critical inventory endpoints 10 times each and reports
 * p50 / p95 / p99 latencies against the 50 ms target.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const SAMPLES = 10
const TARGET_MS = 50

const ENDPOINTS: { label: string; path: string }[] = [
  { label: 'Vehicle list  (page 1, limit 48)', path: '/api/v1/vehicles?limit=48&status=available&sort=created_at&order=desc' },
  { label: 'Vehicle detail (first vehicle)',   path: '/api/v1/vehicles/1' },
  { label: 'Facets snapshot',                  path: '/api/v1/vehicles/facets' },
]

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

async function measureEndpoint(path: string): Promise<number[]> {
  const times: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const start = performance.now()
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      })
      await res.text() // drain body
    } catch (err) {
      console.error(`  [ERROR] ${path}:`, (err as Error).message)
    }
    times.push(performance.now() - start)
    // Small stagger to avoid thundering-herd on the same CDN edge node
    await new Promise(r => setTimeout(r, 100))
  }
  return times
}

function badge(value: number): string {
  return value <= TARGET_MS ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
}

async function main() {
  console.log(`\n🏎  Planet Motors Synthetic Monitor`)
  console.log(`   Base URL : ${BASE_URL}`)
  console.log(`   Samples  : ${SAMPLES} per endpoint`)
  console.log(`   Target   : ≤ ${TARGET_MS} ms\n`)
  console.log(`${'Endpoint'.padEnd(44)} ${'p50'.padStart(8)} ${'p95'.padStart(8)} ${'p99'.padStart(8)}  OK?`)
  console.log('─'.repeat(76))

  for (const { label, path } of ENDPOINTS) {
    const raw = await measureEndpoint(path)
    const sorted = [...raw].sort((a, b) => a - b)
    const p50 = percentile(sorted, 50)
    const p95 = percentile(sorted, 95)
    const p99 = percentile(sorted, 99)
    const ok = p99 <= TARGET_MS

    console.log(
      `${label.padEnd(44)} ${p50.toFixed(1).padStart(7)}ms ${p95.toFixed(1).padStart(7)}ms ${p99.toFixed(1).padStart(7)}ms  ${badge(p99)}`,
    )
  }

  console.log('─'.repeat(76))
  console.log(`\n  ${badge(TARGET_MS)} = within ${TARGET_MS} ms p99 target\n`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
