/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Tests for app/actions/stripe.ts — protection plan changes in this PR.
 *
 * The PR adds two new entries to the PROTECTION_PLANS map:
 *   - 'certified':      { name: 'PlanetCare Certified™',      priceInCents: 300000 }
 *   - 'certified-plus': { name: 'PlanetCare Certified Plus™', priceInCents: 485000 }
 *
 * Because PROTECTION_PLANS is a private module-level constant in a 'use server'
 * file, we verify its behaviour indirectly by calling startVehicleCheckout with
 * various protectionPlanId values and asserting on the line items passed to
 * stripe.checkout.sessions.create.
 *
 * Also tests validateCentsAmount (indirectly via checkout calls).
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock 'use server' directive helpers ─────────────────────────────────────
// next/headers is referenced by server-action infrastructure
vi.mock('next/headers', () => ({ headers: vi.fn() }))

// ─── Mock Stripe client ────────────────────────────────────────────────────
const mockSessionCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: mockSessionCreate,
      },
    },
  })),
}))

// ─── Mock Supabase admin client ────────────────────────────────────────────
// The RPC must succeed and return a valid vehicle lock for any checkout to proceed.
// After locking, the server action fetches vehicle data via .from('vehicles').
const mockRpc = vi.fn()
const mockFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    rpc: mockRpc,
    from: mockFrom,
  })),
}))

// ─── Import after mocks are set up ────────────────────────────────────────
const { startVehicleCheckout } = await import('@/app/actions/stripe')

/** Default lock result — a successfully locked vehicle */
function makeLockResult(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      success: true,
      id: 'veh-001',
      year: 2022,
      make: 'Toyota',
      model: 'Camry',
      price: 2500000, // in cents: $25,000
      status: 'available',
      ...overrides,
    },
    error: null,
  }
}

/** Default vehicle row returned by the .from('vehicles') query */
const DEFAULT_VEHICLE_ROW = {
  id: 'veh-001',
  year: 2022,
  make: 'Toyota',
  model: 'Camry',
  price: 2500000,
  status: 'available',
}

/** Default Stripe session returned by the mock */
const DEFAULT_SESSION = { client_secret: 'cs_test_abc123' }

beforeEach(() => {
  vi.clearAllMocks()
  mockRpc.mockResolvedValue(makeLockResult())
  mockSessionCreate.mockResolvedValue(DEFAULT_SESSION)
  // Route .from() calls by table name:
  //   'vehicles'     → .select(...).eq(...).single()
  //   'reservations' → .insert(...).select(...).single()
  mockFrom.mockImplementation((table: string) => {
    if (table === 'reservations') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'res-mock-001' }, error: null }),
          }),
        }),
      }
    }
    // Default: vehicles table
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: DEFAULT_VEHICLE_ROW, error: null }),
        }),
      }),
    }
  })
})

// ─── New plan IDs: 'certified' ─────────────────────────────────────────────

describe("startVehicleCheckout with protectionPlanId 'certified' (new in PR)", () => {
  it('adds a line item for the certified plan with the correct name', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified',
      depositOnly: false,
      customerEmail: 'buyer@example.com',
    })

    expect(mockSessionCreate).toHaveBeenCalledOnce()

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string }; unit_amount: number } }>

    const certifiedItem = lineItems.find(
      (item) => item.price_data.product_data.name === 'PlanetCare Certified™'
    )
    expect(certifiedItem).toBeDefined()
  })

  it('charges 300000 cents ($3,000) for the certified plan', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified',
      depositOnly: false,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string }; unit_amount: number } }>

    const certifiedItem = lineItems.find(
      (item) => item.price_data.product_data.name === 'PlanetCare Certified™'
    )
    expect(certifiedItem!.price_data.unit_amount).toBe(300000)
  })

  it('stores the certified protectionPlanId in session metadata', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified',
      depositOnly: false,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    expect(params.metadata.protectionPlanId).toBe('certified')
  })

  it('does not include a protection plan line item when depositOnly is true', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified',
      depositOnly: true,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string } } }>

    const certifiedItem = lineItems.find(
      (item) => item.price_data.product_data.name === 'PlanetCare Certified™'
    )
    expect(certifiedItem).toBeUndefined()
  })
})

// ─── New plan IDs: 'certified-plus' ───────────────────────────────────────

describe("startVehicleCheckout with protectionPlanId 'certified-plus' (new in PR)", () => {
  it('adds a line item for the certified-plus plan with the correct name', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified-plus',
      depositOnly: false,
    })

    expect(mockSessionCreate).toHaveBeenCalledOnce()

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string }; unit_amount: number } }>

    const certifiedPlusItem = lineItems.find(
      (item) => item.price_data.product_data.name === 'PlanetCare Certified Plus™'
    )
    expect(certifiedPlusItem).toBeDefined()
  })

  it('charges 485000 cents ($4,850) for the certified-plus plan', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified-plus',
      depositOnly: false,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string }; unit_amount: number } }>

    const certifiedPlusItem = lineItems.find(
      (item) => item.price_data.product_data.name === 'PlanetCare Certified Plus™'
    )
    expect(certifiedPlusItem!.price_data.unit_amount).toBe(485000)
  })

  it('stores the certified-plus protectionPlanId in session metadata', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified-plus',
      depositOnly: false,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    expect(params.metadata.protectionPlanId).toBe('certified-plus')
  })

  it('does not add a plan line item when depositOnly is true (even with certified-plus)', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified-plus',
      depositOnly: true,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string } } }>
    expect(lineItems).toHaveLength(1) // only the vehicle deposit line item
  })
})

// ─── Existing plan IDs still work ─────────────────────────────────────────

describe('startVehicleCheckout with pre-existing plan IDs (regression)', () => {
  it('still processes the essential plan correctly', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'essential',
      depositOnly: false,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string }; unit_amount: number } }>

    const essentialItem = lineItems.find(
      (item) => item.price_data.product_data.name === 'PlanetCare Essential'
    )
    expect(essentialItem).toBeDefined()
    expect(essentialItem!.price_data.unit_amount).toBe(195000)
  })

  it('still processes the smart plan correctly', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'smart',
      depositOnly: false,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string }; unit_amount: number } }>

    const smartItem = lineItems.find(
      (item) => item.price_data.product_data.name === 'PlanetCare Smart'
    )
    expect(smartItem).toBeDefined()
    expect(smartItem!.price_data.unit_amount).toBe(300000)
  })

  it('still processes the lifeproof plan correctly', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'lifeproof',
      depositOnly: false,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    const lineItems = params.line_items as Array<{ price_data: { product_data: { name: string }; unit_amount: number } }>

    const lifeproofItem = lineItems.find(
      (item) => item.price_data.product_data.name === 'PlanetCare Life Proof'
    )
    expect(lifeproofItem).toBeDefined()
    expect(lifeproofItem!.price_data.unit_amount).toBe(485000)
  })
})

// ─── Unknown plan IDs are silently ignored ────────────────────────────────

describe('startVehicleCheckout with an unknown protectionPlanId', () => {
  it('creates a checkout session without a plan line item for an unknown planId', async () => {
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'nonexistent-plan',
      depositOnly: false,
    })

    const [params] = mockSessionCreate.mock.calls[0]
    // Only the vehicle line item, no protection plan
    const lineItems = params.line_items as unknown[]
    expect(lineItems).toHaveLength(1)
  })
})

// ─── Plan price equivalence: certified vs smart, certified-plus vs lifeproof

describe('price equivalences between old and new plans', () => {
  it('certified and smart have the same price (300000 cents)', async () => {
    // Call with certified
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified',
      depositOnly: false,
    })
    const [certifiedCall] = mockSessionCreate.mock.calls[0]
    const certifiedItems = certifiedCall.line_items as Array<{ price_data: { unit_amount: number; product_data: { name: string } } }>
    const certifiedPlanItem = certifiedItems.find((i) => i.price_data.product_data.name === 'PlanetCare Certified™')!

    vi.clearAllMocks()
    mockRpc.mockResolvedValue(makeLockResult())
    mockSessionCreate.mockResolvedValue(DEFAULT_SESSION)

    // Call with smart
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'smart',
      depositOnly: false,
    })
    const [smartCall] = mockSessionCreate.mock.calls[0]
    const smartItems = smartCall.line_items as Array<{ price_data: { unit_amount: number; product_data: { name: string } } }>
    const smartPlanItem = smartItems.find((i) => i.price_data.product_data.name === 'PlanetCare Smart')!

    expect(certifiedPlanItem.price_data.unit_amount).toBe(smartPlanItem.price_data.unit_amount)
  })

  it('certified-plus and lifeproof have the same price (485000 cents)', async () => {
    // Call with certified-plus
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'certified-plus',
      depositOnly: false,
    })
    const [certifiedPlusCall] = mockSessionCreate.mock.calls[0]
    const certifiedPlusItems = certifiedPlusCall.line_items as Array<{ price_data: { unit_amount: number; product_data: { name: string } } }>
    const certifiedPlusPlanItem = certifiedPlusItems.find((i) => i.price_data.product_data.name === 'PlanetCare Certified Plus™')!

    vi.clearAllMocks()
    mockRpc.mockResolvedValue(makeLockResult())
    mockSessionCreate.mockResolvedValue(DEFAULT_SESSION)

    // Call with lifeproof
    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      protectionPlanId: 'lifeproof',
      depositOnly: false,
    })
    const [lifeproofCall] = mockSessionCreate.mock.calls[0]
    const lifeproofItems = lifeproofCall.line_items as Array<{ price_data: { unit_amount: number; product_data: { name: string } } }>
    const lifeproofPlanItem = lifeproofItems.find((i) => i.price_data.product_data.name === 'PlanetCare Life Proof')!

    expect(certifiedPlusPlanItem.price_data.unit_amount).toBe(lifeproofPlanItem.price_data.unit_amount)
  })
})

// ─── Vehicle lock failure path ────────────────────────────────────────────

describe('startVehicleCheckout — lock failure', () => {
  it('throws when the vehicle lock RPC returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Vehicle not found' } })

    await expect(
      startVehicleCheckout({
        vehicleId: 'veh-missing',
        vehicleName: '2022 Toyota Camry',
        depositOnly: true,
      })
    ).rejects.toThrow('Failed to verify vehicle availability')
  })

  it('throws when the vehicle is not available (success: false)', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, error: 'Vehicle already reserved' },
      error: null,
    })

    await expect(
      startVehicleCheckout({
        vehicleId: 'veh-reserved',
        vehicleName: '2022 Toyota Camry',
        depositOnly: true,
      })
    ).rejects.toThrow('Vehicle already reserved')
  })
})

// ─── PostgREST scalar boolean lockResult (scalar unwrap) ──────────────────

describe('startVehicleCheckout — scalar boolean lockResult (PostgREST unwrap)', () => {
  it('succeeds when lockResult is scalar true and fetches vehicle data separately', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })

    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      depositOnly: true,
    })

    expect(mockSessionCreate).toHaveBeenCalledOnce()
    expect(mockFrom).toHaveBeenCalledWith('vehicles')
  })

  it('throws when lockResult is scalar false', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })

    await expect(
      startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: '2022 Toyota Camry',
        depositOnly: true,
      })
    ).rejects.toThrow('Vehicle is not available for checkout')
  })

  it('throws when lockResult is null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    await expect(
      startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: '2022 Toyota Camry',
        depositOnly: true,
      })
    ).rejects.toThrow('Vehicle is not available for checkout')
  })

  it('uses vehicle data from lock object when RPC returns full JSONB (no separate query)', async () => {
    mockRpc.mockResolvedValue(makeLockResult())

    await startVehicleCheckout({
      vehicleId: 'veh-001',
      vehicleName: '2022 Toyota Camry',
      depositOnly: true,
    })

    expect(mockSessionCreate).toHaveBeenCalledOnce()
    // Should NOT call .from('vehicles') when the RPC returns the full object
    // (it will still call .from('reservations') for depositOnly: true)
    expect(mockFrom).not.toHaveBeenCalledWith('vehicles')
  })
})