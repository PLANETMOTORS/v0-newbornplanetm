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

  it('renders every optional row (image / price / mileage / VIN / stock # / VDP CTA / phone / message / campaign / leadId highlight) when present', async () => {
    const { notifyLead } = await import('@/lib/email/lead-notifier')
    const res = await notifyLead({
      source: 'vdp_inquiry',
      firstName: 'Full',
      lastName: 'Vehicle',
      email: 'full@v.test',
      // Drives the TRUE branch of every contact / vehicle / UTM / leadId
      // ternary in both buildInternalAlert + buildCustomerFollowUp.
      phone: '416-555-0100',
      message: 'Please call me ASAP.',
      leadId: 'lead-99',
      utm: { source: 'google', medium: 'cpc', campaign: 'spring-sale' },
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
    // Internal alert covers the TRUE branch of every ternary in
    // buildInternalVehicleCard *and* buildInternalAlert (phone, message,
    // utm.campaign, leadId-highlight, phone CTA).
    expect(internal.html).toContain('img src="https://cdn.example/img.jpg"')
    expect(internal.html).toContain('Mileage')
    expect(internal.html).toContain('VIN')
    expect(internal.html).toContain('Stock #')
    expect(internal.html).toContain('View VDP')
    expect(internal.html).toContain('416-555-0100')
    expect(internal.html).toContain('Please call me ASAP.')
    expect(internal.html).toContain('Campaign')
    expect(internal.html).toContain('spring-sale')
    expect(internal.html).toContain('?highlight=lead-99')
    expect(internal.html).toContain('Call 416-555-0100 now')
    // Customer follow-up covers the TRUE branch of
    // buildCustomerVehicleHighlight + the hasVehicle greeting branch +
    // hasVehicle subject branch.
    expect(customer.html).toContain('img src="https://cdn.example/img.jpg"')
    expect(customer.html).toContain('View Full Details')
    expect(customer.html).toContain('about the')
    expect(customer.subject).toContain('Your inquiry about the')
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

// ── lib/email/lead-notifier.ts → notifyLead / notifyAgentOnly error branches ──

describe('lead-notifier error / send-result branch coverage', () => {
  beforeEach(() => {
    sentEmails.length = 0
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.doUnmock('resend')
  })

  it('maps a fulfilled-with-error Resend response to { success: false, error } for both emails', async () => {
    vi.doMock('resend', () => {
      class ResendErrMock {
        emails = {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: { name: 'ApiError', message: 'invalid recipient' },
          }),
        }
        constructor(_key: string) {}
      }
      return { Resend: ResendErrMock }
    })
    vi.stubEnv('RESEND_API_KEY', 'test_key')

    const { notifyLead } = await import('@/lib/email/lead-notifier')
    const res = await notifyLead({
      source: 'contact_form',
      firstName: 'Err',
      lastName: 'Branch',
      email: 'err@v.test',
    })

    expect(res.internalEmail.success).toBe(false)
    expect(res.internalEmail.error).toContain('invalid recipient')
    expect(res.customerEmail.success).toBe(false)
    expect(res.customerEmail.error).toContain('invalid recipient')
  })

  it('maps a rejected Resend send to { success: false, error: String(reason) }', async () => {
    vi.doMock('resend', () => {
      class ResendRejectMock {
        emails = { send: vi.fn().mockRejectedValue(new Error('network down')) }
        constructor(_key: string) {}
      }
      return { Resend: ResendRejectMock }
    })
    vi.stubEnv('RESEND_API_KEY', 'test_key')

    const { notifyLead } = await import('@/lib/email/lead-notifier')
    const res = await notifyLead({
      source: 'contact_form',
      firstName: 'Reject',
      lastName: 'Branch',
      email: 'rej@v.test',
    })

    expect(res.internalEmail.success).toBe(false)
    expect(res.internalEmail.error).toMatch(/network down/)
    expect(res.customerEmail.success).toBe(false)
    expect(res.customerEmail.error).toMatch(/network down/)
  })

  it('notifyAgentOnly maps an error response to { success: false, error: JSON.stringify(...) }', async () => {
    vi.doMock('resend', () => {
      class ResendErrMock {
        emails = {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: { name: 'ApiError', message: 'rate limited' },
          }),
        }
        constructor(_key: string) {}
      }
      return { Resend: ResendErrMock }
    })
    vi.stubEnv('RESEND_API_KEY', 'test_key')

    const { notifyAgentOnly } = await import('@/lib/email/lead-notifier')
    const res = await notifyAgentOnly({
      source: 'trade_in',
      firstName: 'Agent',
      lastName: 'Err',
      email: 'agent@e.test',
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain('rate limited')
  })

  it('notifyAgentOnly returns { success: true, id } on a clean send', async () => {
    vi.doMock('resend', () => {
      class ResendOkMock {
        emails = {
          send: vi.fn().mockResolvedValue({ data: { id: 'res_ok_123' }, error: null }),
        }
        constructor(_key: string) {}
      }
      return { Resend: ResendOkMock }
    })
    vi.stubEnv('RESEND_API_KEY', 'test_key')

    const { notifyAgentOnly } = await import('@/lib/email/lead-notifier')
    const res = await notifyAgentOnly({
      source: 'reservation',
      firstName: 'Agent',
      lastName: 'Ok',
      email: 'agent@ok.test',
      vehicle: { id: 'v1', year: 2024, make: 'Tesla', model: 'Model 3' },
    })

    expect(res.success).toBe(true)
    expect(res.id).toBe('res_ok_123')
  })
})

// ── lib/email.ts → ico_confirmed template L321 offerAmount branches ─────────

describe('sendCustomerConfirmationEmail ico_confirmed (L321 coverage)', () => {
  it('exercises offerAmount truthy branch', async () => {
    vi.stubEnv('API_KEY_RESEND', 'test_key')
    const { sendCustomerConfirmationEmail } = await import('@/lib/email')
    const result = await sendCustomerConfirmationEmail(
      'buyer@test.com', 'ico_confirmed',
      { customerName: 'Alice', offerAmount: 32000 },
    )
    expect(result).toBeDefined()
    expect(result.success).toBe(true)
  })

  it('exercises offerAmount null/undefined branch', async () => {
    vi.stubEnv('API_KEY_RESEND', 'test_key')
    const { sendCustomerConfirmationEmail } = await import('@/lib/email')
    const result = await sendCustomerConfirmationEmail(
      'seller@test.com', 'ico_confirmed',
      { customerName: 'Bob' },
    )
    expect(result).toBeDefined()
    expect(result.success).toBe(true)
  })
})
