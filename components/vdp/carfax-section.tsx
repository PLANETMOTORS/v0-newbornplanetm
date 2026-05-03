"use client"

/**
 * VDP Carfax section — driven by real per-VIN data from the Badging API v3.
 *
 * Variants
 * --------
 *  - "headline" — small claims strip for the highlights row, only renders
 *    factual per-VIN claims (AccidentFree → "No reported accidents", etc.).
 *  - "panel"    — Option A (clean badge strip): combined responsive SVG
 *    from `BadgesImageUrl` + branded "View Report" CTA. This is the
 *    CARFAX-recommended display method used by AutoTrader.ca, Clutch,
 *    Canada Drives and other Tier-1 Canadian dealers.
 *
 * Why this exists
 * ---------------
 * The pre-launch VDP hardcoded "No accidents — Reported by Carfax" on
 * EVERY vehicle. With real Carfax data we can only make that claim when
 * Carfax actually issued the AccidentFree badge for the specific VIN —
 * an OMVIC truth-in-advertising requirement.
 *
 * State management lives entirely in the useCarfaxSummary hook so this
 * file contains ZERO data-fetching logic.
 */

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  hasAccidentFreeBadge,
  hasLowKilometerBadge,
  hasOneOwnerBadge,
} from "@/lib/carfax/adapters"
import { useCarfaxSummary } from "@/hooks/use-carfax-summary"

interface CarfaxSectionProps {
  vin: string | null
  variant?: "headline" | "panel"
  className?: string
}

export function CarfaxSection({
  vin,
  variant = "panel",
  className,
}: Readonly<CarfaxSectionProps>) {
  const state = useCarfaxSummary(vin)
  const [imgError, setImgError] = useState(false)

  if (state.status === "loading") {
    return (
      <div className={className} data-testid="carfax-loading">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    )
  }

  if (state.status === "disabled" || state.status === "error") {
    return null
  }

  if (state.status === "no-report") {
    if (variant === "headline") return null
    return (
      <Card className={className} data-testid="carfax-no-report">
        <CardContent className="p-4 flex items-center justify-between">
          <Badge variant="outline" className="border-brand-red text-brand-red text-base px-3 py-1">
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

  /* ── Headline variant — clean green checkmarks, no red box ────── */
  if (variant === "headline") {
    const claims: string[] = []
    if (hasAccidentFreeBadge(summary)) claims.push("No reported accidents")
    if (hasOneOwnerBadge(summary)) claims.push("One owner")
    if (hasLowKilometerBadge(summary)) claims.push("Low kilometres")
    if (claims.length === 0) return null
    return (
      <div className={className} data-testid="carfax-headline">
        <div className="flex flex-col justify-center gap-1">
          {claims.map((c) => (
            <p key={c} className="text-xs font-bold text-green-600">
              ✓ {c}
            </p>
          ))}
        </div>
      </div>
    )
  }

  /* ── Panel variant — Option A: clean badge strip (industry standard) */
  const reportUrl = summary.vhrReportUrl

  // Build accessible alt text from actual badge claims
  const claims: string[] = []
  if (hasAccidentFreeBadge(summary)) claims.push("No Accidents")
  if (hasOneOwnerBadge(summary)) claims.push("One Owner")
  if (hasLowKilometerBadge(summary)) claims.push("Low KM")
  const altText = claims.length > 0
    ? `CARFAX Canada: ${claims.join(", ")}`
    : "CARFAX Canada Vehicle History"

  /* ── Panel variant — badge strip only (CTA lives in the Power Bar) ─ */
  const targetUrl = reportUrl ?? `https://www.carfax.ca/vehicle/${summary.vin}`

  return (
    <div className={className} data-testid="carfax-panel">
      {/* Official badge SVG from Badging API v3 */}
      {summary.badgesImageUrl && !imgError ? (
        <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={summary.badgesImageUrl}
            alt={altText}
            width="187"
            height="30"
            className="h-[28px] w-auto shrink-0"
            onError={() => setImgError(true)}
          />
        </a>
      ) : (
        /* Fallback: text claims when SVG fails */
        <div className="flex flex-col gap-0.5">
          {claims.map((c) => (
            <span key={c} className="text-xs font-bold text-green-600">
              ✓ {c}
            </span>
          ))}
        </div>
      )}

      {stale && (
        <p className="text-[10px] text-muted-foreground mt-1">
          Refreshing CARFAX data…
        </p>
      )}
    </div>
  )
}
