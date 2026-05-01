"use client"

/**
 * useCarfaxSummary
 * ----------------
 * Fetches the Carfax Canada Badging API summary for a single VIN via the
 * server route at /api/v1/carfax/[vin]. Returns a discriminated union
 * describing the loading state machine so consumers render only the
 * states they care about.
 *
 * The hook:
 *  - Aborts in-flight requests on `vin` change or unmount (AbortController;
 *    no orphaned setState warnings).
 *  - Treats network errors and non-2xx as "error" — never crashes the
 *    surrounding tree.
 *  - Maps the server contract { enabled, source, summary } to a
 *    UI-shaped FetchState that is easy to switch on.
 *
 * It deliberately does not memo/cache responses on the client: the
 * server already serves a 24h Supabase cache, and the route is
 * rate-limited per IP. Repeat VDP opens within 24h hit the cache row.
 */

import { useEffect, useState } from "react"
import type { CarfaxBadgeSummary } from "@/lib/carfax/schemas"

export type CarfaxFetchState =
  | { status: "loading" }
  | { status: "disabled" }
  | { status: "no-report"; summary: CarfaxBadgeSummary | null }
  | { status: "ready"; summary: CarfaxBadgeSummary; stale: boolean }
  | { status: "error" }

type ApiResponse =
  | { enabled: false; vin: string; summary: null; message: string }
  | {
      enabled: true
      vin: string
      source: "cache" | "live" | "stale-fallback" | "error"
      summary: CarfaxBadgeSummary | null
    }

function responseToState(data: ApiResponse): CarfaxFetchState {
  if (!data.enabled) return { status: "disabled" }
  if (!data.summary?.hasReport) {
    return { status: "no-report", summary: data.summary }
  }
  return {
    status: "ready",
    summary: data.summary,
    stale: data.source === "stale-fallback",
  }
}

export function useCarfaxSummary(vin: string | null): CarfaxFetchState {
  const [state, setState] = useState<CarfaxFetchState>({ status: "loading" })

  useEffect(() => {
    if (!vin) {
      setState({ status: "disabled" })
      return
    }
    const controller = new AbortController()
    setState({ status: "loading" })
    ;(async () => {
      try {
        const res = await fetch(`/api/v1/carfax/${encodeURIComponent(vin)}`, {
          method: "GET",
          headers: { accept: "application/json" },
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (!res.ok) {
          setState({ status: "error" })
          return
        }
        const data = (await res.json()) as ApiResponse
        if (controller.signal.aborted) return
        setState(responseToState(data))
      } catch (err) {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === "AbortError") return
        setState({ status: "error" })
      }
    })()
    return () => {
      controller.abort()
    }
  }, [vin])

  return state
}
