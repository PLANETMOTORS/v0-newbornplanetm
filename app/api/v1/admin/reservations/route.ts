import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { ADMIN_EMAILS } from "@/lib/admin"

/** Authenticate the request and return a service-role admin client.
 *  Returns null (with a 401 response already sent) if the user is not an admin. */
async function requireAdminClient(): Promise<
  | { adminClient: ReturnType<typeof createServiceClient>; unauthorized: null }
  | { adminClient: null; unauthorized: NextResponse }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return { adminClient: null, unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  )
  return { adminClient, unauthorized: null }
}

export async function GET(request: NextRequest) {
  try {
    const { adminClient, unauthorized } = await requireAdminClient()
    if (!adminClient) return unauthorized!

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const depositStatus = searchParams.get("deposit_status")

    let query = adminClient
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") query = query.eq("status", status)
    if (depositStatus && depositStatus !== "all") query = query.eq("deposit_status", depositStatus)

    const { data: reservations, error } = await query

    if (error) {
      console.error("Reservations query error:", error)
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 })
    }

    // Enrich with vehicle info
    const enriched = await Promise.all(
      (reservations || []).map(async (res) => {
        let vehicle = null
        if (res.vehicle_id) {
          const { data: v } = await adminClient
            .from("vehicles")
            .select("year, make, model, trim, price, stock_number, primary_image_url")
            .eq("id", res.vehicle_id)
            .single()
          vehicle = v
        }
        return { ...res, vehicle }
      })
    )

    // Stats
    const [pendingCount, confirmedCount, completedCount, cancelledCount, totalDeposits] = await Promise.all([
      adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
      adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
      adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("status", "completed"),
      adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      adminClient.from("reservations").select("deposit_amount").eq("deposit_status", "paid"),
    ])

    // deposit_amount is stored in cents; convert to dollars for client display
    const totalDepositAmountCents = (totalDeposits.data || []).reduce((sum, r) => sum + (r.deposit_amount || 0), 0)
    const totalDepositAmount = Math.round(totalDepositAmountCents / 100)

    return NextResponse.json({
      reservations: enriched,
      stats: {
        pending: pendingCount.count || 0,
        confirmed: confirmedCount.count || 0,
        completed: completedCount.count || 0,
        cancelled: cancelledCount.count || 0,
        totalDeposits: totalDepositAmount,
      },
    })
  } catch (error) {
    console.error("Reservations API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { adminClient, unauthorized } = await requireAdminClient()
    if (!adminClient) return unauthorized!

    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: "Reservation ID required" }, { status: 400 })

    const { data, error } = await adminClient
      .from("reservations")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 })
    }

    return NextResponse.json({ reservation: data })
  } catch (error) {
    console.error("Reservation update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
