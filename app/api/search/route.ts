import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || ""

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Try Typesense first, fallback to Supabase
  try {
    const typesenseHost = process.env.TYPESENSE_HOST || process.env.NEXT_PUBLIC_TYPESENSE_HOST
    const typesenseKey =
      process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || process.env.TYPESENSE_API_KEY

    if (typesenseHost && typesenseKey) {
      const baseUrl = /^https?:\/\//i.test(typesenseHost) ? typesenseHost : `https://${typesenseHost}`
      const res = await fetch(
        `${baseUrl}/collections/vehicles/documents/search?q=${encodeURIComponent(q)}&query_by=make,model,trim,vin,stock_number&per_page=5`,
        { headers: { "X-TYPESENSE-API-KEY": typesenseKey } }
      )
      if (res.ok) {
        const data = await res.json()
        const results = (data.hits || []).map((hit: Record<string, unknown>) => {
          const doc = hit.document as Record<string, unknown>
          return {
            id: doc.id as string,
            type: "vehicle",
            title: `${doc.year} ${doc.make} ${doc.model}`,
            subtitle: doc.trim as string,
            url: `/vehicles/${doc.id}`,
          }
        })
        if (results.length > 0) {
          return NextResponse.json({ results })
        }
      }
    }
  } catch {
    // Fallback to Supabase below
  }

  // Supabase fallback — search vehicles by make, model, or trim
  try {
    const supabase = await createClient()
    const pattern = `%${q}%`
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, year, make, model, trim, price, mileage")
      .eq("status", "available")
      .or(`make.ilike.${pattern},model.ilike.${pattern},trim.ilike.${pattern},vin.ilike.${pattern},stock_number.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5)

    if (vehicles && vehicles.length > 0) {
      const results = vehicles.map((v) => ({
        id: v.id,
        type: "vehicle" as const,
        title: `${v.year} ${v.make} ${v.model}`,
        subtitle: [v.trim, v.price ? `$${Number(v.price).toLocaleString()}` : null, v.mileage ? `${Number(v.mileage).toLocaleString()} km` : null].filter(Boolean).join(" • "),
        url: `/vehicles/${v.id}`,
      }))
      return NextResponse.json({ results })
    }
  } catch {
    // Return empty if Supabase also fails
  }

  return NextResponse.json({ results: [] })
}
