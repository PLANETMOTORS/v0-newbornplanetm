/**
 * Post-payment webhook notifications — fire-and-forget.
 *
 * After a successful Stripe payment, we send:
 *   1. AutoRaptor CRM lead creation (dealership gets the lead)
 *   2. Resend order confirmation email (customer gets a receipt)
 *
 * Both are wrapped in try/catch so failures never block the webhook
 * response. Stripe is the source of truth for payment status.
 */

import type Stripe from 'stripe'
import { createAutoRaptorLead } from '@/lib/autoraptor'
import { escapeHtml } from '@/lib/email'
import { Resend } from 'resend'

const FROM_EMAIL = process.env.FROM_EMAIL || 'Planet Motors <notifications@planetmotors.ca>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'toni@planetmotors.ca'

function getResendClient(): Resend | null {
  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

interface PaymentNotificationData {
  customerEmail: string
  customerName: string
  customerPhone?: string
  vehicleId?: string
  vehicleName: string
  vehicleYear?: number
  vehicleMake?: string
  vehicleModel?: string
  amountCents: number
  currency: string
  stripeSessionId: string
  isDeposit: boolean
}

/**
 * Extract notification data from a Stripe Checkout Session.
 * Returns null if there's not enough info to send notifications.
 */
export function extractNotificationData(
  session: Stripe.Checkout.Session
): PaymentNotificationData | null {
  const metadata = session.metadata ?? {}
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? ''
  const customerName = session.customer_details?.name ?? customerEmail.split('@')[0] ?? 'Customer'
  const customerPhone = session.customer_details?.phone ?? undefined

  if (!customerEmail) return null

  const vehicleId = metadata.vehicleId ?? undefined
  const isDeposit = metadata.depositOnly === 'true'
  const vehicleName = metadata.vehicleName ?? `Vehicle ${vehicleId ?? 'N/A'}`

  return {
    customerEmail,
    customerName,
    customerPhone,
    vehicleId,
    vehicleName,
    vehicleYear: metadata.vehicleYear ? Number(metadata.vehicleYear) : undefined,
    vehicleMake: metadata.vehicleMake ?? undefined,
    vehicleModel: metadata.vehicleModel ?? undefined,
    amountCents: session.amount_total ?? 0,
    currency: session.currency ?? 'cad',
    stripeSessionId: session.id,
    isDeposit,
  }
}

/**
 * Fire-and-forget: send all post-payment notifications.
 * Errors are logged but never thrown.
 */
export async function sendPaymentNotifications(data: PaymentNotificationData): Promise<void> {
  const results = await Promise.allSettled([
    notifyAutoRaptor(data),
    sendOrderConfirmationEmail(data),
    sendAdminOrderAlert(data),
  ])

  for (const [idx, result] of results.entries()) {
    const labels = ['AutoRaptor CRM', 'Customer email', 'Admin alert']
    if (result.status === 'rejected') {
      console.error(`[webhook-notify] ${labels[idx]} failed:`, result.reason)
    }
  }
}

async function notifyAutoRaptor(data: PaymentNotificationData): Promise<void> {
  const result = await createAutoRaptorLead({
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    vehicleYear: data.vehicleYear,
    vehicleMake: data.vehicleMake,
    vehicleModel: data.vehicleModel,
    vehicleId: data.vehicleId,
    depositAmount: data.amountCents,
    stripeSessionId: data.stripeSessionId,
    source: 'planetmotors.ca - Online Checkout',
  })

  if (result.success) {
    console.info(`[webhook-notify] AutoRaptor lead created: ${result.leadId ?? 'unknown ID'}`)
  } else {
    console.warn(`[webhook-notify] AutoRaptor lead failed: ${result.error}`)
  }
}

async function sendOrderConfirmationEmail(data: PaymentNotificationData): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[webhook-notify] Resend not configured — skipping customer email')
    return
  }

  const amountFormatted = `$${(data.amountCents / 100).toFixed(2)} ${data.currency.toUpperCase()}`
  const typeLabel = data.isDeposit ? 'Refundable Deposit' : 'Payment'

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `Your ${typeLabel} Confirmation — Planet Motors`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Order Confirmation</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e40af;">Thank you, ${escapeHtml(data.customerName)}!</h2>
          <p>Your ${typeLabel.toLowerCase()} of <strong>${escapeHtml(amountFormatted)}</strong> has been confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.vehicleName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(amountFormatted)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Type:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(typeLabel)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Confirmation:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.stripeSessionId)}</td>
            </tr>
          </table>
          ${data.isDeposit ? '<p style="color: #059669;"><strong>Your deposit is fully refundable.</strong> Our team will be in touch within 24 hours to discuss next steps.</p>' : '<p>Our team will contact you shortly to arrange delivery.</p>'}
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visit Planet Motors</a>
          </div>
        </div>
        <div style="padding: 15px; background: #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
          <p>Planet Motors | (866) 797-3332 | planetmotors.ca</p>
        </div>
      </div>
    `,
  })

  if (error) {
    console.warn(`[webhook-notify] Customer email failed: ${JSON.stringify(error)}`)
  } else {
    console.info(`[webhook-notify] Order confirmation sent to ${data.customerEmail.replace(/(.{2}).*(@.*)/, '$1***$2')}`)
  }
}

async function sendAdminOrderAlert(data: PaymentNotificationData): Promise<void> {
  const resend = getResendClient()
  if (!resend) return

  const amountFormatted = `$${(data.amountCents / 100).toFixed(2)} ${data.currency.toUpperCase()}`
  const typeLabel = data.isDeposit ? 'Deposit' : 'Full Payment'

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New ${typeLabel}: ${escapeHtml(data.vehicleName)} — ${escapeHtml(data.customerName)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Online Order</h1>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></td></tr>
            ${data.customerPhone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="tel:${escapeHtml(data.customerPhone)}">${escapeHtml(data.customerPhone)}</a></td></tr>` : ''}
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.vehicleName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(amountFormatted)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(typeLabel)}</td></tr>
            <tr><td style="padding: 8px;"><strong>Stripe ID:</strong></td><td style="padding: 8px;">${escapeHtml(data.stripeSessionId)}</td></tr>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'}/admin" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Admin</a>
          </div>
        </div>
      </div>
    `,
  })

  if (error) {
    console.warn(`[webhook-notify] Admin alert failed: ${JSON.stringify(error)}`)
  } else {
    console.info(`[webhook-notify] Admin order alert sent to ${ADMIN_EMAIL}`)
  }
}
