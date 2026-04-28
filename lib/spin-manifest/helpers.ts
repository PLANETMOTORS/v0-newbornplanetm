/**
 * Helpers for building / sanitising the 360° spin manifest payload returned
 * by `app/api/v1/vehicles/[id]/spin-manifest/route.ts`.
 *
 * Extracted into a standalone module so each branch can be exercised in a
 * pure unit test without spinning up a Next.js handler.
 */

export const DEFAULT_SPIN_FRAME_COUNT = 72
export const MIN_SPIN_FRAME_COUNT = 24

/**
 * Coerce an unknown user-supplied `spin_frame_count` into a number we can
 * reason about. Strings like `"72"` are parsed; anything else returns NaN
 * so the caller can fall back to a default.
 */
export function coerceFrameCountInput(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number.parseInt(value, 10)
  return Number.NaN
}

/**
 * Resolve the final frame count for a vehicle's spin manifest:
 *  - Non-finite / non-coercible inputs fall back to the default frame count.
 *  - Valid inputs are clamped to a minimum of `MIN_SPIN_FRAME_COUNT` so the
 *    spinner never renders a degenerate animation.
 */
export function resolveFrameCount(value: unknown): number {
  const numeric = coerceFrameCountInput(value)
  if (!Number.isFinite(numeric)) return DEFAULT_SPIN_FRAME_COUNT
  return Math.max(MIN_SPIN_FRAME_COUNT, numeric)
}

/**
 * Validate / normalise a vehicle's stock_number used as the manifest key.
 * Anything that isn't a non-empty string is rejected.
 */
export function sanitizeStockNumber(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
