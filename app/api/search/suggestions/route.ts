/**
 * GET /api/search/suggestions?q=<query>
 *
 * Returns typo-tolerant "did-you-mean" suggestions from Typesense for the
 * search autocomplete dropdown. Uses getSmartSuggestions() from lib/typesense/search.ts.
 *
 * Response shape:
 *   { suggestions: SmartSuggestion[] }
 *
 * Falls back to an empty array if Typesense is not configured.
 */
import { NextRequest, NextResponse } from "next/server"
import { getSmartSuggestions } from "@/lib/typesense/search"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? ""

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const suggestions = await getSmartSuggestions(q.trim())
    return NextResponse.json(
      { suggestions },
      {
        headers: {
          // Cache for 60 s at the edge — suggestions don't change per-second
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
