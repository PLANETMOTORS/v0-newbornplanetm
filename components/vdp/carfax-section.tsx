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
import Link from "next/link"
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

  /* ── Headline variant — text claims for highlights row ─────────── */
  if (variant === "headline") {
    const claims: string[] = []
    if (hasAccidentFreeBadge(summary)) claims.push("No reported accidents")
    if (hasOneOwnerBadge(summary)) claims.push("One owner")
    if (hasLowKilometerBadge(summary)) claims.push("Low kilometres")
    if (claims.length === 0) return null
    return (
      <Card className={className} data-testid="carfax-headline">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-brand-red text-brand-red text-xs">
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

  return (
    <Card className={className} data-testid="carfax-panel">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Combined badge SVG — responsive, rendered server-side by CARFAX.
            This is the official BadgesImageUrl from Badging API v3.
            Per CARFAX logo guidelines: min 15px height, clear space around. */}
        {summary.badgesImageUrl && !imgError ? (
          <a
            href={reportUrl ?? `https://www.carfax.ca/vehicle/${summary.vin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            onClick={(e) => {
              e.preventDefault()
              window.open(
                reportUrl ?? `https://www.carfax.ca/vehicle/${summary.vin}`,
                "_blank",
                "noopener,noreferrer",
              )
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={summary.badgesImageUrl}
              alt={altText}
              className="w-full max-w-md h-auto"
              onError={() => setImgError(true)}
            />
          </a>
        ) : (
          /* Fallback: CARFAX badge + text claims when SVG fails */
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-brand-red text-brand-red text-base px-3 py-1">
              CARFAX
            </Badge>
            {claims.map((c) => (
              <span key={c} className="text-sm font-medium">
                ✓ {c}
              </span>
            ))}
          </div>
        )}

        {/* View Report CTA — tokenized deep link from CARFAX */}
        {reportUrl && (
          <Button variant="outline" size="sm" className="w-fit border-brand-red text-brand-red hover:bg-red-50" asChild>
            <Link href={reportUrl} target="_blank" rel="noopener noreferrer">
              View CARFAX Report <ExternalLink className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        )}

        {stale && (
          <p className="text-xs text-muted-foreground">
            Showing the most recent CARFAX data — refresh in progress.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
