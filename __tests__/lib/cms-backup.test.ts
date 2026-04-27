/**
 * Coverage for lib/cms/backup.ts — drives SonarCloud new_coverage condition.
 * Pattern matches __tests__/lib/coverage-followup-883.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── node:fs mock state ──────────────────────────────────────────────────────
const fsState = {
  files: new Map<string, string>(),
}

const mkdirSyncMock = vi.fn()
const writeFileSyncMock = vi.fn((p: string, data: string) => {
  fsState.files.set(p, data)
})
const readFileSyncMock = vi.fn((p: string) => fsState.files.get(p) ?? '')
const existsSyncMock = vi.fn((p: string) => fsState.files.has(p))
const statSyncMock = vi.fn((p: string) => ({
  size: (fsState.files.get(p) ?? '').length,
}))

vi.mock('node:fs', () => ({
  mkdirSync: mkdirSyncMock,
  writeFileSync: writeFileSyncMock,
  readFileSync: readFileSyncMock,
  existsSync: existsSyncMock,
  statSync: statSyncMock,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.unstubAllEnvs()
  fsState.files.clear()
  mkdirSyncMock.mockClear()
  writeFileSyncMock.mockClear()
  readFileSyncMock.mockClear()
  existsSyncMock.mockClear()
  statSyncMock.mockClear()
})

afterEach(() => {
  globalThis.fetch = realFetch
  vi.resetModules()
})

function mockFetchOnce(body: string, init: ResponseInit = { status: 200 }) {
  const fn = vi.fn().mockResolvedValue(new Response(body, init))
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

// ── backupSanityDataset ─────────────────────────────────────────────────────
describe('backupSanityDataset', () => {
  it('returns failure when SANITY_API_TOKEN is missing', async () => {
    vi.stubEnv('SANITY_API_TOKEN', '')
    const { backupSanityDataset } = await import('@/lib/cms/backup')

    const result = await backupSanityDataset()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/SANITY_API_TOKEN/)
    expect(mkdirSyncMock).not.toHaveBeenCalled()
  })

  it('returns failure when Sanity API responds with non-OK status', async () => {
    vi.stubEnv('SANITY_API_TOKEN', 'secret')
    const fetchSpy = mockFetchOnce('Internal Error', { status: 500, statusText: 'Server Error' })
    const { backupSanityDataset } = await import('@/lib/cms/backup')

    const result = await backupSanityDataset()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/500/)
    expect(fetchSpy).toHaveBeenCalledOnce()
    expect(mkdirSyncMock).toHaveBeenCalledOnce()
    expect(typeof result.durationMs).toBe('number')
  })

  it('returns failure when the exported file is empty', async () => {
    vi.stubEnv('SANITY_API_TOKEN', 'secret')
    mockFetchOnce('') // empty NDJSON body
    const { backupSanityDataset } = await import('@/lib/cms/backup')

    const result = await backupSanityDataset()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Validation failed/)
    expect(result.error).toMatch(/empty/i)
  })

  it('returns failure when the first line is not valid JSON', async () => {
    vi.stubEnv('SANITY_API_TOKEN', 'secret')
    mockFetchOnce('this is not json\n{"_id":"abc"}')
    const { backupSanityDataset } = await import('@/lib/cms/backup')

    const result = await backupSanityDataset()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Validation failed/)
    expect(result.error).toMatch(/not valid JSON/)
  })

  it('writes the file and returns success metadata on a healthy response', async () => {
    vi.stubEnv('SANITY_API_TOKEN', 'secret')
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'wlxj8olw')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')
    const ndjson = '{"_id":"a"}\n{"_id":"b"}\n{"_id":"c"}\n'
    const fetchSpy = mockFetchOnce(ndjson)
    const { backupSanityDataset } = await import('@/lib/cms/backup')

    const result = await backupSanityDataset()
    expect(result.success).toBe(true)
    expect(result.lineCount).toBe(3)
    expect(result.sizeBytes).toBe(ndjson.length)
    expect(result.filePath).toMatch(/sanity-production-.*\.ndjson$/)
    expect(typeof result.durationMs).toBe('number')

    // The fetch URL should embed project + dataset.
    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string
    expect(calledUrl).toContain('wlxj8olw.api.sanity.io')
    expect(calledUrl).toContain('/data/export/production')

    // Authorization header is set with the bearer token.
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer secret')

    // File was actually written via writeFileSync.
    expect(writeFileSyncMock).toHaveBeenCalledOnce()
  })

  it('captures thrown errors from fetch into the result', async () => {
    vi.stubEnv('SANITY_API_TOKEN', 'secret')
    const fn = vi.fn().mockRejectedValue(new Error('network down'))
    globalThis.fetch = fn as unknown as typeof fetch
    const { backupSanityDataset } = await import('@/lib/cms/backup')

    const result = await backupSanityDataset()
    expect(result.success).toBe(false)
    expect(result.error).toBe('network down')
    expect(typeof result.durationMs).toBe('number')
  })

  it('falls back to default project ID and dataset when env vars are unset', async () => {
    vi.stubEnv('SANITY_API_TOKEN', 'secret')
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')
    vi.stubEnv('SANITY_PROJECT_ID', '')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '')
    const fetchSpy = mockFetchOnce('{"_id":"x"}\n')
    const { backupSanityDataset } = await import('@/lib/cms/backup')

    const result = await backupSanityDataset()
    expect(result.success).toBe(true)
    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string
    expect(calledUrl).toContain('wlxj8olw.api.sanity.io')
    expect(calledUrl).toContain('/data/export/production')
  })
})
