import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Admin emails - in production, check against database role
const ADMIN_EMAILS = ["admin@planetmotors.ca", "toni@planetmotors.ca"]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Use service role for admin queries to bypass RLS
    const { createClient: createServiceClient } = await import("@supabase/supabase-js")
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    )

    // Build query
    let query = serviceClient
      .from("finance_applications_v2")
      .select(`
        id,
        application_number,
        status,
        agreement_type,
        created_at,
        submitted_at,
        requested_amount,
        down_payment,
        loan_term_months,
        payment_frequency,
        estimated_payment,
        has_trade_in,
        trade_in_value,
        vehicle_id,
        additional_notes,
        internal_notes
      `)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error("Error fetching applications:", error)
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
    }

    // Fetch related data for each application
    const enrichedApplications = await Promise.all(
      (applications || []).map(async (app) => {
        // Get primary applicant
        const { data: applicants } = await serviceClient
          .from("finance_applicants")
          .select("first_name, last_name, email, phone, credit_rating")
          .eq("application_id", app.id)
          .eq("applicant_type", "primary")
          .single()

        // Get documents
        const { data: documents } = await serviceClient
          .from("finance_documents")
          .select("id, document_type, document_name, file_url, is_verified, uploaded_at")
          .eq("application_id", app.id)

        // Get vehicle info if exists
        let vehicle = null
        if (app.vehicle_id) {
          const { data: vehicleData } = await serviceClient
            .from("vehicles")
            .select("year, make, model, price")
            .eq("id", app.vehicle_id)
            .single()
          vehicle = vehicleData
        }

        return {
          ...app,
          primary_applicant: applicants,
          documents: documents || [],
          vehicle
        }
      })
    )

    // Calculate stats
    const { data: allApps } = await serviceClient
      .from("finance_applications_v2")
      .select("status, requested_amount")

    const stats = {
      total: allApps?.length || 0,
      pending: allApps?.filter(a => ["submitted", "under_review"].includes(a.status)).length || 0,
      approved: allApps?.filter(a => a.status === "approved").length || 0,
      funded: allApps?.filter(a => a.status === "funded").length || 0,
      totalValue: allApps?.reduce((sum, a) => sum + (a.requested_amount || 0), 0) || 0
    }

    return NextResponse.json({
      applications: enrichedApplications,
      stats
    })

  } catch (error) {
    console.error("Error in admin finance API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
