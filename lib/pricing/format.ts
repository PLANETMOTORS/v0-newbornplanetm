/**
 * OMVIC-compliant pricing helpers for Planet Motors.
 *
 * All fee constants live here so the rest of the codebase never hard-codes
 * dollar amounts that are subject to regulatory change.
 */

// ---------------------------------------------------------------------------
// Fee constants (in dollars)
// ---------------------------------------------------------------------------

/** OMVIC administrative fee — set by the regulator. */
export const OMVIC_FEE = 22

/** Ontario Safety Standards Certificate (SSC) inspection fee. */
export const CERTIFICATION_FEE = 595

/** Estimated licensing & registration fee (Ontario). */
export const LICENSING_FEE = 59

/** Ontario HST rate. */
export const HST_RATE = 0.13

// ---------------------------------------------------------------------------
// Disclaimer constants
// ---------------------------------------------------------------------------

/** Standard OMVIC all-in pricing disclaimer. */
export const OMVIC_DISCLAIMER =
  'Price shown is the all-in advertised price as required by OMVIC. ' +
  'Includes OMVIC fee, certification, and estimated licensing & registration. ' +
  'HST is additional. Exact amounts confirmed at signing.'

/** Finance estimate disclaimer — required on any payment estimate. */
export const FINANCE_ESTIMATE_DISCLAIMER =
  'Estimated payment for illustration purposes only. Actual terms and rates ' +
  'subject to credit approval. Does not include fees, taxes may vary by location.'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllInPriceBreakdown {
  /** Base vehicle price (dollars). */
  vehiclePrice: number
  /** OMVIC regulatory fee. */
  omvicFee: number
  /** Ontario SSC certification fee. */
  certificationFee: number
  /** Estimated licensing & registration. */
  licensingFee: number
  /** Subtotal before HST (vehicle + all fees). */
  subtotal: number
  /** HST amount (13 % of subtotal). */
  hst: number
  /** Grand total including HST. */
  total: number
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Format a price stored in **cents** for display as Canadian dollars.
 *
 * Example: `formatPriceForDisplay(5299000)` → `"$52,990"`
 */
export function formatPriceForDisplay(priceInCents: number): string {
  const dollars = priceInCents / 100
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars)
}

/**
 * Compute the OMVIC-compliant all-in price breakdown.
 *
 * @param vehiclePrice — vehicle price in **dollars** (not cents).
 */
export function calculateAllInPrice(vehiclePrice: number): AllInPriceBreakdown {
  const omvicFee = OMVIC_FEE
  const certificationFee = CERTIFICATION_FEE
  const licensingFee = LICENSING_FEE

  const subtotal = vehiclePrice + omvicFee + certificationFee + licensingFee
  const hst = Math.round(subtotal * HST_RATE)
  const total = subtotal + hst

  return {
    vehiclePrice,
    omvicFee,
    certificationFee,
    licensingFee,
    subtotal,
    hst,
    total,
  }
}
