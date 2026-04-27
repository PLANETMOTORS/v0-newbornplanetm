/**
 * lib/vehicles/status-filter.ts
 *
 * Shared logic for public inventory status filtering.
 * Used by both GET and POST /api/v1/vehicles handlers.
 *
 * "public" status = available + reserved + recently-sold (within 7 days).
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** Public statuses visible on the storefront */
export const PUBLIC_STATUSES = ['available', 'reserved', 'sold'] as const

/**
 * Build a PostgREST `.or()` filter string for the "public" status.
 * Includes available, reserved, and sold vehicles where sold_at is within 7 days.
 */
export function buildPublicStatusFilter(): string {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString()
  return `status.eq.available,status.eq.reserved,and(status.eq.sold,sold_at.gte.${sevenDaysAgo})`
}

/**
 * Apply the appropriate status filter to a Supabase query builder.
 * When status is 'public', uses the 7-day sold window filter.
 * Otherwise, filters by the exact status value.
 */
export function applyStatusFilter<T extends { or: (filter: string) => T; eq: (col: string, val: string) => T }>(
  query: T,
  status: string,
): T {
  if (status === 'public') {
    return query.or(buildPublicStatusFilter())
  }
  return query.eq('status', status)
}
