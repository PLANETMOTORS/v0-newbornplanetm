import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"

const VALID_STATUSES = ["draft", "submitted", "under_review", "approved", "declined", "funded", "cancelled"] as const
type FinanceStatus = typeof VALID_STATUSES[number]
const NOTIFY_STATUSES = new Set<FinanceStatus>(["approved", "declined", "funded"])

function resolveStatusText(status: FinanceStatus): string {
  if (status === "approved") return "Approved"
  if (status === "declined") return "Declined"
  if (status === "funded") return "Funded"
  return status
}

function buildStatusUpdateData(status: FinanceStatus, notes: string | undefined): Record<string, string | number | boolean> {
  const update: Record<string, string | number | boolean> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === "approved" || status === "declined") {
    update.decision_at = new Date().toISOString()
  }
  if (notes) {
    update.internal_notes = notes
  }
  return update
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Use service role for admin updates
    const { createClient: createServiceClient } = await import("@supabase/supabase-js")
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    )

    const { data: currentApp } = await serviceClient
      .from("finance_applications_v2")
      .select("status, application_number")
      .eq("id", id)
      .single()

    if (!currentApp) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const updateData = buildStatusUpdateData(status as FinanceStatus, notes)

    const { error: updateError } = await serviceClient
      .from("finance_applications_v2")
      .update(updateData)
      .eq("id", id)

    if (updateError) {
      console.error("Error updating status:", updateError)
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    await serviceClient
      .from("finance_application_history")
      .insert({
        application_id: id,
        from_status: currentApp.status,
        to_status: status,
        changed_by: user.id,
        notes: notes || `Status changed from ${currentApp.status} to ${status}`
      })

    const { data: applicant } = await serviceClient
      .from("finance_applicants")
      .select("email, first_name")
      .eq("application_id", id)
      .eq("applicant_type", "primary")
      .single()

    if (applicant?.email && NOTIFY_STATUSES.has(status as FinanceStatus)) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/v1/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "finance_status_update",
            to: applicant.email,
            data: {
              firstName: applicant.first_name,
              applicationNumber: currentApp.application_number,
              status,
              statusText: resolveStatusText(status as FinanceStatus),
            }
          })
        })
      } catch (emailError) {
        console.error("Failed to send status notification email:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application status updated to ${status}`
    })

  } catch (error) {
    console.error("Error updating application status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
