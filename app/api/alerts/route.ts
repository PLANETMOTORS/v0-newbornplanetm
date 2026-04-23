import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { PHONE_LOCAL } from "@/lib/constants/dealership"

function getResendClient() {
  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function POST(req: Request) {
  try {
    const { vehicleId, vehicleName, currentPrice, email, make, model, maxPrice, preferences } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Parse make/model from vehicleName if not provided directly
    let parsedMake = make
    let parsedModel = model
    if (!parsedMake && vehicleName) {
      const [m, ...modelParts] = vehicleName.split(" ")
      parsedMake = m
      parsedModel = modelParts.join(" ")
    }

    const supabase = await createClient()

    const { data: alert, error } = await supabase
      .from("price_alerts")
      .insert({
        email,
        vehicle_id: vehicleId || null,
        make: parsedMake || null,
        model: parsedModel || null,
        max_price: maxPrice || currentPrice || null,
        notify_price_drops: preferences?.priceDrops ?? true,
        notify_new_listings: preferences?.newListings ?? true,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    // Send confirmation email (non-blocking - alert is saved regardless)
    const resendClient = getResendClient()
    let emailSent = false
    let emailErrorMessage: string | null = null

    if (resendClient) {
      try {
        await resendClient.emails.send({
          from: process.env.FROM_EMAIL || "Planet Motors <notifications@planetmotors.ca>",
          to: email,
          subject: `Price Alert Set - ${vehicleName || "Vehicle"}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Price Alert Active</h1>
              </div>
              <div style="padding: 20px; background: #f8fafc;">
                <p>Your price drop alert is now active for:</p>
                <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                  <p style="margin: 0; font-weight: bold; font-size: 18px;">${vehicleName || "Selected Vehicle"}</p>
                  ${currentPrice ? `<p style="margin: 8px 0 0; font-size: 24px; color: #7c3aed;">$${Number(currentPrice).toLocaleString()}</p>` : ""}
                </div>
                <p>We'll email you when the price drops.</p>
                <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Planet Motors | ${PHONE_LOCAL}</p>
              </div>
            </div>
          `,
        })
        emailSent = true
      } catch (emailError) {
        // Log but don't fail - alert is already saved
        console.error("Email send failed (alert still saved):", emailError)
        emailErrorMessage = emailError instanceof Error ? emailError.message : "Unknown email error"
      }
    }

    return NextResponse.json({
      success: true,
      alertId: alert.id,
      email: {
        sent: emailSent,
        error: emailErrorMessage,
      },
    })
  } catch (error) {
    console.error("Price alert error:", error)
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    // Require authentication to prevent email enumeration (PIPEDA compliance)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email") || user.email

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Users can only view their own alerts
    if (email !== user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: alerts, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Get alerts error:", error)
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()

    // Require authentication to prevent unauthorized deletion
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const alertId = searchParams.get("alertId")
    const email = searchParams.get("email") || user.email

    if (!alertId || !email) {
      return NextResponse.json({ error: "Alert ID and email required" }, { status: 400 })
    }

    // Users can only delete their own alerts
    if (email !== user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only delete if alertId matches the email (ownership check)
    const { data, error } = await supabase
      .from("price_alerts")
      .update({ is_active: false })
      .eq("id", alertId)
      .eq("email", email)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Alert not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete alert error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
