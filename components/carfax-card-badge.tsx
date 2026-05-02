"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"
import { useCarfaxSummary } from "@/hooks/use-carfax-summary"
import { badgeAccessibleLabel, hasAccidentFreeBadge, hasOneOwnerBadge } from "@/lib/carfax/adapters"

interface CarfaxCardBadgeProps {
  readonly vin: string
}

/**
 * Compact Carfax badge for inventory cards.
 * Fetches real badge data per-VIN and displays badge images + report link.
 * Falls back to "Report Available" text while loading or if no data.
 */
export function CarfaxCardBadge({ vin }: CarfaxCardBadgeProps) {
  const state = useCarfaxSummary(vin)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.open(e.currentTarget.href, "_blank", "noopener,noreferrer")
  }

  if (state.status === "loading") {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-bold text-[#e01f26]">CARFAX</span>
        <span>Report Available</span>
        <ExternalLink className="w-3 h-3" />
      </div>
    )
  }

  if (state.status === "disabled" || state.status === "error") {
    return (
      <a
        href={`https://www.carfax.ca/vehicle/${vin}`}
        rel="noopener noreferrer"
        onClick={handleClick}
        className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <span className="font-bold text-[#e01f26]">CARFAX</span>
        <span>Report Available</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    )
  }

  if (state.status === "no-report") {
    return null
  }

  const { summary } = state
  const reportUrl = summary.vhrReportUrl
  const claims: string[] = []
  if (hasAccidentFreeBadge(summary)) claims.push("No Accidents")
  if (hasOneOwnerBadge(summary)) claims.push("One Owner")

  return (
    <a
      href={reportUrl || `https://www.carfax.ca/vehicle/${vin}`}
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      <span className="font-bold text-[#e01f26]">CARFAX</span>
      {summary.badges.length > 0 ? (
        <span className="flex items-center gap-1.5">
          {summary.badges.slice(0, 2).map((b) => (
            <Image
              key={b.name}
              src={b.imageUrl}
              alt={badgeAccessibleLabel(b.name)}
              width={60}
              height={18}
              className="h-4 w-auto"
              unoptimized
            />
          ))}
        </span>
      ) : claims.length > 0 ? (
        <span className="text-green-700 font-medium">{claims.join(" · ")}</span>
      ) : (
        <span>Report Available</span>
      )}
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  )
}
