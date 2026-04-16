"use client"

import { useUTMParams } from "@/lib/hooks/use-utm-params"

/**
 * Client component that captures UTM parameters on mount.
 * Place this in the root layout to track attribution across sessions.
 */
export function UTMTracker() {
  useUTMParams()
  return null
}
