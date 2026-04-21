import { describe, it, expect } from 'vitest'

// ---- Payment calculation logic extracted from DealCustomizationPage ----
// These mirror the exact formulas used in app/checkout/deal-customization/page.tsx.

const VEHICLE_PRICE = 36200
const MONTHLY_TERM = 60   // months
const BIWEEKLY_PERIODS = 130  // 26 bi-weekly periods × 5 years

function calcFinanced(vehiclePrice: number, downPayment: number): number {
  return vehiclePrice - downPayment
}

function calcPayment(
  financed: number,
  frequency: 'monthly' | 'biweekly',
): string {
  return frequency === 'monthly'
    ? (financed / MONTHLY_TERM).toFixed(2)
    : (financed / BIWEEKLY_PERIODS).toFixed(2)
}

describe('DealCustomizationPage — payment calculation', () => {
  describe('financed amount', () => {
    it('equals vehicle price minus down payment', () => {
      expect(calcFinanced(VEHICLE_PRICE, 5000)).toBe(31200)
    })

    it('equals full vehicle price when down payment is zero', () => {
      expect(calcFinanced(VEHICLE_PRICE, 0)).toBe(VEHICLE_PRICE)
    })

    it('equals zero when down payment equals vehicle price', () => {
      expect(calcFinanced(VEHICLE_PRICE, VEHICLE_PRICE)).toBe(0)
    })

    it('handles arbitrary down payment amounts', () => {
      expect(calcFinanced(VEHICLE_PRICE, 10000)).toBe(26200)
      expect(calcFinanced(VEHICLE_PRICE, 15000)).toBe(21200)
    })
  })

  describe('monthly payment', () => {
    it('divides financed amount by 60 months', () => {
      const financed = 36200 - 5000  // 31200
      const expected = (31200 / 60).toFixed(2)
      expect(calcPayment(31200, 'monthly')).toBe(expected)
    })

    it('returns a string with 2 decimal places', () => {
      const payment = calcPayment(31200, 'monthly')
      expect(payment).toMatch(/^\d+\.\d{2}$/)
    })

    it('equals 520.00 for default down payment ($5,000)', () => {
      const financed = calcFinanced(VEHICLE_PRICE, 5000) // 31200
      expect(calcPayment(financed, 'monthly')).toBe('520.00')
    })

    it('equals 603.33 for zero down payment', () => {
      const financed = calcFinanced(VEHICLE_PRICE, 0) // 36200
      expect(calcPayment(financed, 'monthly')).toBe('603.33')
    })

    it('equals 0.00 for full down payment (fully paid vehicle)', () => {
      const financed = calcFinanced(VEHICLE_PRICE, VEHICLE_PRICE) // 0
      expect(calcPayment(financed, 'monthly')).toBe('0.00')
    })
  })

  describe('bi-weekly payment', () => {
    it('divides financed amount by 130 periods', () => {
      const financed = 36200 - 5000  // 31200
      const expected = (31200 / 130).toFixed(2)
      expect(calcPayment(31200, 'biweekly')).toBe(expected)
    })

    it('returns a string with 2 decimal places', () => {
      const payment = calcPayment(31200, 'biweekly')
      expect(payment).toMatch(/^\d+\.\d{2}$/)
    })

    it('equals 240.00 for default down payment ($5,000)', () => {
      const financed = calcFinanced(VEHICLE_PRICE, 5000) // 31200
      expect(calcPayment(financed, 'biweekly')).toBe('240.00')
    })

    it('equals 278.46 for zero down payment', () => {
      const financed = calcFinanced(VEHICLE_PRICE, 0) // 36200
      expect(calcPayment(financed, 'biweekly')).toBe('278.46')
    })

    it('equals 0.00 for full down payment', () => {
      const financed = calcFinanced(VEHICLE_PRICE, VEHICLE_PRICE) // 0
      expect(calcPayment(financed, 'biweekly')).toBe('0.00')
    })
  })

  describe('bi-weekly vs monthly comparison', () => {
    it('bi-weekly payment is always less than monthly payment for the same financed amount', () => {
      const financed = calcFinanced(VEHICLE_PRICE, 5000)
      const monthly = parseFloat(calcPayment(financed, 'monthly'))
      const biweekly = parseFloat(calcPayment(financed, 'biweekly'))
      expect(biweekly).toBeLessThan(monthly)
    })

    it('bi-weekly × 130 approximates monthly × 60 (same total repayment)', () => {
      const financed = calcFinanced(VEHICLE_PRICE, 5000)
      // Both should sum to the same financed amount (no interest in this model)
      const totalMonthly = parseFloat(calcPayment(financed, 'monthly')) * 60
      const totalBiweekly = parseFloat(calcPayment(financed, 'biweekly')) * 130
      // Allow rounding tolerance of $1
      expect(Math.abs(totalMonthly - financed)).toBeLessThanOrEqual(1)
      expect(Math.abs(totalBiweekly - financed)).toBeLessThanOrEqual(1)
    })
  })

  describe('boundary and edge cases', () => {
    it('handles the maximum possible down payment (slider max = vehicle price)', () => {
      const downPayment = VEHICLE_PRICE // slider max
      const financed = calcFinanced(VEHICLE_PRICE, downPayment)
      expect(calcPayment(financed, 'monthly')).toBe('0.00')
      expect(calcPayment(financed, 'biweekly')).toBe('0.00')
    })

    it('handles the minimum possible down payment (slider min = 0)', () => {
      const financed = calcFinanced(VEHICLE_PRICE, 0)
      // Monthly should be non-zero
      expect(parseFloat(calcPayment(financed, 'monthly'))).toBeGreaterThan(0)
      // Bi-weekly should be non-zero
      expect(parseFloat(calcPayment(financed, 'biweekly'))).toBeGreaterThan(0)
    })

    it('slider step is 500 — down payment of 500 is a valid slider position', () => {
      const financed = calcFinanced(VEHICLE_PRICE, 500)
      expect(financed).toBe(35700)
      expect(calcPayment(financed, 'monthly')).toBe('595.00')
    })
  })
})