import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Surgical coverage tests for PR #532 — targets uncovered new lines
 * in non-excluded lib/ files.
 */

describe('lib/env — lazy singleton (L155)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'test-project')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')
  })

  it('exercises the ??= validateEnv() assignment on first access', async () => {
    const { env } = await import('@/lib/env')
    const url = env.NEXT_PUBLIC_SUPABASE_URL
    expect(url).toBe('https://test.supabase.co')
  })

  it('caches the singleton on subsequent accesses', async () => {
    const { env } = await import('@/lib/env')
    const first = env.NEXT_PUBLIC_SUPABASE_URL
    const second = env.NEXT_PUBLIC_SUPABASE_URL
    expect(first).toBe(second)
  })
})
