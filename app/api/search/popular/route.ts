/**
 * GET /api/search/popular
 *
 * Returns ranked popular searches for the search bar.
 * Server-side: Redis cache (15 min TTL) → Supabase RPC fallback.
 *
 * Response is ISR-cached for 15 minutes and marked stale-while-revalidate
 * for up to 1 hour so edge CDN serves fast while background refreshes happen.
 */

import { NextResponse } from "next/server"
import { getPopularSearches } from "@/lib/search/data"

export const revalidate = 900 // ISR: 15 minutes
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const results = await getPopularSearches()

    return NextResponse.json(results, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
