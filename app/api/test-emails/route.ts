import { NextResponse } from "next/server"
import { sendNotificationEmail, sendCustomerConfirmationEmail } from "@/lib/email"
import { createClient } from "@/lib/supabase/server"
import { requireAdminUser } from "@/lib/auth/admin"

// Test endpoint to verify all email notifications are working
// GET /api/test-emails?type=all or ?type=finance_application
export async function GET(req: Request) {
  const supabase = await createClient()
  const adminCheck = await requireAdminUser(supabase)
  if (!adminCheck.ok) {
    return adminCheck.response
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "all"
  const testEmail = searchParams.get("email") || adminCheck.user.email || process.env.ADMIN_EMAIL

  if (!testEmail) {
    return NextResponse.json({ success: false, error: "No test email recipient available" }, { status: 500 })
  }
  
  const results: Record<string, { success: boolean; error?: string }> = {}

  const testData = {
    customerName: "Test Customer",
    customerEmail: testEmail,
    customerPhone: "(416) 555-1234",
    vehicleInfo: "2024 BMW X5 xDrive40i",
    applicationId: "TEST-" + Date.now(),
    quoteId: "QT-TEST-" + Date.now(),
    tradeInValue: 25000,
  }

  // Admin notification emails
  const adminEmailTypes = [
    "finance_application",
    "trade_in_quote", 
    "ico_accepted",
    "vehicle_inquiry",
    "test_drive_request",
    "document_uploaded",
    "application_status_changed",
  ] as const

  // Customer confirmation emails
  const customerEmailTypes = [
    "finance_submitted",
    "trade_in_submitted",
    "ico_confirmed",
  ] as const

  if (type === "all" || adminEmailTypes.includes(type as any)) {
    for (const emailType of adminEmailTypes) {
      if (type !== "all" && type !== emailType) continue
      
      results[`admin_${emailType}`] = await sendNotificationEmail({
        type: emailType,
        ...testData,
        additionalData: {
          message: "This is a test inquiry message",
          preferredDate: "Tomorrow at 2pm",
          newStatus: "Approved",
          notes: "Test status change",
          documentCount: 3,
        },
      })
    }
  }

  if (type === "all" || customerEmailTypes.includes(type as any)) {
    for (const emailType of customerEmailTypes) {
      if (type !== "all" && type !== emailType) continue
      
      results[`customer_${emailType}`] = await sendCustomerConfirmationEmail(
        testEmail,
        emailType,
        {
          customerName: testData.customerName,
          referenceId: testData.applicationId,
          vehicleInfo: testData.vehicleInfo,
          offerAmount: testData.tradeInValue,
        }
      )
    }
  }

  const allSuccess = Object.values(results).every(r => r.success)
  const successCount = Object.values(results).filter(r => r.success).length
  const totalCount = Object.keys(results).length

  return NextResponse.json({
    success: allSuccess,
    summary: `${successCount}/${totalCount} emails sent successfully`,
    timestamp: new Date().toISOString(),
    testEmail,
    results,
  })
}
