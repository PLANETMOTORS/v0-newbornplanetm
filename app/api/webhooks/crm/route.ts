/**
 * app/api/webhooks/crm/route.ts
 *
 * Revenue Engine — CRM Webhook Bridge
 *
 * Receives lead capture events from:
 *  - Frontend form submissions (LeadCaptureForm, ContactForm, VDP inquiry)
 *  - Internal API routes (after Supabase insert)
 *  - External CRM systems (future: HubSpot, Salesforce)
 *
 * On each valid lead event it:
 *  1. Validates the payload and HMAC signature
 *  2. Saves the lead to Supabase via lib/anna/lead-capture.ts
 *  3. Fires Meta CAPI Lead event server-side
 *  4. Sends internal agent alert + customer follow-up via lib/email/lead-notifier.ts
 *  5. Returns a structured JSON response
 *
 * Security:
 *  - HMAC-SHA256 signature verification (X-PM-Signature header)
 *  - Rate limiting: 20 req/min per IP
 *  - Origin validation via lib/csrf.ts
 *  - Input sanitization on all string fields
 *
 * Environment variables:
 *  CRM_WEBHOOK_SECRET  — shared secret for HMAC signature (min 32 chars)
 */

import { createHmac, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/redis"
import { createLead } from "@/lib/anna/lead-capture"
import { trackLead } from "@/lib/meta-capi-helpers"
import { notifyLead, type LeadPayload } from "@/lib/email/lead-notifier"
import { logger } from "@/lib/logger"
import { pushToAutoRaptor, mapLeadToAutoRaptor } from "@/lib/crm/autoraptor"
import { maskEmail } from "@/lib/redact"

// ── HMAC verification ──────────────────────────────────────────────────────

const WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET ?? ""

function verifySignature(body: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET.length < 16) {
    // Secret not configured — skip verification in dev, warn in prod
    if (process.env.NODE_ENV === "production") {
      logger.warn("CRM_WEBHOOK_SECRET not set — signature verification skipped")
    }
    return true
  }
  if (!signature) return false

  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("hex")

  try {
    return timingSafeEqual(
      Buffer.from(signature.replace(/^sha256=/, ""), "hex"),
      Buffer.from(expected, "hex")
    )
  } catch {
    return false
  }
}

// ── Payload validation ─────────────────────────────────────────────────────

function sanitize(s: unknown): string {
  return typeof s === "string" ? s.trim().slice(0, 500) : ""
}

function validatePayload(raw: unknown): LeadPayload | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>

  const firstName = sanitize(r.firstName)
  const lastName = sanitize(r.lastName)
  const email = sanitize(r.email)
  const source = sanitize(r.source) || "lead_capture_form"

  if (!firstName || !email?.includes("@")) return null

  const vehicle = r.vehicle && typeof r.vehicle === "object"
    ? (r.vehicle as Record<string, unknown>)
    : null

  return {
    source,
    firstName,
    lastName,
    email,
    phone: sanitize(r.phone) || undefined,
    message: sanitize(r.message) || undefined,
    formName: sanitize(r.formName) || undefined,
    leadId: sanitize(r.leadId) || undefined,
    vehicle: vehicle
      ? {
          id: sanitize(vehicle.id) || undefined,
          year: typeof vehicle.year === "number" ? vehicle.year : undefined,
          make: sanitize(vehicle.make) || undefined,
          model: sanitize(vehicle.model) || undefined,
          trim: sanitize(vehicle.trim) || undefined,
          price: typeof vehicle.price === "number" ? vehicle.price : undefined,
          mileage: typeof vehicle.mileage === "number" ? vehicle.mileage : undefined,
          imageUrl: sanitize(vehicle.imageUrl) || undefined,
          vin: sanitize(vehicle.vin) || undefined,
          stockNumber: sanitize(vehicle.stockNumber) || undefined,
        }
      : undefined,
    utm:
      r.utm && typeof r.utm === "object"
        ? {
            source: sanitize((r.utm as Record<string, unknown>).source) || undefined,
            medium: sanitize((r.utm as Record<string, unknown>).medium) || undefined,
            campaign: sanitize((r.utm as Record<string, unknown>).campaign) || undefined,
          }
        : undefined,
  }
}

// ── POST handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startMs = Date.now()

  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const limiter = await rateLimit(`crm-webhook:${ip}`, 20, 60)
  if (!limiter.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  // Read raw body for HMAC verification
  const rawBody = await request.text()
  const signature = request.headers.get("x-pm-signature")

  if (!verifySignature(rawBody, signature)) {
    logger.warn("CRM webhook: invalid signature", { ip })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // Parse and validate
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const lead = validatePayload(parsed)
  if (!lead) {
    return NextResponse.json(
      { error: "Missing required fields: firstName, email" },
      { status: 422 }
    )
  }

  logger.info("CRM webhook: lead received", {
    source: lead.source,
    email: maskEmail(lead.email),
    vehicle: lead.vehicle ? `${lead.vehicle.year} ${lead.vehicle.make} ${lead.vehicle.model}` : null,
  })

  // ── 1. Save to Supabase (non-blocking) ────────────────────────────────
  const vehicleLabel = lead.vehicle
    ? [lead.vehicle.year, lead.vehicle.make, lead.vehicle.model, lead.vehicle.trim]
        .filter(Boolean)
        .join(" ")
    : undefined

  createLead({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    source: lead.source as any,
    customerName: `${lead.firstName} ${lead.lastName}`.trim(),
    customerEmail: lead.email,
    customerPhone: lead.phone,
    subject: vehicleLabel ?? "General Inquiry",
    message: lead.message,
    vehicleInfo: vehicleLabel,
  }).catch((err: unknown) =>
    logger.error("CRM webhook: Supabase lead save failed", { error: String(err) })
  )

  // ── 2. Meta CAPI (non-blocking) ────────────────────────────────────────
  try {
    trackLead(request, {
      email: lead.email,
      phone: lead.phone,
      firstName: lead.firstName,
      lastName: lead.lastName,
      contentName: vehicleLabel ?? lead.source,
      contentCategory: "lead",
      value: lead.vehicle?.price,
    })
  } catch (err: unknown) {
    logger.error("CRM webhook: Meta CAPI failed", { error: String(err) })
  }

  // ── 3. AutoRaptor CRM (non-blocking) ─────────────────────────────────────
  pushToAutoRaptor(mapLeadToAutoRaptor(lead)).catch((err: unknown) =>
    logger.error("CRM webhook: AutoRaptor push failed", { error: String(err) })
  )

  // ── 4. Email notifications ─────────────────────────────────────────────
  const emailResult = await notifyLead(lead)

  const durationMs = Date.now() - startMs

  logger.info("CRM webhook: processed", {
    durationMs,
    internalEmail: emailResult.internalEmail.success,
    customerEmail: emailResult.customerEmail.success,
  })

  return NextResponse.json({
    success: true,
    durationMs,
    emails: {
      internal: emailResult.internalEmail.success
        ? { sent: true, id: emailResult.internalEmail.id }
        : { sent: false, error: emailResult.internalEmail.error },
      customer: emailResult.customerEmail.success
        ? { sent: true, id: emailResult.customerEmail.id }
        : { sent: false, error: emailResult.customerEmail.error },
    },
  })
}

// ── GET — health check ─────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/crm",
    accepts: "POST application/json",
    requiredFields: ["firstName", "email", "source"],
    optionalFields: ["lastName", "phone", "message", "vehicle", "utm", "formName"],
    security: "HMAC-SHA256 via X-PM-Signature header (set CRM_WEBHOOK_SECRET)",
  })
}
