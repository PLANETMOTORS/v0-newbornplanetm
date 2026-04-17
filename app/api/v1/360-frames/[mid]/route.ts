import { NextRequest, NextResponse } from "next/server"
import { discoverFrameUrls } from "@/lib/drivee-frames"
import { DRIVEE_VIN_MAP, DRIVEE_DEALER_UID } from "@/lib/drivee"

/**
 * GET /api/v1/360-frames/:mid
 *
 * Returns the list of native 360° walk-around frame URLs for a given
 * Drivee media ID.  The frames are hosted on Firebase Storage (public
 * bucket) and served as WebP images.
 *
 * Response is cached for 1 hour at the edge (frames rarely change).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mid: string }> },
) {
  const { mid } = await params

  // Validate MID exists in our known map (prevent probing arbitrary MIDs)
  const knownMids = new Set(Object.values(DRIVEE_VIN_MAP))
  if (!knownMids.has(mid)) {
    return NextResponse.json(
      { error: "Unknown media ID" },
      { status: 404 },
    )
  }

  try {
    const urls = await discoverFrameUrls(mid, DRIVEE_DEALER_UID)

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "No frames found for this media ID" },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        mid,
        frameCount: urls.length,
        frames: urls,
      },
      {
        status: 200,
        headers: {
          // Cache at edge for 1 hour, stale-while-revalidate for 1 day
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    )
  } catch {
    return NextResponse.json(
      { error: "Failed to discover frames" },
      { status: 500 },
    )
  }
}
