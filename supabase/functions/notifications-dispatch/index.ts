/**
 * supabase/functions/notifications-dispatch/index.ts
 * Week 3 — Notification Dispatcher (cron every 60s)
 *
 * Drains notifications_queue:
 *  1. Claims up to 50 queued rows (state='queued', scheduled_for <= now)
 *  2. Checks notification_suppressions (hard bounces, STOP, opt-outs)
 *  3. Checks notification_preferences (quiet hours, channel opt-ins)
 *  4. Fans out to Resend (email) and Twilio (SMS)
 *  5. Logs each attempt to notification_deliveries
 *  6. Dead-letters after 5 attempts
 *
 * Env vars required:
 *   RESEND_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *   TWILIO_FROM_NUMBER, RESEND_FROM_EMAIL
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? ""
const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? ""
const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? ""
const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER") ?? ""
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@planetmotors.ca"
const BATCH_SIZE = 50
const MAX_ATTEMPTS = 5

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

Deno.serve(async (req: Request) => {
  // Allow cron trigger (GET) or manual POST
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const now = new Date().toISOString()
  let processed = 0, failed = 0, suppressed = 0

  // 1. Claim batch
  const { data: batch } = await admin
    .from("notifications_queue")
    .select("*")
    .eq("state", "queued")
    .lte("scheduled_for", now)
    .lt("attempts", MAX_ATTEMPTS)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE)

  if (!batch || batch.length === 0) {
    return json({ processed: 0, message: "Queue empty" })
  }

  // Mark as sending
  const ids = batch.map((r: Record<string, unknown>) => r.id)
  await admin.from("notifications_queue")
    .update({ state: "sending", attempts: admin.rpc("increment_attempts") })
    .in("id", ids)

  for (const item of batch) {
    try {
      // 2. Load user email/phone
      const { data: authUser } = await admin.auth.admin.getUserById(item.user_id)
      if (!authUser?.user) { await markFailed(item.id, "User not found"); failed++; continue }

      const email = authUser.user.email
      const phone = authUser.user.phone

      // 3. Load preferences
      const { data: prefs } = await admin
        .from("notification_preferences")
        .select("*")
        .eq("user_id", item.user_id)
        .single()

      // 4. Check quiet hours
      const inQuietHours = checkQuietHours(prefs)

      // 5. Resolve template (simple inline templates — replace with Sanity fetch in prod)
      const { subject, emailBody, smsBody } = resolveTemplate(item.template, item.payload)

      // 6. Fan out per channel
      for (const channel of item.channels as string[]) {
        // Check suppression
        const address = channel === "email" ? email : phone
        if (!address) continue

        const { data: suppression } = await admin
          .from("notification_suppressions")
          .select("id")
          .eq("channel", channel)
          .eq("address", address)
          .single()

        if (suppression) {
          await logDelivery(item.id, channel, "suppressed", null, null, null, "suppressed", "suppression_list")
          suppressed++
          continue
        }

        // Check prefs
        const categoryKey = templateToCategory(item.template)
        const prefEnabled = prefs?.[categoryKey]?.[channel] ?? true
        if (!prefEnabled || (inQuietHours && channel !== "email")) {
          await logDelivery(item.id, channel, "suppressed", null, null, null, "suppressed", inQuietHours ? "quiet_hours" : "preference_disabled")
          suppressed++
          continue
        }

        // Send
        if (channel === "email" && email) {
          const msgId = await sendEmail(email, subject, emailBody)
          await logDelivery(item.id, "email", "sent", "resend", msgId, subject, "sent", null)
        } else if (channel === "sms" && phone) {
          const msgId = await sendSms(phone, smsBody)
          await logDelivery(item.id, "sms", "sent", "twilio", msgId, null, "sent", null)
        }
      }

      await admin.from("notifications_queue").update({ state: "sent" }).eq("id", item.id)
      processed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await markFailed(item.id, msg)
      failed++
    }
  }

  return json({ processed, failed, suppressed, batch_size: batch.length })
})

// ── Template resolver (inline — swap for Sanity fetch in Week 6) ──────────
function resolveTemplate(template: string, payload: Record<string, unknown>) {
  const vin = payload.vin ?? "your vehicle"
  const stage = payload.to_stage ?? template.split(".")[1] ?? ""
  const staff = payload.staff_name ?? "our team"

  const stageLabels: Record<string, string> = {
    application: "Application Received",
    approved: "Financing Approved! 🎉",
    deposit_paid: "Deposit Confirmed",
    contracted: "Contract Ready",
    funded: "Funded — Almost There!",
    delivered: "Vehicle Delivered 🚗",
    closed: "Deal Complete",
    deposit_paid_stripe: "Deposit Confirmed",
  }

  const label = stageLabels[stage] ?? stage

  return {
    subject: `Planet Motors: ${label}`,
    emailBody: `<p>Hi there,</p><p>Great news — your deal for <strong>${vin}</strong> has moved to: <strong>${label}</strong>.</p><p>${staff} is handling your file. We'll be in touch shortly.</p><p>View your deal status at <a href="https://planetmotors.ca/garage">planetmotors.ca/garage</a></p><p>— The Planet Motors Team</p>`,
    smsBody: `Planet Motors: ${label} for ${vin}. Check your Garage: planetmotors.ca/garage`,
  }
}

function templateToCategory(template: string): string {
  if (template.startsWith("deal.")) return "deal_updates"
  if (template.startsWith("finance.")) return "finance_updates"
  if (template.startsWith("delivery.")) return "delivery_updates"
  if (template.startsWith("saved_vehicle.")) return "saved_vehicle"
  if (template.startsWith("aviloo.")) return "aviloo_recheck"
  return "deal_updates"
}

function checkQuietHours(prefs: Record<string, unknown> | null): boolean {
  if (!prefs) return false
  const now = new Date()
  const hour = now.getHours()
  const start = parseInt((prefs.quiet_hours_start as string ?? "21:00").split(":")[0])
  const end = parseInt((prefs.quiet_hours_end as string ?? "08:00").split(":")[0])
  if (start > end) return hour >= start || hour < end
  return hour >= start && hour < end
}

// ── Resend email ──────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_API_KEY) return null
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  })
  const data = await res.json()
  return data.id ?? null
}

// ── Twilio SMS ────────────────────────────────────────────────────────────
async function sendSms(to: string, body: string): Promise<string | null> {
  if (!TWILIO_SID || !TWILIO_TOKEN) return null
  const params = new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
  const data = await res.json()
  return data.sid ?? null
}

// ── DB helpers ────────────────────────────────────────────────────────────
async function logDelivery(
  queueId: string, channel: string, state: string,
  provider: string | null, providerId: string | null,
  subject: string | null, deliveryState: string, suppressionReason: string | null
) {
  await admin.from("notification_deliveries").insert({
    queue_id: queueId,
    channel,
    provider: provider ?? "internal",
    provider_message_id: providerId,
    state: deliveryState,
    rendered_subject: subject,
    sent_at: state === "sent" ? new Date().toISOString() : null,
    suppression_reason: suppressionReason,
  })
}

async function markFailed(id: string, error: string) {
  await admin.from("notifications_queue")
    .update({ state: "failed", last_error: error.slice(0, 500) })
    .eq("id", id)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" }
  })
}
