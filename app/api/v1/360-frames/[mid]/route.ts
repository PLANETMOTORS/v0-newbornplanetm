import { NextRequest, NextResponse } from "next/server"
import { discoverFrameUrls, interiorUrl } from "@/lib/drivee-frames"
import { getKnownMids } from "@/lib/drivee-db"

/**
 * GET /api/v1/360-frames/:mid
 *
 * Returns the list of 360° walk-around frame URLs for a given media ID.
 * Frames are now served from our Supabase Storage bucket (`vehicle-360`).
 *
 * MID validation reads from the `drivee_mappings` DB table (with in-memory
 * cache), falling back to the static DRIVEE_VIN_MAP if the DB is unavailable.
 *
 * Response is cached for 1 hour at the edge (frames rarely change).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mid: string }> },
) {
  const { mid } = await params

  // Validate MID exists in our known mappings (prevent probing arbitrary MIDs)
  const knownMids = await getKnownMids()
  if (!knownMids.has(mid)) {
    return NextResponse.json(
      { error: "Unknown media ID" },
      { status: 404 },
    )
  }

  try {
    const urls = await discoverFrameUrls(mid)

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
        interior: interiorUrl(mid),
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
