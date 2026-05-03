/**
 * GET /api/v1/carfax/badge?url=<encoded-cdn-url>
 *
 * Server-side proxy for CARFAX badge SVGs from cdn.carfax.ca.
 * Bypasses browser CSP / CORS restrictions by fetching the SVG
 * on the server and serving it from our own domain.
 *
 * Only allows URLs from cdn.carfax.ca to prevent open-proxy abuse.
 * Caches for 24 hours (same as CARFAX data TTL).
 */

import { NextRequest, NextResponse } from "next/server"

const ALLOWED_HOST = "cdn.carfax.ca"
const CACHE_SECONDS = 86_400 // 24 hours

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json(
      { error: "Missing ?url= parameter" },
      { status: 400 },
    )
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json(
      { error: "Invalid URL" },
      { status: 400 },
    )
  }

  // Only allow cdn.carfax.ca — prevent open proxy
  if (parsed.hostname !== ALLOWED_HOST) {
    return NextResponse.json(
      { error: `Only ${ALLOWED_HOST} URLs are allowed` },
      { status: 403 },
    )
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "image/svg+xml, image/*",
        "User-Agent": "PlanetMotors/1.0",
      },
      next: { revalidate: CACHE_SECONDS },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 },
      )
    }

    const contentType = upstream.headers.get("content-type") || "image/svg+xml"
    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600`,
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch badge from upstream" },
      { status: 502 },
    )
  }
}
