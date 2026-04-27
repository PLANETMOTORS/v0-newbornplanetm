"use client"

import { useEffect } from "react"

export type UTMParams = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  /** ISO timestamp of when these params were first captured */
  captured_at?: string
}

const STORAGE_KEY = "pm_utm_params"
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const

/**
 * Captures UTM parameters from the URL on first visit and persists them
 * in sessionStorage for attribution throughout the purchase funnel.
 * 
 * Usage: Call this hook in your root layout or app component.
 * 
 * @example
 * ```tsx
 * export default function RootLayout() {
 *   useUTMParams() // Captures UTMs on mount
 *   return <html>...</html>
 * }
 * ```
 */
export function useUTMParams() {
  useEffect(() => {
    if (globalThis.window === undefined) return

    // Only capture on first page load (before any navigation)
    const existingParams = sessionStorage.getItem(STORAGE_KEY)
    if (existingParams) return

    const params = new URLSearchParams(globalThis.window.location.search)
    const utmData: UTMParams = {}
    let hasUTM = false

    for (const key of UTM_KEYS) {
      const value = params.get(key)
      if (value) {
        utmData[key] = value
        hasUTM = true
      }
    }

    if (hasUTM) {
      utmData.captured_at = new Date().toISOString()
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utmData))
    }
  }, [])
}

/**
 * Retrieves the captured UTM parameters from sessionStorage.
 * Returns null if no UTM params have been captured.
 */
export function getUTMParams(): UTMParams | null {
  if (globalThis.window === undefined) return null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UTMParams
  } catch {
    return null
  }
}

/**
 * Clears captured UTM parameters (useful for testing or manual reset).
 */
export function clearUTMParams(): void {
  if (globalThis.window === undefined) return
  sessionStorage.removeItem(STORAGE_KEY)
}
