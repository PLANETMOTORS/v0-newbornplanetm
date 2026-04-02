import { NextResponse } from "next/server"
import { sendNotificationEmail } from "@/lib/email"

export async function GET() {
  console.log("[v0] Test email API called")
  console.log("[v0] API_KEY_RESEND exists:", !!process.env.API_KEY_RESEND)
  console.log("[v0] ADMIN_EMAIL:", process.env.ADMIN_EMAIL || "toni@planetmotors.ca (default)")
  
  try {
    const result = await sendNotificationEmail({
      type: 'finance_application',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '(416) 555-1234',
      vehicleInfo: '2024 Tesla Model 3 Long Range',
      applicationId: 'TEST-001'
    })
    
    console.log("[v0] Email send result:", result)
    
    return NextResponse.json({
      success: true,
      message: "Test email sent!",
      result,
      config: {
        apiKeyConfigured: !!(process.env.API_KEY_RESEND || process.env.RESEND_API_KEY),
        adminEmail: process.env.ADMIN_EMAIL || "toni@planetmotors.ca (default)"
      }
    })
  } catch (error: any) {
    console.error("[v0] Test email error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        apiKeyConfigured: !!(process.env.API_KEY_RESEND || process.env.RESEND_API_KEY),
        adminEmail: process.env.ADMIN_EMAIL || "toni@planetmotors.ca (default)"
      }
    }, { status: 500 })
  }
}
