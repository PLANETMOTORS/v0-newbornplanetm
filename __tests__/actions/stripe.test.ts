import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---- Hoisted mock setup ----
const { mockRpc, mockSessionCreate, mockGetStripe, mockCreateAdminClient } = vi.hoisted(() => {
  const mockRpc = vi.fn()
  const mockSessionCreate = vi.fn()

  const mockStripeInstance = {
    checkout: {
      sessions: {
        create: mockSessionCreate,
      },
    },
  }

  const mockGetStripe = vi.fn().mockReturnValue(mockStripeInstance)

  const mockAdminClient = { rpc: mockRpc }
  const mockCreateAdminClient = vi.fn().mockReturnValue(mockAdminClient)

  return { mockRpc, mockSessionCreate, mockGetStripe, mockCreateAdminClient }
})

vi.mock('@/lib/stripe', () => ({ getStripe: mockGetStripe }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mockCreateAdminClient }))

const { startVehicleCheckout } = await import('@/app/actions/stripe')

// Helper: a successful lock result from the RPC
function makeLockResult(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      success: true,
      id: 'vehicle-uuid-123',
      year: 2022,
      make: 'Tesla',
      model: 'Model 3',
      price: 4500000, // $45,000 in cents
      status: 'available',
      ...overrides,
    },
    error: null,
  }
}

describe('startVehicleCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: successful lock
    mockRpc.mockResolvedValue(makeLockResult())
    // Default: successful Stripe session
    mockSessionCreate.mockResolvedValue({ client_secret: 'cs_test_secret_abc123' })
  })

  describe('RPC call — lock_vehicle_for_checkout', () => {
    it('calls lock_vehicle_for_checkout with only p_vehicle_id (no p_allowed_statuses)', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla Model 3',
      })

      expect(mockRpc).toHaveBeenCalledWith('lock_vehicle_for_checkout', {
        p_vehicle_id: 'veh-001',
      })
    })

    it('does NOT pass p_allowed_statuses to the RPC', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla Model 3',
      })

      const [[_name, args]] = mockRpc.mock.calls
      expect(args).not.toHaveProperty('p_allowed_statuses')
    })

    it('passes the correct vehicleId to the RPC', async () => {
      const vehicleId = 'my-specific-vehicle-id'
      await startVehicleCheckout({ vehicleId, vehicleName: 'Test Car' })

      expect(mockRpc).toHaveBeenCalledWith(
        'lock_vehicle_for_checkout',
        expect.objectContaining({ p_vehicle_id: vehicleId }),
      )
    })
  })

  describe('error handling — lock failures', () => {
    it('throws when the RPC returns a database error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'DB connection failed' } })

      await expect(
        startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla' }),
      ).rejects.toThrow('Failed to verify vehicle availability: DB connection failed')
    })

    it('throws when the lock result reports success=false', async () => {
      mockRpc.mockResolvedValue({
        data: { success: false, error: 'Vehicle already sold' },
        error: null,
      })

      await expect(
        startVehicleCheckout({ vehicleId: 'veh-002', vehicleName: 'Tesla' }),
      ).rejects.toThrow('Vehicle already sold')
    })

    it('throws a default message when lock fails with no error property', async () => {
      mockRpc.mockResolvedValue({
        data: { success: false },
        error: null,
      })

      await expect(
        startVehicleCheckout({ vehicleId: 'veh-003', vehicleName: 'Tesla' }),
      ).rejects.toThrow('Vehicle is not available for checkout')
    })

    it('throws when createAdminClient throws (missing SUPABASE_SERVICE_ROLE_KEY)', async () => {
      mockCreateAdminClient.mockImplementationOnce(() => {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
      })

      await expect(
        startVehicleCheckout({ vehicleId: 'veh-004', vehicleName: 'Tesla' }),
      ).rejects.toThrow('Service configuration error')
    })
  })

  describe('Stripe session creation', () => {
    it('returns the client_secret from the Stripe session', async () => {
      mockSessionCreate.mockResolvedValue({ client_secret: 'seti_secret_xyz' })

      const result = await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla Model 3',
      })

      expect(result).toBe('seti_secret_xyz')
    })

    it('creates a session with the vehicle price from the RPC result (not client data)', async () => {
      mockRpc.mockResolvedValue(makeLockResult({ price: 3500000 })) // $35,000 in cents

      await startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla Model 3' })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({ unit_amount: 3500000 }),
            }),
          ]),
        }),
        expect.anything(),
      )
    })

    it('uses $250 deposit amount (25000 cents) when depositOnly is true', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla Model 3',
        depositOnly: true,
      })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({ unit_amount: 25000 }),
            }),
          ]),
        }),
        expect.anything(),
      )
    })

    it('sets depositOnly metadata on the session when depositOnly is true', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla Model 3',
        depositOnly: true,
      })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ depositOnly: 'true' }),
        }),
        expect.anything(),
      )
    })

    it('sets depositOnly=false metadata for normal purchase', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla Model 3',
        depositOnly: false,
      })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ depositOnly: 'false' }),
        }),
        expect.anything(),
      )
    })

    it('uses the server vehicle name (year make model) not the client-supplied name', async () => {
      mockRpc.mockResolvedValue(makeLockResult({ year: 2023, make: 'Toyota', model: 'Camry' }))

      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Old Client Name',
      })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: '2023 Toyota Camry',
                }),
              }),
            }),
          ]),
        }),
        expect.anything(),
      )
    })

    it('adds deposit label prefix to product name when depositOnly is true', async () => {
      mockRpc.mockResolvedValue(makeLockResult({ year: 2023, make: 'Toyota', model: 'Camry' }))

      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Toyota Camry',
        depositOnly: true,
      })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: 'Deposit - 2023 Toyota Camry',
                }),
              }),
            }),
          ]),
        }),
        expect.anything(),
      )
    })

    it('uses CAD currency', async () => {
      await startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla' })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({ currency: 'cad' }),
            }),
          ]),
        }),
        expect.anything(),
      )
    })

    it('uses embedded ui_mode', async () => {
      await startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla' })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({ ui_mode: 'embedded' }),
        expect.anything(),
      )
    })

    it('sets customer_email when provided', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla',
        customerEmail: 'buyer@example.com',
      })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({ customer_email: 'buyer@example.com' }),
        expect.anything(),
      )
    })

    it('does not set customer_email when not provided', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla',
      })

      const [[sessionArgs]] = mockSessionCreate.mock.calls
      expect(sessionArgs).not.toHaveProperty('customer_email')
    })
  })

  describe('protection plan', () => {
    it('adds a protection plan line item when a valid plan ID is provided', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla',
        protectionPlanId: 'essential',
      })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: 'PlanetCare Essential',
                }),
                unit_amount: 195000,
              }),
            }),
          ]),
        }),
        expect.anything(),
      )
    })

    it('does not add a line item for an unknown protection plan ID', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla',
        protectionPlanId: 'nonexistent-plan',
      })

      const [[sessionArgs]] = mockSessionCreate.mock.calls
      expect(sessionArgs.line_items).toHaveLength(1)
    })

    it('does not add protection plan line item when no plan ID is given', async () => {
      await startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla' })

      const [[sessionArgs]] = mockSessionCreate.mock.calls
      expect(sessionArgs.line_items).toHaveLength(1)
    })
  })

  describe('idempotency key', () => {
    it('generates a deterministic idempotency key for the same inputs', async () => {
      const data = { vehicleId: 'veh-001', vehicleName: 'Tesla', customerEmail: 'a@b.com' }

      await startVehicleCheckout(data)
      const [[, opts1]] = mockSessionCreate.mock.calls

      vi.clearAllMocks()
      mockRpc.mockResolvedValue(makeLockResult())
      mockSessionCreate.mockResolvedValue({ client_secret: 'secret' })

      await startVehicleCheckout(data)
      const [[, opts2]] = mockSessionCreate.mock.calls

      expect(opts1.idempotencyKey).toBe(opts2.idempotencyKey)
    })

    it('generates different keys for different vehicleIds', async () => {
      await startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla' })
      const [[, opts1]] = mockSessionCreate.mock.calls

      vi.clearAllMocks()
      mockRpc.mockResolvedValue(makeLockResult())
      mockSessionCreate.mockResolvedValue({ client_secret: 'secret' })

      await startVehicleCheckout({ vehicleId: 'veh-002', vehicleName: 'Tesla' })
      const [[, opts2]] = mockSessionCreate.mock.calls

      expect(opts1.idempotencyKey).not.toBe(opts2.idempotencyKey)
    })

    it('generates different keys for deposit vs full purchase', async () => {
      await startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla', depositOnly: false })
      const [[, optsNormal]] = mockSessionCreate.mock.calls

      vi.clearAllMocks()
      mockRpc.mockResolvedValue(makeLockResult())
      mockSessionCreate.mockResolvedValue({ client_secret: 'secret' })

      await startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla', depositOnly: true })
      const [[, optsDeposit]] = mockSessionCreate.mock.calls

      expect(optsNormal.idempotencyKey).not.toBe(optsDeposit.idempotencyKey)
    })
  })

  describe('UTM metadata', () => {
    it('includes utm_source in session metadata when provided', async () => {
      await startVehicleCheckout({
        vehicleId: 'veh-001',
        vehicleName: 'Tesla',
        utmSource: 'google',
        utmMedium: 'cpc',
      })

      expect(mockSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            utm_source: 'google',
            utm_medium: 'cpc',
          }),
        }),
        expect.anything(),
      )
    })

    it('does not include utm keys in metadata when UTMs are not provided', async () => {
      await startVehicleCheckout({ vehicleId: 'veh-001', vehicleName: 'Tesla' })

      const [[sessionArgs]] = mockSessionCreate.mock.calls
      expect(sessionArgs.metadata).not.toHaveProperty('utm_source')
      expect(sessionArgs.metadata).not.toHaveProperty('utm_medium')
    })
  })
})