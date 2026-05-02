"use client"

/**
 * VDP Carfax section — driven by real per-VIN data from the Badging API.
 *
 * Variants (industry-standard placement per Clutch / AutoTrader pattern)
 * ----------------------------------------------------------------------
 *  - "headline" — claims strip for the Highlights row with badge images.
 *    Only renders factual per-VIN claims (AccidentFree, OneOwner, etc.).
 *  - "panel"    — full card with Carfax logo, badge images, per-VIN claims,
 *    and prominent "View CARFAX Report" CTA. Goes in the History section.
 *  - <CarfaxInlineLink/> — compact sidebar link with Carfax branding.
 *  - <CarfaxOverviewBadge/> — clickable HISTORY pill for the Overview row
 *    that links to the VHR report when available.
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

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react"
import {
  badgeAccessibleLabel,
  hasAccidentFreeBadge,
  hasLowKilometerBadge,
  hasOneOwnerBadge,
} from "@/lib/carfax/adapters"
import { useCarfaxSummary } from "@/hooks/use-carfax-summary"
import type { CarfaxBadgeSummary } from "@/lib/carfax/schemas"

interface CarfaxSectionProps {
  readonly vin: string | null
  readonly variant?: "headline" | "panel"
  readonly className?: string
}

/**
 * Build the list of per-VIN claims that Carfax actually issued.
 * Never hardcode "No accidents" — only show what the API confirms.
 */
function buildClaims(summary: CarfaxBadgeSummary): string[] {
  const claims: string[] = []
  if (hasAccidentFreeBadge(summary)) claims.push("No reported accidents")
  if (hasOneOwnerBadge(summary)) claims.push("One owner")
  if (hasLowKilometerBadge(summary)) claims.push("Low kilometres")
  return claims
}

export function CarfaxSection({
  vin,
  variant = "panel",
  className,
}: Readonly<CarfaxSectionProps>) {
  const state = useCarfaxSummary(vin)

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
  const claims = buildClaims(summary)

  /* ── Headline variant: Highlights row ─────────────────────────── */
  if (variant === "headline") {
    if (claims.length === 0 && summary.badges.length === 0) return null
    return (
      <Card className={className} data-testid="carfax-headline">
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          {/* Carfax logo badge linking to report */}
          {summary.vhrReportUrl ? (
            <a
              href={summary.vhrReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Badge variant="outline" className="border-red-600 text-red-600 text-xs hover:bg-red-50 transition-colors cursor-pointer">
                CARFAX
              </Badge>
            </a>
          ) : (
            <Badge variant="outline" className="border-red-600 text-red-600 text-xs">
              CARFAX
            </Badge>
          )}

          {/* Per-VIN badge images */}
          {summary.badges.length > 0 && (
            <div className="flex items-center gap-2">
              {summary.badges.map((b) => (
                <Image
                  key={b.name}
                  src={b.imageUrl}
                  alt={badgeAccessibleLabel(b.name)}
                  width={80}
                  height={24}
                  className="h-6 w-auto"
                  unoptimized
                />
              ))}
            </div>
          )}

          {/* Text claims */}
          {claims.map((c) => (
            <span key={c} className="text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
              {c}
            </span>
          ))}
        </CardContent>
      </Card>
    )
  }

  /* ── Panel variant: History & Reports section ─────────────────── */
  return (
    <Card className={className} data-testid="carfax-panel">
      <CardContent className="p-5 flex flex-col gap-4">
        {/* Header: Carfax branding + View Report CTA */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-base">Vehicle History</h3>
              <p className="text-xs text-muted-foreground">Verified by CARFAX Canada</p>
            </div>
          </div>
          {summary.vhrReportUrl && (
            <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700 text-white" asChild>
              <a href={summary.vhrReportUrl} target="_blank" rel="noopener noreferrer">
                View CARFAX Report
                <ExternalLink className="w-4 h-4 ml-1.5" />
              </a>
            </Button>
          )}
        </div>

        {/* Badge images row */}
        {summary.badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 py-2 px-3 bg-muted/30 rounded-lg">
            {summary.badges.map((b) => (
              <Image
                key={b.name}
                src={b.imageUrl}
                alt={badgeAccessibleLabel(b.name)}
                width={120}
                height={36}
                className="h-9 w-auto"
                unoptimized
              />
            ))}
          </div>
        )}

        {/* Per-VIN claims checklist */}
        {claims.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {claims.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="font-medium">{c}</span>
              </div>
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
 * Compact sidebar link: Carfax badge + "View report" button.
 * Industry standard: always visible near the purchase CTA.
 */
export function CarfaxInlineLink({ vin }: Readonly<{ vin: string | null }>) {
  const state = useCarfaxSummary(vin)
  if (state.status !== "ready" || !state.summary.vhrReportUrl) return null

  const { summary } = state
  const reportUrl = summary.vhrReportUrl
  if (!reportUrl) return null
  const claims = buildClaims(summary)

  return (
    <div className="flex flex-col gap-2" data-testid="carfax-inline">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-red-600 text-red-600 text-xs">
            CARFAX
          </Badge>
          {claims.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {claims[0]}
            </span>
          )}
        </div>
        <Button variant="link" className="text-primary p-0 h-auto text-xs" asChild>
          <a href={reportUrl} target="_blank" rel="noopener noreferrer">
            View report <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
      </div>
      {/* Show first badge image in sidebar for visual trust */}
      {summary.badges.length > 0 && (
        <div className="flex items-center gap-2">
          {summary.badges.slice(0, 2).map((b) => (
            <Image
              key={b.name}
              src={b.imageUrl}
              alt={badgeAccessibleLabel(b.name)}
              width={80}
              height={24}
              className="h-5 w-auto"
              unoptimized
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Overview row HISTORY pill — clickable when Carfax data is available.
 * Replaces the static Badge with one that links to the VHR report.
 */
export function CarfaxOverviewBadge({ vin }: Readonly<{ vin: string | null }>) {
  const state = useCarfaxSummary(vin)

  if (state.status === "ready" && state.summary.vhrReportUrl) {
    return (
      <a
        href={state.summary.vhrReportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        <Badge
          variant="outline"
          className="text-xs border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
        >
          CARFAX ✓
        </Badge>
      </a>
    )
  }

  if (state.status === "loading") {
    return <Skeleton className="h-5 w-14 rounded-full" />
  }

  return (
    <Badge variant="outline" className="text-xs border-red-500 text-red-600">
      CARFAX
    </Badge>
  )
}
