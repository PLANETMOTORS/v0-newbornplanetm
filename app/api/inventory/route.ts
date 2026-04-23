import { NextRequest, NextResponse } from "next/server"
import { getCachedSearchResults, cacheSearchResults } from "@/lib/redis"

export async function GET(request: NextRequest) {
  const make = request.nextUrl.searchParams.get("make") || ""
  const model = request.nextUrl.searchParams.get("model") || ""
  const cacheKey = `inventory:${make}:${model}`

  // Try Redis cache first
  try {
    const cached = await getCachedSearchResults(cacheKey)
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } })
    }
  } catch {
    // Continue without cache
  }

  // Query vehicles from Supabase (simplified)
  const { createClient } = await import("@supabase/supabase-js")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ vehicles: [], count: 0 }, { headers: { "X-Cache": "MISS" } })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  let query = supabase.from("vehicles").select("*").eq("status", "available")
  if (make) query = query.ilike("make", `%${make}%`)
  if (model) query = query.ilike("model", `%${model}%`)

  const { data, error } = await query.limit(20)
  const result = { vehicles: data || [], count: data?.length || 0 }

  if (!error) {
    // Cache for 5 minutes
    try {
      await cacheSearchResults(cacheKey, result, 300)
    } catch { /* ignore */ }
  }

  return NextResponse.json(result, { headers: { "X-Cache": "MISS" } })
}
