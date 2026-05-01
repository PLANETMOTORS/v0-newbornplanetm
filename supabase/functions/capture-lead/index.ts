import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders, handleCorsPreFlight } from "../_shared/cors.ts"
import { createLogger } from "../_shared/logger.ts"
import {
  validateCaptureLeadInput,
  maskEmail,
  type CaptureLeadInput,
} from "../_shared/validate.ts"

const log = createLogger("capture-lead")

/**
 * POST /functions/v1/capture-lead
 *
 * Captures a financing lead to the DB and fires ADF XML to AutoRaptor.
 * Runs BEFORE authentication — the user has not yet clicked the magic link.
 *
 * Behaviour rules
 * ───────────────
 *  1. CORS pre-flight is mirrored back, POST-only.
 *  2. Rate-limit: 5 submissions / hour / IP (in-memory, per-isolate).
 *  3. Body is hand-validated (Deno isolate, no Zod).
 *  4. **Fail-loud on persist:** if the row cannot be written we return
 *     HTTP 500 with code `LEAD_PERSIST_FAILED` and a customer-readable
 *     retry message. Critically, the admin notification email and the
 *     ADF/AutoRaptor forward are NOT fired when the row failed —
 *     emailing about a non-existent lead is the exact split-brain that
 *     lost two real customer leads on 2026-04-30.
 *  5. Side-effects (email + ADF) are fire-and-forget; their failures
 *     log via `createLogger` and never block the customer-facing 200.
 *
 * Secrets required (set via `supabase secrets set`):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   AUTORAPTOR_ADF_ENDPOINT, AUTORAPTOR_DEALER_ID, AUTORAPTOR_DEALER_NAME,
 *   RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL
 */

// ── Constants ────────────────────────────────────────────────────────
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const PERSIST_ERROR_CODE = "LEAD_PERSIST_FAILED"
const RETRY_PHONE = "(416) 555-0100"
const ADF_TIMEOUT_MS = 10_000

// ── Rate-limit bookkeeping (in-memory, per-isolate) ──────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── ADF XML builder ──────────────────────────────────────────────────
function escapeXml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;")
}

interface AdfParams {
  customerName: string
  email: string
  phone: string
  annualIncome: number
  requestedAmount: number
  requestedTerm: number
  leadId: string
}

function buildAdfXml(params: AdfParams, dealerName: string): string {
  const [firstName, ...lastParts] = params.customerName.split(" ")
  const lastName = lastParts.join(" ") || ""
  const now = new Date().toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<?adf version="1.0"?>
<adf>
  <prospect status="new">
    <id sequence="1" source="planetmotors.ca">${escapeXml(params.leadId)}</id>
    <requestdate>${escapeXml(now)}</requestdate>
    <customer>
      <contact>
        <name part="first">${escapeXml(firstName)}</name>
        <name part="last">${escapeXml(lastName)}</name>
        <email>${escapeXml(params.email)}</email>
        <phone type="voice">${escapeXml(params.phone)}</phone>
      </contact>
      <comments>${escapeXml(
        `Finance pre-approval request. Annual income: $${params.annualIncome.toLocaleString()}. ` +
        `Requested: $${params.requestedAmount.toLocaleString()} over ${params.requestedTerm} months. ` +
        `Source: planetmotors.ca magic link flow.`
      )}</comments>
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
}

async function fireAdf(params: AdfParams): Promise<void> {
  const endpoint = Deno.env.get("AUTORAPTOR_ADF_ENDPOINT")
  if (!endpoint) return
  const dealerId = Deno.env.get("AUTORAPTOR_DEALER_ID")
  const dealerName = Deno.env.get("AUTORAPTOR_DEALER_NAME") ?? "Planet Motors"
  const xml = buildAdfXml(params, dealerName)

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        ...(dealerId ? { "X-Dealer-ID": dealerId } : {}),
      },
      body: xml,
      signal: AbortSignal.timeout(ADF_TIMEOUT_MS),
    })
    if (res.ok) {
      log.info("AutoRaptor ADF sent", { leadId: params.leadId })
      return
    }
    const text = await res.text().catch(() => "")
    log.error("AutoRaptor ADF failed", {
      leadId: params.leadId,
      status: res.status,
      body: text.slice(0, 200),
    })
  } catch (cause) {
    log.error("AutoRaptor ADF error", {
      leadId: params.leadId,
      error: cause instanceof Error ? cause.message : String(cause),
    })
  }
}

// ── Admin notification email via Resend ──────────────────────────────
async function sendAdminNotification(params: AdfParams): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY")
  if (!apiKey) return

  const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "toni@planetmotors.ca"
  const fromEmail =
    Deno.env.get("FROM_EMAIL") ??
    "Planet Motors <notifications@planetmotors.ca>"

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1e40af;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;">Planet Motors</h1>
        <p style="margin:5px 0 0;">New Finance Lead (Edge Function)</p>
      </div>
      <div style="padding:20px;background:#f8fafc;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Name:</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeXml(params.customerName)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Email:</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeXml(params.email)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Phone:</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${escapeXml(params.phone)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Income:</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">$${params.annualIncome.toLocaleString()}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Amount:</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">$${params.requestedAmount.toLocaleString()}</td></tr>
          <tr><td style="padding:8px;"><strong>Term:</strong></td><td style="padding:8px;">${params.requestedTerm} months</td></tr>
        </table>
      </div>
    </div>`

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [adminEmail],
      subject: `New Finance Lead - ${params.customerName}`,
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    log.warn("Resend email failed", {
      leadId: params.leadId,
      status: res.status,
      body: text.slice(0, 200),
    })
  }
}

// ── Persist + helpers ────────────────────────────────────────────────
function jsonResponse(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  })
}

interface PersistedLead {
  id: string
}

async function persistLead(
  data: CaptureLeadInput,
  customerName: string,
): Promise<PersistedLead | { error: string; code?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Supabase service-role secrets not configured" }
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: row, error } = await adminClient
      .from("leads")
      .insert({
        source: "finance_app",
        status: "new",
        priority: "high",
        customer_name: customerName,
        customer_email: data.email,
        customer_phone: data.phone,
        subject: `Finance Pre-Approval: $${data.requestedAmount.toLocaleString()} over ${data.requestedTerm} months`,
        message: `Annual income: $${data.annualIncome.toLocaleString()}\nRequested amount: $${data.requestedAmount.toLocaleString()}\nTerm: ${data.requestedTerm} months`,
      })
      .select("id")
      .single<{ id: string }>()
    if (error) return { error: error.message, code: error.code }
    if (!row?.id) return { error: "insert returned no row id" }
    return { id: row.id }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : "insert threw" }
  }
}

// ── Main handler ─────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsPreFlight(req)

  if (req.method !== "POST") {
    return jsonResponse(req, 405, {
      success: false,
      error: "Method not allowed",
    })
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!checkRateLimit(ip)) {
    log.warn("Rate limited", { ip })
    return jsonResponse(req, 429, {
      success: false,
      error: "Too many requests. Please try again later.",
    })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return jsonResponse(req, 400, {
      success: false,
      error: "Invalid JSON body",
    })
  }

  const validation = validateCaptureLeadInput(body)
  if ("error" in validation) {
    return jsonResponse(req, 400, {
      success: false,
      error: validation.error,
    })
  }

  const { data } = validation
  const customerName = `${data.firstName} ${data.lastName}`

  log.info("Lead capture started", {
    emailHash: maskEmail(data.email),
    amount: data.requestedAmount,
  })

  const persisted = await persistLead(data, customerName)
  if ("error" in persisted) {
    log.error("Lead persist failed", {
      ip,
      error: persisted.error,
      code: persisted.code,
    })
    return jsonResponse(req, 500, {
      success: false,
      error: {
        code: PERSIST_ERROR_CODE,
        message: `We received your information but couldn't save it. Please try again or call ${RETRY_PHONE}.`,
      },
    })
  }

  // Lead persisted — safe to fan out side-effects.
  const adfParams: AdfParams = {
    customerName,
    email: data.email,
    phone: data.phone,
    annualIncome: data.annualIncome,
    requestedAmount: data.requestedAmount,
    requestedTerm: data.requestedTerm,
    leadId: persisted.id,
  }

  fireAdf(adfParams).catch((cause) =>
    log.error("AutoRaptor ADF fire-and-forget error", {
      leadId: persisted.id,
      error: cause instanceof Error ? cause.message : String(cause),
    }),
  )

  sendAdminNotification(adfParams).catch((cause) =>
    log.error("Admin notification error", {
      leadId: persisted.id,
      error: cause instanceof Error ? cause.message : String(cause),
    }),
  )

  log.info("Lead capture completed", { leadId: persisted.id })

  return jsonResponse(req, 200, {
    success: true,
    data: {
      leadId: persisted.id,
      message: "Lead captured successfully",
    },
  })
})
