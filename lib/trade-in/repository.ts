/**
 * Trade-in quote persistence layer.
 *
 * Wraps the Supabase admin client so the route handler does not depend on
 * the Postgres surface directly. Returns a `Result` instead of throwing —
 * the route maps the failure to a structured response.
 *
 * Service-role client is used because the customer is unauthenticated.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import type { Result } from "@/lib/result"
import { ok, err } from "@/lib/result"
import type { VehicleCondition } from "./estimator"

export interface TradeInQuoteRow {
  readonly quoteId: string
  readonly vehicleYear: number
  readonly vehicleMake: string
  readonly vehicleModel: string
  readonly mileage: number
  readonly condition: VehicleCondition
  readonly vin: string | null
  readonly customerName: string | null
  readonly customerEmail: string | null
  readonly customerPhone: string | null
  readonly offerAmount: number
  readonly offerLow: number
  readonly offerHigh: number
  readonly status: "pending"
  readonly validUntil: string
  readonly source: "instant_quote"
}

export type PersistError =
  | { readonly kind: "db-error"; readonly message: string }
  | { readonly kind: "exception"; readonly message: string }

type AdminClient = ReturnType<typeof createAdminClient>

function rowToInsertPayload(row: TradeInQuoteRow): Record<string, unknown> {
  return {
    quote_id: row.quoteId,
    vehicle_year: row.vehicleYear,
    vehicle_make: row.vehicleMake,
    vehicle_model: row.vehicleModel,
    mileage: row.mileage,
    condition: row.condition,
    vin: row.vin,
    customer_name: row.customerName,
    customer_email: row.customerEmail,
    customer_phone: row.customerPhone,
    offer_amount: row.offerAmount,
    offer_low: row.offerLow,
    offer_high: row.offerHigh,
    status: row.status,
    valid_until: row.validUntil,
    source: row.source,
  }
}

/**
 * Insert a trade-in quote row using the service-role client.
 *
 * The optional `clientFactory` parameter exists for tests that want to
 * inject a fake client without monkey-patching the module graph.
 */
export async function persistTradeInQuote(
  row: TradeInQuoteRow,
  clientFactory: () => AdminClient = createAdminClient,
): Promise<Result<void, PersistError>> {
  let supabase: AdminClient
  try {
    supabase = clientFactory()
  } catch (error_) {
    return err({
      kind: "exception",
      message: error_ instanceof Error ? error_.message : "client init failed",
    })
  }

  try {
    const { error: insertError } = await supabase
      .from("trade_in_quotes")
      .insert(rowToInsertPayload(row))
    if (insertError) {
      return err({ kind: "db-error", message: insertError.message })
    }
    return ok(undefined)
  } catch (error_) {
    return err({
      kind: "exception",
      message: error_ instanceof Error ? error_.message : "insert threw",
    })
  }
}
