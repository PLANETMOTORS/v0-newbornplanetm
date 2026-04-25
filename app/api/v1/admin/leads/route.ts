import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { ADMIN_EMAILS } from "@/lib/admin"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    )

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const source = searchParams.get("source")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Try the leads table first
    let query = adminClient
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== "all") query = query.eq("status", status)
    if (source && source !== "all") query = query.eq("source", source)
    if (search) {
      // Sanitize search input: escape characters that PostgREST uses as delimiters
      // in .or() filter strings (commas, dots, parens, backslashes, percent signs)
      const sanitized = search.replaceAll(/[\\%,().]/g, "")
      if (sanitized.length > 0) {
        query = query.or(`customer_name.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%,customer_phone.ilike.%${sanitized}%,subject.ilike.%${sanitized}%`)
      }
    }

    const { data: leads, count, error } = await query

    if (error && (error.message?.includes("does not exist") || error.message?.includes("Could not find") || error.code === "PGRST205")) {
      // Leads table not created yet — aggregate from existing tables
      return NextResponse.json(await aggregateLeads(adminClient, { status, source, search, offset, limit }))
    }

    if (error) {
      logger.error("Leads query error", { message: error.message, code: error.code })
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    }

    // Get stats
    const [totalResult, newResult, contactedResult, qualifiedResult, convertedResult] = await Promise.all([
      adminClient.from("leads").select("id", { count: "exact", head: true }),
      adminClient.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      adminClient.from("leads").select("id", { count: "exact", head: true }).eq("status", "contacted"),
      adminClient.from("leads").select("id", { count: "exact", head: true }).eq("status", "qualified"),
      adminClient.from("leads").select("id", { count: "exact", head: true }).eq("status", "converted"),
    ])

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      stats: {
        total: totalResult.count || 0,
        new: newResult.count || 0,
        contacted: contactedResult.count || 0,
        qualified: qualifiedResult.count || 0,
        converted: convertedResult.count || 0,
      },
      page,
      limit,
    })
  } catch (error) {
    logger.error("Leads API error", { error: String(error) })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Fallback: aggregate leads from existing tables if leads table doesn't exist yet

const FINANCE_STATUS_MAP: Record<string, string> = {
  submitted: "new",
  under_review: "new",
  approved: "qualified",
  funded: "converted",
}

const RESERVATION_STATUS_MAP: Record<string, string> = {
  completed: "converted",
  confirmed: "qualified",
  cancelled: "lost",
}

const TRADE_IN_STATUS_MAP: Record<string, string> = {
  accepted: "converted",
  pending: "new",
}

// The Supabase service client has no generated types in this context — SupabaseClient<any,any,any>
// is the correct escape hatch here; the eslint suppression is intentional.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdminClient = ReturnType<typeof createServiceClient<any, any, any>>

async function aggregateLeads(adminClient: SupabaseAdminClient, filters: { status: string | null; source: string | null; search: string | null; offset: number; limit: number }) {
  type AggregatedLead = { id: string; source: string; status: string; customer_name: string; customer_email: string; customer_phone: string | null; subject: string; vehicle_info: string | null; created_at: string; source_table: string }
  const allLeads: AggregatedLead[] = []

  // Finance applications as leads
  const { data: finApps } = await adminClient
    .from("finance_applications_v2")
    .select("id, status, requested_amount, created_at, vehicle_id")
    .order("created_at", { ascending: false })
    .limit(50)

  if (finApps) {
    for (const app of finApps) {
      // Get applicant name
      const { data: applicant } = await adminClient
        .from("finance_applicants")
        .select("first_name, last_name, email, phone")
        .eq("application_id", app.id)
        .eq("applicant_type", "primary")
        .maybeSingle()

      allLeads.push({
        id: app.id,
        source: "finance_app",
        status: FINANCE_STATUS_MAP[app.status] ?? "archived",
        customer_name: applicant ? `${applicant.first_name} ${applicant.last_name}` : "Unknown",
        customer_email: applicant?.email || "",
        customer_phone: applicant?.phone || null,
        subject: `Finance Application — $${(app.requested_amount || 0).toLocaleString()}`,
        vehicle_info: null,
        created_at: app.created_at,
        source_table: "finance_applications_v2",
      })
    }
  }

  // Reservations as leads
  const { data: reservations } = await adminClient
    .from("reservations")
    .select("id, customer_name, customer_email, customer_phone, status, deposit_amount, vehicle_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  if (reservations) {
    for (const res of reservations) {
      allLeads.push({
        id: res.id,
        source: "reservation",
        status: RESERVATION_STATUS_MAP[res.status] ?? "new",
        customer_name: res.customer_name || "Unknown",
        customer_email: res.customer_email,
        customer_phone: res.customer_phone,
        subject: `Reservation — $${Math.round((res.deposit_amount || 0) / 100).toLocaleString()} deposit`,
        vehicle_info: null,
        created_at: res.created_at,
        source_table: "reservations",
      })
    }
  }

  // Trade-in quotes as leads
  const { data: tradeIns } = await adminClient
    .from("trade_in_quotes")
    .select("id, customer_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model, offer_amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  if (tradeIns) {
    for (const ti of tradeIns) {
      allLeads.push({
        id: ti.id,
        source: "trade_in",
        status: TRADE_IN_STATUS_MAP[ti.status] ?? "archived",
        customer_name: ti.customer_name || "Unknown",
        customer_email: ti.customer_email || "",
        customer_phone: ti.customer_phone || null,
        subject: `Trade-In: ${ti.vehicle_year} ${ti.vehicle_make} ${ti.vehicle_model}`,
        vehicle_info: `Offered $${(ti.offer_amount || 0).toLocaleString()}`,
        created_at: ti.created_at,
        source_table: "trade_in_quotes",
      })
    }
  }

  // Sort all by created_at descending
  allLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Apply filters
  let filtered = allLeads
  if (filters.source && filters.source !== "all") filtered = filtered.filter(l => l.source === filters.source)
  if (filters.status && filters.status !== "all") filtered = filtered.filter(l => l.status === filters.status)
  if (filters.search) {
    const s = filters.search.toLowerCase()
    filtered = filtered.filter(l =>
      l.customer_name.toLowerCase().includes(s) ||
      l.customer_email.toLowerCase().includes(s) ||
      (l.customer_phone || "").toLowerCase().includes(s) ||
      l.subject.toLowerCase().includes(s)
    )
  }

  return {
    leads: filtered.slice(filters.offset, filters.offset + filters.limit),
    total: filtered.length,
    stats: {
      total: allLeads.length,
      new: allLeads.filter(l => l.status === "new").length,
      contacted: allLeads.filter(l => l.status === "contacted").length,
      qualified: allLeads.filter(l => l.status === "qualified").length,
      converted: allLeads.filter(l => l.status === "converted").length,
    },
    page: Math.floor(filters.offset / filters.limit) + 1,
    limit: filters.limit,
    aggregated: true,
  }
}

// PATCH — update lead status/notes
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    )

    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: "Lead ID required" }, { status: 400 })

    // Allowlist updatable fields — prevents mass-assignment of arbitrary columns
    const ALLOWED_FIELDS = ["status", "notes", "assigned_to", "contacted_at", "follow_up_at"] as const
    type AllowedField = typeof ALLOWED_FIELDS[number]
    const updates: Partial<Record<AllowedField, unknown>> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in body) updates[field] = body[field]
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      logger.error("Lead update error", { id, message: error.message })
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    logger.error("Lead PATCH error", { error: String(error) })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
