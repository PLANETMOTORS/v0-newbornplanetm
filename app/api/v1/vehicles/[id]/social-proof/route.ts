import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface QueryResult {
  count: number | null
  error: { code?: string; message?: string } | null
}

interface QueryResultWithData extends QueryResult {
  data: Array<Record<string, string>> | null
}

function isTableMissing(err: { code?: string; message?: string } | null): boolean {
  return err?.code === "PGRST205" || (err?.message?.includes("does not exist") ?? false)
}

function safeCount(result: QueryResult): number {
  if (isTableMissing(result.error)) return 0
  return result.count ?? 0
}

/**
 * GET /api/v1/vehicles/[id]/social-proof
 *
 * Returns lightweight social proof signals for a vehicle:
 * - recentFinanceInquiries: count of finance applications in last 7 days
 * - totalFinanceInquiries: all-time finance application count
 * - hasRecentReservation: whether someone reserved this vehicle recently
 * - views24h: page views in last 24 hours (from vehicle_page_views table)
 * - lastInquiryAt: ISO timestamp of most recent inquiry (if any)
 *
 * All queries use the service-role admin client (no auth required for reads).
 * Gracefully degrades if tables don't exist.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params

  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 })
  }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json(emptySocialProof())
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // Run all queries in parallel
  const [financeRecentRaw, financeTotalRaw, reservationsRaw, viewsRaw] = await Promise.all([
    Promise.resolve(
      adminClient
        .from("finance_applications_v2")
        .select("id", { count: "exact", head: true })
        .eq("vehicle_id", vehicleId)
        .gte("created_at", sevenDaysAgo)
    ),
    Promise.resolve(
      adminClient
        .from("finance_applications_v2")
        .select("id, created_at", { count: "exact" })
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false })
        .limit(1)
    ),
    Promise.resolve(
      adminClient
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("vehicle_id", vehicleId)
        .in("status", ["pending", "confirmed"])
        .gte("created_at", sevenDaysAgo)
    ),
    Promise.resolve(
      adminClient
        .from("vehicle_page_views")
        .select("id", { count: "exact", head: true })
        .eq("vehicle_id", vehicleId)
        .gte("viewed_at", twentyFourHoursAgo)
    ),
  ])

  const financeRecent = financeRecentRaw as unknown as QueryResult
  const financeTotal = financeTotalRaw as unknown as QueryResultWithData
  const reservationsResult = reservationsRaw as unknown as QueryResult
  const viewsResult = viewsRaw as unknown as QueryResult

  const viewsExist = !isTableMissing(viewsResult.error)

  return NextResponse.json({
    recentFinanceInquiries: safeCount(financeRecent),
    totalFinanceInquiries: safeCount(financeTotal),
    hasRecentReservation: safeCount(reservationsResult) > 0,
    views24h: viewsExist ? (viewsResult.count ?? 0) : 0,
    viewsTracked: viewsExist,
    lastInquiryAt: financeTotal.data?.[0]?.created_at ?? null,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  })
}

/**
 * POST /api/v1/vehicles/[id]/social-proof
 *
 * Records a page view for social proof tracking.
 * Fire-and-forget from the VDP — non-blocking, no auth required.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params

  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 })
  }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ recorded: false })
  }

  const forwarded = request.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const visitorHash = await hashString(`${ip}:${request.headers.get("user-agent") || ""}`)

  const result = await Promise.resolve(
    adminClient
      .from("vehicle_page_views")
      .insert({
        vehicle_id: vehicleId,
        visitor_hash: visitorHash,
        viewed_at: new Date().toISOString(),
      })
  )

  const error = (result as unknown as QueryResult).error
  if (isTableMissing(error)) {
    return NextResponse.json({ recorded: false, reason: "tracking_not_configured" })
  }

  return NextResponse.json({ recorded: !error })
}

function emptySocialProof() {
  return {
    recentFinanceInquiries: 0,
    totalFinanceInquiries: 0,
    hasRecentReservation: false,
    views24h: 0,
    viewsTracked: false,
    lastInquiryAt: null,
  }
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16)
}
