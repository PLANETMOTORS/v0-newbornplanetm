/**
 * POST /api/v1/notify
 *
 * Simple inventory notification signup endpoint used by:
 * - EmptyInventoryState component (category pages with no vehicles)
 * - Homepage waitlist (if applicable)
 *
 * Accepts form submissions (application/x-www-form-urlencoded) or JSON.
 * Stores a record in price_alerts with notify_new_listings=true for the given category/topic.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { isEmailLike } from "@/lib/validation/email"
import { rateLimit } from "@/lib/redis"
import { validateOrigin } from "@/lib/csrf"
import { PHONE_LOCAL } from "@/lib/constants/dealership"

function getResendClient() {
  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    // CSRF check for form submissions
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Rate limit by IP
    const forwarded = request.headers.get("x-forwarded-for") || ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const limiter = await rateLimit(`notify:${ip}`, 10, 3600)
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Parse body - support both form data and JSON
    let email: string | null = null
    let topic: string | null = null

    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData()
      email = formData.get("email") as string | null
      topic = formData.get("topic") as string | null
    } else {
      const body = await request.json()
      email = body.email
      topic = body.topic
    }

    // Validate email
    if (!email || !isEmailLike(email)) {
      // For form submissions, redirect back with error
      if (contentType.includes("application/x-www-form-urlencoded")) {
        return NextResponse.redirect(
          new URL("/?notify_error=invalid_email", request.url),
          303
        )
      }
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Parse topic to extract make/model if it's a path like /cars/toyota or /cars/toyota-rav4
    let make: string | null = null
    let model: string | null = null
    if (topic) {
      const cleanTopic = topic.replace(/^\/cars\//, "")
      const parts = cleanTopic.split("-")
      if (parts.length >= 1) {
        make = parts[0] || null
      }
      if (parts.length >= 2) {
        model = parts.slice(1).join("-") || null
      }
    }

    // Check for existing alert with same email + make/model to avoid duplicates
    let existingQuery = supabase
      .from("price_alerts")
      .select("id")
      .eq("email", email)
      .eq("is_active", true)

    if (make) {
      existingQuery = existingQuery.eq("make", make)
    } else {
      existingQuery = existingQuery.is("make", null)
    }
    if (model) {
      existingQuery = existingQuery.eq("model", model)
    } else {
      existingQuery = existingQuery.is("model", null)
    }

    const { data: existing } = await existingQuery.maybeSingle()

    if (existing) {
      // Already subscribed - still success from user perspective
      if (contentType.includes("application/x-www-form-urlencoded")) {
        return NextResponse.redirect(
          new URL("/?notify_success=1", request.url),
          303
        )
      }
      return NextResponse.json({ success: true, message: "Already subscribed" })
    }

    // Insert new alert
    const { error: insertError } = await supabase.from("price_alerts").insert({
      email,
      make,
      model,
      notify_new_listings: true,
      notify_price_drops: false,
      is_active: true,
    })

    if (insertError) {
      console.error("Failed to save notification signup:", insertError)
      if (contentType.includes("application/x-www-form-urlencoded")) {
        return NextResponse.redirect(
          new URL("/?notify_error=failed", request.url),
          303
        )
      }
      return NextResponse.json({ error: "Failed to save signup" }, { status: 500 })
    }

    // Send confirmation email (non-blocking)
    const resendClient = getResendClient()
    if (resendClient) {
      const topicLabel = topic
        ? topic.replace(/^\/cars\//, "").replace(/-/g, " ")
        : "new inventory"

      resendClient.emails
        .send({
          from:
            process.env.FROM_EMAIL ||
            "Planet Motors <notifications@planetmotors.ca>",
          to: email,
          subject: "You're on the list!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">You're on the list!</h1>
              </div>
              <div style="padding: 20px; background: #f8fafc;">
                <p>We'll notify you as soon as matching vehicles hit the lot:</p>
                <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                  <p style="margin: 0; font-weight: bold; font-size: 18px; text-transform: capitalize;">${topicLabel}</p>
                </div>
                <p>Our inventory rotates fast — usually within a few weeks.</p>
                <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Planet Motors | ${PHONE_LOCAL}</p>
              </div>
            </div>
          `,
        })
        .catch((err) => console.error("Notify confirmation email failed:", err))
    }

    // For form submissions, redirect with success
    if (contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.redirect(new URL("/?notify_success=1", request.url), 303)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notify endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
