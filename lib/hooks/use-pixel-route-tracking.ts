"use client"

/**
 * Re-fires PageView events to client-side pixels on every Next.js
 * route change. Required because each pixel SDK only auto-fires
 * PageView on initial script load — without this hook, SPA
 * navigations are invisible to Meta, TikTok, Snap, and Bing UET,
 * costing ~80% of audience-building data on multi-page sessions.
 *
 * Behaviour:
 *   - GA4   — handled natively by gtag('config', GA_ID) when "Page
 *             changes based on browser history events" is on (default
 *             for new GA4 properties), so we DO NOT fire here.
 *   - Meta  — manual fbq('track', 'PageView')
 *   - Snap  — manual snaptr('track', 'PAGE_VIEW')
 *   - TikTok— manual ttq.page()
 *   - Bing  — manual uetq.push('pageLoad') (paired with the
 *             enableAutoSpaTracking flag being OFF in bing-uet.tsx)
 *   - GTM   — pushes a `virtualPageView` dataLayer event so users
 *             can wire any custom GTM tags via a Custom Event
 *             trigger if their tag templates do not auto-track.
 *
 * The first render is skipped because the pixel scripts themselves
 * fire PageView on initial load (e.g. `fbq('track', 'PageView')`
 * is in `meta-pixel.tsx`'s inline body). Re-firing here would
 * double-count the landing pageview.
 *
 * Pixel functions are called via optional chaining because the
 * scripts may not have loaded yet (slow connection, ad blocker,
 * consent denied) — in which case the pixel is a no-op for that
 * navigation, exactly as the standalone helper functions are.
 */

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

// Pixel globals are declared in their respective component files
// (tiktok-pixel.tsx, snapchat-pixel.tsx, bing-uet.tsx, meta-pixel.tsx,
// google-tag-manager.tsx). We deliberately do NOT redeclare them here
// to avoid conflicting `declare global` augmentations across modules.
// Access goes through a narrow local type via an `unknown` cast at
// the call site so this hook stays decoupled from those modules.
type PixelWindow = {
  fbq?: (...args: unknown[]) => void
  snaptr?: (...args: unknown[]) => void
  ttq?: { page?: () => void } & Record<string, unknown>
  uetq?: { push?: (...args: unknown[]) => void } & ArrayLike<unknown>
  dataLayer?: Record<string, unknown>[]
}

export function usePixelRouteTracking(): void {
  const pathname = usePathname()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (typeof globalThis.document === "undefined") return
    const w = globalThis as unknown as PixelWindow

    // Meta Pixel
    if (typeof w.fbq === "function") {
      w.fbq("track", "PageView")
    }

    // Snapchat Pixel
    if (typeof w.snaptr === "function") {
      w.snaptr("track", "PAGE_VIEW")
    }

    // TikTok Pixel — `.page()` is added by ttq.load(). Before that,
    // ttq is a stub array that does NOT have .page, so guard on the
    // method itself rather than mere object existence.
    if (w.ttq && typeof w.ttq.page === "function") {
      w.ttq.page()
    }

    // Bing UET — after init, uetq is a UET instance (object with .push).
    // Before init, it's still an array (also has .push, queued).
    // Either way push("pageLoad") works.
    if (w.uetq && typeof w.uetq.push === "function") {
      w.uetq.push("pageLoad")
    }

    // GTM dataLayer — for any custom tags that listen for SPA
    // navigations via a "Custom Event" trigger named virtualPageView.
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({
        event: "virtualPageView",
        page_path: pathname,
      })
    }
  }, [pathname])
}
