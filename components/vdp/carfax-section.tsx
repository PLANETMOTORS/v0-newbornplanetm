"use client"

/**
 * VDP Carfax section — driven by real per-VIN data from the Badging API.
 *
 * Variants
 * --------
 *  - "headline" — small claims strip for the highlights row, only renders
 *    factual per-VIN claims (AccidentFree → "No reported accidents", etc.).
 *  - "panel"    — full card with badge images + tokenized "View report" CTA.
 *  - <CarfaxInlineLink/> — compact link-only variant.
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

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"
import {
  badgeAccessibleLabel,
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

const COMPACT_LINK_BUTTON_CLASSES = "text-primary p-0 h-auto"
const PANEL_LINK_BUTTON_CLASSES = "text-primary"

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

  return (
    <Card className={className} data-testid="carfax-panel">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge variant="outline" className="border-brand-red text-brand-red text-base px-3 py-1">
            CARFAX
          </Badge>
          {summary.vhrReportUrl && (
            <Button variant="link" className={PANEL_LINK_BUTTON_CLASSES} asChild>
              <Link href={summary.vhrReportUrl} target="_blank" rel="noopener noreferrer">
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
                alt={badgeAccessibleLabel(b.name)}
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

export function CarfaxInlineLink({ vin }: Readonly<{ vin: string | null }>) {
  const state = useCarfaxSummary(vin)
  if (state.status !== "ready" || !state.summary.vhrReportUrl) return null

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <Badge variant="outline" className="border-red-500 text-red-600">CARFAX</Badge>
      <Button variant="link" className={COMPACT_LINK_BUTTON_CLASSES} asChild>
        <Link href={state.summary.vhrReportUrl} target="_blank" rel="noopener noreferrer">
          View report <ExternalLink className="w-3 h-3 ml-1" />
        </Link>
      </Button>
    </div>
  )
}
