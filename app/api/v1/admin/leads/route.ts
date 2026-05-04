import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security/admin-route-helpers"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  adminLeadPatchSchema,
  parseAdminPatch,
} from "@/lib/security/admin-mutation-schemas"

// ── Status mappers (extracted from nested ternaries to satisfy SonarCloud S3358) ──

function mapFinanceStatusToLeadStatus(status: string | null | undefined): string {
  if (!status) return "archived"
  if (status === "submitted" || status === "under_review") return "new"
  if (status === "approved") return "qualified"
  if (status === "funded") return "converted"
  return "archived"
}

function mapReservationStatusToLeadStatus(status: string | null | undefined): string {
  switch (status) {
    case "completed":
      return "converted"
    case "confirmed":
      return "qualified"
    case "cancelled":
      return "lost"
    default:
      return "new"
  }
}

function mapTradeInStatusToLeadStatus(status: string | null | undefined): string {
  if (status === "accepted") return "converted"
  if (status === "pending") return "new"
  return "archived"
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.error

    const adminClient = createAdminClient()

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
      console.error("Leads query error:", error)
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
    console.error("Leads API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

type AggregatedLead = { id: string; source: string; status: string; customer_name: string; customer_email: string; customer_phone: string | null; subject: string; vehicle_info: string | null; created_at: string; source_table: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadFinanceLeads(adminClient: any): Promise<AggregatedLead[]> {
  const { data: finApps } = await adminClient
    .from("finance_applications_v2")
    .select("id, status, requested_amount, created_at, vehicle_id")
    .order("created_at", { ascending: false })
    .limit(50)
  if (!finApps) return []
  const leads: AggregatedLead[] = []
  for (const app of finApps) {
    const { data: applicant } = await adminClient
      .from("finance_applicants")
      .select("first_name, last_name, email, phone")
      .eq("application_id", app.id)
      .eq("applicant_type", "primary")
      .maybeSingle()
    leads.push({
      id: app.id,
      source: "finance_app",
      status: mapFinanceStatusToLeadStatus(app.status),
      customer_name: applicant ? `${applicant.first_name} ${applicant.last_name}` : "Unknown",
      customer_email: applicant?.email || "",
      customer_phone: applicant?.phone || null,
      subject: `Finance Application — $${(app.requested_amount || 0).toLocaleString()}`,
      vehicle_info: null,
      created_at: app.created_at,
      source_table: "finance_applications_v2",
    })
  }
  return leads
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadReservationLeads(adminClient: any): Promise<AggregatedLead[]> {
  const { data } = await adminClient
    .from("reservations")
    .select("id, customer_name, customer_email, customer_phone, status, deposit_amount, vehicle_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((res: any) => ({
    id: res.id,
    source: "reservation",
    status: mapReservationStatusToLeadStatus(res.status),
    customer_name: res.customer_name || "Unknown",
    customer_email: res.customer_email,
    customer_phone: res.customer_phone,
    subject: `Reservation — $${Math.round((res.deposit_amount || 0) / 100).toLocaleString()} deposit`,
    vehicle_info: null,
    created_at: res.created_at,
    source_table: "reservations",
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadTradeInLeads(adminClient: any): Promise<AggregatedLead[]> {
  const { data } = await adminClient
    .from("trade_in_quotes")
    .select("id, customer_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model, offer_amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((ti: any) => ({
    id: ti.id,
    source: "trade_in",
    status: mapTradeInStatusToLeadStatus(ti.status),
    customer_name: ti.customer_name || "Unknown",
    customer_email: ti.customer_email || "",
    customer_phone: ti.customer_phone || null,
    subject: `Trade-In: ${ti.vehicle_year} ${ti.vehicle_make} ${ti.vehicle_model}`,
    vehicle_info: `Offered $${(ti.offer_amount || 0).toLocaleString()}`,
    created_at: ti.created_at,
    source_table: "trade_in_quotes",
  }))
}

function applyLeadFilters(
  allLeads: AggregatedLead[],
  filters: { status: string | null; source: string | null; search: string | null },
): AggregatedLead[] {
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
  return filtered
}

// Fallback: aggregate leads from existing tables if leads table doesn't exist yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function aggregateLeads(adminClient: any, filters: { status: string | null; source: string | null; search: string | null; offset: number; limit: number }) {
  const [finance, reservations, tradeIns] = await Promise.all([
    loadFinanceLeads(adminClient),
    loadReservationLeads(adminClient),
    loadTradeInLeads(adminClient),
  ])
  const allLeads = [...finance, ...reservations, ...tradeIns]
  allLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filtered = applyLeadFilters(allLeads, filters)
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
    const auth = await requireAdmin()
    if (!auth.ok) return auth.error

    const adminClient = createAdminClient()

    const { id, ...rawUpdates } = await request.json()
    if (!id) return NextResponse.json({ error: "Lead ID required" }, { status: 400 })

    // Mass-assignment defence: only allow admin-editable columns through.
    const parsed = parseAdminPatch(adminLeadPatchSchema, rawUpdates)
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Invalid lead update", details: parsed.issues },
        { status: 400 }
      )
    }

    const { data, error } = await adminClient
      .from("leads")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error("Lead update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
