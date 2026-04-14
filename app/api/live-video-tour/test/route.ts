import { NextResponse } from "next/server"
import { Resend } from "resend"

// GET /api/live-video-tour/test
// Sends a direct test email to verify Resend is working
export async function GET() {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not available' }, { status: 404 })

  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "No Resend API key found",
      checkedVars: ["API_KEY_RESEND", "RESEND_API_KEY"]
    }, { status: 500 })
  }

  const resend = new Resend(apiKey)
  
  try {
    console.log("[v0] Sending test email via Resend...")
    
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Use Resend's test domain
      to: "info@planetmotors.ca",
      subject: "Live Video Tour Test - " + new Date().toISOString(),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #7c3aed;">Live Video Tour Test Email</h1>
          <p>This is a test email from Planet Motors to verify the email system is working.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Test Vehicle:</strong> 2024 BMW X5 xDrive40i</p>
          <hr/>
          <p style="color: #666;">If you receive this, the email system is working correctly.</p>
        </div>
      `
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        errorDetails: error
      }, { status: 500 })
    }

    console.log("[v0] Email sent successfully:", data)
    
    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      emailId: data?.id,
      sentTo: "info@planetmotors.ca",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[v0] Exception:", error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
