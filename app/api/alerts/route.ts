import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.API_KEY_RESEND || process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { vehicleId, vehicleName, currentPrice, email, phone } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Parse make/model from vehicleName
    const [make, ...modelParts] = (vehicleName || "").split(" ")
    const model = modelParts.join(" ")

    const supabase = await createClient()

    const { data: alert, error } = await supabase
      .from("price_alerts")
      .insert({
        email,
        vehicle_id: vehicleId || null,
        make: make || null,
        model: model || null,
        max_price: currentPrice || null,
        notify_price_drops: true,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    // Send confirmation email
    if (process.env.API_KEY_RESEND || process.env.RESEND_API_KEY) {
      await resend.emails.send({
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
              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Planet Motors | (416) 270-9955</p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true, alertId: alert.id })
  } catch (error) {
    console.error("Price alert error:", error)
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const supabase = await createClient()
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
    const { searchParams } = new URL(req.url)
    const alertId = searchParams.get("alertId")

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("price_alerts")
      .update({ is_active: false })
      .eq("id", alertId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete alert error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
