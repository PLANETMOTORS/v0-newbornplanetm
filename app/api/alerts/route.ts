import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { vehicleId, vehicleName, currentPrice, email, phone, notifyEmail, notifySms } = await req.json()

    // Validate required fields
    if (!vehicleId || !email) {
      return NextResponse.json(
        { error: "Vehicle ID and email are required" },
        { status: 400 }
      )
    }

    // Generate alert ID
    const alertId = `PA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // In production, this would:
    // 1. Save to database
    // 2. Set up webhook/cron job to check prices
    // 3. Send confirmation email

    const alert = {
      alertId,
      vehicleId,
      vehicleName,
      currentPrice,
      email,
      phone,
      preferences: {
        email: notifyEmail !== false,
        sms: notifySms === true && !!phone,
      },
      status: "active",
      createdAt: new Date().toISOString(),
    }

    console.log("[v0] Price drop alert created:", alert)

    return NextResponse.json({
      success: true,
      alertId,
      message: "Price drop alert set successfully",
      data: {
        vehicleName,
        currentPrice,
        notifications: alert.preferences,
      },
    })
  } catch (error) {
    console.error("Price alert error:", error)
    return NextResponse.json(
      { error: "Failed to create price alert" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const alertId = searchParams.get("alertId")

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 }
      )
    }

    // In production, delete from database
    console.log("[v0] Price drop alert deleted:", alertId)

    return NextResponse.json({
      success: true,
      message: "Price alert removed successfully",
    })
  } catch (error) {
    console.error("Delete alert error:", error)
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    )
  }
}
