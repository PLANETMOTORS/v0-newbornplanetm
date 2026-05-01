/**
 * POST /api/v1/newsletter
 *
 * Newsletter signup endpoint — used by the footer "Get deals in your inbox" form.
 *
 * Flow:
 *  1. Validate email + rate-limit
 *  2. Insert into `leads` table with source "newsletter"
 *  3. Send confirmation email to subscriber via Resend
 *  4. Send internal alert to toni@planetmotors.ca
 *  5. Forward ADF XML to AutoRaptor CRM
 */

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"
import { isEmailLike } from "@/lib/validation/email"
import { escapeHtml } from "@/lib/email"
import { rateLimit } from "@/lib/redis"
import { validateOrigin } from "@/lib/csrf"
import { forwardLeadToAutoRaptor } from "@/lib/adf/forwarder"
import type { ADFProspect } from "@/lib/adf/types"
import {
  PHONE_LOCAL,
  PHONE_TOLL_FREE,
} from "@/lib/constants/dealership"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "toni@planetmotors.ca"
const FROM_EMAIL =
  process.env.FROM_EMAIL ?? "Planet Motors <notifications@planetmotors.ca>"

function getResendClient(): Resend | null {
  const apiKey = process.env.API_KEY_RESEND ?? process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function subscriberConfirmationHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1e3a8a;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">You're subscribed!</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            Thanks for signing up — you'll now receive the latest deals, new inventory alerts, and tips from Planet Motors.
          </p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
            We respect your inbox and only send updates that matter.
          </p>
          <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:#64748b;font-size:13px;">Subscribed as: <strong style="color:#0f172a;">${escapeHtml(email)}</strong></p>
          </div>
          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
            Planet Motors | ${PHONE_LOCAL} | ${PHONE_TOLL_FREE}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function adminNotificationHtml(email: string): string {
  const now = new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" })
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:20px 32px;">
          <h2 style="margin:0;color:#ffffff;font-size:18px;">New Newsletter Subscriber</h2>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td style="color:#64748b;font-size:13px;width:100px;">Email</td>
              <td style="color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(email)}</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Source</td>
              <td style="color:#0f172a;font-size:14px;">Footer Subscribe Form</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Time</td>
              <td style="color:#0f172a;font-size:14px;">${now}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const forwarded = request.headers.get("x-forwarded-for") ?? ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const limiter = await rateLimit(`newsletter:${ip}`, 5, 3600)
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email || !isEmailLike(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Insert into leads table (integrates with admin portal)
    const adminClient = createAdminClient()

    // Check for duplicate
    const { data: existing } = await adminClient
      .from("leads")
      .select("id")
      .eq("customer_email", email)
      .eq("source", "newsletter")
      .eq("status", "new")
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, message: "Already subscribed" })
    }

    const { error: insertError } = await adminClient.from("leads").insert({
      source: "newsletter",
      status: "new",
      priority: "low",
      customer_name: email.split("@")[0],
      customer_email: email,
      customer_phone: null,
      subject: "Newsletter Subscription",
      message: "Subscribed via footer form",
    })

    if (insertError) {
      console.error("Newsletter lead insert error:", insertError)
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
    }

    // Fire-and-forget: confirmation email, admin notification, ADF to AutoRaptor
    const resend = getResendClient()
    if (resend) {
      // Subscriber confirmation
      resend.emails
        .send({
          from: FROM_EMAIL,
          to: email,
          subject: "You're subscribed to Planet Motors!",
          html: subscriberConfirmationHtml(email),
        })
        .catch((err) => console.error("Newsletter confirmation email failed:", err))

      // Admin notification
      resend.emails
        .send({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `New Newsletter Subscriber: ${email}`,
          html: adminNotificationHtml(email),
        })
        .catch((err) => console.error("Newsletter admin notification failed:", err))
    }

    // ADF to AutoRaptor CRM
    const prospect: ADFProspect = {
      id: `newsletter-${Date.now()}`,
      requestDate: new Date().toISOString(),
      source: "Newsletter Signup",
      customer: { email },
      comments: "Newsletter subscription from website footer form.",
    }
    forwardLeadToAutoRaptor(prospect).catch((err) =>
      console.error("Newsletter ADF forward failed:", err),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Newsletter endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
