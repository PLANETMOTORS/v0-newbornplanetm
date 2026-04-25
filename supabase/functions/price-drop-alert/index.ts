import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders, handleCorsPreFlight } from "../_shared/cors.ts"
import { createLogger } from "../_shared/logger.ts"

const log = createLogger("price-drop-alert")

/**
 * POST /functions/v1/price-drop-alert
 *
 * Invoked by the DB trigger (via pg_net or Database Webhook) when a
 * vehicle's price decreases. Queries interested users from leads,
 * finance_applications, and vehicle_page_views (with auth join),
 * then sends price-drop emails via Resend.
 *
 * Dedup: skips recipients who were already notified for the same
 * vehicle within the last 7 days (via price_drop_notifications table).
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
 *          FROM_EMAIL, SITE_URL
 */

interface PriceDropPayload {
  vehicle_id: string
  old_price: number
  new_price: number
  year: number
  make: string
  model: string
  trim: string
  stock_number: string
  primary_image_url: string
}

/**
 * Format an amount given in cents as a dollar string.
 *
 * @param cents - Amount in cents
 * @returns A `$`-prefixed string representing the amount in dollars formatted with grouping and no decimal digits (e.g., `$1,999`)
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/**
 * Escapes characters that have special meaning in HTML to their corresponding entities.
 *
 * @param str - The input text to escape for safe inclusion in HTML content or attributes
 * @returns The input string with `&`, `<`, `>`, and `"` replaced by `&amp;`, `&lt;`, `&gt;`, and `&quot;` respectively
 */
function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
}

/**
 * Builds the complete HTML document for a price-drop notification email for a vehicle.
 *
 * @param vehicle - Vehicle data (identifiers, descriptive fields, and pricing) used to populate the email content
 * @param siteUrl - Base site URL used to build the vehicle detail link and fallback image URL
 * @returns The full HTML document as a string suitable for sending as an email body
 */
function buildEmailHtml(vehicle: PriceDropPayload, siteUrl: string): string {
  const trimSuffix = vehicle.trim ? ` ${vehicle.trim}` : ""
  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}${trimSuffix}`
  const savings = vehicle.old_price - vehicle.new_price
  const vdpUrl = `${siteUrl}/vehicles/${vehicle.vehicle_id}`
  const imageUrl = vehicle.primary_image_url || `${siteUrl}/placeholder-vehicle.png`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#1e40af;padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">Planet Motors</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:14px;">Price Drop Alert</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Great news! A vehicle you were interested in just dropped in price.</p>
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(vehicleTitle)}" style="width:100%;max-width:560px;border-radius:8px;margin:0 0 16px;" />` : ""}
      <h2 style="color:#111827;margin:0 0 8px;font-size:20px;">${escapeHtml(vehicleTitle)}</h2>
      <div style="display:flex;align-items:center;gap:12px;margin:0 0 8px;">
        <span style="color:#dc2626;text-decoration:line-through;font-size:16px;">${formatPrice(vehicle.old_price)}</span>
        <span style="color:#16a34a;font-size:24px;font-weight:bold;">${formatPrice(vehicle.new_price)}</span>
      </div>
      <p style="background:#dcfce7;color:#166534;padding:8px 12px;border-radius:6px;font-size:14px;display:inline-block;margin:0 0 24px;">
        You save ${formatPrice(savings)}!
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(vdpUrl)}" style="background:#1e40af;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
          View Updated Price
        </a>
      </div>
      <p style="color:#6b7280;font-size:12px;margin:24px 0 0;text-align:center;">
        Stock #${escapeHtml(vehicle.stock_number)} &bull; This alert was sent because you previously viewed or inquired about this vehicle on planetmotors.ca
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        Planet Motors &bull; Richmond Hill, ON &bull;
        <a href="${escapeHtml(siteUrl)}" style="color:#6b7280;">planetmotors.ca</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsPreFlight(req)

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    })
  }

  // Verify service role authorization (this endpoint is internal-only)
  const authHeader = req.headers.get("authorization")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    log.warn("Unauthorized call attempt")
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  let payload: PriceDropPayload
  try {
    payload = await req.json() as PriceDropPayload
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON" }),
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  if (!payload.vehicle_id || typeof payload.old_price !== "number" || typeof payload.new_price !== "number") {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  log.info("Price drop detected", {
    vehicleId: payload.vehicle_id,
    oldPrice: payload.old_price,
    newPrice: payload.new_price,
    drop: payload.old_price - payload.new_price,
  })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  // ── Collect interested users ───────────────────────────────────────

  const emailSet = new Set<string>()

  // 1. Leads with this vehicle_id (last 30 days)
  const { data: leads } = await adminClient
    .from("leads")
    .select("customer_email")
    .eq("vehicle_id", payload.vehicle_id)
    .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString())
    .not("customer_email", "is", null)

  if (leads) {
    for (const lead of leads) {
      if (lead.customer_email) emailSet.add(lead.customer_email.toLowerCase())
    }
  }

  // 2. Finance applications for this vehicle (last 30 days)
  const { data: finApps } = await adminClient
    .from("finance_applications")
    .select("email")
    .eq("vehicle_id", payload.vehicle_id)
    .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString())
    .not("email", "is", null)

  if (finApps) {
    for (const app of finApps) {
      if (app.email) emailSet.add(app.email.toLowerCase())
    }
  }

  // 3. Reservations for this vehicle (cancelled/expired — they might come back)
  const { data: reservations } = await adminClient
    .from("reservations")
    .select("customer_email")
    .eq("vehicle_id", payload.vehicle_id)
    .in("status", ["cancelled", "expired"])
    .not("customer_email", "is", null)

  if (reservations) {
    for (const res of reservations) {
      if (res.customer_email) emailSet.add(res.customer_email.toLowerCase())
    }
  }

  log.info("Interested users found", { count: emailSet.size })

  if (emailSet.size === 0) {
    return new Response(
      JSON.stringify({ success: true, data: { notified: 0, message: "No interested users found" } }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  // ── Dedup: filter out recently notified ────────────────────────────

  const oneWeekAgo = new Date(Date.now() - 7 * 86400_000).toISOString()
  const { data: recentNotifications } = await adminClient
    .from("price_drop_notifications")
    .select("recipient_email")
    .eq("vehicle_id", payload.vehicle_id)
    .gte("notified_at", oneWeekAgo)

  const recentlyNotified = new Set(
    (recentNotifications || []).map((n: { recipient_email: string }) => n.recipient_email.toLowerCase())
  )

  const eligibleEmails = [...emailSet].filter((e) => !recentlyNotified.has(e))

  log.info("After dedup", {
    total: emailSet.size,
    alreadyNotified: recentlyNotified.size,
    eligible: eligibleEmails.length,
  })

  if (eligibleEmails.length === 0) {
    return new Response(
      JSON.stringify({ success: true, data: { notified: 0, message: "All users already notified this week" } }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  // ── Send emails via Resend ─────────────────────────────────────────

  const resendApiKey = Deno.env.get("RESEND_API_KEY")
  if (!resendApiKey) {
    log.error("RESEND_API_KEY not configured")
    return new Response(
      JSON.stringify({ success: false, error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    )
  }

  const fromEmail = Deno.env.get("FROM_EMAIL") || "Planet Motors <notifications@planetmotors.ca>"
  const siteUrl = Deno.env.get("SITE_URL") || "https://planetmotors.ca"
  const payloadTrimSuffix = payload.trim ? ` ${payload.trim}` : ""
  const vehicleTitle = `${payload.year} ${payload.make} ${payload.model}${payloadTrimSuffix}`
  const savings = payload.old_price - payload.new_price
  const subject = `Price Drop: ${vehicleTitle} — Save ${formatPrice(savings)}!`
  const html = buildEmailHtml(payload, siteUrl)

  let sentCount = 0
  const errors: string[] = []

  for (const email of eligibleEmails) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: fromEmail, to: [email], subject, html }),
      })

      if (res.ok) {
        // Record notification for dedup
        const { error: dedupError } = await adminClient.from("price_drop_notifications").insert({
          vehicle_id: payload.vehicle_id,
          recipient_email: email,
          old_price: payload.old_price,
          new_price: payload.new_price,
        })
        if (dedupError) {
          log.warn("Dedup insert failed", { vehicleId: payload.vehicle_id, error: dedupError.message })
        }
        sentCount++
        // Use indexOf-based masking to avoid ReDoS on pathological email strings (S2631).
        const atI = email.indexOf('@')
        const recipientHash = atI > 0 ? `${email[0]}***${email.slice(atI)}` : '***'
        log.info("Email sent", { recipientHash })
      } else {
        const text = await res.text().catch(() => "")
        errors.push(`${res.status}: ${text.slice(0, 100)}`)
        log.warn("Resend failed", { status: res.status })
      }
    } catch (err) {
      errors.push(String(err))
      log.error("Email send error", { error: String(err) })
    }
  }

  log.info("Price drop alerts complete", {
    vehicleId: payload.vehicle_id,
    sent: sentCount,
    failed: errors.length,
  })

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        notified: sentCount,
        failed: errors.length,
        message: `Sent ${sentCount} price drop alert(s)`,
      },
    }),
    { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
  )
})
