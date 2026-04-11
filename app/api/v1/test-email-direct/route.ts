import { NextResponse } from "next/server"
import { Resend } from 'resend'
import { createClient } from "@/lib/supabase/server"
import { requireAdminUser } from "@/lib/auth/admin"

export async function GET() {
  const supabase = await createClient()
  const adminCheck = await requireAdminUser(supabase)
  if (!adminCheck.ok) {
    return adminCheck.response
  }

  // Get API key from environment
  const apiKey = process.env.API_KEY_RESEND || process.env.RESEND_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "No Resend API key found",
      hint: "Add API_KEY_RESEND to your environment variables"
    }, { status: 500 })
  }

  const adminEmail = adminCheck.user.email || process.env.ADMIN_EMAIL
  if (!adminEmail) {
    return NextResponse.json({ success: false, error: "No admin recipient email available" }, { status: 500 })
  }
  
  const resend = new Resend(apiKey)
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: adminEmail,
      subject: 'Planet Motors - Test Email',
      html: '<p>Congrats on sending your <strong>first email</strong> from Planet Motors!</p>'
    })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      data: data,
      sentTo: adminEmail
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}
