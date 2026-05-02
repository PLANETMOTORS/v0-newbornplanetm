"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { trackPageView } from "@/lib/tracking/events"
import { getPageType } from "@/lib/tracking/page-type"

/**
 * Fires a `page_view` DataLayer event on every Next.js route change.
 *
 * Replaces the old PixelRouteTracker which directly called fbq/snaptr/ttq/uetq.
 * With V1 architecture, all page views go through the DataLayer and GTM
 * distributes them to the correct tags based on consent state.
 *
 * The first render is skipped because GTM fires its own page_view on initial load.
 */
export function RouteChangeTracker(): null {
  const pathname = usePathname()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (globalThis.document === undefined) return

    trackPageView({
      pathname,
      search: globalThis.window?.location.search,
      pageType: getPageType(pathname),
      title: globalThis.document.title,
      location: globalThis.window?.location.href,
      referrer: globalThis.document.referrer || null,
    })
  }, [pathname])

  return null
}
