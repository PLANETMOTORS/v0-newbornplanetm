"use client"

import { useCarfaxSummary } from "@/hooks/use-carfax-summary"
import {
  hasAccidentFreeBadge,
  hasOneOwnerBadge,
  hasLowKilometerBadge,
} from "@/lib/carfax/adapters"
import { CheckCircle, ExternalLink } from "lucide-react"

interface CarfaxCardBadgesProps {
  vin: string
}

/**
 * Compact, single-line CARFAX badge row for inventory listing cards.
 * Always renders at a consistent height regardless of CARFAX status.
 * The full badge SVG strip is reserved for the VDP Power Bar only.
 */
export function CarfaxCardBadges({ vin }: CarfaxCardBadgesProps) {
  const state = useCarfaxSummary(vin)

  /* ── Loading ── */
  if (state.status === "loading") {
    return (
      <div className="mt-3 h-5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-bold text-[#e01f26]">CARFAX</span>
        <span className="animate-pulse">Loading…</span>
      </div>
    )
  }

  /* ── No report available ── */
  if (state.status !== "ready") {
    return (
      <a
        href={`https://www.carfax.ca/vehicle/${vin}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 h-5 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-bold text-[#e01f26]">CARFAX</span>
        <span>Report Available</span>
        <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
    )
  }

  /* ── Report ready — show compact text claims ── */
  const { summary } = state
  const reportUrl = summary.vhrReportUrl ?? `https://www.carfax.ca/vehicle/${vin}`

  const claims: string[] = []
  if (hasAccidentFreeBadge(summary)) claims.push("No Accidents")
  if (hasOneOwnerBadge(summary)) claims.push("One Owner")
  if (hasLowKilometerBadge(summary)) claims.push("Low KM")

  return (
    <a
      href={reportUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <span className="font-bold text-[#e01f26] shrink-0">CARFAX</span>
      {claims.length > 0 ? (
        <span className="flex items-center gap-2 flex-wrap">
          {claims.map((c) => (
            <span key={c} className="inline-flex items-center gap-0.5 font-medium text-green-700">
              <CheckCircle className="w-3 h-3 shrink-0" />
              {c}
            </span>
          ))}
        </span>
      ) : (
        <span>View Report</span>
      )}
      <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
    </a>
  )
}
