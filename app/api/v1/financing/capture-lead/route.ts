import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotificationEmail } from '@/lib/email'
import { rateLimit } from '@/lib/redis'
import { validateOrigin } from '@/lib/csrf'

/**
 * POST /api/v1/financing/capture-lead
 *
 * Captures a financing lead to the DB and fires an ADF XML to AutoRaptor.
 * This runs BEFORE authentication — the user has not yet clicked the magic link.
 * No auth check here; the lead is captured immediately on form submit.
 */
export async function POST(request: NextRequest) {
  // CSRF protection
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    )
  }

  // Rate limit: 5 lead captures per hour per IP
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || 'unknown'
  const limiter = await rateLimit(`capture-lead:${ip}`, 5, 3600)
  if (!limiter.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await request.json()

  const {
    firstName,
    lastName,
    email,
    phone,
    annualIncome,
    requestedAmount,
    requestedTerm,
  } = body

  // Validate required fields
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { success: false, error: 'First name, last name, email, and phone are required' },
      { status: 400 }
    )
  }

  const parsedIncome = Number(annualIncome)
  const parsedAmount = Number(requestedAmount)
  const parsedTerm = Number(requestedTerm)

  if (
    !Number.isFinite(parsedIncome) || parsedIncome <= 0 ||
    !Number.isFinite(parsedAmount) || parsedAmount <= 0 ||
    !Number.isInteger(parsedTerm) || parsedTerm <= 0
  ) {
    return NextResponse.json(
      { success: false, error: 'Annual income, requested amount, and requested term must be valid positive numbers' },
      { status: 400 }
    )
  }

  const customerName = `${firstName.trim()} ${lastName.trim()}`

  try {
    const adminClient = createAdminClient()

    // 1. Insert lead into the `leads` table
    const { data: lead, error: leadError } = await adminClient
      .from('leads')
      .insert({
        source: 'finance_app',
        status: 'new',
        priority: 'high',
        customer_name: customerName,
        customer_email: email.trim().toLowerCase(),
        customer_phone: phone.trim(),
        subject: `Finance Pre-Approval: $${parsedAmount.toLocaleString()} over ${parsedTerm} months`,
        message: `Annual income: $${parsedIncome.toLocaleString()}\nRequested amount: $${parsedAmount.toLocaleString()}\nTerm: ${parsedTerm} months`,
      })
      .select('id')
      .single()

    if (leadError) {
      console.error('Lead insert error:', leadError.message)
      // Non-blocking — continue even if leads table has issues
    }

    // 2. Fire ADF XML to AutoRaptor (fire-and-forget)
    fireAutoRaptorAdf({
      customerName,
      email: email.trim(),
      phone: phone.trim(),
      annualIncome: parsedIncome,
      requestedAmount: parsedAmount,
      requestedTerm: parsedTerm,
      leadId: lead?.id,
    }).catch((err) => console.error('AutoRaptor ADF fire-and-forget error:', err))

    // 3. Send admin notification email (fire-and-forget)
    sendNotificationEmail({
      type: 'finance_application',
      customerName,
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      additionalData: {
        annualIncome: parsedIncome,
        requestedAmount: parsedAmount,
        requestedTerm: parsedTerm,
        source: 'Magic Link Flow (pre-auth)',
      },
    }).catch((err) => console.error('Admin notification email error:', err))

    return NextResponse.json({
      success: true,
      data: {
        leadId: lead?.id ?? null,
        message: 'Lead captured successfully',
      },
    })
  } catch (err) {
    console.error('Lead capture error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Fire ADF XML to AutoRaptor for financing leads.
 * Adapted from lib/autoraptor.ts but with financing-specific fields.
 */
async function fireAutoRaptorAdf(params: {
  customerName: string
  email: string
  phone: string
  annualIncome: number
  requestedAmount: number
  requestedTerm: number
  leadId?: string
}) {
  const adfEndpoint = process.env.AUTORAPTOR_ADF_ENDPOINT
  if (!adfEndpoint) return

  const dealerId = process.env.AUTORAPTOR_DEALER_ID
  const dealerName = process.env.AUTORAPTOR_DEALER_NAME || 'Planet Motors'

  const [firstName, ...lastParts] = params.customerName.split(' ')
  const lastName = lastParts.join(' ') || ''
  const now = new Date().toISOString()
  const sourceId = params.leadId || `fin-${Date.now()}`

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const adfXml = `<?xml version="1.0" encoding="UTF-8"?>
<?adf version="1.0"?>
<adf>
  <prospect status="new">
    <id sequence="1" source="planetmotors.ca">${escapeXml(sourceId)}</id>
    <requestdate>${escapeXml(now)}</requestdate>
    <customer>
      <contact>
        <name part="first">${escapeXml(firstName)}</name>
        <name part="last">${escapeXml(lastName)}</name>
        <email>${escapeXml(params.email)}</email>
        <phone type="voice">${escapeXml(params.phone)}</phone>
      </contact>
      <comments>${escapeXml(`Finance pre-approval request. Annual income: $${Number(params.annualIncome).toLocaleString()}. Requested: $${Number(params.requestedAmount).toLocaleString()} over ${Number(params.requestedTerm)} months. Source: planetmotors.ca magic link flow.`)}</comments>
    </customer>
    <vendor>
      <contact>
        <name part="full">${escapeXml(dealerName)}</name>
      </contact>
    </vendor>
    <provider>
      <name part="full">Planet Motors Website - Finance Pre-Approval</name>
    </provider>
  </prospect>
</adf>`

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
    const text = await response.text().catch(() => '')
    console.error(`AutoRaptor ADF ${response.status}: ${text.slice(0, 200)}`)
  }
}
