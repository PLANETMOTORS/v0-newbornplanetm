import type { HashedUserData } from './hash-user-data'

export type ServerConversionEventName =
  | 'lead_submit'
  | 'click_to_call'
  | 'book_test_drive'
  | 'trade_in_submit'
  | 'service_appointment'
  | 'finance_application_submit'
  | 'finance_idv_complete'

export type ServerConversionOutboxRecord = {
  event_name: ServerConversionEventName
  event_id: string
  lead_id?: string | null
  application_id?: string | null
  vehicle_vin?: string | null
  value?: number | null
  currency?: 'CAD'
  page_type?: string | null
  user_data_hashes?: HashedUserData
  attribution?: Record<string, unknown>
  consent_snapshot?: Record<string, unknown>
  status?: 'pending'
}

type SupabaseLikeClient = {
  from: (table: string) => {
    insert: (record: Record<string, unknown>) => Promise<{ error?: { message?: string } | null }>
  }
}

export function buildServerConversionRecord(input: ServerConversionOutboxRecord) {
  return {
    event_name: input.event_name,
    event_id: input.event_id,
    lead_id: input.lead_id ?? null,
    application_id: input.application_id ?? null,
    vehicle_vin: input.vehicle_vin ?? null,
    value: input.value ?? null,
    currency: input.currency ?? 'CAD',
    page_type: input.page_type ?? null,
    user_data_hashes: input.user_data_hashes ?? {},
    attribution: input.attribution ?? {},
    consent_snapshot: input.consent_snapshot ?? {},
    status: 'pending',
  }
}

/**
 * Enqueues a first-party server event after backend success.
 * A scheduled worker drains this table into sGTM, Meta CAPI, TikTok Events API, etc.
 */
export async function enqueueServerConversion(
  supabaseAdmin: SupabaseLikeClient,
  input: ServerConversionOutboxRecord,
) {
  const record = buildServerConversionRecord(input)
  const { error } = await supabaseAdmin.from('server_conversion_outbox').insert(record)

  if (error) {
    throw new Error(`Failed to enqueue server conversion: ${error.message ?? 'unknown error'}`)
  }

  return record
}
