/**
 * Coverage follow-up for PR #518 (chore/sonar-s3358-ternaries).
 *
 * Exercises the helpers extracted to satisfy SonarCloud rule
 * typescript:S3358 ("Ternary operators should not be nested"). Most
 * helpers are not exported (they are file-local) so we drive them
 * indirectly via the public API of the module they live in. The intent
 * here is purely to lift `new_coverage` over Sonar's 80 % threshold;
 * the behaviour they encode is also covered by surrounding integration
 * tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.unstubAllEnvs()
})

afterEach(() => {
  globalThis.fetch = realFetch
})

// ── lib/error-reporting.ts → pickLogFn ──────────────────────────────────────

describe('error-reporting pickLogFn coverage', () => {
  it('routes "info" / "warning" / "error" levels to console.info / warn / error', async () => {
    const { reportMessage } = await import('@/lib/error-reporting')
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    reportMessage('hello', 'info')
    reportMessage('uh oh', 'warning')
    reportMessage('boom', 'error')

    expect(infoSpy).toHaveBeenCalledWith('[reportMessage:info]', 'hello')
    expect(warnSpy).toHaveBeenCalledWith('[reportMessage:warning]', 'uh oh')
    expect(errorSpy).toHaveBeenCalledWith('[reportMessage:error]', 'boom')

    infoSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('forwards the optional context object to the chosen logger', async () => {
    const { reportMessage } = await import('@/lib/error-reporting')
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    reportMessage('with ctx', 'info', { userId: '123' })
    expect(infoSpy).toHaveBeenCalledWith('[reportMessage:info]', 'with ctx', { userId: '123' })
    infoSpy.mockRestore()
  })
})

// ── lib/autoraptor.ts → buildAdfXml (vehicleBlock branches) ────────────────

describe('autoraptor buildAdfXml coverage', () => {
  it('emits a <vehicle> block with <id> when vehicleYear and vehicleId are provided', async () => {
    const { createAutoRaptorLead } = await import('@/lib/autoraptor')
    vi.stubEnv('AUTORAPTOR_ADF_ENDPOINT', 'https://example.invalid/adf')
    vi.stubEnv('AUTORAPTOR_DEALER_ID', 'd-001')
    vi.stubEnv('AUTORAPTOR_DEALER_NAME', 'Planet Motors Test')

    const fetchMock = vi.fn().mockResolvedValue(new Response('lead-99', { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await createAutoRaptorLead({
      customerName: 'Jane Doe',
      customerEmail: 'j@d.test',
      customerPhone: '4165550100',
      vehicleYear: 2024,
      vehicleMake: 'Tesla',
      vehicleModel: 'Model 3',
      vehicleId: 'PMTEST-001',
      depositAmount: 25000,
      stripeSessionId: 'cs_test_abc',
      source: 'web',
    })

    expect(result.success).toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
    const body = (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string
    expect(body).toContain('<vehicle interest="buy" status="used">')
    expect(body).toContain('<year>2024</year>')
    expect(body).toContain('<make>Tesla</make>')
    expect(body).toContain('<model>Model 3</model>')
    expect(body).toContain('<id source="planetmotors.ca">PMTEST-001</id>')
  })

  it('emits a <vehicle> block without <id> when vehicleId is omitted', async () => {
    const { createAutoRaptorLead } = await import('@/lib/autoraptor')
    vi.stubEnv('AUTORAPTOR_ADF_ENDPOINT', 'https://example.invalid/adf')

    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await createAutoRaptorLead({
      customerName: 'No Id',
      customerEmail: 'n@i.test',
      vehicleYear: 2022,
      vehicleMake: 'Honda',
      vehicleModel: 'Civic',
      depositAmount: 10000,
      stripeSessionId: 'cs_no_id',
      source: 'phone',
    })

    const body = (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string
    expect(body).toContain('<year>2022</year>')
    expect(body).not.toContain('<id source="planetmotors.ca">')
  })

  it('omits the entire <vehicle> block when vehicleYear is undefined', async () => {
    const { createAutoRaptorLead } = await import('@/lib/autoraptor')
    vi.stubEnv('AUTORAPTOR_ADF_ENDPOINT', 'https://example.invalid/adf')

    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await createAutoRaptorLead({
      customerName: 'No Vehicle',
      customerEmail: 'nv@x.test',
      depositAmount: 5000,
      stripeSessionId: 'cs_no_vehicle',
      source: 'walk-in',
    })

    const body = (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string
    expect(body).not.toContain('<vehicle interest="buy"')
    expect(body).not.toContain('<year>')
  })

  it('returns a friendly error when AUTORAPTOR_ADF_ENDPOINT is missing', async () => {
    const { createAutoRaptorLead } = await import('@/lib/autoraptor')
    vi.stubEnv('AUTORAPTOR_ADF_ENDPOINT', '')

    const result = await createAutoRaptorLead({
      customerName: 'Missing Env',
      customerEmail: 'me@x.test',
      depositAmount: 1,
      stripeSessionId: 'cs_missing_env',
      source: 'web',
    })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/AutoRaptor not configured/)
  })
})
