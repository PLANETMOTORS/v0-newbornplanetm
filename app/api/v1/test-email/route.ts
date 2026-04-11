import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { requireAdminUser } from "@/lib/auth/admin"

// Test email endpoint - uses verified planetmotors.ca domain
export async function GET() {
  const supabase = await createClient()
  const adminCheck = await requireAdminUser(supabase)
  if (!adminCheck.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL || "toni@planetmotors.ca"
  
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "No API key configured" }, { status: 500 })
  }
  
  const resend = new Resend(apiKey)
  
  try {
    // Use verified planetmotors.ca domain
    const { data, error } = await resend.emails.send({
      from: 'Planet Motors <notifications@planetmotors.ca>',
      to: adminEmail,
      subject: 'Test Email from Planet Motors',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Test Email Successful!</h1>
          <p>Congratulations! Your email notification system is working.</p>
          <p>This email was sent from the Planet Motors notification system.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            Planet Motors - Email Notifications<br/>
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `
    })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Test email sent successfully!",
      version: "v3-verified-domain",
      emailId: data?.id,
      sentTo: adminEmail
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
