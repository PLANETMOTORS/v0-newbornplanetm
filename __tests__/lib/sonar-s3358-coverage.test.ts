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

// Capture every email body sent through the mocked Resend client so the
// vehicle-card branch tests can assert on the rendered HTML.
const sentEmails: Array<{ to: string; html: string; subject: string }> = []

vi.mock('resend', () => {
  class ResendMock {
    emails = {
      send: vi.fn().mockImplementation(async (args: Record<string, unknown>) => {
        sentEmails.push({
          to: String(args.to ?? ''),
          html: String(args.html ?? ''),
          subject: String(args.subject ?? ''),
        })
        return { data: { id: 'mock-id' }, error: null }
      }),
    }
    constructor(_key: string) {}
  }
  return { Resend: ResendMock }
})

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

// ── lib/email/lead-notifier.ts → buildInternal/CustomerVehicle{Card,Highlight} ──

describe('lead-notifier vehicle-card branch coverage', () => {
  beforeEach(() => {
    sentEmails.length = 0
    vi.stubEnv('RESEND_API_KEY', 'test_key')
  })

  it('renders all optional rows (image, price, mileage, VIN, stock #, VDP CTA) when present', async () => {
    const { notifyLead } = await import('@/lib/email/lead-notifier')
    const res = await notifyLead({
      source: 'vdp_inquiry',
      firstName: 'Full',
      lastName: 'Vehicle',
      email: 'full@v.test',
      vehicle: {
        id: 'veh-001',
        year: 2024,
        make: 'Tesla',
        model: 'Model Y',
        price: 64900,
        mileage: 12345,
        vin: '5YJYGDEE3MF000001',
        stockNumber: 'PM-001',
        imageUrl: 'https://cdn.example/img.jpg',
      },
    })

    expect(res.internalEmail.success).toBe(true)
    expect(res.customerEmail.success).toBe(true)
    expect(sentEmails.length).toBe(2)

    const [internal, customer] = sentEmails
    // Internal alert covers the TRUE branch of every ternary in buildInternalVehicleCard
    expect(internal.html).toContain('img src="https://cdn.example/img.jpg"')
    expect(internal.html).toContain('Mileage')
    expect(internal.html).toContain('VIN')
    expect(internal.html).toContain('Stock #')
    expect(internal.html).toContain('View VDP')
    // Customer follow-up covers the TRUE branch of buildCustomerVehicleHighlight
    expect(customer.html).toContain('img src="https://cdn.example/img.jpg"')
    expect(customer.html).toContain('View Full Details')
  })

  it('omits optional rows when fields are missing (FALSE branch of each ternary)', async () => {
    const { notifyLead } = await import('@/lib/email/lead-notifier')
    sentEmails.length = 0
    await notifyLead({
      source: 'contact_form',
      firstName: 'Sparse',
      lastName: 'Vehicle',
      email: 'sparse@v.test',
      // Vehicle present but no id / image / price / mileage / vin / stockNumber
      vehicle: { year: 2020, make: 'Honda', model: 'Civic' },
    })

    const [internal] = sentEmails
    // No image row, no price row, no mileage row, no VIN row, no stock row, no VDP CTA
    expect(internal.html).not.toContain('img src=')
    expect(internal.html).not.toContain('Mileage')
    expect(internal.html).not.toContain('VIN')
    expect(internal.html).not.toContain('Stock #')
    expect(internal.html).not.toContain('View VDP')
  })

  it('omits the entire vehicle card when there is no vehicle on the lead (early-return branch)', async () => {
    const { notifyLead } = await import('@/lib/email/lead-notifier')
    sentEmails.length = 0
    await notifyLead({
      source: 'newsletter',
      firstName: 'No',
      lastName: 'Vehicle',
      email: 'nv@v.test',
    })

    const [internal, customer] = sentEmails
    // The vehicle card markers must NOT appear when the lead has no vehicle.
    expect(internal.html).not.toContain('img src=')
    expect(internal.html).not.toContain('Mileage')
    expect(internal.html).not.toContain('Stock #')
    expect(customer.html).not.toContain('Your Vehicle of Interest')
    expect(customer.html).not.toContain('View Full Details')
  })

  it('omits VDP CTA when vehicle has fields but no id (vdpUrl FALSE branch)', async () => {
    const { notifyLead } = await import('@/lib/email/lead-notifier')
    sentEmails.length = 0
    await notifyLead({
      source: 'phone',
      firstName: 'No',
      lastName: 'Id',
      email: 'noid@v.test',
      vehicle: { year: 2022, make: 'Ford', model: 'F-150', price: 45000 },
    })

    const [internal] = sentEmails
    expect(internal.html).toContain('Price')
    // No vehicle.id → vdpUrl is null → no "View VDP" link in the internal alert.
    expect(internal.html).not.toContain('View VDP')
  })
})
