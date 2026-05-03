"use client"

import { useState } from "react"
import { useCarfaxSummary } from "@/hooks/use-carfax-summary"
import {
  hasAccidentFreeBadge,
  hasOneOwnerBadge,
  hasLowKilometerBadge,
} from "@/lib/carfax/adapters"
import { CheckCircle, ExternalLink } from "lucide-react"
import { proxyBadgeUrl } from "@/lib/carfax/proxy-url"

interface CarfaxCardBadgesProps {
  vin: string
}

/**
 * Renders the combined Carfax badge SVG (BadgesImageUrl from Badging API v3)
 * per the PDF spec. Falls back to text claims if image fails to load.
 */
export function CarfaxCardBadges({ vin }: CarfaxCardBadgesProps) {
  const state = useCarfaxSummary(vin)
  const [imgError, setImgError] = useState(false)

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
  const reportUrl = summary.vhrReportUrl ?? `https://www.carfax.ca/vehicle/${vin}`

  const claims: string[] = []
  if (hasAccidentFreeBadge(summary)) claims.push("No Accidents")
  if (hasOneOwnerBadge(summary)) claims.push("One Owner")
  if (hasLowKilometerBadge(summary)) claims.push("Low KM")

  return (
    <div className="mt-3 space-y-1.5">
      {/* Combined badge SVG from Carfax Badging API (per PDF spec) */}
      {summary.badgesImageUrl && !imgError ? (
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          onClick={(e) => {
            e.preventDefault()
            window.open(reportUrl, "_blank", "noopener,noreferrer")
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxyBadgeUrl(summary.badgesImageUrl)}
            alt={claims.length > 0 ? `CARFAX: ${claims.join(", ")}` : "CARFAX Canada"}
            className="h-8 w-auto"
            onError={() => setImgError(true)}
          />
        </a>
      ) : claims.length > 0 ? (
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
      ) : null}

      {/* Report link */}
      <a
        href={reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => {
          e.preventDefault()
          window.open(reportUrl, "_blank", "noopener,noreferrer")
        }}
      >
        <span className="font-bold text-[#e01f26]">CARFAX</span>
        <span>View Report</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}
