import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAdminDataClient, recordAdminAuditEvent, requireAdminUser } from "@/lib/auth/admin"

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["under_review", "declined", "cancelled"],
  under_review: ["approved", "declined", "cancelled"],
  approved: ["funded", "cancelled"],
  declined: [],
  funded: [],
  cancelled: [],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const adminCheck = await requireAdminUser(supabase)
    if (!adminCheck.ok) {
      return adminCheck.response
    }
    const { user } = adminCheck

    const body = await request.json()
    const { status, notes } = body

    // Validate status
    const validStatuses = ["draft", "submitted", "under_review", "approved", "declined", "funded", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const serviceClient = getAdminDataClient()

    // Get current application state
    const { data: currentApp } = await serviceClient
      .from("finance_applications_v2")
      .select("status, application_number")
      .eq("id", id)
      .single()

    if (!currentApp) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const currentStatus = String(currentApp.status || "")
    const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || []
    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid transition from ${currentStatus} to ${status}` },
        { status: 409 }
      )
    }

    // Update application status
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === "approved" || status === "declined") {
      updateData.decision_at = new Date().toISOString()
    }

    if (notes) {
      updateData.internal_notes = notes
    }

    const { error: updateError } = await serviceClient
      .from("finance_applications_v2")
      .update(updateData)
      .eq("id", id)

    if (updateError) {
      console.error("Error updating status:", updateError)
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    // Record status change in history
    await serviceClient
      .from("finance_application_history")
      .insert({
        application_id: id,
        from_status: currentApp.status,
        to_status: status,
        changed_by: user.id,
        notes: notes || `Status changed from ${currentApp.status} to ${status}`
      })

    await recordAdminAuditEvent({
      actorId: user.id,
      action: "finance.application.status.update",
      entityType: "finance_application",
      entityId: id,
      beforeState: currentStatus,
      afterState: status,
      notes: typeof notes === "string" ? notes : null,
    })

    // Get applicant info for notification
    const { data: applicant } = await serviceClient
      .from("finance_applicants")
      .select("email, first_name")
      .eq("application_id", id)
      .eq("applicant_type", "primary")
      .single()

    // Send email notification for status changes
    if (applicant?.email && ["approved", "declined", "funded"].includes(status)) {
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
              statusText: status === "approved" ? "Approved" : 
                         status === "declined" ? "Declined" :
                         status === "funded" ? "Funded" : status
            }
          })
        })
      } catch (emailError) {
        console.error("Failed to send status notification email:", emailError)
        // Don't fail the request if email fails
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
