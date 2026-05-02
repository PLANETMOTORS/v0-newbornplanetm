"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { captureAttributionFromUrl } from "@/lib/tracking/attribution"

/**
 * Captures UTM params, click IDs (gclid, fbclid, ttclid, msclkid), and
 * organic/referral/direct attribution on every route change.
 *
 * Replaces the old UTMTracker which only captured UTM params.
 * Stores first-touch + last-touch in sessionStorage.
 */
export function AttributionTracker(): null {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    captureAttributionFromUrl({ persist: true, storage: 'sessionStorage' })
  }, [pathname, searchParams])

  return null
}
