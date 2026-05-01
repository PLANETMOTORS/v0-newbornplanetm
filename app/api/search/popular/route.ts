/**
 * GET /api/search/popular
 *
 * Returns dynamically scored popular searches based on live inventory.
 * Results are cached in Redis (15-min TTL) with Supabase RPC fallback.
 *
 * Called by the search bar on focus (before the user starts typing).
 * Predictive type-ahead is handled by the existing /api/search/suggestions
 * endpoint (Typesense-powered).
 */

import { NextResponse } from "next/server"
import { getPopularSearches } from "@/lib/search/data"

export const runtime = "nodejs"
export const revalidate = 900 // ISR: 15 minutes

export async function GET() {
  try {
    const data = await getPopularSearches()
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=60",
      },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
