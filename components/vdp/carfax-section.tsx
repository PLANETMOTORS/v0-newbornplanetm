"use client"

/**
 * VDP Carfax section — driven by real per-VIN data from the Badging API.
 *
 * What it renders
 * ---------------
 *  - Loading skeleton on first paint
 *  - "View report" link (tokenized VhrReportUrl from the API)
 *  - Each badge image returned by Carfax (AccidentFree, LowKilometer,
 *    OneOwner, CPO, …) — never hardcoded
 *  - Falls back gracefully when Carfax is disabled or no report exists
 *
 * Why this kills the OMVIC truth-in-advertising risk
 * ---------------------------------------------------
 * Pre-launch the VDP hardcoded "No accidents — Reported by Carfax" for
 * every vehicle. With real Carfax data we can only say "no reported
 * accidents" if Carfax actually issued the AccidentFree badge for the
 * specific VIN; otherwise we render a neutral "view report" CTA.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"
import {
  hasAccidentFreeBadge,
  hasLowKilometerBadge,
  hasOneOwnerBadge,
} from "@/lib/carfax/adapters"
import type { CarfaxBadgeSummary } from "@/lib/carfax/schemas"

type FetchState =
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

interface CarfaxSectionProps {
  vin: string | null
  /** "headline" = the highlights row, "panel" = the standalone link card. */
  variant?: "headline" | "panel"
  className?: string
}

const COMPACT_LINK_BUTTON_CLASSES =
  "text-primary p-0 h-auto"
const PANEL_LINK_BUTTON_CLASSES = "text-primary"

export function CarfaxSection({ vin, variant = "panel", className }: CarfaxSectionProps) {
  const [state, setState] = useState<FetchState>({ status: "loading" })

  useEffect(() => {
    if (!vin) {
      setState({ status: "disabled" })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/v1/vehicles/${encodeURIComponent(vin)}/carfax`, {
          method: "GET",
          headers: { accept: "application/json" },
        })
        if (cancelled) return
        if (!res.ok) {
          setState({ status: "error" })
          return
        }
        const data = (await res.json()) as ApiResponse
        if (!data.enabled) {
          setState({ status: "disabled" })
          return
        }
        if (!data.summary || !data.summary.hasReport) {
          setState({ status: "no-report", summary: data.summary })
          return
        }
        setState({
          status: "ready",
          summary: data.summary,
          stale: data.source === "stale-fallback",
        })
      } catch {
        if (!cancelled) setState({ status: "error" })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vin])

  if (state.status === "loading") {
    return (
      <div className={className} data-testid="carfax-loading">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    )
  }

  if (state.status === "disabled" || state.status === "error") {
    // No-op when integration is off or transiently failing — never block VDP.
    return null
  }

  if (state.status === "no-report") {
    if (variant === "headline") return null
    return (
      <Card className={className} data-testid="carfax-no-report">
        <CardContent className="p-4 flex items-center justify-between">
          <Badge variant="outline" className="border-red-500 text-red-600 text-base px-3 py-1">
            CARFAX
          </Badge>
          <span className="text-xs text-muted-foreground">
            History report pending
          </span>
        </CardContent>
      </Card>
    )
  }

  const { summary, stale } = state
  const reportUrl = summary.vhrReportUrl

  // ── Headline variant: factual, per-VIN claims only ────────────────────
  if (variant === "headline") {
    const claims: string[] = []
    if (hasAccidentFreeBadge(summary)) claims.push("No reported accidents")
    if (hasOneOwnerBadge(summary)) claims.push("One owner")
    if (hasLowKilometerBadge(summary)) claims.push("Low kilometres")
    if (claims.length === 0) return null
    return (
      <Card className={className} data-testid="carfax-headline">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-red-500 text-red-600 text-xs">
            CARFAX
          </Badge>
          {claims.map((c) => (
            <span key={c} className="text-sm font-medium">
              ✓ {c}
            </span>
          ))}
        </CardContent>
      </Card>
    )
  }

  // ── Panel variant: badge strip + view-report CTA ──────────────────────
  return (
    <Card className={className} data-testid="carfax-panel">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge variant="outline" className="border-red-500 text-red-600 text-base px-3 py-1">
            CARFAX
          </Badge>
          {reportUrl && (
            <Button variant="link" className={PANEL_LINK_BUTTON_CLASSES} asChild>
              <Link href={reportUrl} target="_blank" rel="noopener noreferrer">
                View report <ExternalLink className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>

        {summary.badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {summary.badges.map((b) => (
              <Image
                key={b.name}
                src={b.imageUrl}
                alt={b.name}
                width={120}
                height={36}
                className="h-9 w-auto"
                unoptimized
              />
            ))}
          </div>
        )}

        {stale && (
          <p className="text-xs text-muted-foreground">
            Showing the most recent Carfax data — refresh in progress.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact button-style link for inline use (e.g. inside an existing
 * inspection-card row that already has its own border + label).
 */
export function CarfaxInlineLink({ vin }: { vin: string | null }) {
  const [state, setState] = useState<FetchState>({ status: "loading" })

  useEffect(() => {
    if (!vin) {
      setState({ status: "disabled" })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/v1/vehicles/${encodeURIComponent(vin)}/carfax`, {
          method: "GET",
          headers: { accept: "application/json" },
        })
        if (cancelled) return
        if (!res.ok) {
          setState({ status: "error" })
          return
        }
        const data = (await res.json()) as ApiResponse
        if (!data.enabled) {
          setState({ status: "disabled" })
          return
        }
        if (!data.summary || !data.summary.hasReport) {
          setState({ status: "no-report", summary: data.summary })
          return
        }
        setState({
          status: "ready",
          summary: data.summary,
          stale: data.source === "stale-fallback",
        })
      } catch {
        if (!cancelled) setState({ status: "error" })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vin])

  if (state.status !== "ready" || !state.summary.vhrReportUrl) return null

  return (
    <Button variant="link" className={COMPACT_LINK_BUTTON_CLASSES} asChild>
      <Link href={state.summary.vhrReportUrl} target="_blank" rel="noopener noreferrer">
        View report <ExternalLink className="w-3 h-3 ml-1" />
      </Link>
    </Button>
  )
}
