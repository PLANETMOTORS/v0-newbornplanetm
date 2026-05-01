/**
 * Persistence layer for finance capture-leads.
 *
 * Wraps the Supabase admin client so the route handler can compose this
 * with `Result<T, E>` instead of throwing. Failures land in the error
 * channel with a stable `kind` discriminator so the handler can map
 * them to the canonical `LEAD_PERSIST_FAILED` 500 response.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import type { Result } from "@/lib/result"
import { ok, err } from "@/lib/result"
import type { CaptureLeadRequest } from "./schemas"

export type CaptureLeadPersistError =
  | { readonly kind: "db-error"; readonly message: string; readonly code?: string }
  | { readonly kind: "exception"; readonly message: string }

export interface PersistedLead {
  readonly id: string
}

type AdminClient = ReturnType<typeof createAdminClient>
type ClientFactory = () => AdminClient

interface LeadInsertRow {
  source: "finance_app"
  status: "new"
  priority: "high"
  customer_name: string
  customer_email: string
  customer_phone: string
  subject: string
  message: string
}

/** Build the snake_case row sent to Postgres. Pure function. */
export function buildLeadRow(input: CaptureLeadRequest): LeadInsertRow {
  const fullName = `${input.firstName} ${input.lastName}`
  const subject = `Finance Pre-Approval: $${input.requestedAmount.toLocaleString()} over ${input.requestedTerm} months`
  const message = [
    `Annual income: $${input.annualIncome.toLocaleString()}`,
    `Requested amount: $${input.requestedAmount.toLocaleString()}`,
    `Term: ${input.requestedTerm} months`,
  ].join("\n")

  return {
    source: "finance_app",
    status: "new",
    priority: "high",
    customer_name: fullName,
    customer_email: input.email,
    customer_phone: input.phone,
    subject,
    message,
  }
}

/**
 * Insert a finance lead. Returns the newly-minted row id on success,
 * or a structured error in the failure channel.
 */
export async function persistCaptureLead(
  input: CaptureLeadRequest,
  clientFactory: ClientFactory = createAdminClient,
): Promise<Result<PersistedLead, CaptureLeadPersistError>> {
  let client: AdminClient
  try {
    client = clientFactory()
  } catch (caught) {
    return err({
      kind: "exception",
      message: caught instanceof Error ? caught.message : "client init failed",
    })
  }

  try {
    const row = buildLeadRow(input)
    const { data, error: dbError } = await client
      .from("leads")
      .insert(row)
      .select("id")
      .single()
    if (dbError) {
      return err({
        kind: "db-error",
        message: dbError.message,
        code: (dbError as { code?: string }).code,
      })
    }
    if (!data?.id) {
      return err({
        kind: "db-error",
        message: "insert returned no row id",
      })
    }
    return ok({ id: data.id })
  } catch (caught) {
    return err({
      kind: "exception",
      message: caught instanceof Error ? caught.message : "insert threw",
    })
  }
}
