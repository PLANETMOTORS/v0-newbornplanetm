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
