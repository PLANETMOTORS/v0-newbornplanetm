import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.API_KEY_RESEND || process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { vehicleId, vehicleName, currentPrice, email, phone, notifyEmail, notifySms } = await req.json()

    if (!vehicleId || !email) {
      return NextResponse.json({ error: "Vehicle ID and email are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Save to database
    const { data: alert, error } = await supabase
      .from("price_alerts")
      .insert({
        vehicle_id: vehicleId,
        vehicle_name: vehicleName,
        current_price: currentPrice,
        customer_email: email,
        customer_phone: phone || null,
        notify_email: notifyEmail !== false,
        notify_sms: notifySms === true && !!phone,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    // Send confirmation email
    if (process.env.API_KEY_RESEND || process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || "Planet Motors <notifications@planetmotors.ca>",
        to: email,
        subject: `Price Alert Set - ${vehicleName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Price Alert Confirmed</h1>
            </div>
            <div style="padding: 20px; background: #f8fafc;">
              <p>Hi there!</p>
              <p>Your price drop alert has been set for:</p>
              <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-weight: bold;">${vehicleName}</p>
                <p style="margin: 8px 0 0; font-size: 24px; color: #7c3aed;">$${currentPrice.toLocaleString()}</p>
              </div>
              <p>We'll notify you via ${notifyEmail !== false ? "email" : ""}${notifyEmail !== false && notifySms ? " and " : ""}${notifySms ? "SMS" : ""} when the price drops.</p>
              <p style="color: #64748b; font-size: 14px;">Questions? Call us at (416) 270-9955</p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({
      success: true,
      alertId: alert.id,
      message: "Price drop alert set successfully",
    })
  } catch (error) {
    console.error("Price alert error:", error)
    return NextResponse.json({ error: "Failed to create price alert" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: alerts, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("customer_email", email)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Get alerts error:", error)
    return NextResponse.json({ error: "Failed to get alerts" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const alertId = searchParams.get("alertId")

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("price_alerts")
      .update({ status: "cancelled" })
      .eq("id", alertId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Price alert removed" })
  } catch (error) {
    console.error("Delete alert error:", error)
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 })
  }
}
