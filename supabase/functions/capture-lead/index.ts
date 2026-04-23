// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders, handleCorsPreFlight } from "../_shared/cors.ts"
import { createLogger } from "../_shared/logger.ts"
import { validateCaptureLeadInput } from "../_shared/validate.ts"

const log = createLogger("capture-lead")

/**
 * POST /functions/v1/capture-lead
 *
 * Captures a financing lead to the DB and fires ADF XML to AutoRaptor.
 * Runs BEFORE authentication — the user has not yet clicked the magic link.
 *
 * Secrets required (set via `supabase secrets set`):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   AUTORAPTOR_ADF_ENDPOINT, AUTORAPTOR_DEALER_ID, AUTORAPTOR_DEALER_NAME,
 *   RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL
 */

// ── Rate-limit bookkeeping (in-memory, per-isolate) ──────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 3600_000 // 1 hour

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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

interface AdfParams {
  customerName: string
  email: string
  phone: string
  annualIncome: number
  requestedAmount: number
  requestedTerm: number
  leadId?: string
}

function buildAdfXml(params: AdfParams, dealerName: string): string {
  const [firstName, ...lastParts] = params.customerName.split(" ")
  const lastName = lastParts.join(" ") || ""
  const now = new Date().toISOString()
  const sourceId = params.leadId || `fin-${Date.now()}`

  return `<?xml version="1.0" encoding="UTF-8"?>
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

// ── Admin notification email via Resend ──────────────────────────────
async function sendAdminNotification(params: AdfParams): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY")
  if (!apiKey) return

  const adminEmail = Deno.env.get("ADMIN_EMAIL") || "toni@planetmotors.ca"
  const fromEmail = Deno.env.get("FROM_EMAIL") || "Planet Motors <notifications@planetmotors.ca>"

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
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromEmail, to: [adminEmail], subject: `New Finance Lead - ${params.customerName}`, html }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    log.warn("Resend email failed", { status: res.status, body: text.slice(0, 200) })
  }
}

// ── Main handler ─────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsPreFlight(req)

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    })
  }

  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!checkRateLimit(ip)) {
    log.warn("Rate limited", { ip })
    return new Response(
      JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  const validation = validateCaptureLeadInput(body)
  if ("error" in validation) {
    return new Response(
      JSON.stringify({ success: false, error: validation.error }),
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  const { data } = validation
  const customerName = `${data.firstName} ${data.lastName}`

  log.info("Lead capture started", { emailHash: data.email.replace(/^(.)(.*)(@.*)$/, "$1***$3"), amount: data.requestedAmount })

  try {
    // Initialize Supabase admin client using secrets
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // 1. Insert lead into the `leads` table
    const { data: lead, error: leadError } = await adminClient
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
      .single()

    if (leadError) {
      log.error("Lead insert failed", { error: leadError.message })
    } else {
      log.info("Lead inserted", { leadId: lead?.id })
    }

    // 2. Fire ADF XML to AutoRaptor (fire-and-forget)
    const adfParams: AdfParams = {
      customerName,
      email: data.email,
      phone: data.phone,
      annualIncome: data.annualIncome,
      requestedAmount: data.requestedAmount,
      requestedTerm: data.requestedTerm,
      leadId: (lead as any)?.id,
    }

    const adfEndpoint = Deno.env.get("AUTORAPTOR_ADF_ENDPOINT")
    if (adfEndpoint) {
      const dealerId = Deno.env.get("AUTORAPTOR_DEALER_ID")
      const dealerName = Deno.env.get("AUTORAPTOR_DEALER_NAME") || "Planet Motors"
      const adfXml = buildAdfXml(adfParams, dealerName)

      log.info("Firing AutoRaptor ADF")

      fetch(adfEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          ...(dealerId ? { "X-Dealer-ID": dealerId } : {}),
        },
        body: adfXml,
        signal: AbortSignal.timeout(10_000),
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "")
            log.error("AutoRaptor ADF failed", { status: res.status, body: text.slice(0, 200) })
          } else {
            log.info("AutoRaptor ADF sent successfully")
          }
        })
        .catch((err) => log.error("AutoRaptor ADF error", { error: String(err) }))
    }

    // 3. Admin notification (fire-and-forget)
    sendAdminNotification(adfParams).catch((err) =>
      log.error("Admin notification error", { error: String(err) })
    )

    log.info("Lead capture completed", { leadId: (lead as any)?.id ?? null })

    return new Response(
      JSON.stringify({
        success: true,
        data: { leadId: (lead as any)?.id ?? null, message: "Lead captured successfully" },
      }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  } catch (err) {
    log.error("Unhandled error", { error: String(err) })
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }
})
