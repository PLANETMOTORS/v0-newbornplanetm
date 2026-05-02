const EVENT_ID_MAX_PREFIX_LENGTH = 48

export function generateEventId(prefix = 'event'): string {
  const safePrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .slice(0, EVENT_ID_MAX_PREFIX_LENGTH)
    .replace(/^_+|_+$/g, '') || 'event'

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${safePrefix}_${crypto.randomUUID()}`
  }

  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  return `${safePrefix}_${timestamp}_${random}`
}
