import { Resend } from 'resend'

const resend = new Resend(process.env.API_KEY_RESEND || process.env.RESEND_API_KEY)

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

interface EmailData {
  type: NotificationType
  customerName: string
  customerEmail: string
  customerPhone?: string
  vehicleInfo?: string
  applicationId?: string
  quoteId?: string
  tradeInValue?: number
  additionalData?: Record<string, any>
}

// Email templates
const templates: Record<NotificationType, (data: EmailData) => { subject: string; html: string }> = {
  finance_application: (data) => ({
    subject: `🚗 New Finance Application - ${data.customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">New Finance Application</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #1e40af;">Application Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="tel:${data.customerPhone}">${data.customerPhone || 'N/A'}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.vehicleInfo || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.applicationId || 'N/A'}</td></tr>
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
    subject: `💰 New Trade-In Quote Request - ${data.customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Trade-In Quote Request</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #059669;">Quote Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.vehicleInfo || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Quote ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.quoteId || 'N/A'}</td></tr>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'}/admin/trade-ins" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Quote</a>
          </div>
        </div>
      </div>
    `
  }),

  ico_accepted: (data) => ({
    subject: `✅ ICO Offer Accepted - ${data.customerName} - $${data.tradeInValue?.toLocaleString()}`,
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
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.vehicleInfo || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Quote ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.quoteId || 'N/A'}</td></tr>
          </table>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'}/admin/trade-ins" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
          </div>
        </div>
      </div>
    `
  }),

  vehicle_inquiry: (data) => ({
    subject: `📩 Vehicle Inquiry - ${data.vehicleInfo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">New Vehicle Inquiry</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #0891b2;">Inquiry Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.vehicleInfo || 'N/A'}</td></tr>
            ${data.additionalData?.message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Message:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.additionalData.message}</td></tr>` : ''}
          </table>
        </div>
      </div>
    `
  }),

  test_drive_request: (data) => ({
    subject: `🚙 Test Drive Request - ${data.vehicleInfo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ea580c; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Test Drive Request</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #ea580c;">Test Drive Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.vehicleInfo || 'N/A'}</td></tr>
            ${data.additionalData?.preferredDate ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Preferred Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.additionalData.preferredDate}</td></tr>` : ''}
          </table>
        </div>
      </div>
    `
  }),

  document_uploaded: (data) => ({
    subject: `📄 Documents Uploaded - ${data.customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4f46e5; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Documents Uploaded</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <p>Customer <strong>${data.customerName}</strong> has uploaded documents for their finance application.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.applicationId || 'N/A'}</td></tr>
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
    subject: `📋 Application Status Updated - ${data.additionalData?.newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Planet Motors</h1>
          <p style="margin: 5px 0 0;">Application Status Update</p>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <div style="background: #dbeafe; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0;">Status changed to: <strong>${data.additionalData?.newStatus}</strong></p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Customer:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.customerName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.applicationId || 'N/A'}</td></tr>
            ${data.additionalData?.notes ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Notes:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${data.additionalData.notes}</td></tr>` : ''}
          </table>
        </div>
      </div>
    `
  })
}

export async function sendNotificationEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.API_KEY_RESEND && !process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email not configured - missing RESEND_API_KEY' }
    }

    const template = templates[data.type](data)
    
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
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
    if (!process.env.API_KEY_RESEND && !process.env.RESEND_API_KEY) {
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
            <h2>Thank you, ${data.customerName}!</h2>
            <p>Your finance application has been received. Our team will review it within 24 hours.</p>
            ${data.referenceId ? `<p><strong>Reference:</strong> ${data.referenceId}</p>` : ''}
            ${data.vehicleInfo ? `<p><strong>Vehicle:</strong> ${data.vehicleInfo}</p>` : ''}
            <p>We'll contact you soon with next steps.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #64748b; font-size: 14px;">Questions? Call us at (416) 270-9955</p>
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
            <h2>Thank you, ${data.customerName}!</h2>
            <p>We've received your trade-in quote request and will get back to you shortly.</p>
            ${data.vehicleInfo ? `<p><strong>Your Vehicle:</strong> ${data.vehicleInfo}</p>` : ''}
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
            <h2>Congratulations, ${data.customerName}!</h2>
            <div style="background: #dcfce7; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 24px; color: #166534;"><strong>$${data.offerAmount?.toLocaleString()}</strong></p>
              <p style="margin: 5px 0 0; color: #166534;">Accepted Offer</p>
            </div>
            ${data.vehicleInfo ? `<p><strong>Vehicle:</strong> ${data.vehicleInfo}</p>` : ''}
            <p>Our team will contact you within 24 hours to schedule vehicle inspection and payment.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #64748b; font-size: 14px;">Questions? Call us at (416) 270-9955</p>
          </div>
        </div>
      `
    }

    const { error } = await resend.emails.send({
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
