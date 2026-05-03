import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"

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

    // Build query — fetch ALL fields from finance_applications_v2
    let query = serviceClient
      .from("finance_applications_v2")
      .select("*")
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
        // Get ALL applicants (primary + co-applicants) with full details
        const { data: allApplicants } = await serviceClient
          .from("finance_applicants")
          .select("*")
          .eq("application_id", app.id)
          .order("applicant_type", { ascending: true })

        const primaryApplicant = allApplicants?.find(a => a.applicant_type === "primary") || null
        const coApplicants = allApplicants?.filter(a => a.applicant_type !== "primary") || []

        // For each applicant, fetch addresses, employment, income, housing
        const applicantIds = (allApplicants || []).map(a => a.id)

        const [addressesRes, employmentRes, incomeRes, housingRes] = await Promise.all([
          applicantIds.length > 0
            ? serviceClient.from("applicant_addresses").select("*").in("applicant_id", applicantIds)
            : Promise.resolve({ data: [] }),
          applicantIds.length > 0
            ? serviceClient.from("applicant_employment").select("*").in("applicant_id", applicantIds)
            : Promise.resolve({ data: [] }),
          applicantIds.length > 0
            ? serviceClient.from("applicant_income").select("*").in("applicant_id", applicantIds)
            : Promise.resolve({ data: [] }),
          applicantIds.length > 0
            ? serviceClient.from("applicant_housing").select("*").in("applicant_id", applicantIds)
            : Promise.resolve({ data: [] }),
        ])

        // Get documents
        const { data: documents } = await serviceClient
          .from("finance_documents")
          .select("*")
          .eq("application_id", app.id)

        // Get trade-in details
        const { data: tradeIns } = await serviceClient
          .from("finance_trade_ins")
          .select("*")
          .eq("application_id", app.id)

        // Get status history
        const { data: history } = await serviceClient
          .from("finance_application_history")
          .select("*")
          .eq("application_id", app.id)
          .order("changed_at", { ascending: false })

        // Get vehicle info if exists
        let vehicle = null
        if (app.vehicle_id) {
          const { data: vehicleData } = await serviceClient
            .from("vehicles")
            .select("id, year, make, model, trim, price, mileage, vin, stock_number, primary_photo_url")
            .eq("id", app.vehicle_id)
            .single()
          vehicle = vehicleData
        }

        return {
          ...app,
          primary_applicant: primaryApplicant,
          co_applicants: coApplicants,
          addresses: addressesRes.data || [],
          employment: employmentRes.data || [],
          income: incomeRes.data || [],
          housing: housingRes.data || [],
          documents: documents || [],
          trade_ins: tradeIns || [],
          history: history || [],
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

// PATCH — save internal notes for an application
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, internal_notes } = body

    if (!id) {
      return NextResponse.json({ error: "Application ID required" }, { status: 400 })
    }

    const { createClient: createServiceClient } = await import("@supabase/supabase-js")
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    )

    const { error: updateError } = await serviceClient
      .from("finance_applications_v2")
      .update({ internal_notes, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) {
      console.error("Error saving notes:", updateError)
      return NextResponse.json({ error: "Failed to save notes" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving notes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
