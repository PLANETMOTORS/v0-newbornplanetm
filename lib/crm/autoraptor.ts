/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * lib/crm/autoraptor.ts
 *
 * AutoRaptor CRM Integration — ADF/XML E-Leads
 *
 * AutoRaptor uses the industry-standard ADF (Auto-lead Data Format) 1.0
 * XML schema. Every new lead is POSTed to AutoRaptor's e-leads endpoint
 * as a properly-formed ADF/XML document.
 *
 * Dealership credentials (hardened in env vars, not source):
 *   AUTORAPTOR_ELEAD_URL   = https://ar.autoraptor.com/incoming/adf/ARAP2926-IO
 *   AUTORAPTOR_ELEAD_EMAIL = eleads-planet-motors-11061@app.autoraptor.com
 *   AUTORAPTOR_DEALER_ID   = 2926-56AADAD77C57512A6B360346637682F6305A582B
 *
 * ADF spec reference: https://ar.autoraptor.com/pdfs/adf1.pdf
 *
 * Integration points:
 *   - app/api/webhooks/crm/route.ts  (called after Supabase save)
 *   - lib/anna/lead-capture.ts       (called after chat lead creation)
 */

import { logger } from "@/lib/logger"

// ── Config ─────────────────────────────────────────────────────────────────

const ELEAD_URL =
  process.env.AUTORAPTOR_ELEAD_URL ??
  "https://ar.autoraptor.com/incoming/adf/ARAP2926-IO"

const DEALER_ID =
  process.env.AUTORAPTOR_DEALER_ID ??
  "2926-56AADAD77C57512A6B360346637682F6305A582B"

const DEALER_NAME = "Planet Motors"
const DEALER_EMAIL =
  process.env.AUTORAPTOR_ELEAD_EMAIL ??
  "eleads-planet-motors-11061@app.autoraptor.com"

// ── Types ──────────────────────────────────────────────────────────────────

export interface AutoRaptorLeadPayload {
  /** Customer first name */
  firstName: string
  /** Customer last name */
  lastName: string
  /** Customer email address */
  email: string
  /** Customer phone (any format — AutoRaptor normalizes) */
  phone?: string
  /** Vehicle of interest */
  vehicle?: {
    year?: number
    make?: string
    model?: string
    trim?: string
    vin?: string
    stockNumber?: string
    price?: number
    condition?: "new" | "used" | "certified"
  }
  /** Free-form message / notes */
  comments?: string
  /** Lead source label shown in AutoRaptor */
  source?: string
  /** Request type shown in AutoRaptor */
  requestType?: "buy" | "sell" | "test-drive" | "finance" | "general"
}

export interface AutoRaptorResult {
  success: boolean
  /** HTTP status from AutoRaptor endpoint */
  status?: number
  /** Error message if failed */
  error?: string
}

// ── ADF/XML builder ────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/"/g, "&quot;")
    .replaceAll(/'/g, "&apos;")
}

function buildAdfXml(lead: AutoRaptorLeadPayload): string {
  const now = new Date()
  // ADF date format: YYYY-MM-DDThh:mm:ss+00:00
  const adfDate = now.toISOString().replace("Z", "+00:00").slice(0, 19) + "+00:00"

  const requestType = lead.requestType ?? "buy"
  const condition = lead.vehicle?.condition ?? "used"

  // Vehicle block (optional)
  const vehicleBlock = lead.vehicle
    ? `
    <vehicle interest="buy" status="${escapeXml(condition)}">
      ${lead.vehicle.year ? `<year>${lead.vehicle.year}</year>` : ""}
      ${lead.vehicle.make ? `<make>${escapeXml(lead.vehicle.make)}</make>` : ""}
      ${lead.vehicle.model ? `<model>${escapeXml(lead.vehicle.model)}</model>` : ""}
      ${lead.vehicle.trim ? `<trim>${escapeXml(lead.vehicle.trim)}</trim>` : ""}
      ${lead.vehicle.vin ? `<vin>${escapeXml(lead.vehicle.vin)}</vin>` : ""}
      ${lead.vehicle.stockNumber ? `<stock>${escapeXml(lead.vehicle.stockNumber)}</stock>` : ""}
      ${lead.vehicle.price ? `<price type="quote" currency="CAD">${lead.vehicle.price}</price>` : ""}
    </vehicle>`
    : ""

  // Phone block (optional)
  const phoneBlock = lead.phone
    ? `<phone type="voice" time="nopreference">${escapeXml(lead.phone)}</phone>`
    : ""

  // Comments block (optional)
  const commentsBlock = lead.comments
    ? `<comments>${escapeXml(lead.comments)}</comments>`
    : ""

  // Source label
  const sourceLabel = lead.source
    ? escapeXml(lead.source.replaceAll(/_/g, " ").replaceAll(/\b\w/g, c => c.toUpperCase()))
    : "Website"

  return `<?xml version="1.0" encoding="UTF-8"?>
<?adf version="1.0"?>
<adf>
  <prospect status="new">
    <id sequence="1" source="${escapeXml(DEALER_NAME)}">${escapeXml(DEALER_ID)}</id>
    <requestdate>${adfDate}</requestdate>
    <vehicle interest="${escapeXml(requestType)}" status="${escapeXml(condition)}">
      ${lead.vehicle?.year ? `<year>${lead.vehicle.year}</year>` : "<year></year>"}
      ${lead.vehicle?.make ? `<make>${escapeXml(lead.vehicle.make)}</make>` : "<make></make>"}
      ${lead.vehicle?.model ? `<model>${escapeXml(lead.vehicle.model)}</model>` : "<model></model>"}
      ${lead.vehicle?.trim ? `<trim>${escapeXml(lead.vehicle.trim)}</trim>` : ""}
      ${lead.vehicle?.vin ? `<vin>${escapeXml(lead.vehicle.vin)}</vin>` : ""}
      ${lead.vehicle?.stockNumber ? `<stock>${escapeXml(lead.vehicle.stockNumber)}</stock>` : ""}
      ${lead.vehicle?.price ? `<price type="quote" currency="CAD">${lead.vehicle.price}</price>` : ""}
    </vehicle>
    <customer>
      <contact primarycontact="1">
        <name part="first">${escapeXml(lead.firstName)}</name>
        <name part="last">${escapeXml(lead.lastName)}</name>
        <email>${escapeXml(lead.email)}</email>
        ${phoneBlock}
      </contact>
      ${commentsBlock}
    </customer>
    <vendor>
      <vendorname>${escapeXml(DEALER_NAME)}</vendorname>
      <contact primarycontact="1">
        <name part="full">${escapeXml(DEALER_NAME)}</name>
        <email>${escapeXml(DEALER_EMAIL)}</email>
      </contact>
    </vendor>
    <provider>
      <name part="full">Planet Motors Website</name>
      <service>${escapeXml(sourceLabel)}</service>
      <url>https://planetmotors.ca</url>
    </provider>
  </prospect>
</adf>`
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Sends a lead to AutoRaptor via ADF/XML HTTP POST.
 *
 * Non-throwing — always returns a result object. Log failures but
 * never let CRM errors block the customer-facing response.
 *
 * @example
 *   const result = await pushToAutoRaptor({
 *     firstName: "Sarah",
 *     lastName: "Chen",
 *     email: "sarah@example.com",
 *     phone: "416-555-0123",
 *     vehicle: { year: 2023, make: "Tesla", model: "Model 3", price: 49900 },
 *     source: "vdp_inquiry",
 *     requestType: "buy",
 *   })
 */
export async function pushToAutoRaptor(
  lead: AutoRaptorLeadPayload
): Promise<AutoRaptorResult> {
  try {
    const xml = buildAdfXml(lead)

    logger.info("AutoRaptor: sending ADF lead", {
      email: lead.email.replace(/(.{2}).+(@.+)/, "$1***$2"),
      vehicle: lead.vehicle
        ? `${lead.vehicle.year} ${lead.vehicle.make} ${lead.vehicle.model}`
        : "general",
      source: lead.source,
    })

    const response = await fetch(ELEAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=UTF-8",
        "User-Agent": "PlanetMotors/1.0",
      },
      body: xml,
      // 10 second timeout — don't block the lead pipeline
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      logger.error("AutoRaptor: HTTP error", {
        status: response.status,
        body: body.slice(0, 200),
      })
      return { success: false, status: response.status, error: `HTTP ${response.status}` }
    }

    logger.info("AutoRaptor: lead accepted", { status: response.status })
    return { success: true, status: response.status }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error("AutoRaptor: network error", { error: message })
    return { success: false, error: message }
  }
}

/**
 * Converts a LeadPayload (from lib/email/lead-notifier.ts) to AutoRaptorLeadPayload.
 * Use this in the CRM webhook route to avoid duplicating mapping logic.
 */
export function mapLeadToAutoRaptor(lead: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  source?: string
  message?: string
  vehicle?: {
    id?: string
    year?: number
    make?: string
    model?: string
    trim?: string
    price?: number
    vin?: string
    stockNumber?: string
  }
}): AutoRaptorLeadPayload {
  const source = lead.source ?? "website"
  const requestType: AutoRaptorLeadPayload["requestType"] =
    source.includes("finance") ? "finance"
    : source.includes("test_drive") ? "test-drive"
    : source.includes("trade") ? "sell"
    : "buy"

  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    requestType,
    comments: lead.message,
    vehicle: lead.vehicle
      ? {
          year: lead.vehicle.year,
          make: lead.vehicle.make,
          model: lead.vehicle.model,
          trim: lead.vehicle.trim,
          price: lead.vehicle.price,
          vin: lead.vehicle.vin,
          stockNumber: lead.vehicle.stockNumber,
          condition: "used",
        }
      : undefined,
  }
}
