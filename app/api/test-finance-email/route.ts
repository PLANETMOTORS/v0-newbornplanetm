import { sendNotificationEmail } from "@/lib/email"
import { NextResponse } from "next/server"

// Temporary test endpoint — remove after verifying finance email
export async function POST(request: Request) {
  const secret = request.headers.get("x-test-secret")
  if (secret !== "pm-email-test-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await sendNotificationEmail({
    type: "finance_application",
    customerName: "Toni Test",
    customerEmail: "toni@planetmotors.ca",
    customerPhone: "(416) 985-2277",
    vehicleInfo: "2024 BMW X5 xDrive40i",
    applicationId: "FA-TEST-20260422",
    additionalData: {
      annualIncome: 75000,
      requestedAmount: 35000,
      requestedTerm: 72,
      employmentStatus: "employed",
      note: "Test email trigger from preview — not a real application",
    },
  })

  return NextResponse.json({ success: true, emailResult: result })
}
