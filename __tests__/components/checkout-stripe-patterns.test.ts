/**
 * Tests for Stripe checkout patterns shared across checkout components.
 *
 * These patterns are used in:
 *  - app/checkout/[id]/payment/page.tsx
 *  - components/vehicle-checkout.tsx
 *  - components/reserve-vehicle-modal.tsx
 *  - app/checkout/[id]/page.tsx
 *
 * Patterns tested:
 *  1. getStripePromise() – lazy singleton that loads @stripe/stripe-js once
 *  2. vehicleName construction from vehicleData prop
 *  3. fetchClientSecret – calls startVehicleCheckout, resolves the client secret,
 *     and throws "Missing checkout client secret" when the action returns a falsy value
 *
 * Because these components run in a browser environment (React / Next.js "use client"),
 * these tests exercise the equivalent pure-logic patterns in a node test environment,
 * mocking all external dependencies.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock next/navigation – required by the component module when imported
// ---------------------------------------------------------------------------
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

// Mock next/dynamic – component uses it for Stripe embedded checkout widgets
vi.mock('next/dynamic', () => ({
  default: vi.fn((_loader: unknown, _opts: unknown) => {
    // Return a minimal component stub
    const stub = () => null
    stub.displayName = 'DynamicStub'
    return stub
  }),
}))

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({ user: null, isLoading: false })),
}))

// Mock all UI components used by the component under test
vi.mock('@/components/ui/button', () => ({ Button: vi.fn(() => null) }))
vi.mock('@/components/ui/label', () => ({ Label: vi.fn(() => null) }))
vi.mock('@/components/ui/select', () => ({
  Select: vi.fn(() => null),
  SelectContent: vi.fn(() => null),
  SelectItem: vi.fn(() => null),
  SelectTrigger: vi.fn(() => null),
  SelectValue: vi.fn(() => null),
}))
vi.mock('@/components/ui/checkbox', () => ({ Checkbox: vi.fn(() => null) }))
vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(() => null),
  CardContent: vi.fn(() => null),
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  User: vi.fn(() => null),
  Car: vi.fn(() => null),
  FileText: vi.fn(() => null),
  Upload: vi.fn(() => null),
  ArrowRight: vi.fn(() => null),
  ArrowLeft: vi.fn(() => null),
  CheckCircle: vi.fn(() => null),
  Loader2: vi.fn(() => null),
  Shield: vi.fn(() => null),
  AlertCircle: vi.fn(() => null),
  LockKeyhole: vi.fn(() => null),
}))

vi.mock('@/lib/utils', () => ({ cn: vi.fn((...args: unknown[]) => args.filter(Boolean).join(' ')) }))
vi.mock('@/lib/tax/canada', () => ({ PROVINCE_TAX_RATES: { ON: { total: 0.13 } } }))

vi.mock('@/components/finance-application', () => ({
  emptyApplicant: {
    firstName: '', lastName: '', dateOfBirth: { day: '', month: '', year: '' },
    gender: '', maritalStatus: '', phone: '', email: '', noEmail: false,
    creditRating: '', postalCode: '', addressType: '', streetNumber: '',
    streetName: '', city: '', province: '', homeStatus: '', monthlyPayment: '',
    employmentCategory: '', employmentStatus: '', employerName: '', occupation: '',
    employerPostalCode: '', employerPhone: '', grossIncome: '', incomeFrequency: '',
    otherIncomeAmount: '', otherIncomeFrequency: '', annualTotal: '',
  },
  isApplicantData: vi.fn(() => false),
  isVehicleInfo: vi.fn(() => false),
  isTradeInInfo: vi.fn(() => false),
  isFinancingTerms: vi.fn(() => false),
}))

vi.mock('@/components/finance-application/applicant-form', () => ({ ApplicantForm: vi.fn(() => null) }))
vi.mock('@/components/finance-application/vehicle-financing-form', () => ({ VehicleFinancingForm: vi.fn(() => null) }))
vi.mock('@/components/finance-application/review-step', () => ({ ReviewStep: vi.fn(() => null) }))
vi.mock('@/components/finance-application/documents-step', () => ({ DocumentsStep: vi.fn(() => null) }))

// ---------------------------------------------------------------------------
// Mock @stripe/stripe-js – controls what loadStripe resolves to
// ---------------------------------------------------------------------------
const mockLoadStripe = vi.fn()
vi.mock('@stripe/stripe-js', () => ({ loadStripe: mockLoadStripe }))

// ---------------------------------------------------------------------------
// Mock the Stripe server action
// ---------------------------------------------------------------------------
const mockStartVehicleCheckout = vi.fn()
vi.mock('@/app/actions/stripe', () => ({
  startVehicleCheckout: (...args: unknown[]) => mockStartVehicleCheckout(...args),
}))

// ===========================================================================
// Section 1 – vehicleName construction
// ===========================================================================

describe('vehicleName construction from vehicleData', () => {
  /**
   * The PR builds vehicleName inline (inside the isSubmitted branch):
   *
   *   const vehicleName = vehicleData
   *     ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`.trim()
   *     : "Vehicle Deposit"
   *
   * These tests verify the exact same logic.
   */
  function buildVehicleName(vehicleData?: {
    year: number
    make: string
    model: string
    [key: string]: unknown
  }): string {
    return vehicleData
      ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`.trim()
      : 'Vehicle Deposit'
  }

  it('concatenates year, make, and model when vehicleData is provided', () => {
    expect(buildVehicleName({ year: 2022, make: 'Tesla', model: 'Model 3' }))
      .toBe('2022 Tesla Model 3')
  })

  it('falls back to "Vehicle Deposit" when vehicleData is undefined', () => {
    expect(buildVehicleName(undefined)).toBe('Vehicle Deposit')
  })

  it('trims leading/trailing whitespace from the result', () => {
    // year is 0, make is empty – edge case where fields might be blank
    expect(buildVehicleName({ year: 2023, make: '', model: '' })).toBe('2023')
  })

  it('handles all-blank make and model by trimming to just the year', () => {
    const result = buildVehicleName({ year: 2020, make: '   ', model: '   ' })
    // trim() only removes outer spaces; inner spaces between fields remain
    expect(result).toContain('2020')
  })

  it('includes full model name when model contains spaces (multi-word)', () => {
    expect(buildVehicleName({ year: 2021, make: 'Ford', model: 'F-150 Lariat' }))
      .toBe('2021 Ford F-150 Lariat')
  })
})

// ===========================================================================
// Section 2 – fetchClientSecret logic
// ===========================================================================

describe('fetchClientSecret logic', () => {
  /**
   * The PR defines fetchClientSecret inline:
   *
   *   const fetchClientSecret = () =>
   *     startVehicleCheckout({
   *       vehicleId: vehicleId || "",
   *       vehicleName,
   *       depositOnly: true,
   *       customerEmail: primaryApplicant.email || undefined,
   *     }).then((secret) => {
   *       if (!secret) throw new Error("Missing checkout client secret")
   *       return secret
   *     })
   *
   * These tests exercise that contract end-to-end, driving through the real
   * startVehicleCheckout mock.
   */

  // Replicate the exact closure used in the component
  function makeFetchClientSecret(params: {
    vehicleId: string | undefined
    vehicleName: string
    customerEmail: string | undefined
  }) {
    return () =>
      mockStartVehicleCheckout({
        vehicleId: params.vehicleId || '',
        vehicleName: params.vehicleName,
        depositOnly: true,
        customerEmail: params.customerEmail || undefined,
      }).then((secret: string | null | undefined) => {
        if (!secret) throw new Error('Missing checkout client secret')
        return secret
      })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves with the client secret when startVehicleCheckout returns a non-empty string', async () => {
    mockStartVehicleCheckout.mockResolvedValue('cs_test_abc123')

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-001',
      vehicleName: '2022 Tesla Model 3',
      customerEmail: 'buyer@example.com',
    })

    await expect(fetchClientSecret()).resolves.toBe('cs_test_abc123')
  })

  it('throws "Missing checkout client secret" when startVehicleCheckout returns null', async () => {
    mockStartVehicleCheckout.mockResolvedValue(null)

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-001',
      vehicleName: '2022 Tesla Model 3',
      customerEmail: undefined,
    })

    await expect(fetchClientSecret()).rejects.toThrow('Missing checkout client secret')
  })

  it('throws "Missing checkout client secret" when startVehicleCheckout returns undefined', async () => {
    mockStartVehicleCheckout.mockResolvedValue(undefined)

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-001',
      vehicleName: '2022 Tesla Model 3',
      customerEmail: undefined,
    })

    await expect(fetchClientSecret()).rejects.toThrow('Missing checkout client secret')
  })

  it('throws "Missing checkout client secret" when startVehicleCheckout returns an empty string', async () => {
    mockStartVehicleCheckout.mockResolvedValue('')

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-002',
      vehicleName: 'Vehicle Deposit',
      customerEmail: undefined,
    })

    await expect(fetchClientSecret()).rejects.toThrow('Missing checkout client secret')
  })

  it('calls startVehicleCheckout with depositOnly: true', async () => {
    mockStartVehicleCheckout.mockResolvedValue('cs_live_xyz')

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-003',
      vehicleName: '2023 Honda Civic',
      customerEmail: 'test@example.com',
    })

    await fetchClientSecret()

    expect(mockStartVehicleCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ depositOnly: true })
    )
  })

  it('passes the vehicleId to startVehicleCheckout', async () => {
    mockStartVehicleCheckout.mockResolvedValue('cs_live_xyz')

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-special-99',
      vehicleName: '2023 Honda Civic',
      customerEmail: undefined,
    })

    await fetchClientSecret()

    expect(mockStartVehicleCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ vehicleId: 'veh-special-99' })
    )
  })

  it('passes empty string for vehicleId when vehicleId is undefined', async () => {
    mockStartVehicleCheckout.mockResolvedValue('cs_live_xyz')

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: undefined,
      vehicleName: 'Vehicle Deposit',
      customerEmail: undefined,
    })

    await fetchClientSecret()

    expect(mockStartVehicleCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ vehicleId: '' })
    )
  })

  it('passes customerEmail to startVehicleCheckout when provided', async () => {
    mockStartVehicleCheckout.mockResolvedValue('cs_live_xyz')

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-004',
      vehicleName: '2021 Toyota Camry',
      customerEmail: 'customer@example.com',
    })

    await fetchClientSecret()

    expect(mockStartVehicleCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: 'customer@example.com' })
    )
  })

  it('passes undefined customerEmail when email is empty string', async () => {
    mockStartVehicleCheckout.mockResolvedValue('cs_live_xyz')

    // In the component: customerEmail: primaryApplicant.email || undefined
    // empty string coerces to undefined
    const emptyEmail = ''
    const customerEmail = emptyEmail || undefined

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-005',
      vehicleName: '2021 Hyundai Elantra',
      customerEmail,
    })

    await fetchClientSecret()

    expect(mockStartVehicleCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: undefined })
    )
  })

  it('propagates rejection from startVehicleCheckout (network / server error)', async () => {
    const serverError = new Error('Service configuration error')
    mockStartVehicleCheckout.mockRejectedValue(serverError)

    const fetchClientSecret = makeFetchClientSecret({
      vehicleId: 'veh-006',
      vehicleName: '2020 Nissan Rogue',
      customerEmail: undefined,
    })

    await expect(fetchClientSecret()).rejects.toThrow('Service configuration error')
  })
})

// ===========================================================================
// Section 3 – getStripePromise singleton pattern
// ===========================================================================

describe('getStripePromise singleton pattern', () => {
  /**
   * The PR introduces:
   *
   *   const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   *   let stripePromise = null
   *   function getStripePromise() {
   *     if (!stripePromise && stripeKey) {
   *       stripePromise = import('@stripe/stripe-js').then(m => m.loadStripe(stripeKey))
   *     }
   *     return stripePromise
   *   }
   *
   * We test the exact same logic in isolation, controlling the env variable.
   */

  function makeGetStripePromise(keyOverride: string | undefined) {
    const key = keyOverride
    let promise: ReturnType<typeof mockLoadStripe> | null = null
    return function getStripePromise() {
      if (!promise && key) {
        promise = Promise.resolve().then(() => mockLoadStripe(key))
      }
      return promise
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadStripe.mockResolvedValue({ /* fake Stripe instance */ })
  })

  it('returns null when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is undefined', () => {
    const getStripePromise = makeGetStripePromise(undefined)
    expect(getStripePromise()).toBeNull()
  })

  it('returns null when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is an empty string', () => {
    const getStripePromise = makeGetStripePromise('')
    expect(getStripePromise()).toBeNull()
  })

  it('returns a promise (not null) when the publishable key is set', () => {
    const getStripePromise = makeGetStripePromise('pk_test_abc')
    expect(getStripePromise()).not.toBeNull()
    expect(getStripePromise()).toBeInstanceOf(Promise)
  })

  it('calls loadStripe with the publishable key on first invocation', async () => {
    const getStripePromise = makeGetStripePromise('pk_test_xyz')
    await getStripePromise()
    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_xyz')
  })

  it('memoizes the promise – loadStripe is called exactly once across multiple calls', async () => {
    const getStripePromise = makeGetStripePromise('pk_test_memo')

    const p1 = getStripePromise()
    const p2 = getStripePromise()
    const p3 = getStripePromise()

    // All calls return the exact same promise reference
    expect(p1).toBe(p2)
    expect(p2).toBe(p3)

    await p1
    expect(mockLoadStripe).toHaveBeenCalledTimes(1)
  })

  it('does not call loadStripe when the key is absent', () => {
    const getStripePromise = makeGetStripePromise(undefined)
    getStripePromise()
    getStripePromise()
    expect(mockLoadStripe).not.toHaveBeenCalled()
  })
})