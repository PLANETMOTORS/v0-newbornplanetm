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

export function CarfaxCardBadges({ vin }: CarfaxCardBadgesProps) {
  const state = useCarfaxSummary(vin)

  if (state.status === "loading") {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-bold text-[#e01f26]">CARFAX</span>
        <span>Loading…</span>
      </div>
    )
  }

  if (state.status !== "ready") {
    return (
      <a
        href={`https://www.carfax.ca/vehicle/${vin}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => {
          e.preventDefault()
          window.open(
            `https://www.carfax.ca/vehicle/${vin}`,
            "_blank",
            "noopener,noreferrer",
          )
        }}
      >
        <span className="font-bold text-[#e01f26]">CARFAX</span>
        <span>Report Available</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    )
  }

  const { summary } = state
  const claims: string[] = []
  if (hasAccidentFreeBadge(summary)) claims.push("No Accidents")
  if (hasOneOwnerBadge(summary)) claims.push("One Owner")
  if (hasLowKilometerBadge(summary)) claims.push("Low KM")

  return (
    <div className="mt-3 space-y-1">
      {claims.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {claims.map((c) => (
            <span
              key={c}
              className="flex items-center gap-1 text-xs font-medium text-green-700"
            >
              <CheckCircle className="w-3 h-3" />
              {c}
            </span>
          ))}
        </div>
      )}
      {summary.vhrReportUrl && (
        <a
          href={summary.vhrReportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => {
            e.preventDefault()
            window.open(
              summary.vhrReportUrl!,
              "_blank",
              "noopener,noreferrer",
            )
          }}
        >
          <span className="font-bold text-[#e01f26]">CARFAX</span>
          <span>View Report</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
