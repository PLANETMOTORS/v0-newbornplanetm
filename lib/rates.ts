// ---------------------------------------------------------------------------
// Rate Constants — Single Source of Truth
// ---------------------------------------------------------------------------
// All marketing rates, financing disclaimers, and AI negotiation fallbacks
// MUST reference these constants. Never hardcode rate values elsewhere.
// ---------------------------------------------------------------------------

/**
 * The floor (lowest advertised) APR rate.
 *
 * This is the rate displayed in marketing materials, hero banners,
 * financing CTAs, and used as the fallback in AI negotiation prompts.
 *
 * Compliance: Must match the actual lowest rate available from any
 * lender partner. Updated when lender agreements change.
 *
 * Last verified: 2026-04-22
 */
export const RATE_FLOOR = 6.29

/**
 * Display string for the floor rate (e.g. "6.29%").
 */
export const RATE_FLOOR_DISPLAY = `${RATE_FLOOR}%`

/**
 * Default financing term in months used for payment estimates.
 */
export const DEFAULT_TERM_MONTHS = 72

/**
 * Default down-payment percentage used in quick estimates.
 */
export const DEFAULT_DOWN_PAYMENT_PCT = 0

/**
 * Finance admin fee (Finance Docs Set-up) added to the vehicle price.
 */
export const FINANCE_ADMIN_FEE = 895

/**
 * Compute the amortized bi-weekly payment for a vehicle.
 *
 * Formula: standard PMT  P·[r(1+r)^n] / [(1+r)^n − 1]  then ×12/26.
 *
 * @param vehiclePrice  sticker price in dollars (before tax/fees)
 * @param apr           annual percentage rate (e.g. 6.29)
 * @param termMonths    loan term in months (e.g. 72)
 * @param taxRate       combined tax rate as a decimal (e.g. 0.13 for ON HST)
 * @returns rounded bi-weekly payment in whole dollars
 */
export function calculateBiweeklyPayment(
  vehiclePrice: number,
  apr: number = RATE_FLOOR,
  termMonths: number = DEFAULT_TERM_MONTHS,
  taxRate: number = 0.13,
): number {
  const subtotal = vehiclePrice + FINANCE_ADMIN_FEE
  const total = subtotal + subtotal * taxRate
  const monthlyRate = apr / 100 / 12

  let monthlyPayment: number
  if (monthlyRate === 0) {
    monthlyPayment = total / termMonths
  } else {
    monthlyPayment =
      total *
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
  }

  return Math.round((monthlyPayment * 12) / 26)
}
