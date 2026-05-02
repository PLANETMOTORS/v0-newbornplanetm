import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateEventId } from '@/lib/tracking/event-ids'

describe('generateEventId', () => {
  it('returns a string with the default prefix', () => {
    const id = generateEventId()
    expect(id).toMatch(/^event_/)
  })

  it('uses a custom prefix', () => {
    const id = generateEventId('page_view')
    expect(id).toMatch(/^page_view_/)
  })

  it('sanitizes special characters in prefix', () => {
    const id = generateEventId('My Event!@#$')
    expect(id).toMatch(/^my_event_/)
  })

  it('truncates long prefixes', () => {
    const longPrefix = 'a'.repeat(100)
    const id = generateEventId(longPrefix)
    const prefix = id.split('_').slice(0, -1).join('_')
    expect(prefix.length).toBeLessThanOrEqual(48)
  })

  it('falls back to "event" for empty prefix', () => {
    const id = generateEventId('!!!@@@')
    expect(id).toMatch(/^event_/)
  })

  it('uses crypto.randomUUID when available', () => {
    const id = generateEventId('test')
    expect(id).toMatch(/^test_[0-9a-f-]+$/)
  })

  it('uses getRandomValues fallback when randomUUID is missing', () => {
    const origRandomUUID = crypto.randomUUID
    // @ts-expect-error -- testing fallback
    crypto.randomUUID = undefined

    const id = generateEventId('fallback')
    expect(id).toMatch(/^fallback_\d+_[0-9a-f]+$/)

    crypto.randomUUID = origRandomUUID
  })

  it('handles trimming leading/trailing underscores from prefix', () => {
    const id = generateEventId('___test___')
    expect(id).toMatch(/^test_/)
  })
})
