import type { TrackingPayload } from './types'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
  }
}

const BLOCKED_DATALAYER_KEYS = [
  'email',
  'phone',
  'first_name',
  'last_name',
  'full_name',
  'name',
  'address',
  'street',
  'postal_code',
  'zip',
  'sin',
  'ssn',
  'date_of_birth',
  'dob',
  'drivers_license',
  'license_number',
]

function removeUndefined(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(removeUndefined)
  }

  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [
        key,
        value === undefined ? null : removeUndefined(value),
      ]),
    )
  }

  return input
}

function findBlockedKeys(input: unknown, path = ''): string[] {
  if (!input || typeof input !== 'object') return []

  if (Array.isArray(input)) {
    return input.flatMap((item, index) => findBlockedKeys(item, `${path}[${index}]`))
  }

  const found: string[] = []

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase()
    const nextPath = path ? `${path}.${key}` : key

    if (BLOCKED_DATALAYER_KEYS.includes(normalizedKey)) {
      found.push(nextPath)
    }

    found.push(...findBlockedKeys(value, nextPath))
  }

  return found
}

function warnIfBlockedKeys(payload: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') return

  const blockedKeys = findBlockedKeys(payload)
  if (!blockedKeys.length) return

  console.warn(
    '[Planet Motors tracking] Possible raw PII keys in DataLayer payload:',
    blockedKeys,
  )
}

export function pushEvent<T extends TrackingPayload>(payload: T): void {
  if (globalThis.window === undefined) return

  globalThis.window.dataLayer = globalThis.window.dataLayer || []

  const sanitizedPayload = removeUndefined({
    event_time_iso: new Date().toISOString(),
    ...payload,
  }) as Record<string, unknown>

  warnIfBlockedKeys(sanitizedPayload)
  globalThis.window.dataLayer.push(sanitizedPayload)
}

export function clearEcommerceObject(): void {
  pushEvent({ event: 'clear_ecommerce', ecommerce: null })
}
