const EVENT_ID_MAX_PREFIX_LENGTH = 48

function trimUnderscores(str: string): string {
  let start = 0
  let end = str.length
  while (start < end && str[start] === '_') start++
  while (end > start && str[end - 1] === '_') end--
  return str.slice(start, end)
}

function sanitizePrefix(raw: string): string {
  const chars: string[] = []
  for (const ch of raw.toLowerCase()) {
    if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch === '_') {
      chars.push(ch)
    } else if (chars.length === 0 || chars[chars.length - 1] !== '_') {
      chars.push('_')
    }
  }
  return trimUnderscores(chars.join('').slice(0, EVENT_ID_MAX_PREFIX_LENGTH)) || 'event'
}

export function generateEventId(prefix = 'event'): string {
  const safePrefix = sanitizePrefix(prefix)

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
