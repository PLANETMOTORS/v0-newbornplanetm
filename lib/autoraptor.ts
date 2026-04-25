/**
 * AutoRaptor CRM Integration via ADF (Auto-lead Data Format) XML.
 *
 * Fire-and-forget lead creation after successful Stripe payments.
 * Failures are logged but never block the webhook response -- Stripe
 * is the source of truth for payment status.
 *
 * ADF spec: https://star-standards.org (ISO/IEC 15948)
 * Requires AUTORAPTOR_ADF_ENDPOINT env var.
 * AUTORAPTOR_DEALER_ID is sent as an optional X-Dealer-ID header.
 */

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

function escapeXml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildAdfXml(payload: AutoRaptorLeadPayload, dealerName: string): string {
  const [firstName, ...lastParts] = payload.customerName.split(' ')
  const lastName = lastParts.join(' ') || ''
  const now = new Date().toISOString()
  const depositFormatted = `$${(payload.depositAmount / 100).toFixed(2)} CAD`

  const vehicleIdBlock = payload.vehicleId
    ? `<id source="planetmotors.ca">${escapeXml(payload.vehicleId)}</id>`
    : ''
  const vehicleBlock = payload.vehicleYear
    ? `
      <vehicle interest="buy" status="used">
        <year>${escapeXml(String(payload.vehicleYear))}</year>
        <make>${escapeXml(payload.vehicleMake ?? '')}</make>
        <model>${escapeXml(payload.vehicleModel ?? '')}</model>
        ${vehicleIdBlock}
      </vehicle>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<?adf version="1.0"?>
<adf>
  <prospect status="new">
    <id sequence="1" source="planetmotors.ca">${escapeXml(payload.stripeSessionId)}</id>
    <requestdate>${escapeXml(now)}</requestdate>${vehicleBlock}
    <customer>
      <contact>
        <name part="first">${escapeXml(firstName)}</name>
        <name part="last">${escapeXml(lastName)}</name>
        <email>${escapeXml(payload.customerEmail)}</email>
        ${payload.customerPhone ? `<phone type="voice">${escapeXml(payload.customerPhone)}</phone>` : ''}
      </contact>
      <comments>Stripe deposit of ${escapeXml(depositFormatted)} confirmed. Session: ${escapeXml(payload.stripeSessionId)}</comments>
    </customer>
    <vendor>
      <contact>
        <name part="full">${escapeXml(dealerName)}</name>
      </contact>
    </vendor>
    <provider>
      <name part="full">${escapeXml(payload.source)}</name>
    </provider>
  </prospect>
</adf>`
}

export async function createAutoRaptorLead(payload: AutoRaptorLeadPayload): Promise<AutoRaptorResult> {
  const adfEndpoint = process.env.AUTORAPTOR_ADF_ENDPOINT
  const dealerId = process.env.AUTORAPTOR_DEALER_ID

  if (!adfEndpoint) {
    return { success: false, error: 'AutoRaptor not configured -- missing ADF endpoint' }
  }

  const dealerName = process.env.AUTORAPTOR_DEALER_NAME || 'Planet Motors'
  const adfXml = buildAdfXml(payload, dealerName)

  try {
    const response = await fetch(adfEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        ...(dealerId ? { 'X-Dealer-ID': dealerId } : {}),
      },
      body: adfXml,
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'No response body')
      return { success: false, error: `AutoRaptor ADF ${response.status}: ${text.slice(0, 200)}` }
    }

    const text = await response.text().catch(() => '')
    return { success: true, leadId: text.slice(0, 100) || undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
