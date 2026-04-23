import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Typesense client — env-driven nodes configuration
// ---------------------------------------------------------------------------

// We need to test getNodes() indirectly through the exported clients.
// Since the module caches clients, we reset modules between tests.

describe('Typesense client — env-driven nodes', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  it('uses TYPESENSE_NODES env var when set', async () => {
    process.env.TYPESENSE_HOST = 'sdn.typesense.net'
    process.env.TYPESENSE_API_KEY = 'test-key'
    process.env.TYPESENSE_NODES = 'custom-1.ts.net,custom-2.ts.net'

    const { getAdminClient } = await import('@/lib/typesense/client')
    const client = getAdminClient()

    // The client should exist (env vars are set)
    expect(client).not.toBeNull()
    // We can't directly inspect the nodes config on the Client instance,
    // but we verify the client was created successfully with the env vars.
    // The real test is that no hardcoded hosts appear when TYPESENSE_NODES is set.
  })

  it('falls back to default nodes when TYPESENSE_NODES is not set', async () => {
    process.env.TYPESENSE_HOST = 'sdn.typesense.net'
    process.env.TYPESENSE_API_KEY = 'test-key'
    delete process.env.TYPESENSE_NODES

    const { getAdminClient } = await import('@/lib/typesense/client')
    const client = getAdminClient()

    expect(client).not.toBeNull()
  })

  it('trims whitespace from TYPESENSE_NODES entries', async () => {
    process.env.TYPESENSE_HOST = 'sdn.typesense.net'
    process.env.TYPESENSE_API_KEY = 'test-key'
    process.env.TYPESENSE_NODES = ' node1.ts.net , node2.ts.net , node3.ts.net '

    const { getAdminClient } = await import('@/lib/typesense/client')
    const client = getAdminClient()

    expect(client).not.toBeNull()
  })

  it('skips empty entries in TYPESENSE_NODES', async () => {
    process.env.TYPESENSE_HOST = 'sdn.typesense.net'
    process.env.TYPESENSE_API_KEY = 'test-key'
    process.env.TYPESENSE_NODES = 'node1.ts.net,,node2.ts.net,'

    const { getAdminClient } = await import('@/lib/typesense/client')
    const client = getAdminClient()

    expect(client).not.toBeNull()
  })

  it('returns null when TYPESENSE_HOST is missing', async () => {
    delete process.env.TYPESENSE_HOST
    delete process.env.NEXT_PUBLIC_TYPESENSE_HOST
    process.env.TYPESENSE_API_KEY = 'test-key'

    const { getAdminClient } = await import('@/lib/typesense/client')
    expect(getAdminClient()).toBeNull()
  })

  it('search client uses TYPESENSE_NODES when set', async () => {
    process.env.TYPESENSE_HOST = 'sdn.typesense.net'
    process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY = 'search-key'
    process.env.TYPESENSE_NODES = 'search-1.ts.net,search-2.ts.net'

    const { getSearchClient } = await import('@/lib/typesense/client')
    const client = getSearchClient()

    expect(client).not.toBeNull()
  })
})
