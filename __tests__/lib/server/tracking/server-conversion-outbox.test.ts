import { describe, it, expect, vi } from 'vitest'
import {
  enqueueServerConversion,
  buildServerConversionRecord,
} from '@/lib/server/tracking/server-conversion-outbox'
import type { ServerConversionEventName } from '@/lib/server/tracking/server-conversion-outbox'

function makeSupabaseMock(error: { message: string } | null = null) {
  const insertMock = vi.fn().mockResolvedValue({ error })
  const fromMock = vi.fn().mockReturnValue({ insert: insertMock })
  return { client: { from: fromMock } as unknown as Parameters<typeof enqueueServerConversion>[0], fromMock, insertMock }
}

describe('buildServerConversionRecord', () => {
  it('builds a record with defaults', () => {
    const record = buildServerConversionRecord({
      event_name: 'lead_submit',
      event_id: 'test_123',
    })
    expect(record.event_name).toBe('lead_submit')
    expect(record.event_id).toBe('test_123')
    expect(record.status).toBe('pending')
    expect(record.lead_id).toBeNull()
    expect(record.vehicle_vin).toBeNull()
    expect(record.currency).toBe('CAD')
  })

  it('includes optional fields when provided', () => {
    const record = buildServerConversionRecord({
      event_name: 'book_test_drive',
      event_id: 'test_456',
      lead_id: 'lead-abc',
      vehicle_vin: '1HGCM82633A004352',
      value: 43500,
      attribution: { utm_source: 'google' },
      consent_snapshot: { analytics_storage: 'granted' },
    })
    expect(record.lead_id).toBe('lead-abc')
    expect(record.vehicle_vin).toBe('1HGCM82633A004352')
    expect(record.value).toBe(43500)
    expect(record.attribution).toEqual({ utm_source: 'google' })
  })
})

describe('enqueueServerConversion', () => {
  it('inserts a record into server_conversion_outbox', async () => {
    const { client, fromMock, insertMock } = makeSupabaseMock()

    const result = await enqueueServerConversion(client, {
      event_name: 'lead_submit',
      event_id: 'test_123',
      lead_id: 'lead-abc',
      user_data_hashes: {
        email_sha256: 'abc123',
        phone_sha256: null,
        first_name_sha256: null,
        last_name_sha256: null,
        postal_code_sha256: null,
      },
      attribution: { utm_source: 'google', utm_medium: 'cpc' },
      consent_snapshot: { analytics_storage: 'granted', ad_storage: 'granted' },
    })

    expect(fromMock).toHaveBeenCalledWith('server_conversion_outbox')
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'lead_submit',
        event_id: 'test_123',
        lead_id: 'lead-abc',
        status: 'pending',
      }),
    )
    expect(result.event_name).toBe('lead_submit')
    expect(result.status).toBe('pending')
  })

  it('includes vehicle_vin when provided', async () => {
    const { client, insertMock } = makeSupabaseMock()

    await enqueueServerConversion(client, {
      event_name: 'book_test_drive',
      event_id: 'test_456',
      vehicle_vin: '1HGCM82633A004352',
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicle_vin: '1HGCM82633A004352',
      }),
    )
  })

  it('throws on Supabase error', async () => {
    const { client } = makeSupabaseMock({ message: 'Insert failed' })

    await expect(
      enqueueServerConversion(client, {
        event_name: 'click_to_call',
        event_id: 'test_789',
      }),
    ).rejects.toThrow('Failed to enqueue server conversion: Insert failed')
  })

  it('handles all server conversion event types', async () => {
    const eventTypes: ServerConversionEventName[] = [
      'lead_submit',
      'click_to_call',
      'book_test_drive',
      'trade_in_submit',
      'service_appointment',
      'finance_application_submit',
      'finance_idv_complete',
    ]

    for (const eventName of eventTypes) {
      const { client, insertMock } = makeSupabaseMock()

      await enqueueServerConversion(client, {
        event_name: eventName,
        event_id: `test_${eventName}`,
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ event_name: eventName }),
      )
    }
  })
})
