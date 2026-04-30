"use client"

/**
 * Mounts {@link usePixelRouteTracking} so client-side pixels (Meta,
 * TikTok, Snap, Bing UET) re-fire PageView on every Next.js route
 * change. Renders nothing.
 *
 * Lives next to the other pixel components so it can be lazily
 * imported via `next/dynamic({ ssr: false })` from the layout
 * widgets — `usePathname()` is a client-only hook.
 */

import { usePixelRouteTracking } from "@/lib/hooks/use-pixel-route-tracking"

export function PixelRouteTracker(): null {
  usePixelRouteTracking()
  return null
}
