import { Resend } from 'resend'
import { PHONE_LOCAL } from "@/lib/constants/dealership"

/** Escape user-supplied strings before interpolating into HTML templates. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getResendClient(): Resend | null {
  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'toni@planetmotors.ca'
// Domain verified in Resend - emails now come from planetmotors.ca
const FROM_EMAIL = process.env.FROM_EMAIL || 'Planet Motors <notifications@planetmotors.ca>'

export type NotificationType = 
  | 'finance_application'
  | 'trade_in_quote'
  | 'ico_accepted'
  | 'vehicle_inquiry'
  | 'test_drive_request'
  | 'document_uploaded'
  | 'application_status_changed'
  | 'verification_code'

interface EmailData {
  type: NotificationType
  customerName: string
  customerEmail: string
  customerPhone?: string
  vehicleInfo?: string
  applicationId?: string
  quoteId?: string
  tradeInValue?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Template values of mixed types
  additionalData?: Record<string, any>
}

// Email templates
const templates: Record<NotificationType, (data: EmailData) => { subject: string; html: string }> = {
  finance_application: (data) => ({
    subject: `🚗 New Finance Application - ${escapeHtml(data.customerName)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">New Finance Application</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e40af;">Application Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="tel:${escapeHtml(data.customerPhone || '')}">${escapeHtml(data.customerPhone || 'N/A')}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.vehicleInfo || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.applicationId || 'N/A')}</td></tr>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'}/admin/finance" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Application</a>
          </div>
        </div>
        <div style="padding: 15px; background: #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
          <p>This is an automated notification from Planet Motors CMS</p>
        </div>
      </div>
    `
  }),

  trade_in_quote: (data) => ({
    subject: `💰 New Trade-In Quote Request - ${escapeHtml(data.customerName)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Trade-In Quote Request</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #059669;">Quote Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerPhone || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.vehicleInfo || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Quote ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.quoteId || 'N/A')}</td></tr>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'}/admin/trade-ins" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Quote</a>
          </div>
        </div>
      </div>
    `
  }),

  ico_accepted: (data) => ({
    subject: `✅ ICO Offer Accepted - ${escapeHtml(data.customerName)} - $${data.tradeInValue?.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Instant Cash Offer ACCEPTED</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <div style="background: #dcfce7; border: 2px solid #22c55e; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="color: #166534; margin: 0;">Offer Accepted: $${data.tradeInValue?.toLocaleString()}</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerPhone || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.vehicleInfo || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Quote ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.quoteId || 'N/A')}</td></tr>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'}/admin/trade-ins" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
          </div>
        </div>
      </div>
    `
  }),

  vehicle_inquiry: (data) => ({
    subject: `📩 Vehicle Inquiry - ${escapeHtml(data.vehicleInfo || '')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">New Vehicle Inquiry</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #0891b2;">Inquiry Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerPhone || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.vehicleInfo || 'N/A')}</td></tr>
            ${data.additionalData?.message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Message:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.additionalData.message)}</td></tr>` : ''}
          </table>
        </div>
      </div>
    `
  }),

  test_drive_request: (data) => ({
    subject: `🚙 Test Drive Request - ${escapeHtml(data.vehicleInfo || '')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ea580c; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Test Drive Request</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #ea580c;">Test Drive Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerPhone || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.vehicleInfo || 'N/A')}</td></tr>
            ${data.additionalData?.preferredDate ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Preferred Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.additionalData.preferredDate)}</td></tr>` : ''}
          </table>
        </div>
      </div>
    `
  }),

  document_uploaded: (data) => ({
    subject: `📄 Documents Uploaded - ${escapeHtml(data.customerName)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4f46e5; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Documents Uploaded</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <p>Customer <strong>${escapeHtml(data.customerName)}</strong> has uploaded documents for their finance application.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.applicationId || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Documents:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.additionalData?.documentCount || 1} file(s)</td></tr>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'}/admin/finance" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Documents</a>
          </div>
        </div>
      </div>
    `
  }),

  application_status_changed: (data) => ({
    subject: `📋 Application Status Updated - ${escapeHtml(data.additionalData?.newStatus || '')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Application Status Update</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <div style="background: #dbeafe; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0;">Status changed to: <strong>${escapeHtml(data.additionalData?.newStatus || '')}</strong></p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.customerName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.applicationId || 'N/A')}</td></tr>
            ${data.additionalData?.notes ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Notes:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.additionalData.notes)}</td></tr>` : ''}
          </table>
        </div>
      </div>
    `
  }),

  verification_code: (data) => ({
    subject: `🔐 Your Planet Motors Verification Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Verification Code</p>
        </div>
        <div style="padding: 30px; background: #f8fafc; text-align: center;">
          <p style="margin: 0 0 20px; color: #64748b;">Your verification code to ${escapeHtml(data.additionalData?.purpose || '')} is:</p>
          <div style="background: #1e40af; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 30px; border-radius: 8px; display: inline-block;">
            ${escapeHtml(data.additionalData?.code || '')}
          </div>
          <p style="margin: 20px 0 0; color: #94a3b8; font-size: 14px;">This code expires in ${escapeHtml(data.additionalData?.expiresIn || '10 minutes')}.</p>
          <p style="margin: 10px 0 0; color: #94a3b8; font-size: 14px;">If you didn&apos;t request this code, please ignore this email.</p>
        </div>
        <div style="padding: 15px; background: #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
          Planet Motors | ${PHONE_LOCAL} | planetmotors.ca
        </div>
      </div>
    `
  })
}

export async function sendNotificationEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const resendClient = getResendClient()
    if (!resendClient) {
      return { success: false, error: 'Email not configured - missing RESEND_API_KEY' }
    }

    const template = templates[data.type](data)
    
    // Send to customer for verification codes, otherwise send to admin
    const recipient = data.type === 'verification_code' ? data.customerEmail : ADMIN_EMAIL
    
    const { error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      return { success: false, error: JSON.stringify(error) }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Customer confirmation emails
export async function sendCustomerConfirmationEmail(
  customerEmail: string,
  type: 'finance_submitted' | 'trade_in_submitted' | 'ico_confirmed',
  data: { customerName: string; referenceId?: string; vehicleInfo?: string; offerAmount?: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    const resendClient = getResendClient()
    if (!resendClient) {
      return { success: false, error: 'Email not configured' }
    }

    let subject = ''
    let html = ''

    if (type === 'finance_submitted') {
      subject = 'Your Finance Application - Planet Motors'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Planet Motors</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Thank you, ${escapeHtml(data.customerName)}!</h2>
            <p>Your finance application has been received. Our team will review it within 24 hours.</p>
            ${data.referenceId ? `<p><strong>Reference:</strong> ${escapeHtml(data.referenceId)}</p>` : ''}
            ${data.vehicleInfo ? `<p><strong>Vehicle:</strong> ${escapeHtml(data.vehicleInfo)}</p>` : ''}
            <p>We'll contact you soon with next steps.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #64748b; font-size: 14px;">Questions? Call us at ${PHONE_LOCAL}</p>
          </div>
        </div>
      `
    } else if (type === 'trade_in_submitted') {
      subject = 'Your Trade-In Quote Request - Planet Motors'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Planet Motors</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Thank you, ${escapeHtml(data.customerName)}!</h2>
            <p>We've received your trade-in quote request and will get back to you shortly.</p>
            ${data.vehicleInfo ? `<p><strong>Your Vehicle:</strong> ${escapeHtml(data.vehicleInfo)}</p>` : ''}
            <p>Our team will evaluate your vehicle and provide a competitive offer.</p>
          </div>
        </div>
      `
    } else if (type === 'ico_confirmed') {
      subject = 'Your Instant Cash Offer is Confirmed! - Planet Motors'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Planet Motors</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Congratulations, ${escapeHtml(data.customerName)}!</h2>
            <div style="background: #dcfce7; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 24px; color: #166534;"><strong>$${data.offerAmount?.toLocaleString()}</strong></p>
              <p style="margin: 5px 0 0; color: #166534;">Accepted Offer</p>
            </div>
            ${data.vehicleInfo ? `<p><strong>Vehicle:</strong> ${escapeHtml(data.vehicleInfo)}</p>` : ''}
            <p>Our team will contact you within 24 hours to schedule vehicle inspection and payment.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #64748b; font-size: 14px;">Questions? Call us at ${PHONE_LOCAL}</p>
          </div>
        </div>
      `
    }

    const { error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject,
      html,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
