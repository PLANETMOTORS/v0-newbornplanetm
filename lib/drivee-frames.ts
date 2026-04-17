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
 * for a given MID.  Sends HEAD requests starting at frame 01 until a
 * non-200 response is returned.
 *
 * Returns the list of direct-download URLs for every frame found.
 */
export async function discoverFrameUrls(
  mid: string,
  uid: string = DRIVEE_DEALER_UID,
): Promise<string[]> {
  const urls: string[] = []
  // Drivee vehicles typically have 30-45 frames; cap at 72 for safety.
  const MAX_FRAMES = 72

  for (let i = 1; i <= MAX_FRAMES; i++) {
    const url = frameUrl(mid, i, uid)
    try {
      const res = await fetch(url, { method: "HEAD" })
      if (!res.ok) break
      urls.push(url)
    } catch {
      break
    }
  }

  return urls
}
