import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/customers/me/searches - Get saved searches
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("search_alerts")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: "Failed to fetch saved searches" }, { status: 500 })
  }

  const savedSearches = Array.isArray(profile?.search_alerts) ? profile.search_alerts : []
  return NextResponse.json({ savedSearches })
}

// POST /api/v1/customers/me/searches - Save a search
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  const savedSearches = [
    {
      id: "search_001",
      name: "Electric SUVs under $60K",
      filters: {
        bodyType: "SUV",
        fuelType: "Electric",
        maxPrice: 60000,
        minYear: 2022,
      },
      resultCount: 24,
      alertEnabled: true,
      lastChecked: new Date(Date.now() - 3600000).toISOString(),
      newResults: 2,
      createdAt: "2024-03-01T10:00:00Z",
    },
    {
      id: "search_002",
      name: "BMW X5 2020+",
      filters: {
        make: "BMW",
        model: "X5",
        minYear: 2020,
      },
      resultCount: 8,
      alertEnabled: true,
      lastChecked: new Date(Date.now() - 7200000).toISOString(),
      newResults: 0,
      createdAt: "2024-02-15T14:30:00Z",
    },
  ]

  return NextResponse.json({ savedSearches })
}

// POST /api/v1/customers/me/searches - Save a search
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, filters, alertEnabled } = body

  if (!name || !filters) {
    return NextResponse.json(
      { error: "Name and filters are required" },
      { status: 400 }
    )
  }

  const savedSearch = {
    id: "search_" + Date.now(),
    name,
    filters,
    resultCount: 0, // Will be calculated
    alertEnabled: alertEnabled !== false,
    lastChecked: new Date().toISOString(),
    newResults: 0,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({ success: true, savedSearch })
}
