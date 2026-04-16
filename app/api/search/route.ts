import { NextRequest, NextResponse } from "next/server"

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
      // TYPESENSE_HOST is typically a bare hostname (e.g. "xxx.a2.typesense.net"),
      // so prefix https:// unless the value already includes a protocol.
      const baseUrl = /^https?:\/\//i.test(typesenseHost) ? typesenseHost : `https://${typesenseHost}`
      const res = await fetch(
        `${baseUrl}/collections/vehicles/documents/search?q=${encodeURIComponent(q)}&query_by=make,model,trim,year&per_page=5`,
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
        return NextResponse.json({ results })
      }
    }
  } catch {
    // Fallback below
  }

  return NextResponse.json({ results: [] })
}
