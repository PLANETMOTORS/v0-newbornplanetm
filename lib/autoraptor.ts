/**
 * AutoRaptor CRM Integration
 *
 * Fire-and-forget lead creation after successful Stripe payments.
 * Failures are logged but never block the webhook response — Stripe
 * is the source of truth for payment status.
 *
 * AutoRaptor API docs: https://www.autoraptor.com/api
 * Requires AUTORAPTOR_API_KEY and AUTORAPTOR_DEALER_ID env vars.
 */

const AUTORAPTOR_BASE_URL = 'https://app.autoraptor.com/api/v2'

interface AutoRaptorLeadPayload {
  customerName: string
  customerEmail: string
  customerPhone?: string
  vehicleYear?: number
  vehicleMake?: string
  vehicleModel?: string
  vehicleId?: string
  depositAmount: number
  stripeSessionId: string
  source: string
}

interface AutoRaptorResult {
  success: boolean
  leadId?: string
  error?: string
}

export async function createAutoRaptorLead(payload: AutoRaptorLeadPayload): Promise<AutoRaptorResult> {
  const apiKey = process.env.AUTORAPTOR_API_KEY
  const dealerId = process.env.AUTORAPTOR_DEALER_ID

  if (!apiKey || !dealerId) {
    return { success: false, error: 'AutoRaptor not configured — missing API key or dealer ID' }
  }

  const [firstName, ...lastParts] = payload.customerName.split(' ')
  const lastName = lastParts.join(' ') || ''

  const body = {
    dealer_id: dealerId,
    lead: {
      first_name: firstName,
      last_name: lastName,
      email: payload.customerEmail,
      phone: payload.customerPhone ?? '',
      source: payload.source,
      status: 'new',
      notes: [
        `Stripe deposit of $${(payload.depositAmount / 100).toFixed(2)} CAD confirmed.`,
        `Stripe Session: ${payload.stripeSessionId}`,
        payload.vehicleId ? `Vehicle ID: ${payload.vehicleId}` : '',
      ].filter(Boolean).join('\n'),
      vehicles_of_interest: payload.vehicleYear ? [{
        year: payload.vehicleYear,
        make: payload.vehicleMake ?? '',
        model: payload.vehicleModel ?? '',
      }] : [],
    },
  }

  try {
    const response = await fetch(`${AUTORAPTOR_BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'No response body')
      return { success: false, error: `AutoRaptor API ${response.status}: ${text}` }
    }

    const data = await response.json() as { id?: string }
    return { success: true, leadId: data.id ?? undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
