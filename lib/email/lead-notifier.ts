/**
 * lib/email/lead-notifier.ts
 *
 * Revenue Engine — Lead Notification Service
 *
 * Sends two emails on every new lead:
 *  1. Internal alert  → toni@planetmotors.ca (agent alerting)
 *  2. Customer follow-up → lead's email (personalized, vehicle-specific)
 *
 * Uses Resend (already installed: ^6.10.0) with the verified
 * planetmotors.ca domain. No additional packages required.
 *
 * Integrates with:
 *  - app/api/webhooks/crm/route.ts  (webhook bridge entry point)
 *  - lib/anna/lead-capture.ts       (Supabase lead storage)
 *  - lib/meta-capi-helpers.ts       (server-side Meta CAPI)
 */

import { Resend } from "resend"
import { escapeHtml } from "@/lib/email"
import {
  DEALERSHIP_LOCATION,
  PHONE_LOCAL,
  PHONE_TOLL_FREE,
} from "@/lib/constants/dealership"

// ── Config ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://planetmotors.ca"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "toni@planetmotors.ca"
const FROM_NOTIFICATIONS = process.env.FROM_EMAIL ?? "Planet Motors <notifications@planetmotors.ca>"
const FROM_SALES = "Planet Motors <hello@planetmotors.ca>"

// Brand palette (matches Tailwind config)
const BRAND = {
  navy: "#0f172a",
  blue: "#1d4ed8",
  blueLight: "#3b82f6",
  gold: "#f59e0b",
  goldLight: "#fbbf24",
  slate: "#64748b",
  slateLight: "#f1f5f9",
  white: "#ffffff",
  border: "#e2e8f0",
  green: "#16a34a",
  greenLight: "#dcfce7",
} as const

function getResend(): Resend | null {
  const key = process.env.API_KEY_RESEND ?? process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface LeadPayload {
  /** Lead source identifier */
  source:
    | "lead_capture_form"
    | "contact_form"
    | "finance_app"
    | "trade_in"
    | "reservation"
    | "test_drive"
    | "vdp_inquiry"
    | "chat"
    | string

  /** Customer details */
  firstName: string
  lastName: string
  email: string
  phone?: string

  /** Vehicle the lead is interested in */
  vehicle?: {
    id?: string
    year?: number
    make?: string
    model?: string
    trim?: string
    price?: number
    mileage?: number
    imageUrl?: string
    vin?: string
    stockNumber?: string
  }

  /** Free-form message from the customer */
  message?: string

  /** Form name for analytics attribution */
  formName?: string

  /** Supabase lead ID (set after DB insert) */
  leadId?: string

  /** UTM / attribution */
  utm?: {
    source?: string
    medium?: string
    campaign?: string
  }
}

export interface NotifyResult {
  internalEmail: { success: boolean; id?: string; error?: string }
  customerEmail: { success: boolean; id?: string; error?: string }
}

// ── HTML helpers ───────────────────────────────────────────────────────────

function vehicleLabel(v: LeadPayload["vehicle"]): string {
  if (!v) return "General Inquiry"
  const parts = [v.year, v.make, v.model, v.trim].filter(Boolean)
  return parts.join(" ")
}

function formatPrice(price?: number): string {
  if (!price) return ""
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price)
}

function formatMileage(km?: number): string {
  if (!km) return ""
  return new Intl.NumberFormat("en-CA").format(km) + " km"
}

// ── Shared layout wrapper ──────────────────────────────────────────────────

function emailWrapper(content: string, accentColor: string = BRAND.blue): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Planet Motors</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND.navy};padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:${accentColor};border-radius:8px;padding:6px 14px;margin-bottom:12px;">
                      <span style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Planet Motors</span>
                    </div>
                    <div style="width:40px;height:3px;background:${BRAND.gold};border-radius:2px;margin-bottom:4px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="background:${BRAND.navy};padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#94a3b8;font-size:12px;line-height:1.6;">
                    <strong style="color:#cbd5e1;">Planet Motors</strong><br/>
                    ${escapeHtml(DEALERSHIP_LOCATION.streetAddress)}, ${escapeHtml(DEALERSHIP_LOCATION.city)}, ${escapeHtml(DEALERSHIP_LOCATION.province)} ${escapeHtml(DEALERSHIP_LOCATION.postalCode)}<br/>
                    <a href="tel:${escapeHtml(PHONE_LOCAL)}" style="color:${BRAND.goldLight};text-decoration:none;">${escapeHtml(PHONE_LOCAL)}</a>
                    &nbsp;·&nbsp;
                    <a href="tel:${escapeHtml(PHONE_TOLL_FREE)}" style="color:${BRAND.goldLight};text-decoration:none;">${escapeHtml(PHONE_TOLL_FREE)}</a>
                    &nbsp;·&nbsp;
                    <a href="${BASE_URL}" style="color:${BRAND.goldLight};text-decoration:none;">planetmotors.ca</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Internal alert email ───────────────────────────────────────────────────

/**
 * Build the inner "vehicle card" HTML used in the internal alert email.
 * Early-returns "" when there is no vehicle, so the inner conditional
 * fragments (price, mileage, VIN, stock #, VDP CTA) live at the top level
 * of a template literal — no nested ternaries.
 */
function buildInternalVehicleCard(
  lead: LeadPayload,
  vLabel: string,
  vdpUrl: string | null,
): string {
  const v = lead.vehicle
  if (!v) return ""

  const imageRow = v.imageUrl
    ? `
          <tr>
            <td style="padding:0;">
              <img src="${escapeHtml(v.imageUrl)}" alt="${vLabel}"
                   width="600" style="width:100%;max-height:220px;object-fit:cover;display:block;" />
            </td>
          </tr>`
    : ""

  const priceRow = v.price
    ? `<tr><td style="padding:3px 12px 3px 0;color:${BRAND.slate};font-size:13px;">Price</td><td style="padding:3px 0;font-weight:600;color:${BRAND.green};font-size:15px;">${escapeHtml(formatPrice(v.price))}</td></tr>`
    : ""

  const mileageRow = v.mileage
    ? `<tr><td style="padding:3px 12px 3px 0;color:${BRAND.slate};font-size:13px;">Mileage</td><td style="padding:3px 0;font-weight:600;color:${BRAND.navy};font-size:13px;">${escapeHtml(formatMileage(v.mileage))}</td></tr>`
    : ""

  const vinRow = v.vin
    ? `<tr><td style="padding:3px 12px 3px 0;color:${BRAND.slate};font-size:13px;">VIN</td><td style="padding:3px 0;font-family:monospace;font-size:12px;color:${BRAND.slate};">${escapeHtml(v.vin)}</td></tr>`
    : ""

  const stockRow = v.stockNumber
    ? `<tr><td style="padding:3px 12px 3px 0;color:${BRAND.slate};font-size:13px;">Stock #</td><td style="padding:3px 0;font-size:13px;color:${BRAND.slate};">${escapeHtml(v.stockNumber)}</td></tr>`
    : ""

  const vdpCta = vdpUrl
    ? `<div style="margin-top:16px;"><a href="${escapeHtml(vdpUrl)}" style="display:inline-block;background:${BRAND.navy};color:#fff;font-size:12px;font-weight:600;padding:8px 16px;border-radius:6px;text-decoration:none;">View VDP →</a></div>`
    : ""

  return `
    <!-- Vehicle card -->
    <tr>
      <td style="padding:0 32px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="background:${BRAND.slateLight};border-radius:10px;overflow:hidden;border:1px solid ${BRAND.border};">
          ${imageRow}
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${BRAND.navy};">${vLabel}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                ${priceRow}
                ${mileageRow}
                ${vinRow}
                ${stockRow}
              </table>
              ${vdpCta}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

function buildInternalAlert(lead: LeadPayload): { subject: string; html: string } {
  const name = escapeHtml(`${lead.firstName} ${lead.lastName}`)
  const vLabel = escapeHtml(vehicleLabel(lead.vehicle))
  const sourceLabel = escapeHtml(lead.source.replaceAll("_", " ").replaceAll(/\b\w/g, c => c.toUpperCase()))
  const adminUrl = `${BASE_URL}/admin/leads${lead.leadId ? `?highlight=${lead.leadId}` : ""}`
  const vdpUrl = lead.vehicle?.id ? `${BASE_URL}/vehicles/${lead.vehicle.id}` : null

  const vehicleBlock = buildInternalVehicleCard(lead, vLabel, vdpUrl)

  const content = `
    <!-- Alert badge -->
    <tr>
      <td style="padding:28px 32px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${BRAND.gold};border-radius:20px;padding:4px 14px;">
              <span style="color:${BRAND.navy};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">🔔 New Lead — ${sourceLabel}</span>
            </td>
          </tr>
        </table>
        <h1 style="margin:16px 0 4px;font-size:24px;font-weight:800;color:${BRAND.navy};">${name}</h1>
        <p style="margin:0;color:${BRAND.slate};font-size:14px;">Submitted just now · ${new Date().toLocaleString("en-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" })} ET</p>
      </td>
    </tr>

    <!-- Contact details -->
    <tr>
      <td style="padding:16px 32px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;">
          <tr style="background:${BRAND.slateLight};">
            <td colspan="2" style="padding:10px 16px;font-size:11px;font-weight:700;color:${BRAND.slate};letter-spacing:1px;text-transform:uppercase;">Contact Information</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.slate};font-size:13px;width:120px;">Email</td>
            <td style="padding:10px 16px;border-top:1px solid ${BRAND.border};font-size:13px;"><a href="mailto:${escapeHtml(lead.email)}" style="color:${BRAND.blue};text-decoration:none;font-weight:600;">${escapeHtml(lead.email)}</a></td>
          </tr>
          ${lead.phone ? `<tr>
            <td style="padding:10px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.slate};font-size:13px;">Phone</td>
            <td style="padding:10px 16px;border-top:1px solid ${BRAND.border};font-size:13px;"><a href="tel:${escapeHtml(lead.phone)}" style="color:${BRAND.blue};text-decoration:none;font-weight:600;">${escapeHtml(lead.phone)}</a></td>
          </tr>` : ""}
          ${lead.message ? `<tr>
            <td style="padding:10px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.slate};font-size:13px;vertical-align:top;">Message</td>
            <td style="padding:10px 16px;border-top:1px solid ${BRAND.border};font-size:13px;color:${BRAND.navy};line-height:1.5;">${escapeHtml(lead.message)}</td>
          </tr>` : ""}
          ${lead.utm?.campaign ? `<tr>
            <td style="padding:10px 16px;border-top:1px solid ${BRAND.border};color:${BRAND.slate};font-size:13px;">Campaign</td>
            <td style="padding:10px 16px;border-top:1px solid ${BRAND.border};font-size:12px;font-family:monospace;color:${BRAND.slate};">${escapeHtml(lead.utm.campaign)}</td>
          </tr>` : ""}
        </table>
      </td>
    </tr>

    ${vehicleBlock}

    <!-- CTA -->
    <tr>
      <td style="padding:0 32px 32px;text-align:center;">
        <a href="${escapeHtml(adminUrl)}"
           style="display:inline-block;background:${BRAND.blue};color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
          Open in Admin Dashboard →
        </a>
        ${lead.phone ? `<br/><a href="tel:${escapeHtml(lead.phone)}" style="display:inline-block;margin-top:12px;color:${BRAND.slate};font-size:13px;text-decoration:none;">📞 Call ${escapeHtml(lead.phone)} now</a>` : ""}
      </td>
    </tr>
  `

  return {
    subject: `🔔 New Lead: ${name} — ${vLabel || sourceLabel}`,
    html: emailWrapper(content, BRAND.blue),
  }
}

// ── Customer follow-up email ───────────────────────────────────────────────

/**
 * Build the inner "vehicle highlight" HTML used in the customer follow-up
 * email. Early-returns "" when there is no vehicle, so the inner
 * conditional fragments live at the top level — no nested ternaries.
 */
function buildCustomerVehicleHighlight(
  lead: LeadPayload,
  vLabel: string,
  vdpUrl: string,
): string {
  const v = lead.vehicle
  if (!v) return ""

  const imageRow = v.imageUrl
    ? `
          <tr>
            <td>
              <img src="${escapeHtml(v.imageUrl)}" alt="${vLabel}"
                   width="600" style="width:100%;max-height:200px;object-fit:cover;display:block;" />
            </td>
          </tr>`
    : ""

  const priceLine = v.price
    ? `<p style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.green};">${escapeHtml(formatPrice(v.price))}</p>`
    : ""

  return `
    <!-- Vehicle highlight -->
    <tr>
      <td style="padding:0 32px 28px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND.slate};letter-spacing:1px;text-transform:uppercase;">Your Vehicle of Interest</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="background:${BRAND.slateLight};border-radius:10px;overflow:hidden;border:1px solid ${BRAND.border};">
          ${imageRow}
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:${BRAND.navy};">${vLabel}</p>
              ${priceLine}
              <a href="${escapeHtml(vdpUrl)}"
                 style="display:inline-block;background:${BRAND.navy};color:#fff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:6px;text-decoration:none;">
                View Full Details →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

function buildCustomerFollowUp(lead: LeadPayload): { subject: string; html: string } {
  const firstName = escapeHtml(lead.firstName)
  const vLabel = escapeHtml(vehicleLabel(lead.vehicle))
  const hasVehicle = !!lead.vehicle
  const vdpUrl = lead.vehicle?.id ? `${BASE_URL}/vehicles/${lead.vehicle.id}` : `${BASE_URL}/inventory`

  const vehicleSection = buildCustomerVehicleHighlight(lead, vLabel, vdpUrl)

  const content = `
    <!-- Greeting -->
    <tr>
      <td style="padding:32px 32px 8px;">
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:${BRAND.navy};">Hi ${firstName}, thanks for reaching out! 👋</h1>
        <p style="margin:0;color:${BRAND.slate};font-size:15px;line-height:1.6;">
          We've received your inquiry${hasVehicle ? ` about the <strong style="color:${BRAND.navy};">${vLabel}</strong>` : ""} and a member of our team will be in touch within <strong>2 hours</strong> during business hours.
        </p>
      </td>
    </tr>

    <!-- What happens next -->
    <tr>
      <td style="padding:24px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="background:${BRAND.greenLight};border-radius:10px;border:1px solid #bbf7d0;padding:20px 24px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#166534;letter-spacing:1px;text-transform:uppercase;">What Happens Next</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="padding:4px 0;font-size:14px;color:#166534;">✅ &nbsp;Your inquiry is confirmed and saved</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#166534;">📞 &nbsp;A specialist will call or email you within 2 hours</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#166534;">🚗 &nbsp;We'll answer all your questions about the vehicle</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#166534;">📅 &nbsp;We can schedule a test drive at your convenience</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${vehicleSection}

    <!-- Contact us -->
    <tr>
      <td style="padding:0 32px 28px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND.slate};letter-spacing:1px;text-transform:uppercase;">Can't Wait? Reach Us Directly</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:12px;">
              <a href="tel:${escapeHtml(PHONE_LOCAL)}"
                 style="display:inline-block;background:${BRAND.blue};color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
                📞 ${escapeHtml(PHONE_LOCAL)}
              </a>
            </td>
            <td>
              <a href="${BASE_URL}/inventory"
                 style="display:inline-block;background:${BRAND.slateLight};color:${BRAND.navy};font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid ${BRAND.border};">
                Browse Inventory
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:0 32px;"><div style="height:1px;background:${BRAND.border};"></div></td></tr>

    <!-- Sign-off -->
    <tr>
      <td style="padding:24px 32px 32px;">
        <p style="margin:0;font-size:14px;color:${BRAND.slate};line-height:1.6;">
          Looking forward to helping you find your perfect vehicle,<br/>
          <strong style="color:${BRAND.navy};">The Planet Motors Sales Team</strong><br/>
          <span style="font-size:12px;">${escapeHtml(DEALERSHIP_LOCATION.streetAddress)}, ${escapeHtml(DEALERSHIP_LOCATION.city)}, ${escapeHtml(DEALERSHIP_LOCATION.province)}</span>
        </p>
      </td>
    </tr>
  `

  return {
    subject: hasVehicle
      ? `Your inquiry about the ${vLabel} — Planet Motors`
      : `We received your inquiry — Planet Motors`,
    html: emailWrapper(content, BRAND.gold),
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Sends both the internal agent alert and the customer follow-up email.
 *
 * Both sends are attempted independently — a failure in one does not
 * prevent the other from being sent.
 *
 * @example
 *   const result = await notifyLead({
 *     source: "vdp_inquiry",
 *     firstName: "Sarah",
 *     lastName: "Chen",
 *     email: "sarah@example.com",
 *     phone: "416-555-0123",
 *     vehicle: { id: "abc-123", year: 2023, make: "Tesla", model: "Model 3", price: 49900 },
 *   })
 */
export async function notifyLead(lead: LeadPayload): Promise<NotifyResult> {
  const resend = getResend()

  if (!resend) {
    const err = "Resend not configured — set API_KEY_RESEND or RESEND_API_KEY"
    return {
      internalEmail: { success: false, error: err },
      customerEmail: { success: false, error: err },
    }
  }

  const [internalResult, customerResult] = await Promise.allSettled([
    // 1. Internal agent alert
    resend.emails.send({
      from: FROM_NOTIFICATIONS,
      to: ADMIN_EMAIL,
      replyTo: lead.email,
      ...buildInternalAlert(lead),
    }),

    // 2. Customer follow-up
    resend.emails.send({
      from: FROM_SALES,
      to: lead.email,
      ...buildCustomerFollowUp(lead),
    }),
  ])

  return {
    internalEmail:
      internalResult.status === "fulfilled" && !internalResult.value.error
        ? { success: true, id: internalResult.value.data?.id }
        : {
            success: false,
            error:
              internalResult.status === "rejected"
                ? String(internalResult.reason)
                : JSON.stringify(internalResult.value.error),
          },

    customerEmail:
      customerResult.status === "fulfilled" && !customerResult.value.error
        ? { success: true, id: customerResult.value.data?.id }
        : {
            success: false,
            error:
              customerResult.status === "rejected"
                ? String(customerResult.reason)
                : JSON.stringify(customerResult.value.error),
          },
  }
}

/**
 * Sends only the internal agent alert (no customer email).
 * Use for leads where the customer email is unknown or unverified.
 */
export async function notifyAgentOnly(lead: LeadPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResend()
  if (!resend) return { success: false, error: "Resend not configured" }

  const { data, error } = await resend.emails.send({
    from: FROM_NOTIFICATIONS,
    to: ADMIN_EMAIL,
    replyTo: lead.email,
    ...buildInternalAlert(lead),
  })

  return error
    ? { success: false, error: JSON.stringify(error) }
    : { success: true, id: data?.id }
}
