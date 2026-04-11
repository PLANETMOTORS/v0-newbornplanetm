#!/usr/bin/env node
/**
 * Planet Motors — Synthetic Latency Monitor
 *
 * Usage:
 *   BASE_URL=https://planetmotors.ca npx tsx scripts/synthetic-monitor.ts
 *
 * Behaviour:
 *   1. Discovers a real stock number from the vehicle list API (no hardcoded IDs).
 *   2. Runs a silent warm-up pass over every endpoint to prime the Redis cache.
 *   3. Measures SAMPLES requests per endpoint and reports p50 / p95 / p99.
 *   4. Checks the X-Cache response header and reports cache HIT rate.
 *   5. Exits with code 1 if any endpoint's p99 exceeds TARGET_WARM_MS.
 *      Suitable for use as a CI quality gate after deployment.
 *
 * Targets (Redis-warm path, excludes cold-start cache misses):
 *   WARM  ≤  50 ms p99   — inventory list / facets / aggregations from Redis
 *   VDP   ≤ 200 ms p99   — vehicle detail + similar (may involve DB join on miss)
 */

const BASE_URL    = process.env.BASE_URL    ?? 'http://localhost:3000'
const SAMPLES     = Number(process.env.SAMPLES ?? 10)
const TARGET_WARM = Number(process.env.TARGET_WARM_MS ?? 50)
const TARGET_VDP  = Number(process.env.TARGET_VDP_MS  ?? 200)

// ─── Types ──────────────────────────────────────────────────────────────────

interface Endpoint {
  label:     string
  path:      string
  targetMs:  number
  /** If true, fill in the :stockNumber placeholder before measuring. */
  needsId?:  boolean
}

interface Sample {
  ms:      number
  cacheHit: boolean
}

interface Result {
  label:    string
  path:     string
  targetMs: number
  p50:      number
  p95:      number
  p99:      number
  hitRate:  number  // 0–1
  passed:   boolean
}

// ─── Endpoint catalogue ─────────────────────────────────────────────────────

const ENDPOINTS: Endpoint[] = [
  {
    label:    'Vehicle list  (page 1, available, limit 48)',
    path:     '/api/v1/vehicles?limit=48&status=available&sort=created_at&order=desc',
    targetMs: TARGET_WARM,
  },
  {
    label:    'Vehicle detail (live stock number)',
    path:     '/api/v1/vehicles/:stockNumber',
    targetMs: TARGET_VDP,
    needsId:  true,
  },
  {
    label:    'Similar vehicles',
    path:     '/api/v1/vehicles/:stockNumber/similar?limit=4',
    targetMs: TARGET_VDP,
    needsId:  true,
  },
  {
    label:    'Facets snapshot (available)',
    path:     '/api/v1/vehicles/facets?status=available',
    targetMs: TARGET_WARM,
  },
  {
    label:    'Aggregations (available count + price band)',
    path:     '/api/v1/vehicles/aggregations?status=available',
    targetMs: TARGET_WARM,
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function green(s: string) { return `\x1b[32m${s}\x1b[0m` }
function red(s: string)   { return `\x1b[31m${s}\x1b[0m` }
function dim(s: string)   { return `\x1b[2m${s}\x1b[0m`  }
function bold(s: string)  { return `\x1b[1m${s}\x1b[0m`  }

function badgeMs(value: number, target: number): string {
  return value <= target ? green('✓') : red('✗')
}

function staggerMs(i: number): number {
  // Small jitter (80–120 ms) avoids thundering-herd on a single CDN edge node.
  return 80 + (i % 5) * 10
}

// ─── Discovery ──────────────────────────────────────────────────────────────

/**
 * Fetches the first available stock number from the list API.
 * Used to avoid hardcoded IDs in VDP and similar-vehicles endpoints.
 */
async function discoverStockNumber(): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/vehicles?limit=1&status=available`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const json = await res.json() as { data?: { stock_number?: string }[] }
    return json.data?.[0]?.stock_number ?? null
  } catch {
    return null
  }
}

// ─── Measurement ────────────────────────────────────────────────────────────

async function warmUp(path: string): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers: { Accept: 'application/json' } })
    await res.text()
  } catch { /* ignore warm-up errors */ }
}

async function measure(path: string, samples: number): Promise<Sample[]> {
  const results: Sample[] = []
  for (let i = 0; i < samples; i++) {
    const start = performance.now()
    let cacheHit = false
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Accept: 'application/json' },
      })
      await res.text()
      cacheHit = (res.headers.get('x-cache') ?? '').toLowerCase().startsWith('hit')
    } catch (err) {
      process.stderr.write(`  [WARN] request failed: ${(err as Error).message}\n`)
    }
    results.push({ ms: performance.now() - start, cacheHit })
    await new Promise(r => setTimeout(r, staggerMs(i)))
  }
  return results
}

// ─── Reporting ──────────────────────────────────────────────────────────────

function report(endpoint: Endpoint, samples: Sample[]): Result {
  const times  = samples.map(s => s.ms).sort((a, b) => a - b)
  const hits   = samples.filter(s => s.cacheHit).length
  const p50    = percentile(times, 50)
  const p95    = percentile(times, 95)
  const p99    = percentile(times, 99)
  const hitRate = samples.length > 0 ? hits / samples.length : 0
  return {
    label:    endpoint.label,
    path:     endpoint.path,
    targetMs: endpoint.targetMs,
    p50, p95, p99, hitRate,
    passed: p99 <= endpoint.targetMs,
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(bold(`\n  Planet Motors — Synthetic Latency Monitor`))
  console.log(dim(  `  ─────────────────────────────────────────`))
  console.log(`  Base URL : ${BASE_URL}`)
  console.log(`  Samples  : ${SAMPLES} per endpoint (warm path)`)
  console.log(`  Targets  : WARM ≤ ${TARGET_WARM} ms p99   VDP ≤ ${TARGET_VDP} ms p99\n`)

  // 1. Discover a real stock number for VDP / similar routes
  process.stdout.write('  Discovering stock number … ')
  const stockNumber = await discoverStockNumber()
  if (stockNumber) {
    console.log(green(`found: ${stockNumber}`))
  } else {
    console.log(red('not found — VDP endpoints will be skipped'))
  }

  // Resolve endpoint paths
  const resolved = ENDPOINTS
    .filter(e => !e.needsId || stockNumber !== null)
    .map(e => ({
      ...e,
      path: e.needsId && stockNumber
        ? e.path.replace(':stockNumber', encodeURIComponent(stockNumber))
        : e.path,
    }))

  // 2. Warm-up pass (populates Redis cache; results discarded)
  process.stdout.write('  Warming cache … ')
  await Promise.all(resolved.map(e => warmUp(e.path)))
  console.log(dim('done\n'))

  // 3. Measure
  const COL_LABEL  = 46
  const COL_NUM    = 9
  const LINE_WIDTH = COL_LABEL + COL_NUM * 3 + 18

  console.log(
    `${'Endpoint'.padEnd(COL_LABEL)} ${'p50'.padStart(COL_NUM - 1)} ${'p95'.padStart(COL_NUM)} ${'p99'.padStart(COL_NUM)}  ${'HIT%'.padStart(6)}  OK?`
  )
  console.log('─'.repeat(LINE_WIDTH))

  const results: Result[] = []
  for (const endpoint of resolved) {
    const samples = await measure(endpoint.path, SAMPLES)
    const r = report(endpoint, samples)
    results.push(r)

    const hitPct = `${Math.round(r.hitRate * 100)}%`
    console.log(
      `${r.label.padEnd(COL_LABEL)} ` +
      `${r.p50.toFixed(1).padStart(COL_NUM - 1)}ms ` +
      `${r.p95.toFixed(1).padStart(COL_NUM - 1)}ms ` +
      `${r.p99.toFixed(1).padStart(COL_NUM - 1)}ms  ` +
      `${hitPct.padStart(5)}  ` +
      `${badgeMs(r.p99, r.targetMs)}`,
    )
  }

  // 4. Summary
  const failures    = results.filter(r => !r.passed)
  const lowHitRate  = results.filter(r => r.hitRate < 0.8)

  console.log('─'.repeat(LINE_WIDTH))

  if (lowHitRate.length > 0) {
    console.log(red(`\n  WARNING: ${lowHitRate.length} endpoint(s) have < 80% Redis HIT rate:`))
    lowHitRate.forEach(r => console.log(red(`    • ${r.label} (${Math.round(r.hitRate * 100)}%)`)))
  }

  if (failures.length === 0) {
    console.log(green(`\n  All ${results.length} endpoints within target. ✓\n`))
    process.exit(0)
  } else {
    console.log(red(`\n  ${failures.length} endpoint(s) exceeded p99 target:`))
    failures.forEach(r =>
      console.log(red(`    • ${r.label}: ${r.p99.toFixed(1)} ms > ${r.targetMs} ms target`))
    )
    console.log()
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
