/**
 * Native 360° frame URL builder for Drivee/Pirelly images.
 *
 * Instead of embedding Drivee's iframe, we fetch the walk-around image
 * sequence directly from their public Firebase Storage bucket and render
 * them natively with Next.js <Image>.
 *
 * URL pattern (public, no auth required):
 *   https://firebasestorage.googleapis.com/v0/b/public-iframe/o/
 *     users%2F{UID}%2Fmodels%2F{MID}%2Fwalk-around%2F{NN}.webp?alt=media
 *
 * Frame numbering: 01.webp … NN.webp (typically 33-40 frames per vehicle)
 */

import { DRIVEE_DEALER_UID } from "./drivee"

const FIREBASE_STORAGE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/public-iframe/o"

/** Build the direct-download URL for a single walk-around frame. */
export function frameUrl(
  mid: string,
  frameNumber: number,
  uid: string = DRIVEE_DEALER_UID,
): string {
  const padded = String(frameNumber).padStart(2, "0")
  const path = `users/${uid}/models/${mid}/walk-around/${padded}.webp`
  return `${FIREBASE_STORAGE_BASE}/${encodeURIComponent(path)}?alt=media`
}

/**
 * Probe Firebase Storage to discover how many walk-around frames exist
 * for a given MID.
 *
 * Uses parallel HEAD requests (fires all at once up to MAX_FRAMES) then
 * finds the highest consecutive frame that returned 200.  This reduces
 * wall-clock time from O(n × latency) to O(1 × latency) — typically
 * ~200ms instead of 3-8 seconds for 30-40 frames.
 *
 * Returns the list of direct-download URLs for every frame found.
 */
export async function discoverFrameUrls(
  mid: string,
  uid: string = DRIVEE_DEALER_UID,
): Promise<string[]> {
  // Drivee vehicles typically have 30-45 frames; probe up to 50 in parallel.
  const MAX_PROBE = 50

  const probes = Array.from({ length: MAX_PROBE }, (_, i) => {
    const url = frameUrl(mid, i + 1, uid)
    return fetch(url, { method: "HEAD" })
      .then((res) => ({ url, ok: res.ok }))
      .catch(() => ({ url, ok: false }))
  })

  const results = await Promise.all(probes)

  // Find the longest consecutive run of OK frames starting at index 0.
  const urls: string[] = []
  for (const result of results) {
    if (!result.ok) break
    urls.push(result.url)
  }

  return urls
}
