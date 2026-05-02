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

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${safePrefix}_${Date.now()}_${hex}`
  }

  const timestamp = Date.now()
  return `${safePrefix}_${timestamp}_${String(performance?.now?.() ?? 0).replace('.', '')}`
}
