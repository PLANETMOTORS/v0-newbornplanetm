import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, getProfileField } from "@/lib/api/auth-helpers"

// GET /api/v1/customers/me/searches - Get saved searches
export async function GET(_request: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (auth.error) return auth.error

  const result = await getProfileField<{ search_alerts?: unknown[] }>(
    auth.supabase, auth.user.id, "search_alerts", "Failed to fetch saved searches",
  )
  if (result.error) return result.error

  const savedSearches = Array.isArray(result.profile?.search_alerts) ? result.profile.search_alerts : []
  return NextResponse.json({ savedSearches })
}

// POST /api/v1/customers/me/searches - Save a search
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const body = await request.json()
  const { name, filters, alertEnabled } = body

  if (!name || !filters) {
    return NextResponse.json({ error: "Name and filters are required" }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("search_alerts")
    .eq("id", user.id)
    .maybeSingle()

  const current = Array.isArray(profile?.search_alerts) ? profile.search_alerts : []

  const newSearch = {
    id: `search_${Date.now()}`,
    name: String(name).slice(0, 100),
    filters,
    alertEnabled: alertEnabled !== false,
    resultCount: 0,
    lastChecked: new Date().toISOString(),
    newResults: 0,
    createdAt: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      search_alerts: [...current, newSearch],
      updated_at: new Date().toISOString(),
    })

  if (updateError) {
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 })
  }

  return NextResponse.json({ success: true, savedSearch: newSearch })
}
